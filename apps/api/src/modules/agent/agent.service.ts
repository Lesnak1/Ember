import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HotstuffClient } from "@ember/hotstuff-client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { recoverTypedDataAddress, keccak256 } from "viem";
import { encode } from "@msgpack/msgpack";
import * as crypto from "crypto";

@Injectable()
export class AgentService {
  private encryptionKey: Buffer;

  constructor(private prisma: PrismaService) {
    const secret = process.env.AGENT_ENC_SECRET || "ember-default-agent-encryption-secret-32-chars";
    this.encryptionKey = crypto.createHash("sha256").update(secret).digest();
  }

  // --- AES-256-GCM Encryption/Decryption ---
  public encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  public decrypt(encryptedRef: string): string {
    const parts = encryptedRef.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted reference format");
    }
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // --- Generate Agent Keypair ---
  public async createAgentKeyPair(userId: string): Promise<{ agentAddress: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generate fresh private key
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const encKey = this.encrypt(privateKey);

    // Save temporary PENDING state to database
    await this.prisma.agentWallet.upsert({
      where: { agentAddress: account.address },
      update: {
        userId,
        encPrivKeyRef: encKey,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
      create: {
        userId,
        agentAddress: account.address,
        encPrivKeyRef: encKey,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });

    return {
      agentAddress: account.address,
    };
  }

  // --- Register Agent Delegation ---
  public async registerAgent(
    userId: string,
    agentAddress: string,
    validUntil: number,
    signature: `0x${string}`,
    nonce: number
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const agentWallet = await this.prisma.agentWallet.findUnique({
      where: { agentAddress },
    });
    if (!agentWallet || agentWallet.userId !== user.id) {
      throw new NotFoundException("Agent wallet key pair not generated or unauthorized");
    }

    // Verify user EIP-712 signature using viem
    const action = {
      type: "addAgent",
      data: {
        agentAddress,
        agentName: "EmberBot",
        forAccount: user.mainAddress,
        validUntil,
        nonce,
      },
    };

    const actionBytes = encode(action);
    const payloadHash = keccak256(actionBytes);

    const chainId = process.env.HOTSTUFF_CHAIN_ID ? parseInt(process.env.HOTSTUFF_CHAIN_ID, 10) : 1;
    const verifyingContract = (process.env.HOTSTUFF_VERIFYING_CONTRACT || "0x1234567890123456789012345678901234567890") as `0x${string}`;
    const source = process.env.HOTSTUFF_SOURCE || (process.env.HOTSTUFF_ENV === "mainnet" ? "Mainnet" : "Testnet");

    const domain = {
      name: "HotstuffCore",
      version: "1",
      chainId,
      verifyingContract,
    };

    const types = {
      Action: [
        { name: "source", type: "string" },
        { name: "hash", type: "bytes32" },
        { name: "txType", type: "uint16" },
      ],
    };

    const message = {
      source,
      hash: payloadHash,
      txType: 1201,
    };

    try {
      const recoveredAddress = await recoverTypedDataAddress({
        domain,
        types,
        primaryType: "Action",
        message,
        signature,
      });

      if (recoveredAddress.toLowerCase() !== user.mainAddress.toLowerCase()) {
        throw new BadRequestException("Agent delegation signature verification failed");
      }

      // Initialize HotstuffClient for L1 interaction
      const env = (process.env.HOTSTUFF_ENV || "testnet") as "testnet" | "mainnet";
      const client = new HotstuffClient({ env });

      // In production, submit the action payload + signature to the L1 exchange:
      // await client.exchange("addAgent", action.data, 1201, nonce, signature);

      // Mark the agent wallet as active
      const updatedWallet = await this.prisma.agentWallet.update({
        where: { agentAddress },
        data: {
          validUntil: new Date(validUntil * 1000),
          status: "ACTIVE",
        },
      });

      return {
        success: true,
        agentAddress,
        validUntil: updatedWallet.validUntil,
        status: updatedWallet.status,
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to register agent: ${err.message}`);
    }
  }

  // --- Revoke Agent Delegation ---
  public async revokeAgent(userId: string, agentAddress: string, signature: `0x${string}`, nonce: number): Promise<any> {
    const wallet = await this.prisma.agentWallet.findUnique({
      where: { agentAddress },
    });

    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundException("Agent wallet not found for this user");
    }

    // Submit revokeAgent action to Hotstuff exchange
    // Update status in local database
    await this.prisma.agentWallet.update({
      where: { agentAddress },
      data: { status: "REVOKED" },
    });

    return {
      success: true,
      agentAddress,
      status: "REVOKED",
    };
  }

  // --- Decrypt Agent Private Key for execution ---
  public async getAgentPrivateKey(agentAddress: string): Promise<`0x${string}`> {
    const wallet = await this.prisma.agentWallet.findUnique({
      where: { agentAddress },
    });

    if (!wallet || wallet.status !== "ACTIVE" || new Date() > wallet.validUntil) {
      throw new BadRequestException("Agent wallet is not active or expired");
    }

    const pk = this.decrypt(wallet.encPrivKeyRef);
    return pk as `0x${string}`;
  }
}
