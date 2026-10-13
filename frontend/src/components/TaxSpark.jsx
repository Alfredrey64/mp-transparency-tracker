import { useId } from "react";

// A tiny step chart of one rate over its whole record, for the tax cards. Decorative: the card's text carries the figures.

const W = 120;
const H = 34;

export default function TaxSpark({ line, colour, nowT }) {
  const id = useId().replace(/:/g, "");
  const pts = line.points.filter((p) => p.t <= nowT);
  if (!pts.length) return null;
  const from = pts[0].t;
  const max = Math.max(...pts.map((p) => p.value ?? 0), 1e-9);
  const sx = (t) => 2 + ((t - from) / (nowT - from || 1)) * (W - 4);
  const sy = (v) => H - 3 - (v / max) * (H - 7);
  let d = "";
  pts.forEach((p, i) => {
    const y = sy(p.value ?? 0).toFixed(1);
    const x2 = sx(i + 1 < pts.length ? pts[i + 1].t : nowT).toFixed(1);
    d += `${i ? "L" : "M"}${sx(p.t).toFixed(1)} ${y} L${x2} ${y} `;
  });
  const area = `${d}L${sx(nowT).toFixed(1)} ${H} L${sx(from).toFixed(1)} ${H} Z`;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block", marginTop: 8 }}>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colour} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path d={d} fill="none" stroke={colour} strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
