# Inbox Handler — Search Across the Ledger

A visual control plane and search interface for **Inbox** at Supanova Labs.

## Overview
Inbox ingests operational signals (meeting notes, transcripts, recordings, and threads), assigns them stable identities, routes them to projects, and logs them in a central ledger. This project provides the first visual interface for the ledger:
- **Universal Multi-field Search:** Instant search across titles, attendees, projects, and summaries.
- **Persistent URL State:** Search queries, filters, and pagination survive browser reloads.
- **Server-side Search & Pagination:** Robust query engine handling ledger search, project filtering, and status triage.
- **Honest Defect Handling:** Explicitly surfaces unrouted signals, missing summaries, and dangling analysis references.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the search interface.

---
*Built for the Supanova Labs Paid Build Task by Palash.*
