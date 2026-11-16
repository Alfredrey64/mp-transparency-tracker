import { changesOf, fmt, toT } from "./taxRates";

// What the main-rates tiles on the Taxes page draw (components/TaxToday.jsx).
export const W = 200;
export const H = 44;

export const monthYear = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

// The steps of a rate as a line: it holds a value, then jumps. Returns the path, the area under it, and where today sits. A gap (the tax did not exist) is skipped.
export function stepShape(line, iso, w = W, h = H, pad = 5) {
  const pts = line.points.filter((p) => p.value !== null && p.date <= iso);
  if (pts.length === 0) return null;
  const t0 = pts[0].t;
  const t1 = Math.max(toT(iso), t0 + 1e-6);
  const lo = Math.min(...pts.map((p) => p.value));
  const hi = Math.max(...pts.map((p) => p.value));
  const x = (t) => ((t - t0) / (t1 - t0)) * w;
  const y = (v) => (hi === lo ? h / 2 : pad + (1 - (v - lo) / (hi - lo)) * (h - pad * 2 - 4));
  let d = `M0 ${y(pts[0].value).toFixed(1)}`;
  for (let i = 1; i < pts.length; i += 1) d += ` H${x(pts[i].t).toFixed(1)} V${y(pts[i].value).toFixed(1)}`;
  d += ` H${w}`;
  return { line: d, area: `${d} V${h} H0 Z`, endY: y(pts.at(-1).value), started: pts[0].date };
}

// "Up from 19% in April 2025", "Same since April 2010".
export function lastMove(line, iso) {
  const cs = changesOf(line).filter((c) => c.date <= iso);
  const c = cs.at(-1);
  if (!c) return null;
  if (c.move === "up" || c.move === "down") return `${c.move === "up" ? "Up" : "Down"} from ${fmt(line.unit, c.from)} in ${monthYear(c.date)}`;
  return cs.length > 1 ? `Changed ${monthYear(c.date)}` : `Same since ${monthYear(c.date)}`;
}

