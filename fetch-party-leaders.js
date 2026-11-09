// fetch-party-leaders.js
//
// What this does, in plain terms:
// 1. For each of the twelve parties on the Party History page, reads the "Leader" row of the party's Wikipedia infobox and the leader's portrait from their Wikipedia page
//    summary (hosted on thumb.wikimedia.org, which the site's Content-Security-Policy allows).
// 2. Checks the portrait address really answers with an image.
// 3. Writes frontend/src/data/partyLeaders.json, which the page reads. What is kept, and when a change of leader is accepted, is decided in partyLeaders.js (a new name must
//    be seen on two different days; a party that cannot be read keeps its last good entry; many changes at once are refused).
//
// It runs in the daily refresh. It exits with 1 if any party could not be read today (the file is still written with everything that could), which the run records as a failed
// step, and two failures in a row open an issue.
//
// By hand: node fetch-party-leaders.js            (the same as the daily run)
//          node fetch-party-leaders.js --accept   (adopt a change of leader at once, after checking it is real)

import fs from "fs";
import { fetchRetry } from "./httpFetch.js";
import { PARTIES, MAX_CHANGES_PER_RUN, leaderFromInfobox, plausibleName, decide } from "./partyLeaders.js";

const OUTPUT_PATH = "frontend/src/data/partyLeaders.json";
const HEADERS = { "User-Agent": "domesday-live/1.0 (civic information site; contact via GitHub)" };
const IMMEDIATE = process.argv.includes("--accept");
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function read(party, article) {
  const raw = await fetchRetry(`https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(article)}&action=raw`, { headers: HEADERS });
  if (!raw.ok) throw new Error(`the party page answered ${raw.status}`);
  const lead = leaderFromInfobox(await raw.text());
  if (!lead) throw new Error("no leader found in the infobox");
  if (!plausibleName(lead.name)) throw new Error(`"${lead.name}" does not look like a person's name`);

  let photo = null;
  try {
    const sum = await fetchRetry(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(lead.page.replace(/ /g, "_"))}`, { headers: HEADERS });
    if (sum.ok) {
      const data = await sum.json();
      const src = data.thumbnail?.source;
      if (src && /^https:\/\/thumb\.wikimedia\.org\//.test(src)) {
        const head = await fetchRetry(src, { method: "HEAD", headers: HEADERS }, { retries: 2, timeoutMs: 20_000 });
        if (head.ok && (head.headers.get("content-type") ?? "").startsWith("image/")) photo = src;
        else console.log(`${party}: the portrait address did not answer with an image (${head.status})`);
      }
    }
  } catch (e) {
    // A portrait is a nicety: the page shows initials without one. Say so and carry on with the name.
    console.log(`${party}: portrait lookup failed (${e.message})`);
  }
  return { name: lead.name, role: lead.role, page: lead.page.replace(/ /g, "_"), photo };
}

async function main() {
  let previous = { leaders: {} };
  try { previous = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8")); } catch { /* first run */ }
  const prevLeaders = previous.leaders ?? {};

  const leaders = { ...prevLeaders };
  const failures = [];
  const changed = [];

  for (const [party, article] of Object.entries(PARTIES)) {
    try {
      const found = await read(party, article);
      const { entry, change } = decide(prevLeaders[party], found, today, { immediate: IMMEDIATE });
      leaders[party] = entry;
      if (change === "pending" || change === "adopted") changed.push(party);
      console.log(`${party}: ${found.name} (${change})${entry.pending ? ` — a different name, ${entry.pending.name}, first seen ${entry.pending.seen}; not yet accepted` : ""}`);
    } catch (e) {
      failures.push(`${party}: ${e.message}`);
      console.log(`${party}: could not be read (${e.message}); keeping ${prevLeaders[party]?.name ?? "nothing"}`);
    }
    await sleep(500);
  }

  // Several parties appearing to change at once is a fault in how the pages are read, not a run of elections: refuse every change (the notes too) and say so.
  if (changed.length > MAX_CHANGES_PER_RUN && !IMMEDIATE) {
    for (const party of changed) {
      leaders[party] = prevLeaders[party] ?? leaders[party];
      failures.push(`${party}: refused, because ${changed.length} parties seemed to change leader at once`);
    }
  }

  const missing = Object.keys(PARTIES).filter((p) => !leaders[p]?.name);
  const next = {
    // The date every party was last read successfully, so the page can say how fresh the list is, and does not claim a fresh check after a partial one.
    retrieved: failures.length === 0 && missing.length === 0 ? today : previous.retrieved ?? today,
    source: "Wikipedia party infoboxes; portraits via Wikimedia Commons",
    leaders,
  };
  const text = `${JSON.stringify(next, null, 2)}\n`;
  if (!fs.existsSync(OUTPUT_PATH) || fs.readFileSync(OUTPUT_PATH, "utf8") !== text) fs.writeFileSync(OUTPUT_PATH, text);

  for (const f of failures) console.log(`::warning::Party leaders — ${f}`);
  if (missing.length) console.log(`::warning::Party leaders — no leader stored for: ${missing.join(", ")}`);
  console.log(`${Object.keys(leaders).length - missing.length} of ${Object.keys(PARTIES).length} parties have a leader; ${failures.length} problem${failures.length === 1 ? "" : "s"}.`);
  process.exit(failures.length || missing.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
