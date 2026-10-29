import raw from "../data/careData.json";
import { REGIONS } from "../data/regionMetrics";

// Working things out from the Social care and childcare page's data (careData.json, built by scripts/build-care-data.mjs), so the words and the charts
// cannot drift apart.

export const C = raw;
export const last = (a) => a[a.length - 1];
export const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
export const bn = (thousands) => round(thousands / 1e6, 1);
export const bnText = (thousands) => `£${bn(thousands).toFixed(1)}bn`;
export const pct = (a, b) => round((a / b) * 100, 0);

// ---- Spending ----------------------------------------------------------------------------------------------------------------------------------------------------
export const F = C.finance;
export const LAST_YEAR = last(F.gross.years);
export const yearText = (y) => `${y} to ${String(y + 1).slice(2)}`;
export const grossBn = F.gross.cash.map(bn);
export const grossRealBn = F.gross.real.map(bn);
export const netBn = F.net.cash.map(bn);
export const netRealBn = F.net.real.map(bn);
export const change = (series, from) => { const i = F.gross.years.indexOf(from); return round(((last(series) - series[i]) / series[i]) * 100, 0); };
export const realChangeSince = (year) => round(((last(F.gross.real) - F.gross.real[F.gross.years.indexOf(year)]) / F.gross.real[F.gross.years.indexOf(year)]) * 100, 0);
export const netRealChangeSince = (year) => round(((last(F.net.real) - F.net.real[F.net.years.indexOf(year)]) / F.net.real[F.net.years.indexOf(year)]) * 100, 0);
export const realChangeYear = () => round(((last(F.gross.real) - F.gross.real.at(-2)) / F.gross.real.at(-2)) * 100, 1);
export const shares = () => {
  const f = F.flows;
  return { clients: round((f.clients / F.gross.cash.at(-1)) * 100, 0), long: round((F.careType.long / F.careType.total) * 100, 0), short: round((F.careType.short / F.careType.total) * 100, 0), other: round((F.careType.other / F.careType.total) * 100, 0) };
};
export const perAdult = () => F.regions.england.perAdult;
// ---- People ------------------------------------------------------------------------------------------------------------------------------------------------------
export const A = C.activity.regions.england;
export const requestsTotal = () => A.requests1864 + A.requests65;
export const cl = C.carers;
export const carerYears = cl.years;
// ---- Workforce ----------------------------------------------------------------------------------------------------------------------------------------
export const W = C.workforce;
export const WYEAR = last(W.vacancy.all.years);
export const peakAt = (s) => { let b = 0; s.values.forEach((v, i) => { if (v > s.values[b]) b = i; }); return { year: s.years[b], value: s.values[b] }; };
export const over65Rise = () => round(((last(W.over65.values) - W.over65.values[0]) / W.over65.values[0]) * 100, 0);
export const premium = () => { const i = W.pay.years.length - 1; return { pence: Math.round((W.pay.independentCare[i] - W.pay.minimum[i]) * 100), pct: round(((W.pay.independentCare[i] - W.pay.minimum[i]) / W.pay.minimum[i]) * 100, 1) }; };

// ---- Childcare ---------------------------------------------------------------------------------------------------------------------------------------------
export const K = C.childcare;
export const KYEAR = K.year;
export const kAt = (series, year) => series[K.years.indexOf(year)];
export const kLast = (series) => last(series);

// ---- Regions -----------------------------------------------------------------------------------------------------------------------------------------------------
const fin = (k) => F.regions[k];
const act = (k) => C.activity.regions[k];
// A value for each of the map's twelve places; only England's nine regions have one.
const val = (fn) => Object.fromEntries(REGIONS.map((r) => { const v = fn(r.key); return [r.key, v === undefined || Number.isNaN(v) ? null : v]; }));
const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
export { gbp };
export const MAP_METRICS = [
  { id: "perAdult", group: "Council spending", label: "Spending per adult", format: "gbp", accent: "#7A5AF0", blurb: "What councils spent in the year on adult social care for each adult living in the area, before people's own contributions. Councils with more older people, or with higher costs, spend more.", values: () => val((k) => fin(k)?.perAdult ?? null), uk: () => fin("england").perAdult, year: yearText(LAST_YEAR) },
  { id: "growth", group: "Council spending", label: "Rise in spending per adult in a year", format: "pct", accent: "#0F766E", blurb: "How much spending per adult rose over the year, in cash terms, as a share of the year before.", values: () => val((k) => (fin(k) ? round(((fin(k).perAdult - fin(k).perAdultBefore) / fin(k).perAdultBefore) * 100, 1) : null)), uk: () => round(((fin("england").perAdult - fin("england").perAdultBefore) / fin("england").perAdultBefore) * 100, 1), year: `${yearText(LAST_YEAR - 1)} to ${yearText(LAST_YEAR)}` },
  { id: "old", group: "People helped", label: "People aged 65 and over receiving long-term support", format: "count", accent: "#C0561F", blurb: "How many people aged 65 and over received long-term support from their council at some point in the year, for every 100,000 people of that age in the area.", values: () => val((k) => act(k)?.clientsPer100k65 ?? null), uk: () => act("england").clientsPer100k65, year: yearText(LAST_YEAR) },
  { id: "young", group: "People helped", label: "Adults aged 18 to 64 receiving long-term support", format: "count", accent: "#1D4ED8", blurb: "How many adults aged 18 to 64 received long-term support from their council in the year, for every 100,000 people of that age in the area. It is mostly for people with learning or physical disabilities and mental health needs.", values: () => val((k) => act(k)?.clientsPer100k1864 ?? null), uk: () => act("england").clientsPer100k1864, year: yearText(LAST_YEAR) },
  { id: "requests", group: "People helped", label: "Requests for support, 65 and over", format: "count", accent: "#9D174D", blurb: "New requests for support from people aged 65 and over, for every 100,000 people of that age. A request is a first contact with the council about care; it does not always lead to support.", values: () => val((k) => act(k)?.requestsPer100k65 ?? null), uk: () => act("england").requestsPer100k65, year: yearText(LAST_YEAR) },
  { id: "nursing", group: "What care costs", label: "A week in a nursing home", format: "gbp", accent: "#C7871A", blurb: "The average weekly cost to the council of a place in a nursing home for a person it supports, in the area.", values: () => val((k) => F.unitCosts[k]?.nursing ?? null), uk: () => F.unitCosts.england.nursing, year: yearText(LAST_YEAR) },
  { id: "home", group: "What care costs", label: "An hour of home care", format: "gbp2", accent: "#0E7490", blurb: "The average hourly rate councils pay outside providers for care at home, in the area.", values: () => val((k) => F.unitCosts[k]?.homeExternal ?? null), uk: () => F.unitCosts.england.homeExternal, year: yearText(LAST_YEAR) },
].map((m) => ({ ...m, ukLabel: "England" }));
export const CHILD_MAP_METRICS = [
  { id: "universal", group: "Funded hours", label: "Children aged 3 and 4 taking the universal hours", format: "pct", accent: "#7A5AF0", blurb: "The share of 3 and 4 year olds taking up their 15 free hours a week, in January. London is lowest.", values: () => val((k) => K.regional.universal[k] ?? null), uk: () => last(K.universal.takeUp), year: `January ${KYEAR}` },
  { id: "twos", group: "Funded hours", label: "Two year olds taking the hours for families on low incomes", format: "pct", accent: "#0F766E", blurb: "The share of eligible two year olds, from families on low incomes or receiving certain benefits, taking up their free hours, in January.", values: () => val((k) => K.regional.twoYearOlds[k] ?? null), uk: () => last(K.twoYearOlds.takeUp), year: `January ${KYEAR}` },
  { id: "twosChange", group: "Funded hours", label: "Change in take-up for two year olds in a year", format: "index", accent: "#C0561F", blurb: "How many percentage points take-up among eligible two year olds changed between January a year earlier and now. A positive figure is a rise.", values: () => val((k) => (K.regional.twoYearOlds[k] !== undefined ? round(K.regional.twoYearOlds[k] - K.regional.twoYearOldsBefore[k], 1) : null)), uk: () => round(last(K.twoYearOlds.takeUp) - K.twoYearOlds.takeUp.at(-2), 1), year: `January ${KYEAR - 1} to January ${KYEAR}` },
].map((m) => ({ ...m, ukLabel: "England" }));
