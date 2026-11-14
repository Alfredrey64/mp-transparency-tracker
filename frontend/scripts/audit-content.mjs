// A weekly check on whether what the site says is still sound. It looks for three things a person would otherwise have to notice by chance:
//   - pages of facts (components/explainers) whose figures were last checked against their sources more than 60 days ago,
//   - saved data (src/data) that has stopped being rebuilt,
//   - source links on those pages that have disappeared.
// It prints a report and exits with 1 if there is anything to look at. The weekly workflow (.github/workflows/content-check.yml) opens an issue from it.
//
//   node scripts/audit-content.mjs [--no-links]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLongDate, staleExplainers, staleData, staleCheckedConstants, dueDates, capBehind, brokenLinks, report } from "./audit-content-lib.mjs";
import { DUE } from "./content-ledger.mjs";

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

const { text, total } = report([
  ["Pages whose figures are due a re-check", staleExplainers(pages, now)],
  ["Saved data that has stopped refreshing", staleData(files, now)],
  ["Pages whose hand-written wording is due a re-check", staleCheckedConstants(checkedConstants, now)],
  ["Facts with a built-in end date", [...moving, ...dueDates(DUE, now)]],
  ["Source links that have gone", brokenLinks(links)],
]);
console.log(text);
process.exit(total ? 1 : 0);
