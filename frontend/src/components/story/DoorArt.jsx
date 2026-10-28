/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// A revolving door seen from above. Its wings turn at a steady pace; each person steps into the gap between two wings on one side, is carried half way round,
// and steps out on the other side changed: a minister in, a paid adviser out, and the other way too. The people are drawn on paths timed to the turn, so each
// stays inside its own gap all the way round. Everyone stays a person throughout: the colour shows which side they are from, and a £ badge shows they are now paid by industry. All of it is written into the picture, so it needs no script and stands still for anyone who has asked for less motion.
const TURN = 12; // seconds for a full turn of the wings
const RIDE = TURN / 2; // a half turn, from one opening to the other
const WALK = 1.2; // seconds to walk in, and to walk out
const CYCLE = TURN; // one trip, padded to a full turn so each person's timing repeats exactly as the wings do (a gap faces an opening every TURN / 4 seconds)
const GAP_R = 62; // how far from the centre people stand while inside
const WINGS_AT = 180 - 45 - (360 / TURN) * WALK; // the angle the wings start at, so a gap faces the left opening just as the first person steps in
const HOUSING = 112;
const IND_GOLD = "#9C6B30";

const Walker = ({ delay, fromColour, toColour, flip }) => {
  const reach = 158; // how far outside the door the walk starts, measured from its centre
  const into = flip ? reach : -reach;
  const side = flip ? GAP_R : -GAP_R;
  const path = `M ${into} 0 L ${side} 0 A ${GAP_R} ${GAP_R} 0 0 1 ${-side} 0 L ${-into} 0`;
  const walk = reach - GAP_R, arc = Math.PI * GAP_R, total = walk * 2 + arc;
  const t1 = WALK / CYCLE, t2 = (WALK + RIDE) / CYCLE, t3 = (WALK + RIDE + WALK) / CYCLE;
  const k1 = walk / total, k2 = (walk + arc) / total;
  const begin = `${delay}s`;
  const mid = (t1 + t2) / 2;
  const swap = [0, mid - 0.02, mid + 0.02, 1].join(";");
  return (
    <g opacity="0">
      <animateMotion dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" path={path} keyPoints={`0;${k1};${k2};1;1`} keyTimes={`0;${t1};${t2};${t3};1`} calcMode="linear" />
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes={`0;0.04;${t3 - 0.04};${t3};1`} dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" />
      <circle r="13" stroke="#fff" strokeWidth="2.500">
        <animate attributeName="fill" values={`${fromColour};${fromColour};${toColour};${toColour}`} keyTimes={swap} dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" />
      </circle>
      <circle cy="-3.500" r="3.500" fill="#fff" /><path d="M -6 7 q 6 -10 12 0z" fill="#fff" />
      <g transform="translate(10 -10)" opacity={flip ? 1 : 0}>
        <circle r="7.500" fill="#fff" stroke={IND_GOLD} strokeWidth="1.500" />
        <text y="3.500" textAnchor="middle" fontSize="10" fontWeight="800" fill={IND_GOLD} fontFamily={F}>£</text>
        <animate attributeName="opacity" values={flip ? "1;1;0;0" : "0;0;1;1"} keyTimes={swap} dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" />
      </g>
    </g>
  );
};

export function Door() {
  const still = useReducedMotion();
  const GOV = "#6E4B6E", IND = "#9C6B30";
  const arcs = { top: `M -95 -59.300 A ${HOUSING} ${HOUSING} 0 0 1 95 -59.300`, bottom: `M 95 59.300 A ${HOUSING} ${HOUSING} 0 0 1 -95 59.300` };
  return (
    <svg viewBox="0 0 900 330" role="img" aria-label="A revolving door between government and industry: a minister goes in on one side and comes out a paid adviser on the other, and someone from industry can go the other way">
      <rect x="20" y="30" width="270" height="250" rx="26" fill="#EFE7F2" stroke={GOV} strokeWidth="3" />
      <text x="155" y="64" textAnchor="middle" fontSize="18" fontWeight="800" fill={GOV} fontFamily={F}>Government</text>
      <rect x="610" y="30" width="270" height="250" rx="26" fill="#F7EBDC" stroke={IND} strokeWidth="3" />
      <text x="745" y="64" textAnchor="middle" fontSize="18" fontWeight="800" fill={IND} fontFamily={F}>Industry</text>
      {[{ x: 155, c: GOV, t: "Decides who gets contracts" }, { x: 745, c: IND, t: "Pays for advice" }].map((b) => (
        <g key={b.t}>
          <circle cx={b.x} cy="150" r="44" fill="#fff" stroke={b.c} strokeWidth="3" />
          <circle cx={b.x} cy="138" r="13" fill={b.c} /><path d={`M ${b.x - 24} 180 q 24 -34 48 0z`} fill={b.c} />
          <text x={b.x} y="226" textAnchor="middle" fontSize="14" fontWeight="700" fill={INK} fontFamily={F}>{b.t}</text>
        </g>
      ))}
      <g transform="translate(450 160)">
        <circle r="124" fill="#F4F6FB" />
        <circle r={HOUSING - 6} fill="#fff" stroke="#E3E8F2" strokeWidth="2" />
        <circle r={GAP_R} fill="none" stroke="#E3E8F2" strokeWidth="26" opacity="0.6" />
        <g transform={`rotate(${WINGS_AT})`}>
          {!still && <animateTransform attributeName="transform" type="rotate" from={WINGS_AT} to={WINGS_AT + 360} dur={`${TURN}s`} repeatCount="indefinite" />}
          <rect x="-102" y="-4" width="204" height="8" rx="4" fill={GOV} /><rect x="-4" y="-102" width="8" height="204" rx="4" fill={GOV} />
          {[0, 90, 180, 270].map((a) => <rect key={a} transform={`rotate(${a})`} x="-18" y="-109" width="36" height="7" rx="3.500" fill={IND} />)}
        </g>
        <path d={arcs.top} fill="none" stroke="#1B2438" strokeWidth="7" strokeLinecap="round" />
        <path d={arcs.bottom} fill="none" stroke="#1B2438" strokeWidth="7" strokeLinecap="round" />
        <circle r="13" fill="#1B2438" />
        {!still ? (
          <>
            {/* Each gap carries one person at a time: the two sides step in on alternate gaps, so nobody shares a gap with someone stepping out. */}
            {[0, 6].map((d) => <Walker key={`g${d}`} delay={-d} fromColour={GOV} toColour={IND} />)}
            {[3, 9].map((d) => <Walker key={`i${d}`} delay={-d} fromColour={IND} toColour={GOV} flip />)}
          </>
        ) : (
          <g>
            <circle cx="-158" r="13" fill={GOV} stroke="#fff" strokeWidth="2.500" /><circle cx="158" r="13" fill={IND} stroke="#fff" strokeWidth="2.500" />
            <circle cx="-158" cy="-3.500" r="3.500" fill="#fff" /><path d="M -164 7 q 6 -10 12 0z" fill="#fff" /><circle cx="158" cy="-3.500" r="3.500" fill="#fff" /><path d="M 152 7 q 6 -10 12 0z" fill="#fff" />
          </g>
        )}
      </g>
      <text x="450" y="318" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>Nothing stops the same person passing through, in either direction</text>
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
