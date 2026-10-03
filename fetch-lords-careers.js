// fetch-lords-careers.js
//
// What this does, in plain terms:
// 1. Lists every current member of the House of Lords from the Parliament
//    Members API.
// 2. For each peer, fetches their biography record and boils it down to a
//    short row of numbers: when they joined the Lords, whether and when
//    they were an MP, ministerial and shadow posts, Lords committees and
//    party changes.
// 3. Writes frontend/src/data/lordsCareers.json, keyed by Parliament's
//    member id, for the Lords half of the Parliament in Numbers page.
//
// If too few peers come back (an upstream outage) the existing file is left
// alone, so the page never loses its data to a partial run.
//
// Run it with: node fetch-lords-careers.js

import { writeFileSync } from "fs";
import { peerRecord } from "./mpCareers.js";

const OUTPUT = "frontend/src/data/lordsCareers.json";
const MIN_PEERS = 600;
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
  console.log("Fetching current peers...");
  const members = [];
  let skip = 0;
  while (true) {
    const data = await getJson(`https://members-api.parliament.uk/api/Members/Search?House=2&IsCurrentMember=true&skip=${skip}&take=${PAGE_SIZE}`);
    const items = data?.items ?? [];
    members.push(...items.map((i) => i.value));
    if (items.length < PAGE_SIZE || members.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    await sleep(100);
  }
  console.log(`Found ${members.length} peers. Fetching each biography...`);

  const peers = {};
  let failed = 0;
  for (const [i, member] of members.entries()) {
    try {
      const data = await getJson(`https://members-api.parliament.uk/api/Members/${member.id}/Biography`);
      if (data?.value) peers[member.id] = peerRecord(data.value);
      else failed++;
    } catch (err) {
      failed++;
      console.error(`  ⚠ ${member.nameDisplayAs}: ${err.message}`);
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1} of ${members.length}...`);
    await sleep(80);
  }

  const count = Object.keys(peers).length;
  if (count < MIN_PEERS) throw new Error(`Only ${count} biographies came back (need ${MIN_PEERS}) — leaving ${OUTPUT} unchanged.`);
  writeFileSync(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), peers }) + "\n");
  console.log(`\nDone. Wrote careers for ${count} peers (${failed} unavailable).`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
