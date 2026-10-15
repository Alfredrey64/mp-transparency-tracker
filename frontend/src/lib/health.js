import raw from "../data/healthData.json";
import { REGIONS } from "../data/regionMetrics";

// Working things out from the Health and NHS page's data (healthData.json, built by scripts/build-health-data.mjs), so the words and the charts
// cannot drift apart.

export const H = raw;
export const last = (a) => a[a.length - 1];
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

export const NATIONAL = H.national;
export const latest = (key) => ({ value: last(NATIONAL[key].values), label: last(NATIONAL[key].labels), time: last(NATIONAL[key].times) });
export const peak = (key) => { const s = NATIONAL[key]; let best = 0; s.values.forEach((v, i) => { if (v > s.values[best]) best = i; }); return { value: s.values[best], label: s.labels[best], time: s.times[best] }; };
// The highest value from a year onwards, such as the peak since the pandemic.
export const peakSince = (key, year) => { const s = NATIONAL[key]; let best = -1; s.values.forEach((v, i) => { if (s.times[i] >= year && (best < 0 || v > s.values[best])) best = i; }); return { value: s.values[best], label: s.labels[best], time: s.times[best] }; };
export const low = (key) => { const s = NATIONAL[key]; let best = 0; s.values.forEach((v, i) => { if (v < s.values[best]) best = i; }); return { value: s.values[best], label: s.labels[best], time: s.times[best] }; };
export const at = (key, label) => { const s = NATIONAL[key]; const i = s.labels.indexOf(label); return i < 0 ? null : s.values[i]; };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// "2026-07" is July 2026; "2026-Q2" is April to June 2026.
export function periodText(label) {
  const m = /^(\d{4})-(\d{2})$/.exec(label);
  if (m) return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  const q = /^(\d{4})-Q([1-4])$/.exec(label);
  return q ? `${["January to March", "April to June", "July to September", "October to December"][Number(q[2]) - 1]} ${q[1]}` : label;
}
export const timeText = (series) => (t) => { const s = NATIONAL[series]; const i = s.times.indexOf(t); return i < 0 ? String(t) : periodText(s.labels[i]); };

// The waiting-time snapshots, oldest first, and the latest two.
export const SNAPSHOTS = H.waitingByRegion;
export const NOW = last(SNAPSHOTS);
export const YEAR_AGO = SNAPSHOTS.at(-2);
const pct = (r) => (r.within18 / r.pathways) * 100;
export const regionStats = (snap, key) => { const r = snap.regions[key]; return { ...r, pct18: round(pct(r), 1), per1000: round((r.pathways / H.population[key]) * 1000, 1), over52Per100k: Math.round((r.over52 / H.population[key]) * 1e5) }; };
export const nhsRegionName = (key) => H.nhsRegions.find((r) => r.key === key).name;
export const NHS_KEYS = H.nhsRegions.map((r) => r.key);
// The NHS region an ITL region (the map's places) belongs to, for England only.
export const nhsOf = (itl) => H.nhsRegions.find((r) => r.itl.includes(itl))?.key ?? null;
export const nationalNow = () => ({ ...NOW.national, pct18: round(pct(NOW.national), 1) });

// Map measures: a value for each of the map's twelve places (null outside England), and the England figure for comparison.
const perPlace = (fn) => Object.fromEntries(REGIONS.map((r) => { const k = nhsOf(r.key); return [r.key, k ? fn(k) : null]; }));
const englandPop = Object.values(H.population).reduce((a, b) => a + b, 0);
export const MAP_METRICS = [
  { id: "per1000", group: "How many are waiting", label: "Waiting list per 1,000 people", format: "index", accent: "#C0561F", blurb: "People waiting for hospital treatment for every 1,000 residents of the NHS region, counting the pathways open at the end of the month. One person can have more than one.", values: () => perPlace((k) => regionStats(NOW, k).per1000), uk: () => round((NOW.national.pathways / englandPop) * 1000, 1) },
  { id: "over52", group: "How many are waiting", label: "Waiting over a year, per 100,000", format: "count", accent: "#D6455D", blurb: "People who have waited more than 52 weeks, for every 100,000 residents.", values: () => perPlace((k) => regionStats(NOW, k).over52Per100k), uk: () => Math.round((NOW.national.over52 / englandPop) * 1e5) },
  { id: "within18", group: "How long they wait", label: "Seen within 18 weeks", format: "pct", accent: "#0F766E", blurb: "The share of people waiting who have waited no more than 18 weeks. The NHS standard is 92%. A higher figure is better.", values: () => perPlace((k) => regionStats(NOW, k).pct18), uk: () => nationalNow().pct18 },
  { id: "median", group: "How long they wait", label: "Typical wait", format: "weeks", accent: "#1D4ED8", blurb: "The median wait so far of people still waiting, in weeks. Half have waited less, and half longer.", values: () => perPlace((k) => regionStats(NOW, k).median), uk: () => NOW.national.median },
  { id: "change", group: "Change in a year", label: "Change in the share within 18 weeks", format: "index", accent: "#7A5AF0", blurb: "How many percentage points the share within 18 weeks changed between the same month a year earlier and now. A positive figure means it improved.", values: () => perPlace((k) => round(regionStats(NOW, k).pct18 - regionStats(YEAR_AGO, k).pct18, 1)), uk: () => round(nationalNow().pct18 - round(pct(YEAR_AGO.national), 1), 1) },
].map((m) => ({ ...m, year: NOW.label, ukLabel: "England" }));

// How the UK compares (World Bank): the countries with a figure, highest first, for one measure.
export const COMPARE_MEASURES = {
  spendGdp: { label: "Spending, share of GDP", format: (v) => `${v.toFixed(1)}%`, blurb: "All health spending, public and private, as a share of the economy." },
  spendPerHead: { label: "Spending per person", format: (v) => `$${Math.round(v).toLocaleString("en-GB")}`, blurb: "All health spending per person in international dollars, which adjusts for what money buys in each country." },
  doctors: { label: "Doctors per 1,000", format: (v) => v.toFixed(1), blurb: "Practising doctors for every 1,000 people." },
  nurses: { label: "Nurses and midwives per 1,000", format: (v) => v.toFixed(1), blurb: "Nurses and midwives for every 1,000 people." },
  beds: { label: "Hospital beds per 1,000", format: (v) => v.toFixed(1), blurb: "Hospital beds for every 1,000 people." },
};
export function compareRanking(measure) {
  return Object.entries(H.compare).filter(([, c]) => c[measure]).map(([code, c]) => ({ code, name: c.name, value: c[measure].value, year: c[measure].year })).sort((a, b) => b.value - a.value);
}
