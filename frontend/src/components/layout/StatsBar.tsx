"use client";

import { useMarketCount } from "@/hooks/usePulseMarket";
import { useChainId } from "wagmi";
import { SOMNIA_CHAIN_ID } from "@/constants";

export function StatsBar() {
  const { count } = useMarketCount();
  const chainId   = useChainId();
  const isCorrectChain = chainId === SOMNIA_CHAIN_ID;

  const stats = [
    { label: "Total Markets",    value: count.toString(),    color: "text-pulse-400"  },
    { label: "Chain",            value: "Somnia Testnet",    color: "text-somnia-400" },
    { label: "Settlement",       value: "Reactive (~1s)",    color: "text-emerald-400"},
    { label: "Oracle Required",  value: "None",              color: "text-yellow-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 mb-12">
      <div className="glass rounded-2xl border border-white/5 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/5">
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 py-4 text-center">
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Wrong network warning */}
      {chainId && !isCorrectChain && (
        <div className="mt-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm text-center">
          Switch to <strong>Somnia Testnet</strong> (Chain ID 50312) to interact with markets.
          <a
            href="https://testnet.somnia.network/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 underline hover:text-yellow-200"
          >
            Get STT from faucet
          </a>
        </div>
      )}
    </div>
  );
}
