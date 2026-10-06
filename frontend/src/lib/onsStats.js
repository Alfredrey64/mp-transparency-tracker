// Comparisons over time for one series: how today's figure stands against a
// year, five years and ten years ago, and against the highest and lowest the
// series has ever recorded. This is what makes a number meaningful: 4.9% only
// tells you something once you know what it was before.

import { periodToT, periodLabel, changeBetween } from "./onsFormat";

export { changeBetween };

// The point closest to time `t`, if there is one within `tolerance` years.
export function pointNear(points, t, tolerance = 0.2) {
  let best = null;
  let bestGap = Infinity;
  for (const p of points) {
    const gap = Math.abs(periodToT(p[0]) - t);
    if (gap < bestGap) { best = p; bestGap = gap; }
  }
  return best && bestGap <= tolerance ? best : null;
}

export function compareStats(def, points) {
  if (!points?.length) return null;
  const [period, value] = points[points.length - 1];
  const t = periodToT(period);
  const back = (years) => {
    const p = pointNear(points, t - years, years <= 1 ? 0.05 : 0.2);
    return p ? { period: p[0], label: periodLabel(p[0]), value: p[1], change: changeBetween(def, p[1], value) } : null;
  };
  let high = points[0];
  let low = points[0];
  let below = 0;
  for (const p of points) {
    if (p[1] > high[1]) high = p;
    if (p[1] < low[1]) low = p;
    if (p[1] < value) below++;
  }
  return {
    latest: { period, label: periodLabel(period), value },
    yearAgo: back(1),
    fiveAgo: back(5),
    tenAgo: back(10),
    high: { period: high[0], label: periodLabel(high[0]), value: high[1], isNow: high[0] === period },
    low: { period: low[0], label: periodLabel(low[0]), value: low[1], isNow: low[0] === period },
    since: points[0][0].slice(0, 4),
    higherThanShare: Math.round((below / points.length) * 100),
    count: points.length,
  };
}

// The value of a series at time t (the latest reading on or before it), for "then and now".
export function valueAtOrBefore(points, t) {
  let found = null;
  for (const p of points) {
    if (periodToT(p[0]) <= t + 1e-9) found = p;
    else break;
  }
  return found;
}
