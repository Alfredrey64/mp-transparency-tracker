// fetch-todays-business.js
//
// What this does, in plain terms:
// 1. Asks Parliament's own "What's On" calendar what's actually scheduled
//    in the Commons chamber today
// 2. Keeps a handful of the most substantive items (debates, bill readings,
//    questions) and skips purely internal/procedural entries
// 3. Replaces yesterday's rows in Supabase with today's — always a snapshot
//    for the current sitting day, not an accumulating archive
//
// If Parliament isn't sitting today (a weekend, recess, or holiday), this
// will simply save zero rows — the frontend shows a message for that case
// rather than treating it as an error.
//
// Run it with: node fetch-todays-business.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const KEEP = 6;
const RELEVANT_TYPES = new Set(["Main Chamber", "Westminster Hall"]);

function pad(n) {
  return String(n).padStart(2, "0");
}

async function main() {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  console.log(`Fetching today's (${date}) Commons business...`);

  const url = `https://whatson-api.parliament.uk/calendar/events/list.json?startDate=${date}&endDate=${date}&house=Commons`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`What's On API error: ${res.status}`);
  const events = await res.json();

  const picked = (events ?? [])
    .filter((e) => RELEVANT_TYPES.has(e.Type) && e.Description?.trim())
    .slice(0, KEEP)
    .map((e) => ({
      event_time: e.StartTime?.trim() || null,
      event_type: e.Type,
      category: e.Category ?? null,
      description: e.Description.trim(),
      lead_member: e.Members?.[0]?.Name ?? null,
    }));

  const { error: deleteError } = await supabase.from("todays_business").delete().neq("id", 0);
  if (deleteError) throw deleteError;

  if (picked.length > 0) {
    const { error: insertError } = await supabase.from("todays_business").insert(picked);
    if (insertError) throw insertError;
  }

  console.log(`Done. Saved ${picked.length} item(s) for ${date}:`);
  for (const p of picked) console.log(`  ${p.event_time ?? "—"} ${p.description}`);
  if (picked.length === 0) console.log("  (Parliament doesn't appear to be sitting today.)");
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
