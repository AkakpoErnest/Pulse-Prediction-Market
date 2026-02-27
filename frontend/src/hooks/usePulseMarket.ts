"use client";

import { useReadContract, useChainId } from "wagmi";
import { PULSE_MARKET_ABI } from "@/lib/contracts/abis";
import { getPulseMarketAddress, isCorrectChain } from "@/lib/contracts/addresses";
import { Market, Bet } from "@/types";

export function useMarket(marketId: bigint) {
  const chainId = useChainId();
  const address = getPulseMarketAddress(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address,
    abi:          PULSE_MARKET_ABI,
    functionName: "getMarket",
    args:         [marketId],
    query: {
      enabled:         isCorrectChain(chainId) && marketId >= 0n,
      refetchInterval: 10_000,
    },
  });

  return { market: data as Market | undefined, isLoading, error, refetch };
}

export function useMarkets(offset: bigint, limit: bigint) {
  const chainId = useChainId();
  const address = getPulseMarketAddress(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address,
    abi:          PULSE_MARKET_ABI,
    functionName: "getMarkets",
    args:         [offset, limit],
    query: {
      enabled:         isCorrectChain(chainId),
      refetchInterval: 10_000,
    },
  });

  return { markets: (data as Market[] | undefined) ?? [], isLoading, error, refetch };
}

export function useMarketCount() {
  const chainId = useChainId();
  const address = getPulseMarketAddress(chainId);

  const { data, isLoading } = useReadContract({
    address,
    abi:          PULSE_MARKET_ABI,
    functionName: "getMarketCount",
    query: {
      enabled:         isCorrectChain(chainId),
      refetchInterval: 10_000,
    },
  });

  return { count: (data as bigint | undefined) ?? 0n, isLoading };
}

export function useUserBet(marketId: bigint, bettor: `0x${string}` | undefined) {
  const chainId = useChainId();
  const address = getPulseMarketAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address,
    abi:          PULSE_MARKET_ABI,
    functionName: "getBet",
    args:         [marketId, bettor!],
    query: {
      enabled:         isCorrectChain(chainId) && !!bettor,
      refetchInterval: 10_000,
    },
  });

  return { bet: data as Bet | undefined, isLoading, refetch };
}
