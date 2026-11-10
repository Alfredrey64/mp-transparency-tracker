/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { Shadow, ArrowDef, Ribbon, Badge, Letter } from "./dmx";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// Who is counted: a company paying a consultant to lobby a minister has to be declared; a company's own staff lobbying the same minister does not.
// Drawn along the page on a wide screen, and upright on a phone with the two routes side by side running down to one minister.
export function TwoRoutes({ firms }) {
  return <><TwoRoutesWide firms={firms} /><TwoRoutesTall firms={firms} /></>;
}

// The tick on "On the public register" and the eye-slash on "Not on any register": a small round badge that sits on the pill's left end.
const Tag = ({ w, h, fill, stroke, dash, c, glyph, children, tf, size = 13 }) => (
  <g transform={tf}>
    <rect width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth="2.500" strokeDasharray={dash} />
    <Badge x={h / 2 - 1} y={h / 2} c={c} glyph={glyph} k={(h / 2 + 3) / 23} />
    <text x={(w + h / 2) / 2} y={h / 2 + 5} textAnchor="middle" fontSize={size} fontWeight="800" fill={stroke === "#3F7D5C" ? "#2B5E43" : "#7A2E2E"} fontFamily={F}>{children}</text>
  </g>
);

function TwoRoutesTall({ firms }) {
  const still = useReducedMotion();
  const [ref, go] = useGo(0.15);
  const left = "M 95 100 L 95 278 C 95 308, 150 304, 150 332";
  const right = "M 265 100 L 265 278 C 265 308, 210 304, 210 332";
  return (
    <svg ref={ref} data-go={go} className="st-trail-tall dmx" viewBox="0 -14 360 534" aria-hidden="true">
      <defs><Shadow id="lr-sh-t" /><ArrowDef id="lr-ar-t" /></defs>
      <Ribbon d={left} c="#5A7FA6" delay={0.5} arrow="url(#lr-ar-t)" />
      <Ribbon d={right} c="#9C3B3B" delay={0.6} opacity={0.75} arrow="url(#lr-ar-t)" />
      {!still && (
        <>
          <Letter path={left} colour="#5A7FA6" dur="5s" /><Letter path={left} begin="2.500s" colour="#5A7FA6" dur="5s" />
          <Letter path={right} begin="1.200s" colour="#9C3B3B" dur="5s" fade={0.25} /><Letter path={right} begin="3.700s" colour="#9C3B3B" dur="5s" fade={0.25} />
        </>
      )}
      <g transform="translate(12 10)"><g className="dmx-in" style={{ "--d": 0.1 }} filter="url(#lr-sh-t)">
        <rect width="166" height="90" rx="22" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="83" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>A company</text>
        <text x="83" y="64" textAnchor="middle" fontSize="12" fontWeight="600" fill={SOFT} fontFamily={F}>wants a decision changed</text>
        <Badge x={83} y={0} c="#5A7FA6" glyph="building" k={0.8} />
      </g></g>
      <g transform="translate(182 10)"><g className="dmx-in" style={{ "--d": 0.2 }} filter="url(#lr-sh-t)">
        <rect width="166" height="90" rx="22" fill="#fff" stroke="#9C3B3B" strokeWidth="3.500" />
        <text x="83" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>The same company</text>
        <text x="83" y="64" textAnchor="middle" fontSize="13" fontWeight="600" fill={SOFT} fontFamily={F}>its own staff</text>
        <Badge x={83} y={0} c="#9C3B3B" glyph="people" k={0.8} />
      </g></g>
      <g transform="translate(12 140)"><g className="dmx-in" style={{ "--d": 0.4 }} filter="url(#lr-sh-t)">
        <rect width="166" height="92" rx="22" fill="#E8F0FA" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="83" y="46" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>A consultancy</text>
        <text x="83" y="68" textAnchor="middle" fontSize="12.500" fontWeight="700" fill="#3F5F85" fontFamily={F}>paid to lobby for them</text>
        <Badge x={83} y={0} c="#5A7FA6" glyph="briefcase" k={0.8} />
      </g></g>
      <g className="dmx-in" style={{ "--d": 0.7 }}>
        <Tag tf="translate(12 246)" w={166} h={32} fill="#E1F1E8" stroke="#3F7D5C" c="#3F7D5C" glyph="tick" size={12}>On the public register</Tag>
        <Tag tf="translate(182 246)" w={166} h={32} fill="#F7E7E7" stroke="#9C3B3B" dash="6 4" c="#9C3B3B" glyph="hidden" size={12}>Not on any register</Tag>
      </g>
      <g transform="translate(90 336)"><g className="dmx-in" style={{ "--d": 0.9 }} filter="url(#lr-sh-t)">
        <rect width="180" height="120" rx="22" fill="#fff" stroke="#1B2438" strokeWidth="3.500" />
        <circle cx="90" cy="38" r="16" fill="#1B2438" /><path d="M 62 82 q 28 -36 56 0z" fill="#1B2438" />
        <text x="90" y="104" textAnchor="middle" fontSize="14" fontWeight="800" fill={INK} fontFamily={F}>A minister</text>
      </g></g>
      <text x="180" y="488" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>{firms} consultancies are registered.</text>
      <text x="180" y="508" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>In-house lobbying is not counted at all.</text>
    </svg>
  );
}

function TwoRoutesWide({ firms }) {
  const still = useReducedMotion();
  const [ref, go] = useGo(0.2);
  const topA = "M 232 95 H 330";
  const top = "M 232 95 L 550 95 C 620 95, 650 150, 684 150";
  const bottom = "M 232 265 H 560 C 625 265, 640 210, 684 210";
  return (
    <svg ref={ref} data-go={go} className="st-trail-wide dmx" viewBox="0 16 900 376" role="img" aria-label="Two routes to a minister: through a paid consultancy, which is registered and visible, and through the company's own staff, which is not registered at all">
      <defs><Shadow id="lr-sh" /><ArrowDef id="lr-ar" /></defs>
      <Ribbon d={topA} c="#5A7FA6" delay={0.5} arrow="url(#lr-ar)" />
      <Ribbon d="M 552 95 C 620 95, 650 150, 680 150" c="#5A7FA6" delay={0.7} arrow="url(#lr-ar)" />
      <Ribbon d={bottom} c="#9C3B3B" delay={0.7} opacity={0.75} arrow="url(#lr-ar)" />
      {!still && (
        <>
          <Letter path={top} colour="#5A7FA6" dur="5s" /><Letter path={top} begin="2.500s" colour="#5A7FA6" dur="5s" />
          <Letter path={bottom} begin="1.200s" colour="#9C3B3B" dur="5s" fade={0.25} /><Letter path={bottom} begin="3.700s" colour="#9C3B3B" dur="5s" fade={0.25} />
        </>
      )}
      <g transform="translate(30 45)"><g className="dmx-in" style={{ "--d": 0.1 }} filter="url(#lr-sh)">
        <rect width="200" height="100" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="100" y="48" textAnchor="middle" fontSize="21" fontWeight="800" fill={INK} fontFamily={S}>A company</text>
        <text x="100" y="76" textAnchor="middle" fontSize="15" fontWeight="600" fill={SOFT} fontFamily={F}>wants a decision changed</text>
        <Badge x={100} y={0} c="#5A7FA6" glyph="building" k={0.84} />
      </g></g>
      <g transform="translate(30 215)"><g className="dmx-in" style={{ "--d": 0.2 }} filter="url(#lr-sh)">
        <rect width="200" height="100" rx="24" fill="#fff" stroke="#9C3B3B" strokeWidth="3.500" />
        <text x="100" y="48" textAnchor="middle" fontSize="21" fontWeight="800" fill={INK} fontFamily={S}>The same company</text>
        <text x="100" y="76" textAnchor="middle" fontSize="15" fontWeight="600" fill={SOFT} fontFamily={F}>its own staff</text>
        <Badge x={100} y={0} c="#9C3B3B" glyph="people" k={0.84} />
      </g></g>
      <g transform="translate(340 45)"><g className="dmx-in" style={{ "--d": 0.4 }} filter="url(#lr-sh)">
        <rect width="210" height="100" rx="24" fill="#E8F0FA" stroke="#5A7FA6" strokeWidth="3.500" />
        <text x="105" y="48" textAnchor="middle" fontSize="21" fontWeight="800" fill={INK} fontFamily={S}>A consultancy</text>
        <text x="105" y="76" textAnchor="middle" fontSize="15" fontWeight="700" fill="#3F5F85" fontFamily={F}>paid to lobby for them</text>
        <Badge x={105} y={0} c="#5A7FA6" glyph="briefcase" k={0.84} />
      </g></g>
      <g className="dmx-in" style={{ "--d": 0.8 }}>
        <Tag tf="translate(335 156)" w={220} h={36} fill="#E1F1E8" stroke="#3F7D5C" c="#3F7D5C" glyph="tick" size={15}>On the public register</Tag>
        <Tag tf="translate(300 247)" w={220} h={36} fill="#F7E7E7" stroke="#9C3B3B" dash="6 4" c="#9C3B3B" glyph="hidden" size={15}>Not on any register</Tag>
      </g>
      <g transform="translate(690 125)"><g className="dmx-in" style={{ "--d": 1 }} filter="url(#lr-sh)">
        <rect width="180" height="120" rx="24" fill="#fff" stroke="#1B2438" strokeWidth="3.500" />
        <circle cx="90" cy="38" r="16" fill="#1B2438" /><path d="M 62 82 q 28 -36 56 0z" fill="#1B2438" />
        <text x="90" y="104" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} fontFamily={F}>A minister</text>
      </g></g>
      <text x="450" y="372" textAnchor="middle" fontSize="17" fontWeight="700" fill={SOFT} fontFamily={F}>{firms} consultancies are registered. In-house lobbying is not counted at all.</text>
    </svg>
  );
}

// The part you can see against the part you can't: a small lit tip and a much larger hatched mass, whose size is a picture of "bigger and unmeasured", not a figure.
export function Iceberg({ firms }) {
  return <><IcebergWide firms={firms} /><IcebergTall firms={firms} /></>;
}

// The water's surface: a wave line wider than the picture that slides sideways, over a pale band, so the line between seen and unseen is always moving a little.
const Waves = ({ y, w }) => {
  const reps = Math.ceil(w / 60) + 3;
  const d = `M -120 ${y} ${"q 15 -8 30 0 t 30 0 ".repeat(reps)}`;
  return (
    <g>
      <g className="ice-wave"><path d={`${d} V ${y + 14} H -120 Z`} fill="#fff" fillOpacity="0.35" /><path d={d} fill="none" stroke="#6F9BC8" strokeWidth="3" strokeLinecap="round" /></g>
    </g>
  );
};
const Question = ({ x, y, d }) => <text className="ice-q" x={x} y={y} textAnchor="middle" fontSize="30" fontWeight="800" fill="#9C3B3B" fontFamily={S} style={{ animationDelay: `${d}s` }}>?</text>;

function IcebergTall({ firms }) {
  return (
    <svg className="st-trail-tall" viewBox="0 0 360 356" aria-hidden="true">
      <defs>
        <pattern id="ice-ht" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F6E9E9" /><rect width="3" height="9" fill="#E6BDBD" /></pattern>
        <linearGradient id="ice-wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3EFFB" /><stop offset="1" stopColor="#B4CFEC" /></linearGradient>
        <linearGradient id="ice-ft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B4CFEC" stopOpacity="0" /><stop offset="1" stopColor="#B4CFEC" stopOpacity="0.7" /></linearGradient>
      </defs>
      <rect x="0" y="120" width="360" height="236" fill="url(#ice-wt)" />
      <Waves y={120} w={360} />
      <text x="10" y="106" fontSize="14" fontWeight="800" fill="#3F5F85" fontFamily={F}>What the public can see</text>
      <text x="10" y="146" fontSize="14" fontWeight="800" fill="#7A2E2E" fontFamily={F}>What it cannot</text>
      <path d="M 240 120 L 330 120 L 350 200 L 300 322 L 100 334 L 22 224 Z" fill="url(#ice-ht)" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" style={{ animation: "stGrow 1.1s var(--ease-out) 0.3s backwards", transformOrigin: "285px 120px", transformBox: "view-box" }} />
      <path d="M 240 120 L 330 120 L 350 200 L 300 322 L 100 334 L 22 224 Z" fill="url(#ice-ft)" />
      <Question x={64} y={262} d={0} /><Question x={298} y={282} d={1.3} /><Question x={250} y={168} d={2.4} />
      <g className="ice-bob"><path d="M 240 120 L 285 52 L 330 120 Z" fill="#5A7FA6" style={{ animation: "stRise 0.9s var(--ease-out) 0.2s backwards", transformOrigin: "285px 120px", transformBox: "view-box" }} /><path d="M 285 52 L 300 120 L 330 120 Z" fill="#3F5F85" fillOpacity="0.4" /><path d="M 272 72 L 285 52 L 298 72 L 291 77 L 285 72 L 278 77 Z" fill="#fff" /></g>
      <g transform="translate(10 12)"><rect width="230" height="44" rx="22" fill="#fff" stroke="#5A7FA6" strokeWidth="3" /><text x="115" y="28" textAnchor="middle" fontSize="13.500" fontWeight="800" fill="#3F5F85" fontFamily={F}>{firms} registered consultancies</text></g>
      <path d="M 240 34 L 270 66" stroke="#5A7FA6" strokeWidth="3" strokeLinecap="round" />
      <text x="180" y="214" textAnchor="middle" fontSize="18" fontWeight="800" fill="#7A2E2E" fontFamily={F}>In-house lobbying</text>
      <text x="180" y="240" textAnchor="middle" fontSize="14.500" fontWeight="600" fill="#7A2E2E" fontFamily={F}>Bigger, and unmeasured:</text>
      <text x="180" y="260" textAnchor="middle" fontSize="14.500" fontWeight="600" fill="#7A2E2E" fontFamily={F}>no register covers it</text>
    </svg>
  );
}

function IcebergWide({ firms }) {
  return (
    <svg className="st-trail-wide" viewBox="0 20 900 304" role="img" aria-label="A small visible tip, the registered consultant lobbyists, above a much larger hidden mass of unmeasured in-house lobbying">
      <defs>
        <pattern id="ice-h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F6E9E9" /><rect width="3" height="9" fill="#E6BDBD" /></pattern>
        <linearGradient id="ice-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3EFFB" /><stop offset="1" stopColor="#B4CFEC" /></linearGradient>
        <linearGradient id="ice-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B4CFEC" stopOpacity="0" /><stop offset="1" stopColor="#B4CFEC" stopOpacity="0.7" /></linearGradient>
      </defs>
      <rect x="0" y="108" width="900" height="232" fill="url(#ice-w)" />
      <Waves y={108} w={900} />
      <text x="880" y="98" textAnchor="end" fontSize="13" fontWeight="800" fill="#3F5F85" fontFamily={F}>What the public can see</text>
      <text x="880" y="136" textAnchor="end" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily={F}>What it cannot</text>
      <path d="M 330 108 L 470 108 L 640 196 L 560 300 L 250 310 L 170 200 Z" fill="url(#ice-h)" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" style={{ animation: "stGrow 1.1s var(--ease-out) 0.5s backwards", transformOrigin: "400px 108px", transformBox: "view-box" }} />
      <path d="M 330 108 L 470 108 L 640 196 L 560 300 L 250 310 L 170 200 Z" fill="url(#ice-f)" />
      <Question x={236} y={262} d={0} /><Question x={566} y={262} d={1.3} /><Question x={520} y={170} d={2.4} />
      <g className="ice-bob"><path d="M 330 108 L 400 34 L 470 108 Z" fill="#5A7FA6" style={{ animation: "stRise 0.9s var(--ease-out) 0.2s backwards", transformOrigin: "400px 108px", transformBox: "view-box" }} /><path d="M 400 34 L 420 108 L 470 108 Z" fill="#3F5F85" fillOpacity="0.4" /><path d="M 384 54 L 400 34 L 416 54 L 407 60 L 400 54 L 392 60 Z" fill="#fff" /></g>
      <text x="400" y="168" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={F}>In-house lobbying</text>
      <text x="400" y="190" textAnchor="middle" fontSize="13" fontWeight="600" fill="#7A2E2E" fontFamily={F}>Bigger, and unmeasured:</text>
      <text x="400" y="208" textAnchor="middle" fontSize="13" fontWeight="600" fill="#7A2E2E" fontFamily={F}>no register covers it</text>
      <g transform="translate(40 40)"><rect width="240" height="48" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3" /><text x="120" y="30" textAnchor="middle" fontSize="13.500" fontWeight="800" fill="#3F5F85" fontFamily={F}>{firms} registered consultancies</text></g>
      <path d="M 280 64 L 372 70" stroke="#5A7FA6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
