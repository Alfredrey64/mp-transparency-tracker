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
