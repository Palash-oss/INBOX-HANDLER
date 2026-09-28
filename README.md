# Inbox — Search Across the Ledger

A visual control plane and universal search engine for **Inbox** at Supanova Labs.

Built for the Supanova Labs Paid Build Task by **Palash** (`Palash-oss`).

---

## 🏗️ Architecture: Clean Frontend & Backend Separation

This codebase is split into two cleanly separated layers:
- **`backend/` (Express + TypeScript):** Connective tissue that reads the synthetic fixture pack, executes server-side multi-field queries, handles defect detection, and guards atomic mutations.
- **`frontend/` (Next.js 14 + React + Tailwind CSS):** Modern visual control plane featuring keyboard-friendly search, URL state persistence, live facet counters, defect chips, and a slide-over triage drawer.

```
INBOX-HANDLER/
├── backend/                       # Dedicated Express API Server
│   ├── src/
│   │   ├── lib/
│   │   │   ├── ledger.ts          # Ledger loader, defect detection & atomic write
│   │   │   └── search.ts          # Multi-field scoring & filtering engine
│   │   ├── types/                 # Backend TypeScript interfaces
│   │   └── server.ts              # Express API (Port 5000)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # Dedicated Next.js Control Plane
│   ├── src/
│   │   ├── app/                   # App router, globals.css, layout
│   │   ├── components/            # SearchBar, FilterBar, SignalCard, Drawer, Pagination
│   │   └── types/                 # Frontend TypeScript interfaces
│   ├── next.config.mjs            # Proxies /api/* to Express backend
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── fixture/                       # Synthetic ledger data
│   ├── signal-ledger.json         # 77 synthetic signals (v4 ledger)
│   ├── config.json                # Project configurations & fallbacks
│   ├── routing-hints.json         # Keyword & domain routing rules
│   ├── run-log.jsonl              # Daily ingest run logs
│   └── audit-log.jsonl            # Guarded mutation audit entries
├── scripts/
│   └── test-api.mjs               # Automated backend verification test
├── package.json                   # Root orchestrator (starts both with 1 command)
└── README.md
```

---

## ⚡ Quick Start (Clean Clone)

### Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### Run Everything with One Command
From the root directory:
```bash
# 1. Install all dependencies (root, backend, and frontend)
npm run install:all

# 2. Start both backend (port 5000) and frontend concurrently
npm run dev
```

Open the frontend in your browser:
👉 **[http://localhost:3000](http://localhost:3000)** (or the port displayed in terminal)  
Backend API runs at:
👉 **[http://localhost:5000](http://localhost:5000)**

### Or Run Backend & Frontend Separately
```bash
# Start backend only (Express on http://localhost:5000)
npm run dev:backend

# Start frontend only (Next.js on http://localhost:3000)
npm run dev:frontend
```

### Run Automated Backend Verification Tests
```bash
npm run test:api
```

---

## ⏱️ Time Spent
- **Architecture Planning & Ledger Data Audit:** ~45 minutes
- **Backend Search & Guarded Mutation API:** ~1 hour 15 minutes
- **Frontend UI, Glassmorphic Styling & URL State:** ~1 hour 30 minutes
- **Testing, Verification & Walkthrough Prep:** ~30 minutes
- **Total Time:** ~4 hours

---

## 🎯 Mission Overview & Features

### 1. One Unified Search Box
Searches simultaneously across:
- **Titles** (e.g. *"Northwind invoice sync kickoff"*)
- **Attendees** (e.g. searching `"dana"` matches `"dana@northwind.example"`)
- **Projects** (matches both project identifiers like `harborline` and friendly names like `Harborline Freight`)
- **Summaries & Notes** (searches summary content, operator notes, and source file paths)

Features a **weighted relevance ranking** algorithm:
`Exact Title/Project (20-30 pts) > Attendee Handle/Domain (10 pts) > Summary/Notes (4-6 pts)`.

### 2. Filters That Survive a Reload (URL State Synchronization)
Every query, filter, sort choice, and page index is synchronized in real-time to the browser's URL query string:
`http://localhost:3000/?q=invoice&project=northwind&status=analyzed&page=1`
- **Full Refresh Resilience:** Pressing `F5`, navigating back/forward, or sharing links restores the exact query, active filters, and pagination state.

### 3. Server-Side Processing & Pagination
- The frontend **never** imports the raw ledger JSON into the client bundle.
- All searches, filters, facets, and pagination slices are executed server-side via Express backend endpoints (`/api/signals`, `/api/projects`).
- Live facet aggregation provides accurate counts on every filter tab (e.g., `Unrouted (9)`, `Analyzed (27)`).

### 4. Single Guarded Write Path (Atomic Mutations)
- All edits (assigning unrouted signals, updating notes, adjusting project status) execute through `POST /api/signals/:id/triage`.
- **Identity Invariance:** Detector-owned identity fields (`id`, `match_key`, `type`, `sources`) are strictly immutable and rejected if altered.
- **Atomic Persistence:** Writes to a timestamped temporary file (`signal-ledger.json.tmp.<ts>`) before atomically renaming, preventing ledger truncation on crash.
- **Audit Trail:** Every mutation appends an immutable audit entry to `fixture/audit-log.jsonl`.

### 5. Honest Representation of Seeded Fixture Defects
The synthetic fixture deliberately includes real-world data defects. The UI surfaces them honestly:
- **9 Unrouted Signals:** Badged with `[⚠️ Needs Routing]`, with a 1-click triage drawer to route them.
- **Analyzed Signals Missing Summaries:** Badged with `[⚠️ Missing Summary]` instead of showing blank empty text.
- **3 Dangling Analysis References:** Badged with `[⚠️ Dangling Ref (run-999)]`.
- **Near-Duplicate Meetings:** Badged with `[Near-Duplicate]`.

---

## 🧠 Architectural Design Question

### *"When is a model worth it for search here, and when is a `LIKE` query better?"*

| Dimension | `LIKE` / Inverted Index Query | Model-Based (Embeddings / Semantic Search) |
|---|---|---|
| **Strengths** | - **Deterministic & Instant (<1ms):** Exact substring matching on attendee emails (`dana@northwind.example`), project codes, dates, and meeting titles.<br>- **Zero Overhead:** No inference cost, no external API keys, 100% offline and embedded.<br>- **Exact Token Precision:** Never hallucinates or misidentifies email handles or unique IDs. | - **Discovers Semantic Intent:** Finds relevant discussions even when the exact keyword wasn't spoken (e.g., query *"billing reconciliation delays"* matches a meeting discussing *"invoice sync errors"*).<br>- **Handles Unstructured Transcripts:** Understands themes across 45-minute audio transcripts. |
| **Weaknesses** | - Cannot understand synonyms, conceptual queries, or natural language questions.<br>- Sensitive to typos without fuzzy/trigram configuration. | - High latency (100–500ms) and compute/token cost.<br>- Non-deterministic ranking; notoriously bad at exact email addresses, project codes, or ticket IDs.<br>- Violates zero-cloud / offline constraint without heavy local model dependencies (e.g. ONNX). |

### The Verdict:
1. **For the Ledger Right Now:** A **`LIKE` / Inverted Index query is superior**. The primary search tasks in this ledger are structured lookups (finding Dana's meetings, finding Harborline syncs, filtering by date/status). Lexical search is instant, cost-free, and 100% accurate on identifiers.
2. **When a Model is Worth It:** A model is only worth it once signals contain **full, unstructured meeting transcripts or lengthy documents**, where operators ask qualitative questions (*"What concerns did the client raise about the timeline?"*).
3. **The Production Architecture:** The optimal production system is **Hybrid Search**: fast deterministic lexical indexing (SQLite FTS5 / `LIKE`) for metadata combined with vector embeddings over raw transcripts, merged using **Reciprocal Rank Fusion (RRF)**.

---

## 🛡️ Product Decision, Made and Defended

### Decision: *Active Defect Triage vs. Passive Search*

- **The Unmade Decision:** The fixture pack contains 9 unrouted signals, 27 analyzed signals with missing summaries, and 3 dangling run references. How should search treat these defective or incomplete signals?
- **Our Decision:** We chose **Active Triage Surfacing**:
  1. Rather than hiding defective signals, search prominently displays warning chips (`Needs Routing`, `Missing Summary`, `Dangling Ref`).
  2. A dedicated **`Needs Triage`** filter tab lets operators isolate all anomalies with one click.
  3. Clicking any signal opens a **Slide-Over Inspection Drawer** featuring an integrated **Guarded Triage Form** to assign projects or record notes on the spot.
- **Defense:** Inbox is an internal operator control plane, not an external consumer search engine. Hiding incomplete or unrouted records causes meetings to fall through the cracks. Surfacing them transforms search from a passive lookup tool into an **operational triage hub** that actively repairs the ledger.
