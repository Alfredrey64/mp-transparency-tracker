// What to say about a council's roads and fly-tipping from src/data/councilServices.json, set against England. Pure and tested.

export const ROAD_KINDS = [
  { key: "a", label: "A roads", text: "the main roads a council looks after" },
  { key: "bc", label: "B and C roads", text: "the next level of local road" },
  { key: "u", label: "Unclassified roads", text: "most residential streets" },
];

const last = (series) => (Array.isArray(series) ? series[series.length - 1] : null);

// The road condition rows for one road authority: the latest share needing maintenance, England's, and how it has moved since the first year held. A kind with no latest
// figure is left out.
export function roadRows(data, code) {
  const c = data?.roads?.councils?.[code];
  if (!c) return [];
  const years = data.roads.years;
  return ROAD_KINDS.map((k) => {
    const series = c[k.key];
    const value = last(series);
    if (value == null) return null;
    const first = series.find((v) => v != null);
    const firstYear = years[series.findIndex((v) => v != null)];
    const nat = last(data.roads.england?.[k.key]);
    return { ...k, value, nat, since: first != null && firstYear !== years[years.length - 1] ? { value: first, year: firstYear } : null, year: years[years.length - 1] };
  }).filter(Boolean);
}

// Fly-tipping for one collection authority: incidents in the latest year and the change on the year before.
export function flyTippingRow(data, code) {
  const c = data?.flyTipping?.councils?.[code];
  if (!c) return null;
  const change = c.p ? Math.round(((c.t - c.p) / c.p) * 100) : null;
  return { total: c.t, previous: c.p, change, year: data.flyTipping.year, before: data.flyTipping.before };
}

export const roadYear = (y) => `${y - 1}/${String(y).slice(2)}`;
