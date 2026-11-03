// fetch-entry-notes.js
//
// What this does, in plain terms:
// 1. Reads the entries on the Coming up / Today pages (frontend/src/data/parliamentCalendar.json).
// 2. For each select committee evidence session, asks the Committees API for the committee's stated purpose.
// 3. For each debate, question or statement, asks Hansard (Parliament's official record) for the most recent earlier debate whose title closely matches, and keeps its date,
//    its address, and the question that was put if it opened with one, in Parliament's own words (see entryNotes.js for the matching rules).
// 4. Writes frontend/src/data/entryNotes.json, which the pop-up for an entry reads. An entry with no close match simply has no note.
//
// If Hansard or the Committees API cannot be reached the existing file is kept.
//
// Run it with: node fetch-entry-notes.js

import { readFileSync, writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { keyOf, bestEarlier, hansardUrl, askedIn, purposeOf, searchQueries } from "./entryNotes.js";

const CALENDAR = "frontend/src/data/parliamentCalendar.json";
const OUTPUT = "frontend/src/data/entryNotes.json";
const HANSARD = "https://hansard-api.parliament.uk";
const COMMITTEES = "https://committees-api.parliament.uk/api";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function earlierDebate(title, before) {
  let hit = null;
  for (const q of searchQueries(title)) {
    const { Results } = await getJson(`${HANSARD}/search/debates.json?queryParameters.searchTerm=${encodeURIComponent(q)}&queryParameters.take=15&queryParameters.orderBy=SittingDateDesc`);
    hit = bestEarlier(title, Results, before);
    if (hit) break;
  }
  if (!hit) return null;
  const note = { title: hit.Title, date: String(hit.SittingDate).slice(0, 10), house: hit.House, url: hansardUrl(hit) };
  try {
    const d = await getJson(`${HANSARD}/debates/debate/${hit.DebateSectionExtId}.json`);
    const asked = askedIn(d.Items);
    if (asked) note.asked = asked;
  } catch { /* the earlier debate is still worth showing without its question */ }
  return note;
}

async function committeePurpose(name) {
  const base = name.replace(/\s*\((Commons|Lords)\)\s*$/i, "").trim();
  const house = /\(Lords\)/i.test(name) ? "Lords" : /\(Commons\)/i.test(name) ? "Commons" : null;
  const list = await getJson(`${COMMITTEES}/Committees?SearchTerm=${encodeURIComponent(base)}&CommitteeStatus=Current&take=10`);
  const hit = (list.items ?? []).find((c) => keyOf(c.name) === keyOf(base) && (!house || (house === "Lords" ? c.isLords : c.isCommons)));
  if (!hit) return null;
  const c = await getJson(`${COMMITTEES}/Committees/${hit.id}`);
  const purpose = purposeOf(c.purpose);
  return purpose ? { purpose, url: `https://committees.parliament.uk/committee/${hit.id}/` } : null;
}

async function main() {
  const cal = JSON.parse(readFileSync(CALENDAR, "utf8"));
  const out = { generated: cal.generated, debates: {}, committees: {} };
  let tried = 0;
  let failed = 0;
  const seen = new Set();
  for (const e of cal.events) {
    const title = e.t;
    if (!title) continue;
    try {
      if (e.k === "hearing") {
        if (seen.has(`c|${title}`)) continue;
        seen.add(`c|${title}`);
        tried++;
        const n = await committeePurpose(title);
        if (n) out.committees[keyOf(title)] = n;
      } else if (["debate", "questions", "statement"].includes(e.k) && !/ Bill\b|Delegated Legislation Committee|Questions \(including|^Prime Minister|Business Questions/i.test(title)) {
        const k = keyOf(title);
        if (seen.has(`d|${k}`)) continue;
        seen.add(`d|${k}`);
        tried++;
        const n = await earlierDebate(title, e.d);
        if (n) out.debates[k] = n;
      }
    } catch (err) {
      failed++;
      console.error(`  ${title}: ${err.message}`);
    }
    await sleep(150);
  }
  if (tried && failed > tried / 2) {
    console.error(`${failed} of ${tried} lookups failed, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${Object.keys(out.debates).length} debate notes and ${Object.keys(out.committees).length} committee notes from ${tried} lookups (${failed} failed).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
