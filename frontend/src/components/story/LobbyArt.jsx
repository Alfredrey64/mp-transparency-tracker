/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// Who is counted: a company paying a consultant to lobby a minister has to be declared; a company's own staff lobbying the same minister does not.
export function TwoRoutes({ firms }) {
  const still = useReducedMotion();
  return (
    <svg viewBox="0 0 900 360" role="img" aria-label="Two routes to a minister: through a paid consultancy, which is registered and visible, and through the company's own staff, which is not registered at all">
      <g transform="translate(30 40)">
        <rect width="190" height="100" rx="22" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="95" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>A company</text>
        <text x="95" y="66" textAnchor="middle" fontSize="12.500" fontWeight="600" fill={SOFT} fontFamily={F}>wants a decision changed</text>
      </g>
      <path d="M 220 70 C 300 70, 320 70, 400 70" fill="none" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
      <g transform="translate(400 24)"><rect width="200" height="92" rx="22" fill="#E8F0FA" stroke="#5A7FA6" strokeWidth="3.500" /><text x="100" y="40" textAnchor="middle" fontSize="16" fontWeight="800" fill={INK} fontFamily={S}>A consultancy</text><text x="100" y="62" textAnchor="middle" fontSize="12.500" fontWeight="700" fill="#3F5F85" fontFamily={F}>paid to lobby for them</text></g>
      <path d="M 600 70 C 680 70, 700 90, 730 110" fill="none" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
      <g transform="translate(700 110)"><rect width="170" height="110" rx="22" fill="#fff" stroke="#1B2438" strokeWidth="3.500" /><circle cx="85" cy="40" r="15" fill="#1B2438" /><path d="M 55 90 q 30 -40 60 0z" fill="#1B2438" /><text x="85" y="104" textAnchor="middle" fontSize="12.500" fontWeight="800" fill={INK} fontFamily={F}>A minister</text></g>
      <g transform="translate(400 150)"><rect width="200" height="26" rx="13" fill="#E1F1E8" stroke="#3F7D5C" strokeWidth="2.500" /><text x="100" y="18" textAnchor="middle" fontSize="13" fontWeight="800" fill="#2B5E43" fontFamily={F}>On the public register</text></g>
      <g transform="translate(30 220)">
        <rect width="190" height="100" rx="22" fill="#fff" stroke="#9C3B3B" strokeWidth="3.500" />
        <text x="95" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>The same company</text>
        <text x="95" y="66" textAnchor="middle" fontSize="12.500" fontWeight="600" fill={SOFT} fontFamily={F}>its own staff</text>
      </g>
      <path d="M 220 270 C 400 270, 560 250, 700 190" fill="none" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" opacity="0.55" />
      <g transform="translate(330 262)"><rect width="230" height="26" rx="13" fill="#F7E7E7" stroke="#9C3B3B" strokeWidth="2.500" strokeDasharray="6 4" /><text x="115" y="18" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Not on any register</text></g>
      <text x="450" y="346" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>{firms} consultancies are registered. In-house lobbying is not counted at all.</text>
      {!still && (
        <>
          <g opacity="0"><circle r="9" fill="#5A7FA6" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="5s" repeatCount="indefinite" path="M 220 70 C 300 70, 320 70, 400 70 L 600 70 C 680 70, 700 90, 730 110" /><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="5s" repeatCount="indefinite" /></g>
          <g opacity="0"><circle r="9" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="5s" begin="-2.500s" repeatCount="indefinite" path="M 220 270 C 400 270, 560 250, 700 190" /><animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.1;0.9;1" dur="5s" begin="-2.500s" repeatCount="indefinite" /></g>
        </>
      )}
    </svg>
  );
}

// The part you can see against the part you can't: a small lit tip and a much larger hatched mass, whose size is a picture of "bigger and unmeasured", not a figure.
export function Iceberg({ firms }) {
  return (
    <svg viewBox="0 0 900 340" role="img" aria-label="A small visible tip, the registered consultant lobbyists, above a much larger hidden mass of unmeasured in-house lobbying">
      <defs><pattern id="ice-h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F3E4E4" /><rect width="3" height="9" fill="#E6BDBD" /></pattern></defs>
      <rect x="0" y="108" width="900" height="232" fill="#EAF2FB" />
      <line x1="0" y1="108" x2="900" y2="108" stroke="#7FA6CF" strokeWidth="3" strokeDasharray="10 8" />
      <text x="880" y="98" textAnchor="end" fontSize="13" fontWeight="800" fill="#3F5F85" fontFamily={F}>What the public can see</text>
      <text x="880" y="132" textAnchor="end" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily={F}>What it cannot</text>
      <path d="M 330 108 L 400 34 L 470 108 Z" fill="#5A7FA6" style={{ animation: "stRise 0.9s var(--ease-out) 0.2s backwards", transformOrigin: "400px 108px", transformBox: "view-box" }} />
      <path d="M 330 108 L 470 108 L 640 196 L 560 300 L 250 310 L 170 200 Z" fill="url(#ice-h)" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" style={{ animation: "stGrow 1.1s var(--ease-out) 0.5s backwards", transformOrigin: "400px 108px", transformBox: "view-box" }} />
      <text x="400" y="86" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily={F}>{""}</text>
      <text x="400" y="168" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={F}>In-house lobbying</text>
      <text x="400" y="190" textAnchor="middle" fontSize="13" fontWeight="600" fill="#7A2E2E" fontFamily={F}>Bigger, and unmeasured:</text>
      <text x="400" y="208" textAnchor="middle" fontSize="13" fontWeight="600" fill="#7A2E2E" fontFamily={F}>no register covers it</text>
      <g transform="translate(40 40)"><rect width="240" height="48" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3" /><text x="120" y="30" textAnchor="middle" fontSize="15" fontWeight="800" fill="#3F5F85" fontFamily={F}>{firms} registered consultancies</text></g>
      <path d="M 280 64 L 372 70" stroke="#5A7FA6" strokeWidth="3" strokeLinecap="round" />
      <text x="450" y="330" textAnchor="middle" fontSize="12" fontWeight="600" fill={SOFT} fontFamily={F}>The size of the hidden part is only a picture of "bigger and unknown", not a real figure.</text>
    </svg>
  );
}
