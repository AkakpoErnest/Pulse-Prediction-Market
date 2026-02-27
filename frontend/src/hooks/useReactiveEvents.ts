"use client";

import { useRef } from "react";
import { useWatchContractEvent, useChainId } from "wagmi";
import { formatEther } from "viem";
import { PULSE_MARKET_ABI } from "@/lib/contracts/abis";
import { getPulseMarketAddress, isCorrectChain } from "@/lib/contracts/addresses";
import { useToast } from "@/context/ToastContext";
import { Outcome } from "@/types";

export type ActivityEventKind = "bet" | "settlement" | "market_created" | "claim";

export interface ActivityEvent {
  id:        string;
  kind:      ActivityEventKind;
  marketId:  string;
  label:     string;
  sub:       string;
  timestamp: number;
  isYes?:    boolean;
  bettor?:   string; // raw address for username resolution
}

interface Options {
  onSettlement?: (marketId: bigint, outcome: number, x: number, y: number) => void;
  onActivity?:   (event: ActivityEvent) => void;
}

export function useReactiveEvents({ onSettlement, onActivity }: Options = {}) {
  const chainId      = useChainId();
  const { addToast } = useToast();
  const counter      = useRef(0);

  // Safe — returns zero address when chainId is wrong, wagmi skips calls when enabled=false
  const address  = getPulseMarketAddress(chainId);
  const enabled  = isCorrectChain(chainId);

  useWatchContractEvent({
    address,
    abi:       PULSE_MARKET_ABI,
    eventName: "MarketResolved",
    enabled,
    onLogs(logs) {
      for (const log of logs) {
        const { marketId, outcome, totalYesBets, totalNoBets } = log.args as any;
        const isYes   = Number(outcome) === Outcome.Yes;
        const pool    = (totalYesBets as bigint) + (totalNoBets as bigint);
        const poolStr = pool > 0n ? `${parseFloat(formatEther(pool)).toFixed(3)} STT pool` : "";

        addToast(
          `⚡ Market #${marketId} settled — ${isYes ? "YES" : "NO"} won!`,
          "settlement",
          poolStr
        );

        onSettlement?.(
          marketId as bigint,
          Number(outcome),
          typeof window !== "undefined" ? window.innerWidth  * (0.3 + Math.random() * 0.4) : 400,
          typeof window !== "undefined" ? window.innerHeight * (0.3 + Math.random() * 0.4) : 300
        );

        onActivity?.({
          id:        `ev-${counter.current++}`,
          kind:      "settlement",
          marketId:  String(marketId),
          label:     `Market #${marketId} settled`,
          sub:       `${isYes ? "YES" : "NO"} won · ${poolStr}`,
          timestamp: Date.now(),
          isYes,
        });
      }
    },
    poll:            true,
    pollingInterval: 8_000,
  });

  useWatchContractEvent({
    address,
    abi:       PULSE_MARKET_ABI,
    eventName: "BetPlaced",
    enabled,
    onLogs(logs) {
      for (const log of logs) {
        const { marketId, bettor, isYes, amount } = log.args as any;
        const amtStr = parseFloat(formatEther(amount as bigint)).toFixed(3);
        const side   = isYes ? "YES" : "NO";
        const short  = `${String(bettor).slice(0, 6)}…${String(bettor).slice(-4)}`;

        onActivity?.({
          id:        `ev-${counter.current++}`,
          kind:      "bet",
          marketId:  String(marketId),
          label:     `${short} bet ${side} on #${marketId}`,
          sub:       `${amtStr} STT`,
          timestamp: Date.now(),
          isYes:     isYes as boolean,
          bettor:    String(bettor),
        });
      }
    },
    poll:            true,
    pollingInterval: 8_000,
  });

  useWatchContractEvent({
    address,
    abi:       PULSE_MARKET_ABI,
    eventName: "MarketCreated",
    enabled,
    onLogs(logs) {
      for (const log of logs) {
        const { marketId, creator, question } = log.args as any;
        const short = `${String(creator).slice(0, 6)}…${String(creator).slice(-4)}`;

        addToast(`New market #${marketId} created`, "info", short);

        onActivity?.({
          id:        `ev-${counter.current++}`,
          kind:      "market_created",
          marketId:  String(marketId),
          label:     `Market #${marketId} created`,
          sub:       String(question).slice(0, 60),
          timestamp: Date.now(),
        });
      }
    },
    poll:            true,
    pollingInterval: 15_000,
  });
}
