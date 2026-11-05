// write-plain-english.js
//
// What this does, in plain terms:
// 1. Takes the official wording already on file for each committee report (the committee's description of its inquiry) and each of the newest statutory instruments (its
//    Explanatory Note), once the fetch scripts have written them.
// 2. Asks an AI model to put each into plain English, using only that wording (see plainEnglish.js for the instruction and the checks a rewrite must pass).
// 3. Saves each rewrite as `plain` on its record in committeeReports.json and statutoryInstruments.json, and keeps every rewrite in plainEnglish.json, keyed by a hash of
//    the wording it came from. The fetch scripts rebuild their files each day without `plain`, so the next run puts it back from the cache, and only wording that is new or
//    has changed is sent. A day with nothing new makes no requests.
//
// It needs a key for one of two services, and uses the first it finds:
//   GEMINI_API_KEY    Google's Gemini API. It has a free tier that needs no card, so this is the one that costs nothing (get a key at aistudio.google.com/apikey).
//   ANTHROPIC_API_KEY Anthropic's Claude API, which is paid.
// Without either it does nothing to the data apart from putting back rewrites already in the cache, and exits cleanly, so the daily job never fails for want of one. A request
// that fails leaves that record with the official wording only; the pages fall back to it. The free tier has daily limits, so when the service says "too many requests" the run
// stops, keeps everything rewritten so far and carries on from there the next day.
//
// Run it with: GEMINI_API_KEY=... node write-plain-english.js

import { existsSync, readFileSync, writeFileSync } from "fs";
import { fetchRetry, mapLimit } from "./httpFetch.js";
import { GEMINI_MODEL, MODEL, SYSTEM, checkRewrite, fromCache, instrumentSource, reportSource, toCache, userMessage } from "./plainEnglish.js";

const REPORTS = "frontend/src/data/committeeReports.json";
const INSTRUMENTS = "frontend/src/data/statutoryInstruments.json";
const CACHE = "frontend/src/data/plainEnglish.json";
// A first run rewrites a few hundred records; after that only new ones. The cap stops a bug from sending thousands of requests.
const MAX_PER_RUN = 600;

const read = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback);
const write = (path, value) => writeFileSync(path, `${JSON.stringify(value)}\n`);

// The two services, each a function from (source, key, model) to the text the model wrote. A 401/403 means the key is wrong; a 429 means the free allowance is used up for now.
// Either way there is no point carrying on, so they stop the run (`fatal`) and what was already rewritten is kept.
function check(res) {
  if (res.status === 401 || res.status === 403) throw Object.assign(new Error(`The service refused the key (${res.status})`), { fatal: true });
  if (res.status === 429) throw Object.assign(new Error("The allowance for today is used up; the rest will be done on a later run"), { fatal: true });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

const PROVIDERS = {
  gemini: {
    model: GEMINI_MODEL,
    // Free tier: spaced out so a run stays inside the per-minute limit.
    concurrency: 1, pauseMs: 4500,
    async rewrite(source, key, model) {
      const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
      const res = await fetchRetry(`${base}/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM[source.kind] }] }, contents: [{ role: "user", parts: [{ text: userMessage(source) }] }], generationConfig: { maxOutputTokens: 400 } }),
      });
      check(res);
      const body = await res.json();
      return (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    },
  },
  anthropic: {
    model: MODEL,
    concurrency: 4, pauseMs: 0,
    async rewrite(source, key, model) {
      const res = await fetchRetry(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 300, system: SYSTEM[source.kind], messages: [{ role: "user", content: userMessage(source) }] }),
      });
      check(res);
      const body = await res.json();
      return body.content?.find((b) => b.type === "text")?.text ?? "";
    },
  },
};

async function main() {
  const reports = existsSync(REPORTS) ? read(REPORTS) : null;
  const instruments = existsSync(INSTRUMENTS) ? read(INSTRUMENTS) : null;
  const items = [
    ...(reports?.reports ?? []).map((record) => ({ record, source: reportSource(record) })),
    ...(instruments?.recent ?? []).map((record) => ({ record, source: instrumentSource(record) })),
  ].filter((i) => i.source);

  let cache = read(CACHE, {});
  const todo = items.filter((i) => fromCache(cache, i.source) === undefined);
  const name = process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  const provider = name && PROVIDERS[name];
  const key = name === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;
  const model = process.env.PLAIN_ENGLISH_MODEL || provider?.model;

  if (!key) {
    console.log(todo.length ? `No GEMINI_API_KEY or ANTHROPIC_API_KEY, so ${todo.length} records keep the official wording only.` : "Nothing new to rewrite.");
  } else if (todo.length) {
    const batch = todo.slice(0, MAX_PER_RUN);
    console.log(`  rewriting ${batch.length} of ${todo.length} new records with ${model} (${name})`);
    let fatal = null;
    let failed = 0;
    let rejected = 0;
    let done = 0;
    await mapLimit(batch, provider.concurrency, async ({ source }) => {
      if (fatal) return;
      try {
        const raw = await provider.rewrite(source, key, model);
        // No text at all means the service answered in a way this step does not understand, which is a failure, not a rewrite to remember as unfit.
        if (!raw.trim()) throw new Error("the service returned no text");
        const text = checkRewrite(raw, source);
        // A rewrite that fails the checks is remembered as empty, so the same wording is not sent again every day.
        if (!text) rejected++;
        done++;
        cache = toCache(cache, source, text ?? "");
      } catch (e) {
        if (e.fatal) fatal = e;
        else {
          failed++;
          console.warn(`  no rewrite for ${source.key}: ${e.message}`);
          if (failed >= 5 && done === 0) fatal = Object.assign(new Error("the first five requests all failed, so something is wrong with the key, the model name or the service"), { fatal: true });
        }
      }
    }, { pauseMs: Number(process.env.PLAIN_ENGLISH_PAUSE_MS ?? provider.pauseMs) });
    if (fatal) console.error(`  stopped: ${fatal.message}`);
    console.log(`  ${done - rejected} rewritten, ${rejected} not fit to show, ${failed} failed${fatal ? `, ${batch.length - done - failed} not tried` : ""}`);
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
