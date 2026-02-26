"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState } from "react";
import { CreateMarketModal } from "@/components/market/CreateMarketModal";

export function Navbar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
                onClick={() => setIsCreateOpen(true)}
                className="btn-primary hidden sm:inline-flex"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Market
              </button>
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
