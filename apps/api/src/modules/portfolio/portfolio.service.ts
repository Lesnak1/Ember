import { Injectable } from "@nestjs/common";
import { HotstuffClient } from "@ember/hotstuff-client";

@Injectable()
export class PortfolioService {
  private getClient(): HotstuffClient {
    const env = (process.env.HOTSTUFF_ENV || "testnet") as "testnet" | "mainnet";
    return new HotstuffClient({ env });
  }

  async getSummary(address: string): Promise<any> {
    const client = this.getClient();
    return client.accountSummary(address);
  }

  async getPositions(address: string): Promise<any> {
    const client = this.getClient();
    return client.positions(address);
  }

  async getOpenOrders(address: string): Promise<any> {
    const client = this.getClient();
    return client.openOrders(address);
  }

  async checkBrokerFeeApproval(address: string, brokerAddress?: string): Promise<any> {
    const client = this.getClient();
    const broker = brokerAddress || process.env.BUILDER_ADDRESS || "0x1234567890123456789012345678901234567890";
    return client.brokersCheck(address, broker);
  }
}
