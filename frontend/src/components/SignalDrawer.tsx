"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Send,
  Loader2,
  Copy,
  Check,
  Video,
  Play,
  FileCode,
  Sparkles,
} from "lucide-react";
import { EnrichedSignal, ProjectConfig } from "@/types";
import { formatSignalDate, formatSignalTime } from "@/lib/formatters";

interface SignalDrawerProps {
  signal: EnrichedSignal | null;
  projectsConfig: ProjectConfig[];
  onClose: () => void;
  onSignalUpdated: (updated: EnrichedSignal) => void;
}

export function SignalDrawer({
  signal,
  projectsConfig,
  onClose,
  onSignalUpdated,
}: SignalDrawerProps) {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [summaryInput, setSummaryInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [statusState, setStatusState] = useState<"analyzed" | "pending" | "deferred">("analyzed");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [triageSuccess, setTriageSuccess] = useState<string | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync state whenever active signal changes
  useEffect(() => {
    if (signal) {
      const initialProject = signal.projects[0] === "internal_unsorted" ? "" : signal.projects[0] || "";
      setSelectedProject(initialProject);
      setSummaryInput(signal.summary || "");
      setNotesInput(signal.notes || "");
      const existingStatus = Object.values(signal.status)[0]?.state;
      setStatusState(existingStatus || "analyzed");
      setTriageSuccess(null);
      setTriageError(null);
    }
  }, [signal?.id]);

  if (!signal) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(signal.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTriageSuccess(null);
    setTriageError(null);

    try {
      const payload: Record<string, unknown> = {};
      if (selectedProject) {
        payload.projectToAdd = selectedProject;
        payload.statusUpdate = {
          project: selectedProject,
          state: statusState,
        };
      }
      if (summaryInput.trim()) {
        payload.summary = summaryInput.trim();
      }
      if (notesInput.trim()) {
        payload.notes = notesInput.trim();
      }

      const res = await fetch(`/api/signals/${signal.id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update signal via guarded path.");
      }

      const hasResolvedSummary = summaryInput.trim() && signal.defects.isMissingSummary;
      const successMsg = hasResolvedSummary
        ? "Signal updated successfully! Missing Summary defect resolved."
        : data.message || "Updated successfully via guarded atomic write.";

      setTriageSuccess(successMsg);
      if (data.signal) {
        onSignalUpdated(data.signal);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing guarded mutation";
      setTriageError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-2xl bg-white border-l border-zinc-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <span className="font-extrabold text-zinc-950 text-base sm:text-lg">Signal Inspector</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                {signal.type}
              </span>
            </div>

            <button
              type="button"
              suppressHydrationWarning
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Title & Immutable Identity */}
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-zinc-950 leading-snug">
                {signal.title}
              </h2>

              {/* Stable Identity Box */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-700 font-bold flex items-center uppercase tracking-wider text-[11px]">
                    <Lock className="h-3 w-3 mr-1.5 text-amber-600" />
                    Immutable Detector Identity
                  </span>
                  <button
                    suppressHydrationWarning
                    onClick={handleCopyId}
                    className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "COPIED" : "COPY ID"}</span>
                  </button>
                </div>
                <div className="text-zinc-950 break-all select-all font-mono font-bold bg-white p-2.5 rounded border border-zinc-300 shadow-2xs">
                  {signal.id}
                </div>
                <div className="pt-1 text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Match Key: {signal.match_key}</span>
                  <span title="When the automated ingestion run processed this recording">
                    Ingest Run: {formatSignalDate(signal.detected_on)}
                  </span>
                </div>
              </div>
            </div>

            {/* Date, Time & Projects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-xs font-mono font-bold text-zinc-500 flex items-center mb-1 uppercase">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Meeting Time
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    {formatSignalDate(signal.date)} · {formatSignalTime(signal.time)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Recorded: {signal.date} at {signal.time}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-xs font-mono font-bold text-zinc-500 mb-1.5 block uppercase">
                  Assigned Projects
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {signal.projects.map((pId) => (
                    <span
                      key={pId}
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                        pId === "internal_unsorted"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {pId}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Defect Alerts (Pure SVGs, No Emojis) */}
            {(signal.defects.isUnrouted ||
              signal.defects.isMissingSummary ||
              signal.defects.hasDanglingRun ||
              signal.defects.isDuplicate) && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center space-x-2 text-rose-800 font-mono font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>Seeded Fixture Defects Detected</span>
                </div>
                <ul className="text-xs font-mono text-zinc-700 space-y-1.5 pl-5 list-disc">
                  {signal.defects.isUnrouted && (
                    <li>
                      <strong className="text-rose-700">Unrouted Signal:</strong> No project
                      matched during detection. Currently routed to <code>internal_unsorted</code>.
                    </li>
                  )}
                  {signal.defects.isMissingSummary && (
                    <li>
                      <strong className="text-amber-800">Missing Summary:</strong> Marked as analyzed
                      but summary is null.
                    </li>
                  )}
                  {signal.defects.hasDanglingRun && (
                    <li>
                      <strong className="text-purple-800">Dangling Analysis Ref:</strong> Points to{" "}
                      <code>run-999</code> which does not exist in run log.
                    </li>
                  )}
                  {signal.defects.isDuplicate && (
                    <li>
                      <strong className="text-cyan-800">Near-Duplicate Meeting:</strong> Detected as
                      a rescheduled duplicate of another meeting.
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Attendees */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider flex items-center">
                <Users className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Attendees ({signal.attendees.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {signal.attendees.map((a) => (
                  <div
                    key={a}
                    className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-mono font-semibold flex items-center justify-between"
                  >
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary / Notes */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider flex items-center">
                <FileText className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Summary &amp; Operational Notes
              </span>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed">
                {signal.summary ? (
                  signal.summary
                ) : (
                  <span className="text-zinc-500 italic">
                    Summary is currently null. Use the guarded triage form below to append verified
                    notes or route this record.
                  </span>
                )}
                {signal.notes && (
                  <div className="mt-3 pt-3 border-t border-zinc-200">
                    <strong className="text-emerald-700 block text-xs uppercase font-mono mb-1">
                      Operator Notes:
                    </strong>
                    <div className="text-zinc-900 font-mono text-xs font-medium">{signal.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Source Materials & Recording Artifacts */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider flex items-center">
                <Video className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
                Source Materials &amp; Media Recording
              </span>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                {/* Video Item */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center flex-shrink-0">
                      <Video className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-zinc-900 flex items-center space-x-2">
                        <span>Video Recording (.mp4)</span>
                        {signal.sources.recording ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Attached
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px]">
                            Not Captured
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-600 break-all select-all">
                        {signal.sources.recording ? signal.sources.recording : "No video source recorded"}
                      </div>
                    </div>
                  </div>

                  {signal.sources.recording && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                      1080p MP4
                    </span>
                  )}
                </div>

                {/* Video Player / Ingest Stream Mockup */}
                {signal.sources.recording ? (
                  <div className="rounded-xl border border-zinc-300 bg-zinc-950 p-4 text-center text-white space-y-2 relative overflow-hidden group shadow-inner">
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto text-emerald-400 group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                    <div className="text-xs font-mono font-bold tracking-tight">
                      {signal.title} — Meeting Recording
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400">
                      Recorded {formatSignalDate(signal.date)} at {formatSignalTime(signal.time)} • File: {signal.sources.recording.split("/").pop()}
                    </p>
                    <div className="pt-1 text-[10px] font-mono text-emerald-400/90 flex items-center justify-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Fixture Ingest Storage Reference Verified</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-500 text-xs font-mono">
                    Host did not record video for this meeting.
                  </div>
                )}

                {/* Transcripts & Granola Files */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Transcript */}
                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-xs font-mono">
                    <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase font-bold mb-1">
                      <span className="flex items-center space-x-1">
                        <FileText className="h-3 w-3 text-sky-600" />
                        <span>Transcript (.txt)</span>
                      </span>
                      <span>{signal.sources.transcript ? "Available" : "None"}</span>
                    </div>
                    <div className="text-zinc-900 font-semibold truncate text-[11px]" title={signal.sources.transcript || ""}>
                      {signal.sources.transcript ? signal.sources.transcript.split("/").pop() : "No transcript file"}
                    </div>
                  </div>

                  {/* Granola Note */}
                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-xs font-mono">
                    <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase font-bold mb-1">
                      <span className="flex items-center space-x-1">
                        <FileCode className="h-3 w-3 text-emerald-600" />
                        <span>Granola Note (.md)</span>
                      </span>
                      <span>{signal.sources.granola_note ? "Available" : "None"}</span>
                    </div>
                    <div className="text-zinc-900 font-semibold truncate text-[11px]" title={signal.sources.granola_note || ""}>
                      {signal.sources.granola_note ? signal.sources.granola_note.split("/").pop() : "No granola note"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guarded Triage Form */}
            <div className="pt-4 border-t border-zinc-200">
              <div className="p-5 rounded-xl bg-emerald-50/50 border-2 border-emerald-300 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-800 font-mono font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>Guarded Write: Triage &amp; Re-Route</span>
                </div>
                <p className="text-xs text-zinc-600 font-medium">
                  All updates are validated server-side to enforce immutable detector identity and guarantee atomic ledger persistence.
                </p>

                <form onSubmit={handleTriageSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-700 mb-1 uppercase">
                      Assign to Project:
                    </label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full bg-white border border-zinc-300 focus:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none"
                    >
                      <option value="">Select Project to route...</option>
                      {projectsConfig.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProject && (
                    <div>
                      <label className="block text-xs font-mono font-bold text-zinc-700 mb-1 uppercase">
                        Project Status:
                      </label>
                      <select
                        value={statusState}
                        onChange={(e) =>
                          setStatusState(e.target.value as "analyzed" | "pending" | "deferred")
                        }
                        className="w-full bg-white border border-zinc-300 focus:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none"
                      >
                        <option value="analyzed">Analyzed</option>
                        <option value="pending">Pending</option>
                        <option value="deferred">Deferred</option>
                      </select>
                    </div>
                  )}

                  {/* Summary Field (Resolves Missing Summary Defect) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-mono font-bold text-zinc-700 uppercase">
                        Meeting Summary:
                      </label>
                      {signal.defects.isMissingSummary && !signal.summary && (
                        <span className="text-[10px] font-mono text-amber-800 font-bold bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                          Fill to resolve Missing Summary
                        </span>
                      )}
                    </div>
                    <textarea
                      value={summaryInput}
                      onChange={(e) => setSummaryInput(e.target.value)}
                      rows={2}
                      placeholder="Enter verified meeting summary or decision..."
                      className="w-full bg-white border border-zinc-300 focus:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-700 mb-1 uppercase">
                      Append Verified Notes:
                    </label>
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      rows={2}
                      placeholder="Add verified notes or triage decision..."
                      className="w-full bg-white border border-zinc-300 focus:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none"
                    />
                  </div>

                  {triageSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>{triageSuccess}</span>
                    </div>
                  )}

                  {triageError && (
                    <div className="p-3 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-xs font-mono">
                      {triageError}
                    </div>
                  )}

                  <button
                    type="submit"
                    suppressHydrationWarning
                    disabled={isSubmitting || (!selectedProject && !notesInput && !summaryInput)}
                    className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Send className="h-3.5 w-3.5 text-white" />
                    )}
                    <span>Commit Triage via Guarded Path</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
