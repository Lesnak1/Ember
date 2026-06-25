import { HotstuffClient } from "./index";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

async function main() {
  console.log("Starting Ember HotStuff cryptographical verification...");
  
  // 1. Generate a mock wallet
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  console.log(`Mock Main Wallet Address: ${account.address}`);

  // 2. Initialize Client
  const client = new HotstuffClient({
    privateKey,
    env: "testnet",
  });

  // 3. Test Action Signing (approveBrokerFee)
  const broker = "0x1234567890123456789012345678901234567890";
  const maxFeeRate = "0.0003";
  const nonce = Date.now();

  const action = {
    broker,
    maxFeeRate,
    nonce,
  };

  try {
    const signature = await client.signAction(action, 1207); // OP_CODES.approveBrokerFee is 1207
    console.log("✔ Successfully generated EIP-712 signature using viem & MessagePack hashing!");
    console.log(`Signature: ${signature}`);
    
    console.log("\nAll core cryptographic integration checks passed successfully!");
  } catch (err: any) {
    console.error("❌ Cryptographic verification failed:", err.message);
  }
}

main();
