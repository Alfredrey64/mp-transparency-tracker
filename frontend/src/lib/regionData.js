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

// ---------------------------------------------------------------------------
// Whole-number colour classes
//
// The map is coloured in a handful of classes with round-number edges (0 to 100k, 100k to 200k, ...)
// rather than a smooth fade, so a region visibly steps from one colour to the next as its figure
// crosses a line, and the key can say exactly where the lines are.

// Round-number class edges that cover [lo, hi] in about `target` classes: { bounds: [b0, b1, ...], step }.
export function niceBands(lo, hi, target = 6) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { bounds: [0, 1], step: 1 };
  if (hi - lo < 1e-9) {
    const step = Math.abs(hi) >= 1 ? 1 : 0.1;
    const start = Math.floor(lo / step) * step;
    return { bounds: [start, start + step], step };
  }
  const raw = (hi - lo) / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((x) => x >= raw - 1e-12) ?? 10 * mag;
  const start = Math.floor(lo / step + 1e-9) * step;
  const bounds = [];
  for (let b = start, i = 0; i < 40; i++, b = start + i * step) {
    bounds.push(Number(b.toPrecision(12)));
    if (b >= hi - 1e-9) break;
  }
  return { bounds, step };
}

// Which class a value falls in (0 is the lowest). The top edge belongs to the top class.
export function classOf(v, bounds) {
  if (v === null || v === undefined || Number.isNaN(v)) return -1;
  const last = bounds.length - 2;
  for (let i = 0; i <= last; i++) if (v < bounds[i + 1]) return Math.max(0, i);
  return last;
}

// The colour of one class out of `n`: from nearly white, through the metric's own colour, to a deep shade.
// Each step is well apart from its neighbours so the map reads at a glance.
export function classColour(accent, i, n) {
  const t = n <= 1 ? 1 : Math.max(0, Math.min(1, i / (n - 1)));
  const pale = `color-mix(in oklab, ${accent} 14%, #ffffff)`;
  const deep = `color-mix(in oklab, ${accent} 52%, #000000)`;
  if (t <= 0.55) return `color-mix(in oklab, ${accent} ${Math.round((t / 0.55) * 100)}%, ${pale})`;
  return `color-mix(in oklab, ${deep} ${Math.round(((t - 0.55) / 0.45) * 100)}%, ${accent})`;
}
