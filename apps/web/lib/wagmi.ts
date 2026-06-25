import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, base } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "Ember Trading",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3fbb6b779f650f5048507d391a7742d4", // Fallback ID
  chains: [mainnet, sepolia, base],
  transports: {
    [mainnet.id]: http("https://cloudflare-eth.com"),
    [sepolia.id]: http("https://rpc.ankr.com/eth_sepolia"),
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: true,
});
