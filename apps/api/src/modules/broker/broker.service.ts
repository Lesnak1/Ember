import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HotstuffClient } from "@ember/hotstuff-client";

@Injectable()
export class BrokerService {
  constructor(private prisma: PrismaService) {}

  private getClient(): HotstuffClient {
    const env = (process.env.HOTSTUFF_ENV || "testnet") as "testnet" | "mainnet";
    return new HotstuffClient({ env });
  }

  async registerBrokerApproval(
    userId: string,
    broker: string,
    maxFeeRate: string,
    nonce: number,
    signature: string
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    // 1. Relay to L1
    const client = this.getClient();
    const action = {
      type: "approveBrokerFee",
      data: {
        broker,
        maxFeeRate,
        nonce,
      },
    };

    try {
      await client.submitPresignedAction(action, signature, nonce);

      // 2. Save/Update locally in DB
      const approval = await this.prisma.brokerApproval.create({
        data: {
          userId,
          broker,
          maxFeeRate,
        },
      });

      return {
        success: true,
        approval,
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to relay broker approval to L1: ${err.message}`);
    }
  }

  async claimBrokerFees(
    userId: string,
    collateralId: number,
    spot: boolean,
    nonce: number,
    signature: string
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    // 1. Relay to L1
    const client = this.getClient();
    const action = {
      type: "claimReferralRewards",
      data: {
        collateralId,
        spot,
        nonce,
      },
    };

    try {
      const result = await client.submitPresignedAction(action, signature, nonce);

      // 2. Save in LedgerBrokerFee
      await this.prisma.ledgerBrokerFee.create({
        data: {
          period: new Date().toISOString().substring(0, 7), // "YYYY-MM"
          grossFee: "0", // Gross amount is tracked on L1, we log claim event locally
          claimedTxHash: result?.txHash || result?.hash || "0x_claimed",
          claimedAt: new Date(),
        },
      });

      return {
        success: true,
        result,
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to relay claim broker fees to L1: ${err.message}`);
    }
  }
}
