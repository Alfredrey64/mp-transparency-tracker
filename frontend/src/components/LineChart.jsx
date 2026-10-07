import { useState, useMemo, useId, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { COLORS, FONT_BODY } from "../theme";
import { niceTicks } from "../lib/onsFormat";

// A line chart for one or more series, drawn as SVG that scales to its width.
//
// - Hover or touch shows the value under the pointer (or pass hoverX/onHoverX to
//   share one crosshair between several charts).
// - `bands` shades stretches of time, for example who was in government.
// - `clipX` draws only up to a point in time, which is how the timeline plays.
// - `animateIn` draws the line in once, when the chart scrolls into view.
//
// Points look like { x: number, y: number, label: string }.

// The chart is drawn at the width it is shown at, so its text stays readable on a phone.
const DEFAULT_W = 640;

export default function LineChart({
  lines, xTicks, yFormat, ariaLabel, height = 230, accent, bands = [], domainX, hoverX, onHoverX, clipX, animateIn = false, compact = false,
}) {
  const gid = useId().replace(/:/g, "");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [localHover, setLocalHover] = useState(null);
  // Not drawn until its width is known, in a box already as tall as the chart, so nothing jumps.
  const [measuredW, setW] = useState(null);
  const W = measuredW ?? DEFAULT_W;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = (width) => { if (width > 0) setW(Math.min(960, Math.max(260, Math.round(width)))); };
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    ro.observe(el);
    // Measure straight away too, in case the first observation is slow to arrive.
    const frame = requestAnimationFrame(() => fit(el.getBoundingClientRect().width));
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, []);
  const narrow = W < 420;
  const M = compact ? { l: 44, r: 12, t: 8, b: 22 } : { l: narrow ? 42 : 48, r: narrow ? 10 : 16, t: 16, b: 28 };
  const H = height;
  const controlled = onHoverX !== undefined;
  const hover = controlled ? hoverX : localHover;
  const setHover = controlled ? onHoverX : setLocalHover;

  const geo = useMemo(() => {
    const all = lines.flatMap((l) => l.points);
    if (!all.length) return null;
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const xMin = domainX?.[0] ?? Math.min(...xs);
    const xMax = domainX?.[1] ?? Math.max(...xs);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if ((yMin < 0 && yMax > 0) || (yMin >= 0 && yMin < (yMax - yMin) * 0.6)) yMin = Math.min(yMin, 0);
    const pad = (yMax - yMin || 1) * 0.08;
    const lo = yMin === 0 ? 0 : yMin - pad;
    const hi = yMax + pad;
    const ticks = niceTicks(lo, hi, compact ? 3 : 4);
    const dLo = Math.min(lo, ticks[0] ?? lo);
    const dHi = Math.max(hi, ticks.at(-1) ?? hi);
    const sx = (x) => M.l + ((x - xMin) / (xMax - xMin || 1)) * (W - M.l - M.r);
    const sy = (y) => M.t + (1 - (y - dLo) / (dHi - dLo || 1)) * (H - M.t - M.b);
    return { xMin, xMax, ticks, sx, sy, dLo, dHi };
  }, [lines, H, domainX, compact, W, M.l, M.r, M.t, M.b]);

  if (!geo) return null;
  const { sx, sy, ticks } = geo;

  const shown = lines.map((l) => ({ ...l, points: clipX === undefined ? l.points : l.points.filter((p) => p.x <= clipX) })).filter((l) => l.points.length);
  const main = shown[0]?.points ?? [];
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
  const baseY = sy(Math.max(geo.dLo, Math.min(0, geo.dHi)));
  const area = main.length > 1 ? `${path(main)} L${sx(main.at(-1).x).toFixed(1)} ${baseY.toFixed(1)} L${sx(main[0].x).toFixed(1)} ${baseY.toFixed(1)} Z` : "";

  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const x = geo.xMin + ((px - M.l) / (W - M.l - M.r)) * (geo.xMax - geo.xMin);
    setHover(Math.min(geo.xMax, Math.max(geo.xMin, x)));
  };

  // The reading on each line nearest the hovered time, if it is close enough to mean something.
  const near = (pts, x) => {
    if (!pts.length) return null;
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].x < x) lo = mid;
      else hi = mid;
    }
    const p = Math.abs(pts[lo].x - x) <= Math.abs(pts[hi].x - x) ? pts[lo] : pts[hi];
    const step = pts.length > 1 ? (pts[pts.length - 1].x - pts[0].x) / (pts.length - 1) : 1;
    return Math.abs(p.x - x) <= step * 0.75 + 1e-9 ? p : null;
  };
  const hits = hover === null || hover === undefined ? [] : shown.map((l) => ({ l, p: near(l.points, hover) })).filter((h) => h.p);
  const guideX = hits.length ? sx(hits[0].p.x) : null;
  const tipLeft = guideX === null ? 0 : Math.min(86, Math.max(14, (guideX / W) * 100));
  const zeroInside = geo.dLo < 0 && geo.dHi > 0;
  const bandsShown = bands.filter((b) => b.end > geo.xMin && b.start < geo.xMax);

  return (
    <div ref={ref} style={{ position: "relative", minHeight: H }}>
      {measuredW !== null && (
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
            <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`clip-${gid}`}><rect x={M.l} y={M.t - 4} width={W - M.l - M.r} height={H - M.t - M.b + 8} /></clipPath>
        </defs>

        {bandsShown.map((b, i) => {
          const x1 = sx(Math.max(b.start, geo.xMin));
          const x2 = sx(Math.min(b.end, geo.xMax));
          return (
            <g key={`${b.pm}-${b.start}`}>
              <rect x={x1} y={M.t} width={Math.max(0, x2 - x1)} height={H - M.t - M.b} fill={b.color} opacity={i % 2 ? 0.07 : 0.12} />
              {x2 - x1 > 36 && (
                <text x={(x1 + x2) / 2} y={M.t + 11} textAnchor="middle" fontSize="10" fontFamily={FONT_BODY} fill={b.color} opacity="0.95" fontWeight="600">{b.short}</text>
              )}
            </g>
          );
        })}

        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} stroke={COLORS.hairline} strokeWidth="1" />
            <text x={M.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{yFormat(t)}</text>
          </g>
        ))}
        {zeroInside && <line x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} stroke={COLORS.inkSoft} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />}

        {xTicks.map((t) => (
          <text key={t.x} x={sx(t.x)} y={H - 7} textAnchor="middle" fontSize="11.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{t.label}</text>
        ))}

        <g clipPath={`url(#clip-${gid})`}>
          {area && (
            <motion.path
              d={area}
              fill={`url(#fill-${gid})`}
              initial={animateIn ? { opacity: 0 } : false}
              animate={animateIn ? { opacity: inView ? 1 : 0 } : undefined}
              transition={{ duration: 0.8, delay: 0.7 }}
            />
          )}
          {shown.slice().reverse().map((l) => {
            const first = l === shown[0];
            return (
              <motion.path
                key={l.name}
                d={path(l.points)}
                fill="none"
                stroke={l.color ?? accent}
                strokeWidth={first ? 2.4 : 1.8}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={first ? 1 : 0.75}
                initial={animateIn ? { pathLength: 0 } : false}
                animate={animateIn ? { pathLength: inView ? 1 : 0 } : undefined}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
        </g>

        {hits.length === 0 && main.length > 0 && (
          <motion.circle
            cx={sx(main.at(-1).x)} cy={sy(main.at(-1).y)} r="4.5" fill={accent} stroke={COLORS.paperCard} strokeWidth="2"
            initial={animateIn ? { scale: 0, opacity: 0 } : false}
            animate={animateIn ? { scale: inView ? 1 : 0, opacity: inView ? 1 : 0 } : undefined}
            transition={{ delay: 1.3, type: "spring", stiffness: 300, damping: 14 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        )}
        {hits.length > 0 && (
          <g pointerEvents="none">
            <line x1={guideX} x2={guideX} y1={M.t} y2={H - M.b} stroke={COLORS.inkSoft} strokeWidth="1" opacity="0.6" />
            {hits.map(({ l, p }) => <circle key={l.name} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill={l.color ?? accent} stroke={COLORS.paperCard} strokeWidth="2" />)}
          </g>
        )}
      </svg>
      )}

      {hits.length > 0 && (
        <div
          style={{
            position: "absolute", top: 0, left: `${tipLeft}%`, transform: "translate(-50%, -6px)", pointerEvents: "none",
            background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: "6px 10px", whiteSpace: "nowrap",
            fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.25)", zIndex: 3,
          }}
        >
          <div style={{ color: COLORS.inkSoft, fontSize: 11.5 }}>{hits[0].p.label}</div>
          {hits.map(({ l, p }) => (
            <div key={l.name} style={{ fontWeight: 700 }}>
              {shown.length > 1 && <span style={{ color: l.color ?? accent }}>{l.name}: </span>}
              {l.format ? l.format(p.y) : yFormat(p.y)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
