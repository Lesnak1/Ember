import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { StrategyService } from "./strategy.service";
import { JwtAuthGuard, AuthenticatedRequest } from "../auth/jwt-auth.guard";
import { CreateStrategyInput, CreateStrategySchema } from "@ember/types";

@Controller("strategy")
@UseGuards(JwtAuthGuard)
export class StrategyController {
  constructor(private strategyService: StrategyService) {}

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() body: CreateStrategyInput) {
    const userId = req.user.sub;
    const validated = CreateStrategySchema.parse(body);
    return this.strategyService.create(userId, validated);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.strategyService.findAll(userId);
  }

  @Get(":id")
  async findOne(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const userId = req.user.sub;
    return this.strategyService.findOne(userId, id);
  }

  @Post(":id/pause")
  async pause(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const userId = req.user.sub;
    return this.strategyService.pause(userId, id);
  }

  @Post(":id/resume")
  async resume(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const userId = req.user.sub;
    return this.strategyService.resume(userId, id);
  }

  @Delete(":id")
  async remove(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const userId = req.user.sub;
    return this.strategyService.remove(userId, id);
  }
}
