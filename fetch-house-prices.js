// fetch-house-prices.js
//
// What this does, in plain terms:
// 1. Looks for the newest monthly "full file" of the UK House Price Index (HM Land Registry, with the ONS, Registers of Scotland and Land & Property Services Northern Ireland). The files
//    are named by month and appear a couple of months after the month they describe, so it tries the last six months, newest first.
// 2. If that month is already in frontend/src/data/housePrices.json, it stops (nothing to download).
// 3. Otherwise downloads the file (about 35 MB), reduces it to the table in housePrices.js (every council's latest average price, 12-month change, price by kind of home, sales and
//    ten years of prices) and saves it. If too few areas come back, the old file is left alone.
//
// Run it with: node fetch-house-prices.js

import fs from "node:fs";
import { fetchRetry } from "./httpFetch.js";
import { buildHousePrices } from "./housePrices.js";

const OUTPUT = "frontend/src/data/housePrices.json";
const BASE = "https://publicdata.landregistry.gov.uk/market-trend-data/house-price-index-data";
const MIN_AREAS = 300;

const fileFor = (ym) => `${BASE}/UK-HPI-full-file-${ym}.csv`;
function recentMonths(n = 6, now = new Date()) {
  return Array.from({ length: n }, (_, k) => { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 1)); return d.toISOString().slice(0, 7); });
}

async function main() {
  const have = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : null;
  let found = null;
  for (const ym of recentMonths()) {
    const res = await fetchRetry(fileFor(ym), { method: "HEAD" }, { retries: 1, gapMs: 0 });
    if (res.ok) { found = ym; break; }
  }
  if (!found) throw new Error("No monthly house price file was found for the last six months, so " + OUTPUT + " was left as it is.");
  if (have && have.file === found) { console.log(`The ${found} file is already saved.`); return; }
  const res = await fetchRetry(fileFor(found), {}, { timeoutMs: 240_000, gapMs: 0 });
  if (!res.ok) throw new Error(`House price file: HTTP ${res.status}`);
  const out = buildHousePrices(new TextDecoder().decode(await res.arrayBuffer()));
  const count = Object.keys(out.areas).length;
  if (count < MIN_AREAS) throw new Error(`Only ${count} areas came back, so ${OUTPUT} was left as it is.`);
  fs.writeFileSync(OUTPUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), file: found, source: fileFor(found), ...out }) + "\n");
  console.log(`Saved ${count} areas for ${out.month} to ${OUTPUT}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
