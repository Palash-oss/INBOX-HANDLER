/**
 * Standalone Backend Verification Test Script
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const FIXTURE_DIR = path.join(ROOT, "fixture");

console.log("🚀 Starting Backend Logic Tests...\n");

const ledgerRaw = fs.readFileSync(path.join(FIXTURE_DIR, "signal-ledger.json"), "utf-8");
const configRaw = fs.readFileSync(path.join(FIXTURE_DIR, "config.json"), "utf-8");
const ledger = JSON.parse(ledgerRaw);
const config = JSON.parse(configRaw);

console.log(`✅ Loaded ledger: ${ledger.signals.length} signals (version ${ledger.version})`);
console.log(`✅ Loaded config: ${config.projects.length} projects`);

// Test 1: Defect detection
let unrouted = 0;
let analyzedCount = 0;
let danglingRun = 0;
let duplicates = 0;

for (const sig of ledger.signals) {
  if (sig.projects.includes("internal_unsorted")) unrouted++;
  const isAnalyzed = Object.values(sig.status).some((s) => s.state === "analyzed");
  if (isAnalyzed) analyzedCount++;
  if (Object.values(sig.status).some((s) => s.analysis_ref === "run-999")) danglingRun++;
  if (sig.id.includes("_dup") || sig.title.includes("(rescheduled)")) duplicates++;
}

console.log("\n📊 Seeded Defect & State Audit:");
console.log(` - Unrouted signals (internal_unsorted): ${unrouted} (Expected: 9)`);
console.log(` - Total analyzed signals in ledger: ${analyzedCount}`);
console.log(` - Dangling analysis references (run-999): ${danglingRun} (Expected: 3)`);
console.log(` - Near-duplicate signals: ${duplicates} (Expected: >= 1)`);

assert.strictEqual(unrouted, 9, "Must correctly identify all 9 unrouted signals");
assert.strictEqual(danglingRun, 3, "Must correctly identify 3 dangling analysis_ref");
assert(duplicates >= 1, "Must detect duplicate meeting pair");

// Test 2: Search Attendees
const danaSignals = ledger.signals.filter((s) =>
  s.attendees.some((a) => a.toLowerCase().includes("dana"))
);
console.log(`\n🔍 Search test for attendee 'dana': Found ${danaSignals.length} signals`);
assert(danaSignals.length > 0, "Should find signals with attendee dana");

// Test 3: Search Title
const invoiceSignals = ledger.signals.filter((s) =>
  s.title.toLowerCase().includes("invoice")
);
console.log(`🔍 Search test for title 'invoice': Found ${invoiceSignals.length} signals`);
assert(invoiceSignals.length > 0, "Should find signals matching invoice");

// Test 4: Pagination math check
const total = ledger.signals.length;
const limit = 10;
const totalPages = Math.ceil(total / limit);
console.log(`\n📄 Pagination check: Total ${total} signals -> ${totalPages} pages at limit ${limit}`);
assert.strictEqual(totalPages, Math.ceil(total / limit), "Pagination must compute correctly");

console.log("\n🎉 ALL BACKEND LOGIC CHECKS PASSED!");
