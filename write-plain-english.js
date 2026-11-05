// write-plain-english.js
//
// What this does, in plain terms:
// 1. Takes the official wording already on file for each committee report (the committee's description of its inquiry) and each of the newest statutory instruments (its
//    Explanatory Note), once the fetch scripts have written them.
// 2. Asks Claude to put each into plain English, using only that wording (see plainEnglish.js for the instruction and the checks a rewrite must pass).
// 3. Saves each rewrite as `plain` on its record in committeeReports.json and statutoryInstruments.json, and keeps every rewrite in plainEnglish.json, keyed by a hash of
//    the wording it came from. The fetch scripts rebuild their files each day without `plain`, so the next run puts it back from the cache, and only wording that is new or
//    has changed is sent. A day with nothing new makes no requests.
//
// It needs ANTHROPIC_API_KEY. Without one it does nothing to the data apart from putting back rewrites already in the cache, and exits cleanly, so the daily job never fails
// for want of it. A request that fails leaves that record with the official wording only; the pages fall back to it.
//
// Run it with: ANTHROPIC_API_KEY=... node write-plain-english.js

import { existsSync, readFileSync, writeFileSync } from "fs";
import { fetchRetry, mapLimit } from "./httpFetch.js";
import { MODEL, SYSTEM, checkRewrite, fromCache, instrumentSource, reportSource, toCache, userMessage } from "./plainEnglish.js";

const REPORTS = "frontend/src/data/committeeReports.json";
const INSTRUMENTS = "frontend/src/data/statutoryInstruments.json";
const CACHE = "frontend/src/data/plainEnglish.json";
// A first run rewrites a few hundred records; after that only new ones. The cap stops a bug from sending thousands of requests.
const MAX_PER_RUN = 600;
const CONCURRENCY = 4;

const read = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback);
const write = (path, value) => writeFileSync(path, `${JSON.stringify(value)}\n`);

async function rewrite(source, key, model) {
  const res = await fetchRetry(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 300, system: SYSTEM[source.kind], messages: [{ role: "user", content: userMessage(source) }] }),
  });
  if (res.status === 401 || res.status === 403) throw Object.assign(new Error(`The API refused the key (${res.status})`), { fatal: true });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const body = await res.json();
  return body.content?.find((b) => b.type === "text")?.text ?? "";
}

async function main() {
  const reports = existsSync(REPORTS) ? read(REPORTS) : null;
  const instruments = existsSync(INSTRUMENTS) ? read(INSTRUMENTS) : null;
  const items = [
    ...(reports?.reports ?? []).map((record) => ({ record, source: reportSource(record) })),
    ...(instruments?.recent ?? []).map((record) => ({ record, source: instrumentSource(record) })),
  ].filter((i) => i.source);

  let cache = read(CACHE, {});
  const todo = items.filter((i) => fromCache(cache, i.source) === undefined);
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.PLAIN_ENGLISH_MODEL || MODEL;

  if (!key) {
    console.log(todo.length ? `No ANTHROPIC_API_KEY, so ${todo.length} records keep the official wording only.` : "Nothing new to rewrite.");
  } else if (todo.length) {
    const batch = todo.slice(0, MAX_PER_RUN);
    console.log(`  rewriting ${batch.length} of ${todo.length} new records with ${model}`);
    let fatal = null;
    let failed = 0;
    let rejected = 0;
    await mapLimit(batch, CONCURRENCY, async ({ source }) => {
      if (fatal) return;
      try {
        const text = checkRewrite(await rewrite(source, key, model), source);
        // A rewrite that fails the checks is remembered as empty, so the same wording is not sent again every day.
        if (!text) rejected++;
        cache = toCache(cache, source, text ?? "");
      } catch (e) {
        if (e.fatal) fatal = e; else { failed++; console.warn(`  no rewrite for ${source.key}: ${e.message}`); }
      }
    });
    if (fatal) console.error(`  stopped: ${fatal.message}`);
    console.log(`  ${batch.length - failed - rejected - (fatal ? 1 : 0)} rewritten, ${rejected} not fit to show, ${failed} failed`);
  }

  // Put the rewrites on the records, and forget any whose record has gone.
  const live = new Set(items.map((i) => i.source.key));
  cache = Object.fromEntries(Object.entries(cache).filter(([k]) => live.has(k)));
  let applied = 0;
  for (const { record, source } of items) {
    const text = fromCache(cache, source);
    if (text) { record.plain = text; applied++; } else delete record.plain;
  }
  if (reports) write(REPORTS, reports);
  if (instruments) write(INSTRUMENTS, instruments);
  write(CACHE, cache);
  console.log(`Wrote ${CACHE}; ${applied} of ${items.length} records now have a plain-English version.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
