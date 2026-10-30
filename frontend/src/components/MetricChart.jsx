import { useEffect, useMemo, useRef, useState } from "react";
import { watchWidth } from "../lib/watchWidth";
import { COLORS, FONT_BODY } from "../theme";
import { GOVERNMENTS } from "../data/governments";
import { GROUPS } from "../lib/electionHistory";
import { formatValue } from "../lib/governmentMetrics";

// A line chart of one national figure from 1945 to now, with a coloured band behind it for each government. Tap or hover to read a value;
// tap a band's label to open that government. The table beside it carries the same numbers for anyone who cannot use the chart.

// The chart is drawn at the width of the space it is in (760 until that is measured), so its labels stay the size they are written at on a phone
// instead of being shrunk with the picture.
const WIDE = 760;
const H = 290;
const M = { l: 52, r: 10, t: 26, b: 28 };
const START = Date.UTC(1945, 6, 26);

const bandColour = (party) => (party === "l" ? GROUPS.l.colour : GROUPS.c.colour);
const surname = (pm) => pm.split(" and ")[0].split(" ").slice(-1)[0];

function niceTicks(min, max, n = 4) {
  const span = max - min || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

export default function MetricChart({ metric, prepared, now, selectedId, onSelect }) {
  const [hover, setHover] = useState(null);
  const figRef = useRef(null);
  const [W, setW] = useState(WIDE);
  useEffect(() => watchWidth(figRef.current, (w) => setW(Math.min(WIDE, Math.max(280, Math.round(w))))), []);

  const geom = useMemo(() => {
    const pts = prepared.points.filter(([t]) => t >= START - 365 * 86400000);
    // Thin very long series so the line stays light: keep at most about 600 points.
    const step = Math.max(1, Math.ceil(pts.length / 600));
    const thin = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
    const t0 = Math.min(START, thin[0]?.[0] ?? START);
    const t1 = now;
    const values = thin.map(([, v]) => v);
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    const log = Boolean(metric.log);
    if (log) { lo = Math.log10(Math.max(lo, 1)); hi = Math.log10(hi); }
    else { lo = Math.min(0, lo); }
    const pad = (hi - lo) * 0.06;
    hi += pad;
    if (lo < 0 || !log) lo = lo < 0 ? lo - pad : lo;
    const x = (t) => M.l + ((t - t0) / (t1 - t0)) * (W - M.l - M.r);
    const y = (v) => {
      const val = log ? Math.log10(Math.max(v, 1)) : v;
      return M.t + (1 - (val - lo) / (hi - lo)) * (H - M.t - M.b);
    };
    const ticks = log
      ? [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].flatMap((m) => [m * 1000]).filter((v) => Math.log10(v) >= lo && Math.log10(v) <= hi).filter((_, i, a) => a.length <= 6 || i % 2 === 0)
      : niceTicks(lo, hi, 6);
    const path = thin.map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join("");
    return { thin, x, y, ticks, path, t0, t1 };
  }, [prepared, metric, now, W]);

  const years = useMemo(() => {
    const out = [];
    for (let yr = 1950; yr <= new Date(now).getUTCFullYear(); yr += 10) out.push(yr);
    return out;
  }, [now]);

  const nearest = (clientX, rect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    const t = geom.t0 + ((px - M.l) / (W - M.l - M.r)) * (geom.t1 - geom.t0);
    let best = null;
    for (const p of prepared.points) if (best == null || Math.abs(p[0] - t) < Math.abs(best[0] - t)) best = p;
    return best && Math.abs(best[0] - t) < 400 * 86400000 ? best : null;
  };

  const govAt = (t) => GOVERNMENTS.find((g) => Date.parse(`${g.from}T00:00:00Z`) <= t && (!g.to || t < Date.parse(`${g.to}T00:00:00Z`)));
  const last = prepared.points[prepared.points.length - 1];
  const first = prepared.points.find(([t]) => t >= START - 365 * 86400000) ?? prepared.points[0];
  const hoverGov = hover ? govAt(hover[0]) : null;
  const shown = hover ?? null;

  return (
    <figure ref={figRef} style={{ margin: 0 }}>
      <div aria-live="polite" style={{ minHeight: 44, fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>
        {shown ? (
          <>
            <strong style={{ color: COLORS.ink, fontSize: 18 }}>{formatValue(metric, shown[1])}</strong>{" "}
            in {new Date(shown[0]).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}
            {hoverGov && <> · under {hoverGov.pm}</>}
          </>
        ) : "Move over the chart or tap it to read a figure. The coloured bands show who was in government."}
      </div>
      <svg
        role="img"
        aria-label={`${metric.label} from ${new Date(first[0]).getUTCFullYear()} to ${new Date(last[0]).getUTCFullYear()}, from ${formatValue(metric, first[1])} to ${formatValue(metric, last[1])}, with a band for each government. The same figures are in the table below.`}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "pan-y" }}
        onPointerMove={(e) => setHover(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setHover(null)}
        onPointerDown={(e) => setHover(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
      >
        {GOVERNMENTS.map((g) => {
          const a = Math.max(geom.x(Date.parse(`${g.from}T00:00:00Z`)), M.l);
          const b = Math.min(geom.x(g.to ? Date.parse(`${g.to}T00:00:00Z`) : now), W - M.r);
          const sel = g.id === selectedId;
          return (
            <g key={g.id}>
              <rect x={a} y={M.t} width={Math.max(0, b - a)} height={H - M.t - M.b} fill={bandColour(g.party)} opacity={sel ? 0.28 : 0.1} style={{ transition: "opacity 0.3s" }} />
              <rect x={a} y={M.t - 8} width={Math.max(0, b - a)} height={5} fill={bandColour(g.party)} opacity={0.9} />
              {g.party === "lc" && <rect x={a} y={M.t - 8} width={Math.max(0, b - a) / 2} height={5} fill={GROUPS.d.colour} />}
              {b - a > 34 && (
                <text x={(a + b) / 2} y={M.t - 12} textAnchor="middle" fontSize="9.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft} style={{ cursor: "pointer" }} onClick={() => onSelect(g.id)}>{g.id === "coalition" ? "Coalition" : surname(g.pm)}</text>
              )}
              <rect x={a} y={M.t - 20} width={Math.max(0, b - a)} height={H - M.t - M.b + 20} fill="transparent" style={{ cursor: "pointer" }} onClick={(ev) => { ev.stopPropagation(); onSelect(g.id); }} />
            </g>
          );
        })}
        {geom.ticks.map((v) => (
          <g key={v}>
            <line x1={M.l} x2={W - M.r} y1={geom.y(v)} y2={geom.y(v)} stroke={COLORS.hairline} strokeWidth="0.8" />
            <text x={M.l - 6} y={geom.y(v) + 3.5} textAnchor="end" fontSize="10.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{tickLabel(metric, v)}</text>
          </g>
        ))}
        {years.map((yr) => (
          <text key={yr} x={geom.x(Date.UTC(yr, 0, 1))} y={H - 8} textAnchor="middle" fontSize="10.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{yr}</text>
        ))}
        <path d={geom.path} fill="none" stroke={metric.colour ?? COLORS.ink} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none" />
        {shown && <circle cx={geom.x(shown[0])} cy={geom.y(shown[1])} r="4.5" fill={metric.colour ?? COLORS.ink} stroke={COLORS.paperCard} strokeWidth="2" pointerEvents="none" />}
      </svg>
    </figure>
  );
}

function tickLabel(metric, v) {
  const abs = Math.abs(v);
  const text = abs >= 1e6 ? `${v / 1e6}m` : abs >= 1000 ? `${Math.round(v / 100) / 10}k`.replace(".0k", "k") : `${Math.round(v * 100) / 100}`;
  if (metric.unit === "%" || metric.unit === "% of GDP") return `${text}%`;
  if (metric.unit === "£") return `£${text}`;
  if (metric.unit === "£bn") return `£${text}bn`;
  return text;
}
