"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Video,
  FileCode,
  AlertTriangle,
  ChevronRight,
  Zap,
} from "lucide-react";
import { EnrichedSignal, ProjectConfig } from "@/types";

interface SignalCardProps {
  signal: EnrichedSignal;
  projectsConfig: ProjectConfig[];
  searchQuery?: string;
  onSelect: (signal: EnrichedSignal) => void;
}

const PROJECT_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  northwind: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
  harborline: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  quill: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  atlas: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  studio_ops: { bg: "bg-zinc-100", text: "text-zinc-800", border: "border-zinc-300" },
  internal_unsorted: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

function highlightMatch(text: string, query?: string) {
  if (!query || !query.trim()) return text;
  const parts = query.trim().split(/\s+/).filter(Boolean);
  const regex = new RegExp(`(${parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const splits = text.split(regex);

  return splits.map((part, i) =>
    regex.test(part) ? (
      <mark key={i}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SignalCard({ signal, projectsConfig, searchQuery, onSelect }: SignalCardProps) {
  const primaryProject = signal.projects[0] || "internal_unsorted";
  const projectObj = projectsConfig.find((p) => p.id === primaryProject);
  const projectName = projectObj ? projectObj.name : primaryProject === "internal_unsorted" ? "Unsorted / Triage" : primaryProject;
  const theme = PROJECT_THEMES[primaryProject] || PROJECT_THEMES.internal_unsorted;

  const states = Object.entries(signal.status);
  const primaryState = states.length > 0 ? states[0][1].state : "unrouted";

  return (
    <div
      onClick={() => onSelect(signal)}
      className="group relative bg-white hover:bg-zinc-50/60 border border-zinc-200 hover:border-emerald-500 rounded-xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        {/* Left Column: Metadata Tags & Title */}
        <div className="space-y-2 flex-1">
          {/* Top Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Tag */}
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}
            >
              {projectName}
            </span>

            {/* Status Badge */}
            {primaryState === "analyzed" && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>ANALYZED</span>
              </span>
            )}
            {primaryState === "pending" && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                <span>PENDING</span>
              </span>
            )}
            {primaryState === "deferred" && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                DEFERRED
              </span>
            )}
            {primaryState === "unrouted" && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                UNROUTED
              </span>
            )}

            {/* Seeded Defects Alert Chips (Pure SVGs, No Emojis) */}
            {signal.defects.isUnrouted && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1.5">
                <AlertTriangle className="h-3 w-3 text-rose-600" />
                <span>NEEDS ROUTING</span>
              </span>
            )}
            {signal.defects.isMissingSummary && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>MISSING SUMMARY</span>
              </span>
            )}
            {signal.defects.hasDanglingRun && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center space-x-1.5">
                <AlertTriangle className="h-3 w-3 text-purple-600" />
                <span>DANGLING REF (run-999)</span>
              </span>
            )}
            {signal.defects.isDuplicate && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                NEAR-DUPLICATE
              </span>
            )}

            {/* Relevance Score */}
            {signal.relevanceScore && signal.relevanceScore > 0 ? (
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                <Zap className="h-3 w-3 text-emerald-600" />
                <span>SCORE: {signal.relevanceScore}</span>
              </span>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-zinc-950 group-hover:text-emerald-700 transition-colors leading-snug">
            {highlightMatch(signal.title, searchQuery)}
          </h3>

          {/* Summary / Notes Text */}
          <div className="text-xs sm:text-sm text-zinc-600 line-clamp-2 leading-relaxed">
            {signal.summary ? (
              highlightMatch(signal.summary, searchQuery)
            ) : signal.notes ? (
              <span>
                <strong className="text-zinc-800 uppercase font-mono text-xs">Notes: </strong>
                {highlightMatch(signal.notes, searchQuery)}
              </span>
            ) : (
              <span className="text-zinc-400 italic">
                Summary is currently unpopulated (pending pipeline analysis).
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Date, Time & Link */}
        <div className="flex md:flex-col md:items-end justify-between items-center text-xs font-mono text-zinc-500 space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-zinc-900 font-bold">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>{signal.date}</span>
            </span>
            <span className="flex items-center space-x-1 text-zinc-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{signal.time}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1 text-emerald-700 font-bold group-hover:translate-x-1 transition-all text-xs">
            <span>INSPECT</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Bottom Row: Attendees and Sources */}
      <div className="mt-4 pt-3.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Attendees */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          <Users className="h-3.5 w-3.5 text-zinc-400 mr-1" />
          {signal.attendees.map((attendee) => {
            const handle = attendee.split("@")[0];
            return (
              <span
                key={attendee}
                className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono text-xs font-semibold"
                title={attendee}
              >
                {highlightMatch(handle, searchQuery)}
              </span>
            );
          })}
        </div>

        {/* Source feed icons */}
        <div className="flex items-center space-x-2 text-zinc-500 font-mono text-xs">
          {signal.sources.granola_note && (
            <span
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200"
              title={`Granola Note: ${signal.sources.granola_note}`}
            >
              <FileText className="h-3 w-3 text-emerald-600" />
              <span>Granola</span>
            </span>
          )}
          {signal.sources.transcript && (
            <span
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200"
              title={`Transcript: ${signal.sources.transcript}`}
            >
              <FileCode className="h-3 w-3 text-sky-600" />
              <span>Transcript</span>
            </span>
          )}
          {signal.sources.recording && (
            <span
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200"
              title={`Recording: ${signal.sources.recording}`}
            >
              <Video className="h-3 w-3 text-purple-600" />
              <span>Video</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
