// fetch-gp-appointments.js
//
// What this does, in plain terms:
// 1. Looks for the newest "Appointments in General Practice" page on NHS England's digital site (this month, then up to four months back) that carries the regional CSV zip.
// 2. If the file we already have is for that same month, stops (the zip is about 4 MB and the CSVs inside add up to a quarter of a gigabyte, so it is only read when there is a new month).
// 3. Otherwise downloads the zip, adds up every board's rows (see gpAppointments.js) and writes frontend/src/data/gpAppointments.json.
//    If too few boards come back, or the totals look wrong, the existing file is left alone and the script fails.
//
// Run it with: node fetch-gp-appointments.js

import { existsSync, readFileSync, writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { unzip } from "./xlsx-lite.js";
import { addCsv, build, candidatePages, regionalZip } from "./gpAppointments.js";

const OUTPUT = "frontend/src/data/gpAppointments.json";
const MIN_BOARDS = 35;
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };

async function newestEdition() {
  for (const c of candidatePages(new Date())) {
    const res = await fetchRetry(c.url, { headers });
    if (!res.ok) continue;
    const zip = regionalZip(await res.text());
    if (zip) return { ...c, zip };
  }
  throw new Error("No Appointments in General Practice edition with a regional CSV file was found");
}

async function main() {
  const edition = await newestEdition();
  console.log(`Newest edition: ${edition.key} (${edition.url})`);
  if (existsSync(OUTPUT)) {
    const have = JSON.parse(readFileSync(OUTPUT, "utf8"));
    if (have.page === edition.url && have.latest) { console.log(`${OUTPUT} already holds ${have.latest}, so nothing was downloaded.`); return; }
  }
  const res = await fetchRetry(edition.zip, { headers }, { timeoutMs: 180_000 });
  if (!res.ok) throw new Error(`${edition.zip} answered ${res.status}`);
  const files = unzip(Buffer.from(await res.arrayBuffer()));
  const acc = new Map();
  let rows = 0;
  for (const [name, read] of files) if (/\.csv$/i.test(name)) rows += addCsv(acc, read());
  const data = build(acc);
  const england = data.england;
  if (data.icbs.length < MIN_BOARDS || !data.latest || england.n < 20_000_000 || england.n > 80_000_000 || england.within2w == null) {
    throw new Error(`Only ${data.icbs.length} boards and ${england.n} appointments came back for ${data.latest}, which looks wrong, so ${OUTPUT} was left as it is.`);
  }
  writeFileSync(OUTPUT, `${JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), page: edition.url, source: edition.zip, ...data })}\n`);
  console.log(`Wrote ${data.icbs.length} boards, ${data.months.length} months to ${data.latest} (${rows} rows) to ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
