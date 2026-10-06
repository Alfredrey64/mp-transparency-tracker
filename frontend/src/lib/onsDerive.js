// Series worked out from other series, so the pipeline only has to download the
// raw figures. Points are [period, value] pairs like the ones the ONS pages use.

import { periodToT } from "./onsFormat";

export function periodsPerYear(points) {
  if (points.length < 2) return 1;
  const gap = periodToT(points[1][0]) - periodToT(points[0][0]);
  return Math.round(1 / gap) || 1;
}

// Per cent change on the same period a year earlier.
export function yearOnYear(points) {
  const n = periodsPerYear(points);
  const out = [];
  for (let i = n; i < points.length; i++) {
    const before = points[i - n][1];
    if (before) out.push([points[i][0], ((points[i][1] - before) / Math.abs(before)) * 100]);
  }
  return out;
}

// A running total over the last `n` periods (for example, borrowing over the past 12 months).
export function rollingSum(points, n) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += points[i][1];
    if (i >= n) sum -= points[i - n][1];
    if (i >= n - 1) out.push([points[i][0], sum]);
  }
  return out;
}

// a as a percentage of b, where both have a figure for the same period.
export function percentOf(a, b) {
  const lookup = new Map(b.map(([p, v]) => [p, v]));
  return a.filter(([p]) => lookup.get(p)).map(([p, v]) => [p, (v / lookup.get(p)) * 100]);
}

// Works out a derived series from `base`, a map of series id to points.
export function derive(spec, base) {
  const from = base[spec.from];
  if (!from?.length) return [];
  switch (spec.op) {
    case "yoy": return yearOnYear(from);
    case "sum": return rollingSum(from, spec.n);
    case "percentOf": return base[spec.of]?.length ? percentOf(from, base[spec.of]) : [];
    default: return [];
  }
}
