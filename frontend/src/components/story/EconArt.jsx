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

// ---------- Economy: a layered skyline with a crane building a block, and a growth line that climbs through it over a faint chart grid ----------
const BACK = Array.from({ length: 46 }, (_, i) => ({ x: i * 32 - 8 + rnd(i + 7) * 10, w: 22 + rnd(i) * 26, h: 30 + rnd(i + 3) * 66 }));
const MID = Array.from({ length: 30 }, (_, i) => ({ x: i * 50 - 14 + rnd(i + 21) * 14, w: 30 + rnd(i + 5) * 24, h: 44 + rnd(i + 11) * 62 }));
const GROWTH = "M30 170C170 164 250 130 380 128S560 100 700 86 1000 74 1120 56 1300 46 1410 24";
export function EconomyScene() {
  return (
    <Scene kind="economy">
      <Defs id="ec" />
      <rect width="1440" height="200" fill="url(#ec-glow)" />
      <g className="hs-dash">{[48, 92, 136].map((y) => <path key={y} d={`M0 ${y}H1440`} />)}</g>
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h} width={b.w} height={b.h} />)}</g>
      <g fill="url(#ec-bld)" opacity=".55">{MID.map((b, i) => <rect key={i} x={b.x} y={200 - b.h} width={b.w} height={b.h} />)}</g>
      {/* the landmark towers: a slab with a mast, a shard, a rounded tower, a stepped tower and a pyramid-topped one, each with a lit edge */}
      <g fill="url(#ec-bld)">
        <path d="M600 200 632 52 664 200z" />
        <path d="M744 200V96c0-30 12-54 26-70 14 16 26 40 26 70v104z" />
        <rect x="906" y="102" width="40" height="98" />
        <rect x="1032" y="86" width="56" height="114" /><path d="M1032 86 1060 54 1088 86z" />
        <path d="M1220 200V92h14V78h18V62h18v16h18v14h14v108z" />
      </g>
      <g stroke="var(--lamp)" strokeWidth="1.4" opacity=".35" fill="none"><path d="M600 200 632 52M744 96V200M1032 86V200M1220 92V200" /></g>
      <g className="hs-lamp">{windows(1038, 96, 4, 7, 12, 14, 9)}{windows(1226, 100, 4, 7, 12, 14, 17)}{windows(912, 112, 3, 6, 11, 14, 23)}{windows(750, 110, 4, 6, 11, 14, 31)}</g>
      <g className="hs-warm"><circle cx="1060" cy="52" r="3" /><circle cx="1252" cy="60" r="3" /></g>
      {/* the chart: a soft area under the line, then the line itself drawing through the skyline and a ripple at each marked point */}
      <path className="ec-area" d={`${GROWTH}V200H30Z`} fill="url(#ec-area)" />
      <path className="ec-growth" pathLength="1" d={GROWTH} />
      {[[380, 128], [700, 86], [1120, 56], [1410, 24]].map(([x, y], i) => (
        <g key={i}>
          <circle className="ec-halo" cx={x} cy={y} r="6" style={{ "--i": i }} />
          <circle className="ec-dot" cx={x} cy={y} r={i === 3 ? 7 : 5} style={{ "--i": i }} />
        </g>
      ))}
      {/* a tower crane lifting a girder over a block going up floor by floor */}
      <g transform="translate(250 0)">
      <g className="hs-3">
        <path d="M147 40V200M159 40V200" className="hs-line" />
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${i % 2 ? 159 : 147} ${44 + i * 16}L${i % 2 ? 147 : 159} ${60 + i * 16}`} className="hs-line" />)}
        <rect x="140" y="196" width="26" height="4" />
        <g className="ec-jib">
          <rect x="30" y="38" width="280" height="6" />
          <path d="M44 38 62 22 80 38 98 22 116 38 134 22 152 38 170 22 188 38 206 22 224 38 242 22 260 38 278 22 296 38" className="hs-line" />
          <rect x="132" y="16" width="40" height="22" rx="3" /><rect x="138" y="21" width="14" height="10" rx="1" fill="var(--lamp)" opacity=".7" />
          <rect x="34" y="44" width="28" height="18" rx="2" />
          <path d="M262 44v54" className="hs-line" /><path d="M254 98h16" className="hs-line" />
          <rect className="hs-acc" x="238" y="102" width="48" height="8" rx="1" />
        </g>
      </g>
      <g className="hs-3">
        {[0, 1, 2].map((i) => <g key={i} className="ec-floor" style={{ "--i": i }}><rect x="232" y={180 - i * 18} width="76" height="5" />{[232, 268, 303].map((x) => <rect key={x} x={x} y={162 - i * 18} width="5" height="18" />)}</g>)}
      </g>
      </g>
      <g className="hs-3"><rect x="0" y="188" width="1440" height="12" /></g>
    </Scene>
  );
}

// Shared by the three richer scenes: a warm glow rising from the horizon and a soft gradient for buildings, both drawn from the page's accent.
const Defs = ({ id }) => (
  <defs>
    <radialGradient id={`${id}-glow`} cx="50%" cy="100%" r="62%"><stop offset="0" style={{ stopColor: "var(--lamp)", stopOpacity: 0.42 }} /><stop offset="0.55" style={{ stopColor: "var(--a)", stopOpacity: 0.14 }} /><stop offset="1" style={{ stopColor: "var(--a)", stopOpacity: 0 }} /></radialGradient>
    <linearGradient id={`${id}-bld`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--s3)" }} /><stop offset="1" style={{ stopColor: "var(--s2)" }} /></linearGradient>
    <radialGradient id={`${id}-sun`}><stop offset="0" stopColor="#FFD98A" stopOpacity="0.9" /><stop offset="1" stopColor="#FFB45A" stopOpacity="0" /></radialGradient>
    <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--lamp)", stopOpacity: 0.3 }} /><stop offset="1" style={{ stopColor: "var(--a)", stopOpacity: 0 }} /></linearGradient>
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#C99A33" /><stop offset="0.5" stopColor="#F7D675" /><stop offset="1" stopColor="#C99A33" /></linearGradient>
  </defs>
);
const POUND = "M2.6 -3.6a2.6 2.6 0 0 0-5 1.1V3M-2.5 3h5.2M-3.7 -.4h4.2";
const Lamp = ({ x, d }) => (
  <g transform={`translate(${x} 190)`}>
    <circle className="ec-lampglow" cy="-46" r="15" fill="#FFD98A" style={{ "--d": `${d}s` }} />
    <path d="M0 0V-44q0-6 8-6" stroke="var(--s3)" strokeWidth="2.6" fill="none" strokeLinecap="round" /><rect x="5" y="-50" width="8" height="4" rx="2" fill="#FFE6A8" />
  </g>
);

// ---------- Jobs and pay: a town at sunrise, its workplaces lit, and people in many jobs walking in to work with a pay coin over each ----------
const TONES = ["#EBB98F", "#C48B5F", "#8C5C3E", "#F2CDA8"];
const KIT = { builder: { top: "#F58A2E", legs: "#2A3350" }, office: { top: "#56617D", legs: "#232B40" }, nurse: { top: "#2FB5A8", legs: "#EEF2F6" }, teacher: { top: "#3D4C80", legs: "#232B40" }, chef: { top: "#F4F3EE", legs: "#3A4259" } };
const WORKERS = [
  { x: 112, kind: "builder", tone: 0 }, { x: 236, kind: "office", tone: 1 }, { x: 396, kind: "nurse", tone: 2 }, { x: 534, kind: "teacher", tone: 3 }, { x: 690, kind: "chef", tone: 1 },
  { x: 832, kind: "office", tone: 0 }, { x: 962, kind: "builder", tone: 2 }, { x: 1100, kind: "nurse", tone: 3 }, { x: 1236, kind: "teacher", tone: 1 }, { x: 1342, kind: "chef", tone: 0 },
];
function Worker({ w, i }) {
  const k = KIT[w.kind]; const skin = TONES[w.tone];
  return (
    <g className="ec-walk" style={{ "--i": i }}>
      <g className="ec-bob" style={{ "--i": i }}>
        <g className="ec-leg" style={{ "--i": i, transformOrigin: "-2.8px -10px" }}><rect x="-4.7" y="-10" width="3.8" height="10.4" rx="1.7" fill={k.legs} /></g>
        <g className="ec-leg ec-leg-b" style={{ "--i": i, transformOrigin: "2.8px -10px" }}><rect x="0.9" y="-10" width="3.8" height="10.4" rx="1.7" fill={k.legs} /></g>
        <rect x="-6.2" y="-25" width="12.4" height="16" rx="4" fill={k.top} />
        {w.kind === "builder" && <path d="M-6 -17h12M-6 -13.5h12" stroke="#E8ECF2" strokeWidth="1.1" />}
        {w.kind === "nurse" && <path d="M-1 -23h2v5h-2zM-3.5 -21.5h7v2h-7z" fill="#fff" />}
        {w.kind === "office" && <path d="M0 -25l1.6 4-1.6 5-1.6-5z" fill="#C94A3F" />}
        {w.kind === "teacher" && <rect x="5" y="-19" width="8" height="10" rx="1" fill="#F3C65A" transform="rotate(10 8 -14)" />}
        {w.kind === "office" && <rect x="5" y="-12" width="9" height="7" rx="1.4" fill="#7A5230" />}
        <circle cx="0" cy="-30" r="4.8" fill={skin} />
        {w.kind === "builder" && <path d="M-6 -31a6 5.6 0 0 1 12 0zM-7.6 -31h15.2" fill="#FFD23F" stroke="#FFD23F" strokeWidth="1.6" />}
        {w.kind === "chef" && <path d="M-4 -33h8v-4.5a4.2 4.2 0 0 0-3.4-3.8 4 4 0 0 0-5 .8 4 4 0 0 0 .4 7z" fill="#fff" />}
        {w.kind === "nurse" && <path d="M-5 -31a5 5 0 0 1 10 0c0-1-4-2.4-5-2.4s-5 1.4-5 2.4z" fill="#3A2A20" />}
        {(w.kind === "office" || w.kind === "teacher") && <path d="M-5 -31.4a5 4.6 0 0 1 10 0c-2-1.6-8-1.6-10 0z" fill={w.tone === 3 ? "#8A6A3A" : "#2B2118"} />}
      </g>
      <g className="ec-coin" style={{ "--i": i }}><circle cx="0" cy="-47" r="7.4" fill="#F3C65A" stroke="#B88A2C" strokeWidth="1" /><path transform="translate(0 -47)" d={POUND} fill="none" stroke="#7A5A10" strokeWidth="1.3" strokeLinecap="round" /></g>
    </g>
  );
}
export function JobsScene() {
  return (
    <Scene kind="jobs">
      <Defs id="jb" />
      <rect width="1440" height="200" fill="url(#jb-glow)" />
      <g className="ec-sun"><circle cx="1010" cy="118" r="120" fill="url(#jb-sun)" /><circle cx="1010" cy="118" r="38" fill="#FFC66B" opacity=".92" /></g>
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.8} width={b.w} height={b.h * 0.8} />)}</g>
      <g fill="url(#jb-bld)">
        <path d="M30 190V112l36-26v26l36-26v26l36-26v26l36-26v26h26v78z" /><rect x="204" y="52" width="15" height="74" /><rect x="230" y="74" width="12" height="52" />
        <rect x="262" y="58" width="92" height="132" rx="2" />
        <rect x="392" y="96" width="134" height="94" rx="2" /><rect x="438" y="70" width="42" height="28" rx="2" />
        <path d="M556 190V112l50-34 50 34v78z" /><rect x="660" y="124" width="48" height="66" />
        <rect x="738" y="112" width="124" height="78" rx="2" /><rect x="868" y="130" width="70" height="60" rx="2" />
        <rect x="960" y="70" width="70" height="120" rx="2" />
        <path d="M1050 190v-48l28-22 28 22v48zM1118 190v-48l28-22 28 22v48zM1186 190v-48l28-22 28 22v48z" /><rect x="1060" y="108" width="6" height="14" /><rect x="1130" y="106" width="6" height="14" />
      </g>
      {/* the factory's roof glazing and the windows of every building, warm where someone is in */}
      <g stroke="#FFD98A" strokeWidth="2" opacity=".5"><path d="M44 112h14M80 112h14M116 112h14M152 112h14" /></g>
      <g className="hs-warm">{windows(270, 70, 6, 9, 14, 14, 2)}{windows(970, 82, 5, 8, 12, 14, 8)}{windows(401, 112, 9, 5, 14, 15, 20)}{windows(566, 128, 8, 4, 12, 14, 26)}{windows(748, 118, 8, 3, 14, 17, 31)}</g>
      <g fill="#FFE6A8"><path d="M451 74h8v8h8v8h-8v8h-8v-8h-8v-8h8z" /><circle cx="606" cy="100" r="9" /></g>
      <path d="M606 94v6h4" stroke="#3A2A20" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M738 112h124l-8 16H746z" className="hs-awn-a" /><path d="M772 112h8l-3 16h-8zM804 112h8l-3 16h-8zM836 112h8l-3 16h-8z" className="hs-awn-b" />
      <path d="M606 78V58M606 58h14v8h-14" stroke="var(--s3)" strokeWidth="2" fill="var(--a)" />
      {/* a site with a crane */}
      <g className="hs-3">
        <rect x="1330" y="26" width="5" height="164" /><g className="ec-jib2"><rect x="1250" y="26" width="170" height="4" /><rect x="1322" y="18" width="22" height="9" /><path d="M1262 30v38" stroke="var(--s3)" strokeWidth="1.4" /><rect x="1255" y="66" width="14" height="8" /></g>
        {[0, 1, 2].map((i) => <rect key={i} x="1290" y={176 - i * 32} width="104" height="4" />)}{[0, 1, 2, 3].map((i) => <rect key={i} x={1292 + i * 34} y="82" width="4" height="98" />)}
      </g>
      {[200, 480, 700, 940, 1180, 1400].map((x, i) => <Lamp key={x} x={x} d={2 + i * 0.6} />)}
      <g className="hs-3"><rect x="0" y="188" width="1440" height="12" /></g>
      <rect x="0" y="188" width="1440" height="2" fill="#FFD98A" opacity=".3" />
      {WORKERS.map((w, i) => <g key={i} transform={`translate(${w.x} 190) scale(1.9)`}><Worker w={w} i={i} /></g>)}
      {[[211, 52], [236, 74]].map(([x, y], i) => <circle key={i} className="ec-puff" cx={x} cy={y} r="9" style={{ "--i": i }} />)}
    </Scene>
  );
}

// ---------- Public finances: the Treasury under a flag, the Budget box taking in coins, scales that settle, and stacks that climb ----------
// ---------- Public finances: the Treasury at the centre with the books balanced either side: matching rows of coin stacks, the tallest at the edges, joined by a dotted line ----------
const FIN_L = [{ x: 170, n: 13 }, { x: 234, n: 11 }, { x: 298, n: 9 }, { x: 362, n: 7 }, { x: 426, n: 5 }];
const FIN_R = FIN_L.map((s) => ({ x: 1440 - s.x, n: s.n })).reverse();
const COIN = 7;
function Stack({ x, n, s }) {
  return (
    <g transform={`translate(${x} 190)`}>
      {Array.from({ length: n }, (_, k) => (
        <g key={k} className="ec-coinstack" style={{ "--d": `${0.5 + s * 0.22 + k * 0.06}s` }}>
          <ellipse cx="0" cy={-k * COIN - 3} rx="22" ry="6" fill="#B88A2C" /><ellipse cx="0" cy={-k * COIN - 5} rx="22" ry="6" fill="url(#fn-gold)" />
        </g>
      ))}
      <circle className="ec-glint" cx="-7" cy={-n * COIN - 4} r="2.2" fill="#fff" style={{ "--d": `${2.4 + s * 0.25}s` }} />
    </g>
  );
}
export function FinanceScene() {
  const tops = [...FIN_L, ...FIN_R].map((s) => `${s.x},${186 - s.n * COIN}`);
  return (
    <Scene kind="finance">
      <Defs id="fn" />
      <rect width="1440" height="200" fill="url(#fn-glow)" />
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.6} width={b.w} height={b.h * 0.6} />)}</g>
      {/* the Treasury: three steps, ten columns, an entablature and a pediment with a rising sun, a flag on top */}
      <g fill="url(#fn-bld)">
        <rect x="476" y="184" width="488" height="8" /><rect x="492" y="176" width="456" height="8" /><rect x="506" y="168" width="428" height="8" />
        <rect x="516" y="104" width="408" height="64" />
        <rect x="504" y="94" width="432" height="12" /><path d="M496 94 720 34 944 94z" />
      </g>
      <path d="M538 90 720 42 902 90z" fill="var(--s2)" />
      <g stroke="#FFD98A" strokeWidth="1.8" opacity=".6" strokeLinecap="round">{Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.12 + i * 0.095); return <path key={i} d={`M720 86L${720 - Math.cos(a) * 92} ${86 - Math.sin(a) * 40}`} />; })}</g>
      <circle cx="720" cy="86" r="9" fill="#FFD98A" />
      <g fill="#FFD98A" opacity=".5">{Array.from({ length: 9 }, (_, i) => <rect key={i} x={547 + i * 40.5} y="112" width="20" height="50" rx="2" />)}</g>
      <g className="hs-pillar">{Array.from({ length: 10 }, (_, i) => <g key={i}><rect x={530 + i * 40.5 - 9} y="106" width="18" height="62" rx="2" /><path d={`M${530 + i * 40.5} 110v54`} stroke="var(--s2)" strokeWidth="1.2" opacity=".7" /></g>)}</g>
      <path d="M720 34V6" stroke="#C9D3E6" strokeWidth="2" /><circle cx="720" cy="4.5" r="2.6" fill="#E8C766" /><g className="ec-flag"><path d="M720 6h28l-6 6 6 6h-28z" fill="var(--a)" /></g>
      {/* the same stacks on both sides, rising towards the edges, with a dotted line over their tops */}
      {FIN_L.map((s, i) => <Stack key={`l${i}`} x={s.x} n={s.n} s={i} />)}
      {FIN_R.map((s, i) => <Stack key={`r${i}`} x={s.x} n={s.n} s={FIN_L.length + i} />)}
      <polyline className="hs-dash" points={tops.slice(0, 5).join(" ")} /><polyline className="hs-dash" points={tops.slice(5).join(" ")} />
      <g className="hs-3"><rect x="0" y="190" width="1440" height="10" /></g>
    </Scene>
  );
}

// ---------- Taxes: the Treasury's vault door at the centre, coins streaming in from pay, shops, homes and fuel and out to hospitals, schools, roads and defence ----------
// Kept well inside the picture (the band crops its ends on narrower screens) and evenly spaced either side of the vault.
const SRC = [250, 366, 482, 598];
const SNK = [842, 958, 1074, 1190];
const inRibbon = (x) => `M${x} 124C${x} 58 540 52 652 108`;
const outRibbon = (x) => `M788 108C900 52 ${x} 58 ${x} 124`;
function Source({ x, kind }) {
  return (
    <g transform={`translate(${x} 190) scale(1.28)`}>
      {kind === 0 && <g><rect x="-26" y="-34" width="52" height="34" rx="4" fill="var(--s4)" /><path d="M-26 -34 0 -14 26 -34" fill="none" stroke="var(--s2)" strokeWidth="2" /><circle cx="0" cy="-12" r="8" fill="#F3C65A" stroke="#B88A2C" /><path transform="translate(0 -12)" d={POUND} fill="none" stroke="#7A5A10" strokeWidth="1.3" strokeLinecap="round" /></g>}
      {kind === 1 && <g><rect x="-28" y="-44" width="56" height="44" rx="2" fill="url(#tx-bld)" /><path d="M-32 -44h64l-6 14h-52z" className="hs-awn-a" /><path d="M-16 -44h6l-2 14h-6zM2 -44h6l-2 14h-6zM20 -44h6l-2 14h-6z" className="hs-awn-b" /><rect x="-22" y="-26" width="26" height="20" rx="2" fill="#FFD98A" opacity=".8" /><rect x="10" y="-26" width="12" height="26" rx="2" fill="var(--s2)" /></g>}
      {kind === 2 && <g><rect x="-24" y="-30" width="48" height="30" fill="url(#tx-bld)" /><path d="M-30 -30 0 -54 30 -30z" fill="var(--s3)" /><rect x="12" y="-54" width="7" height="14" fill="var(--s3)" /><rect x="-16" y="-22" width="14" height="14" rx="2" fill="#FFD98A" opacity=".85" /><rect x="6" y="-22" width="12" height="22" rx="2" fill="var(--s2)" /></g>}
      {kind === 3 && <g><rect x="-13" y="-46" width="26" height="46" rx="4" fill="url(#tx-bld)" /><rect x="-9" y="-40" width="18" height="12" rx="2" fill="#FFD98A" opacity=".85" /><rect x="-16" y="-4" width="32" height="4" rx="2" fill="var(--s3)" /><path d="M13 -34h5q6 0 6 6v18" fill="none" stroke="var(--s4)" strokeWidth="2.6" strokeLinecap="round" /></g>}
    </g>
  );
}
function Sink({ x, kind, i }) {
  return (
    <g transform={`translate(${x} 190) scale(1.28)`}>
      <ellipse className="ec-arrive" cx="0" cy="-22" rx="52" ry="40" fill="#F3C65A" style={{ "--d": `${3.4 + i * 0.5}s` }} />
      {kind === 0 && <g><rect x="-32" y="-46" width="64" height="46" rx="2" fill="url(#tx-bld)" /><rect x="-10" y="-60" width="20" height="16" rx="2" fill="url(#tx-bld)" /><path d="M-3 -58h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="#FFE6A8" /><rect x="-26" y="-36" width="10" height="10" rx="1" fill="#FFD98A" opacity=".8" /><rect x="16" y="-36" width="10" height="10" rx="1" fill="#FFD98A" opacity=".8" /><rect x="-6" y="-16" width="12" height="16" rx="1" fill="var(--s2)" /></g>}
      {kind === 1 && <g><path d="M-34 0v-34l34-20 34 20v34z" fill="url(#tx-bld)" /><circle cx="0" cy="-34" r="8" fill="#FFE6A8" /><path d="M0 -39v5h4" stroke="#3A2A20" strokeWidth="1.5" fill="none" strokeLinecap="round" /><rect x="-24" y="-20" width="10" height="12" rx="1" fill="#FFD98A" opacity=".8" /><rect x="14" y="-20" width="10" height="12" rx="1" fill="#FFD98A" opacity=".8" /><path d="M0 -54V-68h12v7H0" stroke="var(--s3)" strokeWidth="2" fill="var(--a)" /></g>}
      {kind === 2 && <g><path d="M-40 -18h80v6h-80z" fill="var(--s4)" /><path d="M-40 -12v12h20a10 10 0 0 1 20 0 10 10 0 0 1 20 0h20v-12z" fill="url(#tx-bld)" /><path d="M-34 -18v-12M-14 -18v-12M6 -18v-12M26 -18v-12" stroke="var(--s3)" strokeWidth="2" /><path d="M-30 -30h60" stroke="var(--s3)" strokeWidth="2" /><path d="M-34 -15h68" stroke="#FFD98A" strokeWidth="1.4" strokeDasharray="5 6" opacity=".8" /></g>}
      {kind === 3 && <g><path d="M0 0V-50" stroke="var(--s3)" strokeWidth="3" /><path d="M-24 -48h48v18c0 12-10 20-24 26-14-6-24-14-24-26z" fill="url(#tx-bld)" stroke="#E8C766" strokeWidth="2" /><path d="M0 -42l3 7h7l-5.6 4.4 2.2 7-6.6-4.2-6.6 4.2 2.2-7-5.6-4.4h7z" fill="#FFE6A8" /></g>}
    </g>
  );
}
export function TaxScene() {
  return (
    <Scene kind="taxes">
      <Defs id="tx" />
      <rect width="1440" height="200" fill="url(#tx-glow)" />
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.55} width={b.w} height={b.h * 0.55} />)}</g>
      {SRC.map((x) => <path key={`i${x}`} d={inRibbon(x)} className="ec-ribbon" />)}
      {SNK.map((x) => <path key={`o${x}`} d={outRibbon(x)} className="ec-ribbon" />)}
      {SRC.map((x) => <path key={`ip${x}`} d={inRibbon(x)} className="ec-pipe" />)}
      {SNK.map((x) => <path key={`op${x}`} d={outRibbon(x)} className="ec-pipe" />)}
      {SRC.map((x, i) => [0, 1, 2].map((k) => <circle key={`ci${i}${k}`} r="5.6" className="ec-flow" style={{ offsetPath: `path("${inRibbon(x)}")`, "--d": `${0.4 + i * 0.45 + k * 1.5}s` }} />))}
      {SNK.map((x, i) => [0, 1, 2].map((k) => <circle key={`co${i}${k}`} r="5.6" className="ec-flow" style={{ offsetPath: `path("${outRibbon(x)}")`, "--d": `${1.5 + i * 0.45 + k * 1.5}s` }} />))}
      {SRC.map((x, i) => <Source key={x} x={x} kind={i} />)}
      {SNK.map((x, i) => <Sink key={x} x={x} kind={i} i={i} />)}
      {/* the vault door: bolts, a spoked wheel that turns once, and a gold boss */}
      <g transform="translate(720 112) scale(1.12)">
        <circle r="84" fill="url(#tx-sun)" opacity=".5" />
        <circle r="60" className="hs-2" /><circle r="60" className="ec-node-ring" /><circle r="48" className="hs-3" />
        {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * 54} cy={Math.sin(a) * 54} r="2.4" fill="#FFE6A8" />; })}
        <g className="ec-vwheel" style={{ transformOrigin: "0px 0px" }}>
          {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <path key={i} d={`M0 0L${Math.cos(a) * 40} ${Math.sin(a) * 40}`} stroke="#E8C766" strokeWidth="5" strokeLinecap="round" />; })}
          {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * 40} cy={Math.sin(a) * 40} r="5" fill="#F7D675" />; })}
          <circle r="26" fill="none" stroke="#E8C766" strokeWidth="3.4" />
        </g>
        <circle r="14" fill="url(#tx-gold)" /><path d={POUND} transform="scale(1.5)" fill="none" stroke="#7A5A10" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g className="hs-3"><rect x="0" y="190" width="1440" height="10" /></g>
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
