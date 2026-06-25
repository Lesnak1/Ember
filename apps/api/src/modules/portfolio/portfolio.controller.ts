import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import { PortfolioService } from "./portfolio.service";
import { JwtAuthGuard, AuthenticatedRequest } from "../auth/jwt-auth.guard";

@Controller("portfolio")
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get("summary")
  async getSummary(@Req() req: AuthenticatedRequest) {
    const address = req.user.address;
    return this.portfolioService.getSummary(address);
  }

  @Get("positions")
  async getPositions(@Req() req: AuthenticatedRequest) {
    const address = req.user.address;
    return this.portfolioService.getPositions(address);
  }

  @Get("orders")
  async getOpenOrders(@Req() req: AuthenticatedRequest) {
    const address = req.user.address;
    return this.portfolioService.getOpenOrders(address);
  }

  @Get("broker-check")
  async checkBrokerFeeApproval(
    @Req() req: AuthenticatedRequest,
    @Query("brokerAddress") brokerAddress?: string
  ) {
    const address = req.user.address;
    return this.portfolioService.checkBrokerFeeApproval(address, brokerAddress);
  }
}
