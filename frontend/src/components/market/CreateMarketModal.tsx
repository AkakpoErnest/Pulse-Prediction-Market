"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseEventLogs } from "viem";
import { useAccount } from "wagmi";
import { useCreateMarket, useSubscribeMarket } from "@/hooks/useMarketActions";
import { PULSE_MARKET_ABI } from "@/lib/contracts/abis";
import { ComparisonOp, CreateMarketForm } from "@/types";
import { COMPARISON_OP_LABELS, CREATION_BOND_ETH } from "@/constants";
import { WELL_KNOWN_TOPICS as TOPICS_MAP } from "@/lib/contracts/encode";

// ── Simple-mode templates ──────────────────────────────────────────────────────

interface Template {
  id:          string;
  icon:        string;
  label:       string;
  description: string;
  eventTopic:  `0x${string}`;
  conditionOp: ComparisonOp;
  makeQuestion:(contract: string, threshold: string) => string;
}

const TEMPLATES: Template[] = [
  {
    id:          "transfer",
    icon:        "⚡",
    label:       "Transfer Size",
    description: "Resolves when a token transfer exceeds your threshold.",
    eventTopic:  TOPICS_MAP["Transfer(address,address,uint256)"],
    conditionOp: ComparisonOp.GT,
    makeQuestion: (c, t) =>
      `Will the next transfer on ${c.slice(0, 6)}…${c.slice(-4)} exceed ${t} STT?`,
  },
  {
    id:          "approval",
    icon:        "✅",
    label:       "Approval Size",
    description: "Resolves when an approval amount meets your threshold.",
    eventTopic:  TOPICS_MAP["Approval(address,address,uint256)"],
    conditionOp: ComparisonOp.GTE,
    makeQuestion: (c, t) =>
      `Will an approval on ${c.slice(0, 6)}…${c.slice(-4)} be ≥ ${t} STT?`,
  },
  {
    id:          "swap",
    icon:        "🔄",
    label:       "Swap Volume",
    description: "Resolves when a swap amount exceeds your threshold.",
    eventTopic:  TOPICS_MAP["Swap(address,uint256,uint256,uint256,uint256,address)"],
    conditionOp: ComparisonOp.GT,
    makeQuestion: (c, t) =>
      `Will the next swap on ${c.slice(0, 6)}…${c.slice(-4)} exceed ${t} STT?`,
  },
];

// ── Shared options ─────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: "5 minutes", value: 300    },
  { label: "1 hour",    value: 3600   },
  { label: "6 hours",   value: 21600  },
  { label: "1 day",     value: 86400  },
  { label: "3 days",    value: 259200 },
  { label: "7 days",    value: 604800 },
];

const DEFAULT_FORM: CreateMarketForm = {
  question:        "",
  watchedContract: "",
  eventTopic:      TOPICS_MAP["Transfer(address,address,uint256)"],
  conditionOp:     ComparisonOp.GT,
  threshold:       "100",
  durationSeconds: 3600,
};

type Mode = "simple" | "advanced";

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CreateMarketModal({ isOpen, onClose }: Props) {
  const { address } = useAccount();

  // modal state
  const [mode, setMode]   = useState<Mode>("simple");
  const [step, setStep]   = useState<1 | 2>(1);
  const [lastMarketId, setLastMarketId] = useState<bigint | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  // simple-mode state
  const [template, setTemplate]             = useState<Template>(TEMPLATES[0]);
  const [simpleContract, setSimpleContract] = useState("");
  const [simpleThreshold, setSimpleThreshold] = useState("100");
  const [simpleDuration, setSimpleDuration]   = useState(3600);

  // advanced-mode state
  const [form, setForm] = useState<CreateMarketForm>(DEFAULT_FORM);

  const {
    createMarket,
    receipt:   createReceipt,
    isPending: isCreating,
    isSuccess: createSuccess,
    error:     createError,
    reset:     resetCreate,
  } = useCreateMarket();

  const {
    subscribeMarket,
    isPending: isSubscribing,
    isSuccess: subscribeSuccess,
  } = useSubscribeMarket();

  const handleClose = useCallback(() => {
    setStep(1);
    setMode("simple");
    setTemplate(TEMPLATES[0]);
    setSimpleContract("");
    setSimpleThreshold("100");
    setSimpleDuration(3600);
    setForm(DEFAULT_FORM);
    setLastMarketId(null);
    setShowSkipWarning(false);
    resetCreate();
    onClose();
  }, [onClose, resetCreate]);

  // Parse real marketId from receipt logs
  useEffect(() => {
    if (createSuccess && createReceipt) {
      try {
        const logs = parseEventLogs({
          abi:       PULSE_MARKET_ABI,
          eventName: "MarketCreated",
          logs:      createReceipt.logs,
        });
        if (logs.length > 0) {
          setLastMarketId((logs[0].args as { marketId: bigint }).marketId);
        }
      } catch (_) {}
      setStep(2);
    }
  }, [createSuccess, createReceipt]);

  useEffect(() => {
    if (!subscribeSuccess) return;
    const timeoutId = setTimeout(handleClose, 1500);
    return () => clearTimeout(timeoutId);
  }, [subscribeSuccess, handleClose]);

  function handleSimpleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMarket({
      question:        template.makeQuestion(simpleContract, simpleThreshold),
      watchedContract: simpleContract,
      eventTopic:      template.eventTopic,
      conditionOp:     template.conditionOp,
      threshold:       simpleThreshold,
      durationSeconds: simpleDuration,
    });
  }

  function handleAdvancedSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMarket(form);
  }

  function update<K extends keyof CreateMarketForm>(k: K, v: CreateMarketForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const validSimpleContract = /^0x[0-9a-fA-F]{40}$/.test(simpleContract);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 20  }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass-card rounded-3xl p-8 w-full max-w-lg pointer-events-auto shadow-glass max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-white">Create Market</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {step === 1 ? "Step 1 of 2 — Market details" : "Step 2 of 2 — Register with Reactivity"}
                  </p>
                </div>
                <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex gap-2 mb-5">
                {[1, 2].map((s) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-pulse-500" : "bg-white/10"}`} />
                ))}
              </div>

              {/* ── Step 1 ──────────────────────────────────────────────────── */}
              {step === 1 && (
                <>
                  {/* Mode toggle */}
                  <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-5">
                    {(["simple", "advanced"] as Mode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                          mode === m
                            ? "bg-pulse-500 text-white shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {m === "simple" ? "⚡ Simple" : "⚙️ Advanced"}
                      </button>
                    ))}
                  </div>

                  {/* ── Simple form ── */}
                  {mode === "simple" && (
                    <form onSubmit={handleSimpleSubmit} className="space-y-5">
                      {/* Template picker */}
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">What do you want to watch?</label>
                        <div className="grid grid-cols-3 gap-2">
                          {TEMPLATES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setTemplate(t)}
                              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all duration-200 ${
                                template.id === t.id
                                  ? "border-pulse-500 bg-pulse-500/10 text-white"
                                  : "border-white/10 bg-white/3 text-slate-400 hover:border-white/20 hover:text-slate-200"
                              }`}
                            >
                              <span className="text-xl">{t.icon}</span>
                              <span className="text-xs font-semibold leading-tight">{t.label}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">{template.description}</p>
                      </div>

                      {/* Contract address */}
                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">Contract to watch *</label>
                        <input
                          type="text"
                          value={simpleContract}
                          onChange={(e) => setSimpleContract(e.target.value)}
                          className={`input-field font-mono text-sm ${simpleContract && !validSimpleContract ? "border-red-500/50" : ""}`}
                          placeholder="0x…"
                          pattern="^0x[0-9a-fA-F]{40}$"
                          required
                        />
                        {simpleContract && !validSimpleContract && (
                          <p className="text-xs text-red-400 mt-1">Must be a valid 0x address (42 chars)</p>
                        )}
                      </div>

                      {/* Threshold + Duration side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-slate-400 mb-1.5 block">Threshold (STT)</label>
                          <input
                            type="number"
                            value={simpleThreshold}
                            onChange={(e) => setSimpleThreshold(e.target.value)}
                            className="input-field"
                            placeholder="100"
                            min="0"
                            step="any"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400 mb-1.5 block">Duration</label>
                          <select
                            value={simpleDuration}
                            onChange={(e) => setSimpleDuration(Number(e.target.value))}
                            className="input-field"
                          >
                            {DURATION_OPTIONS.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Auto-generated question preview */}
                      <AnimatePresence>
                        {validSimpleContract && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{    opacity: 0, height: 0 }}
                            className="px-3 py-2.5 rounded-xl bg-white/3 border border-white/8 text-xs"
                          >
                            <span className="text-slate-500">Auto question: </span>
                            <span className="text-slate-300 italic">
                              {template.makeQuestion(simpleContract, simpleThreshold)}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <CostNotice />

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
                        {!address ? "Connect Wallet First" : isCreating ? "Creating…" : "Create Market →"}
                      </button>
                    </form>
                  )}

                  {/* ── Advanced form ── */}
                  {mode === "advanced" && (
                    <form onSubmit={handleAdvancedSubmit} className="space-y-5">
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

                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">Watched Contract Address *</label>
                        <input
                          type="text"
                          value={form.watchedContract}
                          onChange={(e) => update("watchedContract", e.target.value)}
                          className={`input-field font-mono text-sm ${form.watchedContract && !/^0x[0-9a-fA-F]{40}$/.test(form.watchedContract) ? "border-red-500/50" : ""}`}
                          placeholder="0x..."
                          pattern="^0x[0-9a-fA-F]{40}$"
                          required
                        />
                        {form.watchedContract && !/^0x[0-9a-fA-F]{40}$/.test(form.watchedContract) && (
                          <p className="text-xs text-red-400 mt-1">Must be a valid 0x address (42 chars)</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">Event to Watch *</label>
                        <select
                          value={form.eventTopic}
                          onChange={(e) => update("eventTopic", e.target.value as `0x${string}`)}
                          className="input-field"
                        >
                          {Object.entries(TOPICS_MAP).map(([sig, topic]) => (
                            <option key={topic} value={topic}>{sig}</option>
                          ))}
                        </select>
                      </div>

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

                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">Market Duration</label>
                        <select
                          value={form.durationSeconds}
                          onChange={(e) => update("durationSeconds", Number(e.target.value))}
                          className="input-field"
                        >
                          {DURATION_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>

                      <CostNotice />

                      {createError && (
                        <p className="text-xs text-red-400">
                          {(createError as any).shortMessage ?? createError.message}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={!address || isCreating || form.question.trim().length === 0 || form.question.length > 280}
                        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {!address ? "Connect Wallet First" : isCreating ? "Creating…" : "Create Market →"}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* ── Step 2: Subscribe ────────────────────────────────────────── */}
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
	                      Now register it with Somnia&apos;s Reactivity layer so it auto-settles
	                      the instant the watched event fires.
	                    </p>
	                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-somnia-500/10 border border-somnia-500/20 text-xs text-slate-300">
                    <span className="text-somnia-400">⚡</span>
                    Registers with the on-chain reactive subscription system — one tx, no backend.
                  </div>

                  {subscribeSuccess ? (
                    <div className="text-emerald-400 font-semibold animate-pulse">
                      ✓ Subscribed! Market will auto-settle when the event fires.
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (lastMarketId !== null) subscribeMarket(lastMarketId); }}
                      disabled={isSubscribing || lastMarketId === null}
                      className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubscribing
                        ? "Subscribing…"
                        : lastMarketId !== null
                        ? `Register Market #${lastMarketId} with Reactivity →`
                        : "Waiting for confirmation…"}
                    </button>
                  )}

                  {!subscribeSuccess && !showSkipWarning && (
                    <button
                      onClick={() => setShowSkipWarning(true)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Skip for now
                    </button>
                  )}

                  {showSkipWarning && (
                    <div className="px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-300 space-y-2">
                      <p className="font-semibold">⚠ Reactive settlement won&apos;t work without this step.</p>
                      <p className="text-yellow-400/70">Your market will only settle if someone manually triggers it after expiry. Skip anyway?</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleClose}
                          className="flex-1 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors font-medium"
                        >
                          Yes, skip
                        </button>
                        <button
                          onClick={() => setShowSkipWarning(false)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-300"
                        >
                          Go back
                        </button>
                      </div>
                    </div>
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

// ── Shared cost notice ─────────────────────────────────────────────────────────

function CostNotice() {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-pulse-500/10 border border-pulse-500/20 text-xs text-slate-300">
      <svg className="w-4 h-4 text-pulse-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Creation bond: <strong className="text-white ml-1">{CREATION_BOND_ETH} STT</strong>
      <span className="text-slate-500 ml-1">— counts as your initial YES bet.</span>
    </div>
  );
}
