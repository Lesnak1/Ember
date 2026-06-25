import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AgentService } from "../agent/agent.service";
import { HotstuffClient } from "@ember/hotstuff-client";
import { DcaStrategyEngine, TwapStrategyEngine, GridStrategyEngine, generateBrokerConfig } from "@ember/strategies";
import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import * as crypto from "crypto";

@Injectable()
export class ExecutionProcessor implements OnModuleInit {
  private readonly logger = new Logger(ExecutionProcessor.name);
  private worker: Worker;
  private redisConnection: Redis;

  constructor(
    private prisma: PrismaService,
    private agentService: AgentService
  ) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const redisOptions: any = {
      maxRetriesPerRequest: null,
    };
    if (redisUrl.startsWith("rediss://")) {
      redisOptions.tls = {
        rejectUnauthorized: false,
      };
    }
    this.redisConnection = new Redis(redisUrl, redisOptions);
    this.redisConnection.on("error", (err) => {
      this.logger.error(`Redis connection error in ExecutionProcessor: ${err.message}`, err.stack);
    });
  }

  onModuleInit() {
    this.worker = new Worker(
      "strategy-execution-queue",
      async (job: Job) => {
        await this.processStrategyRun(job.data.strategyId);
      },
      {
        connection: this.redisConnection as any,
        concurrency: 5, // Concurrent strategy executions
      }
    );

    this.logger.log("Execution queue worker initialized successfully.");
  }

  private async processStrategyRun(strategyId: string) {
    this.logger.log(`Processing execution run for strategy: ${strategyId}`);

    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
      include: { user: true },
    });

    if (!strategy || strategy.status !== "ACTIVE") {
      this.logger.warn(`Strategy ${strategyId} is no longer active. Skipping.`);
      return;
    }

    // Create a strategy run log
    const run = await this.prisma.strategyRun.create({
      data: {
        strategyId: strategy.id,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    try {
      // 1. Fetch Agent wallet
      const agentWallet = await this.prisma.agentWallet.findFirst({
        where: { userId: strategy.userId, status: "ACTIVE" },
      });

      if (!agentWallet) {
        throw new Error("No active agent wallet found for user");
      }

      // 2. Decrypt agent private key
      const agentPrivateKey = await this.agentService.getAgentPrivateKey(agentWallet.agentAddress);

      // 3. Initialize HotstuffClient for agent
      const env = (process.env.HOTSTUFF_ENV || "testnet") as "testnet" | "mainnet";
      const client = new HotstuffClient({
        privateKey: agentPrivateKey,
        env,
      });

      // 4. Resolve current price for asset (useful for TWAP & Grid)
      let currentPrice = "0";
      try {
        const instrumentId = strategy.instrumentIds[0];
        const ticker = await client.info("ticker", { instrumentId });
        const price = ticker?.lastPrice || ticker?.price;
        if (!price) {
          throw new Error("Price field is missing from ticker data");
        }
        currentPrice = price;
      } catch (err) {
        this.logger.error(`Failed to fetch live price for strategy ${strategyId}: ${err.message}`);
        throw err;
      }

      // 5. Generate and execute orders based on strategy type
      const brokerAddress = process.env.BROKER_ADDRESS || "0x1234567890123456789012345678901234567890";
      const brokerConfig = generateBrokerConfig(brokerAddress, strategy.brokerFeeBps);
      const ordersToPlace: any[] = [];

      if (strategy.type === "DCA") {
        const config = strategy.configJson as any;
        const cloid = "0x" + crypto.randomBytes(16).toString("hex");
        const order = DcaStrategyEngine.generateOrder(config, cloid);
        ordersToPlace.push(order);
      } 
      else if (strategy.type === "TWAP") {
        const config = strategy.configJson as any;
        
        // Track slice index using Redis or simple DB count of runs
        const sliceCount = await this.prisma.strategyRun.count({
          where: { strategyId: strategy.id, status: "SUCCESS" },
        });

        if (sliceCount >= config.sliceCount) {
          // TWAP complete, update strategy status
          await this.prisma.strategy.update({
            where: { id: strategy.id },
            data: { status: "COMPLETED" },
          });
          this.logger.log(`TWAP strategy ${strategy.id} completed execution.`);
          
          await this.prisma.strategyRun.update({
            where: { id: run.id },
            data: { status: "SUCCESS", finishedAt: new Date() },
          });
          return;
        }

        const cloid = "0x" + crypto.randomBytes(16).toString("hex");
        const order = TwapStrategyEngine.generateSliceOrder(config, currentPrice, sliceCount, cloid);
        ordersToPlace.push(order);
      } 
      else if (strategy.type === "GRID") {
        const config = strategy.configJson as any;
        const baseRand = crypto.randomBytes(14).toString("hex");
        const buyPrefix = "0x" + baseRand + "00";
        const sellPrefix = "0x" + baseRand + "11";
        
        const gridOrders = GridStrategyEngine.generateGridOrders(
          config,
          currentPrice,
          buyPrefix,
          sellPrefix
        );
        ordersToPlace.push(...gridOrders);
      }

      // 6. Submit orders to HotStuff exchange
      if (ordersToPlace.length > 0) {
        const nonce = Date.now();
        
        // Post orders
        const txResult = await client.placeOrder(
          ordersToPlace,
          brokerConfig,
          nonce + 60000,
          nonce
        );

        const txHash = txResult?.txHash || txResult?.hash;
        if (!txHash) {
          throw new Error("No transaction hash returned from HotStuff exchange");
        }

        // 7. Write ChildOrders in DB
        for (const order of ordersToPlace) {
          await this.prisma.childOrder.create({
            data: {
              strategyRunId: run.id,
              cloid: order.cloid,
              instrumentId: order.instrumentId,
              side: order.side,
              price: order.price,
              size: order.size,
              tif: order.tif,
              po: order.po,
              ro: order.ro,
              brokerFee: brokerConfig?.fee,
              status: "PLACED",
              txHash,
            },
          });

          // Write AuditLog
          await this.prisma.auditLog.create({
            data: {
              userId: strategy.userId,
              action: "PLACE_ORDER",
              payloadHash: crypto.createHash("sha256").update(JSON.stringify(order)).digest("hex"),
              signer: agentWallet.agentAddress,
            },
          });
        }
      }

      // Mark strategy run as successful
      await this.prisma.strategyRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          finishedAt: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error(`Error executing strategy run: ${error.message}`);
      
      await this.prisma.strategyRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: error.message,
          finishedAt: new Date(),
        },
      });

      // Write failure audit log
      await this.prisma.auditLog.create({
        data: {
          userId: strategy.userId,
          action: "STRATEGY_RUN_FAILED",
          payloadHash: crypto.createHash("sha256").update(error.message).digest("hex"),
          signer: strategy.user.mainAddress,
        },
      });
    }
  }
}
