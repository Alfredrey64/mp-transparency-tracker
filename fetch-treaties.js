// fetch-treaties.js
//
// What this does, in plain terms:
// 1. Lists every treaty on Parliament's Treaties API (treaties-api.parliament.uk), 100 at a time.
// 2. For the ones laid in the last 12 months, and any whose scrutiny is still open, asks for the steps Parliament recorded (laid, looked at by the Lords committee,
//    the day the objection period ends).
// 3. Writes frontend/src/data/treaties.json for the "UK abroad" page (see treaties.js).
//
// If the list comes back short (an upstream outage) the existing file is left alone. A treaty whose steps cannot be read this time keeps the steps it had.
//
// Run it with: node fetch-treaties.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { summariseTreaties, tidyTreaty, wanted } from "./treaties.js";

const OUTPUT = "frontend/src/data/treaties.json";
const API = "https://treaties-api.parliament.uk/api";
const MIN_TREATIES = 100;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const before = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : null;
  const previous = new Map((before?.treaties ?? []).map((t) => [t.id, t]));

  const all = [];
  for (let skip = 0; ; skip += 100) {
    const page = await getJson(`${API}/Treaty?take=100&skip=${skip}`);
    all.push(...(page.items ?? []));
    console.log(`  ${all.length} of ${page.totalResults} treaties`);
    if (!(page.items ?? []).length || all.length >= page.totalResults) break;
  }
  if (all.length < MIN_TREATIES) {
    console.error(`Only ${all.length} treaties came back, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }

  const kept = [];
  let failed = 0;
  for (const item of all.filter((i) => wanted(i, today))) {
    const id = item.value.id;
    try {
      const steps = (await getJson(`${API}/Treaty/${id}/BusinessItems`)).items ?? [];
      kept.push(tidyTreaty(item, steps));
    } catch (err) {
      failed++;
      console.error(`  treaty ${id}: ${err.message}`);
      const old = previous.get(id);
      kept.push(old ? { ...tidyTreaty(item), objectionEnds: old.objectionEnds, steps: old.steps } : tidyTreaty(item));
    }
    await sleep(150);
  }
  if (kept.length && failed === kept.length) { console.error("No treaty's steps could be read, so the existing file was kept."); process.exit(1); }

  // The day it was built changes every run; a file with the same treaties is left alone (no daily commit for nothing).
  const out = summariseTreaties(all, kept.filter(Boolean), { generated: today });
  if (before && JSON.stringify({ ...before, generated: "" }) === JSON.stringify({ ...out, generated: "" })) return console.log(`Treaties unchanged (${out.treaties.length} kept, ${failed} step lists failed).`);
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.total} treaties on the list, ${out.treaties.length} kept, ${out.treaties.filter((t) => t.status === "open").length} still open (${failed} step lists failed).`);
}

main().catch((err) => { console.error("Something went wrong:", err.message); process.exit(1); });
