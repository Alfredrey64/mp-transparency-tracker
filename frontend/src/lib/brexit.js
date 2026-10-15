import raw from "../data/brexitData.json";
import { VOTE_BY_REGION } from "../data/brexit";
import { REGIONS } from "../data/regionMetrics";

// Working things out from the Brexit page's data (brexitData.json, built by scripts/build-brexit-data.mjs), so the words and the charts cannot drift
// apart.

export const B = raw;
export const last = (a) => a[a.length - 1];
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

// The three dates the charts mark, as a year with a fraction: the referendum (23 June 2016), the UK leaving (31 January 2020) and the trade deal
// beginning (1 January 2021).
export const EVENTS = [
  { t: 2016.47, label: "The referendum, June 2016" },
  { t: 2020.08, label: "The UK leaves, January 2020" },
  { t: 2021, label: "The trade deal begins, January 2021" },
];
export const EVENT_LINES = EVENTS.map((e) => e.t);
export const EVENT_NOTE = "The faint lines mark the referendum (June 2016), the UK leaving (January 2020) and the trade deal beginning (January 2021).";

export const quarterLabel = (t) => `${Math.floor(t + 1e-6)} Q${Math.round((t - Math.floor(t + 1e-6)) * 4) + 1}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// The migration figures are for the 12 months ending in the month given.
export const monthLabel = (t) => { const y = Math.floor(t + 1e-6); return `12 months to ${MONTHS[Math.round((t - y) * 12)]} ${y}`; };
export const bn = (v) => `£${v.toFixed(1)}bn`;

// Goods exports and imports with the EU and the rest of the world, in £ billion each quarter.
export const tradeBn = () => ({ times: B.trade.times, euExports: B.trade.euExports.map((v) => round(v / 1000)), nonEuExports: B.trade.nonEuExports.map((v) => round(v / 1000)), euImports: B.trade.euImports.map((v) => round(v / 1000)), nonEuImports: B.trade.nonEuImports.map((v) => round(v / 1000)) });
// The EU's share of UK goods exports (and imports) each quarter, in percent.
export const euShare = (kind = "exports") => { const eu = kind === "exports" ? B.trade.euExports : B.trade.euImports; const non = kind === "exports" ? B.trade.nonEuExports : B.trade.nonEuImports; return eu.map((v, i) => round((v / (v + non[i])) * 100)); };
// The average of the four quarters of a year.
export const yearAverage = (times, values, year) => { const xs = values.filter((_, i) => Math.floor(times[i] + 1e-6) === year); return xs.reduce((a, b) => a + b, 0) / xs.length; };

// The four nations' goods trade: the latest four quarters (the year to the end of 2025), in £ billion.
export function nationYear(key) {
  const t = B.nationTrade.nations[key];
  const sum = (a) => round(a.slice(-4).reduce((x, y) => x + y, 0));
  const euE = sum(t.euExports);
  const nonE = sum(t.nonEuExports);
  const euI = sum(t.euImports);
  const nonI = sum(t.nonEuImports);
  return { euExports: euE, nonEuExports: nonE, euImports: euI, nonEuImports: nonI, euShareExports: round((euE / (euE + nonE)) * 100), euShareImports: round((euI / (euI + nonI)) * 100) };
}
export const NATIONS = [{ key: "england", name: "England" }, { key: "wales", name: "Wales" }, { key: "scotland", name: "Scotland" }, { key: "ni", name: "Northern Ireland" }];

// What the map can show.
const leavePct = (k) => round((VOTE_BY_REGION[k].leave / (VOTE_BY_REGION[k].leave + VOTE_BY_REGION[k].remain)) * 100, 1);
const per1000 = (k, field) => round((B.migrationByRegion.regions[k][field] / B.migrationByRegion.regions[k].population) * 1000, 1);
const byRegion = (fn) => Object.fromEntries(REGIONS.map((r) => [r.key, fn(r.key)]));
const ukLeave = round((Object.values(VOTE_BY_REGION).reduce((a, v) => a + v.leave, 0) / Object.values(VOTE_BY_REGION).reduce((a, v) => a + v.leave + v.remain, 0)) * 100, 1);
const ukPer1000 = (field) => round((B.migrationByRegion.uk[field] / B.migrationByRegion.uk.population) * 1000, 1);
export const MAP_METRICS = [
  { id: "leave", group: "The vote", label: "Voted Leave in 2016", format: "pct", accent: "#1D4ED8", blurb: "The share of people who voted Leave in the 2016 referendum in each region and nation. A region that voted Remain is below 50%.", values: () => byRegion(leavePct), uk: () => ukLeave, year: "23 June 2016" },
  { id: "net", group: "People", label: "Net migration", format: "per1000", accent: "#7A5AF0", blurb: "People who came to live in each place from abroad, less those who left for abroad, in the year to mid-2025, for every 1,000 residents.", values: () => byRegion((k) => per1000(k, "net")), uk: () => ukPer1000("net"), year: B.migrationByRegion.year },
  { id: "arrivals", group: "People", label: "Arrivals from abroad", format: "per1000", accent: "#0E9AA7", blurb: "People who came to live in each place from abroad in the year to mid-2025, for every 1,000 residents.", values: () => byRegion((k) => per1000(k, "arrivals")), uk: () => ukPer1000("arrivals"), year: B.migrationByRegion.year },
];

// The GDP-per-head lines available to compare.
export const GDP_PICKS = ["GBR", "G7", "EU", "EA", "USA", "FRA", "DEU", "ITA", "CAN", "JPN"];
export function gdpSummary(code) { const s = B.gdp.series[code]; return { name: B.gdp.names[code], value: last(s) }; }
