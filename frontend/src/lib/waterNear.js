import { miles } from "./nearYou";

// Water near a postcode: the sewage overflows within a few miles (Environment Agency annual returns, asked live from its public map service) and the nearest bathing
// waters (the Environment Agency's classifications, saved with the site).

const SERVICE = "https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/arcgis/rest/services/edm_annual_returns_all_years_public/FeatureServer/0/query";
const FIELDS = "unique_id,site_name_ea_condat,water_company_name,counted_spills_12_24hr_calculated,total_spill_duration_hrs_calculated,edm_operation_percent_calculated,receiving_water_environment_common_name_ea_condat,bathing_water,annual_return_year,has_data";

const title = (s) => String(s ?? "").toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bCso\b/g, "CSO").replace(/\bSps\b/g, "SPS").replace(/\bSws\b/g, "SWS").replace(/\bStw\b/g, "STW").replace(/\bWwtw\b/g, "WwTW").replace(/\bTrib\b/g, "Tributary").replace(/\bOf\b/g, "of").replace(/\bTo\b/g, "to").replace(/\bAnd\b/g, "and").replace(/\bThe\b/g, "the").replace(/\bAt\b/g, "at").replace(/\bVia\b/g, "via").trim();

// One feature from the service -> one overflow. `has_data` is 0 when the company gave no usable monitoring for the year.
export function overflowFrom(f, point) {
  const a = f?.attributes ?? {};
  const g = f?.geometry;
  if (!g || !Number.isFinite(g.x) || !Number.isFinite(g.y)) return null;
  const spills = a.has_data === 0 || a.counted_spills_12_24hr_calculated == null ? null : Math.round(Number(a.counted_spills_12_24hr_calculated));
  const hours = a.has_data === 0 || a.total_spill_duration_hrs_calculated == null ? null : Math.round(Number(a.total_spill_duration_hrs_calculated));
  return {
    id: a.unique_id,
    name: title(a.site_name_ea_condat) || "Unnamed overflow",
    company: String(a.water_company_name ?? "").trim(),
    water: title(a.receiving_water_environment_common_name_ea_condat).replace(/\s*\([A-Z]\)$/, ""),
    spills, hours,
    running: a.edm_operation_percent_calculated == null ? null : Math.round(Number(a.edm_operation_percent_calculated) * 10) / 10,
    bathing: /^(not applicable|)$/i.test(String(a.bathing_water ?? "").trim()) ? "" : String(a.bathing_water).trim(),
    miles: point ? miles(point, { lat: g.y, lon: g.x }) : null,
  };
}

// The totals the card leads with, and the busiest few. An overflow with no data is counted as monitored but left out of the totals and the ranking.
export function summariseOverflows(list) {
  const withData = list.filter((o) => o.spills != null);
  const spilled = withData.filter((o) => o.spills > 0);
  return {
    count: list.length,
    withData: withData.length,
    spilled: spilled.length,
    spills: withData.reduce((s, o) => s + o.spills, 0),
    hours: withData.reduce((s, o) => s + (o.hours ?? 0), 0),
    busiest: [...withData].sort((a, b) => b.spills - a.spills || (b.hours ?? 0) - (a.hours ?? 0)).slice(0, 5),
    poorlyMonitored: withData.filter((o) => o.running != null && o.running < 90).length,
  };
}

let yearAsked;
async function latestYear(fetcher) {
  yearAsked ??= (async () => {
    const res = await fetcher(`${SERVICE}?where=1%3D1&outFields=annual_return_year&returnDistinctValues=true&returnGeometry=false&f=json`);
    const years = ((await res.json()).features ?? []).map((f) => Number(f.attributes.annual_return_year)).filter(Boolean);
    if (!years.length) throw new Error("year");
    return String(Math.max(...years));
  })().catch((e) => { yearAsked = undefined; throw e; });
  return yearAsked;
}

export async function loadOverflows(point, radius = 3, fetcher = fetch) {
  const year = await latestYear(fetcher);
  const q = new URLSearchParams({
    where: `annual_return_year='${year}'`, geometry: `${point.lon},${point.lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
    distance: String(radius), units: "esriSRUnit_StatuteMile", outFields: FIELDS, outSR: "4326", returnGeometry: "true", resultRecordCount: "1000", f: "json",
  });
  const res = await fetcher(`${SERVICE}?${q}`);
  if (!res.ok) throw new Error("overflows");
  const json = await res.json();
  if (json.error) throw new Error("overflows");
  const list = (json.features ?? []).map((f) => overflowFrom(f, point)).filter(Boolean).sort((a, b) => a.miles - b.miles);
  return { year, radius, list, summary: summariseOverflows(list), truncated: Boolean(json.exceededTransferLimit) };
}

// The bathing waters nearest the point, within `max` miles.
export function nearestBathing(sites, point, count = 3, max = 30) {
  return (sites ?? []).map((s) => ({ ...s, miles: miles(point, s) })).filter((s) => s.miles <= max).sort((a, b) => a.miles - b.miles).slice(0, count);
}

export const RATING_TEXT = {
  Excellent: "The best of the four ratings: the water met the strictest standard for bacteria in the last four seasons.",
  Good: "Met the standard for bacteria, though not the strictest one.",
  Sufficient: "Met the minimum standard. The Environment Agency expects action to improve it.",
  Poor: "Did not meet the minimum standard. Signs advise against bathing.",
  Closed: "Closed to bathing for the season.",
};
export const RATING_TONE = { Excellent: "#1B5E8C", Good: "#2F8F6B", Sufficient: "#C88A1E", Poor: "#B3262E", Closed: "#6B7280" };
