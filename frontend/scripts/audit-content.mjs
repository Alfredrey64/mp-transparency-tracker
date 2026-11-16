// A weekly check on whether what the site says is still sound. It looks for four things a person would otherwise have to notice by chance:
//   - pages of facts (components/explainers) whose figures were last checked against their sources more than 60 days ago,
//   - saved data (src/data) that has stopped being rebuilt,
//   - source links on those pages that have disappeared,
//   - newer editions of the few sources a build script reads from a fixed address (a script that names one year's file would otherwise report "no change" forever).
// It prints a report and exits with 1 if there is anything to look at. The weekly workflow (.github/workflows/content-check.yml) opens an issue from it.
//
//   node scripts/audit-content.mjs [--no-links]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLongDate, staleExplainers, staleData, staleCheckedConstants, handKeptDue, dueDates, capBehind, tradeHeadlineBehind, brokenLinks, report } from "./audit-content-lib.mjs";
import { DUE } from "./content-ledger.mjs";
import { HAND_KEPT } from "./hand-kept.mjs";
import { yearlyOnsEditions, pinnedOnsFiles, newestOnsEdition, hbaiEndYear, pinnedHbaiSlug, newestHbaiSlug, pinnedSipriYear, newestSipriYear, editionFinding } from "./source-editions-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const data = path.join(here, "../src/data");
const explainers = path.join(here, "../src/components/explainers");
const now = new Date();

// These are built from data the daily refresh rewrites (the committee reports, the statutory instruments, the calendar), not from hand-checked facts, so they have no "checked" date.
const FROM_DAILY_DATA = new Set(["committeeReports", "statutoryInstruments", "upcoming"]);
const pages = fs.readdirSync(explainers).filter((f) => f.endsWith(".jsx") && !f.includes(".test.") && !FROM_DAILY_DATA.has(f.replace(/\.jsx$/, ""))).map((f) => {
  const text = fs.readFileSync(path.join(explainers, f), "utf8");
  return { name: f.replace(/\.jsx$/, ""), checked: /checked: "([^"]+)"/.exec(text)?.[1], urls: [...text.matchAll(/url: "(https:\/\/[^"]+)"/g)].map((m) => m[1]) };
});

// The hand-checked date kept in each "Britain in numbers" data file (src/data/*.js: `export const CHECKED = "13 November 2026";`).
const checkedConstants = fs.readdirSync(data).filter((f) => f.endsWith(".js")).flatMap((f) => {
  const m = /export const CHECKED = "([^"]+)"/.exec(fs.readFileSync(path.join(data, f), "utf8"));
  return m ? [{ name: `src/data/${f}`, checked: m[1] }] : [];
});

// Dates that move on their own: a Budget still shown as "coming up" after the day, and the energy price cap running past its last day.
const read = (f) => fs.readFileSync(path.join(data, f), "utf8");
const moving = [];
const nextBudget = /NEXT_BUDGET = \{\s*date: "(\d{4}-\d{2}-\d{2})"/.exec(read("taxEvents.js"));
if (nextBudget && nextBudget[1] < now.toISOString().slice(0, 10)) moving.push({ name: "Tax rates page", problem: `still shows the Budget of ${nextBudget[1]} as coming up. Run the Budget day steps in the README and set NEXT_BUDGET in src/data/taxEvents.js` });
const capFrom = /CAP_NOW = \{ from: "([^"]+)"/.exec(read("energy.js"))?.[1];
try {
  const labels = JSON.parse(read("energyData.json")).cap.periods.map((p) => p.label);
  const newer = capBehind(labels, capFrom);
  if (newer) moving.push({ name: "Energy page", problem: `Ofgem's model now lists a cap period (${newer}) that starts after the one the page states. Update CAP_NOW in src/data/energy.js with the announced figure and the capNews source` });
} catch { /* the data file is checked elsewhere */ }
try {
  const period = /TRADE_LATEST = \{[^}]*period: "([^"]+)"/.exec(read("brexit.js"))?.[1];
  const behind = tradeHeadlineBehind(period, JSON.parse(read("brexitData.json")).trade.quarters.at(-1));
  if (behind > 0) moving.push({ name: "Brexit page", problem: `its headline goods trade (TRADE_LATEST in src/data/brexit.js) is for ${period}, ${behind} quarter${behind === 1 ? "" : "s"} behind the ONS series the site holds. Read the figures excluding precious metals from the latest ONS UK trade release, then update the constant and the tests in src/data/brexit.test.js` });
} catch { /* the data file is checked elsewhere */ }
const cap = /CAP_NOW = \{ from: "[^"]+", to: "(\d{1,2} [A-Za-z]+ \d{4})"/.exec(read("energy.js"));
if (cap) {
  const end = parseLongDate(cap[1]);
  if (end && end < now) moving.push({ name: "Energy page", problem: `shows a price cap that ended on ${cap[1]}. Update CAP_NOW in src/data/energy.js` });
}

const files = [];
(function walk(dir, rel = "") {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name), `${rel}${e.name}/`);
    else if (e.name.endsWith(".json")) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, e.name), "utf8"));
        const stamp = j && typeof j === "object" ? (j.fetchedAt ?? j.generatedAt ?? j.built ?? j.checked ?? null) : null;
        files.push({ name: `${rel}${e.name}`, stamp: typeof stamp === "string" ? (/^\d{4}-\d{2}-\d{2}$/.test(stamp) ? `${stamp}T12:00:00Z` : stamp) : null });
      } catch { /* not a data file this check understands */ }
    }
  }
})(data);

async function check(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 20000);
      const res = await fetch(url, { redirect: "follow", signal: c.signal, headers: { "User-Agent": "domesday-live-content-check/1.0 (+https://domesdaylive.co.uk)" } });
      clearTimeout(t);
      if (res.status === 429 && attempt === 0) { await new Promise((r) => setTimeout(r, 5000)); continue; }
      return { url, status: res.status };
    } catch (e) { if (attempt === 1) return { url, status: 0, error: e.cause?.code ?? e.name }; }
  }
  return { url, status: 0 };
}

let links = [];
if (!process.argv.includes("--no-links")) {
  const urls = [...new Set(pages.flatMap((p) => p.urls))];
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (i < urls.length) { const u = urls[i++]; links.push(await check(u)); } }));
}


// Sources a build script reads from one named file. The rest (GOV.UK releases, ONS time series, OECD, NHS England) are looked up afresh on every run, so a new release reaches the
// site by itself; these would not, so each is compared with what the publisher now offers. A publisher that cannot be reached is skipped here and the weekly refresh reports it.
const UA = { "User-Agent": "domesday-live-content-check/1.0 (+https://domesdaylive.co.uk)" };
// Asks politely: a pause before each request, and a longer wait and another try when the publisher says it is busy (ONS answers 429 to a quick run of requests).
// Returns { body } or { failed: "why" }, so a source that could not be asked shows up in the report instead of looking like "nothing newer".
async function ask(url, as = "json") {
  let why = "no answer";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 12000 * attempt));
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 25000);
      const res = await fetch(url, { headers: UA, signal: c.signal });
      clearTimeout(t);
      if (res.ok) return { body: await res[as === "json" ? "json" : "text"]() };
      if (as === "exists" && res.status === 404) return { body: null, missing: true };
      why = `answered ${res.status}`;
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) { why = `could not be reached (${e.cause?.code ?? e.name})`; }
  }
  return { failed: why };
}
async function newEditions() {
  const out = [];
  const script = (f) => fs.readFileSync(path.join(here, f), "utf8");
  const how = (f) => `Check the new tables still have the same layout, put the new address in scripts/${f}, rebuild it (node scripts/${f}), and read the page's wording against the new figures.`;
  const seen = new Set();
  for (const f of ["build-inequality-data.mjs", "build-place-data.mjs", "build-brexit-data.mjs"]) {
    for (const { dataset, edition } of pinnedOnsFiles(script(f))) {
      if (seen.has(`${dataset}/${edition}`)) continue;
      seen.add(`${dataset}/${edition}`);
      const got = await ask(`https://www.ons.gov.uk${dataset}/data`);
      if (got.failed) { out.push({ name: `ONS ${dataset.split("/").at(-1)}`, problem: `could not be asked whether there is a newer edition than ${edition} (${got.failed}), so it was not checked this week.` }); continue; }
      const newest = newestOnsEdition(got.body);
      if (!newest) out.push({ name: `ONS ${dataset.split("/").at(-1)}`, problem: `answered, but its page no longer lists editions in the form this check reads, so it was not checked this week.` });
      else if (newest !== edition) out.push(editionFinding({ source: `ONS ${dataset.split("/").at(-1)}`, script: f, pinned: edition, newest, how: how(f) }));
    }
  }
  const slug = pinnedHbaiSlug(script("build-inequality-data.mjs"));
  const hb = await ask("https://www.gov.uk/api/content/government/collections/households-below-average-income-hbai--2");
  const newestHbai = hb.failed ? null : newestHbaiSlug(hb.body);
  if (hb.failed || !newestHbai) out.push({ name: "DWP Households Below Average Income", problem: `could not be checked for a newer release (${hb.failed ?? "the collection page lists no release in the form this check reads"}).` });
  else if (slug && hbaiEndYear(newestHbai) > hbaiEndYear(slug)) out.push(editionFinding({ source: "DWP Households Below Average Income", script: "build-inequality-data.mjs and build-place-data.mjs", pinned: slug.replace(/.*ending-/, ""), newest: newestHbai.replace(/.*ending-/, ""), how: how("build-inequality-data.mjs") }));
  const sipri = pinnedSipriYear(script("build-defence-data.mjs"));
  const sp = await ask("https://www.sipri.org/databases/milex", "text");
  const sipriNewest = sp.failed ? null : newestSipriYear(sp.body);
  if (sp.failed || !sipriNewest) out.push({ name: "SIPRI military expenditure database", problem: `could not be checked for a newer file (${sp.failed ?? "its page lists no file in the form this check reads"}).` });
  else if (sipri && sipriNewest > sipri) out.push(editionFinding({ source: "SIPRI military expenditure database", script: "build-defence-data.mjs", pinned: String(sipri), newest: String(sipriNewest), how: how("build-defence-data.mjs") }));
  // Yearly ONS pages the site quotes (a salary, a pay gap, a wealth survey): is there already a page for the next year's edition?
  const sources = [];
  const walk = (dir) => { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, f.name); if (f.isDirectory()) walk(full); else if (/\.(jsx?|mjs)$/.test(f.name) && !/\.test\./.test(f.name)) sources.push(full); } };
  walk(path.join(here, "../src"));
  for (const e of yearlyOnsEditions(sources.map((f) => fs.readFileSync(f, "utf8")).join("\n"))) {
    const got = await ask(e.nextUrl, "exists");
    const name = `ONS ${e.url.split("/").at(-2)}`;
    if (got.failed) out.push({ name, problem: `could not be asked whether the ${e.next} edition is out (${got.failed}), so it was not checked this week.` });
    else if (!got.missing) out.push({ name, problem: `the site quotes the ${e.shown} edition (${e.url}) but the ${e.next} edition is out (${e.nextUrl}). Update the figures and wording that quote it, and the address.` });
  }
  return out;
}
const editions = process.argv.includes("--no-links") ? [] : await newEditions();

const { text, total } = report([
  ["Pages whose figures are due a re-check", staleExplainers(pages, now)],
  ["Saved data that has stopped refreshing", staleData(files, now)],
  ["Pages whose hand-written wording is due a re-check", staleCheckedConstants(checkedConstants, now)],
  ["Hand-typed data that is due another look", handKeptDue(HAND_KEPT, now, (r) => { try { return r.stamp ? JSON.parse(read(r.stamp.file))[r.stamp.key] : null; } catch { return null; } })],
  ["Facts with a built-in end date", [...moving, ...dueDates(DUE, now)]],
  ["Newer editions the site is not reading yet", editions],
  ["Source links that have gone", brokenLinks(links)],
]);
console.log(text);
process.exit(total ? 1 : 0);
