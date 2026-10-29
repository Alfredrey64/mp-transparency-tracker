import raw from "../data/transportData.json";
import { REGIONS } from "../data/regionMetrics";
import { E } from "./energy";

// Working things out from the Transport page's data (transportData.json, built by scripts/build-transport-data.mjs), so the words and the charts cannot drift
// apart.

export const D = raw;
export const last = (a) => a[a.length - 1];
export const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
export const at = (years, values, year) => values[years.indexOf(year)];
export const ordinalYear = (y) => `${y} to ${String(y + 1).slice(2)}`;
const sum = (a) => a.reduce((x, y) => x + y, 0);

// ---- Road traffic -------------------------------------------------------------------------------------------------------------------------------------------
export const TR = D.traffic;
export const TR_LAST = last(TR.years);
export const trafficPeak = () => { let b = 0; TR.total.forEach((v, i) => { if (v > TR.total[b]) b = i; }); return { year: TR.years[b], value: TR.total[b] }; };
export const trafficAt = (key, year) => at(TR.years, TR[key], year);
export const trafficPre = () => ({ year: 2019, value: trafficAt("total", 2019) });
export const carShare = () => round((last(TR.cars) / last(TR.total)) * 100, 0);
export const trafficSince = (year) => round(((last(TR.total) - trafficAt("total", year)) / trafficAt("total", year)) * 100, 0);

// ---- Vehicles ------------------------------------------------------------------------------------------------------------------------------------------------------
export const V = D.vehicles;
export const NC = V.newCars;
export const NC_LAST = last(NC.years);
export const share = (key, year = NC_LAST) => round((at(NC.years, NC[key], year) / at(NC.years, NC.total, year)) * 100, 1);
export const fuelShares = (year = NC_LAST) => ({ petrol: share("petrol", year), diesel: share("diesel", year), hybrid: share("hybrid", year), plugin: share("plugin", year), battery: share("battery", year), other: share("other", year) });
export const carsLicensed = () => ({ year: last(V.licensed.years), millions: round(last(V.licensed.thousands) / 1000, 1), first: round(V.licensed.thousands[0] / 1000, 1), firstYear: V.licensed.years[0] });
export const newCarSeries = (key) => NC[key].map((v, i) => round((v / NC.total[i]) * 100, 1));

// ---- Road deaths ------------------------------------------------------------------------------------------------------------------------------------------------
export const DE = D.deaths;
export const DE_LAST = last(DE.years);
export const deathsAt = (year) => at(DE.years, DE.all, year);
// The highest year since the war, since 1941 was the worst of all and the first years are not comparable with later ones.
export const deathsPeakSince = (from = 1949) => { let b = -1; DE.all.forEach((v, i) => { if (DE.years[i] >= from && (b < 0 || v > DE.all[b])) b = i; }); return { year: DE.years[b], value: DE.all[b] }; };
// Deaths for every billion vehicle miles driven in Great Britain, from 1949 when the traffic series starts.
export const deathRate = () => { const years = TR.years.filter((y) => DE.years.includes(y)); return { years, values: years.map((y) => round(deathsAt(y) / trafficAt("total", y), 1)) }; };

// ---- Road condition -------------------------------------------------------------------------------------------------------------------------------------------
export const RC = D.roadConditions;
export const RC_LAST = last(RC.a.years);

// ---- Buses ---------------------------------------------------------------------------------------------------------------------------------------------------------------
export const B = D.buses;
export const B_LAST = last(B.journeys.years);
export const busAt = (key, year) => at(B.journeys.years, B.journeys[key], year);
export const busChange = (key, from, to = B_LAST) => round(((busAt(key, to) - busAt(key, from)) / busAt(key, from)) * 100, 0);
export const busPeak = (key) => { let b = 0; B.journeys[key].forEach((v, i) => { if (v !== null && v > B.journeys[key][b]) b = i; }); return { year: B.journeys.years[b], value: B.journeys[key][b] }; };

// ---- Rail ------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const R = D.rail;
export const RJ_LAST = last(R.journeys.years);
export const railPeakBefore = () => { const i = R.journeys.years.indexOf(2019); return { year: 2019, value: R.journeys.millions[i] }; };
export const supportAt = (year) => at(R.support.years, R.support.total, year);
export const SUP_LAST = last(R.support.years);
// Fares against the Retail Prices Index, both 1995 = 100, so the ratio shows how much faster or slower fares rose.
export const faresVsRpi = () => R.fares.years.map((y, i) => round((R.fares.allTickets[i] / R.fares.rpi[i]) * 100, 1));
export const PERF = R.performance;
export const perfAt = (year) => ({ timeTo3: at(PERF.years, PERF.timeTo3, year), onTime: at(PERF.years, PERF.onTime, year), periods: at(PERF.years, PERF.periods, year) });
export const lastFullYear = () => { const i = PERF.periods.lastIndexOf(13); return PERF.years[i]; };

// ---- Places -----------------------------------------------------------------------------------------------------------------------------------------------------------------
const val = (fn) => Object.fromEntries(REGIONS.map((r) => { const v = fn(r.key); return [r.key, typeof v === "number" && Number.isFinite(v) ? round(v, 2) : null]; }));
const pop = D.population;
const ukPop = sum(Object.values(pop));
const P = V.byPlace;
export const MAP_METRICS = [
  { id: "cars", group: "Cars", label: "Cars per 1,000 people", format: "count", accent: "#1D4ED8", blurb: "Cars licensed to keepers in each place at the end of the year, for every 1,000 residents. It counts cars owned by companies as well as people, and cars kept in a place with a larger fleet or leasing company can raise a figure.", values: () => val((k) => (P.licensedThousands[k] * 1e6) / pop[k]), uk: () => round(sum(Object.values(P.licensedThousands)) * 1e6 / ukPop, 0), year: `31 December ${P.licensedYear}`, ukLabel: "the UK" },
  { id: "plug", group: "Cars", label: "Plug-in cars among new cars", format: "pct", accent: "#0F766E", blurb: "The share of cars registered for the first time in the year that were plug-in: fully electric or plug-in hybrid. Company cars are registered where the company is, so some places are higher.", values: () => val((k) => (P.plugin[k] / (P.newThousands[k] * 1000)) * 100), uk: () => round((sum(Object.values(P.plugin)) / (sum(Object.values(P.newThousands)) * 1000)) * 100, 1), year: String(P.year), ukLabel: "the UK" },
  { id: "plugChange", group: "Cars", label: "Rise in the plug-in share in a year", format: "index", accent: "#7A5AF0", blurb: "How many percentage points the plug-in share of new cars rose between the year before and the latest year.", values: () => val((k) => (P.plugin[k] / (P.newThousands[k] * 1000)) * 100 - (P.pluginBefore[k] / (P.newThousandsBefore[k] * 1000)) * 100), uk: () => round((sum(Object.values(P.plugin)) / (sum(Object.values(P.newThousands)) * 1000)) * 100 - (sum(Object.values(P.pluginBefore)) / (sum(Object.values(P.newThousandsBefore)) * 1000)) * 100, 1), year: `${P.year - 1} to ${P.year}`, ukLabel: "the UK" },
  { id: "roadA", group: "Local roads", label: "A roads needing maintenance", format: "pct", accent: "#C0561F", blurb: "The share of the length of local A roads (and motorways) where maintenance should have been considered, in the year to March. A lower figure is better. England only.", values: () => val((k) => last(RC.a[k] ?? [null])), uk: () => last(RC.a.england), year: `year to March ${RC_LAST}`, ukLabel: "England" },
  { id: "roadBC", group: "Local roads", label: "B and C roads needing maintenance", format: "pct", accent: "#9D174D", blurb: "The share of the length of B and C roads where maintenance should have been considered, in the year to March. A lower figure is better. England only.", values: () => val((k) => last(RC.bc[k] ?? [null])), uk: () => last(RC.bc.england), year: `year to March ${RC_LAST}`, ukLabel: "England" },
  { id: "bus", group: "Buses", label: "Bus journeys per person", format: "index", accent: "#C7871A", blurb: "Local bus journeys a year for each resident, in the year to March. London is far above everywhere else. Northern Ireland is not in these figures.", values: () => val((k) => last(B.perHead[k] ?? [null])), uk: () => last(B.perHead.gb), year: `year to March ${B_LAST}`, ukLabel: "Great Britain" },
  { id: "busChange", group: "Buses", label: "Change in bus journeys since before the pandemic", format: "pct", accent: "#0E7490", blurb: "How much the number of bus journeys in the latest year differs from the year to March 2020, which was before the pandemic. A negative figure means fewer journeys.", values: () => val((k) => (B.journeys[k] ? ((busAt(k, B_LAST) - busAt(k, 2020)) / busAt(k, 2020)) * 100 : null)), uk: () => round(((busAt("gb", B_LAST) - busAt("gb", 2020)) / busAt("gb", 2020)) * 100, 1), year: `year to March ${B_LAST} against ${ordinalYear(2019)}`, ukLabel: "Great Britain" },
];

// ---- Emissions (from the Net zero and energy bills page's data) -----------------------------------------------------------------------------
export const TRANSPORT_EMISSIONS = () => {
  const s = E.emissions.sectors.transport.values;
  const years = E.emissions.years;
  return { year: last(years), value: last(s), first: s[0], pct: round(((last(s) - s[0]) / s[0]) * 100, 0), share: round((last(s) / last(E.emissions.total)) * 100, 0), years, values: s };
};
