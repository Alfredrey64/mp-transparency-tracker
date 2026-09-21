// fetch-petitions.js
//
// What this does, in plain terms:
// 1. Fetches the most-signed open petitions to Parliament, plus the most
//    recently closed ones that got a government response or a debate —
//    from petition.parliament.uk's own public API (no key needed).
// 2. Replaces the `petitions` table with this fresh snapshot each run —
//    this is a leaderboard of current activity, not an accumulating
//    archive of every petition ever submitted (there are tens of
//    thousands of those, most with a handful of signatures).
//
// Run it with: node fetch-petitions.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toRow(p) {
  const a = p.attributes;
  return {
    id: p.id,
    action: a.action,
    background: a.background,
    signature_count: a.signature_count ?? 0,
    state: a.state,
    created_at_petition: a.created_at,
    closing_date: a.closing_date,
    government_response_summary: a.government_response?.summary ?? null,
    government_responded_at: a.government_response_at,
    // The API often sets debate_outcome_at (the debate happened) without a
    // debate_outcome summary (Parliament doesn't always publish a written
    // one) — falling back to a plain "it happened, here's when" note avoids
    // that showing up as a stale "scheduled for" date in the past.
    debate_outcome_summary: a.debate_outcome_at
      ? a.debate_outcome?.summary ??
        `Debated in the Commons on ${a.debate_outcome_at.slice(0, 10)} — Parliament doesn't publish a written summary of every debate's outcome; see Hansard for the transcript.`
      : null,
    debate_scheduled_on: !a.debate_outcome_at ? (a.debate_scheduled_on ?? a.scheduled_debate_date ?? null) : null,
    url: `https://petition.parliament.uk/petitions/${p.id}`,
  };
}

async function fetchPages(query, maxPages) {
  const results = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`https://petition.parliament.uk/petitions.json?${query}&page=${page}`);
    if (!res.ok) break;
    const data = await res.json();
    results.push(...data.data);
    if (!data.links?.next) break;
    await sleep(150);
  }
  return results;
}

async function main() {
  console.log("Fetching top open petitions by signature count...");
  const openTop = await fetchPages("state=open&sort=signature_count", 3); // top ~75

  console.log("Fetching recently closed petitions with a government response or debate...");
  const closedRecent = await fetchPages("state=closed", 2); // most recently closed ~50
  const closedWithOutcome = closedRecent.filter(
    (p) => p.attributes.government_response_at || p.attributes.debate_outcome_at
  );

  const all = [...openTop, ...closedWithOutcome];
  const rows = all.map(toRow);

  console.log(`Replacing petitions table with ${rows.length} petitions...`);
  const { error: deleteError } = await supabase.from("petitions").delete().neq("id", 0);
  if (deleteError) throw deleteError;

  const BATCH_SIZE = 100;
  let saved = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from("petitions").insert(batch);
    if (insertError) {
      console.error(`  ⚠ Batch ${i / BATCH_SIZE + 1} failed: ${insertError.message}`);
      continue;
    }
    saved += batch.length;
  }

  console.log(`\nDone. Saved ${saved} of ${rows.length} petitions.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
