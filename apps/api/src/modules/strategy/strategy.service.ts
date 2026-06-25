import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStrategyInput, DcaConfigSchema, TwapConfigSchema, GridConfigSchema } from "@ember/types";
import { Queue } from "bullmq";
import Redis from "ioredis";

@Injectable()
export class StrategyService implements OnModuleInit {
  private strategyQueue: Queue;
  private redisConnection: Redis;

  constructor(private prisma: PrismaService) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  onModuleInit() {
    this.strategyQueue = new Queue("strategy-execution-queue", {
      connection: this.redisConnection as any,
    });
  }

  // --- Validate Strategy Configuration ---
  private validateConfig(type: string, config: any) {
    try {
      if (type === "DCA") {
        DcaConfigSchema.parse(config);
      } else if (type === "TWAP") {
        TwapConfigSchema.parse(config);
      } else if (type === "GRID") {
        GridConfigSchema.parse(config);
      } else {
        throw new Error("Unsupported strategy type for validation");
      }
    } catch (err: any) {
      throw new BadRequestException(`Invalid configuration for ${type} strategy: ${err.message}`);
    }
  }

  // --- CRUD & Scheduling ---
  async create(userId: string, input: CreateStrategyInput): Promise<any> {
    this.validateConfig(input.type, input.config);

    // Save to Database
    const strategy = await this.prisma.strategy.create({
      data: {
        userId,
        type: input.type,
        status: "ACTIVE",
        configJson: input.config,
        instrumentIds: input.instrumentIds,
        brokerFeeBps: input.brokerFeeBps,
      },
    });

    // Schedule the repeatable job
    await this.scheduleJob(strategy);

    return strategy;
  }

  async findAll(userId: string): Promise<any[]> {
    return this.prisma.strategy.findMany({
      where: { userId },
      include: {
        runs: {
          orderBy: { scheduledAt: "desc" },
          take: 5,
        },
      },
    });
  }

  async findOne(userId: string, id: string): Promise<any> {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id, userId },
      include: { runs: true },
    });
    if (!strategy) {
      throw new NotFoundException("Strategy not found");
    }
    return strategy;
  }

  async pause(userId: string, id: string): Promise<any> {
    const strategy = await this.findOne(userId, id);
    if (strategy.status !== "ACTIVE") {
      throw new BadRequestException("Only active strategies can be paused");
    }

    const updated = await this.prisma.strategy.update({
      where: { id },
      data: { status: "PAUSED" },
    });

    // Remove job from BullMQ queue
    await this.unscheduleJob(strategy);

    return updated;
  }

  async resume(userId: string, id: string): Promise<any> {
    const strategy = await this.findOne(userId, id);
    if (strategy.status !== "PAUSED") {
      throw new BadRequestException("Only paused strategies can be resumed");
    }

    const updated = await this.prisma.strategy.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    // Reschedule in BullMQ queue
    await this.scheduleJob(updated);

    return updated;
  }

  async remove(userId: string, id: string): Promise<any> {
    const strategy = await this.findOne(userId, id);
    await this.prisma.strategy.delete({ where: { id } });

    // Ensure job is unscheduled
    await this.unscheduleJob(strategy);

    return { success: true };
  }

  // --- BullMQ Scheduling Implementations ---
  private async scheduleJob(strategy: any) {
    const config = strategy.configJson as any;
    let intervalMs = 60 * 1000; // Default 1 minute fallback

    if (strategy.type === "DCA") {
      intervalMs = config.intervalMinutes * 60 * 1000;
    } else if (strategy.type === "TWAP") {
      intervalMs = config.intervalSeconds * 1000;
    } else if (strategy.type === "GRID") {
      // Grid bot handles its state by placing levels and subscribing to fills via WSS.
      // We can poll grid status every 5 minutes to verify order consistency.
      intervalMs = 5 * 60 * 1000; 
    }

    // Schedule repeatable task
    await this.strategyQueue.add(
      "run-strategy",
      { strategyId: strategy.id },
      {
        repeat: {
          every: intervalMs,
        },
        jobId: strategy.id, // Prevent duplicate jobs for the same strategy
      }
    );
  }

  private async unscheduleJob(strategy: any) {
    // BullMQ stores repeatable jobs with repeat keys. We can fetch and remove it.
    const repeatableJobs = await this.strategyQueue.getRepeatableJobs();
    const target = repeatableJobs.find((job) => job.id === strategy.id);
    if (target) {
      await this.strategyQueue.removeRepeatableByKey(target.key);
    }
  }
}
