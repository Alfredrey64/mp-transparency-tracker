// fetch-interests.js
//
// What this does, in plain terms:
// 1. Looks up a small starter list of MPs by name using the Members API
// 2. For each MP, fetches their declared financial interests using the Interests API
// 3. Saves/updates both into your Supabase database
//
// Run it with: node fetch-interests.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

// ---- Setup ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // the SECRET key, never the publishable one, for this script
);

// Start small — add more MPs here once this works end to end.
// These are just examples; replace with whichever MPs you actually want to track.
const MPS_TO_TRACK = ["Keir Starmer", "Rishi Sunak", "Ed Davey"];

// ---- Step 1: find each MP's official Member ID by name ----
async function findMemberId(name) {
  const url = `https://members-api.parliament.uk/api/Members/Search?Name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Members API error for "${name}": ${res.status}`);
  const data = await res.json();

  const first = data.items?.[0]?.value;
  if (!first) {
    console.warn(`  ⚠ No match found for "${name}" — skipping`);
    return null;
  }
  return {
    memberId: first.id,
    name: first.nameDisplayAs,
    party: first.latestParty?.name ?? null,
    constituency: first.latestHouseMembership?.membershipFrom ?? null,
  };
}

// ---- Step 2: save/update the politician record ----
async function upsertPolitician(member) {
  const { data, error } = await supabase
    .from("politicians")
    .upsert(
      {
        parliament_member_id: member.memberId,
        name: member.name,
        party: member.party,
        constituency: member.constituency,
      },
      { onConflict: "parliament_member_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data; // includes the internal Supabase `id` we need for the next step
}

// ---- Step 3: fetch and save their financial interests ----
async function fetchAndSaveInterests(politicianRowId, memberId) {
  const url = `https://interests-api.parliament.uk/api/v1/Interests?MemberId=${memberId}&Take=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Interests API error for member ${memberId}: ${res.status}`);
  const data = await res.json();

  const items = data.items ?? [];
  if (items.length === 0) {
    console.log(`  (no declared interests found for this member)`);
    return;
  }

  // Uncomment this once, the first time you run the script, to inspect the
  // real shape of the data and confirm the field names below are correct:
  // console.log(JSON.stringify(items[0], null, 2));

  // The API bundles donor name + amount into one free-text summary, e.g.
  // "The Arsenal Football Club Limited - £1,000.00" — so we split it ourselves.
  function parseSummary(summary) {
    if (!summary) return { donorName: null, valueAmount: null };
    const match = summary.match(/^(.*?)\s*-\s*£\s*([\d,]+(?:\.\d{1,2})?)/);
    if (!match) return { donorName: null, valueAmount: null };
    return {
      donorName: match[1].trim(),
      valueAmount: parseFloat(match[2].replace(/,/g, "")),
    };
  }

  const rows = items.map((item) => {
    const v = item.value ?? item;
    const summaryText = v.summary ?? v.interestSummary ?? null;
    const { donorName, valueAmount } = parseSummary(summaryText);
    return {
      politician_id: politicianRowId,
      category: v.category?.name ?? v.categoryName ?? null,
      summary: summaryText,
      donor_name: donorName,
      value_amount: valueAmount,
      date_registered: v.registrationDate ?? v.publishedDate ?? null,
      source_url: `https://interests-api.parliament.uk/api/v1/Interests/${v.id ?? ""}`,
    };
  });

  const { error } = await supabase.from("financial_interests").insert(rows);
  if (error) throw error;
  console.log(`  ✔ saved ${rows.length} interest(s)`);
}

// ---- Run everything ----
async function main() {
  for (const name of MPS_TO_TRACK) {
    console.log(`\nLooking up: ${name}`);
    const member = await findMemberId(name);
    if (!member) continue;

    const politicianRow = await upsertPolitician(member);
    console.log(`  Saved politician record (id ${politicianRow.id})`);

    await fetchAndSaveInterests(politicianRow.id, member.memberId);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
