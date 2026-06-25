import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { defineChain } from "viem";

export const hotstuffTestnet = defineChain({
  id: 1, // Custom L1 matching standard contract EIP-712 domain chain ID
  name: "HotStuff L1 Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet-api.hotstuff.trade/rpc"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://testnet.hotstuff.trade/explorer" },
  },
});

export const hotstuffMainnet = defineChain({
  id: 1,
  name: "HotStuff L1 Mainnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://api.hotstuff.trade/rpc"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://hotstuff.trade/explorer" },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName: "Ember Trading",
  projectId: "YOUR_PROJECT_ID_OR_FALLBACK_DEFAULT", // Fallback works fine
  chains: [hotstuffTestnet, hotstuffMainnet],
  transports: {
    [hotstuffTestnet.id]: http(),
  },
  ssr: true,
});
