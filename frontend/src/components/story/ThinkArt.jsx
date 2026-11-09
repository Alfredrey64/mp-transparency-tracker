/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// Money from a funder nobody names, through a think tank with no duty to say, to an "independent expert" on air. Only the last of the three is ever seen.
export function Masked() {
  return <><MaskedWide /><MaskedTall /></>;
}

function MaskedWide() {
  const still = useReducedMotion();
  return (
    <svg className="st-trail-wide" viewBox="0 0 900 330" role="img" aria-label="An undisclosed funder pays a think tank, whose staff appear on air as independent experts; the audience sees only the expert">
      <defs>
        <pattern id="tt-h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F7E7E7" /><rect width="3" height="9" fill="#E6BDBD" /></pattern>
        <marker id="tt-a" markerWidth="14" markerHeight="14" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 6 6"><path d="M0 0 6 3 0 6z" fill="#5A7FA6" /></marker>
      </defs>
      <rect x="10" y="14" width="590" height="262" rx="26" fill="#F4F6FA" stroke="#C9D3E6" strokeWidth="2" strokeDasharray="8 6" />
      <rect x="650" y="14" width="240" height="262" rx="26" fill="#EEF4FB" stroke="#C9DAEE" strokeWidth="2" />
      <text x="305" y="50" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Hidden by law</text>
      <text x="770" y="50" textAnchor="middle" fontSize="16" fontWeight="800" fill="#3F5F85" fontFamily={F}>What you see</text>
      <path d="M 240 170 H 360" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
      <path d="M 560 170 H 664" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" markerEnd="url(#tt-a)" />
      {!still && (
        <>
          <g opacity="0"><circle r="10" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>£</text><animateMotion dur="6s" repeatCount="indefinite" path="M 240 170 H 666" /><animate attributeName="opacity" values="0;1;1;0.9;0" keyTimes="0;0.08;0.55;0.8;1" dur="6s" repeatCount="indefinite" /></g>
          <g opacity="0"><circle r="10" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>£</text><animateMotion dur="6s" begin="-3s" repeatCount="indefinite" path="M 240 170 H 666" /><animate attributeName="opacity" values="0;1;1;0.9;0" keyTimes="0;0.08;0.55;0.8;1" dur="6s" begin="-3s" repeatCount="indefinite" /></g>
        </>
      )}
      <g transform="translate(40 105)"><rect width="200" height="130" rx="24" fill="url(#tt-h)" stroke="#9C3B3B" strokeWidth="3.500" strokeDasharray="10 6" /><text x="100" y="62" textAnchor="middle" fontSize="46" fontWeight="800" fill="#9C3B3B" fontFamily={S}>?</text><text x="100" y="100" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Undisclosed funder</text></g>
      <g transform="translate(360 105)"><rect width="200" height="130" rx="24" fill="#fff" stroke="#9C6B30" strokeWidth="3.500" /><path d="M 68 44 L 100 24 L 132 44 Z" fill="#9C6B30" /><rect x="76" y="48" width="9" height="22" fill="#9C6B30" /><rect x="95.500" y="48" width="9" height="22" fill="#9C6B30" /><rect x="115" y="48" width="9" height="22" fill="#9C6B30" /><rect x="66" y="73" width="68" height="6" rx="2" fill="#9C6B30" /><text x="100" y="104" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} fontFamily={F}>The think tank</text></g>
      <g transform="translate(670 105)"><rect width="200" height="130" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" /><circle cx="100" cy="32" r="17" fill="#5A7FA6" /><path d="M 72 80 q 28 -38 56 0z" fill="#5A7FA6" /><rect x="18" y="92" width="164" height="26" rx="8" fill="#1B2438" /><text x="100" y="110" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily={F}>Independent expert</text></g>
      <text x="450" y="312" textAnchor="middle" fontSize="15" fontWeight="700" fill={SOFT} fontFamily={F}>The audience only ever sees the circle on the right.</text>
    </svg>
  );
}

// The same three steps stacked, for a narrow screen.
function MaskedTall() {
  const still = useReducedMotion();
  return (
    <svg className="st-trail-tall" viewBox="0 0 360 680" aria-hidden="true">
      <defs>
        <pattern id="tt-ht" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F7E7E7" /><rect width="3" height="9" fill="#E6BDBD" /></pattern>
        <marker id="tt-at" markerWidth="14" markerHeight="14" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 6 6"><path d="M0 0 6 3 0 6z" fill="#5A7FA6" /></marker>
      </defs>
      <rect x="8" y="2" width="344" height="372" rx="24" fill="#F4F6FA" stroke="#C9D3E6" strokeWidth="2" strokeDasharray="8 6" />
      <rect x="8" y="420" width="344" height="196" rx="24" fill="#EEF4FB" stroke="#C9DAEE" strokeWidth="2" />
      <text x="180" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Hidden by law</text>
      <text x="180" y="452" textAnchor="middle" fontSize="16" fontWeight="800" fill="#3F5F85" fontFamily={F}>What you see</text>
      <path d="M 180 188 V 222" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
      <path d="M 180 360 V 410" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" markerEnd="url(#tt-at)" />
      {!still && (
        <>
          <g opacity="0"><circle r="10" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>£</text><animateMotion dur="6s" repeatCount="indefinite" path="M 180 120 V 410" /><animate attributeName="opacity" values="0;1;1;0.9;0" keyTimes="0;0.08;0.55;0.8;1" dur="6s" repeatCount="indefinite" /></g>
          <g opacity="0"><circle r="10" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>£</text><animateMotion dur="6s" begin="-3s" repeatCount="indefinite" path="M 180 120 V 410" /><animate attributeName="opacity" values="0;1;1;0.9;0" keyTimes="0;0.08;0.55;0.8;1" dur="6s" begin="-3s" repeatCount="indefinite" /></g>
        </>
      )}
      <g transform="translate(80 52)"><rect width="200" height="130" rx="24" fill="url(#tt-ht)" stroke="#9C3B3B" strokeWidth="3.500" strokeDasharray="10 6" /><text x="100" y="62" textAnchor="middle" fontSize="46" fontWeight="800" fill="#9C3B3B" fontFamily={S}>?</text><text x="100" y="100" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Undisclosed funder</text></g>
      <g transform="translate(80 226)"><rect width="200" height="130" rx="24" fill="#fff" stroke="#9C6B30" strokeWidth="3.500" /><path d="M 68 44 L 100 24 L 132 44 Z" fill="#9C6B30" /><rect x="76" y="48" width="9" height="22" fill="#9C6B30" /><rect x="95.500" y="48" width="9" height="22" fill="#9C6B30" /><rect x="115" y="48" width="9" height="22" fill="#9C6B30" /><rect x="66" y="73" width="68" height="6" rx="2" fill="#9C6B30" /><text x="100" y="104" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} fontFamily={F}>The think tank</text></g>
      <g transform="translate(80 470)"><rect width="200" height="130" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" /><circle cx="100" cy="32" r="17" fill="#5A7FA6" /><path d="M 72 80 q 28 -38 56 0z" fill="#5A7FA6" /><rect x="18" y="92" width="164" height="26" rx="8" fill="#1B2438" /><text x="100" y="110" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily={F}>Independent expert</text></g>
      <text x="180" y="654" textAnchor="middle" fontSize="14.500" fontWeight="700" fill={SOFT} fontFamily={F}>The audience only ever sees the box at the bottom.</text>
    </svg>
  );
}

const GRADES = [["A", "#3F7D5C", "Open"], ["B", "#4C7A6B", ""], ["C", "#9C6B30", ""], ["D", "#B5533C", ""], ["E", "#9C3B3B", "Undisclosed"]];

// The A to E scale as a ladder, with each think tank placed on its rung. Plain boxes that wrap rather than a drawing, so it fits any width.
export function Ladder({ tanks }) {
  return (
    <ol className="tt-ladder" aria-label="Think tanks placed on the A to E transparency scale">
      {GRADES.map(([g, c, label], i) => {
        const here = tanks.filter((t) => t.grade === g);
        return (
          <li key={g} className="tt-rung" style={{ "--tc": c, "--i": i }}>
            <span className="tt-grade" aria-hidden="true">{g}</span>
            <div className="tt-rung-body">
              <span className="sr-only">Grade {g}{label ? `, ${label}` : ""}</span>
              {label && <span className="tt-rung-label" aria-hidden="true">{label}</span>}
              {here.length > 0 ? (
                <ul className="tt-chips">{here.map((t) => <li key={t.name}>{t.short ?? t.name}</li>)}</ul>
              ) : <span className="tt-none">None in this sample</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
