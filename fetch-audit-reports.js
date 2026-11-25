// fetch-audit-reports.js
//
// What this does, in plain terms:
// 1. Lists every report the National Audit Office has published in the last 12 months from its website's public API (www.nao.org.uk/wp-json), 100 at a time.
// 2. Reads the Office's own names for each department, topic and kind of report, so each report can be labelled in the Office's words.
// 3. Writes frontend/src/data/auditReports.json for the Spending watchdog page (see auditReports.js).
//
// If too few reports come back (an upstream outage) the existing file is left alone.
//
// Run it with: node fetch-audit-reports.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { plain, summariseNao } from "./auditReports.js";

const OUTPUT = "frontend/src/data/auditReports.json";
const API = "https://www.nao.org.uk/wp-json/wp/v2";
const MIN_REPORTS = 20;

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

const taxonomy = async (name) => new Map((await getJson(`${API}/${name}?per_page=100&_fields=id,name`)).map((t) => [t.id, plain(t.name)]));

async function main() {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  const from = start.toISOString().slice(0, 10);
  const generated = end.toISOString().slice(0, 10);

  const names = { department: await taxonomy("department"), topic: await taxonomy("topic"), type: await taxonomy("report_type") };
  const items = [];
  for (let page = 1; ; page += 1) {
    const rows = await getJson(`${API}/report?per_page=100&page=${page}&after=${from}T00:00:00&orderby=date&order=desc&_fields=id,date,link,title,excerpt,content,department,topic,report_type`);
    items.push(...rows);
    console.log(`  ${items.length} reports`);
    if (rows.length < 100) break;
  }

  const out = summariseNao(items, names, { from, generated });
  if (out.total < MIN_REPORTS) {
    console.error(`Only ${out.total} reports came back, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.total} reports, newest ${out.reports[0].date}.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
