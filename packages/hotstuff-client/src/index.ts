import { encode } from "@msgpack/msgpack";
import { keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { HOTSTUFF_ENDPOINTS, OP_CODES, EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION, DEFAULT_CHAIN_ID, DEFAULT_VERIFYING_CONTRACT } from "@ember/config";
import { HotstuffOrder, HotstuffBrokerConfig } from "@ember/types";
import WebSocket from "ws";

export interface ClientConfig {
  privateKey?: `0x${string}`;
  env: "testnet" | "mainnet";
  verifyingContract?: `0x${string}`;
  chainId?: number;
}

export class HotstuffClient {
  private privateKey?: `0x${string}`;
  private env: "testnet" | "mainnet";
  private endpoints: typeof HOTSTUFF_ENDPOINTS[keyof typeof HOTSTUFF_ENDPOINTS];
  private verifyingContract: `0x${string}`;
  private chainId: number;

  constructor(config: ClientConfig) {
    this.privateKey = config.privateKey;
    this.env = config.env;
    this.endpoints = HOTSTUFF_ENDPOINTS[config.env];
    this.verifyingContract = config.verifyingContract || DEFAULT_VERIFYING_CONTRACT as `0x${string}`;
    this.chainId = config.chainId || DEFAULT_CHAIN_ID;
  }

  // --- Sign Action ---
  public async signAction(action: any, txType: number, overridePrivateKey?: `0x${string}`): Promise<`0x${string}`> {
    const pk = overridePrivateKey || this.privateKey;
    if (!pk) {
      throw new Error("Private key is required to sign actions");
    }

    const account = privateKeyToAccount(pk);
    const actionBytes = encode(action);
    const payloadHash = keccak256(actionBytes);

    const domain = {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId: this.chainId,
      verifyingContract: this.verifyingContract,
    };

    const types = {
      Action: [
        { name: "source", type: "string" },
        { name: "hash", type: "bytes32" },
        { name: "txType", type: "uint16" },
      ],
    };

    const message = {
      source: this.endpoints.source,
      hash: payloadHash,
      txType,
    };

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "Action",
      message,
    });

    return signature;
  }

  // --- REST Dispatch Helpers ---
  public async info<T = any>(method: string, params: any = {}): Promise<T> {
    const url = `${this.endpoints.rest}/info`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Info request failed: HTTP ${response.status} - ${errorText}`);
    }

    const resJson = await response.json();
    return resJson as T;
  }

  public async exchange(actionType: string, actionData: any, txType: number, nonce: number, overridePrivateKey?: `0x${string}`): Promise<any> {
    const action = {
      type: actionType,
      data: actionData,
    };

    const signature = await this.signAction(action, txType, overridePrivateKey);
    const url = `${this.endpoints.rest}/exchange`;

    const payload = {
      action,
      signature,
      nonce,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exchange request failed: HTTP ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // --- Specialized Read API Calls ---
  public async brokersCheck(user: string, broker: string): Promise<any> {
    return this.info("brokers_check", { user, broker });
  }

  public async accountSummary(user: string): Promise<any> {
    return this.info("account_summary", { user });
  }

  public async openOrders(user: string): Promise<any> {
    return this.info("open_orders", { user });
  }

  public async positions(user: string): Promise<any> {
    return this.info("positions", { user });
  }

  // --- Specialized Write API Calls ---
  public async approveBrokerFee(broker: string, maxFeeRate: string, nonce: number, overridePrivateKey?: `0x${string}`): Promise<any> {
    const data = { broker, maxFeeRate, nonce };
    return this.exchange("approveBrokerFee", data, OP_CODES.approveBrokerFee, nonce, overridePrivateKey);
  }

  public async addAgent(agentAddress: string, agentName: string, forAccount: string, validUntil: number, nonce: number, overridePrivateKey?: `0x${string}`): Promise<any> {
    const data = { agentAddress, agentName, forAccount, validUntil, nonce };
    return this.exchange("addAgent", data, OP_CODES.addAgent, nonce, overridePrivateKey);
  }

  public async revokeAgent(agentAddress: string, forAccount: string, nonce: number, overridePrivateKey?: `0x${string}`): Promise<any> {
    const data = { agentAddress, forAccount, nonce };
    return this.exchange("revokeAgent", data, OP_CODES.revokeAgent, nonce, overridePrivateKey);
  }

  public async claimReferralRewards(collateralId: number, spot: boolean, nonce: number, overridePrivateKey?: `0x${string}`): Promise<any> {
    const data = { collateralId, spot, nonce };
    return this.exchange("claimReferralRewards", data, OP_CODES.claimReferralRewards, nonce, overridePrivateKey);
  }

  public async placeOrder(orders: HotstuffOrder[], brokerConfig?: HotstuffBrokerConfig, expiresAfter?: number, nonce?: number, overridePrivateKey?: `0x${string}`): Promise<any> {
    const actualNonce = nonce || Date.now();
    const actualExpires = expiresAfter || actualNonce + 60 * 1000; // 1 min expiration
    const data = {
      orders,
      brokerConfig,
      expiresAfter: actualExpires,
      nonce: actualNonce,
    };
    return this.exchange("placeOrder", data, OP_CODES.placeOrder, actualNonce, overridePrivateKey);
  }

  public async cancelAll(nonce: number, overridePrivateKey?: `0x${string}`): Promise<any> {
    const data = { nonce };
    return this.exchange("cancelAll", data, OP_CODES.cancelAll, nonce, overridePrivateKey);
  }

  // --- Relay Signed Action to L1 ---
  public async submitPresignedAction(action: any, signature: string, nonce: number): Promise<any> {
    const url = `${this.endpoints.rest}/exchange`;
    const payload = {
      action,
      signature,
      nonce,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exchange relay failed: HTTP ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // --- WebSocket Connection ---
  public subscribe(channels: string[], onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(this.endpoints.wss);

    ws.on("open", () => {
      // Subscribing
      for (const channel of channels) {
        ws.send(JSON.stringify({
          method: "subscribe",
          subscription: { name: channel }
        }));
      }
    });

    ws.on("message", (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        onMessage(parsed);
      } catch (err) {
        // ignore parse error
      }
    });

    // Heartbeat logic can be attached
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ method: "ping" }));
      }
    }, 30 * 1000);

    ws.on("close", () => {
      clearInterval(pingInterval);
    });

    return ws;
  }
}
