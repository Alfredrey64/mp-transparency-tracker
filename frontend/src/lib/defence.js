import raw from "../data/defenceData.json";

export const D = raw;
export const last = (a) => a[a.length - 1];
export const at = (series, year) => series.values[series.years.indexOf(year)] ?? null;

// The first year from which a UK series stayed under a level.
export function stayedUnder(years, values, level) {
  for (let i = 0; i < values.length; i += 1) if (values.slice(i).every((v) => v < level)) return years[i];
  return null;
}
