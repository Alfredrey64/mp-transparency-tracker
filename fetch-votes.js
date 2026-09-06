// fetch-votes.js
//
// What this does, in plain terms:
// 1. Fetches a list of the most recent Commons divisions (votes)
// 2. For each division, fetches the full result — which lists every MP
//    and how they voted (Aye/No), including tellers
// 3. Works out, for each MP, whether they voted with or against the
//    majority of their own party in that division (our best available
//    proxy for "followed the whip", since actual whip instructions
//    are never published)
// 4. Matches each voting MP against your `politicians` table and saves
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

// ---- Step 3: turn a division's Ayes/Noes/Tellers into vote rows, with party-majority flag ----
function buildVoteRows(division, memberIdToPolitician) {
  const votesByMember = new Map(); // parliament_member_id -> true (aye) / false (no)

  for (const m of division.Ayes ?? []) votesByMember.set(m.MemberId, true);
  for (const m of division.AyeTellers ?? []) votesByMember.set(m.MemberId, true);
  for (const m of division.Noes ?? []) votesByMember.set(m.MemberId, false);
  for (const m of division.NoTellers ?? []) votesByMember.set(m.MemberId, false);

  // Work out each party's majority vote in this division, using only MPs we track
  const partyTallies = new Map(); // party -> { aye: n, no: n }
  for (const [memberId, votedAye] of votesByMember.entries()) {
    const politician = memberIdToPolitician.get(memberId);
    if (!politician?.party) continue;
    const tally = partyTallies.get(politician.party) ?? { aye: 0, no: 0 };
    votedAye ? tally.aye++ : tally.no++;
    partyTallies.set(politician.party, tally);
  }
  const partyMajority = new Map(); // party -> true (aye majority) / false (no majority) / null (tie)
  for (const [party, tally] of partyTallies.entries()) {
    if (tally.aye === tally.no) partyMajority.set(party, null);
    else partyMajority.set(party, tally.aye > tally.no);
  }

  const rows = [];
  for (const [parliamentMemberId, votedAye] of votesByMember.entries()) {
    const politician = memberIdToPolitician.get(parliamentMemberId);
    if (!politician) continue; // not a current MP we track
    const majority = politician.party ? partyMajority.get(politician.party) : null;
    const votedWithParty = majority === null || majority === undefined ? null : votedAye === majority;

    rows.push({
      politician_id: politician.id,
      division_id: division.DivisionId,
      title: division.Title ?? null,
      date: division.Date ? division.Date.slice(0, 10) : null,
      voted_aye: votedAye,
      aye_count: division.AyeCount ?? null,
      no_count: division.NoCount ?? null,
      voted_with_party_majority: votedWithParty,
      source_url: `https://commonsvotes-api.parliament.uk/data/division/${division.DivisionId}.json`,
    });
  }
  return rows;
}

async function main() {
  // Build a lookup: parliament_member_id -> { id (our row id), party }
  const { data: politicians, error } = await supabase
    .from("politicians")
    .select("id, parliament_member_id, party");
  if (error) throw error;

  const memberIdToPolitician = new Map(
    politicians.map((p) => [p.parliament_member_id, p])
  );
  console.log(`Loaded ${politicians.length} known MPs.\n`);

  console.log("Fetching list of recent divisions...");
  const divisionIds = await fetchRecentDivisionIds();
  console.log(`Found ${divisionIds.length} recent divisions.\n`);

  let totalVoteRows = 0;
  for (const [i, divisionId] of divisionIds.entries()) {
    try {
      const division = await fetchDivisionDetail(divisionId);
      const rows = buildVoteRows(division, memberIdToPolitician);

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
