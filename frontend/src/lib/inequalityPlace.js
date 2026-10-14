import raw from "../data/inequalityPlace.json";
import { REGIONS } from "../data/regionMetrics";

// Working things out from the Place tab's data (inequalityPlace.json, built by scripts/build-place-data.mjs), so the words, the maps and the charts
// cannot drift apart.

export const P = raw;
export const last = (a) => a[a.length - 1];
export const lastNonNull = (a) => { for (let i = a.length - 1; i >= 0; i -= 1) if (a[i] !== null && a[i] !== undefined) return a[i]; return null; };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

export const regionName = (key) => REGIONS.find((r) => r.key === key)?.name ?? key;
export const incomeBy = Object.fromEntries(P.income.regions.map((r) => [r.key, r]));
export const wealthBy = { ...Object.fromEntries(P.wealth.regions.map((r) => [r.key, r])) };

// "2022/23 to 2024/25": the three-year average that starts with the first year given.
export const periodText = (from) => `${from}/${String(from + 1).slice(2)} to ${from + 2}/${String(from + 3).slice(2)}`;
export const latestPeriod = periodText(last(P.periods).from);

const latestOf = (series) => (series ? lastNonNull(series) : null);
const byRegion = (fn) => Object.fromEntries(REGIONS.map((r) => [r.key, fn(r.key)]));

// What the map can show. Each has a way of reading the figure for every region and for the UK, and a colour.
export const MAP_METRICS = [
  {
    id: "income", group: "Income", label: "Income per head", format: "gbp", accent: "#0E7490",
    blurb: "What each person's household has to spend or save in a year after tax, National Insurance and benefits, counting wages, pensions, benefits and income from savings and property.",
    values: () => byRegion((k) => incomeBy[k].perHead), uk: () => P.income.uk.perHead, year: String(P.income.year), source: "gdhi",
  },
  {
    id: "primary", group: "Income", label: "Before tax and benefits", format: "gbp", accent: "#7A5AF0",
    blurb: "What each person's household earns from work, savings and property in a year before tax, National Insurance and benefits. The ONS calls it the balance of primary incomes.",
    values: () => byRegion((k) => incomeBy[k].primary), uk: () => P.income.uk.primary, year: String(P.income.year), source: "gdhi",
  },
  {
    id: "median", group: "Income", label: "Typical household, a week", format: "gbp", accent: "#1D4ED8",
    blurb: "The middle household's income each week after housing costs, adjusted for the size of the household, as a three-year average. Half of people live in households with more, half with less.",
    values: () => byRegion((k) => latestOf(P.median.ahc[k])), uk: () => latestOf(P.median.ahc.uk), year: latestPeriod, source: "hbai",
  },
  {
    id: "poverty", group: "Poverty", label: "People in poverty", format: "pct", accent: "#D6455D",
    blurb: "The share of people in households with income below 60% of the UK's typical income, after housing costs, as a three-year average.",
    values: () => byRegion((k) => latestOf(P.poverty.all.ahc[k])), uk: () => latestOf(P.poverty.all.ahc.uk), year: latestPeriod, source: "hbai",
  },
  {
    id: "children", group: "Poverty", label: "Children in poverty", format: "pct", accent: "#C0561F",
    blurb: "The share of children in households below 60% of typical income after housing costs, as a three-year average.",
    values: () => byRegion((k) => latestOf(P.poverty.children.ahc[k])), uk: () => latestOf(P.poverty.children.ahc.uk), year: latestPeriod, source: "hbai",
  },
  {
    id: "workingAge", group: "Poverty", label: "Working-age adults in poverty", format: "pct", accent: "#0F766E",
    blurb: "The share of adults of working age in households below 60% of typical income after housing costs, as a three-year average.",
    values: () => byRegion((k) => latestOf(P.poverty.workingAge.ahc[k])), uk: () => latestOf(P.poverty.workingAge.ahc.uk), year: latestPeriod, source: "hbai",
  },
  {
    id: "pensioners", group: "Poverty", label: "Pensioners in poverty", format: "pct", accent: "#C7871A",
    blurb: "The share of pensioners in households below 60% of typical income after housing costs, as a three-year average.",
    values: () => byRegion((k) => latestOf(P.poverty.pensioners.ahc[k])), uk: () => latestOf(P.poverty.pensioners.ahc.uk), year: latestPeriod, source: "hbai",
  },
  {
    id: "wealth", group: "Wealth", label: "Typical wealth", format: "gbp", accent: "#9D174D",
    blurb: "The wealth of the middle household in each place, counting property, savings, pensions and belongings after debts. Great Britain only, so Northern Ireland is blank.",
    values: () => byRegion((k) => wealthBy[k]?.median ?? null), uk: () => P.wealth.gb.median, year: P.wealth.period, source: "wealth",
  },
];
export const metricById = (id) => MAP_METRICS.find((m) => m.id === id) ?? MAP_METRICS[0];

// Where each region stands on a measure, 1 for the highest, among the regions with a figure.
export function rankOf(values, key) {
  const ordered = Object.entries(values).filter(([, v]) => v !== null && v !== undefined).sort((a, b) => b[1] - a[1]);
  const i = ordered.findIndex(([k]) => k === key);
  return i < 0 ? null : { rank: i + 1, of: ordered.length };
}

// The highest and lowest local areas (ITL3) in a region, and the region's own figure.
export function regionSpan(key) {
  const areas = P.income.local.filter((a) => a.region === key).sort((a, b) => a.value - b.value);
  return { low: areas[0], high: areas.at(-1), count: areas.length, mid: incomeBy[key].perHead };
}

// Local areas ranked, optionally in one region.
export const localAreas = (key) => P.income.local.filter((a) => !key || a.region === key).sort((a, b) => b.value - a.value);

// How far apart the 25th and 75th percentile households are, as a multiple, and the median.
export const wealthSpread = (key) => { const w = wealthBy[key]; return { ratio: w.p75 / w.p25, ...w }; };

export const pct = (v, d = 0) => `${round(v, d)}%`;
export const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
