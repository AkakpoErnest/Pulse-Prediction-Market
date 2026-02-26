"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useCreateMarket } from "@/hooks/useMarketActions";
import { useSubscribeMarket } from "@/hooks/useMarketActions";
import { ComparisonOp, CreateMarketForm } from "@/types";
import {
  TRANSFER_TOPIC,
  COMPARISON_OP_LABELS,
  CREATION_BOND_ETH,
} from "@/constants";
import { WELL_KNOWN_TOPICS as TOPICS_MAP } from "@/lib/contracts/encode";

const DURATION_OPTIONS_LOCAL = [
  { label: "5 minutes",  value: 300 },
  { label: "1 hour",     value: 3600 },
  { label: "6 hours",    value: 21600 },
  { label: "1 day",      value: 86400 },
  { label: "3 days",     value: 259200 },
  { label: "7 days",     value: 604800 },
];

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

const DEFAULT_FORM: CreateMarketForm = {
  question:        "",
  watchedContract: "",
  eventTopic:      TRANSFER_TOPIC,
  conditionOp:     ComparisonOp.GT,
  threshold:       "100",
  durationSeconds: 3600,
};

export function CreateMarketModal({ isOpen, onClose }: Props) {
  const { address }    = useAccount();
  const [form, setForm] = useState<CreateMarketForm>(DEFAULT_FORM);
  const [step, setStep] = useState<1 | 2>(1);
  const [lastMarketId, setLastMarketId] = useState<bigint | null>(null);

  const {
    createMarket,
    hash:        createHash,
    isPending:   isCreating,
    isSuccess:   createSuccess,
    error:       createError,
    reset:       resetCreate,
  } = useCreateMarket();

  const {
    subscribeMarket,
    isPending:  isSubscribing,
    isSuccess:  subscribeSuccess,
  } = useSubscribeMarket();

  // After market is created successfully, move to step 2 (subscribe)
  useEffect(() => {
    if (createSuccess) {
      setStep(2);
    }
  }, [createSuccess]);

  // After subscribe success, close modal
  useEffect(() => {
    if (subscribeSuccess) {
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  }, [subscribeSuccess]);

  function handleClose() {
    setForm(DEFAULT_FORM);
    setStep(1);
    resetCreate();
    onClose();
  }

  function handleSubmitStep1(e: React.FormEvent) {
    e.preventDefault();
    createMarket(form);
  }

  function update<K extends keyof CreateMarketForm>(key: K, value: CreateMarketForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const knownTopics = Object.entries(TOPICS_MAP);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass-card rounded-3xl p-8 w-full max-w-lg pointer-events-auto shadow-glass">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-white">Create Market</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {step === 1 ? "Step 1 of 2: Market details" : "Step 2 of 2: Register with Reactivity"}
                  </p>
                </div>
                <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-2 mb-6">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      s <= step ? "bg-pulse-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {step === 1 && (
                <form onSubmit={handleSubmitStep1} className="space-y-5">
                  {/* Question */}
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Market Question *</label>
                    <textarea
                      value={form.question}
                      onChange={(e) => update("question", e.target.value)}
                      className="input-field resize-none h-20"
                      placeholder="Will the next STT transfer be > 100 STT?"
                      maxLength={280}
                      required
                    />
                    <p className="text-xs text-slate-600 mt-1 text-right">{form.question.length}/280</p>
                  </div>

                  {/* Watched Contract */}
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Watched Contract Address *</label>
                    <input
                      type="text"
                      value={form.watchedContract}
                      onChange={(e) => update("watchedContract", e.target.value)}
                      className="input-field font-mono text-sm"
                      placeholder="0x..."
                      pattern="^0x[0-9a-fA-F]{40}$"
                      required
                    />
                  </div>

                  {/* Event Topic */}
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Event to Watch *</label>
                    <select
                      value={form.eventTopic}
                      onChange={(e) => update("eventTopic", e.target.value as `0x${string}`)}
                      className="input-field"
                    >
                      {knownTopics.map(([sig, topic]) => (
                        <option key={topic} value={topic}>{sig}</option>
                      ))}
                    </select>
                  </div>

                  {/* Condition */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">Comparison</label>
                      <select
                        value={form.conditionOp}
                        onChange={(e) => update("conditionOp", Number(e.target.value) as ComparisonOp)}
                        className="input-field"
                      >
                        {Object.entries(COMPARISON_OP_LABELS).map(([op, label]) => (
                          <option key={op} value={op}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">Threshold (STT)</label>
                      <input
                        type="number"
                        value={form.threshold}
                        onChange={(e) => update("threshold", e.target.value)}
                        className="input-field"
                        placeholder="100"
                        min="0"
                        step="any"
                        required
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Market Duration</label>
                    <select
                      value={form.durationSeconds}
                      onChange={(e) => update("durationSeconds", Number(e.target.value))}
                      className="input-field"
                    >
                      {DURATION_OPTIONS_LOCAL.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cost notice */}
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-pulse-500/10 border border-pulse-500/20 text-xs text-slate-300">
                    <svg className="w-4 h-4 text-pulse-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Creation bond: <strong className="text-white">{CREATION_BOND_ETH} STT</strong> — counts as your initial YES bet.
                  </div>

                  {createError && (
                    <p className="text-xs text-red-400">
                      {(createError as any).shortMessage ?? createError.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!address || isCreating}
                    className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {!address
                      ? "Connect Wallet First"
                      : isCreating
                      ? "Creating Market..."
                      : "Create Market →"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Market Created!</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      Now register it with Somnia's Reactivity layer so it auto-settles
                      the instant the watched event fires.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-somnia-500/10 border border-somnia-500/20 text-xs text-slate-300">
                    <span className="text-somnia-400">⚡</span>
                    This registers your market with the on-chain reactive subscription system.
                  </div>

                  {subscribeSuccess ? (
                    <div className="text-emerald-400 font-semibold">
                      Subscribed! Market will auto-settle when the event fires.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // We grab the last market ID from the contract's counter - 1
                        // In production, parse this from the tx receipt event log
                        subscribeMarket(BigInt(0)); // placeholder — update after parsing tx
                      }}
                      disabled={isSubscribing}
                      className="btn-primary w-full"
                    >
                      {isSubscribing ? "Subscribing..." : "Register with Reactivity →"}
                    </button>
                  )}

                  {!subscribeSuccess && (
                    <button
                      onClick={handleClose}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Skip for now (settle manually later)
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
