// fetch-bathing-water.js
//
// What this does, in plain terms:
// 1. Downloads the Environment Agency's list of every designated bathing water in England (beaches and inland waters) with the classification each was given.
// 2. Keeps each one's name, position, rating, rating year and sewerage company (see bathingWater.js).
// 3. Writes frontend/src/data/bathingWater.json. If too few come back, the existing file is left alone.
//
// Run it with: node fetch-bathing-water.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { sitesFrom, latestYear } from "./bathingWater.js";

const OUTPUT = "frontend/src/data/bathingWater.json";
const URL_ = "https://environment.data.gov.uk/doc/bathing-water.json?_pageSize=1000";
const MIN_SITES = 350;

async function main() {
  const res = await fetchRetry(URL_, { headers: { "User-Agent": "Mozilla/5.0 domesday-live" } });
  if (!res.ok) throw new Error(`Bathing water list: HTTP ${res.status}`);
  const json = await res.json();
  const sites = sitesFrom(json.result?.items);
  if (sites.length < MIN_SITES) { console.error(`Only ${sites.length} bathing waters came back, so ${OUTPUT} was left as it is.`); process.exit(1); }
  sites.sort((a, b) => a.name.localeCompare(b.name));
  const data = { fetchedAt: new Date().toISOString().slice(0, 10), year: latestYear(sites), source: "https://environment.data.gov.uk/bwq/profiles/", sites };
  writeFileSync(OUTPUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${sites.length} bathing waters (classified in ${data.year}) to ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
