// fetch-bill-amendments.js
//
// What this does, in plain terms:
// 1. Takes the most recently updated bills (the same list fetch-bill-stages.js uses).
// 2. For each, asks the Bills API for its stages and picks the committee and report stages that have already sat.
// 3. For each of those, reads every amendment proposed (up to 500 per request) and counts how they were decided and which party's MP led each one (see billAmendments.js).
// 4. Writes the counts to frontend/src/data/billAmendments.json, keyed by bill id, so a bill card can show them under the stage.
//
// A stage that sat more than 60 days ago is settled, so its last answer is kept instead of being asked for again; a stage that cannot be read this time keeps what it had; a bill that has dropped
// out of the list is removed. If nothing at all can be read the file is kept as it is.
//
// Run it with: node fetch-bill-amendments.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { isSettled, stageKey, stagesToAsk, summariseAmendments } from "./billAmendments.js";

const API = "https://bills-api.parliament.uk/api/v1";
const OUTPUT = "frontend/src/data/billAmendments.json";
const BILLS_TO_FETCH = 100;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const before = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : {};
  const ids = ((await getJson(`${API}/Bills?SortOrder=DateUpdatedDescending&Take=${BILLS_TO_FETCH}`)).items ?? []).map((b) => b.billId);
  const out = {};
  let asked = 0;
  let failed = 0;
  let kept = 0;
  for (const id of ids) {
    let stages;
    try {
      stages = stagesToAsk((await getJson(`${API}/Bills/${id}/Stages`)).items, today);
    } catch (err) {
      failed += 1;
      if (before[id]) out[id] = before[id];
      console.error(`  bill ${id}: ${err.message}`);
      continue;
    }
    await sleep(100);
    const rows = {};
    for (const s of stages) {
      const key = stageKey(s.house, s.stage, s.first);
      const old = before[id]?.[key];
      if (old && isSettled(s.last, today)) { rows[key] = old; kept += 1; continue; }
      try {
        // 500 at a time; a bigger stage is read in pages until every amendment the API lists has come back.
        let items = [];
        let totalResults = 0;
        for (let skip = 0; ; skip += 500) {
          const page = await getJson(`${API}/Bills/${id}/Stages/${s.id}/Amendments?Take=500&Skip=${skip}`);
          totalResults = page.totalResults ?? 0;
          items = items.concat(page.items ?? []);
          if (!(page.items ?? []).length || items.length >= totalResults) break;
        }
        asked += 1;
        if (items.length < totalResults) throw new Error(`only ${items.length} of ${totalResults} amendments came back`);
        const sum = summariseAmendments(items);
        if (sum.total) rows[key] = { ...sum, last: s.last };
      } catch (err) {
        failed += 1;
        if (old) rows[key] = old;
        console.error(`  bill ${id} ${s.house} ${s.stage}: ${err.message}`);
      }
      await sleep(150);
    }
    if (Object.keys(rows).length) out[id] = rows;
  }
  if (ids.length && failed >= ids.length) { console.error("Nothing could be read, so the existing file was kept."); process.exit(1); }
  const text = `${JSON.stringify(out)}\n`;
  if (!existsSync(OUTPUT) || readFileSync(OUTPUT, "utf8") !== text) writeFileSync(OUTPUT, text);
  console.log(`Amendment counts for ${Object.keys(out).length} of ${ids.length} bills in ${OUTPUT} (${asked} stages read, ${kept} kept as settled, ${failed} failed).`);
}

main().catch((err) => { console.error("Something went wrong:", err.message); process.exit(1); });
