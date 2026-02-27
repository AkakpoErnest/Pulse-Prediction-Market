"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BurstEvent {
  id:       string;
  x:        number; // viewport x
  y:        number; // viewport y
  isYes:    boolean;
}

interface ParticleProps {
  angle:   number;
  distance: number;
  color:   string;
  delay:   number;
  size:    number;
}

// ─── Single particle ──────────────────────────────────────────────────────────

function Particle({ angle, distance, color, delay, size }: ParticleProps) {
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width:       size,
        height:      size,
        background:  color,
        left:        "50%",
        top:         "50%",
        marginLeft:  -size / 2,
        marginTop:   -size / 2,
        boxShadow:   `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{
        x:       dx,
        y:       dy,
        scale:   0,
        opacity: 0,
      }}
      transition={{
        duration: 0.9,
        delay,
        ease:     "easeOut",
      }}
    />
  );
}

// ─── Burst at a position ──────────────────────────────────────────────────────

function Burst({ event, onDone }: { event: BurstEvent; onDone: () => void }) {
  const yesColors = ["#22c55e", "#4ade80", "#86efac", "#ff2785", "#ffffff"];
  const noColors  = ["#ef4444", "#f87171", "#fca5a5", "#ff2785", "#ffffff"];
  const colors    = event.isYes ? yesColors : noColors;

  const particles = Array.from({ length: 24 }, (_, i) => ({
    angle:    (i / 24) * Math.PI * 2 + Math.random() * 0.3,
    distance: 60 + Math.random() * 80,
    color:    colors[Math.floor(Math.random() * colors.length)],
    delay:    Math.random() * 0.15,
    size:     3 + Math.random() * 5,
  }));

  useEffect(() => {
    const t = setTimeout(onDone, 1300);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{ left: event.x, top: event.y }}
    >
      {/* Ring flash */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          borderColor: event.isYes ? "#22c55e" : "#ef4444",
          left:  "50%",
          top:   "50%",
          marginLeft: -20,
          marginTop:  -20,
        }}
        initial={{ width: 40, height: 40, opacity: 0.9, marginLeft: -20, marginTop: -20 }}
        animate={{ width: 120, height: 120, opacity: 0, marginLeft: -60, marginTop: -60 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      {/* Particles */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
      {/* Label */}
      <motion.div
        className="absolute text-xs font-black whitespace-nowrap"
        style={{
          color:    event.isYes ? "#22c55e" : "#ef4444",
          left:     "50%",
          top:      -30,
          transform: "translateX(-50%)",
        }}
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: [0, 1, 1, 0], y: -40 }}
        transition={{ duration: 1.2, times: [0, 0.1, 0.7, 1] }}
      >
        ⚡ {event.isYes ? "YES WON" : "NO WON"} — Reactive Settlement
      </motion.div>
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

interface Props {
  events: BurstEvent[];
  onRemove: (id: string) => void;
}

export function SettlementBurstContainer({ events, onRemove }: Props) {
  return (
    <AnimatePresence>
      {events.map((e) => (
        <Burst key={e.id} event={e} onDone={() => onRemove(e.id)} />
      ))}
    </AnimatePresence>
  );
}
