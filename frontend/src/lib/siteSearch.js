// The pieces of the site-wide search that are not about MPs: statistics, councils and donors. Each works on a small list built once,
// so it can run on every keystroke.

import { normalizeDonorKey } from "./donorSectors";

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9£%& ]/g, " ").replace(/\s+/g, " ").trim();
const wordsOf = (q) => norm(q).split(" ").filter(Boolean);

// Every word typed must appear somewhere in the text, so "mortgage rate" finds "Two-year fixed mortgage rate".
function rank(query, items, textOf, limit) {
  const words = wordsOf(query);
  if (!words.length) return [];
  const phrase = words.join(" ");
  return items
    .map((item) => {
      const text = textOf(item);
      if (!words.every((w) => text.includes(w))) return null;
      const title = norm(item.label ?? item.name);
      const score = title.startsWith(phrase) ? 0 : title.includes(phrase) ? 1 : 2;
      return { item, score, len: title.length };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.len - b.len)
    .slice(0, limit)
    .map((r) => r.item);
}

// Statistics: one entry per measure. A measure that sits on two pages is listed once, and the regional breakdowns, which are
// labelled only with a place name, are left to the Regions page.
export function buildMeasureIndex(series, refOf) {
  const seen = new Set();
  const out = [];
  for (const s of series) {
    if (s.sector === "regions") continue;
    if (/^hpi-/.test(s.id) && s.id !== "hpi-uk" && s.id !== "hpi-change") continue;
    if (s.sector === "population" && s.id !== "uk" && s.id !== "uk-growth") continue;
    const key = s.cdid ? `${s.cdid}|${s.dataset}` : refOf(s);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ref: refOf(s), label: s.label, sectorLabel: s.sectorLabel, text: norm(`${s.label} ${s.sectorLabel}`) });
  }
  return out;
}

// Pages: every word typed must appear in the page's name, its one-line hint or its alternative names, so "waiting times nhs" finds the NHS page whatever the
// order. A word on the page's name ranks above one found only in the hint. `textsOf(page)` lists the strings to search (names in the language being read as well).
export function findPages(query, pages, textsOf, limit = 5) {
  const words = wordsOf(query);
  if (!words.length) return [];
  const phrase = words.join(" ");
  return pages
    .map((page) => {
      const [label, ...rest] = textsOf(page).map(norm);
      const all = [label, ...rest].join(" ");
      if (!words.every((w) => all.includes(w))) return null;
      const score = label.startsWith(phrase) ? 0 : label.includes(phrase) ? 1 : words.every((w) => label.includes(w)) ? 2 : rest.some((r) => r.includes(phrase)) ? 3 : 4;
      return { page, score, len: label.length };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.len - b.len)
    .slice(0, limit)
    .map((r) => r.page);
}

// Inside pages: the section headings every page shows (src/data/pageHeadings.json, made by scripts/build-heading-index.mjs). A heading is listed once, is
// left out when it only repeats the page's name or is a statistic the measure search already lists, and a bare place name is never worth a result.
const PLACES = new Set(["england", "wales", "scotland", "northern ireland", "london", "uk", "united kingdom", "great britain"]);
export function buildSectionIndex(headings, labelOf, skipLabels = new Set()) {
  const seen = new Set();
  const out = [];
  for (const [page, info] of Object.entries(headings)) {
    const pageLabel = labelOf(page);
    if (!pageLabel) continue;
    for (const heading of info.heads ?? []) {
      const key = norm(heading);
      if (key.length < 8 || PLACES.has(key) || key === norm(pageLabel) || skipLabels.has(key) || seen.has(`${page}|${key}`)) continue;
      seen.add(`${page}|${key}`);
      out.push({ page, pageLabel, label: heading, text: norm(`${heading} ${pageLabel}`) });
    }
  }
  return out;
}
export const findSections = (query, index, limit = 4) => rank(query, index, (h) => h.text, limit);

export const findMeasures = (query, index, limit = 4) => rank(query, index, (m) => m.text, limit);

export function buildCouncilIndex(councils) {
  return councils.map((c) => ({ id: c.id, name: c.name, control: c.control, text: norm(c.name) }));
}
export const findCouncils = (query, index, limit = 3) => rank(query, index, (c) => c.text, limit);

// Donor names the site already knows (tagged by industry, or described), merged by name so one donor is listed once.
export function buildDonorIndex(...nameLists) {
  const seen = new Map();
  for (const list of nameLists) {
    for (const name of list) {
      const key = normalizeDonorKey(name);
      if (!key || seen.has(key)) continue;
      seen.set(key, { name, text: norm(name) });
    }
  }
  return [...seen.values()];
}
export const findDonors = (query, index, limit = 3) => rank(query, index, (d) => d.text, limit);
