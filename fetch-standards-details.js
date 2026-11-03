// fetch-standards-details.js
//
// What this does, in plain terms:
// 1. Lists every Committee on Standards report that names one MP (the same list fetch-standards-reports.js keeps for the Standards & Sanctions page).
// 2. For each one that has no hand-written entry in frontend/src/data/standardsReportDetails.json, downloads the report's PDF from the Committees API and takes out two short boxes
//    for the page, "What happened" and "The outcome", in the report's own words (see standardsDetails.js for exactly how they are picked).
// 3. Writes them to frontend/src/data/standardsReportAuto.json. A hand-written entry always wins, so a case can be put right by hand without this script undoing it.
//
// A report whose layout does not fit gets no entry and the page links to the report instead. If the API cannot be reached the existing file is kept.
//
// Run it with: node fetch-standards-details.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { extractPersonName } from "./standardsReports.js";
import { reportLines } from "./standardsText.js";
import { standardsDetail } from "./standardsDetails.js";

const API = "https://committees-api.parliament.uk/api";
const STANDARDS_COMMITTEE_ID = 290;
const MANUAL = "frontend/src/data/standardsReportDetails.json";
const OUTPUT = "frontend/src/data/standardsReportAuto.json";

async function publications() {
  const all = [];
  for (let skip = 0; ; skip += 100) {
    const res = await fetchRetry(`${API}/Publications?CommitteeId=${STANDARDS_COMMITTEE_ID}&Take=100&Skip=${skip}&SortOrder=PublicationDateDescending`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${res.status} listing publications`);
    const data = await res.json();
    all.push(...(data.items ?? []));
    if ((data.items ?? []).length < 100 || all.length >= data.totalResults) return all;
  }
}

async function main() {
  const manual = JSON.parse(readFileSync(MANUAL, "utf8"));
  const before = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : {};
  const out = {};
  const reports = (await publications()).filter((p) => p.additionalContentUrl && extractPersonName(p.description ?? ""));
  let tried = 0;
  let added = 0;
  let failed = 0;
  for (const p of reports) {
    const id = String(p.id);
    if (manual[id]) continue;
    tried++;
    try {
      const lines = await reportLines(p.id);
      const detail = lines && standardsDetail(lines);
      if (detail) { if (JSON.stringify(before[id]) !== JSON.stringify(detail)) added++; out[id] = detail; }
      else console.log(`  ${p.description}: the report does not follow the usual layout, so it has no summary`);
    } catch (err) {
      failed++;
      if (before[id]) out[id] = before[id]; // a report that could not be fetched this time keeps what it had
      console.error(`  ${p.description}: ${err.message}`);
    }
  }
  if (tried && failed === tried) { console.error("No report could be read, so the existing file was kept."); process.exit(1); }
  const text = `${JSON.stringify(out, null, 2)}\n`;
  if (!existsSync(OUTPUT) || readFileSync(OUTPUT, "utf8") !== text) writeFileSync(OUTPUT, text);
  console.log(`Checked ${tried} reports without a hand-written entry: ${added} new or changed, ${Object.keys(out).length} kept in ${OUTPUT} (${failed} failed).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
