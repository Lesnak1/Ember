import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { mainnet, sepolia, base } from "wagmi/chains";
import { defineChain } from "viem";

export const hotstuffChain = defineChain({
  id: 6122,
  name: "Hotstuff DracoBFT L1",
  nativeCurrency: {
    decimals: 18,
    name: "Hotstuff",
    symbol: "HOT",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-api.hotstuff.trade"],
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [sepolia, hotstuffChain, mainnet, base],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http("https://rpc.ankr.com/eth_sepolia"),
    [hotstuffChain.id]: http("https://testnet-api.hotstuff.trade"),
    [mainnet.id]: http("https://cloudflare-eth.com"),
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
