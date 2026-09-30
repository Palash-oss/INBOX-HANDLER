"use client";

import React from "react";
import { ArrowUpDown, RotateCcw, AlertOctagon } from "lucide-react";
import { ProjectConfig, SearchQueryFilters, SortOption } from "@/types";

interface FilterBarProps {
  filters: SearchQueryFilters;
  projects: ProjectConfig[];
  facets: {
    projects: Record<string, number>;
    statuses: Record<string, number>;
    defects: {
      totalDefects: number;
      unrouted: number;
      missingSummary: number;
      danglingRun: number;
      duplicate: number;
    };
  };
  onFilterChange: (updates: Partial<SearchQueryFilters>) => void;
  onReset: () => void;
}

export function FilterBar({
  filters,
  projects,
  facets,
  onFilterChange,
  onReset,
}: FilterBarProps) {
  const hasActiveFilters = Boolean(
    (filters.project && filters.project !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.defect && filters.defect !== "none") ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.q
  );

  return (
    <div className="space-y-4">
      {/* Triage / Anomaly Quick Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
        <span className="text-zinc-500 font-bold uppercase tracking-wider flex items-center mr-1 text-[11px] shrink-0">
          <AlertOctagon className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
          Triage:
        </span>

        {/* All Signals Tab */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onFilterChange({ defect: "none", page: 1 })}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            !filters.defect || filters.defect === "none"
              ? "bg-zinc-950 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200 border border-zinc-200"
          }`}
        >
          All Signals
        </button>

        {/* Needs Triage Tab */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onFilterChange({ defect: "all", page: 1 })}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
            filters.defect === "all"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
          }`}
        >
          <span>Needs Triage</span>
          <span className="px-1.5 py-0.5 rounded bg-white text-rose-800 border border-rose-200 text-[10px] font-bold">
            {facets.defects.totalDefects}
          </span>
        </button>

        {/* Unrouted Tab */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onFilterChange({ defect: "unrouted", page: 1 })}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            filters.defect === "unrouted"
              ? "bg-rose-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:text-rose-700 hover:bg-rose-50 border border-zinc-200"
          }`}
        >
          Unrouted ({facets.defects.unrouted})
        </button>

        {/* Missing Summary Tab */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onFilterChange({ defect: "missing_summary", page: 1 })}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            filters.defect === "missing_summary"
              ? "bg-amber-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:text-amber-700 hover:bg-amber-50 border border-zinc-200"
          }`}
        >
          Missing Summary ({facets.defects.missingSummary})
        </button>

        {/* Dangling Run Tab */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onFilterChange({ defect: "dangling_run", page: 1 })}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            filters.defect === "dangling_run"
              ? "bg-purple-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:text-purple-700 hover:bg-purple-50 border border-zinc-200"
          }`}
        >
          Dangling run-999 ({facets.defects.danglingRun})
        </button>

        {/* Duplicates Tab */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onFilterChange({ defect: "duplicate", page: 1 })}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            filters.defect === "duplicate"
              ? "bg-cyan-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:text-cyan-700 hover:bg-cyan-50 border border-zinc-200"
          }`}
        >
          Duplicates ({facets.defects.duplicate})
        </button>
      </div>

      {/* Main Filter Dropdowns Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-zinc-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
          {/* Project Filter */}
          <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 focus-within:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono w-full sm:w-auto">
            <span className="text-zinc-500 font-bold uppercase text-[10px] shrink-0">Project:</span>
            <select
              value={filters.project || "all"}
              onChange={(e) => onFilterChange({ project: e.target.value, page: 1 })}
              className="bg-transparent text-zinc-950 font-bold focus:outline-none cursor-pointer pr-1 w-full truncate"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => {
                const count = facets.projects[p.id] || 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({count})
                  </option>
                );
              })}
              <option value="internal_unsorted" className="text-rose-600 font-bold">
                Unsorted / Unrouted ({facets.projects["internal_unsorted"] || 0})
              </option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 focus-within:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono w-full sm:w-auto">
            <span className="text-zinc-500 font-bold uppercase text-[10px] shrink-0">Status:</span>
            <select
              value={filters.status || "all"}
              onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
              className="bg-transparent text-zinc-950 font-bold focus:outline-none cursor-pointer pr-1 w-full"
            >
              <option value="all">All Statuses</option>
              <option value="analyzed" className="text-emerald-700 font-bold">
                Analyzed ({facets.statuses.analyzed || 0})
              </option>
              <option value="pending" className="text-amber-700 font-bold">
                Pending ({facets.statuses.pending || 0})
              </option>
              <option value="deferred" className="text-zinc-500 font-bold">
                Deferred ({facets.statuses.deferred || 0})
              </option>
              <option value="unrouted" className="text-rose-600 font-bold">
                Unrouted ({facets.statuses.unrouted || 0})
              </option>
            </select>
          </div>

          {/* Feed Filter */}
          <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 focus-within:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono w-full sm:w-auto">
            <span className="text-zinc-500 font-bold uppercase text-[10px] shrink-0">Source:</span>
            <select
              value={filters.feed || ""}
              onChange={(e) =>
                onFilterChange({
                  feed: (e.target.value || undefined) as SearchQueryFilters["feed"],
                  page: 1,
                })
              }
              className="bg-transparent text-zinc-950 font-bold focus:outline-none cursor-pointer pr-1 w-full"
            >
              <option value="">All Sources</option>
              <option value="granola">Granola Note</option>
              <option value="transcript">Transcript</option>
              <option value="recording">Recording (.mp4)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              suppressHydrationWarning
              onClick={onReset}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-bold transition-colors border border-zinc-300 cursor-pointer w-full sm:w-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center justify-between sm:justify-start space-x-2 bg-zinc-50 border border-zinc-200 focus-within:border-emerald-600 rounded-lg px-3 py-2 text-xs font-mono w-full md:w-auto shrink-0">
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            <span className="text-zinc-500 font-bold uppercase text-[10px] shrink-0">Sort:</span>
          </div>
          <select
            value={filters.sort || "date_desc"}
            onChange={(e) => onFilterChange({ sort: e.target.value as SortOption, page: 1 })}
            className="bg-transparent text-zinc-950 font-bold focus:outline-none cursor-pointer w-full md:w-auto text-right md:text-left"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="relevance">Relevance Score</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
