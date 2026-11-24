/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { lowData } from "../../lib/lowData";
import { usePhone } from "../../lib/usePhone";
import "../../lawart.css";

// The picture at the top of "How a law is made": a bill goes to and fro between the Commons (green, like its benches) and the Lords (red, like theirs) until both agree, then it lands on the gold seal
// of Royal Assent. It plays once when it scrolls into view and ends on the stamped seal; with calmer motion it is simply shown finished. The labels are fixed words, no figures.

const COMMONS = "#2F7D52";
const LORDS = "#A8323E";
const GOLD = "#B8862B";

// Where the bill rests and the peaks of each hop, for the wide picture and for the tall one on phones.
const WIDE = { w: 760, h: 214, a: [100, 36], b: [440, 36], s: [664, 126], hop: -30, box: { c: [0, 72, 200, 130], l: [340, 72, 200, 130] }, seal: [664, 140, 62] };
const TALL = { w: 340, h: 372, a: [296, 42], b: [296, 170], s: [150, 312], hop: 34, box: { c: [0, 0, 252, 84], l: [0, 128, 252, 84] }, seal: [150, 312, 52] };

function Bill({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-15 -19h22l10 10v28h-32z" fill="#fff" stroke="#1B2A44" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 -19v10h10" fill="#E8EDF6" stroke="#1B2A44" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M-9 -2h18M-9 5h18M-9 12h11" stroke="#1B2A44" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

export default function LawArt() {
  const [ref, go] = useGo(0.25);
  const phone = usePhone();
  const still = useReducedMotion() || lowData();
  const g = phone ? TALL : WIDE;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const peak = (p, q) => { const m = mid(p, q); return phone ? [m[0] + g.hop, m[1]] : [m[0], m[1] + g.hop]; };
  // The bill's stops, as percentages of the whole 7-second play, with the position it holds at each.
  const stops = [
    [0, g.a], [9, g.a], [19, peak(g.a, g.b)], [28, g.b], [36, g.b], [46, peak(g.b, g.a)], [55, g.a], [63, g.a], [72, peak(g.a, g.b)], [81, g.b], [87, g.b], [94, peak(g.b, g.s)], [100, g.s],
  ];
  const frames = stops.map(([p, [x, y]]) => `${p}% { transform: translate(${x}px, ${y}px); opacity: ${p >= 100 ? 0 : 1}; }`).join(" ");
  const [cx, cy, cw, ch] = g.box.c;
  const [lx, ly, lw, lh] = g.box.l;
  const [sx, sy, sr] = g.seal;
  return (
    <figure ref={ref} className="lwa" data-go={go} data-still={still ? "1" : "0"} data-tall={phone ? "1" : "0"} style={{ "--end": `translate(${g.s[0]}px, ${g.s[1]}px)` }}>
      <svg viewBox={`0 0 ${g.w} ${g.h}`} role="img" aria-label="A bill passes from the House of Commons to the House of Lords and back until both agree its wording, then receives Royal Assent.">
        <style>{`.lwa[data-go="1"] .lwa-bill { animation: lwaFly 7s linear 0.5s both; } @keyframes lwaFly { ${frames} }`}</style>
        <g className="lwa-box lwa-c">
          <rect className="lwa-glow" x={cx - 5} y={cy - 5} width={cw + 10} height={ch + 10} rx="22" fill="none" stroke={COMMONS} strokeWidth="3" />
          <rect x={cx} y={cy} width={cw} height={ch} rx="18" fill={COMMONS} />
          <text x={cx + cw / 2} y={cy + ch / 2 - 4} textAnchor="middle" className="lwa-t1">House of Commons</text>
          <text x={cx + cw / 2} y={cy + ch / 2 + 20} textAnchor="middle" className="lwa-t2">elected MPs</text>
        </g>
        <g className="lwa-box lwa-l">
          <rect className="lwa-glow" x={lx - 5} y={ly - 5} width={lw + 10} height={lh + 10} rx="22" fill="none" stroke={LORDS} strokeWidth="3" />
          <rect x={lx} y={ly} width={lw} height={lh} rx="18" fill={LORDS} />
          <text x={lx + lw / 2} y={ly + lh / 2 - 4} textAnchor="middle" className="lwa-t1">House of Lords</text>
          <text x={lx + lw / 2} y={ly + lh / 2 + 20} textAnchor="middle" className="lwa-t2">appointed peers</text>
        </g>
        <g className="lwa-seal">
          <circle className="lwa-ring" cx={sx} cy={sy} r={sr + 12} fill="none" stroke={GOLD} strokeWidth="2.5" strokeDasharray="3 7" />
          <circle cx={sx} cy={sy} r={sr} fill={GOLD} />
          <circle cx={sx} cy={sy} r={sr - 9} fill="none" stroke="#FFF6DC" strokeWidth="2" />
          <text x={sx} y={sy - 3} textAnchor="middle" className="lwa-t3">Royal</text>
          <text x={sx} y={sy + 19} textAnchor="middle" className="lwa-t3">Assent</text>
        </g>
        <path className="lwa-track" d={phone ? `M${g.a[0]} ${g.a[1] + 26} V${g.b[1] - 26} M${g.b[0]} ${g.b[1] + 26} V${g.s[1] - 20} H${g.s[0] + sr}` : `M${g.a[0] + 30} ${g.a[1]} H${g.b[0] - 30} M${g.b[0] + 30} ${g.b[1]} H${g.s[0] - sr - 14}`} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
        <g className="lwa-bill" style={{ transform: `translate(${g.a[0]}px, ${g.a[1]}px)` }}>
          <Bill x={0} y={0} />
        </g>
      </svg>
      <figcaption>The bill goes back and forth until both Houses agree the exact wording. Then the King gives Royal Assent and it becomes an Act.</figcaption>
    </figure>
  );
}
