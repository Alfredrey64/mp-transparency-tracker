// The sums behind the Regions page: lining every region up on the same dates, ranking them,
// and turning a value into a colour.

import { periodToT } from "./onsFormat";
import { valueAtOrBefore } from "./onsStats";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// A point in time (a year with a fraction, as periodToT gives) as "September 2026".
export function tLabel(t) {
  const year = Math.floor(t + 1e-6);
  const month = Math.min(11, Math.round((t - year) * 12));
  return `${MONTH_NAMES[month]} ${year}`;
}

// Every month from the latest start to the earliest end among the series, as points in time.
// `seriesList` is [points, ...]. Returns [] if they never overlap.
export function monthlyTimeline(seriesList) {
  const starts = [];
  const ends = [];
  for (const points of seriesList) {
    if (!points?.length) continue;
    starts.push(periodToT(points[0][0]));
    ends.push(periodToT(points.at(-1)[0]));
  }
  if (!starts.length) return [];
  const from = Math.round(Math.max(...starts) * 12);
  const to = Math.round(Math.min(...ends) * 12);
  const out = [];
  for (let m = from; m <= to; m++) out.push(m / 12);
  return out;
}

// For one region: its value at each point in time of the timeline (the latest reading on or before it).
export function valuesOver(points, timeline) {
  return timeline.map((t) => valueAtOrBefore(points, t + 1e-6)?.[1] ?? null);
}

// Highest first. Regions with no value go to the bottom.
export function ranked(valueByKey) {
  return Object.entries(valueByKey)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key], i) => ({ key, rank: i + 1 }));
}

export const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// The lowest and highest value over the whole timeline for every region, for a colour scale that stays put.
export function domainOf(valuesByKey) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const values of Object.values(valuesByKey)) {
    for (const v of values) {
      if (v === null || v === undefined) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  return lo === Infinity ? [0, 1] : [lo, hi];
}

// Where a value sits between the ends of a scale, 0 to 1.
export const fraction = (v, [lo, hi]) => (v === null || v === undefined || hi === lo ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo))));
