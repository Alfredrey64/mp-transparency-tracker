// fetch-councils.js
//
// What this does, in plain terms:
// 1. Downloads two free datasets from Open Council Data UK: every UK
//    councillor with their ward, party and next election date, and each
//    council's party make-up for every year since 2016.
// 2. Boils them down to two files for the Your Council page:
//      frontend/src/data/councilsIndex.json   every council, who runs it, seats by party, control trend, changes of hands, defections
//      frontend/src/data/councilDetail/NN.json  each council's wards, councillors and history,
//                                              split into 16 files so one council is a small download
// 3. Leaves the existing files alone if too little comes back.
//
// Data: Open Council Data UK, opencouncildata.co.uk, licensed CC BY-SA 4.0
// (credit them; the two files this writes are shared on the same terms).
//
// Run it with: node fetch-councils.js

import { writeFileSync, mkdirSync, rmSync } from "fs";
import { buildCouncils, shardOf, SHARDS } from "./councils.js";

const YEAR = new Date().getFullYear();
const BASE = "https://opencouncildata.co.uk";
const MIN_COUNCILS = 350;
const MIN_COUNCILLORS = 15000;

async function text(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

const [councillorsCsv, historyCsv] = await Promise.all([text(`${BASE}/csv2.php?y=${YEAR}`), text(`${BASE}/history2016-26.csv`)]);
// Last year's list, to see who has changed party since. Optional: without it
// the page simply has no defections figures.
const previousCsv = await text(`${BASE}/csv2.php?y=${YEAR - 1}`).catch(() => null);
const result = buildCouncils({ councillorsCsv, historyCsv, previousCsv, previousYear: previousCsv ? YEAR - 1 : null });
const councillors = Object.values(result.detail).reduce((n, d) => n + d.wards.reduce((m, [, list]) => m + list.length, 0), 0);
if (result.index.length < MIN_COUNCILS || councillors < MIN_COUNCILLORS) {
  throw new Error(`Only ${result.index.length} councils and ${councillors} councillors came back — leaving the existing files unchanged.`);
}

const { detail, ...index } = result;
writeFileSync("frontend/src/data/councilsIndex.json", JSON.stringify(index) + "\n");
rmSync("frontend/src/data/councilDetail.json", { force: true });
mkdirSync("frontend/src/data/councilDetail", { recursive: true });
const shards = Array.from({ length: SHARDS }, () => ({}));
for (const [id, d] of Object.entries(detail)) shards[shardOf(id)][id] = d;
shards.forEach((shard, i) => writeFileSync(`frontend/src/data/councilDetail/${String(i).padStart(2, "0")}.json`, JSON.stringify(shard) + "\n"));
console.log(`Wrote ${result.index.length} councils and ${councillors} councillors.`);
