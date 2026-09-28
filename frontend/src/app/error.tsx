"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-8 shadow-xl shadow-rose-950/5 text-center">
        <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mb-2">
          Control Plane Disconnected
        </h2>
        <p className="text-sm text-zinc-600 mb-6 font-mono leading-relaxed">
          {error?.message || "An unexpected error occurred while synchronizing ledger signals."}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
}
