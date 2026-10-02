// fetch-constituency-history.js
//
// What this does, in plain terms:
// 1. Lists every *former* member of the House of Commons that the Parliament
//    Members API knows about (back to the 1950s) — about 1,700 people.
// 2. Each of them carries the last seat they held, with their dates and why
//    they left. This groups them by that seat, newest first, keeping only
//    seats that still exist today.
// 3. Writes frontend/src/data/constituencyHistory.json for the Constituency
//    page's History tab.
//
// Worth being clear about its limits, because the page is too: the API
// records only each person's *last* seat (someone who moved seats appears
// under the final one), and seats redrawn in 2024 can share a name with an
// older seat on different ground. So the page says "MPs whose last seat was
// this one", not "everyone who ever represented it".
//
// If far fewer members come back than expected (an upstream outage) the
// existing file is left alone.
//
// Run it with: node fetch-constituency-history.js

import { readFileSync, writeFileSync } from "fs";
import { indexFormerMps } from "./constituencyData.js";

const OUTPUT = "frontend/src/data/constituencyHistory.json";
const MIN_MEMBERS = 1000;
const PAGE_SIZE = 20;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (attempt === 5) throw err;
      await sleep(1500 * attempt);
    }
  }
}

async function main() {
  const seats = JSON.parse(readFileSync("frontend/src/data/constituencies.json", "utf8")).constituencies;
  const seatKeys = new Set(Object.keys(seats));

  console.log("Fetching former Commons members...");
  const members = [];
  let skip = 0;
  while (true) {
    const data = await getJson(`https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=false&skip=${skip}&take=${PAGE_SIZE}`);
    const items = data.items ?? [];
    members.push(...items.map((i) => i.value));
    if (items.length < PAGE_SIZE || members.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    if (members.length % 400 === 0) console.log(`  ${members.length} of ${data.totalResults}...`);
    await sleep(100);
  }
  if (members.length < MIN_MEMBERS) throw new Error(`Only ${members.length} former members came back (need ${MIN_MEMBERS}) — leaving ${OUTPUT} unchanged.`);

  const bySeat = indexFormerMps(members, seatKeys);
  const seatsWithHistory = Object.keys(bySeat).length;
  const placed = Object.values(bySeat).reduce((n, list) => n + list.length, 0);
  writeFileSync(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), bySeat }) + "\n");
  console.log(`\nDone. ${members.length} former members; ${placed} placed in ${seatsWithHistory} of ${Object.keys(seats).length} current seats.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
