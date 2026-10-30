/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// Who is counted: a company paying a consultant to lobby a minister has to be declared; a company's own staff lobbying the same minister does not.
// Drawn along the page on a wide screen, and upright on a phone with the two routes side by side running down to one minister.
export function TwoRoutes({ firms }) {
  return <><TwoRoutesWide firms={firms} /><TwoRoutesTall firms={firms} /></>;
}

function TwoRoutesTall({ firms }) {
  const still = useReducedMotion();
  const left = "M 95 100 L 95 278 C 95 308, 150 304, 150 332";
  const right = "M 265 100 L 265 278 C 265 308, 210 304, 210 332";
  return (
    <svg className="st-trail-tall" viewBox="0 0 360 520" aria-hidden="true">
      <defs>
        <marker id="lr-arrow-t" markerWidth="14" markerHeight="14" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 6 6"><path d="M0 0 6 3 0 6z" fill={SOFT} /></marker>
      </defs>
      <path d="M 95 100 V 138" fill="none" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" markerEnd="url(#lr-arrow-t)" />
      <path d="M 265 100 V 246" fill="none" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" opacity="0.7" />
      <path d="M 95 278 C 95 308, 150 304, 150 332" fill="none" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" markerEnd="url(#lr-arrow-t)" />
      <path d="M 265 278 C 265 308, 210 304, 210 332" fill="none" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" opacity="0.7" markerEnd="url(#lr-arrow-t)" />
      {!still && (
        <>
          <g opacity="0"><circle r="9" fill="#5A7FA6" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="5s" repeatCount="indefinite" path={left} /><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="5s" repeatCount="indefinite" /></g>
          <g opacity="0"><circle r="9" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="5s" begin="-2.500s" repeatCount="indefinite" path={right} /><animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.1;0.9;1" dur="5s" begin="-2.500s" repeatCount="indefinite" /></g>
        </>
      )}
      <g transform="translate(12 10)">
        <rect width="166" height="90" rx="22" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="83" y="40" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>A company</text>
        <text x="83" y="62" textAnchor="middle" fontSize="12" fontWeight="600" fill={SOFT} fontFamily={F}>wants a decision changed</text>
      </g>
      <g transform="translate(182 10)">
        <rect width="166" height="90" rx="22" fill="#fff" stroke="#9C3B3B" strokeWidth="3.500" />
        <text x="83" y="40" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>The same company</text>
        <text x="83" y="62" textAnchor="middle" fontSize="13" fontWeight="600" fill={SOFT} fontFamily={F}>its own staff</text>
      </g>
      <g transform="translate(12 140)">
        <rect width="166" height="92" rx="22" fill="#E8F0FA" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="83" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>A consultancy</text>
        <text x="83" y="64" textAnchor="middle" fontSize="12.500" fontWeight="700" fill="#3F5F85" fontFamily={F}>paid to lobby for them</text>
      </g>
      <g transform="translate(12 246)"><rect width="166" height="32" rx="16" fill="#E1F1E8" stroke="#3F7D5C" strokeWidth="2.500" /><text x="83" y="21" textAnchor="middle" fontSize="13" fontWeight="800" fill="#2B5E43" fontFamily={F}>On the public register</text></g>
      <g transform="translate(182 246)"><rect width="166" height="32" rx="16" fill="#F7E7E7" stroke="#9C3B3B" strokeWidth="2.500" strokeDasharray="6 4" /><text x="83" y="21" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Not on any register</text></g>
      <g transform="translate(90 336)">
        <rect width="180" height="120" rx="22" fill="#fff" stroke="#1B2438" strokeWidth="3.500" />
        <circle cx="90" cy="38" r="16" fill="#1B2438" /><path d="M 62 82 q 28 -36 56 0z" fill="#1B2438" />
        <text x="90" y="104" textAnchor="middle" fontSize="14" fontWeight="800" fill={INK} fontFamily={F}>A minister</text>
      </g>
      <text x="180" y="488" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>{firms} consultancies are registered.</text>
      <text x="180" y="508" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>In-house lobbying is not counted at all.</text>
    </svg>
  );
}

function TwoRoutesWide({ firms }) {
  const still = useReducedMotion();
  const top = "M 230 95 L 550 95 C 620 95, 650 150, 686 150";
  const bottom = "M 230 265 H 560 C 625 265, 640 210, 686 210";
  const line = { fill: "none", strokeWidth: 4, strokeDasharray: "2 9", strokeLinecap: "round" };
  return (
    <svg className="st-trail-wide" viewBox="0 28 900 364" role="img" aria-label="Two routes to a minister: through a paid consultancy, which is registered and visible, and through the company's own staff, which is not registered at all">
      <defs>
        <marker id="lr-arrow" markerWidth="14" markerHeight="14" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 6 6"><path d="M0 0 6 3 0 6z" fill={SOFT} /></marker>
      </defs>
      <path d="M 230 95 H 336" {...line} stroke="#5A7FA6" markerEnd="url(#lr-arrow)" />
      <path d="M 550 95 C 620 95, 650 150, 686 150" {...line} stroke="#5A7FA6" markerEnd="url(#lr-arrow)" />
      <path d={bottom} {...line} stroke="#9C3B3B" opacity="0.7" markerEnd="url(#lr-arrow)" />
      {!still && (
        <>
          <g opacity="0"><circle r="10" fill="#5A7FA6" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="5s" repeatCount="indefinite" path={top} /><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="5s" repeatCount="indefinite" /></g>
          <g opacity="0"><circle r="10" fill="#9C3B3B" stroke="#fff" strokeWidth="2.500" /><animateMotion dur="5s" begin="-2.500s" repeatCount="indefinite" path={bottom} /><animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.1;0.9;1" dur="5s" begin="-2.500s" repeatCount="indefinite" /></g>
        </>
      )}
      <g transform="translate(30 45)">
        <rect width="200" height="100" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="100" y="44" textAnchor="middle" fontSize="21" fontWeight="800" fill={INK} fontFamily={S}>A company</text>
        <text x="100" y="72" textAnchor="middle" fontSize="15" fontWeight="600" fill={SOFT} fontFamily={F}>wants a decision changed</text>
      </g>
      <g transform="translate(30 215)">
        <rect width="200" height="100" rx="24" fill="#fff" stroke="#9C3B3B" strokeWidth="3.500" />
        <text x="100" y="44" textAnchor="middle" fontSize="21" fontWeight="800" fill={INK} fontFamily={S}>The same company</text>
        <text x="100" y="72" textAnchor="middle" fontSize="15" fontWeight="600" fill={SOFT} fontFamily={F}>its own staff</text>
      </g>
      <g transform="translate(340 45)">
        <rect width="210" height="100" rx="24" fill="#E8F0FA" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="105" y="44" textAnchor="middle" fontSize="21" fontWeight="800" fill={INK} fontFamily={S}>A consultancy</text>
        <text x="105" y="72" textAnchor="middle" fontSize="15" fontWeight="700" fill="#3F5F85" fontFamily={F}>paid to lobby for them</text>
      </g>
      <g transform="translate(335 156)"><rect width="220" height="36" rx="18" fill="#E1F1E8" stroke="#3F7D5C" strokeWidth="2.500" /><text x="110" y="24" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2B5E43" fontFamily={F}>On the public register</text></g>
      <g transform="translate(300 247)"><rect width="220" height="36" rx="18" fill="#F7E7E7" stroke="#9C3B3B" strokeWidth="2.500" strokeDasharray="6 4" /><text x="110" y="24" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Not on any register</text></g>
      <g transform="translate(690 125)">
        <rect width="180" height="120" rx="24" fill="#fff" stroke="#1B2438" strokeWidth="3.500" />
        <circle cx="90" cy="38" r="16" fill="#1B2438" /><path d="M 62 82 q 28 -36 56 0z" fill="#1B2438" />
        <text x="90" y="104" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} fontFamily={F}>A minister</text>
      </g>
      <text x="450" y="372" textAnchor="middle" fontSize="17" fontWeight="700" fill={SOFT} fontFamily={F}>{firms} consultancies are registered. In-house lobbying is not counted at all.</text>
    </svg>
  );
}

// The part you can see against the part you can't: a small lit tip and a much larger hatched mass, whose size is a picture of "bigger and unmeasured", not a figure.
export function Iceberg({ firms }) {
  return <><IcebergWide firms={firms} /><IcebergTall firms={firms} /></>;
}

function IcebergTall({ firms }) {
  return (
    <svg className="st-trail-tall" viewBox="0 0 360 356" aria-hidden="true">
      <defs><pattern id="ice-ht" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F3E4E4" /><rect width="3" height="9" fill="#E6BDBD" /></pattern></defs>
      <rect x="0" y="120" width="360" height="236" fill="#EAF2FB" />
      <line x1="0" y1="120" x2="360" y2="120" stroke="#7FA6CF" strokeWidth="3" strokeDasharray="10 8" />
      <text x="10" y="106" fontSize="14" fontWeight="800" fill="#3F5F85" fontFamily={F}>What the public can see</text>
      <text x="10" y="146" fontSize="14" fontWeight="800" fill="#7A2E2E" fontFamily={F}>What it cannot</text>
      <path d="M 240 120 L 285 52 L 330 120 Z" fill="#5A7FA6" />
      <g transform="translate(10 12)"><rect width="230" height="44" rx="22" fill="#fff" stroke="#5A7FA6" strokeWidth="3" /><text x="115" y="28" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#3F5F85" fontFamily={F}>{firms} registered consultancies</text></g>
      <path d="M 240 34 L 270 66" stroke="#5A7FA6" strokeWidth="3" strokeLinecap="round" />
      <path d="M 240 120 L 330 120 L 350 200 L 300 322 L 100 334 L 22 224 Z" fill="url(#ice-ht)" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" />
      <text x="180" y="214" textAnchor="middle" fontSize="18" fontWeight="800" fill="#7A2E2E" fontFamily={F}>In-house lobbying</text>
      <text x="180" y="240" textAnchor="middle" fontSize="14.500" fontWeight="600" fill="#7A2E2E" fontFamily={F}>Bigger, and unmeasured:</text>
      <text x="180" y="260" textAnchor="middle" fontSize="14.500" fontWeight="600" fill="#7A2E2E" fontFamily={F}>no register covers it</text>
    </svg>
  );
}

function IcebergWide({ firms }) {
  return (
    <svg className="st-trail-wide" viewBox="0 20 900 304" role="img" aria-label="A small visible tip, the registered consultant lobbyists, above a much larger hidden mass of unmeasured in-house lobbying">
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
      <g transform="translate(40 40)"><rect width="240" height="48" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3" /><text x="120" y="30" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#3F5F85" fontFamily={F}>{firms} registered consultancies</text></g>
      <path d="M 280 64 L 372 70" stroke="#5A7FA6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
