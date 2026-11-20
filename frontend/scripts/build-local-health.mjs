// Builds src/data/localHealth.json from the Office for Health Improvement and Disparities' Fingertips API (see local-health-lib.mjs for the measures).
//
//   node scripts/build-local-health.mjs
//
// Fingertips has no single "what changed" endpoint, so the newest period of every series for England is read first (editionOf) and stored; the weekly refresh compares it with a fresh
// reading and only downloads the area files (some tens of megabytes) when it differs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRetry } from "../../httpFetch.js";
import { headers } from "./area-kit.mjs";
import { SPECS, buildLocalHealth } from "./local-health-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/localHealth.json");
const API = "https://fingertips.phe.org.uk/api";

// One string that changes when any of the five series gets a new period for England.
export async function editionOf() {
  const ids = SPECS.map((s) => s.id).join(",");
  const res = await fetchRetry(`${API}/latest_data/specific_indicators_for_single_area?area_code=E92000001&area_type_id=15&indicator_ids=${ids}`, { headers }, { timeoutMs: 60_000 });
  if (!res.ok) throw new Error(`Fingertips answered ${res.status}`);
  const rows = await res.json();
  const parts = (Array.isArray(rows) ? rows : []).flatMap((r) => (r.Grouping ?? []).map((g) => `${g.IndicatorId}:${g.SexId}:${g.AgeId}:${g.Period}`));
  if (!parts.length) throw new Error("Fingertips gave no periods for the health indicators");
  return [...new Set(parts)].sort().join("|");
}

async function csv(id, type) {
  const res = await fetchRetry(`${API}/all_data/csv/by_indicator_id?indicator_ids=${id}&child_area_type_id=${type}&parent_area_type_id=15`, { headers }, { timeoutMs: 180_000 });
  if (!res.ok) throw new Error(`Fingertips answered ${res.status} for indicator ${id}`);
  return res.text();
}

async function main() {
  const edition = await editionOf();
  const files = {};
  for (const spec of SPECS) {
    files[spec.key] = [];
    for (const type of spec.types) files[spec.key].push(await csv(spec.id, type));
    console.log(`Indicator ${spec.id}: ${files[spec.key].reduce((n, t) => n + t.length, 0).toLocaleString()} characters`);
  }
  const data = buildLocalHealth(files);
  const have = Object.keys(data.areas).length;
  if (have < 250 || !data.england?.le || !data.periods.le || !data.periods.smoke) {
    console.error(`The Fingertips files were not as expected (${have} areas), so ${OUT} was left as it is.`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: "https://fingertips.phe.org.uk/", edition, ...data }) + "\n");
  console.log(`Wrote ${have} areas.`, data.periods);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
