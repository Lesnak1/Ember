import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { BrokerService } from "./broker.service";
import { JwtAuthGuard, AuthenticatedRequest } from "../auth/jwt-auth.guard";

@Controller("broker")
@UseGuards(JwtAuthGuard)
export class BrokerController {
  constructor(private brokerService: BrokerService) {}

  @Post("approve")
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
  async claimRewards(
    @Req() req: AuthenticatedRequest,
    @Body("collateralId") collateralId: number,
    @Body("spot") spot: boolean,
    @Body("nonce") nonce: number,
    @Body("signature") signature: string
  ) {
    const userId = req.user.sub;
    return this.brokerService.claimRewards(
      userId,
      collateralId,
      spot,
      nonce,
      signature
    );
  }
}
