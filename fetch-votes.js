// fetch-votes.js
//
// What this does, in plain terms:
// 1. Fetches a list of the most recent Commons divisions (votes)
// 2. For each division, fetches the full result — which lists every MP
//    and how they voted (Aye/No), including tellers
// 3. Matches each voting MP against your `politicians` table and saves
//    their vote — safely re-runnable, no duplicates
//
// Run it with: node fetch-votes.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// How many of the most recent divisions to pull. Each one becomes roughly
// 400-600 saved rows (one per MP who voted), so keep this modest to start.
const DIVISIONS_TO_FETCH = 100;

// ---- Step 1: get a list of the most recent division IDs ----
async function fetchRecentDivisionIds() {
  const url = `https://commonsvotes-api.parliament.uk/data/divisions.json/search?queryParameters.take=${DIVISIONS_TO_FETCH}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Divisions list API error: ${res.status}`);
  const data = await res.json();
  return data.map((d) => d.DivisionId);
}

// ---- Step 2: get the full detail (including Ayes/Noes) for one division ----
async function fetchDivisionDetail(divisionId) {
  const url = `https://commonsvotes-api.parliament.uk/data/division/${divisionId}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Division detail API error for ${divisionId}: ${res.status}`);
  return res.json();
}

// ---- Step 3: turn a division's Ayes/Noes/Tellers into vote rows ----
function buildVoteRows(division, memberIdToPoliticianRowId) {
  const votesByMember = new Map(); // parliament_member_id -> true (aye) / false (no)

  for (const m of division.Ayes ?? []) votesByMember.set(m.MemberId, true);
  for (const m of division.AyeTellers ?? []) votesByMember.set(m.MemberId, true);
  for (const m of division.Noes ?? []) votesByMember.set(m.MemberId, false);
  for (const m of division.NoTellers ?? []) votesByMember.set(m.MemberId, false);

  const rows = [];
  for (const [parliamentMemberId, votedAye] of votesByMember.entries()) {
    const politicianRowId = memberIdToPoliticianRowId.get(parliamentMemberId);
    if (!politicianRowId) continue; // MP not in our politicians table (e.g. no longer current)
    rows.push({
      politician_id: politicianRowId,
      division_id: division.DivisionId,
      title: division.Title ?? null,
      date: division.Date ? division.Date.slice(0, 10) : null,
      voted_aye: votedAye,
      aye_count: division.AyeCount ?? null,
      no_count: division.NoCount ?? null,
      source_url: `https://commonsvotes-api.parliament.uk/data/division/${division.DivisionId}.json`,
    });
  }
  return rows;
}

async function main() {
  // Build a lookup: parliament_member_id -> our internal politicians.id
  const { data: politicians, error } = await supabase
    .from("politicians")
    .select("id, parliament_member_id");
  if (error) throw error;

  const memberIdToPoliticianRowId = new Map(
    politicians.map((p) => [p.parliament_member_id, p.id])
  );
  console.log(`Loaded ${politicians.length} known MPs.\n`);

  console.log("Fetching list of recent divisions...");
  const divisionIds = await fetchRecentDivisionIds();
  console.log(`Found ${divisionIds.length} recent divisions.\n`);

  let totalVoteRows = 0;
  for (const [i, divisionId] of divisionIds.entries()) {
    try {
      const division = await fetchDivisionDetail(divisionId);
      const rows = buildVoteRows(division, memberIdToPoliticianRowId);

      if (rows.length > 0) {
        const { error: upsertError } = await supabase
          .from("voting_records")
          .upsert(rows, { onConflict: "politician_id,division_id" });
        if (upsertError) throw upsertError;
      }

      totalVoteRows += rows.length;
      console.log(`[${i + 1}/${divisionIds.length}] "${division.Title}" — ${rows.length} MP votes saved`);
    } catch (err) {
      console.error(`  ⚠ Failed for division ${divisionId}: ${err.message}`);
    }
    await sleep(150);
  }

  console.log(`\nDone. ${divisionIds.length} divisions processed, ${totalVoteRows} total vote records saved/updated.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
