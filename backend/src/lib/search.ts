import {
  EnrichedSignal,
  SearchQueryFilters,
  PaginatedResult,
  LedgerConfig,
} from "../types/index.js";
import { loadSignals, loadConfig } from "./ledger.js";

/**
 * Calculates a relevance score for a signal given search terms.
 * Prioritizes: Project match > Title match > Attendee match > Summary match.
 */
function scoreSignalRelevance(
  signal: EnrichedSignal,
  tokens: string[],
  config: LedgerConfig
): number {
  if (tokens.length === 0) return 0;

  let score = 0;
  const titleLower = signal.title.toLowerCase();
  const summaryLower = (signal.summary || "").toLowerCase();
  const notesLower = (signal.notes || "").toLowerCase();
  const attendeesLower = signal.attendees.map((a) => a.toLowerCase());
  const projectsLower = signal.projects.map((p) => p.toLowerCase());

  // Map project IDs to friendly names for matching
  const projectNames = signal.projects.map((pId) => {
    const found = config.projects.find((cp) => cp.id === pId);
    return found ? found.name.toLowerCase() : "";
  });

  const fullQuery = tokens.join(" ").toLowerCase();

  // Exact full query match boosts
  if (titleLower.includes(fullQuery)) score += 30;
  if (summaryLower.includes(fullQuery)) score += 15;

  let allTokensMatched = true;

  for (const token of tokens) {
    let tokenMatched = false;

    // 1. Project match (Highest relevance when searching for project name or ID)
    if (
      projectsLower.some((p) => p.includes(token)) ||
      projectNames.some((pName) => pName.includes(token))
    ) {
      score += 20;
      tokenMatched = true;
    }

    // 2. Title match
    if (titleLower.includes(token)) {
      score += 15;
      tokenMatched = true;
    }

    // 3. Attendee match (matches full email, username handle, or domain)
    if (
      attendeesLower.some((attendee) => {
        const [handle, domain] = attendee.split("@");
        return (
          attendee.includes(token) ||
          (handle && handle.includes(token)) ||
          (domain && domain.includes(token))
        );
      })
    ) {
      score += 10;
      tokenMatched = true;
    }

    // 4. Summary match
    if (summaryLower.includes(token)) {
      score += 6;
      tokenMatched = true;
    }

    // 5. Notes match
    if (notesLower.includes(token)) {
      score += 4;
      tokenMatched = true;
    }

    // 6. Source paths match (e.g. granola, transcript, recording filename)
    const sources = Object.values(signal.sources || {}).filter(Boolean) as string[];
    if (sources.some((s) => s.toLowerCase().includes(token))) {
      score += 2;
      tokenMatched = true;
    }

    if (!tokenMatched) {
      allTokensMatched = false;
    }
  }

  // Bonus if all words in a multi-word search matched somewhere in the signal
  if (allTokensMatched && tokens.length > 1) {
    score += 15;
  }

  return score;
}

export function searchAndFilterSignals(
  filters: SearchQueryFilters
): PaginatedResult<EnrichedSignal> {
  const allSignals = loadSignals();
  const config = loadConfig();

  const query = (filters.q || "").trim().toLowerCase();
  const tokens = query ? query.split(/\s+/).filter(Boolean) : [];

  // Step 1: Search scoring & filtering
  let results: EnrichedSignal[] = allSignals.map((signal) => {
    const relevanceScore = tokens.length > 0 ? scoreSignalRelevance(signal, tokens, config) : 0;
    return {
      ...signal,
      relevanceScore,
    };
  });

  // Filter out non-matching search results if query was provided
  if (tokens.length > 0) {
    results = results.filter((s) => (s.relevanceScore || 0) > 0);
  }

  // Step 2: Project Filter
  if (filters.project && filters.project !== "all") {
    results = results.filter((s) => s.projects.includes(filters.project!));
  }

  // Step 3: Status Filter
  if (filters.status && filters.status !== "all") {
    if (filters.status === "unrouted") {
      results = results.filter(
        (s) => s.projects.includes("internal_unsorted") || Object.keys(s.status).length === 0
      );
    } else {
      results = results.filter((s) =>
        Object.values(s.status).some((st) => st.state === filters.status)
      );
    }
  }

  // Step 4: Defect / Triage Filter
  if (filters.defect && filters.defect !== "none") {
    if (filters.defect === "all") {
      results = results.filter(
        (s) =>
          s.defects.isUnrouted ||
          s.defects.isMissingSummary ||
          s.defects.hasDanglingRun ||
          s.defects.isDuplicate
      );
    } else if (filters.defect === "unrouted") {
      results = results.filter((s) => s.defects.isUnrouted);
    } else if (filters.defect === "missing_summary") {
      results = results.filter((s) => s.defects.isMissingSummary);
    } else if (filters.defect === "dangling_run") {
      results = results.filter((s) => s.defects.hasDanglingRun);
    } else if (filters.defect === "duplicate") {
      results = results.filter((s) => s.defects.isDuplicate);
    }
  }

  // Step 5: Date Range Filter
  if (filters.dateFrom) {
    results = results.filter((s) => s.date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    results = results.filter((s) => s.date <= filters.dateTo!);
  }

  // Step 6: Source Feed Filter
  if (filters.feed) {
    results = results.filter((s) => {
      if (filters.feed === "granola") return Boolean(s.sources.granola_note);
      if (filters.feed === "transcript") return Boolean(s.sources.transcript);
      if (filters.feed === "recording") return Boolean(s.sources.recording);
      return true;
    });
  }

  // Calculate facets from unpaginated filtered results (for badges in UI)
  const projectFacets: Record<string, number> = {};
  const statusFacets: Record<string, number> = {
    analyzed: 0,
    pending: 0,
    deferred: 0,
    unrouted: 0,
  };
  const defectFacets = {
    totalDefects: 0,
    unrouted: 0,
    missingSummary: 0,
    danglingRun: 0,
    duplicate: 0,
  };

  for (const s of results) {
    // Project facets
    for (const p of s.projects) {
      projectFacets[p] = (projectFacets[p] || 0) + 1;
    }

    // Status facets
    const states = Object.values(s.status).map((st) => st.state);
    if (states.length === 0 || s.projects.includes("internal_unsorted")) {
      statusFacets.unrouted++;
    } else {
      for (const st of states) {
        if (statusFacets[st] !== undefined) {
          statusFacets[st]++;
        }
      }
    }

    // Defect facets
    if (
      s.defects.isUnrouted ||
      s.defects.isMissingSummary ||
      s.defects.hasDanglingRun ||
      s.defects.isDuplicate
    ) {
      defectFacets.totalDefects++;
      if (s.defects.isUnrouted) defectFacets.unrouted++;
      if (s.defects.isMissingSummary) defectFacets.missingSummary++;
      if (s.defects.hasDanglingRun) defectFacets.danglingRun++;
      if (s.defects.isDuplicate) defectFacets.duplicate++;
    }
  }

  // Step 7: Sorting
  const sort = filters.sort || (tokens.length > 0 ? "relevance" : "date_desc");

  results.sort((a, b) => {
    if (sort === "relevance" && tokens.length > 0) {
      const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
    }
    if (sort === "date_asc") {
      return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
    }
    if (sort === "title_asc") {
      return a.title.localeCompare(b.title);
    }
    // Default: date_desc
    return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
  });

  // Step 8: Server-side Pagination
  const total = results.length;
  const page = Math.max(1, filters.page ? Number(filters.page) : 1);
  const limit = Math.max(1, filters.limit ? Number(filters.limit) : 10);
  const totalPages = Math.ceil(total / limit) || 1;

  const startIndex = (page - 1) * limit;
  const paginatedData = results.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
    facets: {
      projects: projectFacets,
      statuses: statusFacets,
      defects: defectFacets,
    },
  };
}
