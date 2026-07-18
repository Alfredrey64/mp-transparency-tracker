// fetch-interests.js
//
// What this does, in plain terms:
// 1. Fetches EVERY current MP from the Members API (paged, since there are ~650)
// 2. For each MP, fetches their declared financial interests
// 3. Saves/updates all of it into Supabase — safely re-runnable, no duplicates
//
// Run it with: node fetch-interests.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Small pause between requests so we're not hammering a public government API
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- Step 1: fetch every current MP, one page at a time ----
async function fetchAllCurrentMembers() {
  const members = [];
  let skip = 0;
  const take = 20; // the API's page size
  let total = Infinity;

  while (skip < total) {
    const url = `https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=true&skip=${skip}&take=${take}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Members API error: ${res.status}`);
    const data = await res.json();

    total = data.totalResults ?? 0;
    for (const item of data.items ?? []) {
      const v = item.value;
      members.push({
        memberId: v.id,
        name: v.nameDisplayAs,
        party: v.latestParty?.name ?? null,
        partyAbbreviation: v.latestParty?.abbreviation ?? null,
        partyColour: v.latestParty?.backgroundColour ?? null,
        constituency: v.latestHouseMembership?.membershipFrom ?? null,
        gender: v.gender ?? null,
        thumbnailUrl: v.thumbnailUrl ?? null,
        membershipStartDate: v.latestHouseMembership?.membershipStartDate
          ? v.latestHouseMembership.membershipStartDate.slice(0, 10) // keep just YYYY-MM-DD
          : null,
      });
    }

    skip += take;
    console.log(`  fetched ${Math.min(skip, total)} / ${total} MPs...`);
    await sleep(150);
  }

  return members;
}

// ---- Step 2: save/update a politician record ----
async function upsertPolitician(member) {
  const { data, error } = await supabase
    .from("politicians")
    .upsert(
      {
        parliament_member_id: member.memberId,
        name: member.name,
        party: member.party,
        party_abbreviation: member.partyAbbreviation,
        party_colour: member.partyColour,
        constituency: member.constituency,
        gender: member.gender,
        thumbnail_url: member.thumbnailUrl,
        membership_start_date: member.membershipStartDate,
      },
      { onConflict: "parliament_member_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---- Step 3: parse the "Name - £Amount" style summary text ----
function parseSummary(summary) {
  if (!summary) return { donorName: null, valueAmount: null };
  const match = summary.match(/^(.*?)\s*-\s*£\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return { donorName: null, valueAmount: null };
  return {
    donorName: match[1].trim(),
    valueAmount: parseFloat(match[2].replace(/,/g, "")),
  };
}

// ---- Step 4: fetch and save one MP's financial interests ----
async function fetchAndSaveInterests(politicianRowId, memberId) {
  const url = `https://interests-api.parliament.uk/api/v1/Interests?MemberId=${memberId}&Take=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Interests API error for member ${memberId}: ${res.status}`);
  const data = await res.json();

  const items = data.items ?? [];
  if (items.length === 0) return 0;

  const rows = items.map((item) => {
    const v = item.value ?? item;
    const summaryText = v.summary ?? v.interestSummary ?? null;
    const { donorName, valueAmount } = parseSummary(summaryText);
    return {
      parliament_interest_id: v.id ?? null,
      politician_id: politicianRowId,
      category: v.category?.name ?? v.categoryName ?? null,
      summary: summaryText,
      donor_name: donorName,
      value_amount: valueAmount,
      date_registered: v.registrationDate ?? v.publishedDate ?? null,
      source_url: v.id ? `https://interests-api.parliament.uk/api/v1/Interests/${v.id}` : null,
    };
  });

  const { error } = await supabase
    .from("financial_interests")
    .upsert(rows, { onConflict: "parliament_interest_id" });
  if (error) throw error;
  return rows.length;
}

// ---- Run everything ----
async function main() {
  console.log("Fetching list of all current MPs...");
  const members = await fetchAllCurrentMembers();
  console.log(`Found ${members.length} current MPs.\n`);

  let totalInterests = 0;
  for (const [i, member] of members.entries()) {
    try {
      const politicianRow = await upsertPolitician(member);
      const count = await fetchAndSaveInterests(politicianRow.id, member.memberId);
      totalInterests += count;
      console.log(`[${i + 1}/${members.length}] ${member.name} — ${count} interest(s)`);
    } catch (err) {
      console.error(`  ⚠ Failed for ${member.name}: ${err.message}`);
    }
    await sleep(150); // be polite to the API between MPs
  }

  console.log(`\nDone. ${members.length} MPs processed, ${totalInterests} interests saved/updated.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
