import { Address } from "viem";
import { SOMNIA_CHAIN_ID } from "@/constants";

// ─── Contract Addresses ────────────────────────────────────────────────────────
// These are populated from the deployment output at contracts/deployments/somnia.json.
// For local development, set NEXT_PUBLIC_PULSE_MARKET_ADDRESS and
// NEXT_PUBLIC_EVENT_HANDLER_ADDRESS in .env.local.

const CONTRACT_ADDRESSES: Record<number, { PulseMarket: Address; SomniaEventHandler: Address }> = {
  [SOMNIA_CHAIN_ID]: {
    PulseMarket:        (process.env.NEXT_PUBLIC_PULSE_MARKET_ADDRESS        || "0x0000000000000000000000000000000000000000") as Address,
    SomniaEventHandler: (process.env.NEXT_PUBLIC_EVENT_HANDLER_ADDRESS       || "0x0000000000000000000000000000000000000000") as Address,
  },
};

export function getPulseMarketAddress(chainId: number): Address {
  const addrs = CONTRACT_ADDRESSES[chainId];
  if (!addrs) throw new Error(`No deployment for chainId ${chainId}`);
  return addrs.PulseMarket;
}

export function getEventHandlerAddress(chainId: number): Address {
  const addrs = CONTRACT_ADDRESSES[chainId];
  if (!addrs) throw new Error(`No deployment for chainId ${chainId}`);
  return addrs.SomniaEventHandler;
}
