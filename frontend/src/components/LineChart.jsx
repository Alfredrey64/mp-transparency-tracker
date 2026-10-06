import { useState, useMemo, useId } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { niceTicks } from "../lib/onsFormat";

// A plain line chart for one or two series, drawn as SVG that scales to its
// width. Hover or touch shows the value under the pointer. Data points look
// like { x: number, y: number, label: string }.

const W = 640;
const M = { l: 48, r: 16, t: 14, b: 28 };

export default function LineChart({ lines, xTicks, yFormat, ariaLabel, height = 230, accent }) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState(null);
  const H = height;

  const geo = useMemo(() => {
    const all = lines.flatMap((l) => l.points);
    if (!all.length) return null;
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    const crossesZero = yMin < 0 && yMax > 0;
    if (crossesZero || (yMin >= 0 && yMin < (yMax - yMin) * 0.6)) yMin = Math.min(yMin, 0);
    const pad = (yMax - yMin || 1) * 0.08;
    const lo = yMin === 0 ? 0 : yMin - pad;
    const hi = yMax + pad;
    const ticks = niceTicks(lo, hi, 4);
    const dLo = Math.min(lo, ticks[0] ?? lo);
    const dHi = Math.max(hi, ticks.at(-1) ?? hi);
    const sx = (x) => M.l + ((x - xMin) / (xMax - xMin || 1)) * (W - M.l - M.r);
    const sy = (y) => M.t + (1 - (y - dLo) / (dHi - dLo || 1)) * (H - M.t - M.b);
    return { xMin, xMax, ticks, sx, sy, dLo, dHi };
  }, [lines, H]);

  if (!geo) return null;
  const { sx, sy, ticks } = geo;
  const main = lines[0].points;

  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
  const area = `${path(main)} L${sx(main.at(-1).x).toFixed(1)} ${sy(Math.max(geo.dLo, Math.min(0, geo.dHi))).toFixed(1)} L${sx(main[0].x).toFixed(1)} ${sy(Math.max(geo.dLo, Math.min(0, geo.dHi))).toFixed(1)} Z`;

  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const x = geo.xMin + ((px - M.l) / (W - M.l - M.r)) * (geo.xMax - geo.xMin);
    let lo = 0;
    let hiI = main.length - 1;
    while (hiI - lo > 1) {
      const mid = (lo + hiI) >> 1;
      if (main[mid].x < x) lo = mid;
      else hiI = mid;
    }
    const i = Math.abs(main[lo].x - x) <= Math.abs(main[hiI].x - x) ? lo : hiI;
    setHover(i);
  };

  const hp = hover !== null ? main[hover] : null;
  const tipLeft = hp ? Math.min(88, Math.max(12, (sx(hp.x) / W) * 100)) : 0;
  const zeroInside = geo.dLo < 0 && geo.dHi > 0;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", touchAction: "pan-y", overflow: "visible" }}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} stroke={COLORS.hairline} strokeWidth="1" />
            <text x={M.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{yFormat(t)}</text>
          </g>
        ))}
        {zeroInside && <line x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} stroke={COLORS.inkSoft} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />}

        {xTicks.map((t) => (
          <text key={t.x} x={sx(t.x)} y={H - 8} textAnchor="middle" fontSize="11.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{t.label}</text>
        ))}

        <path d={area} fill={`url(#fill-${gid})`} />
        {lines.slice().reverse().map((l) => (
          <path key={l.name} d={path(l.points)} fill="none" stroke={l.color ?? accent} strokeWidth={l === lines[0] ? 2.4 : 1.8} strokeLinejoin="round" strokeLinecap="round" opacity={l === lines[0] ? 1 : 0.75} />
        ))}

        {hover === null && (
          <circle cx={sx(main.at(-1).x)} cy={sy(main.at(-1).y)} r="4.5" fill={accent} stroke={COLORS.paperCard} strokeWidth="2" />
        )}
        {hp && (
          <g pointerEvents="none">
            <line x1={sx(hp.x)} x2={sx(hp.x)} y1={M.t} y2={H - M.b} stroke={COLORS.inkSoft} strokeWidth="1" opacity="0.6" />
            {lines.map((l) => {
              const q = l.points.find((p) => p.x === hp.x);
              return q ? <circle key={l.name} cx={sx(q.x)} cy={sy(q.y)} r="4.5" fill={l.color ?? accent} stroke={COLORS.paperCard} strokeWidth="2" /> : null;
            })}
          </g>
        )}
      </svg>

      {hp && (
        <div
          style={{
            position: "absolute", top: 0, left: `${tipLeft}%`, transform: "translate(-50%, -4px)", pointerEvents: "none",
            background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: "6px 10px", whiteSpace: "nowrap",
            fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.25)", zIndex: 2,
          }}
        >
          <div style={{ color: COLORS.inkSoft, fontSize: 11.5 }}>{hp.label}</div>
          {lines.map((l) => {
            const q = l.points.find((p) => p.x === hp.x);
            return q ? (
              <div key={l.name} style={{ fontWeight: 700 }}>
                {lines.length > 1 && <span style={{ color: l.color ?? accent }}>{l.name}: </span>}
                {l.format ? l.format(q.y) : yFormat(q.y)}
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
