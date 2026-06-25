import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Ember Trading",
  projectId: "YOUR_PROJECT_ID_OR_FALLBACK_DEFAULT", // Fallback works fine
  chains: [mainnet, sepolia],
  ssr: true,
});
