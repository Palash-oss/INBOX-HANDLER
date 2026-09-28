"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Header } from "./Header";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { SignalCard } from "./SignalCard";
import { SignalDrawer } from "./SignalDrawer";
import { Pagination } from "./Pagination";
import { ModelExplainerModal } from "./ModelExplainerModal";
import {
  EnrichedSignal,
  ProjectConfig,
  SearchQueryFilters,
  PaginatedResult,
} from "@/types";
import { SearchX, RefreshCw } from "lucide-react";

export function LedgerDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Read initial filters directly from URL state
  const initialQ = searchParams.get("q") || "";
  const initialProject = searchParams.get("project") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialDefect =
    (searchParams.get("defect") as SearchQueryFilters["defect"]) || "none";
  const initialFeed =
    (searchParams.get("feed") as SearchQueryFilters["feed"]) || undefined;
  const initialSort = (searchParams.get("sort") as SearchQueryFilters["sort"]) || "date_desc";
  const initialPage = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
  const initialLimit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState<string>(initialQ);

  // Active filters state
  const [filters, setFilters] = useState<SearchQueryFilters>({
    q: initialQ,
    project: initialProject,
    status: initialStatus,
    defect: initialDefect,
    feed: initialFeed,
    sort: initialSort,
    page: initialPage,
    limit: initialLimit,
  });

  // Projects list from config.json
  const [projects, setProjects] = useState<ProjectConfig[]>([]);

  // Results & Pagination from API
  const [results, setResults] = useState<PaginatedResult<EnrichedSignal>>({
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
    facets: {
      projects: {},
      statuses: {},
      defects: {
        totalDefects: 0,
        unrouted: 0,
        missingSummary: 0,
        danglingRun: 0,
        duplicate: 0,
      },
    },
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSignal, setSelectedSignal] = useState<EnrichedSignal | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);

  // Sync state to URL query parameters
  const syncUrlState = useCallback(
    (newFilters: SearchQueryFilters) => {
      const params = new URLSearchParams();
      if (newFilters.q) params.set("q", newFilters.q);
      if (newFilters.project && newFilters.project !== "all")
        params.set("project", newFilters.project);
      if (newFilters.status && newFilters.status !== "all")
        params.set("status", newFilters.status);
      if (newFilters.defect && newFilters.defect !== "none")
        params.set("defect", newFilters.defect);
      if (newFilters.feed) params.set("feed", newFilters.feed);
      if (newFilters.sort && newFilters.sort !== "date_desc")
        params.set("sort", newFilters.sort);
      if (newFilters.page && newFilters.page > 1)
        params.set("page", newFilters.page.toString());
      if (newFilters.limit && newFilters.limit !== 10)
        params.set("limit", newFilters.limit.toString());

      const queryStr = params.toString();
      const nextUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router]
  );

  // Fetch projects on mount
  useEffect(() => {
    async function loadProjectsConfig() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to load projects config:", err);
      }
    }
    loadProjectsConfig();
  }, []);

  // Fetch signals when filters change
  const fetchSignals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.project) params.set("project", filters.project);
      if (filters.status) params.set("status", filters.status);
      if (filters.defect) params.set("defect", filters.defect);
      if (filters.feed) params.set("feed", filters.feed);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());

      const res = await fetch(`/api/signals?${params.toString()}`);
      if (res.ok) {
        const data: PaginatedResult<EnrichedSignal> = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Failed to fetch signals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Debounced search input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.q || "")) {
        const updated: SearchQueryFilters = {
          ...filters,
          q: searchInput || undefined,
          page: 1, // Reset to page 1 on new search
        };
        setFilters(updated);
        syncUrlState(updated);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput, filters, syncUrlState]);

  // Handler for filter updates
  const handleFilterChange = (updates: Partial<SearchQueryFilters>) => {
    const next: SearchQueryFilters = { ...filters, ...updates };
    setFilters(next);
    syncUrlState(next);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput("");
    const reset: SearchQueryFilters = {
      q: undefined,
      project: "all",
      status: "all",
      defect: "none",
      feed: undefined,
      sort: "date_desc",
      page: 1,
      limit: 10,
    };
    setFilters(reset);
    syncUrlState(reset);
  };

  // When a signal is updated via the drawer guarded path
  const handleSignalUpdated = (updatedSignal: EnrichedSignal) => {
    setSelectedSignal(updatedSignal);
    fetchSignals();
  };

  const unroutedCount = results.facets.defects.unrouted;

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] text-zinc-950">
      {/* Top Header */}
      <Header
        totalSignals={results.pagination.total}
        unroutedCount={unroutedCount}
        onOpenExplainer={() => setIsExplainerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Universal Search Bar */}
        <section>
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            isLoading={isLoading}
          />
        </section>

        {/* Filter Bar with Live Counts */}
        <section className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <FilterBar
            filters={filters}
            projects={projects}
            facets={results.facets}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </section>

        {/* Results Header / Live Meta */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-1">
          <div>
            {filters.q ? (
              <span>
                Found <strong className="text-emerald-700 font-bold">{results.pagination.total}</strong> results
                matching &quot;<span className="text-zinc-950 font-bold">{filters.q}</span>&quot;
              </span>
            ) : (
              <span>
                Displaying <strong className="text-zinc-950 font-bold">{results.pagination.total}</strong>{" "}
                signals across ledger
              </span>
            )}
          </div>

          <button
            suppressHydrationWarning
            onClick={fetchSignals}
            className="flex items-center space-x-1.5 text-zinc-500 hover:text-emerald-700 transition-colors uppercase font-bold text-[11px] cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            <span>Sync Ledger</span>
          </button>
        </div>

        {/* Signals List with UNIQUE KEY FIX */}
        <section className="space-y-3">
          {isLoading && results.data.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-mono text-zinc-500">Querying ledger records...</p>
            </div>
          ) : results.data.length === 0 ? (
            <div className="py-20 px-4 text-center bg-white border-2 border-dashed border-zinc-200 rounded-2xl space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
                <SearchX className="h-7 w-7 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 uppercase tracking-tight">
                No Matching Signals Found
              </h3>
              <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto leading-relaxed">
                Zero signals matched query &quot;{filters.q}&quot; and selected filters. Try broadening
                keywords or clearing active filter constraints.
              </p>
              <button
                suppressHydrationWarning
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            results.data.map((signal, idx) => (
              <SignalCard
                key={`${signal.id}-${idx}`}
                signal={signal}
                projectsConfig={projects}
                searchQuery={filters.q}
                onSelect={(sig) => setSelectedSignal(sig)}
              />
            ))
          )}
        </section>

        {/* Pagination Controls */}
        <section className="pb-10">
          <Pagination
            currentPage={results.pagination.page}
            totalPages={results.pagination.totalPages}
            totalItems={results.pagination.total}
            limit={results.pagination.limit}
            hasPrev={results.pagination.hasPrev}
            hasNext={results.pagination.hasNext}
            onPageChange={(p) => handleFilterChange({ page: p })}
            onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
          />
        </section>
      </main>

      {/* Slide-over Inspection Drawer with Guarded Mutation Form */}
      <SignalDrawer
        signal={selectedSignal}
        projectsConfig={projects}
        onClose={() => setSelectedSignal(null)}
        onSignalUpdated={handleSignalUpdated}
      />

      {/* Architecture & Product Decision Explainer Modal */}
      <ModelExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </div>
  );
}
