// fetch-constituencies.js
//
// What this does, in plain terms:
// 1. Lists every current MP from the Parliament Members API and, for each,
//    fetches the latest election result for their seat: who won, the
//    majority, turnout, electorate, and the top few candidates.
// 2. Fetches the most-signed open petitions, and for each the number of
//    signatures from every constituency.
// 3. Writes the lot to frontend/src/data/constituencies.json, which the
//    Constituency page loads on demand. A file in the repo rather than a
//    database table: it changes slowly, is read in one go, and needs no
//    schema. The daily workflow commits it, and that commit redeploys.
//
// If too few seats come back (an upstream outage) the existing file is left
// alone — a partial file would silently drop constituencies from the site.
//
// Run it with: node fetch-constituencies.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { buildResult, indexPetitions, normaliseConstituencyName } from "./constituencyData.js";

const OUTPUT = "frontend/src/data/constituencies.json";
const MIN_SEATS = 600;
const PAGE_SIZE = 20; // the Members API ignores a larger `take`
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (attempt === 5) throw err;
      await sleep(1500 * attempt);
    }
  }
}

async function fetchAllCurrentMembers() {
  const all = [];
  let skip = 0;
  while (true) {
    const data = await getJson(`https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=true&skip=${skip}&take=${PAGE_SIZE}`);
    const items = data?.items ?? [];
    all.push(...items.map((i) => i.value));
    if (items.length < PAGE_SIZE || all.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    await sleep(100);
  }
  return all;
}

async function fetchOpenPetitions() {
  const list = [];
  for (let page = 1; page <= 3; page++) {
    const data = await getJson(`https://petition.parliament.uk/petitions.json?state=open&sort=signature_count&page=${page}`);
    if (!data) break;
    list.push(...data.data);
    if (!data.links?.next) break;
    await sleep(150);
  }
  const detailed = [];
  for (const p of list) {
    const d = await getJson(`https://petition.parliament.uk/petitions/${p.id}.json`);
    const a = d?.data?.attributes;
    if (a?.signatures_by_constituency) detailed.push({ id: p.id, action: a.action, signaturesByConstituency: a.signatures_by_constituency });
    await sleep(150);
  }
  return detailed;
}

async function main() {
  const previous = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : null;

  console.log("Fetching current MPs...");
  const members = await fetchAllCurrentMembers();
  console.log(`Found ${members.length} MPs. Fetching each seat's latest election result...`);

  const seats = {};
  let failed = 0;
  for (const [i, member] of members.entries()) {
    const seatName = member.latestHouseMembership?.membershipFrom;
    if (!seatName) continue;
    const key = normaliseConstituencyName(seatName);
    try {
      const raw = await getJson(`https://members-api.parliament.uk/api/Members/${member.id}/LatestElectionResult`);
      seats[key] = {
        name: seatName,
        mp: { memberId: member.id, name: member.nameDisplayAs, party: member.latestParty?.name ?? null, colour: member.latestParty?.backgroundColour ?? null },
        result: buildResult(raw?.value),
        petitions: [],
      };
    } catch (err) {
      failed++;
      console.error(`  ⚠ ${seatName}: ${err.message}`);
      if (previous?.constituencies?.[key]) seats[key] = { ...previous.constituencies[key], petitions: [] };
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1} of ${members.length}...`);
    await sleep(80);
  }

  const count = Object.keys(seats).length;
  if (count < MIN_SEATS) throw new Error(`Only ${count} seats came back (need ${MIN_SEATS}) — leaving ${OUTPUT} unchanged.`);

  console.log("Fetching the most-signed open petitions and their local signatures...");
  let petitionsOk = true;
  try {
    const petitions = await fetchOpenPetitions();
    const index = indexPetitions(petitions);
    let matched = 0;
    for (const [key, list] of index) {
      if (seats[key]) {
        seats[key].petitions = list;
        matched++;
      }
    }
    console.log(`  ${petitions.length} petitions; local signatures matched to ${matched} seats.`);
    if (matched < MIN_SEATS / 2) petitionsOk = false;
  } catch (err) {
    petitionsOk = false;
    console.error(`  ⚠ Petitions failed: ${err.message}`);
  }
  // Petition data is a bonus on top of the election results; if it failed,
  // keep yesterday's rather than showing none.
  if (!petitionsOk && previous?.constituencies) {
    for (const [key, seat] of Object.entries(seats)) seat.petitions = previous.constituencies[key]?.petitions ?? [];
  }

  writeFileSync(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), constituencies: seats }) + "\n");
  console.log(`\nDone. Wrote ${count} constituencies (${failed} used older data).`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
