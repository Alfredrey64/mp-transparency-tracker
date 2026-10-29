import raw from "../data/devolutionData.json";
import { REGIONS } from "../data/regionMetrics";

// Working things out from the Devolution and the union page's data (devolutionData.json, built by scripts/build-devolution-data.mjs), so the words and the
// charts cannot drift apart.

export const D = raw;
export const last = (a) => a[a.length - 1];
export const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
export const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
export const yearText = (y) => `${y} to ${String(y + 1).slice(2)}`;

export const NAMES = { uk: "the UK", england: "England", scotland: "Scotland", wales: "Wales", ni: "Northern Ireland", ne: "North East", nw: "North West", yh: "Yorkshire and the Humber", em: "East Midlands", wm: "West Midlands", east: "East of England", london: "London", se: "South East", sw: "South West" };
// ---- Spending ----------------------------------------------------------------------------------------------------------------------------------------------
export const S = D.spending;
export const S_LAST = last(S.years);
export const perHead = (k, i = S.years.length - 1) => S.perHead[k][i];
export const indexOf = (k, i = S.years.length - 1) => S.index[k][i];
export const realChange = (k) => round(((last(S.real[k]) - S.real[k][0]) / S.real[k][0]) * 100, 0);
export const ranked = (series) => Object.entries(series).filter(([k]) => k !== "uk" && k !== "england").map(([k, v]) => ({ k, v: last(v) })).sort((a, b) => b.v - a.v);
export const FUNCTIONS = Object.keys(S.functions);
export const functionName = (f) => f.replace(/^\d+\.\s*/, "");
// What each place spends per head on a function against England, in the latest year.
export const functionRows = (place) => FUNCTIONS.map((f) => ({ name: functionName(f), place: S.functions[f][place], england: S.functions[f].england, uk: S.functions[f].uk })).filter((r) => r.place !== null && r.england !== null && r.england > 50);

// ---- Public finances ---------------------------------------------------------------------------------------------------------------------------------------
export const F = D.fiscal;
export const F_LAST = last(F.years);
const popAt = (k, year) => D.gdp.population[k][D.gdp.years.indexOf(Math.min(year, last(D.gdp.years)))];
export const fiscalPerHead = (k, key = "balance") => (last(F.places[k][key]) * 1e6) / popAt(k, F_LAST);
export const fiscalTotal = (k, key = "balance") => last(F.places[k][key]);
export const surplusPlaces = () => Object.keys(F.places).filter((k) => !["uk", "england"].includes(k) && last(F.places[k].balance) < 0);

// ---- Economy -----------------------------------------------------------------------------------------------------------------------------------------------
export const G = D.gdp;
export const G_LAST = last(G.years);
export const gdpPerHead = (k, y = G_LAST) => G.perHead[k][G.years.indexOf(y)];
export const realPerHead = (k, y = G_LAST) => G.realPerHead[k][G.years.indexOf(y)];
export const realGrowthSince = (k, from) => round(((realPerHead(k) - realPerHead(k, from)) / realPerHead(k, from)) * 100, 0);

// ---- Map ---------------------------------------------------------------------------------------------------------------------------------------------------------------
const val = (fn) => Object.fromEntries(REGIONS.map((r) => { const v = fn(r.key); return [r.key, typeof v === "number" && Number.isFinite(v) ? round(v, 2) : null]; }));
export const MAP_METRICS = [
  { id: "spend", group: "Public spending", label: "Spending on services per person", format: "gbp", accent: "#1D4ED8", blurb: "Public spending on services that can be identified with each place, per resident, in the latest year. It leaves out spending that cannot be tied to a place, such as defence, debt interest and overseas aid, so it is not the whole of what government spends.", values: () => val((k) => perHead(k)), uk: () => perHead("uk"), year: yearText(S_LAST) },
  { id: "spendIndex", group: "Public spending", label: "Spending against the UK average", format: "index", accent: "#7A5AF0", blurb: "Spending on services per person as an index, with the UK as 100. Above 100 means more is spent per resident than the UK average.", values: () => val((k) => indexOf(k)), uk: () => 100, year: yearText(S_LAST) },
  { id: "spendReal", group: "Public spending", label: "Change in spending per person since 2020 to 21", format: "pct", accent: "#0F766E", blurb: "How much spending per resident has changed, after inflation, since 2020 to 2021. A negative figure is a fall. Much of the fall is the end of pandemic spending.", values: () => val((k) => realChange(k)), uk: () => realChange("uk"), year: `${yearText(S.years[0])} to ${yearText(S_LAST)}` },
  { id: "balance", group: "Taxes and spending", label: "Deficit per person", format: "gbp", accent: "#C0561F", blurb: "What the public sector spends in a place, less the revenue raised there, per resident. A positive figure is a deficit: the place receives more than it contributes. A negative figure is a surplus. North Sea oil and gas revenue is counted where the fields are.", values: () => val((k) => fiscalPerHead(k)), uk: () => fiscalPerHead("uk"), year: yearText(F_LAST) },
  { id: "receipts", group: "Taxes and spending", label: "Revenue raised per person", format: "gbp", accent: "#9D174D", blurb: "Taxes and other revenue raised in each place, per resident, in the latest year, with North Sea oil and gas counted where the fields are.", values: () => val((k) => fiscalPerHead(k, "receipts")), uk: () => fiscalPerHead("uk", "receipts"), year: yearText(F_LAST) },
  { id: "gdp", group: "The economy", label: "Economic output per person", format: "gbp", accent: "#C7871A", blurb: "Gross domestic product per resident at current prices: the value of what the economy produced in each place, divided by its population. It counts where work is done, so a place that people commute into looks richer than its residents are.", values: () => val((k) => gdpPerHead(k)), uk: () => gdpPerHead("uk"), year: String(G_LAST) },
  { id: "gdpGrowth", group: "The economy", label: "Growth in output per person since 2010", format: "pct", accent: "#0E7490", blurb: "How much real GDP per resident has grown since 2010, after inflation.", values: () => val((k) => realGrowthSince(k, 2010)), uk: () => realGrowthSince("uk", 2010), year: `2010 to ${G_LAST}` },
];
