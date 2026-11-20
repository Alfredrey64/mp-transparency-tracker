// Adds school results to the school map files and records the England averages to compare them with.
//
//   node scripts/build-school-results.mjs
//
// Two public files from the Department for Education's "Explore education statistics" service are used, both school by school and found through its public API:
//   1. Key stage 4 performance, "Performance tables schools data": Attainment 8, Progress 8 and the share getting grade 5 or 4 in English and maths (GCSE results).
//   2. Key stage 2 attainment, "institutional level, Schools (performance)": the share reaching the expected standard in reading, writing and maths (the Year 6 tests).
// Results are kept in scripts/data/school-results.json so that rebuilding the school tiles (build-schools-near-you.mjs) keeps them. This script also patches the tiles that
// are there now. England's figures go to src/data/schoolResultsMeta.json.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { fetchRetry } from "../../httpFetch.js";
import { parseCsv } from "./build-council-complaints.mjs";
import { ks4From, ks4National, ks2Row, ks2National, withResults, yearLabel } from "./school-results-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const TILES = path.join(here, "../public/data/schools");
const CACHE = path.join(here, "data/school-results.json");
const META = path.join(here, "../src/data/schoolResultsMeta.json");
const API = "https://api.education.gov.uk/statistics/v1";
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };
// Data set ids from the API's publication listings (key-stage-4-performance, key-stage-2-attainment).
const SETS = {
  ks4: "19e39901-a96c-be76-b9c2-6af54ae076d2", // Performance tables schools data
  ks4National: "19e39901-560d-f972-b6f3-dd085539c095", // National characteristics summary data
  ks2: "019afee4-e5d0-72f9-9a8f-d7a1a56eac1d", // Key stage 2 institutional level - Schools (performance)
  ks2National: "c62e9901-7b35-7272-9fd1-30ab9a527e10", // Attainment by region and local authority
};

// The version number the Department publishes for each of the four data sets, as one string. A new edition (provisional figures in the autumn, revised ones in the new year) changes it,
// which is how refresh-area-data.mjs knows to rebuild without anyone having to look.
export async function dataSetVersions() {
  const out = [];
  for (const [name, id] of Object.entries(SETS)) {
    const res = await fetchRetry(API + "/data-sets/" + id, { headers });
    if (!res.ok) throw new Error("The Department's data set " + name + " answered " + res.status);
    const v = (await res.json()).latestVersion?.version;
    if (!v) throw new Error("The Department gave no version for the data set " + name);
    out.push(name + "=" + v);
  }
  return out.join(";");
}

const csvUrl = (id) => API + "/data-sets/" + id + "/csv";
const rowsOf = (text) => {
  const grid = parseCsv(text.replace(/^﻿/, ""));
  const head = grid[0];
  return grid.slice(1).filter((r) => r.length > 5).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
};

// Reads a big CSV line by line, keeping only the lines that contain every one of `must`, and returns them as rows.
async function filteredRows(url, must) {
  const res = await fetchRetry(url, { headers });
  if (!res.ok) throw new Error("Download failed: HTTP " + res.status);
  const lines = readline.createInterface({ input: Readable.fromWeb(res.body) });
  let head = null;
  const out = [];
  for await (const line of lines) {
    if (!head) { head = parseCsv(line.replace(/^﻿/, ""))[0]; continue; }
    if (!must.every((m) => line.includes(m))) continue;
    const cells = parseCsv(line)[0];
    out.push(Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""])));
  }
  return out;
}

async function main() {
  const versions = await dataSetVersions();
  const ks4Text = await (await fetchRetry(csvUrl(SETS.ks4), { headers })).text();
  const ks4 = ks4From(rowsOf(ks4Text));
  console.log("Key stage 4: " + Object.keys(ks4).length + " schools");
  const national4 = ks4National(rowsOf(await (await fetchRetry(csvUrl(SETS.ks4National), { headers })).text()));

  const ks2 = {};
  for (const r of await filteredRows(csvUrl(SETS.ks2), ['"All pupils"', '"Reading, writing and maths"'])) {
    const hit = ks2Row(r);
    if (hit && (!ks2[hit[0]] || ks2[hit[0]].p < hit[1].p)) ks2[hit[0]] = hit[1];
  }
  console.log("Key stage 2: " + Object.keys(ks2).length + " schools");
  const national2 = ks2National(rowsOf(await (await fetchRetry(csvUrl(SETS.ks2National), { headers })).text()));

  if (Object.keys(ks4).length < 2500 || Object.keys(ks2).length < 10000 || !national4 || !national2) {
    console.error("The results files were not as expected, so nothing was changed.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify({ ks4, ks2 }) + "\n");
  let patched = 0;
  for (const f of fs.existsSync(TILES) ? fs.readdirSync(TILES) : []) {
    if (!f.endsWith(".json")) continue;
    const file = path.join(TILES, f);
    const list = JSON.parse(fs.readFileSync(file, "utf8")).map((s) => withResults(s, ks4, ks2));
    patched += list.filter((s) => s.s4 || s.s2).length;
    fs.writeFileSync(file, JSON.stringify(list));
  }
  const meta = { builtAt: new Date().toISOString().slice(0, 10), versions, ks4: { ...national4, y: yearLabel(national4.p) }, ks2: { ...national2, y: yearLabel(national2.p) }, source: "https://explore-education-statistics.service.gov.uk/" };
  fs.writeFileSync(META, JSON.stringify(meta, null, 1) + "\n");
  console.log("Added results to " + patched + " schools in the map files.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
