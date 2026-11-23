// fetch-acts.js
//
// What this does, in plain terms:
// 1. Reads legislation.gov.uk's feed of Public General Acts for this year and last year (every page of each, twenty Acts at a time).
// 2. Checks each year is whole: numbered 1 to n with no gaps, dates in order, and the number of Acts matching the total the feed itself states.
// 3. Writes frontend/src/data/acts.json: this year's Acts in full, last year's by date, and how many Acts there were in every year since 1950.
//    If anything looks wrong the existing file is left as it is and the script fails, so a broken feed never replaces good data.
//
// Run it with: node fetch-acts.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { parseFeed, inOrder, looksComplete } from "./actsFeed.js";

const OUTPUT = "frontend/src/data/acts.json";
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };
const FEED = (year, page) => `https://www.legislation.gov.uk/ukpga/${year}/data.feed${page > 1 ? `?page=${page}` : ""}`;

async function year(y) {
  const all = []; let perYear = {};
  for (let page = 1; page <= 20; page += 1) {
    const res = await fetchRetry(FEED(y, page), { headers });
    if (!res.ok) throw new Error(`${FEED(y, page)} answered ${res.status}`);
    const parsed = parseFeed(await res.text());
    all.push(...parsed.entries);
    if (page === 1) perYear = parsed.perYear;
    if (!parsed.morePages) break;
  }
  const entries = inOrder(all).filter((e) => e.year === y);
  if (!looksComplete(entries, perYear[String(y)] ?? null)) throw new Error(`The ${y} list is not whole (${entries.length} Acts, the feed says ${perYear[String(y)] ?? "nothing"}), so ${OUTPUT} was left as it is.`);
  return { entries, perYear };
}

async function main() {
  const now = new Date();
  const y = now.getUTCFullYear();
  let thisYear = await year(y).catch(async (e) => { if (/answered 404/.test(e.message)) return { entries: [], perYear: {} }; throw e; });
  const last = await year(y - 1);
  // Early January: there may be no Act yet this year. Then the page shows last year as the latest.
  const perYear = Object.fromEntries(Object.entries({ ...last.perYear, ...thisYear.perYear }).filter(([k]) => Number(k) >= 1950).sort((a, b) => Number(a[0]) - Number(b[0])));
  if (Object.keys(perYear).length < 60) throw new Error("The feed's year totals are missing, so the file was left as it is.");
  const data = {
    fetchedAt: now.toISOString().slice(0, 10),
    source: "https://www.legislation.gov.uk/ukpga/data.feed",
    year: y,
    thisYear: thisYear.entries.map(({ number, title, date, summary }) => ({ number, title, date, summary })),
    lastYear: last.entries.map(({ number, date }) => ({ number, date })),
    perYear,
  };
  writeFileSync(OUTPUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${data.thisYear.length} Acts for ${y}, ${data.lastYear.length} for ${y - 1} and ${Object.keys(perYear).length} yearly totals to ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
