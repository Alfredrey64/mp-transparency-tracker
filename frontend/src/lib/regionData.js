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

// ---------------------------------------------------------------------------
// Colours for the map and its key

// A colour from pale (0) to vivid (1) for one metric. Both ends read clearly on a light or a dark page.
export function rampColour(accent, t) {
  const pct = Math.round(Math.max(0, Math.min(1, t)) * 100);
  const pale = `color-mix(in oklab, ${accent} 16%, #ffffff)`;
  const deep = `color-mix(in oklab, ${accent} 90%, #000000)`;
  return `color-mix(in oklab, ${deep} ${pct}%, ${pale})`;
}

// Splits a scale into equal bands and counts how many places fall in each, for the colour key.
// Returns [{ from, to, mid, count, keys }] from the lowest band to the highest.
export function bandsOf(valueByKey, [lo, hi], n = 5) {
  const width = (hi - lo) / n || 1;
  const bands = Array.from({ length: n }, (_, i) => ({ from: lo + i * width, to: lo + (i + 1) * width, mid: (i + 0.5) / n, count: 0, keys: [] }));
  for (const [key, v] of Object.entries(valueByKey)) {
    if (v === null || v === undefined) continue;
    const i = Math.min(n - 1, Math.max(0, Math.floor((v - lo) / width)));
    bands[i].count += 1;
    bands[i].keys.push(key);
  }
  return bands;
}

// A value part-way between two months' readings: position 12.5 is half way from month 12 to month 13.
export function valueAtPosition(values, position) {
  if (!values?.length) return null;
  const last = values.length - 1;
  const p = Math.max(0, Math.min(last, position));
  const i = Math.floor(p);
  const a = values[i];
  const b = values[Math.min(last, i + 1)];
  if (a === null || a === undefined) return b ?? null;
  if (b === null || b === undefined) return a;
  return a + (b - a) * (p - i);
}
