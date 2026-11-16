/** @jsxImportSource react */
import "../../heroscene.css";
import "../../econart.css";

// The pictures along the foot of the heading band on the Economy and tax pages: the skyline for the Economy, workplaces for Jobs and pay, the Treasury for Public finances, money
// flowing to public services for Taxes, and a high street, factory and lorry for Business. They are all decoration (hidden from screen readers) and take their colours from the
// page's own accent (--hero-accent), so each page keeps its colour. Each plays once or a few times and then rests; with calmer motion asked for, they are simply finished.

const rnd = (i) => ((i * 9301 + 49297) % 233280) / 233280;
const Scene = ({ kind, children }) => (
  <div className="hs-scene" data-kind={kind} aria-hidden="true">
    <svg viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice" focusable="false">{children}</svg>
  </div>
);

// Rows of lit windows on a block: [x, y, columns, rows, gap].
const windows = (x, y, cols, rows, gx = 11, gy = 13, seed = 0) => Array.from({ length: cols * rows }, (_, i) => {
  const c = i % cols; const r = Math.floor(i / cols);
  return <rect key={`${x}-${y}-${i}`} className="hs-win" x={x + c * gx} y={y + r * gy} width="5" height="7" rx="1" style={{ "--d": `${0.6 + rnd(i + seed) * 3.4}s` }} />;
});

// ---------- Economy: a skyline, a crane and a line that climbs through it ----------
const BACK = Array.from({ length: 46 }, (_, i) => ({ x: i * 32 - 8 + rnd(i + 7) * 10, w: 22 + rnd(i) * 26, h: 30 + rnd(i + 3) * 66 }));
export function EconomyScene() {
  return (
    <Scene kind="economy">
      {BACK.map((b, i) => <rect key={i} className="hs-1" x={b.x} y={200 - b.h} width={b.w} height={b.h} />)}
      {/* a slab with a mast, a shard, a rounded tower, a stepped tower and a pyramid-topped one */}
      <g className="hs-2">
        <rect x="300" y="72" width="48" height="128" /><path d="M324 72V44" className="hs-line" />
        <path d="M548 200 580 52 612 200z" />
        <path d="M694 200V96c0-30 12-54 26-70 14 16 26 40 26 70v104z" />
        <rect x="856" y="102" width="40" height="98" />
        <rect x="982" y="86" width="56" height="114" /><path d="M982 86 1010 54 1038 86z" />
        <path d="M1170 200V92h14V78h18V62h18v16h18v14h14v108z" />
      </g>
      <g className="hs-lamp">{windows(306, 82, 4, 8, 11, 14, 1)}{windows(988, 96, 4, 7, 12, 14, 9)}{windows(1176, 100, 4, 7, 12, 14, 17)}{windows(862, 112, 3, 6, 11, 14, 23)}</g>
      <path className="ec-growth" pathLength="1" d="M30 170C170 164 250 130 380 128S560 100 700 86 1000 74 1120 56 1300 46 1410 24" />
      {[[380, 128], [700, 86], [1120, 56], [1410, 24]].map(([x, y], i) => <circle key={i} className="ec-dot" cx={x} cy={y} r={i === 3 ? 7 : 5} style={{ "--i": i }} />)}
      <g className="hs-3">
        <rect x="150" y="38" width="6" height="162" />
        <g className="ec-jib"><path d="M50 40h250M150 40 40 40M150 40 300 40" stroke="var(--s3)" strokeWidth="5" /><rect x="132" y="28" width="40" height="12" /><path d="M262 40v62" className="hs-line" /><rect x="254" y="100" width="16" height="9" /></g>
        <rect x="0" y="188" width="1440" height="12" />
      </g>
    </Scene>
  );
}

// ---------- Jobs and pay: workplaces, with people walking in to work and a pay coin over each ----------
const PEOPLE = [
  { x: 150, kind: "hat" }, { x: 262, kind: "case" }, { x: 420, kind: "cross" }, { x: 560, kind: "book" }, { x: 716, kind: "apron" },
  { x: 850, kind: "case" }, { x: 992, kind: "hat" }, { x: 1120, kind: "cross" }, { x: 1250, kind: "book" }, { x: 1340, kind: "apron" },
];
function Person({ kind, i }) {
  return (
    <g className="ec-walk" style={{ "--i": i }}>
      <g className="ec-bob" style={{ "--i": i }}>
        <circle className="hs-4" cx="0" cy="-30" r="5.5" />
        <path className="hs-4" d="M-6 -23h12l2 14h-16z" />
        <path className="hs-4" d="M-4 -9v9M4 -9v9" stroke="var(--s4)" strokeWidth="3.4" strokeLinecap="round" />
        {kind === "hat" && <path d="M-7 -33a7 6 0 0 1 14 0z" className="hs-acc" />}
        {kind === "cross" && <path d="M-1.4 -20h2.8v7h-2.8z M-3.6 -17.8h7.2v2.8h-7.2z" className="hs-acc" />}
        {kind === "case" && <rect x="7" y="-12" width="9" height="7" rx="1.4" className="hs-acc" />}
        {kind === "book" && <rect x="6" y="-19" width="8" height="10" rx="1" className="hs-acc" />}
        {kind === "apron" && <path d="M-4 -21h8l1.5 12h-11z" className="hs-acc" opacity=".85" />}
      </g>
      <g className="ec-coin" style={{ "--i": i }}><circle cx="0" cy="-46" r="7" fill="#F3C65A" /><path transform="translate(0 -46)" d="M2.6 -3.6a2.6 2.6 0 0 0-5 1.1V3M-2.5 3h5.2M-3.7 -.4h4.2" fill="none" stroke="#7A5A10" strokeWidth="1.3" strokeLinecap="round" /></g>
    </g>
  );
}
export function JobsScene() {
  return (
    <Scene kind="jobs">
      <g className="hs-1">{BACK.slice(0, 46).map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.8} width={b.w} height={b.h * 0.8} />)}</g>
      <g className="hs-2">
        {/* factory with a sawtooth roof and two chimneys */}
        <path d="M30 200V112l36-26v26l36-26v26l36-26v26l36-26v26h26v88z" /><rect x="202" y="56" width="15" height="70" /><rect x="228" y="76" width="12" height="50" />
        {/* an office block */}
        <rect x="262" y="58" width="92" height="142" />
        {/* a hospital */}
        <rect x="392" y="96" width="134" height="104" /><rect x="438" y="72" width="42" height="26" />
        {/* a school with a gable and a clock */}
        <path d="M556 200V112l50-34 50 34v88z" /><rect x="660" y="124" width="48" height="76" />
        {/* a row of shops */}
        <rect x="738" y="112" width="124" height="88" /><rect x="868" y="130" width="70" height="70" />
        {/* a tall office and some houses */}
        <rect x="960" y="70" width="70" height="130" /><path d="M1050 200v-58l28-22 28 22v58zM1118 200v-58l28-22 28 22v58zM1186 200v-58l28-22 28 22v58z" />
        <rect x="1290" y="100" width="120" height="100" />
      </g>
      <g className="hs-lamp">{windows(270, 70, 6, 9, 14, 14, 2)}{windows(970, 82, 5, 8, 12, 14, 8)}{windows(1300, 112, 8, 5, 14, 15, 14)}{windows(401, 112, 9, 5, 14, 17, 20)}</g>
      <g className="hs-acc"><path d="M455 76h8v8h8v8h-8v8h-8v-8h-8v-8h8z" opacity=".95" /><circle cx="606" cy="100" r="9" opacity=".9" /></g>
      <path d="M738 112h124l-8 14H746z" className="hs-acc" opacity=".8" />
      <g className="hs-3"><rect x="0" y="188" width="1440" height="12" /></g>
      {PEOPLE.map((p, i) => <g key={i} transform={`translate(${p.x} 190) scale(1.55)`}><Person kind={p.kind} i={i} /></g>)}
    </Scene>
  );
}

// ---------- Public finances: the Treasury, stacks of coins that grow, and the scales ----------
const STACKS = [2, 3, 3, 5, 6, 6, 8, 9, 11];
export function FinanceScene() {
  return (
    <Scene kind="finance">
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.7} width={b.w} height={b.h * 0.7} />)}</g>
      {/* the Treasury: steps, columns and a pediment */}
      <g className="hs-2">
        <path d="M296 200v-10h448v10zM312 190v-10h416v10z" />
        <rect x="316" y="104" width="408" height="14" /><path d="M300 104 520 40 740 104z" /><rect x="316" y="176" width="408" height="4" />
      </g>
      <g className="hs-pillar">{Array.from({ length: 9 }, (_, i) => <rect key={i} x={330 + i * 45} y="118" width="16" height="60" rx="2" />)}</g>
      <circle className="hs-acc" cx="520" cy="84" r="11" opacity=".9" />
      {/* the scales */}
      <g className="hs-3">
        <rect x="136" y="64" width="5" height="124" /><rect x="104" y="184" width="70" height="8" rx="3" /><circle cx="138.5" cy="62" r="6" />
        <g className="ec-beam"><rect x="62" y="60" width="153" height="5" rx="2" />
          <g className="ec-pan ec-pan-l"><path d="M70 64 52 108h36zM70 64l18 44" className="hs-line" /><path d="M48 108h44a22 14 0 0 1-44 0z" /><circle cx="70" cy="104" r="5" fill="#F3C65A" /></g>
          <g className="ec-pan ec-pan-r"><path d="M207 64 189 108h36z" className="hs-line" /><path d="M185 108h44a22 14 0 0 1-44 0z" /><circle cx="207" cy="104" r="5" fill="#F3C65A" /></g>
        </g>
      </g>
      {/* coin stacks that climb */}
      {STACKS.map((n, s) => (
        <g key={s} transform={`translate(${830 + s * 64} 190)`}>
          {Array.from({ length: n }, (_, k) => (
            <g key={k} className="ec-coinstack" style={{ "--d": `${0.5 + s * 0.28 + k * 0.07}s` }}>
              <ellipse cx="0" cy={-k * 6 - 3} rx="20" ry="5.5" fill="#B88A2C" /><ellipse cx="0" cy={-k * 6 - 5} rx="20" ry="5.5" fill="#F3C65A" />
            </g>
          ))}
        </g>
      ))}
      <path d="M810 118H1420" className="hs-dash" />
      <g className="hs-3"><rect x="0" y="190" width="1440" height="10" /></g>
    </Scene>
  );
}

// ---------- Taxes: money flowing from pay, shopping, homes and fuel, through the Treasury, to hospitals, schools, roads and defence ----------
const SOURCES = [[110, 142], [236, 100], [362, 142], [488, 100]];
const SINKS = [[952, 100], [1078, 142], [1204, 100], [1330, 142]];
const inPath = ([x, y]) => `M${x + 24} ${y} Q${(x + 24 + 690) / 2} ${y - 76} 692 150`;
const outPath = ([x, y]) => `M748 150 Q${(748 + x - 24) / 2} ${y - 76} ${x - 24} ${y}`;
const ICONS = {
  pay: <><rect x="-13" y="-8" width="26" height="16" rx="3" /><circle r="4" /><path d="M-9 -4v.1M9 4v.1" /></>,
  shop: <><path d="M-9 -4h18l-1.6 14h-14.8z" /><path d="M-4 -4V-8a4 4 0 0 1 8 0v4" /></>,
  home: <><path d="M-12 2 0 -10 12 2" /><path d="M-8 0v11h16V0" /><path d="M-2.5 11V4h5v7" /></>,
  fuel: <><rect x="-8" y="-11" width="11" height="22" rx="1.6" /><path d="M-5 -6h5M3 -3h4a3 3 0 0 1 3 3v6" /></>,
  health: <><path d="M-3 -11h6v8h8v6h-8v8h-6v-8h-8v-6h8z" /></>,
  school: <><path d="M0 -6C-4 -9-9 -9-13 -7v16c4-2 9-2 13 1 4-3 9-3 13-1V-7C9 -9 4 -9 0 -6zM0 -6v16" /></>,
  road: <><path d="M-6 -11h12l8 22h-28z" /><path d="M0 -8v3M0 -1v3M0 6v3" /></>,
  shield: <><path d="M0 -12 11 -8v8c0 6-5 10-11 12C-6 10-11 6-11 0v-8z" /></>,
};
function Node({ pos: [x, y], icon, side }) {
  return (
    <g transform={`translate(${x} ${y})`} className={`ec-node ec-node-${side}`}>
      <circle r="26" className="hs-3" /><circle r="26" className="ec-node-ring" />
      <g className="ec-glyph">{ICONS[icon]}</g>
    </g>
  );
}
export function TaxScene() {
  return (
    <Scene kind="taxes">
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.55} width={b.w} height={b.h * 0.55} />)}</g>
      {SOURCES.map((s, i) => <path key={`i${i}`} d={inPath(s)} className="ec-pipe" />)}
      {SINKS.map((s, i) => <path key={`o${i}`} d={outPath(s)} className="ec-pipe" />)}
      {SOURCES.map((s, i) => [0, 1].map((k) => <circle key={`ci${i}${k}`} r="5.5" className="ec-flow" style={{ offsetPath: `path("${inPath(s)}")`, "--d": `${0.4 + i * 0.5 + k * 2.1}s` }} />))}
      {SINKS.map((s, i) => [0, 1].map((k) => <circle key={`co${i}${k}`} r="5.5" className="ec-flow" style={{ offsetPath: `path("${outPath(s)}")`, "--d": `${1.6 + i * 0.5 + k * 2.1}s` }} />))}
      {/* the Treasury at the centre: a coffer with a £ on it */}
      <g className="ec-coffer" transform="translate(720 150)">
        <circle r="46" className="hs-2" /><circle r="46" className="ec-node-ring" /><circle r="34" className="hs-3" />
        <text y="12" textAnchor="middle" fontSize="38" fontWeight="700" fontFamily="Georgia, serif" fill="#F3C65A">£</text>
      </g>
      {["pay", "shop", "home", "fuel"].map((ic, i) => <Node key={ic} pos={SOURCES[i]} icon={ic} side="in" />)}
      {["health", "school", "road", "shield"].map((ic, i) => <Node key={ic} pos={SINKS[i]} icon={ic} side="out" />)}
      <g className="hs-3"><rect x="0" y="192" width="1440" height="8" /></g>
    </Scene>
  );
}

// ---------- Business: a factory, a depot with a lorry that drives in, a high street, and a building going up ----------
export function BusinessScene() {
  return (
    <Scene kind="business">
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.75} width={b.w} height={b.h * 0.75} />)}</g>
      <g className="hs-2">
        {/* the factory */}
        <path d="M24 200V120l40-30v30l40-30v30l40-30v30l40-30v30h24v80z" /><rect x="206" y="40" width="16" height="84" /><rect x="236" y="62" width="13" height="62" />
        {/* the depot */}
        <rect x="290" y="108" width="250" height="92" /><path d="M284 108h262l-8-14H292z" />
        {/* the high street */}
        <rect x="590" y="102" width="98" height="98" /><rect x="692" y="90" width="98" height="110" /><rect x="794" y="108" width="98" height="92" /><rect x="896" y="96" width="98" height="104" />
      </g>
      <g className="hs-acc">{[0, 1, 2].map((i) => <rect key={i} x={308 + i * 78} y="144" width="56" height="48" rx="2" opacity=".28" />)}</g>
      <g className="hs-lamp">{windows(600, 110, 6, 2, 15, 16, 3)}{windows(702, 98, 6, 2, 15, 16, 11)}{windows(804, 116, 6, 2, 15, 16, 19)}{windows(906, 104, 6, 2, 15, 16, 27)}</g>
      {/* awnings and shop windows */}
      {[590, 692, 794, 896].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 3} ${150} h104 l-6 -16 h-92z`} className={i % 2 ? "hs-awn-b" : "hs-awn-a"} />
          <rect x={x + 10} y="154" width="48" height="38" rx="2" className="hs-lamp" opacity=".55" /><rect x={x + 66} y="156" width="22" height="36" rx="2" className="hs-3" />
          <rect className="ec-open" x={x + 28} y="140" width="12" height="6" rx="1.5" style={{ "--i": i }} />
        </g>
      ))}
      {/* a building going up beside a crane */}
      <g className="hs-3">
        <rect x="1250" y="30" width="6" height="170" /><rect x="1130" y="34" width="250" height="5" /><rect x="1240" y="22" width="26" height="12" /><path d="M1150 39 1250 22 1356 39" className="hs-line" /><path d="M1336 39v58" className="hs-line" /><rect x="1328" y="94" width="16" height="9" />
        {[0, 1, 2, 3].map((i) => <rect key={i} className="ec-floor" x="1060" y={170 - i * 30} width="150" height="6" style={{ "--i": i }} />)}
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} className="ec-floor" x={1060 + i * 36} y="80" width="5" height="96" style={{ "--i": 0 }} />)}
        <rect x="0" y="190" width="1440" height="10" />
      </g>
      {/* the lorry, which drives in once and parks at the depot */}
      <g transform="translate(0 150)"><g className="ec-lorry">
        <g className="ec-lorry-body">
          <rect x="0" y="-14" width="82" height="42" rx="3" className="hs-4" /><path d="M82 -4h28l12 18v14H82z" fill="var(--hero-accent)" /><rect x="90" y="0" width="16" height="11" rx="2" fill="#BFE2F0" opacity=".85" />
          {[18, 96].map((cx, k) => <g key={k} className="ec-wheel" style={{ transformOrigin: `${cx}px 32px` }}><circle cx={cx} cy="32" r="9" fill="#14181F" /><circle cx={cx} cy="32" r="3.4" fill="#8A93A3" /><path d={`M${cx} 24v16M${cx - 8} 32h16`} stroke="#8A93A3" strokeWidth="1.2" /></g>)}
        </g>
      </g></g>
      {/* smoke from the chimneys: a few puffs, then the air clears */}
      {[[214, 36], [214, 36], [242, 58]].map(([x, y], i) => <circle key={i} className="ec-puff" cx={x} cy={y} r="9" style={{ "--i": i }} />)}
    </Scene>
  );
}
