"use client";

import React from "react";
import { Database, AlertCircle, FileCode2 } from "lucide-react";

interface HeaderProps {
  totalSignals: number;
  unroutedCount: number;
  onOpenExplainer: () => void;
}

export function Header({ totalSignals, unroutedCount, onOpenExplainer }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 min-h-16 flex items-center justify-between py-2.5 sm:py-3">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6 text-[#10b981]"
            >
              <path
                d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
                fill="#10b981"
              />
              <circle cx="12" cy="10" r="2.5" fill="#ffffff" />
              <path
                d="M12 18L13.5 22L12 20.5L10.5 22L12 18Z"
                fill="#10b981"
                opacity="0.8"
              />
              <circle cx="18" cy="16" r="1.2" fill="#10b981" />
              <circle cx="6" cy="16" r="1.2" fill="#10b981" />
            </svg>
          </div>

          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-zinc-950 text-lg sm:text-xl tracking-tight uppercase">
                Supanova
              </span>
              <span className="text-zinc-300 font-light">/</span>
              <span className="font-mono text-emerald-600 font-bold text-xs sm:text-sm tracking-wider uppercase">
                Inbox
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wider uppercase">
                v4 Ledger
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono tracking-tight hidden md:block">
              Continuous Ingest &amp; Deterministic Routing Engine
            </p>
          </div>
        </div>

        {/* Telemetry Badges & Design Memo Trigger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Ingest Telemetry Pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <Database className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              <strong className="text-zinc-900 font-bold">{totalSignals}</strong> Records
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-600">5 Projects</span>
          </div>

          {/* Unrouted Alert Chip */}
          {unroutedCount > 0 && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs font-mono text-rose-700 font-bold">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>{unroutedCount} Unrouted</span>
            </div>
          )}

          {/* Architecture / Design Memo Button */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={onOpenExplainer}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <FileCode2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline">LIKE vs Model Memo</span>
            <span className="sm:hidden">Architecture</span>
          </button>
        </div>
      </div>
    </header>
  );
}
