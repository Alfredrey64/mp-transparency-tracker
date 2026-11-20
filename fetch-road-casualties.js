// fetch-road-casualties.js
//
// What this does, in plain terms:
// 1. Asks the Department for Transport's road casualty statistics ("last 5 years" collision and casualty files, about 150 MB together) how big they are, without downloading them.
//    The files are replaced once a year (autumn) when a new year of figures is published, and the size changes when they are.
// 2. If both sizes match the ones saved in frontend/src/data/roadCasualties.json and the saved table is under 35 days old, it stops. (A re-check every 35 days catches the rare
//    correction that leaves the size alone.)
// 3. Otherwise downloads both, counts the people killed, seriously and slightly injured for each council and year, and saves the table. If too few councils come back,
//    the old file is left alone.
//
// Run it with: node fetch-road-casualties.js   (add --force to download regardless)

import fs from "node:fs";
import { fetchRetry } from "./httpFetch.js";
import { buildRoadCasualties } from "./roadCasualties.js";

const OUTPUT = "frontend/src/data/roadCasualties.json";
const BASE = "https://data.dft.gov.uk/road-accidents-safety-data";
const COLLISIONS = `${BASE}/dft-road-casualty-statistics-collision-last-5-years.csv`;
const CASUALTIES = `${BASE}/dft-road-casualty-statistics-casualty-last-5-years.csv`;
const MIN_AREAS = 300;
const RECHECK_DAYS = 35;

// The server refuses HEAD requests, so start a normal request, read the headers and hang up.
async function sizeOf(url, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try { return await sizeOnce(url); } catch (e) {
      if (attempt >= tries) throw e;
      await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
  }
}
async function sizeOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const n = Number(res.headers.get("content-length"));
    controller.abort();
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (e) {
    if (e.name === "AbortError" && controller.signal.aborted) return null;
    throw e;
  } finally { clearTimeout(timer); }
}

async function text(url) {
  const res = await fetchRetry(url, {}, { timeoutMs: 300_000, gapMs: 0 });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return new TextDecoder().decode(await res.arrayBuffer());
}

async function main() {
  const have = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : null;
  const sizes = [await sizeOf(COLLISIONS), await sizeOf(CASUALTIES)];
  const ageDays = have ? (Date.now() - new Date(have.fetchedAt).getTime()) / 86_400_000 : Infinity;
  if (have && !process.argv.includes("--force") && sizes[0] && sizes[1] && have.sizes?.[0] === sizes[0] && have.sizes?.[1] === sizes[1] && ageDays < RECHECK_DAYS) {
    console.log(`The road casualty files are the same size as last time (${sizes.join(", ")} bytes) and the table is ${Math.round(ageDays)} days old; nothing to do.`);
    return;
  }
  const collisions = await text(COLLISIONS);
  const casualties = await text(CASUALTIES);
  const out = buildRoadCasualties(collisions, casualties);
  const count = Object.keys(out.areas).length;
  if (count < MIN_AREAS) throw new Error(`Only ${count} council areas came back, so ${OUTPUT} was left as it is.`);
  fs.writeFileSync(OUTPUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), sizes: [Buffer.byteLength(collisions), Buffer.byteLength(casualties)].map((n, i) => sizes[i] ?? n), source: "https://www.gov.uk/government/collections/road-accidents-and-safety-statistics", ...out }) + "\n");
  console.log(`Saved ${count} council areas for ${out.years[0]}-${out.latest} to ${OUTPUT}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
