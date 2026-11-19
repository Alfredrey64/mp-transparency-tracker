// fetch-rtt-waits.js
//
// What this does, in plain terms:
// 1. Finds the newest "Incomplete pathways by provider" workbook on NHS England's Referral to Treatment waiting times pages (this financial year, or the one before).
// 2. Reads each trust's Total row: people waiting, share under 18 weeks, median wait, long waits (see rttWaits.js).
// 3. Writes frontend/src/data/rttWaits.json. If too few trusts come back, the existing file is left alone.
//
// Run it with: node fetch-rtt-waits.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { readXlsx } from "./xlsx-lite.js";
import { totalsFrom, nationalFrom, periodOf } from "./rttWaits.js";

const OUTPUT = "frontend/src/data/rttWaits.json";
const PAGE = (y) => `https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/rtt-data-${y}-${String((y + 1) % 100).padStart(2, "0")}/`;
const MIN_TRUSTS = 100;
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };

async function newestWorkbook() {
  const now = new Date();
  const year = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  for (const y of [year, year - 1]) {
    const res = await fetchRetry(PAGE(y), { headers });
    if (!res.ok) continue;
    const html = await res.text();
    // The page lists newest first; the provider workbook for incomplete pathways has "Incomplete-Provider" in its file name.
    const link = [...html.matchAll(/href="([^"]*Incomplete-Provider[^"]*\.xlsx)"/gi)][0]?.[1];
    if (link) return { url: new URL(link, PAGE(y)).href, page: PAGE(y) };
  }
  throw new Error("NHS England's RTT incomplete-pathways workbook was not found");
}

async function main() {
  const file = await newestWorkbook();
  console.log(`File: ${file.url}`);
  const buf = Buffer.from(await (await fetchRetry(file.url, { headers })).arrayBuffer());
  const rows = Array.from(readXlsx(buf).Provider ?? [], (r) => r ?? []);
  const trusts = totalsFrom(rows);
  const month = periodOf(rows);
  if (Object.keys(trusts).length < MIN_TRUSTS || !month) { console.error(`Only ${Object.keys(trusts).length} trusts came back, so ${OUTPUT} was left as it is.`); process.exit(1); }
  const data = { month, source: file.url, page: file.page, fetchedAt: new Date().toISOString().slice(0, 10), national: nationalFrom(trusts), trusts };
  writeFileSync(OUTPUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${Object.keys(trusts).length} trusts for ${month} to ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
