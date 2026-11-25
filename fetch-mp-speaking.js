// fetch-mp-speaking.js
//
// What this does, in plain terms:
// 1. Lists the current MPs from the Members API.
// 2. For each, asks Hansard's search API how many spoken contributions it has recorded under their name in the last 12 months (one request each, about six seconds, four at a time).
// 3. Writes the counts, and the middle MP's count for comparison, to frontend/src/data/mpSpeaking.json for the "Debates they spoke in" box on each MP's profile (see mpSpeaking.js).
//
// The counts barely move from day to day, so a file built in the last six days is left alone unless FORCE=1. An MP whose lookup fails keeps the count they had; if more than one in ten
// fail the old file is kept as it is and the run fails (so the pipeline report says so).
//
// Run it with: node fetch-mp-speaking.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fetchRetry, mapLimit, tooManyFailed } from "./httpFetch.js";
import { buildSpeaking, shapeSpeaking, windowTo } from "./mpSpeaking.js";

const OUTPUT = "frontend/src/data/mpSpeaking.json";
const HANSARD = "https://hansard-api.parliament.uk/search/contributions/Spoken.json";
const MEMBERS = "https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=true";
const PAGE_SIZE = 20;
const MIN_MPS = 600;
const REFRESH_AFTER_DAYS = 6;

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } }, { timeoutMs: 90_000 });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function currentMpIds() {
  const ids = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const data = await getJson(`${MEMBERS}&skip=${skip}&take=${PAGE_SIZE}`);
    const items = data?.items ?? [];
    ids.push(...items.map((i) => i.value?.id).filter(Number.isInteger));
    if (items.length < PAGE_SIZE || ids.length >= data.totalResults) break;
  }
  return ids;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const before = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : null;
  if (before && !process.env.FORCE && (new Date(`${today}T12:00:00Z`) - new Date(`${before.to}T12:00:00Z`)) / 86400000 < REFRESH_AFTER_DAYS) {
    return console.log(`Speaking counts are from ${before.to}, so they were left as they are (set FORCE=1 to rebuild).`);
  }
  const ids = await currentMpIds();
  if (ids.length < MIN_MPS) throw new Error(`Only ${ids.length} current MPs came back, so ${OUTPUT} was left as it is.`);
  const { from, to } = windowTo(today);
  console.log(`Counting contributions for ${ids.length} MPs, ${from} to ${to}...`);

  let failed = 0;
  let done = 0;
  const rows = await mapLimit(ids, 4, async (id) => {
    try {
      const shaped = shapeSpeaking(await getJson(`${HANSARD}?queryParameters.memberId=${id}&queryParameters.startDate=${from}&queryParameters.endDate=${to}&queryParameters.take=1&queryParameters.orderBy=SittingDateDesc`));
      if (!shaped) throw new Error("not a Hansard search result");
      return shaped;
    } catch (err) {
      failed += 1;
      console.error(`  MP ${id}: ${err.message}`);
      return before?.members?.[id] ?? null;
    } finally {
      done += 1;
      if (done % 100 === 0) console.log(`  ${done} of ${ids.length}`);
    }
  });
  if (tooManyFailed(failed, ids.length)) throw new Error(`${failed} of ${ids.length} lookups failed, so ${OUTPUT} was left as it is.`);

  const members = {};
  ids.forEach((id, i) => { if (rows[i]) members[id] = rows[i]; });
  writeFileSync(OUTPUT, `${JSON.stringify(buildSpeaking(members, { from, to }))}\n`);
  console.log(`Wrote ${OUTPUT}: ${Object.keys(members).length} MPs (${failed} lookups failed).`);
}

main().catch((err) => { console.error("Something went wrong:", err.message); process.exit(1); });
