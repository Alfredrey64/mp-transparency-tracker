/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { niceTicks } from "../lib/onsFormat";
import { yearTicks } from "../lib/onsChart";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { UNITS, fmt, governmentOn, valueOn } from "../lib/taxRates";

// A step chart for tax rates: a rate holds until the day it changes, so the line moves in steps rather than slopes. Who was in government is
// shaded behind it. Touch or hover shows the rate on that day.

const DEFAULT_W = 640;
const dateLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const isoFromT = (t) => {
  const y = Math.floor(t);
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return new Date(start + (t - y) * (end - start)).toISOString().slice(0, 10);
};

export default function TaxStepChart({ lines, unit, from, to, ariaLabel, height = 250, hoverT, onHoverT, tooltip = true, leftPad = 0 }) {
  const ref = useRef(null);
  const [measuredW, setW] = useState(null);
  const [localHover, setLocalHover] = useState(null);
  // Pass hoverT and onHoverT to share one crosshair with another chart.
  const controlled = onHoverT !== undefined;
  const hover = controlled ? hoverT ?? null : localHover;
  const setHover = controlled ? onHoverT : setLocalHover;
  const W = measuredW ?? DEFAULT_W;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = (width) => { if (width > 0) setW(Math.min(960, Math.max(260, Math.round(width)))); };
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    ro.observe(el);
    const frame = requestAnimationFrame(() => fit(el.getBoundingClientRect().width));
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, []);

  const narrow = W < 420;
  const H = height;
  const xlen = unit === "gbp0" ? 7 : 5.5;
  // What each line does within the range: the value in force at the left edge, then every step.
  const seqs = useMemo(() => lines.map((l) => {
    const seq = [];
    if (l.sampled) return l.points.filter((p) => p.t >= from && p.t <= to).map((p) => ({ t: p.t, value: p.value }));
    const startVal = valueOn(l, isoFromT(from));
    if (startVal !== undefined && l.points[0].t < from) seq.push({ t: from, value: startVal });
    for (const p of l.points) if (p.t >= from && p.t <= to) seq.push({ t: p.t, value: p.value });
    return seq;
  }), [lines, from, to]);
  const geo = useMemo(() => {
    const max = Math.max(1e-9, ...seqs.flatMap((seq) => seq.filter((p) => p.value !== null).map((p) => p.value)));
    const ticks = niceTicks(0, max * 1.06, narrow ? 3 : 4);
    // The axis has to reach the highest value: add a tick if the round numbers stop short of it.
    const step = ticks.length > 1 ? ticks[1] - ticks[0] : max;
    while ((ticks.at(-1) ?? 0) < max * 1.01 && step > 0) ticks.push(Number(((ticks.at(-1) ?? 0) + step).toFixed(10)));
    const top = ticks.at(-1) ?? max;
    const longest = Math.max(...ticks.map((t) => String((UNITS[unit] ?? UNITS.pct).axis(t)).length));
    const M = { l: Math.max(narrow ? 38 : 44, leftPad, Math.ceil(14 + longest * xlen)), r: narrow ? 10 : 16, t: 18, b: 28 };
    const sx = (t) => M.l + ((t - from) / (to - from || 1)) * (W - M.l - M.r);
    const sy = (v) => M.t + (1 - v / (top || 1)) * (H - M.t - M.b);
    return { ticks, M, sx, sy };
  }, [seqs, to, from, W, H, narrow, unit, xlen, leftPad]);
  const { ticks, M, sx, sy } = geo;
  const xTicks = yearTicks(from, to).filter((t, i, all) => all.findIndex((u) => u.label === t.label) === i);
  const bands = useMemo(() => bandsBetween(from, to, to).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })), [from, to]);

  // The step path for a line, as separate pieces where the tax was not charged.
  const paths = lines.map((l, li) => {
    const pieces = [];
    let cur = null;
    const seq = seqs[li];
    // A line in today's money is drawn as a smooth line, not steps.
    if (l.sampled) {
      const d = seq.map((p, i) => `${i ? "L" : "M"}${sx(p.t).toFixed(1)} ${sy(p.value).toFixed(1)}`).join(" ");
      return { l, pieces: seq.length > 1 ? [{ d }] : [], dots: [] };
    }
    seq.forEach((p, i) => {
      const nextT = i + 1 < seq.length ? seq[i + 1].t : to;
      if (p.value === null) { cur = null; return; }
      const x1 = sx(p.t), x2 = sx(nextT), y = sy(p.value);
      if (!cur) { cur = { d: `M${x1.toFixed(1)} ${y.toFixed(1)}` }; pieces.push(cur); }
      else cur.d += ` L${x1.toFixed(1)} ${y.toFixed(1)}`;
      cur.d += ` L${x2.toFixed(1)} ${y.toFixed(1)}`;
    });
    // A dot where the rate changed, not at the very start of the record or the left edge.
    const dots = seq.filter((p, i) => p.value !== null && !(i === 0 && (p.t === from || p === seq[0] && l.points[0].t === p.t))).map((p) => ({ x: sx(p.t), y: sy(p.value) }));
    return { l, pieces, dots };
  });

  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = from + ((px - M.l) / (W - M.l - M.r)) * (to - from);
    setHover(Math.min(to, Math.max(from, t)));
  };
  const hoverIso = hover === null ? null : isoFromT(hover);
  const hits = hoverIso ? lines.map((l) => ({ l, v: l.valueAt ? l.valueAt(hoverIso) : valueOn(l, hoverIso) })).filter((h) => h.v !== undefined) : [];
  const gov = hoverIso ? governmentOn(hoverIso) : null;
  const tipLeft = hover === null ? 0 : Math.min(84, Math.max(16, (sx(hover) / W) * 100));

  return (
    <div ref={ref} style={{ position: "relative", minHeight: H }}>
      {measuredW !== null && (
        <svg
          viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel}
          style={{ display: "block", touchAction: "pan-y", overflow: "visible" }}
          onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setHover(null)}
        >
          <defs><clipPath id={`tsc-${lines[0]?.key ?? "x"}`}><rect x={M.l} y={M.t - 4} width={W - M.l - M.r} height={H - M.t - M.b + 8} /></clipPath></defs>
          {bands.map((b, i) => {
            const x1 = sx(Math.max(b.start, from));
            const x2 = sx(Math.min(b.end, to));
            return (
              <g key={`${b.pm}-${b.start}`}>
                <rect x={x1} y={M.t} width={Math.max(0, x2 - x1)} height={H - M.t - M.b} fill={b.color} opacity={i % 2 ? 0.07 : 0.12} />
                {x2 - x1 > 38 && <text x={(x1 + x2) / 2} y={M.t + 11} textAnchor="middle" fontSize="10" fontFamily={FONT_BODY} fill={b.color} fontWeight="600">{b.short}</text>}
              </g>
            );
          })}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} stroke={COLORS.hairline} strokeWidth="1" />
              <text x={M.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{(UNITS[unit] ?? UNITS.pct).axis(t)}</text>
            </g>
          ))}
          {xTicks.map((t, i) => <text key={`${t.x}-${i}`} x={sx(t.x)} y={H - 7} textAnchor="middle" fontSize="11.5" fontFamily={FONT_BODY} fill={COLORS.inkSoft}>{t.label}</text>)}
          <g clipPath={`url(#tsc-${lines[0]?.key ?? "x"})`}>
            {paths.map(({ l, pieces, dots }) => (
              <g key={l.key}>
                {pieces.map((pc, i) => <path key={i} d={pc.d} fill="none" stroke={l.colour} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />)}
                {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3" fill={l.colour} stroke={COLORS.paperCard} strokeWidth="1.5" />)}
              </g>
            ))}
          </g>
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={sx(hover)} x2={sx(hover)} y1={M.t} y2={H - M.b} stroke={COLORS.inkSoft} strokeWidth="1" opacity="0.6" />
              {hits.filter((h) => h.v !== null).map(({ l, v }) => <circle key={l.key} cx={sx(hover)} cy={sy(v)} r="4.5" fill={l.colour} stroke={COLORS.paperCard} strokeWidth="2" />)}
            </g>
          )}
        </svg>
      )}
      {tooltip && hover !== null && hits.length > 0 && (
        <div
          style={{ position: "absolute", top: 0, left: `${tipLeft}%`, transform: "translate(-50%, -6px)", pointerEvents: "none", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: "6px 10px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.25)", zIndex: 3, width: "max-content", maxWidth: "min(300px, 90%)" }}
        >
          <div style={{ color: COLORS.inkSoft, fontSize: 11.5 }}>{dateLabel(hoverIso)}{gov ? `, ${gov.pm.split(" and ")[0]}` : ""}</div>
          {hits.map(({ l, v }) => (
            <div key={l.key} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: l.colour, flexShrink: 0, alignSelf: "center" }} />
              <span style={{ fontWeight: 700 }}>{fmt(unit, v)}</span>
              {lines.length > 1 && <span style={{ color: COLORS.inkSoft, fontSize: 11.5 }}>{l.label}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

