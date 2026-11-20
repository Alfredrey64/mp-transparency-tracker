// Builds the files behind the "Schools near you" part of the Schools and A&E near you page: public/data/schools/<tile>.json, one file per tenth of a degree of the map,
// and src/data/schoolsMeta.json (which Ofsted release it came from, and how many schools).
//
//   node scripts/build-schools-near-you.mjs
//
// Two public files are joined by the school's URN:
//   1. Ofsted's monthly "state-funded schools: latest inspections" management information (GOV.UK): the school's phase, pupils, latest grade or report card.
//   2. The Department for Education's schools register, Get Information About Schools (GIAS): where each open school stands, as a National Grid reference.
// Schools in England only. The newest Ofsted release is found from GOV.UK's content API, and the newest register file by trying the last ten days' file names.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRetry } from "../../httpFetch.js";
import { parseCsv } from "./build-council-complaints.mjs";
import { gridToLatLon } from "./osgb.mjs";
import { schoolRecord, tileOf } from "./schools-lib.mjs";
import { withResults } from "./school-results-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(here, "../public/data/schools");
const META = path.join(here, "../src/data/schoolsMeta.json");
// GCSE and Year 6 test results by school, kept by build-school-results.mjs so that a rebuild of the tiles does not lose them.
const RESULTS = path.join(here, "data/school-results.json");
const SET = "https://www.gov.uk/api/content/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes";
const GIAS = (stamp) => `https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata${stamp}.csv`;
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };

const table = (text) => {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length > 5).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
};

export async function newestOfsted() {
  const set = await (await fetchRetry(SET, { headers })).json();
  const files = (set.details?.attachments ?? []).filter((a) => /latest inspections as at/i.test(a.title ?? "") && /\.csv$/i.test(a.url ?? ""));
  if (!files.length) throw new Error("Ofsted's latest-inspections file was not found");
  const file = files[files.length - 1];
  return { title: file.title, url: file.url, asAt: (/as at (.+)$/i.exec(file.title) ?? [])[1] ?? "" };
}

async function newestRegister() {
  for (let back = 0; back < 10; back += 1) {
    const d = new Date(Date.now() - back * 86400000);
    const stamp = d.toISOString().slice(0, 10).replace(/-/g, "");
    const res = await fetchRetry(GIAS(stamp), { headers });
    if (res.ok) return { stamp, text: new TextDecoder("windows-1252").decode(await res.arrayBuffer()) };
  }
  throw new Error("No schools register file was found for the last ten days");
}

async function main() {
  const ofsted = await newestOfsted();
  console.log(`Ofsted: ${ofsted.title}`);
  const inspections = table(new TextDecoder("utf-8").decode(await (await fetchRetry(ofsted.url, { headers })).arrayBuffer()));
  const register = await newestRegister();
  console.log(`Register: ${register.stamp}`);
  const places = new Map();
  for (const r of table(register.text)) {
    const e = Number(r["Easting"]), n = Number(r["Northing"]);
    if (e > 0 && n > 0) places.set(r["URN"], gridToLatLon(e, n));
  }

  const results = fs.existsSync(RESULTS) ? JSON.parse(fs.readFileSync(RESULTS, "utf8")) : { ks4: {}, ks2: {} };
  const tiles = new Map();
  let schools = 0;
  for (const row of inspections) {
    const base = schoolRecord(row, places.get(String(row["URN"]).trim()));
    if (!base) continue;
    const rec = withResults(base, results.ks4, results.ks2);
    const k = tileOf(rec.la, rec.lo);
    if (!tiles.has(k)) tiles.set(k, []);
    tiles.get(k).push(rec);
    schools += 1;
  }
  if (schools < 15000) throw new Error(`Only ${schools} schools could be placed, so the files were left as they are`);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let biggest = 0;
  for (const [k, list] of tiles) {
    list.sort((a, b) => a.u - b.u);
    const text = JSON.stringify(list);
    biggest = Math.max(biggest, text.length);
    fs.writeFileSync(path.join(OUT_DIR, `${k}.json`), text);
  }
  fs.writeFileSync(META, `${JSON.stringify({ asAt: ofsted.asAt, source: ofsted.url, register: register.stamp, schools, tiles: tiles.size, builtAt: new Date().toISOString().slice(0, 10) })}\n`);
  console.log(`Wrote ${tiles.size} tile files, ${schools} schools, the biggest file ${(biggest / 1024).toFixed(0)} KB.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
