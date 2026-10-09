// Series worked out from other series, so the pipeline only has to download the
// raw figures. Points are [period, value] pairs like the ones the ONS pages use.

import { periodToT } from "./onsFormat";
import { monthlyPayment } from "./mortgage";

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

// a minus b, where both have a figure for the same period.
export function minus(a, b) {
  const lookup = new Map(b);
  return a.filter(([p]) => lookup.has(p)).map(([p, v]) => [p, v - lookup.get(p)]);
}

// a plus b, where both have a figure for the same period.
export function plus(a, b) {
  const lookup = new Map(b);
  return a.filter(([p]) => lookup.has(p)).map(([p, v]) => [p, v + lookup.get(p)]);
}

// a as a percentage of b, where both have a figure for the same period.
export function percentOf(a, b) {
  const lookup = new Map(b.map(([p, v]) => [p, v]));
  return a.filter(([p]) => lookup.get(p)).map(([p, v]) => [p, (v / lookup.get(p)) * 100]);
}

// a divided by (b times `times`), where both have a figure for the same period: for example a house price over a year of
// pay, which is weekly pay times 52.
export function ratio(a, b, times = 1) {
  const lookup = new Map(b);
  return a.filter(([p]) => lookup.get(p)).map(([p, v]) => [p, v / (lookup.get(p) * times)]);
}

// Every figure times `factor` (for example weekly pay times 52 / 12 for monthly pay).
export function scale(a, factor) {
  return a.map(([p, v]) => [p, v * factor]);
}

// The monthly repayment on a mortgage for `ltv` (for example 0.75) of each period's house price, over `years`, at that
// period's mortgage rate. Where both have a figure for the same period.
export function mortgagePayments(prices, rates, ltv = 0.75, years = 25) {
  const lookup = new Map(rates);
  return prices.filter(([p]) => lookup.has(p)).map(([p, v]) => [p, monthlyPayment(v * ltv, lookup.get(p), years)]);
}

// Works out a derived series from `base`, a map of series id to points.
export function derive(spec, base) {
  const from = base[spec.from];
  if (!from?.length) return [];
  switch (spec.op) {
    case "yoy": return yearOnYear(from);
    case "sum": return rollingSum(from, spec.n);
    case "complement": return from.map(([p, v]) => [p, 100 - v]);
    case "plus": return base[spec.of]?.length ? plus(from, base[spec.of]) : [];
    case "minus": return base[spec.of]?.length ? minus(from, base[spec.of]) : [];
    case "ratio": return base[spec.of]?.length ? ratio(from, base[spec.of], spec.times ?? 1) : [];
    case "scale": return scale(from, spec.factor);
    case "mortgage": return base[spec.rate]?.length ? mortgagePayments(from, base[spec.rate], spec.ltv, spec.years) : [];
    case "percentOf": return base[spec.of]?.length ? percentOf(from, base[spec.of]) : [];
    default: return [];
  }
}
