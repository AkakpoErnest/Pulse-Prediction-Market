"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivityEvent, useReactiveEvents } from "@/hooks/useReactiveEvents";
import { BurstEvent, SettlementBurstContainer } from "@/components/three/SettlementBurst";
import { useUsernames } from "@/context/UserContext";
import { Outcome } from "@/types";

const MAX_EVENTS = 20;

const KIND_ICON: Record<string, string> = {
  settlement:     "⚡",
  bet:            "🎯",
  market_created: "📊",
  claim:          "💰",
};

const KIND_COLOR: Record<string, string> = {
  settlement:     "text-pulse-400",
  bet:            "text-somnia-400",
  market_created: "text-emerald-400",
  claim:          "text-yellow-400",
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActivityFeed() {
  const [events, setEvents]   = useState<ActivityEvent[]>([]);
  const [bursts, setBursts]   = useState<BurstEvent[]>([]);
  const [isOpen, setIsOpen]   = useState(false);
  const [pulse, setPulse]     = useState(false);
  const [, setTick]           = useState(0); // force re-render for timeAgo
  const { displayName } = useUsernames();

  // Refresh timestamps every 15s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  const onActivity = useCallback((ev: ActivityEvent) => {
    setEvents((prev) => [ev, ...prev].slice(0, MAX_EVENTS));
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }, []);

  const onSettlement = useCallback(
    (marketId: bigint, outcome: number, x: number, y: number) => {
      const id = `burst-${Date.now()}`;
      setBursts((prev) => [...prev, { id, x, y, isYes: outcome === Outcome.Yes }]);
    },
    []
  );

  const removeBurst = useCallback((id: string) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useReactiveEvents({ onActivity, onSettlement });

  return (
    <>
      {/* Particle bursts — rendered at the document root level */}
      <SettlementBurstContainer events={bursts} onRemove={removeBurst} />

      {/* Feed button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen((o) => !o)}
          className={`relative glass rounded-2xl px-4 py-2.5 flex items-center gap-2
                      border transition-all duration-200
                      ${pulse ? "border-pulse-500 shadow-pulse" : "border-white/10 hover:border-pulse-500/40"}`}
        >
          {/* Live indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pulse-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pulse-500" />
          </span>
          <span className="text-xs font-semibold text-slate-300">Live Feed</span>
          {events.length > 0 && (
            <span className="text-xs font-bold text-pulse-400">{events.length}</span>
          )}
        </button>

        {/* Feed panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 10, scale: 0.97  }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-12 left-0 w-80 glass-card rounded-3xl border border-white/8 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-sm font-bold text-white">Live Activity</span>
                <span className="text-xs text-slate-500">Somnia Testnet</span>
              </div>

              {/* Events */}
              <div className="max-h-72 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-500 text-xs">
                    Watching for on-chain events…
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {events.map((ev) => (
                      <motion.div
                        key={ev.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{    opacity: 0, height: 0 }}
                        className="flex items-start gap-2.5 px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                      >
                        <span className="text-base mt-0.5 shrink-0">{KIND_ICON[ev.kind]}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${KIND_COLOR[ev.kind]} truncate`}>
                            {ev.kind === "bet" && ev.bettor
                              ? ev.label.replace(
                                  `${ev.bettor.slice(0, 6)}…${ev.bettor.slice(-4)}`,
                                  displayName(ev.bettor)
                                )
                              : ev.label}
                          </p>
                          {ev.sub && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{ev.sub}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">
                          {timeAgo(ev.timestamp)}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
