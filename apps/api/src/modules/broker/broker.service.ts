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

  getConfig() {
    const env = process.env.HOTSTUFF_ENV || "testnet";
    return {
      brokerAddress: process.env.BROKER_ADDRESS || "0x1234567890123456789012345678901234567890",
      defaultBrokerFeeBps: process.env.DEFAULT_BROKER_FEE_BPS ? parseInt(process.env.DEFAULT_BROKER_FEE_BPS, 10) : 3,
      maxBrokerFeeBps: process.env.MAX_BROKER_FEE_BPS ? parseInt(process.env.MAX_BROKER_FEE_BPS, 10) : 10,
      chainId: process.env.HOTSTUFF_CHAIN_ID ? parseInt(process.env.HOTSTUFF_CHAIN_ID, 10) : 1,
      verifyingContract: process.env.HOTSTUFF_VERIFYING_CONTRACT || "0x1234567890123456789012345678901234567890",
      source: process.env.HOTSTUFF_SOURCE || (env === "mainnet" ? "Mainnet" : "Testnet"),
    };
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

    // Validate proposed maxFeeRate against MAX_BROKER_FEE_BPS
    const config = this.getConfig();
    const maxAllowedRate = config.maxBrokerFeeBps / 10000;
    if (parseFloat(maxFeeRate) > maxAllowedRate) {
      throw new BadRequestException(`Proposed max fee rate of ${maxFeeRate} exceeds the maximum allowed limit of ${maxAllowedRate} (${config.maxBrokerFeeBps} BPS).`);
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
