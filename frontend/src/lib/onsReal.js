// Shows money amounts in today's prices, using the Consumer Prices Index.
//
// A figure for a month is multiplied by (latest index / index for that month).
// Quarterly and yearly figures use the average index over the months they cover.
// The index only starts in 1988, so earlier figures are left out when adjusting.

import { periodLabel } from "./onsFormat";

const monthsOf = (period) => {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return [0, 1, 2].map((i) => `${q[1]}-${String((Number(q[2]) - 1) * 3 + i + 1).padStart(2, "0")}`);
  if (/^\d{4}-\d{2}$/.test(period)) return [period];
  if (/^\d{4}$/.test(period)) return Array.from({ length: 12 }, (_, i) => `${period}-${String(i + 1).padStart(2, "0")}`);
  return [];
};

export function makeDeflator(points) {
  if (!points?.length) return null;
  const byMonth = new Map(points);
  const [latestPeriod, latestIndex] = points[points.length - 1];
  const at = (period) => {
    const values = monthsOf(period).map((m) => byMonth.get(m)).filter((v) => v > 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  return { at, latestPeriod, latestIndex, label: periodLabel(latestPeriod), firstPeriod: points[0][0] };
}

// The same points, each worth what it would be in the latest month's prices.
export function toReal(points, deflator) {
  if (!deflator) return points;
  const out = [];
  for (const [period, value] of points) {
    const index = deflator.at(period);
    if (index) out.push([period, (value * deflator.latestIndex) / index]);
  }
  return out;
}
