"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMarketCount } from "@/hooks/usePulseMarket";

export function HeroSection() {
  const { count } = useMarketCount();

  return (
    <section className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,39,133,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,39,133,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
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
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
          <span className="text-white">Markets That</span>
          <br />
          <span className="bg-pulse-gradient bg-clip-text text-transparent">
            Settle Themselves
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Bet on any on-chain event. The instant the event fires,
          the market resolves and winners collect — fully automated,
          zero trust required.
        </p>

        {/* CTA stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
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
            <span className="text-somnia-400 font-bold text-base">~1s</span>
            settlement time
          </span>
        </div>
      </motion.div>

      {/* Decorative pulse rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-pulse-500/10"
            style={{
              width:  `${i * 300}px`,
              height: `${i * 300}px`,
              top:    `${-i * 150}px`,
              left:   `${-i * 150}px`,
              animation: `pulse-glow ${2 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
