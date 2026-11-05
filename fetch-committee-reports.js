// fetch-committee-reports.js
//
// What this does, in plain terms:
// 1. Lists every report select committees have published in the last 12 months from Parliament's Committees API, a page of 100 at a time.
// 2. Keeps the ones the government is expected to answer, with the date its answer was due and the replies published so far (see committeeReports.js).
// 3. Reads the committee's own description of each inquiry (Committees API, CommitteeBusiness) and of each committee (its stated purpose), which the page tidies into a
//    plain-English account of what each report is about. Reports already in the file keep what was read for them, so only new reports are looked up.
// 4. Writes frontend/src/data/committeeReports.json for the Committee reports and replies page.
//
// If too few reports come back (an upstream outage) the existing file is left alone.
//
// Run it with: node fetch-committee-reports.js

import { existsSync, readFileSync, writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { summariseReports } from "./committeeReports.js";

const OUTPUT = "frontend/src/data/committeeReports.json";
const API = "https://committees-api.parliament.uk/api/Publications";
const MIN_REPORTS = 40;
// A report with no inquiry description yet is looked up again for its first 30 days, in case the committee adds one.
const recent = (today) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 30); return d.toISOString().slice(0, 10); };

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// Runs fn over the list a few at a time; a request that fails gives undefined, so one slow or missing record never stops the rest.
async function pool(list, fn, size = 8) {
  const out = new Map();
  const queue = [...list];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) {
      const id = queue.pop();
      out.set(id, await fn(id).catch(() => undefined));
    }
  }));
  return out;
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

  const previous = existsSync(OUTPUT) ? new Map(JSON.parse(readFileSync(OUTPUT, "utf8")).reports.map((r) => [r.id, r])) : new Map();
  const kept = summariseReports(items, { from, generated: to }).reports;
  const fresh = kept.filter((r) => previous.get(r.id)?.about === undefined || (!previous.get(r.id).about.length && r.date >= recent(to)));
  const byId = new Map(items.map((p) => [p.id, p]));
  const businessIds = [...new Set(fresh.map((r) => byId.get(r.id)?.businesses?.[0]?.id).filter(Boolean))];
  const committeeIds = [...new Set(kept.filter((r) => previous.get(r.id)?.role === undefined).map((r) => byId.get(r.id)?.committee?.id).filter(Boolean))];
  console.log(`  reading ${businessIds.length} inquiry descriptions and ${committeeIds.length} committee purposes`);
  const scopes = Object.fromEntries([...await pool(businessIds, async (id) => (await getJson(`https://committees-api.parliament.uk/api/CommitteeBusiness/${id}`)).scope)].filter(([, v]) => v));
  const roles = Object.fromEntries([...await pool(committeeIds, async (id) => (await getJson(`https://committees-api.parliament.uk/api/Committees/${id}`)).purpose)].filter(([, v]) => v));

  const out = summariseReports(items, { from, generated: to, scopes, roles });
  for (const r of out.reports) {
    const old = previous.get(r.id);
    if (!old) continue;
    if (!fresh.some((f) => f.id === r.id) && old.about) r.about = old.about;
    if (old.role && !r.role) r.role = old.role;
  }
  if (out.reports.length < MIN_REPORTS) {
    console.error(`Only ${out.reports.length} reports came back, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.reports.length} reports with a reply due, ${out.reports.filter((r) => r.replies.length).length} answered.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
