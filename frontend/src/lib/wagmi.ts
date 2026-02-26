import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// ─── Somnia Testnet (Shannon) ─────────────────────────────────────────────────

export const somniaTestnet = defineChain({
  id:          50312,
  name:        "Somnia Testnet",
  nativeCurrency: {
    decimals: 18,
    name:     "Somnia Testnet Token",
    symbol:   "STT",
  },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
    public:  { http: ["https://dream-rpc.somnia.network"] },
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url:  "https://shannon-explorer.somnia.network",
    },
  },
  testnet: true,
});

// ─── Wagmi Config ─────────────────────────────────────────────────────────────

export const wagmiConfig = getDefaultConfig({
  appName:     "Pulse Market",
  projectId:   process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "pulse-market-default",
  chains:      [somniaTestnet],
  ssr:         true,
});

export const chains = [somniaTestnet] as const;
