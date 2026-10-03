// fetch-mp-careers.js
//
// What this does, in plain terms:
// 1. Lists every current MP from the Parliament Members API.
// 2. For each, fetches their biography record (constituencies and how many
//    times elected, government and shadow posts, committees, party history,
//    elections contested) and boils it down to a short row of numbers.
// 3. Writes frontend/src/data/mpCareers.json, keyed by Parliament's member
//    id, for the Parliament in Numbers page to join with the MP list.
// 4. Also writes the full dated detail (seats, parties, posts, committees,
//    lost elections) for the Career tab on each profile, split into
//    SHARDS files by member id so a profile fetches ~1/16th of it.
//
// If too few MPs come back (an upstream outage) the existing file is left
// alone, so the page never loses its data to a partial run.
//
// Run it with: node fetch-mp-careers.js

import { writeFileSync, mkdirSync } from "fs";
import { careerRecord, careerDetail } from "./mpCareers.js";

const OUTPUT = "frontend/src/data/mpCareers.json";
const DETAIL_DIR = "frontend/src/data/careerDetail";
const SHARDS = 16;
const MIN_MPS = 600;
const PAGE_SIZE = 20;
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

async function main() {
  console.log("Fetching current MPs...");
  const members = [];
  let skip = 0;
  while (true) {
    const data = await getJson(`https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=true&skip=${skip}&take=${PAGE_SIZE}`);
    const items = data?.items ?? [];
    members.push(...items.map((i) => i.value));
    if (items.length < PAGE_SIZE || members.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    await sleep(100);
  }
  console.log(`Found ${members.length} MPs. Fetching each biography...`);

  const mps = {};
  const detail = {};
  let failed = 0;
  for (const [i, member] of members.entries()) {
    try {
      const data = await getJson(`https://members-api.parliament.uk/api/Members/${member.id}/Biography`);
      if (data?.value) {
        mps[member.id] = careerRecord(data.value);
        detail[member.id] = careerDetail(data.value);
      }
      else failed++;
    } catch (err) {
      failed++;
      console.error(`  ⚠ ${member.nameDisplayAs}: ${err.message}`);
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1} of ${members.length}...`);
    await sleep(80);
  }

  const count = Object.keys(mps).length;
  if (count < MIN_MPS) throw new Error(`Only ${count} biographies came back (need ${MIN_MPS}) — leaving ${OUTPUT} unchanged.`);
  writeFileSync(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), mps }) + "\n");

  mkdirSync(DETAIL_DIR, { recursive: true });
  const shards = Array.from({ length: SHARDS }, () => ({}));
  for (const [id, record] of Object.entries(detail)) shards[Number(id) % SHARDS][id] = record;
  shards.forEach((shard, i) => writeFileSync(`${DETAIL_DIR}/${String(i).padStart(2, "0")}.json`, JSON.stringify(shard) + "\n"));
  console.log(`\nDone. Wrote careers for ${count} MPs (${failed} unavailable).`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
