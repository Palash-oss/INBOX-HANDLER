import express, { Request, Response } from "express";
import cors from "cors";
import { searchAndFilterSignals } from "./lib/search.js";
import { getSignalById, loadConfig, loadSignals, guardedUpdateSignal } from "./lib/ledger.js";
import { SearchQueryFilters, SortOption } from "./types/index.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// GET /api/signals: Universal search & filtering endpoint
app.get("/api/signals", (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || undefined;
    const project = (req.query.project as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const defect = (req.query.defect as SearchQueryFilters["defect"]) || undefined;
    const feed = (req.query.feed as SearchQueryFilters["feed"]) || undefined;
    const dateFrom = (req.query.dateFrom as string) || undefined;
    const dateTo = (req.query.dateTo as string) || undefined;
    const sort = (req.query.sort as SortOption) || undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const filters: SearchQueryFilters = {
      q,
      project,
      status,
      defect,
      feed,
      dateFrom,
      dateTo,
      sort,
      page,
      limit,
    };

    const results = searchAndFilterSignals(filters);
    res.json(results);
  } catch (error) {
    console.error("GET /api/signals error:", error);
    res.status(500).json({ error: "Failed to search and retrieve signals from the ledger." });
  }
});

// GET /api/signals/:id: Fetch single signal details
app.get("/api/signals/:id", (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const signal = getSignalById(id);

    if (!signal) {
      return res.status(404).json({ error: `Signal with ID '${id}' not found.` });
    }

    res.json(signal);
  } catch (error) {
    console.error("GET /api/signals/:id error:", error);
    res.status(500).json({ error: "Failed to retrieve signal details." });
  }
});

// GET /api/projects: List projects with signal counts
app.get("/api/projects", (_req: Request, res: Response) => {
  try {
    const config = loadConfig();
    const signals = loadSignals();

    const projectCounts: Record<string, number> = {};
    for (const sig of signals) {
      for (const p of sig.projects) {
        projectCounts[p] = (projectCounts[p] || 0) + 1;
      }
    }

    const projectsWithCounts = config.projects.map((p) => ({
      ...p,
      signalCount: projectCounts[p.id] || 0,
    }));

    const unsortedCount = projectCounts["internal_unsorted"] || 0;

    res.json({
      projects: projectsWithCounts,
      internalDomains: config.internal_domains,
      unsortedCount,
      totalSignals: signals.length,
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    res.status(500).json({ error: "Failed to retrieve projects configuration." });
  }
});

// POST /api/signals/:id/triage: Guarded mutation endpoint
app.post("/api/signals/:id/triage", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid request payload. Expected JSON object." });
    }

    // Guard: Prevent modification of detector-owned immutable identity fields
    if (body.id || body.match_key || body.type || body.sources) {
      return res.status(403).json({
        error:
          "Forbidden: Detector-owned identity fields ('id', 'match_key', 'type', 'sources') are strictly immutable.",
      });
    }

    const { projectToAdd, projectToRemove, notes, summary, statusUpdate, operator } = body;

    if (projectToAdd && typeof projectToAdd !== "string") {
      return res.status(400).json({ error: "projectToAdd must be a valid project string." });
    }

    if (statusUpdate) {
      if (!statusUpdate.project || !statusUpdate.state) {
        return res.status(400).json({ error: "statusUpdate must specify both 'project' and 'state'." });
      }
      if (!["analyzed", "pending", "deferred"].includes(statusUpdate.state)) {
        return res
          .status(400)
          .json({ error: "Invalid state. Must be 'analyzed', 'pending', or 'deferred'." });
      }
    }

    const updated = await guardedUpdateSignal(
      id,
      {
        projectToAdd,
        projectToRemove,
        notes,
        summary,
        statusUpdate,
      },
      operator || "web-operator"
    );

    res.json({
      success: true,
      message: `Signal '${id}' successfully updated via guarded path.`,
      signal: updated,
    });
  } catch (error: unknown) {
    console.error("POST /api/signals/:id/triage error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`📡 Inbox Backend API Server listening on http://localhost:${PORT}`);
});
