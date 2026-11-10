/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { Shadow, ArrowDef, Ribbon, Badge, Letter } from "./dmx";

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

const GOV = "#6E4B6E", IND = "#9C6B30";

// The turning door itself (wings, housing, and the people walking through), drawn around (0, 0). Shared by the wide picture and the tall one for a phone.
function Machine({ still }) {
  const arcs = { top: `M -95 -59.300 A ${HOUSING} ${HOUSING} 0 0 1 95 -59.300`, bottom: `M 95 59.300 A ${HOUSING} ${HOUSING} 0 0 1 -95 59.300` };
  return (
    <>
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
    </>
  );
}

export function Door() {
  const still = useReducedMotion();
  return (
    <>
      <DoorWide still={still} />
      <DoorTall still={still} />
    </>
  );
}

const SIDES = [{ c: GOV, lines: ["Decides who", "gets contracts"], name: "Government", f: "#EFE7F2" }, { c: IND, lines: ["Pays for", "advice"], name: "Industry", f: "#F7EBDC" }];

function DoorTall({ still }) {
  return (
    <svg className="st-trail-tall" viewBox="0 0 360 540" aria-hidden="true">
      {SIDES.map((side, k) => ({ ...side, x: k ? 184 : 8 })).map((b) => (
        <g key={b.name}>
          <rect x={b.x} y="10" width="168" height="196" rx="24" fill={b.f} stroke={b.c} strokeWidth="3" />
          <text x={b.x + 84} y="42" textAnchor="middle" fontSize="18" fontWeight="800" fill={b.c} fontFamily={F}>{b.name}</text>
          <circle cx={b.x + 84} cy="98" r="34" fill="#fff" stroke={b.c} strokeWidth="3" />
          <circle cx={b.x + 84} cy="89" r="10" fill={b.c} /><path d={`M ${b.x + 65} 120 q 19 -27 38 0z`} fill={b.c} />
          {b.lines.map((l, n) => <text key={l} x={b.x + 84} y={168 + n * 19} textAnchor="middle" fontSize="13.500" fontWeight="700" fill={INK} fontFamily={F}>{l}</text>)}
        </g>
      ))}
      <g transform="translate(180 350)"><Machine still={still} /></g>
      <text x="180" y="506" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>Nothing stops the same person</text>
      <text x="180" y="526" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>passing through, in either direction</text>
    </svg>
  );
}

function DoorWide({ still }) {
  return (
    <svg className="st-trail-wide" viewBox="0 0 900 330" role="img" aria-label="A revolving door between government and industry: a minister goes in on one side and comes out a paid adviser on the other, and someone from industry can go the other way">
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
      <g transform="translate(450 160)"><Machine still={still} /></g>
      <text x="450" y="318" textAnchor="middle" fontSize="14" fontWeight="700" fill={SOFT} fontFamily={F}>Nothing stops the same person passing through, in either direction</text>
    </svg>
  );
}

// 817 applications in ACOBA's last four years, every one of them a tick: not one refused. The two figures are written out above the dots, where they can be read.
function Dots({ cols, step, r, className, ...rest }) {
  const rows = Math.ceil(817 / cols);
  return (
    <svg className={className} viewBox={`0 0 ${cols * step} ${rows * step}`} {...rest}>
      {Array.from({ length: 817 }, (_, n) => (
        <circle key={n} cx={step / 2 + (n % cols) * step} cy={step / 2 + Math.floor(n / cols) * step} r={r} fill="#3F7D5C" opacity="0.85" style={{ animation: `stDot 0.4s ease-out ${(n % cols) * 14 + Math.floor(n / cols) * 9}ms backwards` }} />
      ))}
    </svg>
  );
}

export function Ticks() {
  return (
    <>
      <div className="st-ticks-head"><span><b>817</b>approved or cleared</span><span><b>0</b>refused</span></div>
      <Dots className="st-trail-wide" cols={41} step={20} r={7} role="img" aria-label="817 dots, one for each application, all green: none was refused" />
      <Dots className="st-trail-tall" cols={26} step={13.5} r={4.6} aria-hidden="true" />
    </>
  );
}

// ACOBA's authority ended two years after someone left office: a line of time with the cutoff marked and the lobbying falling beyond it. Drawn along the page on a
// wide screen and down it on a phone.
const STOPS = [{ t: "Leaves office", c: "#6E4B6E" }, { t: "Two years on", c: "#9C3B3B" }, { t: "Lobbying for a firm: no rule broken", c: "#9C6B30" }];

export function Cutoff() {
  return (
    <>
      <svg className="st-trail-wide" viewBox="0 0 900 180" role="img" aria-label="A timeline: leaving office, a two-year window in which the old committee had authority, and the point after which it had none">
        <rect x="60" y="106" width="360" height="52" rx="26" fill="#E8DDF0" stroke="#6E4B6E" strokeWidth="3" />
        <text x="240" y="138" textAnchor="middle" fontSize="18" fontWeight="800" fill="#6E4B6E" fontFamily={F}>Two years: the committee's reach</text>
        <rect x="420" y="106" width="420" height="52" rx="26" fill="#F7E7E7" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" />
        <text x="545" y="138" textAnchor="middle" fontSize="18" fontWeight="800" fill="#9C3B3B" fontFamily={F}>No authority at all</text>
        {[60, 420, 700].map((x, i) => (
          <g key={x} style={{ animation: `stDrop 0.7s var(--ease-spring) ${0.3 + i * 0.3}s backwards` }}>
            <line x1={x} y1="52" x2={x} y2="106" stroke={STOPS[i].c} strokeWidth="3" />
            <circle cx={x} cy="132" r="12" fill={STOPS[i].c} stroke="#fff" strokeWidth="3.500" />
            <text x={x} y="38" textAnchor={i === 0 ? "start" : "middle"} dx={i === 0 ? -8 : 0} fontSize="18" fontWeight="800" fill={STOPS[i].c} fontFamily={F}>{STOPS[i].t}</text>
          </g>
        ))}
      </svg>
      <svg className="st-trail-tall" viewBox="0 0 360 400" aria-hidden="true">
        <rect x="44" y="40" width="40" height="150" rx="20" fill="#E8DDF0" stroke="#6E4B6E" strokeWidth="3" />
        <rect x="44" y="190" width="40" height="190" rx="20" fill="#F7E7E7" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" />
        {[40, 190, 300].map((y, i) => (
          <g key={y} style={{ animation: `stDrop 0.7s var(--ease-spring) ${0.3 + i * 0.3}s backwards` }}>
            <circle cx="64" cy={y + (i === 0 ? 14 : 0)} r="12" fill={STOPS[i].c} stroke="#fff" strokeWidth="3.500" />
          </g>
        ))}
        <text x="104" y="60" fontSize="17" fontWeight="800" fill={STOPS[0].c} fontFamily={F}>Leaves office</text>
        <text x="104" y="108" fontSize="15" fontWeight="800" fill="#6E4B6E" fontFamily={F}>Two years: the</text>
        <text x="104" y="128" fontSize="15" fontWeight="800" fill="#6E4B6E" fontFamily={F}>committee's reach</text>
        <text x="104" y="196" fontSize="17" fontWeight="800" fill={STOPS[1].c} fontFamily={F}>Two years on</text>
        <text x="104" y="238" fontSize="15" fontWeight="800" fill="#9C3B3B" fontFamily={F}>No authority at all</text>
        <text x="104" y="298" fontSize="17" fontWeight="800" fill={STOPS[2].c} fontFamily={F}>Lobbying for a firm:</text>
        <text x="104" y="320" fontSize="17" fontWeight="800" fill={STOPS[2].c} fontFamily={F}>no rule broken</text>
      </svg>
    </>
  );
}

// One body split in two: who now handles which kind of application.
export function Replaced() {
  return (
    <>
      <ReplacedWide />
      <ReplacedTall />
    </>
  );
}

// A little building with a pediment and three columns: what ACOBA was.
const Hall = ({ x, y, c }) => (
  <g transform={`translate(${x} ${y})`} fill={c} opacity="0.9">
    <path d="M 0 12 L 26 -4 L 52 12 Z" /><rect x="4" y="14" width="44" height="4" rx="1.500" />
    {[9, 24, 39].map((cx) => <rect key={cx} x={cx} y="20" width="6" height="22" rx="1.500" />)}
    <rect x="1" y="44" width="50" height="5" rx="1.500" />
  </g>
);
// The abolished body: faded, hatched, dashed, with a cross on its corner.
const Gone = ({ w, h, sh, children }) => (
  <g className="dmx-in" style={{ "--d": 0.1 }} filter={`url(#${sh})`}>
    <rect width={w} height={h} rx="20" fill="#F7EAEA" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="10 6" />
    {children}
    <g transform={`translate(${w - 6} 6)`}><circle r="13" fill="#9C3B3B" stroke="#fff" strokeWidth="3" /><path d="M -4.500 -4.500 L 4.500 4.500 M 4.500 -4.500 L -4.500 4.500" stroke="#fff" strokeWidth="2.500" strokeLinecap="round" /></g>
  </g>
);

function ReplacedTall() {
  const [ref, go] = useGo(0.15);
  const still = useReducedMotion();
  const left = "M 180 90 V 118 C 180 148, 92 140, 92 182";
  const right = "M 180 90 V 118 C 180 148, 268 140, 268 182";
  return (
    <svg ref={ref} data-go={go} className="st-trail-tall dmx" viewBox="0 0 360 474" aria-hidden="true">
      <defs><Shadow id="rp-sh-t" /><ArrowDef id="rp-ar-t" /></defs>
      <Ribbon d={left} c="#6E4B6E" delay={0.5} arrow="url(#rp-ar-t)" /><Ribbon d={right} c="#9C6B30" delay={0.6} arrow="url(#rp-ar-t)" />
      <g transform="translate(40 8)"><Gone w={280} h={80} sh="rp-sh-t">
        <Hall x={20} y={14} c="#9C3B3B" />
        <text x="178" y="38" textAnchor="middle" fontSize="20" fontWeight="800" fill="#9C3B3B" fontFamily={S}>ACOBA</text><text x="178" y="60" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7A2E2E" fontFamily={F}>Abolished 13 October 2025</text>
      </Gone></g>
      <g transform="translate(8 184)"><g className="dmx-in" style={{ "--d": 0.4 }} filter="url(#rp-sh-t)"><rect width="168" height="280" rx="22" fill="#fff" stroke="#6E4B6E" strokeWidth="3.500" />
        <text x="84" y="58" textAnchor="middle" fontSize="15" fontWeight="800" fill="#6E4B6E" fontFamily={F}>Former ministers</text>
        {["Independent", "Adviser on", "Ministerial", "Standards"].map((l, n) => <text key={l} x="84" y={92 + n * 24} textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>{l}</text>)}
        {["61 applications", "in its first", "reporting year,", "2025 to 26"].map((l, n) => <text key={l} x="84" y={198 + n * 20} textAnchor="middle" fontSize="13" fontWeight="600" fill={SOFT} fontFamily={F}>{l}</text>)}
        <Badge x={84} y={0} c="#6E4B6E" /></g></g>
      <g transform="translate(184 184)"><g className="dmx-in" style={{ "--d": 0.5 }} filter="url(#rp-sh-t)"><rect width="168" height="280" rx="22" fill="#fff" stroke="#9C6B30" strokeWidth="3.500" />
        {["Former civil", "servants and", "special advisers"].map((l, n) => <text key={l} x="84" y={58 + n * 20} textAnchor="middle" fontSize="15" fontWeight="800" fill="#9C6B30" fontFamily={F}>{l}</text>)}
        {["The Civil", "Service", "Commission"].map((l, n) => <text key={l} x="84" y={146 + n * 24} textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>{l}</text>)}
        <Badge x={84} y={0} c="#9C6B30" glyph="people" /></g></g>
      {!still && <><Letter path={left} begin="0s" colour="#6E4B6E" /><Letter path={left} begin="1.6s" colour="#6E4B6E" /><Letter path={right} begin="0.8s" colour="#9C6B30" /><Letter path={right} begin="2.4s" colour="#9C6B30" /></>}
    </svg>
  );
}

function ReplacedWide() {
  const [ref, go] = useGo(0.2);
  const still = useReducedMotion();
  const up = "M 290 150 C 380 150, 388 74, 446 74";
  const down = "M 290 150 C 380 150, 388 230, 446 230";
  return (
    <svg ref={ref} data-go={go} className="st-trail-wide dmx" viewBox="0 0 900 300" role="img" aria-label="ACOBA was abolished on 13 October 2025; ministers' applications go to the Independent Adviser on Ministerial Standards, civil servants and special advisers to the Civil Service Commission">
      <defs><Shadow id="rp-sh" /><ArrowDef id="rp-ar" /></defs>
      <Ribbon d={up} c="#6E4B6E" delay={0.5} arrow="url(#rp-ar)" /><Ribbon d={down} c="#9C6B30" delay={0.6} arrow="url(#rp-ar)" />
      <g transform="translate(30 100)"><Gone w={260} h={100} sh="rp-sh">
        <Hall x={18} y={24} c="#9C3B3B" />
        <text x="164" y="46" textAnchor="middle" fontSize="22" fontWeight="800" fill="#9C3B3B" fontFamily={S}>ACOBA</text><text x="164" y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7A2E2E" fontFamily={F}>Abolished 13 October 2025</text>
      </Gone></g>
      <g transform="translate(470 24)"><g className="dmx-in" style={{ "--d": 0.4 }} filter="url(#rp-sh)"><rect width="410" height="100" rx="22" fill="#fff" stroke="#6E4B6E" strokeWidth="3.500" /><text x="214" y="32" textAnchor="middle" fontSize="15" fontWeight="800" fill="#6E4B6E" fontFamily={F}>Former ministers</text><text x="214" y="58" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>Independent Adviser on Ministerial Standards</text><text x="214" y="80" textAnchor="middle" fontSize="12.500" fontWeight="600" fill={SOFT} fontFamily={F}>61 applications in its first reporting year, 2025 to 26</text>
        <Badge x={0} y={50} c="#6E4B6E" k={0.84} /></g></g>
      <g transform="translate(470 180)"><g className="dmx-in" style={{ "--d": 0.5 }} filter="url(#rp-sh)"><rect width="410" height="100" rx="22" fill="#fff" stroke="#9C6B30" strokeWidth="3.500" /><text x="214" y="42" textAnchor="middle" fontSize="15" fontWeight="800" fill="#9C6B30" fontFamily={F}>Former civil servants and special advisers</text><text x="214" y="70" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily={S}>The Civil Service Commission</text>
        <Badge x={0} y={50} c="#9C6B30" glyph="people" k={0.84} /></g></g>
      {!still && <><Letter path={up} begin="0s" colour="#6E4B6E" /><Letter path={up} begin="1.6s" colour="#6E4B6E" /><Letter path={down} begin="0.8s" colour="#9C6B30" /><Letter path={down} begin="2.4s" colour="#9C6B30" /></>}
    </svg>
  );
}
