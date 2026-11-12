// fetch-bill-stages.js
//
// What this does, in plain terms:
// 1. Takes the most recently updated bills (the same list fetch-bills.js keeps in Supabase).
// 2. For each, asks the Bills API for the stages it has been through and the days each was sat on.
// 3. Writes them to frontend/src/data/billStages.json, keyed by bill id, so a bill card can show its real journey.
//
// It also picks one recent Act with a full journey (see lawExample.js) and writes it to frontend/src/data/lawExample.json, for the "How a law is made" page.
//
// A bill whose stages cannot be fetched this time keeps what it had; a bill that has dropped out of the list is removed. If nothing can be fetched the file is kept as it is.
//
// Run it with: node fetch-bill-stages.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { shapeStages } from "./billStages.js";
import { pickLawExample } from "./lawExample.js";

const API = "https://bills-api.parliament.uk/api/v1";
const OUTPUT = "frontend/src/data/billStages.json";
const LAW_OUTPUT = "frontend/src/data/lawExample.json";
const ACTS_TO_CONSIDER = 12;
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
  await writeLawExample().catch((err) => console.error(`The law example was not updated, so ${LAW_OUTPUT} was kept: ${err.message}`));
}

// The Act the "How a law is made" page follows. Looks at the Acts among the 200 most recently updated bills, reads each one's stages, and writes the fullest journey.
async function writeLawExample() {
  const res = await fetchRetry(`${API}/Bills?SortOrder=DateUpdatedDescending&Take=200&CurrentHouse=All`);
  if (!res.ok) throw new Error(`Bills list API error: ${res.status}`);
  const acts = ((await res.json()).items ?? []).filter((b) => b.isAct).slice(0, ACTS_TO_CONSIDER);
  const candidates = [];
  for (const b of acts) {
    const stagesRes = await fetchRetry(`${API}/Bills/${b.billId}/Stages`);
    if (!stagesRes.ok) continue;
    const stages = shapeStages((await stagesRes.json()).items);
    let longTitle = null;
    const detail = await fetchRetry(`${API}/Bills/${b.billId}`);
    if (detail.ok) longTitle = (await detail.json()).longTitle ?? null;
    candidates.push({ bill: { billId: b.billId, shortTitle: b.shortTitle, longTitle, originatingHouse: b.originatingHouse }, stages });
    await sleep(120);
  }
  const pick = pickLawExample(candidates);
  if (!pick) throw new Error("no Act with a complete journey was found");
  const text = `${JSON.stringify({ built: new Date().toISOString().slice(0, 10), ...pick }, null, 1)}\n`;
  const previous = existsSync(LAW_OUTPUT) ? JSON.parse(readFileSync(LAW_OUTPUT, "utf8")) : null;
  // Only the day it was built changes between identical runs, so a file with the same Act and journey is left alone (no daily commit for nothing).
  if (previous && JSON.stringify({ ...previous, built: "" }) === JSON.stringify({ ...JSON.parse(text), built: "" })) return console.log(`The law example (${pick.bill.shortTitle}) is unchanged.`);
  writeFileSync(LAW_OUTPUT, text);
  console.log(`The law example is now ${pick.bill.shortTitle} (${pick.stages.length} stages, Royal Assent ${pick.royalAssent}).`);
}

main().catch((err) => { console.error("Something went wrong:", err.message); process.exit(1); });
