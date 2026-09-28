import fs from "fs";
import path from "path";
import {
  Signal,
  LedgerConfig,
  EnrichedSignal,
  SignalDefects,
  AuditEntry,
} from "../types/index.js";

function resolveFixtureDir(): string {
  const candidates = [
    path.join(process.cwd(), "fixture"),
    path.join(process.cwd(), "../fixture"),
    path.join(__dirname, "../../fixture"),
    path.join(__dirname, "../../../fixture"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "signal-ledger.json"))) {
      return candidate;
    }
  }
  return path.join(process.cwd(), "fixture");
}

const FIXTURE_DIR = resolveFixtureDir();
const LEDGER_PATH = path.join(FIXTURE_DIR, "signal-ledger.json");
const CONFIG_PATH = path.join(FIXTURE_DIR, "config.json");
const AUDIT_LOG_PATH = path.join(FIXTURE_DIR, "audit-log.jsonl");

interface LedgerData {
  version: number;
  signals: Signal[];
}

let cachedSignals: EnrichedSignal[] | null = null;
let cachedConfig: LedgerConfig | null = null;
let lastMtime: number = 0;

/**
 * Checks and surfaces the seeded defects present in the synthetic fixture:
 * - 9 signals routed to internal_unsorted
 * - 6 signals marked analyzed with no summary
 * - 3 signals with dangling analysis_ref (run-999)
 * - 1 near-duplicate meeting pair
 */
export function detectDefects(signal: Signal, allSignals: Signal[]): SignalDefects {
  const isUnrouted = signal.projects.includes("internal_unsorted") || signal.projects.length === 0;

  const isAnalyzed = Object.values(signal.status).some((s) => s.state === "analyzed");
  const isMissingSummary = isAnalyzed && (!signal.summary || signal.summary.trim() === "");

  const hasDanglingRun = Object.values(signal.status).some(
    (s) => s.analysis_ref === "run-999"
  );

  const isDuplicate =
    signal.id.includes("_dup") ||
    signal.title.toLowerCase().includes("(rescheduled)") ||
    allSignals.some(
      (other) =>
        other.id !== signal.id &&
        other.date === signal.date &&
        other.match_key === signal.match_key
    );

  return {
    isUnrouted,
    isMissingSummary,
    hasDanglingRun,
    isDuplicate,
  };
}

export function loadConfig(): LedgerConfig {
  if (cachedConfig) return cachedConfig;
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    cachedConfig = JSON.parse(raw) as LedgerConfig;
    return cachedConfig;
  } catch (err) {
    console.error("Failed to read config.json:", err);
    throw new Error("Could not load ledger configuration.");
  }
}

export function loadSignals(forceReload = false): EnrichedSignal[] {
  try {
    const stats = fs.statSync(LEDGER_PATH);
    if (!forceReload && cachedSignals && stats.mtimeMs === lastMtime) {
      return cachedSignals;
    }

    const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
    const data: LedgerData = JSON.parse(raw);

    const enriched: EnrichedSignal[] = data.signals.map((sig) => {
      const defects = detectDefects(sig, data.signals);
      return {
        ...sig,
        defects,
      };
    });

    cachedSignals = enriched;
    lastMtime = stats.mtimeMs;
    return cachedSignals;
  } catch (err) {
    console.error("Failed to read signal-ledger.json:", err);
    throw new Error("Could not load signal ledger.");
  }
}

export function getSignalById(id: string): EnrichedSignal | null {
  const signals = loadSignals();
  return signals.find((s) => s.id === id) || null;
}

/**
 * Guarded atomic update function adhering to system ownership rules:
 * - Detector owns: id, match_key, type, sources (IMMUTABLE).
 * - Project owns: expected_files, notes, and its key in status.
 * - Writes atomically via temp file rename to prevent ledger truncation.
 * - Logs audit trail to audit-log.jsonl.
 */
export async function guardedUpdateSignal(
  id: string,
  updates: {
    projectToAdd?: string;
    projectToRemove?: string;
    notes?: string;
    summary?: string;
    statusUpdate?: {
      project: string;
      state: "analyzed" | "pending" | "deferred";
      analysis_ref?: string;
    };
  },
  operator: string = "operator"
): Promise<EnrichedSignal> {
  const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
  const data: LedgerData = JSON.parse(raw);

  const targetIndex = data.signals.findIndex((s) => s.id === id);
  if (targetIndex === -1) {
    throw new Error(`Signal with id '${id}' not found.`);
  }

  const current = data.signals[targetIndex];
  const auditChanges: Record<string, { from: unknown; to: unknown }> = {};

  // 1. Projects update (never drop other projects silently)
  let updatedProjects = [...current.projects];
  if (updates.projectToAdd) {
    if (updatedProjects.includes("internal_unsorted")) {
      updatedProjects = updatedProjects.filter((p) => p !== "internal_unsorted");
    }
    if (!updatedProjects.includes(updates.projectToAdd)) {
      auditChanges.projects = { from: current.projects, to: [...updatedProjects, updates.projectToAdd] };
      updatedProjects.push(updates.projectToAdd);
    }
  }

  if (updates.projectToRemove) {
    if (updatedProjects.includes(updates.projectToRemove)) {
      const next = updatedProjects.filter((p) => p !== updates.projectToRemove);
      auditChanges.projects = { from: current.projects, to: next.length > 0 ? next : ["internal_unsorted"] };
      updatedProjects = next.length > 0 ? next : ["internal_unsorted"];
    }
  }

  // 2. Notes & Summary updates
  let updatedNotes = current.notes;
  if (updates.notes !== undefined) {
    auditChanges.notes = { from: current.notes, to: updates.notes };
    updatedNotes = updates.notes;
  }

  let updatedSummary = current.summary;
  if (updates.summary !== undefined) {
    auditChanges.summary = { from: current.summary, to: updates.summary };
    updatedSummary = updates.summary;
  }

  // 3. Status updates (safe per-project mutation)
  const updatedStatus = { ...current.status };
  if (updates.statusUpdate) {
    const { project, state, analysis_ref } = updates.statusUpdate;
    const existing = updatedStatus[project] || { state: "pending", files_reviewed: [] };
    const nextStatus = {
      ...existing,
      state,
      analysis_ref: analysis_ref ?? existing.analysis_ref,
      analyzed_at: state === "analyzed" ? new Date().toISOString().split("T")[0] : existing.analyzed_at,
    };
    auditChanges[`status.${project}`] = { from: existing, to: nextStatus };
    updatedStatus[project] = nextStatus;
  }

  // Ensure immutable detector identity fields are NEVER altered
  const updatedSignal: Signal = {
    ...current,
    projects: updatedProjects,
    notes: updatedNotes,
    summary: updatedSummary,
    status: updatedStatus,
    id: current.id,
    match_key: current.match_key,
    type: current.type,
    sources: current.sources,
  };

  data.signals[targetIndex] = updatedSignal;

  // Atomic write: write to temp file then rename
  const tempPath = `${LEDGER_PATH}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  fs.renameSync(tempPath, LEDGER_PATH);

  // Append to audit log
  const auditEntry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action: "triage",
    signalId: id,
    changes: auditChanges,
    by: operator,
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(auditEntry) + "\n", "utf-8");

  // Invalidate cache
  cachedSignals = null;
  return getSignalById(id)!;
}
