export type SignalType = "meeting" | "slack_thread" | "email_thread";

export type SignalState = "analyzed" | "pending" | "deferred" | "unrouted";

export interface ProjectStatus {
  state: "analyzed" | "pending" | "deferred";
  analyzed_at?: string | null;
  files_reviewed?: string[];
  analysis_ref?: string | null;
}

export interface SignalSources {
  granola_note?: string | null;
  transcript?: string | null;
  recording?: string | null;
}

export interface Signal {
  id: string;
  match_key: string;
  type: SignalType;
  date: string;
  time: string;
  title: string;
  detected_on: string;
  attendees: string[];
  projects: string[];
  summary: string | null;
  expected_files: string[];
  notes: string | null;
  status: Record<string, ProjectStatus>;
  sources: SignalSources;
}

export interface ProjectConfig {
  id: string;
  name: string;
  type: "client" | "product" | "internal";
  keywords: string[];
  domains: string[];
  emails: string[];
  active: boolean;
}

export interface LedgerConfig {
  projects: ProjectConfig[];
  internal_domains: string[];
  fallbacks: {
    unrouted: string;
    unknown_project: string;
  };
  feed_freshness_threshold_days: number;
}

export interface SignalDefects {
  isUnrouted: boolean;
  isMissingSummary: boolean;
  hasDanglingRun: boolean;
  isDuplicate: boolean;
}

export interface EnrichedSignal extends Signal {
  defects: SignalDefects;
  relevanceScore?: number;
}

export type SortOption = "date_desc" | "date_asc" | "relevance" | "title_asc";

export interface SearchQueryFilters {
  q?: string;
  project?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  defect?: "all" | "unrouted" | "missing_summary" | "dangling_run" | "duplicate" | "none";
  feed?: "granola" | "transcript" | "recording";
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
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
}

export interface AuditEntry {
  timestamp: string;
  action: "triage" | "update_notes" | "route_project";
  signalId: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  by: string;
}
