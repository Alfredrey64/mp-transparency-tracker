/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";

// The pictures for the dark money page. Each is drawn in SVG and moves by animation written into the picture, so it needs no script and stands
// still for anyone who has asked for less motion.

const INK = "#1B2438";
const SOFT = "#5B6784";

const FONT = "Public Sans, system-ui, sans-serif";
const SERIF = "Newsreader, Georgia, serif";
const DONORS = [{ c: "#2A6FDB", l: "A" }, { c: "#1FA97C", l: "B" }, { c: "#E8741A", l: "C" }];
const COLS = [
  { n: "1", title: "Named people give", c: "#2A6FDB", fill: "#F1F6FD", edge: "#D5E2F6" },
  { n: "2", title: "Nobody has to name them", c: "#9C3B3B", fill: "#FDF4F4", edge: "#F0D3D3" },
  { n: "3", title: "The party's register", c: "#3F7D5C", fill: "#F2F8F4", edge: "#D3E7DB" },
];

// Shared drawing material, with a suffix so the wide and the tall picture can both sit in the page without their ids colliding.
const Defs = ({ s }) => (
  <defs>
    <marker id={`dm-arrow${s}`} markerWidth="14" markerHeight="14" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 6 6"><path d="M0 0 6 3 0 6z" fill={SOFT} /></marker>
    <pattern id={`dm-hatch${s}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#FBEAEA" /><rect width="3" height="8" fill="#EBC0C0" /></pattern>
    <filter id={`dm-sh${s}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={INK} floodOpacity="0.16" /></filter>
    {COLS.map((k) => <linearGradient key={k.n} id={`dm-p${k.n}${s}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={k.edge} /><stop offset="0.55" stopColor={k.fill} /></linearGradient>)}
  </defs>
);

// A donor: a named person, with the tick that says the public can see who they are.
const Person = ({ x, y, colour, letter, s, d }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="dmx-in" style={{ "--d": d }}>
      <rect x="-86" y="-28" width="172" height="56" rx="28" fill="#fff" stroke={colour} strokeWidth="2.500" filter={`url(#dm-sh${s})`} />
      <circle cx="-58" cy="0" r="23" fill="none" stroke={colour} strokeOpacity="0.25" strokeWidth="3" />
      <circle cx="-58" cy="0" r="18" fill={colour} />
      <text x="-58" y="6" textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff" fontFamily={FONT}>{letter}</text>
      <text x="-30" y="6" fontSize="16" fontWeight="700" fill={INK} fontFamily={FONT}>Donor {letter}</text>
      <g transform="translate(66 0)"><circle r="9.500" fill="#E3F3EA" stroke="#3F7D5C" strokeWidth="1.500" /><path d="M -4 0.5 L -1.200 3.300 L 4.200 -2.600" fill="none" stroke="#2B5E43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
    </g>
  </g>
);

// The money's path: a soft wide ribbon in the giver's colour with a thin line of dashes running along it, so the direction shows even when nothing moves.
const Flow = ({ d, colour, s, delay = 0.5 }) => (
  <g className="dmx-in" style={{ "--d": delay }}>
    <path d={d} fill="none" stroke={colour} strokeOpacity="0.2" strokeWidth="16" strokeLinecap="round" />
    <path className="dmx-dash" d={d} fill="none" stroke={colour} strokeOpacity="0.85" strokeWidth="3" strokeDasharray="3 12" strokeLinecap="round" markerEnd={`url(#dm-arrow${s})`} />
  </g>
);

// The association: hatched and hooded, a question mark where a name should be, with a pale band of light that keeps passing across it.
function Association({ x, y, w, h, s, r = 26, d = 0.4 }) {
  const id = `dm-clip${s}`;
  const cr = h > 130 ? 28 : 22;
  const cy = -h / 2 + cr + 20;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="dmx-in" style={{ "--d": d }}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={`url(#dm-hatch${s})`} stroke="#9C3B3B" strokeWidth="3.500" strokeDasharray="10 6" filter={`url(#dm-sh${s})`} />
        <clipPath id={id}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} /></clipPath>
        <g clipPath={`url(#${id})`}><g className="dmx-veil"><rect x={-w / 2 - 90} y={-h / 2 - 20} width="46" height={h + 40} fill="#fff" fillOpacity="0.55" transform="skewX(-18)" /></g></g>
        <circle cy={cy} r={cr} fill="#fff" stroke="#9C3B3B" strokeWidth="3" strokeDasharray="6 5" />
        <text y={cy + cr * 0.5} textAnchor="middle" fontSize={cr * 1.43} fontWeight="800" fill="#9C3B3B" fontFamily={SERIF}>?</text>
        <text y={cy + cr + 26} textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={FONT}>Unincorporated</text>
        <text y={cy + cr + 44} textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={FONT}>association</text>
      </g>
    </g>
  );
}

// The party's register as a page: a green heading, two grey lines of other entries, and the one line the public gets to read, which lights up as the money arrives.
function Register({ x, y, w, h, s, still, pulseDur = "7s", d = 0.6 }) {
  const id = `dm-reg${s}`;
  const top = -h / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="dmx-in" style={{ "--d": d }}>
        <rect x={-w / 2} y={top} width={w} height={h} rx="22" fill="#fff" stroke="#3F7D5C" strokeWidth="3.500" filter={`url(#dm-sh${s})`} />
        <clipPath id={id}><rect x={-w / 2} y={top} width={w} height={h} rx="22" /></clipPath>
        <g clipPath={`url(#${id})`}><rect x={-w / 2} y={top} width={w} height="40" fill="#3F7D5C" /></g>
        <text y={top + 27} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff" fontFamily={FONT}>The party</text>
        <rect x={-w / 2 + 20} y={top + 50} width={w - 70} height="8" rx="4" fill="#E3EAF0" />
        <rect x={-w / 2 + 20} y={top + 64} width={w - 104} height="8" rx="4" fill="#E3EAF0" />
        <rect x={-w / 2 + 14} y={top + 80} width={w - 28} height="52" rx="12" fill="#E7F3EC" />
        {!still && <rect x={-w / 2 + 14} y={top + 80} width={w - 28} height="52" rx="12" fill="none" stroke="#3F7D5C" strokeWidth="3" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.84;0.9;0.96;1;1" dur={pulseDur} repeatCount="indefinite" /></rect>}
        <text y={top + 99} textAnchor="middle" fontSize="14" fontWeight="700" fill="#2B5E43" fontFamily={FONT}>Donor:</text>
        <text y={top + 121} textAnchor="middle" fontSize="16" fontWeight="800" fill="#2B5E43" fontFamily={FONT}>the association</text>
      </g>
    </g>
  );
}

const Coin = ({ colour, r = 13, path, begin = "0s", dur, times, opacity, fontSize = 13 }) => (
  <g opacity="0">
    <circle r={r} fill={colour} stroke="#fff" strokeWidth="3" /><text y={fontSize / 2.800} textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="#fff" fontFamily={FONT}>£</text>
    <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} keyPoints={times.points} keyTimes={times.at} calcMode="linear" />
    <animate attributeName="opacity" values={opacity.values} keyTimes={opacity.at} dur={dur} begin={begin} repeatCount="indefinite" />
  </g>
);
const IN_TIMES = { points: "0;1;1", at: "0;0.38;1" };
const IN_FADE = { values: "0;1;1;0;0", at: "0;0.04;0.34;0.42;1" };
const OUT_TIMES = { points: "0;0;1;1", at: "0;0.5;0.86;1" };
const OUT_FADE = { values: "0;0;1;1;0;0", at: "0;0.5;0.54;0.84;0.9;1" };

// Money starts with named people, passes through an association that need not name them, and reaches the party under the association's name alone.
// Three equal columns, each headed by its step, with the money running along one line through the middle of them.
export function MoneyTrail() {
  return <><MoneyTrailWide /><MoneyTrailTall /></>;
}

function MoneyTrailWide() {
  const still = useReducedMotion();
  const [ref, go] = useGo(0.2);
  const ys = [126, 194, 262];
  const mid = 194;
  const into = (y) => `M 224 ${y} C 292 ${y}, 300 ${mid}, 352 ${mid}`;
  const out = `M 540 ${mid} L 660 ${mid}`;
  const dur = "7s";
  const xs = [10, 325, 640];
  return (
    <svg ref={ref} data-go={go} className="st-trail-wide dmx" viewBox="0 0 900 392" fontFamily={FONT} role="img" aria-label="Money from named donors goes into an unincorporated association, which gives to a party under its own name only">
      <Defs s="" />
      {COLS.map((k, i) => (
        <g key={k.n} transform={`translate(${xs[i] + 125} 0)`}>
          <g className="dmx-in" style={{ "--d": i * 0.12 }}>
            <rect x="-125" y="8" width="250" height="312" rx="24" fill={`url(#dm-p${k.n})`} stroke={k.edge} strokeWidth="1.500" />
            <circle cy="40" r="15" fill={k.c} stroke="#fff" strokeWidth="3" /><text y="45.500" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">{k.n}</text>
            <text y="76" textAnchor="middle" fontSize="16.500" fontWeight="800" fill={k.c}>{k.title}</text>
          </g>
        </g>
      ))}
      {ys.map((y, n) => <Flow key={y} d={into(y)} colour={DONORS[n].c} s="" delay={0.5 + n * 0.1} />)}
      <Flow d={out} colour="#8A94A6" s="" delay={0.9} />
      {ys.map((y, n) => <Person key={y} x={135} y={y} colour={DONORS[n].c} letter={DONORS[n].l} s="" d={0.2 + n * 0.12} />)}
      <Association x={450} y={mid} w={172} h={152} s="" />
      <Register x={765} y={mid} w={180} h={152} s="" still={still} pulseDur={dur} />
      {!still && ys.map((y, n) => <Coin key={`c${y}`} colour={DONORS[n].c} path={into(y)} begin={`${n * 0.35}s`} dur={dur} times={IN_TIMES} opacity={IN_FADE} />)}
      {!still && <Coin colour="#8A94A6" r={16} fontSize={15} path={out} dur={dur} times={OUT_TIMES} opacity={OUT_FADE} />}
      {still && <g><circle cx="305" cy="159" r="13" fill="#2A6FDB" /><circle cx="292" cy="194" r="13" fill="#1FA97C" /><circle cx="305" cy="229" r="13" fill="#E8741A" /><circle cx="604" cy="194" r="16" fill="#8A94A6" /></g>}
      <g className="dmx-in" style={{ "--d": 1.1 }}>
        <path d="M 10 336 V 350 H 575 V 336" fill="none" stroke="#2A6FDB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><text x="292" y="378" textAnchor="middle" fontSize="15" fill="#2A6FDB" fontWeight="700">The association may know who they are</text>
        <path d="M 640 336 V 350 H 890 V 336" fill="none" stroke="#3F7D5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><text x="765" y="378" textAnchor="middle" fontSize="15" fill="#3F7D5C" fontWeight="700">The public sees only the association</text>
      </g>
    </svg>
  );
}

// The same story stacked top to bottom for a narrow screen, where the three columns would shrink the words too small to read.
function MoneyTrailTall() {
  const still = useReducedMotion();
  const [ref, go] = useGo(0.15);
  const dur = "7s";
  const steps = [
    { y: 0, h: 292 }, { y: 338, h: 252 }, { y: 636, h: 264 },
  ];
  const ys = [112, 176, 240];
  const down1 = "M 180 298 L 180 332";
  const down2 = "M 180 598 L 180 630";
  return (
    <svg ref={ref} data-go={go} className="st-trail-tall dmx" viewBox="0 0 360 900" fontFamily={FONT} aria-hidden="true">
      <Defs s="-t" />
      {COLS.map((k, i) => (
        <g key={k.n} transform={`translate(180 ${steps[i].y})`}>
          <g className="dmx-in" style={{ "--d": i * 0.12 }}>
            <rect x="-176" y="2" width="352" height={steps[i].h - 4} rx="24" fill={`url(#dm-p${k.n}-t)`} stroke={k.edge} strokeWidth="1.500" />
            <circle cy="30" r="15" fill={k.c} stroke="#fff" strokeWidth="3" /><text y="35.500" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">{k.n}</text>
            <text y="66" textAnchor="middle" fontSize="16.500" fontWeight="800" fill={k.c}>{k.title}</text>
          </g>
        </g>
      ))}
      <Flow d={down1} colour="#2A6FDB" s="-t" delay={0.5} />
      <Flow d={down2} colour="#8A94A6" s="-t" delay={0.8} />
      {ys.map((y, n) => <Person key={y} x={180} y={y} colour={DONORS[n].c} letter={DONORS[n].l} s="-t" d={0.2 + n * 0.12} />)}
      <Association x={180} y={480} w={172} h={120} s="-t" />
      <text x="180" y="574" textAnchor="middle" fontSize="14.500" fill="#2A6FDB" fontWeight="700">The association may know who they are</text>
      <Register x={180} y={792} w={180} h={146} s="-t" still={still} pulseDur={dur} />
      <text x="180" y="880" textAnchor="middle" fontSize="14.500" fill="#3F7D5C" fontWeight="700">The public sees only the association</text>
      {!still && DONORS.map((d, n) => <Coin key={d.l} colour={d.c} path={down1} begin={`${n * 0.35}s`} dur={dur} times={IN_TIMES} opacity={IN_FADE} />)}
      {!still && <Coin colour="#8A94A6" r={16} fontSize={15} path={down2} dur={dur} times={OUT_TIMES} opacity={OUT_FADE} />}
      {still && <g><circle cx="150" cy="318" r="13" fill="#2A6FDB" /><circle cx="180" cy="318" r="13" fill="#1FA97C" /><circle cx="210" cy="318" r="13" fill="#E8741A" /><circle cx="180" cy="617" r="16" fill="#8A94A6" /></g>}
    </svg>
  );
}

// The three amounts that decide what an association must report, as three stations along a rail that darkens as the sum grows, each with a rising meter, and
// the registration threshold underneath. It plays once, when it scrolls into view.
export function Thresholds() {
  const [ref, go] = useGo(0.25);
  const steps = [
    { c: "#7B8BA5", state: "Not counted", t: "Under £500", s: "Not even counted by the association" },
    { c: "#E8801F", state: "Counted", t: "£500 and over", s: "Counted, but not yet reported" },
    { c: "#C93A55", state: "Reported", t: "Over £7,500 from one source", s: "Must be reported, but only once total gifts pass £37,270 a year" },
  ];
  return (
    <div ref={ref} className="dm-th" data-go={go} role="img" aria-label="Three steps: under 500 pounds is not counted, 500 pounds and over is counted, over 7,500 pounds from one source must be reported once yearly donations pass 37,270 pounds">
      <ol className="dm-th-row" aria-hidden="true">
        {steps.map((st, i) => (
          <li key={st.t} style={{ "--tc": st.c, "--i": i }}>
            <span className="dm-th-node">{i + 1}</span>
            <div className="dm-th-card">
              <span className="dm-th-state"><span className="dm-th-meter">{[0, 1, 2].map((k) => <i key={k} data-on={k <= i ? "1" : "0"} />)}</span>{st.state}</span>
              <b>{st.t}</b>
              <p>{st.s}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="dm-th-note" aria-hidden="true">Below £37,270 a year: no registration at all</p>
    </div>
  );
}

// How the £435,000 given to the DUP in 2016 was spent, from the Electoral Commission's findings as the page describes them.
export function SpendBar() {
  return (
    <>
      <SpendBarWide />
      <SpendBarTall />
    </>
  );
}

const SPEND = [
  { w: 282, c: "#6E4B6E", t: "£282,000", s: "four-page Metro advert" },
  { w: 100, c: "#9C6B30", t: "about £100,000", s: "campaign merchandise" },
  { w: 43, c: "#5A7FA6", t: "", s: "" },
  { w: 10, c: "#9AA6B8", t: "", s: "" },
];

// On a phone the bar runs across the box with its two named parts listed beneath it, and the three findings below that, as ordinary wrapping text.
function SpendBarTall() {
  return (
    <div className="st-trail-tall dm-spend" role="img" aria-label="The 435,000 pound donation: about 425,000 pounds was spent on Vote Leave campaigning in England, including 282,000 pounds on a Metro advert and about 100,000 pounds on merchandise">
      <b className="dm-spend-t">£435,000 donated to the DUP in 2016</b>
      <div className="dm-spend-bar">{SPEND.map((p, i) => <i key={i} style={{ flexGrow: p.w, background: p.c, animationDelay: `${0.2 + i * 0.2}s` }} />)}</div>
      <ul className="dm-spend-key">
        {SPEND.filter((p) => p.t).map((p) => <li key={p.t} style={{ "--c": p.c }}><i /><b>{p.t}</b><span>{p.s}</span></li>)}
      </ul>
      <p className="dm-spend-lead">Around £425,000 went on Vote Leave campaigning in England</p>
      <p>None of it was spent in Northern Ireland, where the DUP actually stands for election.</p>
      <p>The Electoral Commission fined the donor group £6,000 for failing to cooperate. It could not make it name its source.</p>
    </div>
  );
}

function SpendBarWide() {
  const parts = SPEND;
  const total = parts.reduce((t, p) => t + p.w, 0);
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((t, p) => t + (p.w / total) * 900, 0));
  return (
    <svg className="st-trail-wide" viewBox="0 0 900 240" role="img" aria-label="The 435,000 pound donation: about 425,000 pounds was spent on Vote Leave campaigning in England, including 282,000 pounds on a Metro advert and about 100,000 pounds on merchandise">
      <text x="0" y="26" fontSize="20" fontWeight="800" fill={INK} fontFamily="Newsreader, Georgia, serif">£435,000 donated to the DUP in 2016</text>
      {parts.map((p, i) => { const w = (p.w / total) * 900; const x = starts[i]; return (
        <g key={i} style={{ animation: `stGrow 1s var(--ease-out) ${0.2 + i * 0.2}s backwards`, transformOrigin: `${x}px 90px`, transformBox: "view-box" }}>
          <rect x={x + 1} y="50" width={Math.max(w - 3, 2)} height="70" rx="12" fill={p.c} />
          {p.t && <text x={x + 14} y="82" fontSize={w > 150 ? 22 : 15} fontWeight="800" fill="#fff" fontFamily="Newsreader, Georgia, serif">{p.t}</text>}
          {p.s && <text x={x + 14} y="104" fontSize="13" fontWeight="600" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">{p.s}</text>}
        </g>); })}
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
    <>
      <SecrecyWide />
      <SecrecyTall />
    </>
  );
}

const SECRECY = [
  { t: "January 2014", s: "Backdating the change was considered, and not done", c: "#9C6B30" },
  { t: "Early 2016", s: "The DUP's £435,000 donation is made", c: "#9C3B3B" },
  { t: "1 July 2017", s: "Secrecy lifted, from this date on only", c: "#3F7D5C" },
];

// Down the page on a phone: the dates in order on a rail that is hatched red while donors could stay secret and green once they had to be named.
function SecrecyTall() {
  return (
    <ol className="st-trail-tall dm-sec" aria-label="A timeline: January 2014 when backdating was considered and rejected, early 2016 when the DUP donation was made, and 1 July 2017 when secrecy ended">
      {SECRECY.map((m, i) => (
        <li key={m.t} style={{ "--c": m.c, "--i": i }} data-end={i === 2 ? "1" : "0"}>
          <span className="dm-sec-dot" />
          <b>{m.t}</b>
          <p>{m.s}</p>
          {i === 0 && <em className="dm-sec-band" data-k="secret">Donors secret by law</em>}
          {i === 2 && <em className="dm-sec-band" data-k="named">Donors named</em>}
        </li>
      ))}
    </ol>
  );
}

function SecrecyWide() {
  const [ref, go] = useGo(0.25);
  const rail = 140;
  const marks = [{ x: 120, ...SECRECY[0] }, { x: 400, ...SECRECY[1] }, { x: 640, ...SECRECY[2] }];
  return (
    <svg ref={ref} data-go={go} className="st-trail-wide dmx" viewBox="0 0 900 250" fontFamily={FONT} role="img" aria-label="A timeline: January 2014 when backdating was considered and rejected, early 2016 when the DUP donation was made, and 1 July 2017 when secrecy ended">
      <defs>
        <pattern id="sec-h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#F6E9E9" /><rect width="3.500" height="10" fill="#E3B5B5" /></pattern>
        <filter id="sec-sh" x="-10%" y="-40%" width="120%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={INK} floodOpacity="0.14" /></filter>
        <clipPath id="sec-clip"><rect x="20" y={rail - 22} width="860" height="44" rx="22" /></clipPath>
      </defs>
      <g style={{ animation: "stGrow 1.1s var(--ease-out) 0.1s backwards", transformOrigin: `20px ${rail}px`, transformBox: "view-box" }}>
        <rect x="20" y={rail - 22} width="860" height="44" rx="22" fill="#fff" filter="url(#sec-sh)" />
        <g clipPath="url(#sec-clip)">
          <rect x="20" y={rail - 22} width="620" height="44" fill="url(#sec-h)" />
          <rect x="640" y={rail - 22} width="240" height="44" fill="#E1F1E8" />
          <path d={`M 640 ${rail - 22} V ${rail + 22}`} stroke="#fff" strokeWidth="5" />
        </g>
        <rect x="20" y={rail - 22} width="860" height="44" rx="22" fill="none" stroke="#C9CFDB" strokeWidth="1.500" />
      </g>
      <g className="dmx-in" style={{ "--d": 0.7 }}>
        <g>
          <rect x="156" y={rail - 12} width="168" height="24" rx="12" fill="#fff" fillOpacity="0.92" stroke="#9C3B3B" strokeWidth="1.500" />
          <text x="240" y={rail + 5} textAnchor="middle" fontSize="13.500" fontWeight="800" fill="#7A2E2E">Donors secret by law</text>
        </g>
        <g>
          <rect x="700" y={rail - 12} width="120" height="24" rx="12" fill="#fff" fillOpacity="0.92" stroke="#3F7D5C" strokeWidth="1.500" />
          <text x="760" y={rail + 5} textAnchor="middle" fontSize="13.500" fontWeight="800" fill="#2B5E43">Donors named</text>
        </g>
      </g>
      {marks.map((m, i) => (
        <g key={m.t} className="dmx-in" style={{ "--d": 0.5 + i * 0.3 }}>
          <rect x={m.x - 84} y="18" width="168" height="40" rx="20" fill="#fff" stroke={m.c} strokeWidth="2.500" filter="url(#sec-sh)" />
          <text x={m.x} y="44" textAnchor="middle" fontSize="17" fontWeight="800" fill={m.c}>{m.t}</text>
          <path d={`M ${m.x} 58 V ${rail - 12}`} stroke={m.c} strokeWidth="2.500" strokeDasharray="2 5" strokeLinecap="round" />
          {i === 1 && <circle className="dmx-ping" cx={m.x} cy={rail} r="13" fill="none" stroke={m.c} strokeWidth="3" />}
          <circle cx={m.x} cy={rail} r="12" fill={m.c} stroke="#fff" strokeWidth="4" />
          <foreignObject x={m.x - 105} y={rail + 34} width="210" height="76"><div xmlns="http://www.w3.org/1999/xhtml" style={{ textAlign: "center", font: "600 14px/1.4 Public Sans, system-ui, sans-serif", color: SOFT }}>{m.s}</div></foreignObject>
        </g>
      ))}
    </svg>
  );
}
