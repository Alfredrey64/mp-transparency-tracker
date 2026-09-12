// fetch-by-elections.js
//
// What this does, in plain terms:
// 1. Fetches every current MP from the Parliament Members API. For each
//    one, checks their latest election result — anyone whose most recent
//    result is flagged as NOT a general election won a stand-alone
//    by-election, which only happens when a seat falls vacant mid-Parliament
//    (resignation, death, expulsion). Saved as status "completed".
// 2. Separately, checks every constituency's own record for one with no
//    current representation at all — a seat whose MP has left but whose
//    by-election hasn't happened (or hasn't been called) yet. Saved as
//    status "vacant", with the vacancy reason cross-referenced from our own
//    former_mps table (fetch-former-mps.js).
// 3. Saves everything to Supabase, and clears out any "vacant" row for a
//    seat that isn't vacant any more (its by-election has since completed).
//
// Run it with: node fetch-by-elections.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAGE_SIZE = 20; // the API ignores a larger `take` and always returns 20

async function fetchAllCurrentMembers() {
  const all = [];
  let skip = 0;
  while (true) {
    const url = `https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=true&skip=${skip}&take=${PAGE_SIZE}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Members search API error: ${res.status}`);
    const data = await res.json();
    const items = data.items ?? [];
    all.push(...items.map((i) => i.value));
    if (items.length < PAGE_SIZE || all.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    await sleep(120);
  }
  return all;
}

async function fetchLatestElectionResult(memberId) {
  const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/LatestElectionResult`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function fetchAllConstituencies() {
  const all = [];
  let skip = 0;
  while (true) {
    const url = `https://members-api.parliament.uk/api/Location/Constituency/Search?searchText=&skip=${skip}&take=${PAGE_SIZE}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Constituency search API error: ${res.status}`);
    const data = await res.json();
    const items = data.items ?? [];
    all.push(...items.map((i) => i.value));
    if (items.length < PAGE_SIZE || all.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    await sleep(120);
  }
  return all;
}

async function main() {
  console.log("Fetching all current MPs...");
  const members = await fetchAllCurrentMembers();
  console.log(`Found ${members.length} current MPs. Checking each one's latest election result...\n`);

  const completedRows = [];
  for (const [i, member] of members.entries()) {
    const result = await fetchLatestElectionResult(member.id);
    if (result && result.isGeneralElection === false) {
      completedRows.push({
        election_id: result.electionId,
        status: "completed",
        constituency_name: result.constituencyName,
        election_title: result.electionTitle,
        election_date: result.electionDate?.slice(0, 10) ?? null,
        result: result.result,
        majority: result.majority,
        turnout: result.turnout,
        electorate: result.electorate,
        winning_party: result.winningParty?.name ?? null,
        winning_party_colour: result.winningParty?.backgroundColour ?? null,
        winner_member_id: member.id,
        winner_name: member.nameDisplayAs,
        candidates: result.candidates ?? [],
        vacancy_reason: null,
        vacancy_since: null,
      });
      console.log(`[${i + 1}/${members.length}] ${member.nameDisplayAs} — by-election win in ${result.constituencyName} (${result.electionDate?.slice(0, 10)})`);
    }
    await sleep(100);
  }
  console.log(`\nFound ${completedRows.length} completed by-election(s) since the last general election.`);

  console.log("\nChecking every constituency for a currently vacant seat...");
  const constituencies = await fetchAllConstituencies();
  const vacant = constituencies.filter((c) => !c.currentRepresentation);
  console.log(`Found ${vacant.length} vacant seat(s).`);

  const { data: formerMps } = await supabase
    .from("former_mps")
    .select("name, constituency, membership_end_date, membership_end_reason");

  const vacantRows = vacant.map((c) => {
    const predecessor = (formerMps ?? [])
      .filter((m) => m.constituency === c.name)
      .sort((a, b) => (b.membership_end_date ?? "").localeCompare(a.membership_end_date ?? ""))[0];
    console.log(`  ${c.name} — vacated by ${predecessor?.name ?? "unknown"}${predecessor ? ` (${predecessor.membership_end_reason})` : ""}`);
    return {
      // Real by-elections use the Electoral Commission's own positive
      // electionId — negating the constituency's own id keeps this
      // synthetic id stable across runs without ever colliding with one.
      election_id: -c.id,
      status: "vacant",
      constituency_name: c.name,
      election_title: null,
      election_date: null,
      result: null,
      majority: null,
      turnout: null,
      electorate: null,
      winning_party: null,
      winning_party_colour: null,
      winner_member_id: null,
      winner_name: null,
      candidates: [],
      vacancy_reason: predecessor?.membership_end_reason ?? null,
      vacancy_since: predecessor?.membership_end_date ?? null,
    };
  });

  const allRows = [...completedRows, ...vacantRows];
  if (allRows.length > 0) {
    const { error } = await supabase.from("by_elections").upsert(allRows, { onConflict: "election_id" });
    if (error) throw error;
  }

  // A seat that was vacant on a previous run but isn't any more (its
  // by-election has since completed) needs its stale "vacant" row removed —
  // otherwise it would keep showing as pending forever.
  const stillVacantNames = new Set(vacant.map((c) => c.name));
  const { data: existingVacant } = await supabase.from("by_elections").select("election_id, constituency_name").eq("status", "vacant");
  const stale = (existingVacant ?? []).filter((r) => !stillVacantNames.has(r.constituency_name));
  if (stale.length > 0) {
    const { error } = await supabase.from("by_elections").delete().in("election_id", stale.map((r) => r.election_id));
    if (error) throw error;
    console.log(`Removed ${stale.length} stale vacant-seat row(s) whose by-election has since completed.`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
