/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// A revolving door that turns, with a minister going in on one side and coming out as an industry adviser on the other.
export function Door() {
  const still = useReducedMotion();
  return (
    <svg viewBox="0 0 900 320" role="img" aria-label="A revolving door between government and industry: a minister goes in, a paid adviser comes out, and nothing stops them going back">
      <rect x="20" y="30" width="270" height="250" rx="26" fill="#EFE7F2" stroke="#6E4B6E" strokeWidth="3" />
      <text x="155" y="64" textAnchor="middle" fontSize="18" fontWeight="800" fill="#6E4B6E" fontFamily={F}>Government</text>
      <rect x="610" y="30" width="270" height="250" rx="26" fill="#F7EBDC" stroke="#9C6B30" strokeWidth="3" />
      <text x="745" y="64" textAnchor="middle" fontSize="18" fontWeight="800" fill="#9C6B30" fontFamily={F}>Industry</text>
      {[{ x: 155, y: 150, c: "#6E4B6E", t: "Decides who gets contracts" }, { x: 745, y: 150, c: "#9C6B30", t: "Pays for advice" }].map((b) => (
        <g key={b.t}>
          <circle cx={b.x} cy={b.y} r="44" fill="#fff" stroke={b.c} strokeWidth="3" />
          <circle cx={b.x} cy={b.y - 12} r="13" fill={b.c} /><path d={`M ${b.x - 24} ${b.y + 30} q 24 -34 48 0z`} fill={b.c} />
          <text x={b.x} y={b.y + 76} textAnchor="middle" fontSize="14" fontWeight="700" fill={INK} fontFamily={F}>{b.t}</text>
        </g>
      ))}
      <g transform="translate(450 160)">
        <circle r="112" fill="#fff" stroke="#C9D3E6" strokeWidth="3" />
        <g>
          {[0, 120, 240].map((a) => <g key={a} transform={`rotate(${a})`}><rect x="-5" y="-104" width="10" height="104" rx="5" fill="#6E4B6E" /><rect x="-26" y="-108" width="52" height="8" rx="4" fill="#9C6B30" /></g>)}
          {!still && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" />}
        </g>
        <circle r="14" fill="#1B2438" />
      </g>
      {!still && (
        <>
          <g><circle r="9" fill="#6E4B6E" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="9s" repeatCount="indefinite" path="M 200 150 C 300 150, 340 160, 450 160 S 600 150, 700 150" /><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="9s" repeatCount="indefinite" /></g>
          <g><circle r="9" fill="#9C6B30" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="9s" begin="-4.500s" repeatCount="indefinite" path="M 700 190 C 600 190, 560 160, 450 160 S 300 190, 200 190" /><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="9s" begin="-4.500s" repeatCount="indefinite" /></g>
        </>
      )}
      <text x="450" y="308" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>Nothing stops the same person passing through, in either direction</text>
    </svg>
  );
}

// 817 applications in ACOBA's last four years, every one of them a tick: not one refused.
export function Ticks() {
  const COLS = 41;
  return (
    <svg viewBox="0 0 820 440" role="img" aria-label="817 applications, none refused">
      {Array.from({ length: 817 }, (_, n) => (
        <circle key={n} cx={10 + (n % COLS) * 20} cy={10 + Math.floor(n / COLS) * 20} r="6" fill="#3F7D5C" opacity="0.85" style={{ animation: `stDot 0.4s ease-out ${(n % COLS) * 14 + Math.floor(n / COLS) * 9}ms backwards` }} />
      ))}
      <g transform="translate(0 424)"><text x="0" y="0" fontSize="15" fontWeight="800" fill={INK} fontFamily={F}>Each dot is one application. 817 approved or cleared, 0 refused.</text></g>
    </svg>
  );
}

// ACOBA's authority ended two years after someone left office: a line of time with the cutoff marked and Cameron's lobbying falling beyond it.
export function Cutoff() {
  return (
    <svg viewBox="0 0 900 230" role="img" aria-label="A timeline: leaving office, a two-year window in which the old committee had authority, and the point after which it had none">
      <rect x="150" y="96" width="300" height="40" rx="20" fill="#E8DDF0" stroke="#6E4B6E" strokeWidth="3" />
      <text x="300" y="122" textAnchor="middle" fontSize="15" fontWeight="800" fill="#6E4B6E" fontFamily={F}>Two years: the committee's reach</text>
      <rect x="450" y="96" width="400" height="40" rx="20" fill="#F7E7E7" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" />
      <text x="650" y="122" textAnchor="middle" fontSize="15" fontWeight="800" fill="#9C3B3B" fontFamily={F}>No authority at all</text>
      {[{ x: 150, t: "Leaves office", c: "#6E4B6E" }, { x: 450, t: "Two years on", c: "#9C3B3B" }, { x: 700, t: "Lobbying for a firm: no rule broken", c: "#9C6B30" }].map((m, i) => (
        <g key={m.t} style={{ animation: `stDrop 0.7s var(--ease-spring) ${0.3 + i * 0.3}s backwards` }}>
          <line x1={m.x} y1="64" x2={m.x} y2="96" stroke={m.c} strokeWidth="3" />
          <circle cx={m.x} cy="116" r="11" fill={m.c} stroke="#fff" strokeWidth="3.500" />
          <text x={m.x} y="52" textAnchor={i === 0 ? "start" : "middle"} fontSize="15" fontWeight="800" fill={m.c} fontFamily={F}>{m.t}</text>
        </g>
      ))}
      <text x="0" y="190" fontSize="14" fontWeight="600" fill={SOFT} fontFamily={F}>The case of the former Prime Minister who lobbied for Greensill fell into the red part, so nothing was breached.</text>
    </svg>
  );
}

// One body split in two: who now handles which kind of application.
export function Replaced() {
  return (
    <svg viewBox="0 0 900 300" role="img" aria-label="ACOBA was abolished on 13 October 2025; ministers' applications go to the Independent Adviser on Ministerial Standards, civil servants and special advisers to the Civil Service Commission">
      <g transform="translate(40 110)"><rect width="230" height="80" rx="20" fill="#F3E4E4" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" /><text x="115" y="34" textAnchor="middle" fontSize="20" fontWeight="800" fill="#9C3B3B" fontFamily={S}>ACOBA</text><text x="115" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7A2E2E" fontFamily={F}>Abolished 13 October 2025</text></g>
      <path d="M 270 150 C 360 150, 380 70, 470 70" fill="none" stroke="#6E4B6E" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" /><path d="M 270 150 C 360 150, 380 230, 470 230" fill="none" stroke="#9C6B30" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
      <g transform="translate(470 24)"><rect width="390" height="92" rx="22" fill="#fff" stroke="#6E4B6E" strokeWidth="3.500" /><text x="20" y="36" fontSize="15" fontWeight="800" fill="#6E4B6E" fontFamily={F}>Former ministers</text><text x="20" y="62" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>Independent Adviser on Ministerial Standards</text><text x="20" y="82" fontSize="12.500" fontWeight="600" fill={SOFT} fontFamily={F}>61 applications in its first reporting year, 2025 to 26</text></g>
      <g transform="translate(470 184)"><rect width="390" height="92" rx="22" fill="#fff" stroke="#9C6B30" strokeWidth="3.500" /><text x="20" y="36" fontSize="15" fontWeight="800" fill="#9C6B30" fontFamily={F}>Former civil servants and special advisers</text><text x="20" y="64" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>The Civil Service Commission</text></g>
    </svg>
  );
}
