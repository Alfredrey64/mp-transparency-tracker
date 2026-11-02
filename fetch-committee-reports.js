// fetch-committee-reports.js
//
// What this does, in plain terms:
// 1. Lists every report select committees have published in the last 12 months from Parliament's Committees API, a page of 100 at a time.
// 2. Keeps the ones the government is expected to answer, with the date its answer was due and the replies published so far (see committeeReports.js).
// 3. Writes frontend/src/data/committeeReports.json for the Committee reports and replies page.
//
// If too few reports come back (an upstream outage) the existing file is left alone.
//
// Run it with: node fetch-committee-reports.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { summariseReports } from "./committeeReports.js";

const OUTPUT = "frontend/src/data/committeeReports.json";
const API = "https://committees-api.parliament.uk/api/Publications";
const MIN_REPORTS = 40;

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function main() {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);

  const items = [];
  for (let skip = 0; ; skip += 100) {
    const page = await getJson(`${API}?PublicationTypeIds=1&SortOrder=PublicationDateDescending&StartDate=${from}&EndDate=${to}&Skip=${skip}&Take=100`);
    items.push(...page.items);
    console.log(`  ${items.length} of ${page.totalResults} reports`);
    if (!page.items.length || items.length >= page.totalResults) break;
  }

  const out = summariseReports(items, { from, generated: to });
  if (out.reports.length < MIN_REPORTS) {
    console.error(`Only ${out.reports.length} reports came back, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.reports.length} reports with a reply due, ${out.reports.filter((r) => r.replies.length).length} answered.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
