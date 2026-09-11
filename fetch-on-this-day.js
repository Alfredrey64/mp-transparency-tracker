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
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const KEEP = 4;
const YEARS_BACK = 45;

const GENERIC_TITLE = /^(business without debate|points? of order|prayers|petitions?|message to the lords|royal assent|deferred divisions?|oral answers to questions|written statements?)\b/i;

function pad(n) {
  return String(n).padStart(2, "0");
}

async function searchYear(year, mm, dd) {
  const date = `${year}-${mm}-${dd}`;
  const url = `https://hansard-api.parliament.uk/search/debates.json?queryParameters.startDate=${date}&queryParameters.endDate=${date}&queryParameters.house=Commons&queryParameters.take=5`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.Results ?? []).map((r) => ({
    year,
    date,
    title: r.Title.trim(),
    debate_section: r.DebateSection,
    source_url: `https://hansard.parliament.uk/Commons/${date}/debates/${r.DebateSectionExtId}`,
  }));
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

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
