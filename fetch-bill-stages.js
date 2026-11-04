// fetch-bill-stages.js
//
// What this does, in plain terms:
// 1. Takes the most recently updated bills (the same list fetch-bills.js keeps in Supabase).
// 2. For each, asks the Bills API for the stages it has been through and the days each was sat on.
// 3. Writes them to frontend/src/data/billStages.json, keyed by bill id, so a bill card can show its real journey.
//
// A bill whose stages cannot be fetched this time keeps what it had; a bill that has dropped out of the list is removed. If nothing can be fetched the file is kept as it is.
//
// Run it with: node fetch-bill-stages.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { shapeStages } from "./billStages.js";

const API = "https://bills-api.parliament.uk/api/v1";
const OUTPUT = "frontend/src/data/billStages.json";
const BILLS_TO_FETCH = 100;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const before = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : {};
  const listRes = await fetchRetry(`${API}/Bills?SortOrder=DateUpdatedDescending&Take=${BILLS_TO_FETCH}`);
  if (!listRes.ok) throw new Error(`Bills list API error: ${listRes.status}`);
  const ids = ((await listRes.json()).items ?? []).map((b) => b.billId);
  const out = {};
  let failed = 0;
  for (const id of ids) {
    try {
      const res = await fetchRetry(`${API}/Bills/${id}/Stages`);
      if (!res.ok) throw new Error(`${res.status}`);
      const stages = shapeStages((await res.json()).items);
      if (stages.length) out[id] = stages;
    } catch (err) {
      failed++;
      if (before[id]) out[id] = before[id];
      console.error(`  bill ${id}: ${err.message}`);
    }
    await sleep(120);
  }
  if (ids.length && failed === ids.length) { console.error("No bill's stages could be read, so the existing file was kept."); process.exit(1); }
  const text = `${JSON.stringify(out)}\n`;
  if (!existsSync(OUTPUT) || readFileSync(OUTPUT, "utf8") !== text) writeFileSync(OUTPUT, text);
  console.log(`Stages for ${Object.keys(out).length} of ${ids.length} bills in ${OUTPUT} (${failed} failed).`);
}

main().catch((err) => { console.error("Something went wrong:", err.message); process.exit(1); });
