// fetch-on-this-day.js
//
// What this does, in plain terms:
// 1. Searches Parliament's own Hansard record — the official word-for-word
//    transcript of everything said in the Commons — for debates that
//    happened on today's calendar date in past years
// 2. Filters out purely procedural entries (points of order, prayers, and
//    so on) and keeps a handful of genuine debate topics, spread across
//    different years
// 3. Replaces yesterday's rows in Supabase with today's — this is always a
//    snapshot for the current date, not an accumulating archive
//
// This is deliberately built on real Hansard search results rather than a
// hand-written list of "on this day" trivia — writing 366 days of accurate
// historical facts by hand isn't something we can do reliably, but
// searching the actual record for today's date is.
//
// Run it with: node fetch-on-this-day.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const KEEP = 4;
const YEARS_BACK = 45;

const GENERIC_TITLE = /^(business without debate|points? of order|prayers|petitions?|message to the lords|royal assent|deferred divisions?|oral answers to questions|written statements?)\b/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pad(n) {
  return String(n).padStart(2, "0");
}

// This makes up to 45 sequential requests to the same API in one run — a
// single transient network blip among them used to crash the whole script
// (and, with it, every step after it in the daily GitHub Action, since a
// failed step there stopped the rest of the pipeline running). Retrying a
// failed year up to 3 times, rather than letting one bad request take down
// the run, is the fix for that.
//
// A hung connection (no response at all, rather than an error) needs its
// own explicit timeout, since fetch() doesn't time out on its own — and in
// testing, node-fetch's own `signal`/AbortSignal.timeout() option didn't
// reliably interrupt a genuinely stuck request either, so this races the
// fetch against a plain timer instead. That leaves the abandoned request
// dangling rather than truly cancelled, but the process exits shortly after
// anyway, so that's harmless here.
const REQUEST_TIMEOUT_MS = 15000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

async function searchYear(year, mm, dd) {
  const date = `${year}-${mm}-${dd}`;
  const url = `https://hansard-api.parliament.uk/search/debates.json?queryParameters.startDate=${date}&queryParameters.endDate=${date}&queryParameters.house=Commons&queryParameters.take=5`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await withTimeout(
        fetch(url, { headers: { "User-Agent": "mp-transparency-tracker (contact via GitHub)" } }),
        REQUEST_TIMEOUT_MS
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.Results ?? []).map((r) => ({
        year,
        date,
        title: r.Title.trim(),
        debate_section: r.DebateSection,
        source_url: `https://hansard.parliament.uk/Commons/${date}/debates/${r.DebateSectionExtId}`,
      }));
    } catch (err) {
      if (attempt === 3) {
        console.error(`  ⚠ Hansard search failed for ${date} after 3 attempts: ${err.message}`);
        return [];
      }
      await sleep(1500 * attempt);
    }
  }
  return [];
}

async function main() {
  const today = new Date();
  const mm = pad(today.getMonth() + 1);
  const dd = pad(today.getDate());
  const currentYear = today.getFullYear();

  console.log(`Searching Hansard for Commons debates on ${dd}/${mm} across the last ${YEARS_BACK} years...`);

  const candidates = [];
  const seenYears = new Set();
  for (let y = currentYear - 1; y >= currentYear - YEARS_BACK && candidates.length < KEEP * 4; y--) {
    const results = await searchYear(y, mm, dd);
    for (const r of results) {
      if (GENERIC_TITLE.test(r.title)) continue;
      if (r.title.length < 6) continue;
      candidates.push(r);
    }
  }

  // Prefer spreading across different years rather than several from one.
  const picked = [];
  for (const c of candidates) {
    if (picked.length >= KEEP) break;
    if (seenYears.has(c.year)) continue;
    seenYears.add(c.year);
    picked.push(c);
  }
  // If we still don't have enough (a thin day), fill in from the remaining candidates.
  for (const c of candidates) {
    if (picked.length >= KEEP) break;
    if (picked.includes(c)) continue;
    picked.push(c);
  }

  const { error: deleteError } = await supabase.from("on_this_day").delete().neq("id", 0);
  if (deleteError) throw deleteError;

  if (picked.length > 0) {
    const rows = picked.map((p) => ({
      year: p.year,
      title: p.title,
      debate_section: p.debate_section,
      source_url: p.source_url,
    }));
    const { error: insertError } = await supabase.from("on_this_day").insert(rows);
    if (insertError) throw insertError;
  }

  console.log(`Done. Saved ${picked.length} debate(s) for ${dd}/${mm}:`);
  for (const p of picked) console.log(`  ${p.year} — ${p.title}`);
}

main()
  .then(() => process.exit(0)) // a raced-away, still-pending request from a
  // timed-out year could otherwise keep the process alive waiting for it
  .catch((err) => {
    console.error("Something went wrong:", err.message);
    process.exit(1);
  });
