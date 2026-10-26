// fetch-lords-votes.js
//
// What this does, in plain terms:
// 1. Lists every House of Lords division from the last 12 months from Parliament's Lords Votes API.
// 2. Fetches how each peer voted in every one of them.
// 3. Boils that down (see lordsVotes.js) to how often each peer voted and how often they voted against the way most of their party voted, and
//    writes frontend/src/data/lordsVotes.json for the Lords votes page.
//
// If too few divisions come back (an upstream outage) the existing file is left alone.
//
// Run it with: node fetch-lords-votes.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { summariseLordsVotes } from "./lordsVotes.js";

const OUTPUT = "frontend/src/data/lordsVotes.json";
const API = "https://lordsvotes-api.parliament.uk/data/Divisions";
const MIN_DIVISIONS = 40;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function main() {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const since = start.toISOString().slice(0, 10);

  const ids = [];
  for (let skip = 0; ; skip += 100) {
    const page = await getJson(`${API}/search?skip=${skip}&take=100&startDate=${since}`);
    for (const d of page) ids.push(d.divisionId);
    if (page.length < 100) break;
  }
  console.log(`Found ${ids.length} Lords divisions since ${since}.`);

  const divisions = [];
  for (const [i, id] of ids.entries()) {
    try {
      divisions.push(await getJson(`${API}/${id}`));
    } catch (err) {
      console.error(`  Division ${id} failed: ${err.message}`);
    }
    if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${ids.length}`);
    await sleep(80);
  }

  if (divisions.length < MIN_DIVISIONS) {
    console.error(`Only ${divisions.length} divisions came back, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }
  const out = summariseLordsVotes(divisions, { since });
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.divisions} divisions, ${Object.keys(out.peers).length} peers.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
