// fetch-statutory-instruments.js
//
// What this does, in plain terms:
// 1. Lists every statutory instrument laid before Parliament in the last 12 months from Parliament's Statutory Instruments API, a page of 100 at a time, newest first.
// 2. Fetches the fuller record of the most recent ones, for the department that laid each and the date it comes into force.
// 3. Writes frontend/src/data/statutoryInstruments.json for the Laws made by ministers page (see statutoryInstruments.js).
//
// If too few come back (an upstream outage) the existing file is left alone.
//
// Run it with: node fetch-statutory-instruments.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { summariseInstruments } from "./statutoryInstruments.js";

const OUTPUT = "frontend/src/data/statutoryInstruments.json";
const API = "https://statutoryinstruments-api.parliament.uk/api/v2/StatutoryInstrument";
const MIN_INSTRUMENTS = 300;
const RECENT = 60;

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function main() {
  const end = new Date();
  // From the first of the month eleven months back, so the twelve months on the page add up to the total.
  const from = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1)).toISOString().slice(0, 10);
  const generated = end.toISOString().slice(0, 10);

  const items = [];
  for (let skip = 0; ; skip += 100) {
    const page = await getJson(`${API}?Take=100&Skip=${skip}&OrderBy=DateLaid&Descending=true`);
    items.push(...page.items);
    const oldest = (page.items.at(-1)?.value?.commonsLayingDate ?? page.items.at(-1)?.value?.lordsLayingDate ?? "").slice(0, 10);
    console.log(`  ${items.length} of ${page.totalResults} instruments, oldest laid ${oldest}`);
    if (!page.items.length || items.length >= page.totalResults || (oldest && oldest < from)) break;
  }

  // The fuller record of the newest few, five at a time. One that cannot be fetched just goes without its department.
  const first = summariseInstruments(items, {}, { from, generated, recent: RECENT });
  const details = {};
  for (let i = 0; i < first.recent.length; i += 5) {
    await Promise.all(first.recent.slice(i, i + 5).map(async (r) => {
      try { details[r.id] = await getJson(`${API}/${r.id}`); } catch (e) { console.warn(`  no detail for ${r.id}: ${e.message}`); }
    }));
  }

  const out = summariseInstruments(items, details, { from, generated, recent: RECENT });
  if (out.total < MIN_INSTRUMENTS) {
    console.error(`Only ${out.total} instruments came back, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.total} instruments, ${out.recent.filter((r) => r.department).length} of the newest ${out.recent.length} with a department.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
