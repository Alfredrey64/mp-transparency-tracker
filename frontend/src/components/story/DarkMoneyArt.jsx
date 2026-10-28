/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";

// The pictures for the dark money page. Each is drawn in SVG and moves by animation written into the picture, so it needs no script and stands
// still for anyone who has asked for less motion.

const INK = "#1B2438";
const SOFT = "#5B6784";

const Person = ({ x, y, colour, letter }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-70" y="-24" width="140" height="48" rx="24" fill="#fff" stroke={colour} strokeWidth="3" />
    <circle cx="-44" cy="0" r="16" fill={colour} />
    <text x="-44" y="5.500" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">{letter}</text>
    <text x="-20" y="5" fontSize="14" fontWeight="700" fill={INK} fontFamily="Public Sans, system-ui, sans-serif">Donor {letter}</text>
  </g>
);

// Money starts with named people, passes through an association that need not name them, and reaches the party under the association's name alone.
export function MoneyTrail() {
  const still = useReducedMotion();
  const donors = [{ y: 62, c: "#2A6FDB", l: "A" }, { y: 150, c: "#1FA97C", l: "B" }, { y: 238, c: "#E8741A", l: "C" }];
  const into = (y) => `M 200 ${y} C 300 ${y}, 330 150, 400 150`;
  const out = "M 540 150 L 718 150";
  const dur = "7s";
  return (
    <svg viewBox="0 0 900 300" role="img" aria-label="Money from named donors goes into an unincorporated association, which gives to a party under its own name only">
      <defs>
        <marker id="dm-arrow" markerWidth="14" markerHeight="14" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 6 6"><path d="M0 0 6 3 0 6z" fill={SOFT} /></marker>
        <pattern id="dm-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#FBEAEA" /><rect width="3" height="8" fill="#E9B6B6" /></pattern>
      </defs>
      <text x="40" y="22" fontSize="15" fontWeight="800" fill="#2A6FDB" fontFamily="Public Sans, system-ui, sans-serif">1. Named people give</text>
      <text x="408" y="82" fontSize="15" fontWeight="800" fill="#9C3B3B" fontFamily="Public Sans, system-ui, sans-serif">2. Nobody has to name them</text>
      <text x="700" y="22" fontSize="15" fontWeight="800" fill="#3F7D5C" fontFamily="Public Sans, system-ui, sans-serif">3. The party's register</text>
      {donors.map((d) => <path key={d.l} d={into(d.y)} fill="none" stroke="#C9D3E6" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />)}
      <path d={out} fill="none" stroke="#C9D3E6" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" markerEnd="url(#dm-arrow)" />
      {donors.map((d) => <Person key={d.l} x={110} y={d.y} colour={d.c} letter={d.l} />)}
      <g transform="translate(470 150)">
        <rect x="-70" y="-62" width="140" height="124" rx="26" fill="url(#dm-hatch)" stroke="#9C3B3B" strokeWidth="3.500" strokeDasharray="10 6" />
        <text y="-8" textAnchor="middle" fontSize="44" fontWeight="800" fill="#9C3B3B" fontFamily="Newsreader, Georgia, serif">?</text>
        <text y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily="Public Sans, system-ui, sans-serif">Unincorporated</text>
        <text y="38" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily="Public Sans, system-ui, sans-serif">association</text>
      </g>
      <g transform="translate(800 150)">
        <rect x="-76" y="-62" width="152" height="124" rx="22" fill="#fff" stroke="#3F7D5C" strokeWidth="3.500" />
        <text y="-30" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} fontFamily="Public Sans, system-ui, sans-serif">The party</text>
        <rect x="-62" y="-12" width="124" height="60" rx="10" fill="#E7F3EC" />
        <text y="10" textAnchor="middle" fontSize="12.500" fontWeight="700" fill="#2B5E43" fontFamily="Public Sans, system-ui, sans-serif">Donor:</text>
        <text y="30" textAnchor="middle" fontSize="13.500" fontWeight="800" fill="#2B5E43" fontFamily="Public Sans, system-ui, sans-serif">the association</text>
      </g>
      {!still && donors.map((d, n) => (
        <g key={`c${d.l}`} opacity="0">
          <circle r="13" fill={d.c} stroke="#fff" strokeWidth="3" /><text y="4.500" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">£</text>
          <animateMotion dur={dur} begin={`${n * 0.35}s`} repeatCount="indefinite" path={into(d.y)} keyPoints="0;1;1" keyTimes="0;0.38;1" calcMode="linear" />
          <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.04;0.34;0.42;1" dur={dur} begin={`${n * 0.35}s`} repeatCount="indefinite" />
        </g>
      ))}
      {!still && (
        <g opacity="0">
          <circle r="16" fill="#9AA6B8" stroke="#fff" strokeWidth="3" /><text y="5" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">£</text>
          <animateMotion dur={dur} repeatCount="indefinite" path={out} keyPoints="0;0;1;1" keyTimes="0;0.5;0.86;1" calcMode="linear" />
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.5;0.54;0.84;0.9;1" dur={dur} repeatCount="indefinite" />
        </g>
      )}
      {still && <g><circle cx="300" cy="106" r="13" fill="#2A6FDB" /><circle cx="300" cy="150" r="13" fill="#1FA97C" /><circle cx="640" cy="150" r="16" fill="#9AA6B8" /></g>}
      <path d="M 50 272 H 380" stroke="#2A6FDB" strokeWidth="3" strokeLinecap="round" /><text x="50" y="292" fontSize="13" fill="#2A6FDB" fontWeight="700" fontFamily="Public Sans, system-ui, sans-serif">The association may know who they are</text>
      <path d="M 560 272 H 880" stroke="#3F7D5C" strokeWidth="3" strokeLinecap="round" /><text x="560" y="292" fontSize="13" fill="#3F7D5C" fontWeight="700" fontFamily="Public Sans, system-ui, sans-serif">The public sees only the association</text>
    </svg>
  );
}

// The three amounts that decide what an association must report, as steps climbing from nothing to a duty to tell the Electoral Commission.
export function Thresholds() {
  const base = 340;
  const steps = [
    { x: 30, w: 250, h: 112, c: "#9AA6B8", t: "Under £500", s: "Not even counted by the association" },
    { x: 290, w: 280, h: 176, c: "#E8741A", t: "£500 and over", s: "Counted, but not yet reported" },
    { x: 580, w: 290, h: 240, c: "#9C3B3B", t: "Over £7,500 from one source", s: "Must be reported, but only once total gifts pass £37,270 a year" },
  ];
  return (
    <svg viewBox="0 0 900 360" role="img" aria-label="Three steps: under 500 pounds is not counted, 500 pounds and over is counted, over 7,500 pounds from one source must be reported once yearly donations pass 37,270 pounds">
      <line x1="20" y1={base} x2="880" y2={base} stroke="#C9D3E6" strokeWidth="3" />
      {steps.map((s, i) => (
        <g key={s.t} style={{ animation: `stRise 0.9s var(--ease-out) ${0.15 + i * 0.25}s backwards`, transformOrigin: `${s.x + s.w / 2}px ${base}px`, transformBox: "view-box" }}>
          <rect x={s.x} y={base - s.h} width={s.w} height={s.h} rx="14" fill={s.c} opacity="0.16" />
          <rect x={s.x} y={base - s.h} width={s.w} height="8" rx="4" fill={s.c} />
          <foreignObject x={s.x + 16} y={base - s.h + 20} width={s.w - 32} height={s.h - 28}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: "grid", gap: "6px", alignContent: "start" }}>
              <div style={{ font: "800 21px/1.2 Newsreader, Georgia, serif", color: INK }}>{s.t}</div>
              <div style={{ font: "600 13.5px/1.4 Public Sans, system-ui, sans-serif", color: SOFT }}>{s.s}</div>
            </div>
          </foreignObject>
        </g>
      ))}
      <g transform="translate(540 30)">
        <rect width="330" height="36" rx="18" fill="#fff" stroke="#9C3B3B" strokeWidth="2.500" />
        <text x="165" y="23.500" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily="Public Sans, system-ui, sans-serif">Below £37,270 a year: no registration at all</text>
      </g>
    </svg>
  );
}

// How the £435,000 given to the DUP in 2016 was spent, from the Electoral Commission's findings as the page describes them.
export function SpendBar() {
  const parts = [
    { w: 282, c: "#6E4B6E", t: "£282,000", s: "four-page Metro advert" },
    { w: 100, c: "#9C6B30", t: "about £100,000", s: "campaign merchandise" },
    { w: 43, c: "#5A7FA6", t: "", s: "" },
    { w: 10, c: "#9AA6B8", t: "", s: "" },
  ];
  const total = parts.reduce((t, p) => t + p.w, 0);
  let x = 0;
  return (
    <svg viewBox="0 0 900 240" role="img" aria-label="The 435,000 pound donation: about 425,000 pounds was spent on Vote Leave campaigning in England, including 282,000 pounds on a Metro advert and about 100,000 pounds on merchandise">
      <text x="0" y="26" fontSize="20" fontWeight="800" fill={INK} fontFamily="Newsreader, Georgia, serif">£435,000 donated to the DUP in 2016</text>
      {parts.map((p, i) => { const w = (p.w / total) * 900; const el = (
        <g key={i} style={{ animation: `stGrow 1s var(--ease-out) ${0.2 + i * 0.2}s backwards`, transformOrigin: `${x}px 90px`, transformBox: "view-box" }}>
          <rect x={x + 1} y="50" width={Math.max(w - 3, 2)} height="70" rx="12" fill={p.c} />
          {p.t && <text x={x + 14} y="82" fontSize={w > 150 ? 22 : 15} fontWeight="800" fill="#fff" fontFamily="Newsreader, Georgia, serif">{p.t}</text>}
          {p.s && <text x={x + 14} y="104" fontSize="13" fontWeight="600" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">{p.s}</text>}
        </g>); x += w; return el; })}
      <path d="M 0 140 H 868" stroke="#6E4B6E" strokeWidth="3" strokeLinecap="round" /><path d="M 0 132 V 148 M 868 132 V 148" stroke="#6E4B6E" strokeWidth="3" />
      <text x="0" y="168" fontSize="16" fontWeight="800" fill="#6E4B6E" fontFamily="Public Sans, system-ui, sans-serif">Around £425,000 went on Vote Leave campaigning in England</text>
      <text x="0" y="196" fontSize="14" fontWeight="600" fill={SOFT} fontFamily="Public Sans, system-ui, sans-serif">None of it was spent in Northern Ireland, where the DUP actually stands for election.</text>
      <text x="0" y="222" fontSize="14" fontWeight="600" fill={SOFT} fontFamily="Public Sans, system-ui, sans-serif">The Electoral Commission fined the donor group £6,000 for failing to cooperate. It could not make it name its source.</text>
    </svg>
  );
}

// Northern Ireland's donor secrecy on a line of dates: lifted in 2017, never backdated, so the 2016 gift stays inside the secret window.
export function Secrecy() {
  return (
    <svg viewBox="0 0 900 250" role="img" aria-label="A timeline: January 2014 when backdating was considered and rejected, early 2016 when the DUP donation was made, and 1 July 2017 when secrecy ended">
      <defs><pattern id="sec-h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#F3E4E4" /><rect width="3" height="10" fill="#E3B5B5" /></pattern></defs>
      <rect x="20" y="104" width="620" height="38" rx="19" fill="url(#sec-h)" stroke="#9C3B3B" strokeWidth="2.500" />
      <text x="180" y="128" fontSize="14" fontWeight="800" fill="#7A2E2E" fontFamily="Public Sans, system-ui, sans-serif">Donors secret by law</text>
      <rect x="640" y="104" width="240" height="38" rx="19" fill="#E1F1E8" stroke="#3F7D5C" strokeWidth="2.500" />
      <text x="760" y="128" textAnchor="middle" fontSize="14" fontWeight="800" fill="#2B5E43" fontFamily="Public Sans, system-ui, sans-serif">Donors named</text>
      {[{ x: 120, t: "January 2014", s: "Backdating the change was considered, and not done", c: "#9C6B30" }, { x: 400, t: "Early 2016", s: "The DUP's £435,000 donation is made", c: "#9C3B3B" }, { x: 640, t: "1 July 2017", s: "Secrecy lifted, from this date on only", c: "#3F7D5C" }].map((m, i) => (
        <g key={m.t} style={{ animation: `stDrop 0.7s var(--ease-spring) ${0.3 + i * 0.3}s backwards` }}>
          <line x1={m.x} y1="76" x2={m.x} y2="104" stroke={m.c} strokeWidth="3" />
          <circle cx={m.x} cy="123" r="11" fill={m.c} stroke="#fff" strokeWidth="3.500" />
          <text x={m.x} y="58" textAnchor="middle" fontSize="17" fontWeight="800" fill={m.c} fontFamily="Public Sans, system-ui, sans-serif">{m.t}</text>
          <foreignObject x={m.x - 105} y="154" width="210" height="80"><div xmlns="http://www.w3.org/1999/xhtml" style={{ textAlign: "center", font: "600 14px/1.4 Public Sans, system-ui, sans-serif", color: SOFT }}>{m.s}</div></foreignObject>
        </g>
      ))}
    </svg>
  );
}
