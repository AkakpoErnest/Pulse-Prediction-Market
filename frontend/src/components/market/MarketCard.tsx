"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { Market, MarketStatus, Outcome } from "@/types";
import { formatConditionLabel } from "@/lib/contracts/encode";

interface Props {
  market: Market;
}

export function MarketCard({ market }: Props) {
  const totalPool = market.totalYesBets + market.totalNoBets;
  const yesPercent = totalPool > 0n
    ? Number((market.totalYesBets * 100n) / totalPool)
    : 50;
  const noPercent = 100 - yesPercent;

  const timeLeft = Number(market.endTime) - Math.floor(Date.now() / 1000);
  const timeLeftStr = formatTimeLeft(timeLeft);

  const statusBadge = {
    [MarketStatus.Active]:    <span className="badge-active"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</span>,
    [MarketStatus.Resolved]:  <span className="badge-resolved">Settled</span>,
    [MarketStatus.Cancelled]: <span className="badge-cancelled">Cancelled</span>,
  }[market.status];

  const outcomeBadge = market.status === MarketStatus.Resolved
    ? market.outcome === Outcome.Yes
      ? <span className="badge-yes">YES Won</span>
      : <span className="badge-no">NO Won</span>
    : null;

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="market-card h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {statusBadge}
            {outcomeBadge}
          </div>
          <span className="text-xs text-slate-500 shrink-0 font-mono">#{market.id.toString()}</span>
        </div>

        {/* Question */}
        <h3 className="text-base font-semibold text-white leading-snug mb-3 flex-1 line-clamp-3">
          {market.question}
        </h3>

        {/* Condition */}
        <p className="text-xs text-slate-500 mb-4 font-mono truncate">
          {formatConditionLabel(market.conditionData, market.eventTopic)}
        </p>

        {/* Yes/No bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-emerald-400 font-semibold">YES {yesPercent}%</span>
            <span className="text-red-400 font-semibold">{noPercent}% NO</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-3">
          <span>
            Pool: <span className="text-slate-300 font-medium">{formatEther(totalPool)} STT</span>
          </span>
          {market.status === MarketStatus.Active && (
            <span className={timeLeft > 0 ? "text-slate-400" : "text-red-400"}>
              {timeLeft > 0 ? `Expires ${timeLeftStr}` : "Expired"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "now";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0)  return `in ${d}d ${h}h`;
  if (h > 0)  return `in ${h}h ${m}m`;
  if (m > 0)  return `in ${m}m`;
  return `in ${seconds}s`;
}
