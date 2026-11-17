/** @jsxImportSource react */
import "../../heroscene.css";
import "../../econart.css";
import "../../dayscene.css";
import { rnd, windows } from "./sceneKit";
import Clouds from "./Clouds";

// The pictures along the foot of the heading band on the Economy and tax pages: the skyline for the Economy, workplaces for Jobs and pay, the Treasury for Public finances, money
// flowing to public services for Taxes, and a high street, factory and lorry for Business. They are all decoration (hidden from screen readers) and take their colours from the
// page's own accent (--hero-accent), so each page keeps its colour. Each plays once or a few times and then rests; with calmer motion asked for, they are simply finished.

// Every picture but Crime is in daylight (data-day): the sky is then the colour of the whole heading band (heroscene.css), and each picture has its own daytime palette (dayscene.css, servicesart.css).
const DAY = new Set(["education", "transport", "justice", "digital", "economy", "jobs", "finance", "taxes", "business", "energy", "nature", "water", "flood"]);
export const Scene = ({ kind, children }) => (
  <div className="hs-scene" data-kind={kind} data-day={DAY.has(kind) ? "1" : undefined} aria-hidden="true">
    <svg viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice" focusable="false">{children}</svg>
  </div>
);

// The daytime backdrop: a haze at the horizon, a sun that is always drawn whole inside the picture (nothing may be cut off by its top edge), a few drifting clouds and a pale far skyline.
// `sun` is where the sun sits (null for a scene that draws its own), `far` is false where the scene has a skyline of its own.
const SKY = Array.from({ length: 40 }, (_, i) => ({ x: i * 38 - 10 + rnd(i + 4) * 12, w: 20 + rnd(i) * 22, h: 22 + rnd(i + 9) * 52 }));
export const Backdrop = ({ id, day, sun = [150, 58], clouds, far = true }) => (
  <>
    <Defs id={id} />
    {day ? (
      <>
        <defs><linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3F2FC" stopOpacity="0" /><stop offset="1" stopColor="#E3F2FC" stopOpacity=".9" /></linearGradient></defs>
        <rect width="1440" height="200" fill={`url(#${id}-haze)`} />
        {sun && <><circle cx={sun[0]} cy={sun[1]} r="48" fill={`url(#${id}-sun)`} /><circle cx={sun[0]} cy={sun[1]} r="15" fill="#FFEBA6" /></>}
        <Clouds list={clouds} />
        {far && <g className="sv-far">{SKY.map((b, i) => <rect key={i} x={b.x} y={200 - b.h} width={b.w} height={b.h} />)}</g>}
      </>
    ) : (
      <>
        <rect width="1440" height="200" fill={`url(#${id}-glow)`} />
        <g className="hs-1" opacity=".8">{SKY.map((b, i) => <rect key={i} x={b.x} y={200 - b.h} width={b.w} height={b.h} />)}</g>
      </>
    )}
  </>
);

// ---------- Economy: a layered skyline with a crane building a block, and a growth line that climbs through it over a faint chart grid ----------
const BACK = Array.from({ length: 46 }, (_, i) => ({ x: i * 32 - 8 + rnd(i + 7) * 10, w: 22 + rnd(i) * 26, h: 30 + rnd(i + 3) * 66 }));
const MID = Array.from({ length: 30 }, (_, i) => ({ x: i * 50 - 14 + rnd(i + 21) * 14, w: 30 + rnd(i + 5) * 24, h: 44 + rnd(i + 11) * 62 }));
const GROWTH = "M30 170C170 164 250 130 380 128S560 100 700 86 1000 74 1120 56 1300 46 1410 24";
export function EconomyScene() {
  return (
    <Scene kind="economy">
      <Backdrop id="ec" day far={false} clouds={[[570, 24, 0.9, 15], [880, 22, 1, 23], [1340, 40, 0.8, 31]]} />
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
      <g className="ec-crane">
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
      <g className="ec-crane-block">
        {[0, 1, 2].map((i) => <g key={i} className="ec-floor" style={{ "--i": i }}><rect x="232" y={180 - i * 18} width="76" height="5" />{[232, 268, 303].map((x) => <rect key={x} x={x} y={162 - i * 18} width="5" height="18" />)}</g>)}
      </g>
      </g>
      <g className="hs-3 sv-ground"><rect x="0" y="188" width="1440" height="12" /></g>
    </Scene>
  );
}

// Shared by the three richer scenes: a warm glow rising from the horizon and a soft gradient for buildings, both drawn from the page's accent.
export const Defs = ({ id }) => (
  <defs>
    <radialGradient id={`${id}-glow`} cx="50%" cy="100%" r="62%"><stop offset="0" style={{ stopColor: "var(--lamp)", stopOpacity: 0.42 }} /><stop offset="0.55" style={{ stopColor: "var(--a)", stopOpacity: 0.14 }} /><stop offset="1" style={{ stopColor: "var(--a)", stopOpacity: 0 }} /></radialGradient>
    <linearGradient id={`${id}-bld`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--s3)" }} /><stop offset="1" style={{ stopColor: "var(--s2)" }} /></linearGradient>
    <radialGradient id={`${id}-sun`}><stop offset="0" stopColor="#FFD98A" stopOpacity="0.9" /><stop offset="1" stopColor="#FFB45A" stopOpacity="0" /></radialGradient>
    <linearGradient id={`${id}-lt`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--a) 18%, #F4F8FF)" }} /><stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--a) 40%, #E3EEFF)" }} /></linearGradient>
    <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--area, var(--lamp))", stopOpacity: 0.3 }} /><stop offset="1" style={{ stopColor: "var(--area, var(--a))", stopOpacity: 0 }} /></linearGradient>
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#C99A33" /><stop offset="0.5" stopColor="#F7D675" /><stop offset="1" stopColor="#C99A33" /></linearGradient>
  </defs>
);
const POUND = "M2.6 -3.6a2.6 2.6 0 0 0-5 1.1V3M-2.5 3h5.2M-3.7 -.4h4.2";
const Lamp = ({ x }) => (
  <g transform={`translate(${x} 190)`}>
    <path d="M0 0V-44q0-6 8-6" stroke="#55627C" strokeWidth="2.6" fill="none" strokeLinecap="round" /><rect x="5" y="-50" width="8" height="4" rx="2" fill="#8C97AA" />
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
      <Backdrop id="jb" day sun={null} far={false} clouds={[[420, 40, 1, 18], [740, 24, 0.75, 27], [900, 46, 0.9, 4]]} />
      {/* the sun rises from behind the town and stops whole, well inside the picture */}
      <g className="ec-sun"><circle cx="1120" cy="62" r="54" fill="url(#jb-sun)" /><circle cx="1120" cy="62" r="22" fill="#FFEBA6" /></g>
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.8} width={b.w} height={b.h * 0.8} />)}</g>
      {/* the factory: two chimneys that stand on its roof (drawn first so the building covers their feet), a sawtooth roof, a row of windows and a roller door, all centred on the building */}
      <rect fill="#8E4F3C" x="180" y="52" width="14" height="72" /><rect fill="#8E4F3C" x="204" y="68" width="12" height="56" />
      <path fill="#E8E1D6" d="M180 52h14v5h-14zM204 68h12v5h-12z" /><path fill="#C94A3F" d="M180 57h14v4h-14zM204 73h12v4h-12z" />
      <path fill="#B5654A" d="M30 190V112l36-26v26l36-26v26l36-26v26l36-26v26h52v78z" />
      <g stroke="#fff" strokeWidth="2" opacity=".7"><path d="M66 90v18M102 90v18M138 90v18M174 90v18" /></g>
      <g className="hs-glass">{Array.from({ length: 8 }, (_, i) => <rect key={i} className="hs-win" x={45 + i * 22} y="128" width="12" height="11" rx="1" style={{ "--d": `${0.8 + rnd(i + 40) * 3}s` }} />)}</g>
      <rect fill="#7A4030" x="108" y="152" width="40" height="38" rx="1.5" /><path d="M108 162h40M108 172h40M108 182h40" stroke="#5E3022" strokeWidth="1.4" />
      {/* the offices, hospital, town hall, bakery, market, flats and houses, each in its own colour */}
      <rect fill="#7F93B5" x="262" y="58" width="92" height="132" rx="2" /><rect fill="#5A4636" x="298" y="168" width="20" height="22" rx="1.5" />
      <rect fill="#F0E2C2" x="392" y="96" width="134" height="94" rx="2" /><rect fill="#fff" x="438" y="70" width="42" height="28" rx="2" /><rect fill="#5A4636" x="448" y="166" width="22" height="24" rx="1.5" />
      <path fill="#E7C98C" d="M556 190V112l50-34 50 34v78z" /><rect fill="#5A4636" x="598" y="160" width="16" height="30" rx="1.5" />
      <rect fill="#D98B63" x="660" y="124" width="48" height="66" /><rect fill="#5A4636" x="677" y="162" width="14" height="28" rx="1.5" />
      <rect fill="#A9C4A0" x="738" y="112" width="124" height="78" rx="2" /><rect fill="#5A4636" x="790" y="164" width="20" height="26" rx="1.5" />
      <rect fill="#C86F52" x="868" y="130" width="70" height="60" rx="2" /><rect fill="#5A4636" x="893" y="166" width="20" height="24" rx="1.5" />
      <rect fill="#B3A6C4" x="960" y="70" width="70" height="120" rx="2" /><rect fill="#5A4636" x="985" y="170" width="20" height="20" rx="1.5" />
      <rect fill="#B2503A" x="1060" y="112" width="6" height="26" /><rect fill="#B2503A" x="1130" y="110" width="6" height="26" />
      {[[1050, "#E0B85C"], [1118, "#9FC0D6"], [1186, "#D98B63"]].map(([x, c]) => <path key={x} fill={c} d={`M${x} 190v-48l28-22 28 22v48z`} />)}
      {[1078, 1146, 1214].map((c) => <g key={c}><rect className="hs-glass hs-win" x={c - 15} y="150" width="9" height="11" rx="1" style={{ "--d": "2s" }} /><rect className="hs-glass hs-win" x={c + 6} y="150" width="9" height="11" rx="1" style={{ "--d": "2.6s" }} /><rect fill="#5A4636" x={c - 5} y="166" width="10" height="24" rx="1.5" /></g>)}
      {/* the windows of every building, in rows centred on each one */}
      <g className="hs-glass">{windows(270, 70, 6, 7, 14, 14, 2)}{windows(968.5, 82, 5, 7, 12, 14, 8)}{windows(401, 112, 9, 4, 14, 15, 20)}{windows(573.5, 122, 6, 2, 12, 18, 26)}{windows(748, 136, 8, 2, 14, 22, 31)}{windows(669.5, 134, 3, 2, 12, 16, 7)}{windows(876.5, 142, 5, 2, 12, 18, 13)}</g>
      <g fill="#D9453A"><path d="M455.500 74h7v7h7v7h-7v7h-7v-7h-7v-7h7z" /></g><circle fill="#fff" cx="606" cy="100" r="9" />
      <path d="M606 94v6h4" stroke="#3A2A20" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M738 112h124l-8 16H746z" className="hs-awn-a" /><path d="M772 112h8l-3 16h-8zM804 112h8l-3 16h-8zM836 112h8l-3 16h-8z" className="hs-awn-b" />
      <path d="M606 78V58M606 58h14v8h-14" stroke="var(--s3)" strokeWidth="2" fill="var(--a)" />
      {/* a site with a crane */}
      <g className="ec-crane">
        <rect x="1330" y="26" width="5" height="164" /><g className="ec-jib2"><rect x="1250" y="26" width="170" height="4" /><rect x="1322" y="18" width="22" height="9" /><path d="M1262 30v38" stroke="var(--s3)" strokeWidth="1.4" /><rect x="1255" y="66" width="14" height="8" /></g>
        {[0, 1, 2].map((i) => <rect key={i} x="1290" y={184 - i * 32} width="104" height="4" />)}{[0, 1, 2, 3].map((i) => <rect key={i} x={1292 + i * 34} y="82" width="4" height="106" />)}
      </g>
      {[200, 480, 700, 940, 1180, 1400].map((x) => <Lamp key={x} x={x} />)}
      <g className="hs-3 sv-ground"><rect x="0" y="188" width="1440" height="12" /></g>
      {WORKERS.map((w, i) => <g key={i} className="jb-person" transform={`translate(${w.x} 190) scale(1.9)`}><Worker w={w} i={i} /></g>)}
      {[[187, 48], [210, 64]].map(([x, y], i) => <circle key={i} className="ec-puff" cx={x} cy={y} r="9" style={{ "--i": i }} />)}
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
    </g>
  );
}
export function FinanceScene() {
  const tops = [...FIN_L, ...FIN_R].map((s) => `${s.x},${186 - s.n * COIN}`);
  return (
    <Scene kind="finance">
      <Backdrop id="fn" day sun={null} far={false} clouds={[[400, 40, 1, 16], [1010, 34, 1.2, 25], [1270, 62, 0.7, 33]]} />
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
      <g className="fn-recess">{Array.from({ length: 9 }, (_, i) => <rect key={i} x={547 + i * 40.5} y="112" width="20" height="50" rx="2" />)}</g>
      <g className="hs-pillar">{Array.from({ length: 10 }, (_, i) => <g key={i}><rect x={530 + i * 40.5 - 9} y="106" width="18" height="62" rx="2" /><path d={`M${530 + i * 40.5} 110v54`} stroke="var(--s2)" strokeWidth="1.2" opacity=".7" /></g>)}</g>
      <path d="M720 34V6" stroke="#C9D3E6" strokeWidth="2" /><circle cx="720" cy="4.5" r="2.6" fill="#E8C766" /><g className="ec-flag"><path d="M720 6h28l-6 6 6 6h-28z" fill="var(--a)" /></g>
      {/* the same stacks on both sides, rising towards the edges, with a dotted line over their tops */}
      {FIN_L.map((s, i) => <Stack key={`l${i}`} x={s.x} n={s.n} s={i} />)}
      {FIN_R.map((s, i) => <Stack key={`r${i}`} x={s.x} n={s.n} s={FIN_L.length + i} />)}
      <polyline className="hs-dash" points={tops.slice(0, 5).join(" ")} /><polyline className="hs-dash" points={tops.slice(5).join(" ")} />
      <g className="hs-3 sv-ground"><rect x="0" y="190" width="1440" height="10" /></g>
    </Scene>
  );
}

// ---------- Taxes: money is collected from four everyday sources on the left, passes through the Treasury's coin at the centre and is spent on four public services on the right ----------
// One style throughout: round badges with a single-line icon, and soft streams that join them to the centre. Nothing here is drawn to scale or stands for a figure.
const SRC = [262, 372, 482, 592];
const SNK = SRC.map((x) => 1440 - x).reverse();
const ENTRY = [80, 93, 107, 120];
const HUB = { x: 720, y: 100 };
const inStream = (x, i) => `M${x} 142C${x} 92 ${x + (HUB.x - x) * 0.55} ${ENTRY[i]} ${HUB.x - 20} ${ENTRY[i]}`;
const outStream = (x, i) => `M${HUB.x + 20} ${ENTRY[3 - i]}C${x - (x - HUB.x) * 0.55} ${ENTRY[3 - i]} ${x} 92 ${x} 142`;
const ICONS = {
  pay: <><rect x="-9" y="-5.5" width="18" height="11" rx="1.8" /><circle r="2.6" /><path d="M-5.6 -2v4M5.6 -2v4" /></>,
  shop: <><path d="M-7 -3h14l-1 11h-12z" /><path d="M-3.5 -3v-2.2a3.5 3.5 0 0 1 7 0V-3" /></>,
  home: <><path d="M-9 1 0 -8 9 1" /><path d="M-6 -1.5V8h12V-1.5" /><path d="M-2 8V3h4v5" /></>,
  fuel: <path d="M0 -9C5 -2 7 1 7 3.5a7 7 0 0 1-14 0C-7 1 -5 -2 0 -9z" />,
  health: <path d="M-3 -9h6v6h6v6h-6v6h-6v-6h-6v-6h6z" />,
  school: <><path d="M-10 -2 0 -7 10 -2 0 3z" /><path d="M-5 .5v5c0 2.2 10 2.2 10 0v-5" /><path d="M10 -2v7" /></>,
  bus: <><rect x="-8" y="-8" width="16" height="13" rx="2.4" /><path d="M-8 -2h16M-5 5v3M5 5v3" /></>,
  shield: <path d="M0 -9 8 -6v6c0 5-4 8-8 10-4-2-8-5-8-10v-6z" />,
};
function Badge({ x, icon, out, i }) {
  return (
    <g transform={`translate(${x} 160)`}>
      {out && <circle className="ec-pulse" r="19" style={{ "--d": `${3.1 + i * 0.45}s` }} />}
      <circle r="19" fill="var(--s2)" stroke={out ? "#F3C65A" : "var(--lamp)"} strokeWidth="1.5" opacity=".98" />
      <g fill="none" stroke={out ? "#FFE6A8" : "var(--lamp)"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</g>
    </g>
  );
}
const IN_ICONS = ["pay", "shop", "home", "fuel"];
const OUT_ICONS = ["bus", "school", "health", "shield"];
export function TaxScene() {
  return (
    <Scene kind="taxes">
      <Backdrop id="tx" day sun={null} far={false} clouds={[[400, 30, 1, 29], [1050, 22, 0.7, 35], [1300, 36, 1.1, 41]]} />
      <defs>
        <linearGradient id="tx-in" gradientUnits="userSpaceOnUse" x1="240" y1="0" x2="700" y2="0"><stop offset="0" style={{ stopColor: "var(--stream-in)" }} stopOpacity=".2" /><stop offset="1" style={{ stopColor: "var(--stream-in)" }} stopOpacity=".85" /></linearGradient>
        <linearGradient id="tx-out" gradientUnits="userSpaceOnUse" x1="740" y1="0" x2="1200" y2="0"><stop offset="0" style={{ stopColor: "var(--stream-out)" }} stopOpacity=".9" /><stop offset="1" style={{ stopColor: "var(--stream-out)" }} stopOpacity=".25" /></linearGradient>
      </defs>
      {/* the whole diagram sits 16 units higher than its natural place, so it is not crowded against the foot of the band */}
      <g transform="translate(0 -16)">
      <g fill="none" stroke="var(--lamp)" strokeWidth="1" opacity=".09">{[96, 150, 206].map((r) => <circle key={r} cx={HUB.x} cy={HUB.y} r={r} />)}</g>
      {/* the streams: a soft wide band under a finer line, drawing in once, then coins travelling along them */}
      {SRC.map((x, i) => <g key={`i${x}`} fill="none" strokeLinecap="round"><path d={inStream(x, i)} stroke="url(#tx-in)" strokeWidth="14" opacity=".22" /><path className="ec-stream" pathLength="1" d={inStream(x, i)} stroke="url(#tx-in)" strokeWidth="3.2" style={{ "--i": i }} /></g>)}
      {SNK.map((x, i) => <g key={`o${x}`} fill="none" strokeLinecap="round"><path d={outStream(x, i)} stroke="url(#tx-out)" strokeWidth="14" opacity=".22" /><path className="ec-stream" pathLength="1" d={outStream(x, i)} stroke="url(#tx-out)" strokeWidth="3.2" style={{ "--i": i + 4 }} /></g>)}
      {SRC.map((x, i) => [0, 1].map((k) => <circle key={`ci${i}${k}`} r="3.6" className="ec-flow" style={{ offsetPath: `path("${inStream(x, i)}")`, "--d": `${1.4 + i * 0.4 + k * 1.7}s` }} />))}
      {SNK.map((x, i) => [0, 1].map((k) => <circle key={`co${i}${k}`} r="3.6" className="ec-flow" style={{ offsetPath: `path("${outStream(x, i)}")`, "--d": `${2.4 + i * 0.4 + k * 1.7}s` }} />))}
      {SRC.map((x, i) => <Badge key={`bi${x}`} x={x} icon={IN_ICONS[i]} i={i} />)}
      {SNK.map((x, i) => <Badge key={`bo${x}`} x={x} icon={OUT_ICONS[i]} i={i} out />)}
      {/* the Treasury's coin: a ticked rim that turns once, a gold ring and the pound sign */}
      <g transform={`translate(${HUB.x} ${HUB.y})`}>
        <circle r="92" fill="url(#tx-sun)" opacity=".4" />
        <circle r="52" fill="var(--s2)" stroke="var(--a)" strokeWidth="2" />
        <g className="ec-vwheel" style={{ transformOrigin: "0px 0px" }} stroke="var(--lamp)" strokeWidth="1.6" strokeLinecap="round" opacity=".7">
          {Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return <path key={i} d={`M${Math.cos(a) * 43} ${Math.sin(a) * 43}L${Math.cos(a) * 47.5} ${Math.sin(a) * 47.5}`} />; })}
        </g>
        <circle r="36" fill="var(--s3)" stroke="#E8C766" strokeWidth="2.6" />
        <circle r="30" fill="none" stroke="#E8C766" strokeWidth="1" opacity=".55" />
        <path d={POUND} transform="scale(3.4)" fill="none" stroke="#F7D675" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      </g>
      <g className="hs-3 sv-ground"><rect x="0" y="190" width="1440" height="10" /></g>
    </Scene>
  );
}

// ---------- Business: a factory, a depot with a lorry that drives in, a high street, and a building going up ----------
export function BusinessScene() {
  return (
    <Scene kind="business">
      <Backdrop id="bz" day sun={[1010, 52]} far={false} clouds={[[420, 36, 1, 22], [760, 24, 0.8, 37], [110, 24, 0.8, 12]]} />
      <g className="hs-1">{BACK.map((b, i) => <rect key={i} x={b.x} y={200 - b.h * 0.75} width={b.w} height={b.h * 0.75} />)}</g>
      {/* the factory's chimneys stand on its roof (drawn first so the building covers their feet) */}
      <g className="hs-2"><rect x="190" y="50" width="16" height="76" /><rect x="214" y="66" width="13" height="60" /></g>
      <path fill="#E8E1D6" d="M190 50h16v5h-16zM214 66h13v5h-13z" /><path fill="#C94A3F" d="M190 55h16v4h-16zM214 71h13v4h-13z" />
      <g className="hs-2">
        {/* the factory: a sawtooth roof that runs on to a flat part under the chimneys */}
        <path d="M24 200V120l40-30v30l40-30v30l40-30v30l40-30v30h48v80z" />
        {/* the depot */}
        <rect className="bz-depot" x="290" y="108" width="250" height="92" /><path className="bz-depot" d="M284 108h262l-8-14H292z" />
        {/* the high street */}
        <rect x="590" y="102" width="98" height="98" /><rect x="692" y="90" width="98" height="110" /><rect x="794" y="108" width="98" height="92" /><rect x="896" y="96" width="98" height="104" />
      </g>
      {/* the factory's roof glazing, a row of windows, a roller door and a sign, all centred on the building */}
      <g stroke="#fff" strokeWidth="2" opacity=".7"><path d="M64 94v22M104 94v22M144 94v22M184 94v22" /></g>
      <g className="hs-lamp">{Array.from({ length: 8 }, (_, i) => <rect key={i} className="hs-win" x={45 + i * 22} y="134" width="12" height="12" rx="1" style={{ "--d": `${0.8 + rnd(i + 50) * 3}s` }} />)}</g>
      <rect className="hs-acc" x="100" y="150" width="56" height="12" rx="2" opacity=".9" /><path d="M120 156h16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <rect fill="#5E3022" x="108" y="166" width="40" height="34" rx="1.5" /><path d="M108 175h40M108 184h40M108 193h40" stroke="#472418" strokeWidth="1.4" />
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
      <g className="ec-crane">
        <rect x="1250" y="30" width="6" height="170" /><rect x="1130" y="34" width="250" height="5" /><rect x="1240" y="22" width="26" height="12" /><path d="M1150 39 1250 22 1356 39" className="hs-line" /><path d="M1160 39v38" className="hs-line" /><rect x="1146" y="77" width="28" height="7" />
        {[0, 1, 2, 3].map((i) => <rect key={i} className="ec-floor" x="1060" y={184 - i * 30} width="150" height="6" style={{ "--i": i }} />)}
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} className="ec-floor" x={1060 + i * 36} y="94" width="5" height="96" style={{ "--i": 0 }} />)}
      </g>
      <g className="hs-3 sv-ground"><rect x="0" y="190" width="1440" height="10" /></g>
      {/* the lorry, which drives in once and parks at the depot */}
      <g transform="translate(0 150)"><g className="ec-lorry">
        <g className="ec-lorry-body">
          <rect x="0" y="-14" width="82" height="42" rx="3" className="hs-4" /><path d="M82 -4h28l12 18v14H82z" fill="var(--hero-accent)" /><rect x="90" y="0" width="16" height="11" rx="2" fill="#BFE2F0" opacity=".85" />
          {[18, 96].map((cx, k) => <g key={k} className="ec-wheel" style={{ transformOrigin: `${cx}px 32px` }}><circle cx={cx} cy="32" r="9" fill="#14181F" /><circle cx={cx} cy="32" r="3.4" fill="#8A93A3" /><path d={`M${cx} 24v16M${cx - 8} 32h16`} stroke="#8A93A3" strokeWidth="1.2" /></g>)}
        </g>
      </g></g>
      {/* smoke from the chimneys: a few puffs, then the air clears */}
      {[[198, 46], [198, 46], [220, 62]].map(([x, y], i) => <circle key={i} className="ec-puff" cx={x} cy={y} r="9" style={{ "--i": i }} />)}
    </Scene>
  );
}
