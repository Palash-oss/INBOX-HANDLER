"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-6 text-zinc-900 font-sans">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-8 shadow-xl shadow-rose-950/5 text-center">
          <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mb-2">
            System Failure
          </h2>
          <p className="text-sm text-zinc-600 mb-6 font-mono">
            {error?.message || "Critical layout rendering error."}
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Restart Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
