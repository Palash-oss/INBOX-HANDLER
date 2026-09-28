"use client";

import React from "react";
import { X, Database, ShieldCheck, Scale } from "lucide-react";

interface ModelExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelExplainerModal({ isOpen, onClose }: ModelExplainerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-3xl p-6 sm:p-8 my-8 text-left align-middle transition-all transform bg-white border border-zinc-200 rounded-2xl shadow-2xl relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
                <Scale className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 uppercase tracking-tight">
                  Architecture &amp; Product Decisions Memo
                </h3>
                <p className="text-xs font-mono text-zinc-500">
                  Supanova Labs Internal Ledger Search Evaluation
                </p>
              </div>
            </div>

            <button
              suppressHydrationWarning
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Section 1: When is a model worth it vs LIKE */}
          <div className="space-y-3">
            <h4 className="text-sm font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center">
              <Database className="h-4 w-4 mr-2 text-emerald-600" />
              1. When is a Model Worth It vs. a LIKE Query?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                  When a `LIKE` / Inverted Query Wins:
                </span>
                <ul className="text-zinc-700 space-y-1.5 list-disc pl-4 font-mono leading-relaxed text-[11px]">
                  <li>
                    <strong>Exact Identifiers &amp; Handles:</strong> Looking up{" "}
                    <code>dana@northwind.example</code>, <code>harborline</code>, or a date range is
                    deterministic, instantaneous (&lt;1ms), and 100% accurate.
                  </li>
                  <li>
                    <strong>Zero Inference Cost:</strong> No token bills, zero external API keys,
                    and executes entirely offline on local files or embedded SQLite.
                  </li>
                  <li>
                    <strong>Metadata Scale:</strong> For 77 to 10,000 ledger records with
                    structured metadata, lexical search is 100x faster and never hallucinates.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="font-mono font-bold text-sky-800 uppercase tracking-wider block">
                  When a Model (Embeddings / Vector) Wins:
                </span>
                <ul className="text-zinc-700 space-y-1.5 list-disc pl-4 font-mono leading-relaxed text-[11px]">
                  <li>
                    <strong>Unstructured Transcript Search:</strong> When operators search for
                    high-level concepts (e.g. <em>&quot;manifest billing delays&quot;</em>) across a 45-minute
                    audio transcript where the literal word &quot;delays&quot; was never uttered.
                  </li>
                  <li>
                    <strong>Synonym &amp; Intent Matching:</strong> Resolving conceptual equivalents
                    across unstandardized notes and raw summaries.
                  </li>
                  <li>
                    <strong>Winning Production Design:</strong> A <strong>Hybrid Search</strong> architecture
                    combining lexical filters (FTS5 / LIKE) for metadata with vector embeddings for
                    transcripts via Reciprocal Rank Fusion (RRF).
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Product Decision Defended */}
          <div className="space-y-3 pt-3 border-t border-zinc-200">
            <h4 className="text-sm font-mono font-bold text-rose-700 uppercase tracking-wider flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-rose-600" />
              2. Defended Product Decision: Active Triage vs. Silent Failures
            </h4>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 leading-relaxed space-y-2.5">
              <p>
                <strong className="text-zinc-950">The Unmade Decision in the Brief:</strong> The synthetic
                fixture contains deliberate defects: 9 unrouted signals (<code>internal_unsorted</code>), 27
                analyzed signals with no summary, and 3 dangling analysis references (<code>run-999</code>).
                Should search hide these incomplete records or surface them?
              </p>
              <p>
                <strong className="text-emerald-800">Our Decision:</strong> We implemented{" "}
                <strong>Transparent Triage Surfacing</strong>. Search explicitly flags these signals
                with high-visibility warning badges (<code>NEEDS ROUTING</code>,{" "}
                <code>MISSING SUMMARY</code>, <code>DANGLING REF</code>) and provides an instant
                1-click Guarded Triage workflow in the slide-over drawer to assign projects and append
                verified notes.
              </p>
              <p>
                <strong className="text-rose-700">The Defense:</strong> Inbox is an internal operator
                control plane, not a consumer search engine. Hiding incomplete or unrouted records
                causes meetings to fall through the cracks. Surfacing them transforms search from a
                passive lookup tool into an <em>active operational repair hub</em>.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              suppressHydrationWarning
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            >
              Acknowledge &amp; Close Memo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
