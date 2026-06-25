import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Ember Trading",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3fbb6b779f650f5048507d391a7742d4", // Valid formatted public fallback ID
  chains: [mainnet, sepolia],
  ssr: true,
});
