// Sets the latest figure for a series against what the government promised.

import { formatValue, labelFor } from "./onsFormat";

// Returns { met, text, progress } or null if there is nothing to compare.
//   met       true / false (null for a pledge with no fixed finish line)
//   progress  0 to 1, how far the figure is towards its target (for a bar)
export function describeMeasure(def, points, measure) {
  if (!points?.length) return null;
  const [period, value] = points[points.length - 1];
  const now = `${formatValue(def.format, value)} in ${labelFor(def, period).replace(/^Year to/, "the year to")}`;
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  if (measure.mode === "peak") {
    let high = points[0];
    for (const p of points) if (p[1] > high[1]) high = p;
    if (high[0] === period) return { met: null, text: `${now}, the highest on record.`, progress: null };
    const below = Math.round((1 - value / high[1]) * 100);
    return { met: null, text: `${now}, ${below}% below its peak of ${formatValue(def.format, high[1])} (${lowerFirst(labelFor(def, high[0])).replace(/^year to/, "the year to")}).`, progress: null };
  }

  const gap = (a, b) => {
    const diff = Math.abs(a - b);
    return def.format === "pct" ? `${diff.toFixed(1)} percentage points` : formatValue(def.format, diff);
  };
  if (measure.mode === "atLeast") {
    const met = value >= measure.target;
    return {
      met,
      text: met ? `${now}, which meets ${measure.targetText}.` : `${now}, ${gap(measure.target, value)} short of ${measure.targetText}.`,
      progress: Math.max(0, Math.min(1, value / measure.target)),
    };
  }
  // atMost
  const met = value <= measure.target;
  return {
    met,
    text: met ? `${now}, which meets ${measure.targetText}.` : `${now}, ${gap(value, measure.target)} above ${measure.targetText}.`,
    progress: null,
  };
}
