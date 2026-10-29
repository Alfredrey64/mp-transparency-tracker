import raw from "../data/energyData.json";
import { REGIONS } from "../data/regionMetrics";
import { LATER_BUDGETS, TARGETS } from "../data/energy";

// Working things out from the Net zero and energy bills page's data (energyData.json, built by scripts/build-energy-data.mjs), so the words and the
// charts cannot drift apart.

export const E = raw;
export const last = (a) => a[a.length - 1];
export const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const sum = (a) => a.reduce((x, y) => x + y, 0);

// ---- Emissions ----------------------------------------------------------------------------------------------------------------------------------------
export const EM = E.emissions;
export const FIRST_YEAR = EM.years[0];
export const LAST_YEAR = last(EM.years);
export const BASE = EM.total[0];
export const atYear = (values, year) => values[EM.years.indexOf(year)];
export const cutFrom1990 = (v) => round((1 - v / BASE) * 100, 1);
export const LATEST = { year: LAST_YEAR, total: last(EM.total), cut: cutFrom1990(last(EM.total)) };
// The provisional estimate for the year after the final data, when there is one.
export const PROVISIONAL = EM.provisional ? { ...EM.provisional, cut: cutFrom1990(EM.provisional.total) } : null;
export const NEWEST = PROVISIONAL ? { year: PROVISIONAL.year, total: PROVISIONAL.total, cut: PROVISIONAL.cut, provisional: true } : { ...LATEST, provisional: false };
export const peakYear = () => { let best = 0; EM.total.forEach((v, i) => { if (v > EM.total[best]) best = i; }); return { year: EM.years[best], value: EM.total[best] }; };

export const SECTOR_KEYS = Object.keys(EM.sectors);
export const sectorChange = (key) => {
  const s = EM.sectors[key];
  const first = s.values[0];
  const lastV = last(s.values);
  return { key, name: s.name, first, last: lastV, pct: first > 0 ? round(((lastV - first) / first) * 100, 0) : null, share: round((lastV / LATEST.total) * 100, 0) };
};
// Land use and forestry is a net figure that can be small or negative, so it is kept out of the sector shares.
export const emittingSectors = () => SECTOR_KEYS.filter((k) => k !== "land").map(sectorChange);

// The budgets as a list: the four with results, then the three still to come. Result is the UK Net Carbon Account the budget is measured against.
export const BUDGETS = [
  ...EM.budgets.map((b) => ({ id: b.id, from: b.years[0], to: b.years.at(-1), target: b.target, result: b.accountTotal, settled: b.settled })),
  ...LATER_BUDGETS.map((b) => ({ id: b.id, from: b.years[0], to: b.years[1], target: b.target, result: null, settled: false, note: b.note, source: b.source })),
];
// The fourth budget is still running. Emissions in the years of it so far, and what is left of the budget.
export const cb4 = () => {
  const b = EM.budgets.find((x) => x.id === "CB4");
  const years = [];
  const values = [];
  for (let y = b.years[0]; y <= b.years.at(-1); y += 1) {
    const v = y <= LAST_YEAR ? atYear(EM.total, y) : PROVISIONAL && y === PROVISIONAL.year ? PROVISIONAL.total : null;
    if (v !== null && v !== undefined) { years.push(y); values.push(v); }
  }
  const used = sum(values);
  const left = b.years.length - years.length;
  return { target: b.target, years, used: round(used, 0), left, perYear: left > 0 ? round((b.target - used) / left, 0) : null, startYear: b.years[0], endYear: b.years.at(-1), provisional: Boolean(PROVISIONAL && years.includes(PROVISIONAL.year)) };
};

// How fast emissions must fall to reach a target level, against how fast they have been falling. Levels are cuts from the 1990 base year.
export function pace(targetKey, recentYears = 10) {
  const t = TARGETS[targetKey];
  const target = round(BASE * (1 - t.cut / 100), 0);
  const fromYear = NEWEST.year;
  const yearsLeft = t.year - fromYear;
  const needed = yearsLeft > 0 ? round((NEWEST.total - target) / yearsLeft, 1) : 0;
  const startYear = LAST_YEAR - recentYears;
  const recent = round((atYear(EM.total, startYear) - LATEST.total) / recentYears, 1);
  return { year: t.year, cut: t.cut, target, fromYear, yearsLeft, needed, recent, recentYears, startYear, ratio: recent > 0 ? round(needed / recent, 1) : null };
}

// ---- Electricity ----------------------------------------------------------------------------------------------------------------------------------------
export const PW = E.power;
export const POWER_LAST = last(PW.years);
export const POWER_GROUPS = [
  { key: "gas", name: "Gas", colour: "#C0561F" },
  { key: "wind", name: "Wind", colour: "#0E7490" },
  { key: "nuclear", name: "Nuclear", colour: "#7A5AF0" },
  { key: "bioenergy", name: "Biomass and waste", colour: "#6F8F2B" },
  { key: "solar", name: "Solar", colour: "#C7871A" },
  { key: "coal", name: "Coal", colour: "#4B5563" },
  { key: "hydro", name: "Hydro", colour: "#1D4ED8" },
  { key: "oil", name: "Oil", colour: "#8B5E3C" },
  { key: "other", name: "Other", colour: "#9CA3AF" },
];
export const powerAt = (key, year) => PW.fuels[key][PW.years.indexOf(year)];
export const totalAt = (year) => PW.total[PW.years.indexOf(year)];
export const shareAt = (key, year) => round((powerAt(key, year) / totalAt(year)) * 100, 1);
// Three groups that add to the whole: fossil fuels, renewables (wind, solar, hydro, bioenergy), and nuclear. "Other" fuels are small and left with neither.
export const groupShare = (year) => {
  const i = PW.years.indexOf(year);
  const f = PW.fuels;
  const t = PW.total[i];
  const fossil = f.coal[i] + f.oil[i] + f.gas[i];
  const renewables = f.wind[i] + f.solar[i] + f.hydro[i] + f.bioenergy[i];
  return { fossil: round((fossil / t) * 100, 1), renewables: round((renewables / t) * 100, 1), nuclear: round((f.nuclear[i] / t) * 100, 1), other: round((f.other[i] / t) * 100, 1) };
};
export const lowCarbonShare = (year) => { const g = groupShare(year); return round(g.renewables + g.nuclear, 1); };
export const firstYearBelow = (key, limit) => PW.years.find((y) => powerAt(key, y) < limit);
export const mixYears = () => [PW.years[0], 2010, 2020, POWER_LAST].filter((y, i, a) => PW.years.includes(y) && a.indexOf(y) === i);

// ---- Bills ---------------------------------------------------------------------------------------------------------------------------------------------------
export const BL = E.bills;
export const BILL_YEARS = BL.years;
export const BILL_LAST = last(BILL_YEARS);
export const dual = BILL_YEARS.map((_, i) => BL.electricity[i] + BL.gas[i]);
export const cpiOf = (year) => E.cpi.annual[String(year)];
// A bill from `year` in the money of `inYear`, using the ONS consumer price index.
export const inTodaysMoney = (value, year, inYear = BILL_LAST) => Math.round((value * cpiOf(inYear)) / cpiOf(year));
export const billAt = (key, year) => (key === "dual" ? dual : BL[key])[BILL_YEARS.indexOf(year)];
export const realSeries = (values) => values.map((v, i) => inTodaysMoney(v, BILL_YEARS[i]));

export const CAP = E.cap.periods;
export const CAP_LAST = last(CAP);
export const capShare = (p, key) => round((p[key] / p.exVat) * 100, 0);
export const capByLabel = (t) => CAP.find((p) => p.time === t)?.label ?? String(t);
export const capAt = (label) => CAP.find((p) => p.label.startsWith(label));
export const capPeak = () => CAP.reduce((a, p) => (p.exVat > a.exVat ? p : a), CAP[0]);

// The consumption the DESNZ standard bills are worked out for, in kWh a year (tables 2.2.1 and 2.3.1).
export const STANDARD = { electricity: 3400, gas: 11200 };

// Regional bills: the pricing areas, with the bill and the unit cost for the latest year.
export const BILL_AREAS = Object.keys(BL.elecRegions).filter((k) => k !== "United Kingdom").sort();
export const areaBill = (fuel, area, year = BILL_LAST) => {
  const src = fuel === "gas" ? BL.gasRegions : BL.elecRegions;
  return src?.[area]?.[year] ?? null;
};
export const hasGas = (area) => Boolean(BL.gasRegions?.[area]);
export const UK_AREA = "United Kingdom";

// EU electricity prices (medium household, pence per kWh with all taxes). The UK is called "UK" in the table.
export const EU = E.eu;
export const EU_LAST = last(EU.years);
export const euLatest = () => Object.entries(EU.byCountry).map(([name, v]) => ({ name: name === "UK" ? "United Kingdom" : name, value: last(v), uk: name === "UK" })).filter((r) => r.value !== null).sort((a, b) => b.value - a.value);
export const euSeries = (name) => EU.byCountry[name];

// Fuel poverty, England.
export const FP = E.fuelPoverty;

// The ONS monthly rise in the price of electricity, gas and other fuels.
export const INF = E.inflation;
export const infPeak = () => { let best = 0; INF.rate.forEach((v, i) => { if (v > INF.rate[best]) best = i; }); return { rate: INF.rate[best], month: INF.months[best], time: INF.times[best] }; };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthText = (label) => { const m = /^(\d{4})-(\d{2})$/.exec(label); return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : label; };
export const monthLabelAt = (t) => { const i = INF.times.indexOf(t); return i < 0 ? String(t) : monthText(INF.months[i]); };

// Households' spending on energy (£ million, ONS via DESNZ).
export const SPEND = BL.spend;

// ---- Regions -------------------------------------------------------------------------------------------------------------------------------------------------
export const RG = E.regional;
const R_LAST = last(RG.years);
const R_FIRST = RG.years[0];
const region = (k) => RG.regions[k];
const perHead = (k, field, idx) => (region(k)[field][idx] / region(k).population[idx]);
const lastIdx = RG.years.length - 1;
const byRegion = (fn) => Object.fromEntries(REGIONS.map((r) => [r.key, round(fn(r.key), 2)]));
const ukPerHead = (field, idx = lastIdx) => sum(REGIONS.map((r) => region(r.key)[field][idx])) / sum(REGIONS.map((r) => region(r.key).population[idx]));
const change = (k) => ((perHead(k, "total", lastIdx) - perHead(k, "total", 0)) / perHead(k, "total", 0)) * 100;
const ukChange = () => ((ukPerHead("total") - ukPerHead("total", 0)) / ukPerHead("total", 0)) * 100;
export const MAP_METRICS = [
  { id: "total", group: "Emissions per person", label: "All sources", format: "tonnes", accent: "#0F766E", blurb: "Greenhouse gases released within each region and nation, in tonnes of carbon dioxide equivalent for every resident. It counts what is emitted there, including from farms, industry and roads, not what the people living there are responsible for through what they buy.", values: () => byRegion((k) => perHead(k, "total", lastIdx)), uk: () => round(ukPerHead("total"), 2) },
  { id: "domestic", group: "Emissions per person", label: "Homes", format: "tonnes", accent: "#C0561F", blurb: "Greenhouse gases from heating and powering homes, per resident. Colder places, older and larger homes and homes off the gas grid tend to emit more.", values: () => byRegion((k) => perHead(k, "domestic", lastIdx)), uk: () => round(ukPerHead("domestic"), 2) },
  { id: "transport", group: "Emissions per person", label: "Transport", format: "tonnes", accent: "#1D4ED8", blurb: "Greenhouse gases from road and rail transport within the region, per resident, including motorways and lorries passing through.", values: () => byRegion((k) => perHead(k, "transport", lastIdx)), uk: () => round(ukPerHead("transport"), 2) },
  { id: "industry", group: "Emissions per person", label: "Industry, shops and offices", format: "tonnes", accent: "#7A5AF0", blurb: "Greenhouse gases from factories, large industrial sites, shops, offices and public buildings, per resident. A few large sites can dominate a small region.", values: () => byRegion((k) => perHead(k, "industry", lastIdx)), uk: () => round(ukPerHead("industry"), 2) },
  { id: "change", group: "Change since 2005", label: "Fall in emissions per person", format: "pct", accent: "#0E7490", blurb: `How much emissions per resident have fallen between ${R_FIRST} and ${R_LAST}, as a share of the ${R_FIRST} level. A bigger number is a bigger fall.`, values: () => byRegion((k) => -change(k)), uk: () => round(-ukChange(), 2) },
].map((m) => ({ ...m, year: m.id === "change" ? `${R_FIRST} to ${R_LAST}` : String(R_LAST) }));
export const regionFacts = (k) => ({ total: round(perHead(k, "total", lastIdx), 1), totalThen: round(perHead(k, "total", 0), 1), change: round(change(k), 0), population: region(k).population[lastIdx], kt: region(k).total[lastIdx] });
export const ukRegional = () => ({ total: round(ukPerHead("total"), 1), totalThen: round(ukPerHead("total", 0), 1), change: round(ukChange(), 0) });
export const REGION_YEAR = R_LAST;
export const REGION_FIRST = R_FIRST;

// ---- How the UK compares (World Bank) ----------------------------------------------------------------------------------------------------
export const COMPARE_MEASURES = {
  ghgPerHead: { label: "Greenhouse gases per person", format: (v) => `${v.toFixed(1)} tonnes`, blurb: "Greenhouse gases released within each country, in tonnes of carbon dioxide equivalent for every resident, excluding land use. This is the World Bank's series, which differs a little from the UK government's own figures.", lowIsGood: true },
  fossilShare: { label: "Electricity from fossil fuels", format: (v) => `${v.toFixed(0)}%`, blurb: "The share of electricity made by burning coal, oil or gas. The rest comes from nuclear and renewables.", lowIsGood: true },
  energyPerHead: { label: "Energy used per person", format: (v) => `${Math.round(v).toLocaleString("en-GB")} kg`, blurb: "Energy used per person, in kilograms of oil equivalent, across homes, transport, industry and power." },
};
export function compareRanking(measure) {
  return Object.entries(E.compare).filter(([code, c]) => code !== "WLD" && c[measure]).map(([code, c]) => ({ code, name: c.name, value: c[measure].value, year: c[measure].year })).sort((a, b) => b.value - a.value);
}
