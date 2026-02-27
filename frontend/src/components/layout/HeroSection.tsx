"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useMarketCount } from "@/hooks/usePulseMarket";

// SSR-disabled — Three.js requires browser APIs
const ReactiveGlobe = dynamic(
  () => import("@/components/three/ReactiveGlobe"),
  { ssr: false, loading: () => <div className="w-full h-full" /> }
);

export function HeroSection() {
  const { count } = useMarketCount();

  return (
    <section className="relative pt-16 pb-12 px-4 text-center overflow-hidden min-h-[580px] flex flex-col items-center justify-center">

      {/* ── 3D Globe (absolute background) ───────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Radial vignette — blends globe into page bg */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `
              radial-gradient(ellipse 75% 75% at 50% 50%, transparent 35%, #04080f 82%),
              linear-gradient(to bottom, #04080f 0%, transparent 15%, transparent 85%, #04080f 100%)
            `,
          }}
        />
        <ReactiveGlobe />
      </div>

      {/* ── Subtle grid ───────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,39,133,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,39,133,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Hero content ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-20 max-w-4xl mx-auto"
      >
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass border border-pulse-500/30 text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pulse-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pulse-500" />
          </span>
          <span className="text-slate-300">Powered by Somnia Reactivity</span>
          <span className="text-pulse-400 font-semibold">No Oracles. No Backends.</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]"
        >
          <span className="text-white">Markets That</span>
          <br />
          <span className="bg-pulse-gradient bg-clip-text text-transparent">
            Settle Themselves
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Bet on any on-chain event. The instant the event fires,
          the market resolves and winners collect — fully automated,
          zero trust required.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-pulse-400 font-bold text-base">{count.toString()}</span>
            markets live
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold text-base">0</span>
            oracle dependencies
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="text-somnia-400 font-bold text-base">~1 block</span>
            settlement time
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
