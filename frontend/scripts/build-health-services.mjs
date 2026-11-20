// Builds the files behind the health services on Your area (In numbers view): public/data/health/<tile>.json, one file for each tile of the map, and
// src/data/healthMeta.json (which CQC release it came from, and how many places).
//
//   node scripts/build-health-services.mjs
//
// The Care Quality Commission publishes "Latest ratings" every month, as a spreadsheet with a row for each location, service and key question (under the Open Government
// Licence, which asks users to say the data is CQC's). This keeps GP practices, care homes, hospitals, hospices, mental health, community health and urgent care services that
// have an overall rating, with the five key questions and the date of the report, and places each by its postcode using postcodes.io.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRetry } from "../../httpFetch.js";
import { streamOdsSheet } from "./odsStream.mjs";
import { columns, collector } from "./health-lib.mjs";
import { tileOf } from "../src/lib/nearYou.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(here, "../public/data/health");
const META = path.join(here, "../src/data/healthMeta.json");
const PAGE = "https://www.cqc.org.uk/about-us/transparency/using-cqc-data";
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };
const MIN_PLACES = 15000;

export async function newestRatings() {
  const html = await (await fetchRetry(PAGE, { headers })).text();
  const m = /href="([^"]*Latest_ratings\.ods)"/i.exec(html);
  if (!m) throw new Error("The CQC's latest ratings file was not found");
  const url = new URL(m[1], PAGE).href;
  const stamp = /\/(\d{1,2})_([A-Za-z]+)_(\d{4})_Latest_ratings/i.exec(url);
  return { url, asAt: stamp ? `${Number(stamp[1])} ${stamp[2]} ${stamp[3]}` : "" };
}

async function download(url, to) {
  const res = await fetchRetry(url, { headers });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  fs.writeFileSync(to, Buffer.from(await res.arrayBuffer()));
}

// Postcodes to positions, a hundred at a time. A postcode that has ended, or that cannot be placed, is left out and its place is dropped.
async function place(postcodes) {
  const where = new Map();
  const queue = [];
  for (let i = 0; i < postcodes.length; i += 100) queue.push(postcodes.slice(i, i + 100));
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const batch = queue.pop();
      try {
        const res = await fetchRetry("https://api.postcodes.io/postcodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postcodes: batch }) });
        for (const item of (await res.json()).result ?? []) if (item.result?.latitude != null) where.set(item.query.toUpperCase(), [item.result.latitude, item.result.longitude, item.result.country]);
      } catch (e) { console.error(`A batch of postcodes failed: ${e.message}`); }
    }
  }));
  return where;
}

async function main() {
  const file = await newestRatings();
  console.log(`CQC ratings: ${file.url}`);
  const tmp = path.join(os.tmpdir(), "cqc-latest-ratings.ods");
  await download(file.url, tmp);
  let col = null;
  let coll = null;
  const rows = await streamOdsSheet(tmp, "Locations", (cells) => {
    if (!col) { col = columns(cells); if (!col) throw new Error("The ratings sheet's columns were not as expected"); coll = collector(col); return; }
    coll.add(cells);
  });
  fs.rmSync(tmp, { force: true });
  const records = coll.records();
  console.log(`${rows.toLocaleString()} rows read, ${records.length.toLocaleString()} rated places`);
  if (records.length < MIN_PLACES) { console.error(`Only ${records.length} places came back, so the existing files were left as they are.`); process.exit(1); }

  const where = await place([...new Set(records.map((r) => r.pc))]);
  const tiles = new Map();
  let placed = 0;
  const counts = {};
  for (const r of records) {
    const w = where.get(r.pc);
    if (!w || w[2] !== "England") continue; // the CQC regulates England only
    placed++;
    counts[r.t] = (counts[r.t] ?? 0) + 1;
    const k = tileOf(w[0], w[1]);
    if (!tiles.has(k)) tiles.set(k, []);
    tiles.get(k).push({ ...r, la: Number(w[0].toFixed(4)), lo: Number(w[1].toFixed(4)) });
  }
  if (placed < records.length * 0.9) { console.error(`Only ${placed} of ${records.length} could be placed, so the existing files were left as they are.`); process.exit(1); }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith(".json")) fs.rmSync(path.join(OUT_DIR, f));
  for (const [k, list] of tiles) fs.writeFileSync(path.join(OUT_DIR, `${k}.json`), JSON.stringify(list));
  fs.writeFileSync(META, `${JSON.stringify({ builtAt: new Date().toISOString().slice(0, 10), asAt: file.asAt, source: PAGE, places: placed, counts, tiles: tiles.size }, null, 1)}\n`);
  console.log(`Wrote ${placed.toLocaleString()} places in ${tiles.size} tiles`, counts);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
