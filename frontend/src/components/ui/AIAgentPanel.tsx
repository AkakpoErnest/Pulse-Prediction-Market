"use client";

import { motion } from "framer-motion";
import { useAIAgents, AgentStatus } from "@/context/AIAgentContext";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<AgentStatus, { label: string; dot: string; text: string }> = {
  idle:      { label: "Idle",      dot: "bg-slate-500",              text: "text-slate-400"  },
  watching:  { label: "Watching",  dot: "bg-blue-500",               text: "text-blue-400"   },
  analyzing: { label: "Analysing", dot: "bg-yellow-400 animate-pulse", text: "text-yellow-400" },
  betting:   { label: "Betting",   dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAgentPanel() {
  const { agents } = useAIAgents();

  const activeCount = agents.filter(a => a.status !== "idle" && a.status !== "watching").length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl select-none">🤖</span>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">AI Agents</h2>
          <p className="text-xs text-slate-500">
            Autonomous agents analysing markets and placing bets in real time
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {activeCount > 0 ? `${activeCount} active` : "watching"}
          </span>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const st      = STATUS[agent.status];
          const total   = agent.wins + agent.losses;
          const winRate = total > 0 ? Math.round((agent.wins / total) * 100) : 0;

          return (
            <motion.div
              key={agent.id}
              layout
              className="glass-card rounded-2xl p-4 border border-white/8 flex flex-col gap-3 hover:border-white/15 transition-colors"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-bold text-sm ${agent.accent}`}>{agent.name}</p>
                  <p className="text-[11px] text-slate-600 font-mono">{agent.model}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                  <span className={`text-[11px] font-semibold ${st.text}`}>{st.label}</span>
                </div>
              </div>

              {/* Strategy */}
              <p className="text-xs text-slate-400 leading-relaxed">{agent.strategy}</p>

              {/* Last action */}
              <div className="text-[11px] text-slate-500 font-mono bg-white/3 rounded-lg px-2.5 py-1.5 truncate min-h-[28px]">
                {agent.lastAction ?? "Monitoring on-chain events…"}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                <div className="text-center">
                  <p className="text-emerald-400 font-bold">{agent.wins}W / {agent.losses}L</p>
                  <p className="text-slate-600 text-[10px]">record</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{winRate}%</p>
                  <p className="text-slate-600 text-[10px]">win rate</p>
                </div>
                <div className="text-center">
                  <p className="text-cyan-400 font-bold">{agent.totalWagered.toFixed(2)}</p>
                  <p className="text-slate-600 text-[10px]">STT wagered</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
