// Turns saved ONS points into what the chart wants, and picks sensible
// labels for the time axis.

import { periodToT, periodLabel } from "./onsFormat";

export function toLineData(points) {
  return points.map(([p, v]) => ({ x: periodToT(p), y: v, label: periodLabel(p), period: p }));
}

// Year labels spaced to suit how much time the chart covers.
export function yearTicks(from, to) {
  const first = Math.ceil(from);
  const last = Math.floor(to);
  const span = to - from;
  const step = span <= 3 ? 1 : span <= 8 ? 2 : span <= 30 ? 5 : span <= 60 ? 10 : 20;
  const ticks = [];
  for (let y = Math.ceil(first / step) * step; y <= last; y += step) ticks.push({ x: y, label: String(y) });
  if (ticks.length < 2) ticks.unshift({ x: from, label: String(Math.round(from)) });
  return ticks;
}
