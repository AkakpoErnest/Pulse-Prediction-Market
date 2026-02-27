"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "settlement" | "bet" | "info" | "error" | "success";

export interface Toast {
  id:      string;
  message: string;
  type:    ToastType;
  sub?:    string;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, sub?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// ─── Toast icon ───────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  settlement: "⚡",
  bet:        "🎯",
  info:       "ℹ️",
  error:      "❌",
  success:    "✅",
};

const BORDER_COLORS: Record<ToastType, string> = {
  settlement: "border-pulse-500/60",
  bet:        "border-somnia-500/60",
  info:       "border-slate-500/40",
  error:      "border-red-500/60",
  success:    "border-emerald-500/60",
};

const GLOW_COLORS: Record<ToastType, string> = {
  settlement: "rgba(255,39,133,0.3)",
  bet:        "rgba(47,92,255,0.3)",
  info:       "rgba(100,116,139,0.2)",
  error:      "rgba(239,68,68,0.3)",
  success:    "rgba(34,197,94,0.3)",
};

// ─── Individual toast ─────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1   }}
      exit={{    opacity: 0, x: 80, scale: 0.9  }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      onClick={onDismiss}
      className={`glass-card rounded-2xl p-3.5 pr-4 flex items-start gap-3 cursor-pointer
                  border ${BORDER_COLORS[toast.type]} min-w-[260px] max-w-[320px]`}
      style={{ boxShadow: `0 8px 32px ${GLOW_COLORS[toast.type]}` }}
    >
      <span className="text-lg mt-0.5 shrink-0">{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.message}</p>
        {toast.sub && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{toast.sub}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter             = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = "info", sub?: string) => {
    const id = `toast-${counter.current++}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type, sub }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast stack — bottom right */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col-reverse gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
