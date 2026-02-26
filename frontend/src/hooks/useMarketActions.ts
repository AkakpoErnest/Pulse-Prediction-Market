"use client";

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { parseEther } from "viem";
import { PULSE_MARKET_ABI } from "@/lib/contracts/abis";
import { SOMNIA_EVENT_HANDLER_ABI } from "@/lib/contracts/abis";
import { getPulseMarketAddress, getEventHandlerAddress } from "@/lib/contracts/addresses";
import { encodeCondition } from "@/lib/contracts/encode";
import { ComparisonOp, CreateMarketForm } from "@/types";
import { CREATION_BOND_ETH } from "@/constants";

// ─── Create Market ────────────────────────────────────────────────────────────

export function useCreateMarket() {
  const chainId = useChainId();
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  async function createMarket(form: CreateMarketForm) {
    const thresholdWei = parseEther(form.threshold);
    const conditionData = encodeCondition(form.conditionOp, thresholdWei);

    writeContract({
      address:      getPulseMarketAddress(chainId),
      abi:          PULSE_MARKET_ABI,
      functionName: "createMarket",
      args: [
        form.question,
        form.watchedContract as `0x${string}`,
        form.eventTopic as `0x${string}`,
        conditionData,
        BigInt(form.durationSeconds),
      ],
      value: parseEther(CREATION_BOND_ETH),
    });
  }

  return {
    createMarket,
    hash,
    isPending:    isPending || isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ─── Subscribe Market to Reactive Handler ─────────────────────────────────────

export function useSubscribeMarket() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function subscribeMarket(marketId: bigint) {
    writeContract({
      address:      getEventHandlerAddress(chainId),
      abi:          SOMNIA_EVENT_HANDLER_ABI,
      functionName: "subscribeMarket",
      args:         [marketId],
    });
  }

  return { subscribeMarket, hash, isPending: isPending || isConfirming, isSuccess, error, reset };
}

// ─── Place Bet ────────────────────────────────────────────────────────────────

export function usePlaceBet(marketId: bigint) {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function placeBet(isYes: boolean, amountEth: string) {
    writeContract({
      address:      getPulseMarketAddress(chainId),
      abi:          PULSE_MARKET_ABI,
      functionName: "placeBet",
      args:         [marketId, isYes],
      value:        parseEther(amountEth),
    });
  }

  return { placeBet, hash, isPending: isPending || isConfirming, isSuccess, error, reset };
}

// ─── Claim Winnings ───────────────────────────────────────────────────────────

export function useClaimWinnings(marketId: bigint) {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function claimWinnings() {
    writeContract({
      address:      getPulseMarketAddress(chainId),
      abi:          PULSE_MARKET_ABI,
      functionName: "claimWinnings",
      args:         [marketId],
    });
  }

  return { claimWinnings, hash, isPending: isPending || isConfirming, isSuccess, error, reset };
}

// ─── Claim Refund ─────────────────────────────────────────────────────────────

export function useClaimRefund(marketId: bigint) {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function claimRefund() {
    writeContract({
      address:      getPulseMarketAddress(chainId),
      abi:          PULSE_MARKET_ABI,
      functionName: "claimRefund",
      args:         [marketId],
    });
  }

  return { claimRefund, hash, isPending: isPending || isConfirming, isSuccess, error, reset };
}

// ─── Cancel Expired Market ────────────────────────────────────────────────────

export function useCancelExpiredMarket(marketId: bigint) {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function cancelExpiredMarket() {
    writeContract({
      address:      getPulseMarketAddress(chainId),
      abi:          PULSE_MARKET_ABI,
      functionName: "cancelExpiredMarket",
      args:         [marketId],
    });
  }

  return { cancelExpiredMarket, hash, isPending: isPending || isConfirming, isSuccess, error, reset };
}
