"use client";

import { useReadContract, useReadContracts, useChainId } from "wagmi";
import { PULSE_MARKET_ABI } from "@/lib/contracts/abis";
import { getPulseMarketAddress } from "@/lib/contracts/addresses";
import { Market, Bet } from "@/types";

// ─── Hook: single market ──────────────────────────────────────────────────────

export function useMarket(marketId: bigint) {
  const chainId = useChainId();

  const { data, isLoading, error, refetch } = useReadContract({
    address:      getPulseMarketAddress(chainId),
    abi:          PULSE_MARKET_ABI,
    functionName: "getMarket",
    args:         [marketId],
    query: {
      enabled:        marketId >= 0n,
      refetchInterval: 10_000,
    },
  });

  return {
    market:    data as Market | undefined,
    isLoading,
    error,
    refetch,
  };
}

// ─── Hook: market feed (paginated) ────────────────────────────────────────────

export function useMarkets(offset: bigint, limit: bigint) {
  const chainId = useChainId();

  const { data, isLoading, error, refetch } = useReadContract({
    address:      getPulseMarketAddress(chainId),
    abi:          PULSE_MARKET_ABI,
    functionName: "getMarkets",
    args:         [offset, limit],
    query: {
      refetchInterval: 10_000,
    },
  });

  return {
    markets:   (data as Market[] | undefined) ?? [],
    isLoading,
    error,
    refetch,
  };
}

// ─── Hook: market count ───────────────────────────────────────────────────────

export function useMarketCount() {
  const chainId = useChainId();

  const { data, isLoading } = useReadContract({
    address:      getPulseMarketAddress(chainId),
    abi:          PULSE_MARKET_ABI,
    functionName: "getMarketCount",
    query: {
      refetchInterval: 10_000,
    },
  });

  return { count: (data as bigint | undefined) ?? 0n, isLoading };
}

// ─── Hook: user bet ───────────────────────────────────────────────────────────

export function useUserBet(marketId: bigint, bettor: `0x${string}` | undefined) {
  const chainId = useChainId();

  const { data, isLoading, refetch } = useReadContract({
    address:      getPulseMarketAddress(chainId),
    abi:          PULSE_MARKET_ABI,
    functionName: "getBet",
    args:         [marketId, bettor!],
    query: {
      enabled:         !!bettor,
      refetchInterval: 10_000,
    },
  });

  return {
    bet:       data as Bet | undefined,
    isLoading,
    refetch,
  };
}
