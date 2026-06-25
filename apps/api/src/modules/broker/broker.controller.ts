import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { BrokerService } from "./broker.service";
import { JwtAuthGuard, AuthenticatedRequest } from "../auth/jwt-auth.guard";

@Controller("broker")
export class BrokerController {
  constructor(private brokerService: BrokerService) {}

  @Get("config")
  async getConfig() {
    return this.brokerService.getConfig();
  }

  @Post("approve")
  @UseGuards(JwtAuthGuard)
  async approveBroker(
    @Req() req: AuthenticatedRequest,
    @Body("brokerAddress") brokerAddress: string,
    @Body("maxFeeRate") maxFeeRate: string,
    @Body("nonce") nonce: number,
    @Body("signature") signature: string
  ) {
    const userId = req.user.sub;
    return this.brokerService.registerBrokerApproval(
      userId,
      brokerAddress,
      maxFeeRate,
      nonce,
      signature
    );
  }

  @Post("claim")
  @UseGuards(JwtAuthGuard)
  async claimBrokerFees(
    @Req() req: AuthenticatedRequest,
    @Body("collateralId") collateralId: number,
    @Body("spot") spot: boolean,
    @Body("nonce") nonce: number,
    @Body("signature") signature: string
  ) {
    const userId = req.user.sub;
    return this.brokerService.claimBrokerFees(
      userId,
      collateralId,
      spot,
      nonce,
      signature
    );
  }
}
