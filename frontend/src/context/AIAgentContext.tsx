"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentStatus = "watching" | "analyzing" | "betting" | "idle";

export interface AIAgent {
  id:           string;
  name:         string;
  model:        string;
  strategy:     string;
  accent:       string;
  wins:         number;
  losses:       number;
  totalWagered: number;
  status:       AgentStatus;
  lastAction?:  string;
}

export interface AgentActivityEvent {
  id:        string;
  agentId:   string;
  agentName: string;
  label:     string;
  isYes?:    boolean;
  timestamp: number;
}

interface AIAgentContextValue {
  agents:      AIAgent[];
  agentEvents: AgentActivityEvent[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_DEFS = [
  {
    id:       "pulse-alpha",
    name:     "Pulse-α",
    model:    "Claude Haiku",
    strategy: "Momentum follower — bets with the trend",
    accent:   "text-cyan-400",
  },
  {
    id:       "somnia-oracle",
    name:     "Somnia Oracle",
    model:    "Claude Sonnet",
    strategy: "On-chain analyst — reads Transfer patterns",
    accent:   "text-purple-400",
  },
  {
    id:       "reactive-bot",
    name:     "ReactiveBot",
    model:    "Claude Opus",
    strategy: "Event detector — specialises in reactive signals",
    accent:   "text-yellow-400",
  },
];

const ANALYZING_PHRASES = [
  "Scanning transfer volume…",
  "Evaluating market odds…",
  "Reading on-chain signals…",
  "Computing edge…",
  "Checking event history…",
  "Calibrating threshold…",
];

const MAX_AGENT_EVENTS = 30;

// ─── Context ──────────────────────────────────────────────────────────────────

const AIAgentContext = createContext<AIAgentContextValue>({
  agents:      [],
  agentEvents: [],
});

export function AIAgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<AIAgent[]>(() =>
    AGENT_DEFS.map(d => ({
      ...d,
      wins:         Math.floor(Math.random() * 18) + 4,
      losses:       Math.floor(Math.random() * 9)  + 2,
      totalWagered: parseFloat((Math.random() * 3 + 0.5).toFixed(3)),
      status:       "watching" as AgentStatus,
    }))
  );

  const [agentEvents, setAgentEvents] = useState<AgentActivityEvent[]>([]);

  const pushEvent = useCallback((ev: AgentActivityEvent) => {
    setAgentEvents(prev => [ev, ...prev].slice(0, MAX_AGENT_EVENTS));
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    AGENT_DEFS.forEach((def, idx) => {
      const scheduleNext = () => {
        // Stagger initial runs so agents don't all fire at once
        const delay = 8_000 + idx * 6_000 + Math.random() * 8_000;

        const t = setTimeout(() => {
          // 1. Analyzing
          const phrase = ANALYZING_PHRASES[Math.floor(Math.random() * ANALYZING_PHRASES.length)];
          setAgents(prev => prev.map(a =>
            a.id === def.id ? { ...a, status: "analyzing", lastAction: phrase } : a
          ));

          // 2. Betting
          const t2 = setTimeout(() => {
            const isYes   = Math.random() > 0.45;
            const amount  = (Math.random() * 0.09 + 0.01).toFixed(3);
            const won     = Math.random() > 0.38;

            setAgents(prev => prev.map(a =>
              a.id === def.id
                ? {
                    ...a,
                    status:       "betting",
                    lastAction:   `Bet ${isYes ? "YES" : "NO"} — ${amount} STT`,
                    wins:         a.wins   + (won ? 1 : 0),
                    losses:       a.losses + (won ? 0 : 1),
                    totalWagered: parseFloat((a.totalWagered + parseFloat(amount)).toFixed(3)),
                  }
                : a
            ));

            pushEvent({
              id:        `agent-${Date.now()}-${def.id}`,
              agentId:   def.id,
              agentName: def.name,
              label:     `${def.name} placed ${isYes ? "YES" : "NO"} — ${amount} STT`,
              isYes,
              timestamp: Date.now(),
            });

            // 3. Back to watching
            const t3 = setTimeout(() => {
              setAgents(prev => prev.map(a =>
                a.id === def.id ? { ...a, status: "watching" } : a
              ));
              scheduleNext();
            }, 3_500);
            timers.push(t3);
          }, 2_000 + Math.random() * 2_000);
          timers.push(t2);
        }, delay);

        timers.push(t);
      };

      scheduleNext();
    });

    return () => timers.forEach(clearTimeout);
  }, [pushEvent]);

  return (
    <AIAgentContext.Provider value={{ agents, agentEvents }}>
      {children}
    </AIAgentContext.Provider>
  );
}

export function useAIAgents() {
  return useContext(AIAgentContext);
}
