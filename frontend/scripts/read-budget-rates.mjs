// Reads the rates tables a Budget publishes and lists what changed, so the changes can be checked and added to the tax pages.
//
//   node scripts/read-budget-rates.mjs                      the newest Budget's rates annex
//   node scripts/read-budget-rates.mjs <overview-url>       a particular Budget, e.g. the OOTLAR page address on GOV.UK
//   node scripts/read-budget-rates.mjs --all                also list the rates that did not change
//
// Each Budget has an "Overview of tax legislation and rates" (OOTLAR) on GOV.UK. Its Annex A lists every rate and allowance for the current tax
// year and the next one. This script reads that annex, finds the rows where the two years differ and prints them, with the series on the page
// that probably holds each one. It only reads and prints. Nothing is changed: check each figure against the Budget, then add it with
// scripts/add-tax-change.mjs. The suggested series are guesses from the headings, so look before using them.

const API = "https://www.gov.uk/api";
const HEADERS = { "User-Agent": "simple-politics-tax-check" };

const SERIES_HINTS = [
  [/Income Tax rates$/, /^Basic rate/, "incomeTax.basic"],
  [/Income Tax rates$/, /^Additional rate/, "incomeTax.top"],
  [/^Personal Allowance$/, /^Personal Allowance/, "incomeTax.allowance"],
  [/^Dividend Allowance$/, /./, "dividends.allowance"],
  [/Employee.s \(primary\) Class 1 contribution rates/, /./, "ni.employee, ni.employeeAbove"],
  [/Employer.s \(secondary\) Class 1 contribution rates$/, /./, "ni.employer"],
  [/Self-employed Class 4/, /./, "ni.selfEmployed"],
  [/Capital Gains Tax/, /./, "cgt.basic, cgt.higher, cgt.property, cgt.badr, cgt.aea"],
  [/^Inheritance Tax/, /./, "iht.nrb, iht.rnrb, iht.top"],
  [/Stamp Duty Land Tax . residential property/, /./, "sdlt.threshold, sdlt.top, sdlt.extra"],
  [/first time-buyers/, /./, "sdlt.firstTime"],
  [/Corporation Tax rates/, /Main rate/, "corp.main"],
  [/Corporation Tax rates/, /Small profits/, "corp.small"],
  [/Bank Levy/, /./, "levies.bank"],
  [/Digital Services Tax/, /./, "levies.dst"],
  [/Apprenticeship Levy/i, /./, "levies.apprenticeship"],
  [/Value Added Tax|VAT/, /./, "vat.standard, vat.hospitality, vat.gas, vat.electricity"],
  [/Fuel Duty|Hydrocarbon/i, /./, "fuel.petrol, fuel.diesel"],
  [/Tobacco/i, /./, "tobacco.specific, tobacco.advalorem, tobacco.hrt, tobacco.met"],
  [/Alcohol|Beer|Wine|Spirits|Cider/i, /./, "alcohol.beer, alcohol.wine, alcohol.spirits, alcohol.cider"],
  [/Soft Drinks|Sugar/i, /./, "sugar.lower, sugar.higher"],
  [/Gambling|Betting|Gaming/i, /./, "gambling.rgd, gambling.remoteBetting, gambling.gbd"],
  [/Air Passenger Duty/i, /./, "apd.short_econ, apd.short_std, apd.long_econ, apd.long_std"],
  [/Insurance Premium Tax/i, /./, "ipt.standard, ipt.higher"],
  [/Landfill/i, /Standard/i, "landfill.standard"],
  [/Landfill/i, /Lower/i, "landfill.lower"],
  [/Climate Change Levy/i, /./, "ccl.electricity, ccl.gas"],
  [/Aggregates Levy/i, /./, "aggregates.standard"],
  [/Energy Profits Levy/i, /./, "epl.rate"],
  [/Vaping/i, /./, "vaping.duty"],
  [/business rates|multiplier/i, /./, "rates.standard, rates.small, rates.rhlSmall, rates.rhlStandard, rates.highValue"],
];

const clean = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;| /g, " ").replace(/&amp;/g, "&").replace(/&pound;/g, "£").replace(/&#39;|&rsquo;/g, "’").replace(/\s+/g, " ").trim();

async function json(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

// The newest Budget's overview page, found by searching GOV.UK.
async function newestOverview() {
  const found = await json(`${API}/search.json?q=${encodeURIComponent('"overview of tax legislation and rates"')}&count=40&fields=title&fields=link&fields=public_timestamp`);
  const hits = found.results.filter((r) => /overview of tax legislation and rates/i.test(r.title)).sort((a, b) => (a.public_timestamp < b.public_timestamp ? 1 : -1));
  if (!hits.length) throw new Error("Could not find an overview of tax legislation and rates on GOV.UK.");
  return hits[0].link;
}

// The tables under each heading in a page of HTML: [{ heading, head: [cells], rows: [[cells]] }].
export function readTables(html) {
  const out = [];
  let heading = "";
  for (const m of html.matchAll(/<h([2-4])[^>]*>([\s\S]*?)<\/h\1>|<table[\s\S]*?<\/table>/g)) {
    if (m[1]) { heading = clean(m[2]); continue; }
    const rows = [...m[0].matchAll(/<tr[\s\S]*?<\/tr>/g)].map((r) => [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => clean(c[1])));
    if (rows.length > 1) out.push({ heading, head: rows[0], rows: rows.slice(1) });
  }
  return out;
}

// Rows whose first and last year columns differ.
export function changedRows(tables) {
  const out = [];
  for (const t of tables) {
    if (t.head.length < 3 || !/\b20\d\d\b/.test(t.head[1]) || !/\b20\d\d\b/.test(t.head.at(-1))) continue;
    for (const r of t.rows) {
      if (r.length < 3) continue;
      const first = r[1];
      const last = r.at(-1);
      out.push({ heading: t.heading, row: r[0], from: first, to: last, fromYear: t.head[1], toYear: t.head.at(-1), changed: first !== last });
    }
  }
  return out;
}

export const hintFor = (heading, row) => SERIES_HINTS.find(([h, r]) => h.test(heading) && r.test(row))?.[2] ?? null;

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const given = args.find((a) => !a.startsWith("--"));
  const path = given ? new URL(given, "https://www.gov.uk").pathname : await newestOverview();
  const page = await json(`${API}/content${path}`);
  console.log(`${page.title}\n${"https://www.gov.uk" + path}\n`);
  const annex = (page.details?.attachments ?? []).find((a) => /annex a/i.test(a.title ?? ""));
  if (!annex) throw new Error("The page has no Annex A (rates and allowances) yet. On Budget day it can take a few hours to appear.");
  const body = (await json(`${API}/content${annex.url}`)).details.body;
  const rows = changedRows(readTables(body));
  const changed = rows.filter((r) => r.changed);
  console.log(`${rows.length} rates and allowances listed, ${changed.length} differ between ${rows[0]?.fromYear} and ${rows[0]?.toYear}.\n`);
  let last = "";
  for (const r of all ? rows : changed) {
    if (r.heading !== last) { console.log(`\n${r.heading}`); last = r.heading; }
    const hint = hintFor(r.heading, r.row);
    console.log(`  ${r.row}: ${r.changed ? `was ${r.from}, now ${r.to}` : `${r.from} (no change)`}${hint ? `   [series: ${hint}]` : ""}`);
  }
  console.log("\nCheck each figure against the Budget, then add it with: node scripts/add-tax-change.mjs <series> <date> <value> --ann <Budget date>");
}

import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error(e.message); process.exit(1); });
