"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useMarket, useUserBet } from "@/hooks/usePulseMarket";
import {
  usePlaceBet,
  useClaimWinnings,
  useClaimRefund,
  useCancelExpiredMarket,
} from "@/hooks/useMarketActions";
import { Market, MarketStatus, Outcome } from "@/types";
import { formatConditionLabel } from "@/lib/contracts/encode";
import { MIN_BET_ETH, SOMNIA_EXPLORER } from "@/constants";

interface Props {
  marketId: bigint;
}

export function MarketDetail({ marketId }: Props) {
  const { address }                   = useAccount();
  const { market, isLoading, refetch } = useMarket(marketId);
  const { bet }                        = useUserBet(marketId, address);

  if (isLoading) return <MarketDetailSkeleton />;
  if (!market)   return <div className="text-center py-24 text-slate-500">Market not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <MarketHeader market={market} />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MarketStats market={market} />
          <BettingPanel market={market} userBet={bet} address={address} onSuccess={refetch} />
        </div>
        <div className="space-y-6">
          <MarketInfo market={market} />
          <ClaimPanel market={market} userBet={bet} address={address} onSuccess={refetch} />
        </div>
      </div>
    </div>
  );
}

function MarketHeader({ market }: { market: Market }) {
  const totalPool  = market.totalYesBets + market.totalNoBets;
  const yesPercent = totalPool > 0n ? Number((market.totalYesBets * 100n) / totalPool) : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {market.status === MarketStatus.Active && (
            <span className="badge-active">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
            </span>
          )}
          {market.status === MarketStatus.Resolved && (
            <span className="badge-resolved">Settled by Reactivity</span>
          )}
          {market.status === MarketStatus.Cancelled && (
            <span className="badge-cancelled">Cancelled</span>
          )}
          {market.status === MarketStatus.Resolved && (
            market.outcome === Outcome.Yes
              ? <span className="badge-yes">YES Won</span>
              : <span className="badge-no">NO Won</span>
          )}
        </div>
        <span className="ml-auto font-mono text-slate-500 text-sm">#{market.id.toString()}</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">
        {market.question}
      </h1>

      <p className="text-sm text-slate-400 font-mono">
        Condition: <span className="text-pulse-400">{formatConditionLabel(market.conditionData, market.eventTopic)}</span>
      </p>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-emerald-400 font-bold">YES {yesPercent}%</span>
          <span className="text-red-400 font-bold">{100 - yesPercent}% NO</span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${yesPercent}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MarketStats({ market }: { market: Market }) {
  const totalPool = market.totalYesBets + market.totalNoBets;
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Total Pool",  value: `${formatEther(totalPool)} STT`,       color: "text-white"       },
        { label: "YES Pool",    value: `${formatEther(market.totalYesBets)} STT`, color: "text-emerald-400" },
        { label: "NO Pool",     value: `${formatEther(market.totalNoBets)} STT`,  color: "text-red-400"     },
      ].map((s) => (
        <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
          <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function BettingPanel({
  market,
  userBet,
  address,
  onSuccess,
}: {
  market:   Market;
  userBet:  any;
  address:  `0x${string}` | undefined;
  onSuccess: () => void;
}) {
  const [amount, setAmount]     = useState(MIN_BET_ETH);
  const { placeBet, isPending, isSuccess, error } = usePlaceBet(market.id);

  const alreadyBet  = userBet && userBet.amount > 0n;
  const isExpired   = Number(market.endTime) < Date.now() / 1000;
  const canBet      = market.status === MarketStatus.Active && !alreadyBet && !isExpired && !!address;

  if (isSuccess && !alreadyBet) onSuccess();

  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="font-bold text-white mb-4">Place Your Bet</h2>

      {!address && (
        <p className="text-sm text-slate-400 text-center py-4">Connect your wallet to bet</p>
      )}

      {address && alreadyBet && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-300">
            You bet <span className={userBet.isYes ? "text-emerald-400" : "text-red-400"}>
              {userBet.isYes ? "YES" : "NO"}
            </span> with{" "}
            <span className="text-white font-semibold">{formatEther(userBet.amount)} STT</span>
          </p>
        </div>
      )}

      {address && !alreadyBet && market.status === MarketStatus.Active && (
        <>
          <div className="mb-4">
            <label className="text-sm text-slate-400 mb-1.5 block">Amount (STT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={MIN_BET_ETH}
              step="0.001"
              className="input-field"
              placeholder="0.001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { placeBet(true, amount); }}
              disabled={!canBet || isPending}
              className="btn-yes disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Confirming..." : "Bet YES"}
            </button>
            <button
              onClick={() => { placeBet(false, amount); }}
              disabled={!canBet || isPending}
              className="btn-no disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Confirming..." : "Bet NO"}
            </button>
          </div>
        </>
      )}

      {market.status !== MarketStatus.Active && (
        <p className="text-sm text-slate-500 text-center py-4">
          Betting is closed for this market.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-3">
          {(error as any).shortMessage ?? error.message}
        </p>
      )}
    </div>
  );
}

function ClaimPanel({
  market,
  userBet,
  address,
  onSuccess,
}: {
  market:    Market;
  userBet:   any;
  address:   `0x${string}` | undefined;
  onSuccess: () => void;
}) {
  const { claimWinnings, isPending: claimPending,   isSuccess: claimSuccess }  = useClaimWinnings(market.id);
  const { claimRefund,   isPending: refundPending,  isSuccess: refundSuccess } = useClaimRefund(market.id);
  const { cancelExpiredMarket, isPending: cancelPending } = useCancelExpiredMarket(market.id);

  if (claimSuccess || refundSuccess) onSuccess();

  const hasBet      = userBet && userBet.amount > 0n;
  const isWinner    = hasBet && market.status === MarketStatus.Resolved &&
    ((market.outcome === Outcome.Yes && userBet.isYes) || (market.outcome === Outcome.No && !userBet.isYes));
  const canRefund   = hasBet && market.status === MarketStatus.Cancelled && !userBet.claimed;
  const isExpired   = Number(market.endTime) < Date.now() / 1000;

  if (!address) return null;

  return (
    <div className="glass-card rounded-3xl p-6 space-y-3">
      <h2 className="font-bold text-white mb-2">Actions</h2>

      {isWinner && !userBet.claimed && (
        <button
          onClick={claimWinnings}
          disabled={claimPending}
          className="btn-primary w-full"
        >
          {claimPending ? "Claiming..." : "Claim Winnings"}
        </button>
      )}

      {canRefund && (
        <button
          onClick={claimRefund}
          disabled={refundPending}
          className="btn-secondary w-full"
        >
          {refundPending ? "Refunding..." : "Claim Refund"}
        </button>
      )}

      {market.status === MarketStatus.Active && isExpired && (
        <button
          onClick={cancelExpiredMarket}
          disabled={cancelPending}
          className="btn-secondary w-full text-yellow-400"
        >
          {cancelPending ? "Cancelling..." : "Cancel Expired Market"}
        </button>
      )}

      {userBet?.claimed && (
        <p className="text-xs text-slate-500 text-center">Already claimed</p>
      )}
    </div>
  );
}

function MarketInfo({ market }: { market: Market }) {
  const createdAt  = new Date(Number(market.createdAt) * 1000).toLocaleString();
  const endTime    = new Date(Number(market.endTime)   * 1000).toLocaleString();
  const resolvedAt = market.resolvedAt > 0n
    ? new Date(Number(market.resolvedAt) * 1000).toLocaleString()
    : null;

  return (
    <div className="glass-card rounded-3xl p-6 space-y-3">
      <h2 className="font-bold text-white mb-2">Market Info</h2>
      <InfoRow label="Creator"    value={truncateAddr(market.creator)} />
      <InfoRow label="Watching"   value={truncateAddr(market.watchedContract)} />
      <InfoRow
        label="Event Topic"
        value={`${market.eventTopic.slice(0, 10)}…`}
        mono
      />
      <InfoRow label="Created"    value={createdAt} />
      <InfoRow label="Expires"    value={endTime} />
      {resolvedAt && <InfoRow label="Settled"   value={resolvedAt} highlight />}
      <a
        href={`${SOMNIA_EXPLORER}/address/${market.watchedContract}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-pulse-400 hover:text-pulse-300 transition-colors"
      >
        View on Explorer →
      </a>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: {
  label:     string;
  value:     string;
  mono?:     boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs text-right break-all ${mono ? "font-mono" : ""} ${highlight ? "text-pulse-400" : "text-slate-300"}`}>
        {value}
      </span>
    </div>
  );
}

function MarketDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="h-56 skeleton rounded-3xl" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
      </div>
    </div>
  );
}

function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
