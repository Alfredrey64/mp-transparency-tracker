// Takes inflation out of the figures, in three ways, all using the Consumer Prices Index:
//
//  - money amounts (nominal series) are shown in today's prices: a figure for a month is
//    multiplied by (latest index / index for that month);
//  - interest rates (realMode "rate") become real rates: the rate minus the inflation rate;
//  - price rises for one kind of thing (realMode "relative"), such as food, become how much
//    faster or slower they rose than prices in general: the rise minus the inflation rate.
//
// Quarterly and yearly figures use the average over the months they cover. The index only
// starts in 1988 (and inflation a year later), so earlier figures are left out.

import { periodLabel } from "./onsFormat";

const monthsOf = (period) => {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return [0, 1, 2].map((i) => `${q[1]}-${String((Number(q[2]) - 1) * 3 + i + 1).padStart(2, "0")}`);
  if (/^\d{4}-\d{2}$/.test(period)) return [period];
  if (/^\d{4}$/.test(period)) return Array.from({ length: 12 }, (_, i) => `${period}-${String(i + 1).padStart(2, "0")}`);
  return [];
};

const yearBefore = (month) => `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`;
const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

export function makeDeflator(points) {
  if (!points?.length) return null;
  const byMonth = new Map(points);
  const [latestPeriod, latestIndex] = points[points.length - 1];
  const at = (period) => average(monthsOf(period).map((m) => byMonth.get(m)).filter((v) => v > 0));
  const inflationAt = (period) => average(
    monthsOf(period)
      .map((m) => (byMonth.get(m) > 0 && byMonth.get(yearBefore(m)) > 0 ? (byMonth.get(m) / byMonth.get(yearBefore(m)) - 1) * 100 : null))
      .filter((v) => v !== null),
  );
  return { at, inflationAt, latestPeriod, latestIndex, label: periodLabel(latestPeriod), firstPeriod: points[0][0] };
}

// Does this series change when inflation is taken out?
export const canAdjust = (def) => Boolean(def?.nominal || def?.realMode);

// The same points with inflation taken out, as described above. `def` says which way.
export function toReal(points, deflator, def) {
  if (!deflator) return points;
  const out = [];
  for (const [period, value] of points) {
    if (def?.realMode) {
      const inflation = deflator.inflationAt(period);
      if (inflation !== null) out.push([period, value - inflation]);
    } else {
      const index = deflator.at(period);
      if (index) out.push([period, (value * deflator.latestIndex) / index]);
    }
  }
  return out;
}
