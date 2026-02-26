"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarkets, useMarketCount } from "@/hooks/usePulseMarket";
import { MarketCard } from "./MarketCard";
import { MarketStatus } from "@/types";

const PAGE_SIZE = 12n;

type FilterTab = "all" | "active" | "resolved";

export function MarketFeed() {
  const [filter, setFilter]   = useState<FilterTab>("all");
  const [page, setPage]       = useState(0n);
  const { count }             = useMarketCount();
  const { markets, isLoading } = useMarkets(page * PAGE_SIZE, PAGE_SIZE);

  const filtered = markets.filter((m) => {
    if (filter === "active")   return m.status === MarketStatus.Active;
    if (filter === "resolved") return m.status === MarketStatus.Resolved;
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all",      label: "All Markets"  },
    { key: "active",   label: "Active"       },
    { key: "resolved", label: "Resolved"     },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 pb-24">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setPage(0n); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === tab.key
                ? "bg-pulse-500 text-white"
                : "glass text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto text-sm text-slate-500">
          {count.toString()} total
        </div>
      </div>

      {/* Market grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 skeleton rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-500">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg font-medium text-slate-400">No markets yet</p>
          <p className="text-sm mt-1">Be the first to create a prediction market!</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((market) => (
              <motion.div
                key={market.id.toString()}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <MarketCard market={market} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {count > PAGE_SIZE && (
        <div className="flex justify-center gap-3 mt-10">
          <button
            onClick={() => setPage((p) => p - 1n)}
            disabled={page === 0n}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-slate-400 text-sm">
            Page {(page + 1n).toString()}
          </span>
          <button
            onClick={() => setPage((p) => p + 1n)}
            disabled={(page + 1n) * PAGE_SIZE >= count}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
