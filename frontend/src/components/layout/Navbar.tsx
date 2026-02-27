"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useChainId, useAccount } from "wagmi";
import { CreateMarketModal } from "@/components/market/CreateMarketModal";
import { isCorrectChain } from "@/lib/contracts/addresses";
import { useUsernames } from "@/context/UserContext";

export function Navbar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const chainId   = useChainId();
  const onSomnia  = isCorrectChain(chainId);
  const { address, isConnected } = useAccount();
  const { myUsername, setUsername } = useUsernames();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) {
      setNameInput(myUsername ?? "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editingName, myUsername]);

  function saveName() {
    if (address && nameInput.trim()) setUsername(address, nameInput.trim());
    setEditingName(false);
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full bg-pulse-gradient animate-pulse-glow" />
                <div className="absolute inset-[2px] rounded-full bg-dark-500 flex items-center justify-center">
                  <span className="text-pulse-500 font-black text-sm">P</span>
                </div>
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="text-white">Pulse</span>
                <span className="text-pulse-500"> Market</span>
              </span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                Markets
              </Link>
              <a
                href="https://shannon-explorer.somnia.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Explorer
              </a>
              <a
                href="https://testnet.somnia.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Faucet
              </a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSomnia && setIsCreateOpen(true)}
                title={onSomnia ? undefined : "Switch to Somnia Testnet"}
                className={`btn-primary hidden sm:inline-flex transition-opacity ${!onSomnia ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Market
              </button>
              {/* Username badge */}
              {isConnected && (
                <div className="hidden sm:flex items-center">
                  {editingName ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); saveName(); }}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        ref={inputRef}
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onBlur={saveName}
                        onKeyDown={(e) => e.key === "Escape" && setEditingName(false)}
                        maxLength={20}
                        placeholder="your name"
                        className="w-28 px-2 py-1 text-xs rounded-lg bg-white/8 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-pulse-500"
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                      title="Set display name"
                    >
                      <span className="font-medium">
                        {myUsername ?? "set name"}
                      </span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              <ConnectButton
                chainStatus="icon"
                showBalance={false}
                accountStatus="avatar"
              />
            </div>
          </div>
        </div>
      </nav>

      <CreateMarketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
}
