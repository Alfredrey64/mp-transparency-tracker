/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// Money from a funder nobody names, through a think tank with no duty to say, to an "independent expert" on air. Only the right-hand end is ever seen.
export function Masked() {
  const still = useReducedMotion();
  return (
    <svg viewBox="0 0 900 290" role="img" aria-label="An undisclosed funder pays a think tank, whose staff appear on air as independent experts; the audience sees only the expert">
      <defs>
        <pattern id="tt-h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F7E7E7" /><rect width="3" height="9" fill="#E6BDBD" /></pattern>
        <filter id="tt-blur"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <rect x="0" y="40" width="590" height="200" rx="26" fill="#F4F6FA" stroke="#C9D3E6" strokeWidth="2" strokeDasharray="8 6" />
      <text x="20" y="30" fontSize="14" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Hidden by law</text>
      <text x="720" y="30" textAnchor="middle" fontSize="14" fontWeight="800" fill="#3F5F85" fontFamily={F}>What you see</text>
      <g transform="translate(30 90)"><rect width="190" height="100" rx="22" fill="url(#tt-h)" stroke="#9C3B3B" strokeWidth="3.500" strokeDasharray="10 6" /><text x="95" y="48" textAnchor="middle" fontSize="38" fontWeight="800" fill="#9C3B3B" fontFamily={S}>?</text><text x="95" y="80" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Undisclosed funder</text></g>
      <path d="M 220 140 H 300" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
      <g transform="translate(300 90)"><rect width="190" height="100" rx="22" fill="#fff" stroke="#9C6B30" strokeWidth="3.500" /><rect x="62" y="22" width="66" height="30" rx="4" fill="#9C6B30" opacity="0.9" /><path d="M 55 52 H 135 L 128 70 H 62z" fill="#9C6B30" /><text x="95" y="90" textAnchor="middle" fontSize="14" fontWeight="800" fill={INK} fontFamily={F}>The think tank</text></g>
      <path d="M 490 140 H 640" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" markerEnd="url(#tt-a)" />
      <g transform="translate(640 70)"><rect width="160" height="140" rx="26" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" /><circle cx="80" cy="52" r="20" fill="#5A7FA6" /><path d="M 44 118 q 36 -50 72 0z" fill="#5A7FA6" /><rect x="22" y="104" width="116" height="22" rx="6" fill="#1B2438" /><text x="80" y="120" textAnchor="middle" fontSize="11.500" fontWeight="800" fill="#fff" fontFamily={F}>INDEPENDENT EXPERT</text></g>
      {!still && (
        <>
          <g opacity="0"><circle r="10" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>£</text><animateMotion dur="6s" repeatCount="indefinite" path="M 220 140 H 300 L 490 140 H 640" /><animate attributeName="opacity" values="0;1;1;0.9;0" keyTimes="0;0.08;0.55;0.8;1" dur="6s" repeatCount="indefinite" /></g>
          <g opacity="0"><circle r="10" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>£</text><animateMotion dur="6s" begin="-3s" repeatCount="indefinite" path="M 220 140 H 300 L 490 140 H 640" /><animate attributeName="opacity" values="0;1;1;0.9;0" keyTimes="0;0.08;0.55;0.8;1" dur="6s" begin="-3s" repeatCount="indefinite" /></g>
        </>
      )}
      <text x="450" y="274" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>The audience only ever sees the circle on the right.</text>
    </svg>
  );
}

const GRADES = [["A", "#3F7D5C", "Open"], ["B", "#4C7A6B", ""], ["C", "#9C6B30", ""], ["D", "#B5533C", ""], ["E", "#9C3B3B", "Undisclosed"]];

// The A to E scale as a ladder, with each think tank placed on its rung.
export function Ladder({ tanks }) {
  return (
    <svg viewBox="0 0 900 420" role="img" aria-label="Think tanks placed on the A to E transparency scale">
      {GRADES.map(([g, c, label], i) => {
        const y = 20 + i * 76;
        const here = tanks.filter((t) => t.grade === g);
        return (
          <g key={g} style={{ animation: `stGrow 0.8s var(--ease-out) ${0.1 + i * 0.12}s backwards`, transformOrigin: "0 0", transformBox: "view-box" }}>
            <rect x="0" y={y} width="880" height="64" rx="18" fill={c} opacity="0.1" />
            <rect x="0" y={y} width="64" height="64" rx="18" fill={c} />
            <text x="32" y={y + 42} textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" fontFamily={S}>{g}</text>
            {label && <text x="80" y={y + 24} fontSize="12" fontWeight="800" fill={c} fontFamily={F}>{label.toUpperCase()}</text>}
            {here.map((t, n) => (
              <g key={t.name} transform={`translate(${80 + n * 205} ${y + (label ? 30 : 16)})`}>
                <rect width="196" height="28" rx="14" fill="#fff" stroke={c} strokeWidth="2.500" />
                <foreignObject x="8" y="0" width="182" height="28"><div xmlns="http://www.w3.org/1999/xhtml" style={{ font: "700 11.5px/28px Public Sans, system-ui, sans-serif", color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{t.short ?? t.name}</div></foreignObject>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
