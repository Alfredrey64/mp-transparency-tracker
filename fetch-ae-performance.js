// fetch-ae-performance.js
//
// What this does, in plain terms:
// 1. Finds the newest monthly A&E file (CSV, one row per provider) on NHS England's statistics page for the current financial year, or the one before it.
// 2. Keeps the NHS trusts with a major A&E department and works out how many patients were seen within four hours (see aeNearYou.js).
// 3. Looks up each trust's main address in the NHS Organisation Data Service, then turns the postcodes into map positions with postcodes.io, so the page can find the nearest.
// 4. Writes frontend/src/data/aeNearYou.json. If too few trusts come back, the existing file is left alone.
//
// Run it with: node fetch-ae-performance.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { trustsFrom, nationalFrom, monthOf, postcodeOf } from "./aeNearYou.js";
import { parseCsv } from "./frontend/scripts/build-council-complaints.mjs";

const OUTPUT = "frontend/src/data/aeNearYou.json";
const PAGE = (y) => `https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/ae-attendances-and-emergency-admissions-${y}-${String((y + 1) % 100).padStart(2, "0")}/`;
const ORD = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations";
const MIN_TRUSTS = 100;
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };

async function newestCsv() {
  const now = new Date();
  const year = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  for (const y of [year, year - 1]) {
    const res = await fetchRetry(PAGE(y), { headers });
    if (!res.ok) continue;
    const html = await res.text();
    const links = [...html.matchAll(/href="([^"]+\.csv)"[^>]*>([^<]*)</gi)].filter((m) => /Monthly A&amp;E|Monthly A&E/i.test(m[2]));
    if (links.length) return { url: new URL(links[0][1], PAGE(y)).href, page: PAGE(y), label: links[0][2].replace(/&amp;/g, "&").trim() };
  }
  throw new Error("NHS England's monthly A&E file was not found");
}

async function pool(list, fn, size = 8) {
  const out = new Map();
  const queue = [...list];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) { const k = queue.pop(); out.set(k, await fn(k).catch(() => undefined)); }
  }));
  return out;
}

async function main() {
  const file = await newestCsv();
  console.log(`File: ${file.label}`);
  const grid = parseCsv((await (await fetchRetry(file.url, { headers })).text()).replace(/^﻿/, ""));
  const rows = grid.slice(1).filter((r) => r.length > 10).map((r) => Object.fromEntries(grid[0].map((h, i) => [h, r[i] ?? ""])));
  const month = monthOf(rows[0]?.Period);
  const trusts = trustsFrom(rows);
  if (trusts.length < MIN_TRUSTS || !month) { console.error(`Only ${trusts.length} trusts came back, so ${OUTPUT} was left as it is.`); process.exit(1); }

  const addresses = await pool(trusts.map((t) => t.code), async (code) => postcodeOf(await (await fetchRetry(`${ORD}/${code}`, { headers: { Accept: "application/json" } })).json()));
  const postcodes = [...new Set([...addresses.values()].filter(Boolean))];
  const where = new Map();
  for (let i = 0; i < postcodes.length; i += 100) {
    const res = await fetchRetry("https://api.postcodes.io/postcodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postcodes: postcodes.slice(i, i + 100) }) });
    for (const item of (await res.json()).result ?? []) if (item.result) where.set(item.query, item.result);
  }
  const placed = trusts.map((t) => {
    const pc = addresses.get(t.code);
    const w = pc && where.get(pc);
    return w ? { ...t, postcode: pc, la: Number(w.latitude.toFixed(4)), lo: Number(w.longitude.toFixed(4)) } : null;
  }).filter(Boolean);
  const missing = trusts.length - placed.length;
  if (missing) console.warn(`${missing} trusts could not be placed on the map and are left out.`);
  if (placed.length < MIN_TRUSTS * 0.8) { console.error("Too few trusts could be placed, so the file was left as it is."); process.exit(1); }

  const out = { month, source: file.url, page: file.page, fetchedAt: new Date().toISOString().slice(0, 10), national: nationalFrom(rows), trusts: placed };
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${placed.length} trusts for ${month}; England ${out.national.allWithin4}% within four hours.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
