/** @jsxImportSource react */

// A small picture for the top of each game's card: white line drawing on the card's own colour, with one warm touch. Every picture sits in a 240 by 120 box,
// keeps its upper left clear for the card's tags, and is decoration only, so it is hidden from screen readers.
const W = "#fff";
const T = "rgba(255,255,255,0.18)";
const T2 = "rgba(255,255,255,0.36)";
const A = "#FFD36B";
const DK = "rgba(10,17,40,0.4)";
const BG = { fill: "var(--pn)" };

const point = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
const wedge = (cx, cy, r, a0, a1) => {
  const [x0, y0] = point(cx, cy, r, a0);
  const [x1, y1] = point(cx, cy, r, a1);
  return `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
};
const star = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => point(cx, cy, i % 2 ? r * 0.45 : r, -90 + i * 36).map((v) => v.toFixed(1)).join(",")).join(" ");

const ART = {
  decide: (
    <>
      <path d="M24 112 H216" />
      <path d="M36 88 L57 72 L78 88 V112 H36Z" fill={T2} />
      <path d="M88 74 L113 54 L138 74 V112 H88Z" fill={T2} /><path d="M100 82 V112 M113 82 V112 M126 82 V112" />
      <path d="M152 82 H208 V112 H152Z" fill={T2} /><path d="M172 82 V46 L180 30 L188 46 V82" fill={W} stroke={W} /><circle cx="180" cy="58" r="4.500" fill="var(--pn)" stroke="none" />
      <circle cx="57" cy="62" r="3.500" fill={A} stroke="none" /><circle cx="113" cy="44" r="3.500" fill={A} stroke="none" /><circle cx="198" cy="40" r="3.500" fill={A} stroke="none" />
    </>
  ),
  spot: (
    <>
      {[96, 80, 64].map((y) => <path key={y} d={`M110 ${y - 14} L170 ${y} L110 ${y + 14} L50 ${y}Z`} {...BG} stroke="none" />)}
      {[96, 80, 64].map((y, i) => <path key={`s${y}`} d={`M110 ${y - 14} L170 ${y} L110 ${y + 14} L50 ${y}Z`} fill={i === 2 ? T2 : T} />)}
      <circle cx="178" cy="86" r="15" stroke={A} strokeWidth="4.500" {...BG} /><circle cx="178" cy="86" r="15" fill={T} stroke="none" /><path d="M189 97 L206 112" stroke={A} strokeWidth="5" />
    </>
  ),
  law: (
    <>
      <path d="M36 112 V100 H70 V88 H104 V76 H138 V64 H172 V52 H206 V112 Z" fill={T2} />
      <rect x="170" y="14" width="26" height="32" rx="3" fill={W} stroke="none" /><path d="M176 22 H190 M176 28 H190 M176 34 H184" stroke={DK} strokeWidth="2.500" /><path d="M180 40 L184 44 L192 34" stroke={A} strokeWidth="3.500" />
    </>
  ),
  pingpong: (
    <>
      <rect x="28" y="66" width="40" height="46" rx="8" fill={T2} /><rect x="172" y="66" width="40" height="46" rx="8" fill={T2} />
      <path d="M68 76 Q120 14 172 76" strokeDasharray="1 8" strokeWidth="4" />
      <path d="M172 100 Q120 126 68 100" strokeDasharray="1 8" strokeWidth="4" stroke={A} />
      <rect x="106" y="30" width="28" height="34" rx="3" fill={W} stroke="none" transform="rotate(-8 120 47)" /><path d="M112 40 H128 M112 47 H128 M112 54 H122" stroke={DK} strokeWidth="2.500" transform="rotate(-8 120 47)" />
    </>
  ),
  majority: (
    <>
      {[[30, 9], [46, 13], [62, 17]].flatMap(([r, n], row) => Array.from({ length: n }, (_, i) => {
        const [x, y] = point(120, 112, r, 180 + (i * 180) / (n - 1));
        return <circle key={`${row}-${i}`} cx={x} cy={y} r="5" fill={i / (n - 1) < 0.52 ? A : T2} stroke="none" />;
      }))}
      <path d="M120 40 V112" strokeDasharray="1 7" strokeWidth="3.500" />
    </>
  ),
  coalition: (
    <>
      <circle cx="102" cy="84" r="26" fill={T} /><circle cx="138" cy="84" r="26" fill={T} /><circle cx="120" cy="58" r="26" fill={T} />
      <polygon points={star(120, 76, 11)} fill={A} stroke="none" />
    </>
  ),
  role: (
    <>
      <circle cx="84" cy="54" r="13" fill={W} stroke="none" /><path d="M58 112 Q84 62 110 112Z" fill={T2} />
      <circle cx="150" cy="70" r="24" stroke={A} strokeWidth="4.500" fill={T} /><path d="M168 88 L192 112" stroke={A} strokeWidth="6" />
      <path d="M140 64 H160 M140 72 H156 M140 80 H150" strokeWidth="3" />
    </>
  ),
  day: (
    <>
      <rect x="102" y="26" width="36" height="44" rx="3" fill={W} stroke="none" /><path d="M110 38 L130 58 M130 38 L110 58" stroke={A} strokeWidth="4" />
      <rect x="76" y="66" width="88" height="46" rx="7" {...BG} stroke="none" /><rect x="76" y="66" width="88" height="46" rx="7" fill={T2} />
      <path d="M96 76 H144" stroke={W} strokeWidth="5" /><path d="M96 76 H144" stroke={DK} strokeWidth="2" />
    </>
  ),
  letter: (
    <>
      <rect x="84" y="30" width="72" height="56" rx="3" fill={W} stroke="none" /><path d="M94 44 H146 M94 54 H146 M94 64 H128" stroke={DK} strokeWidth="2.500" />
      <rect x="58" y="62" width="124" height="52" rx="8" {...BG} stroke="none" /><rect x="58" y="62" width="124" height="52" rx="8" fill={T2} />
      <path d="M58 68 L120 100 L182 68" /><rect x="152" y="70" width="20" height="24" rx="2" fill={A} stroke="none" transform="rotate(5 162 82)" />
    </>
  ),
  ten: (
    <>
      <circle cx="90" cy="74" r="32" fill={T} />
      <path d={wedge(90, 74, 32, -90, 20)} fill={T2} /><path d={wedge(90, 74, 32, 20, 100)} fill={A} stroke="none" /><path d={wedge(90, 74, 32, 100, 180)} fill={W} stroke="none" opacity="0.85" />
      {[104, 92, 80].map((y) => <ellipse key={y} cx="170" cy={y} rx="22" ry="8" fill={A} stroke={W} strokeWidth="2.500" />)}
      <text x="170" y="84" textAnchor="middle" fontSize="12" fontWeight="800" fill={DK} stroke="none" fontFamily="Public Sans, system-ui, sans-serif">£</text>
    </>
  ),
  bingo: (
    <>
      <rect x="66" y="26" width="108" height="90" rx="9" fill={T} />
      {[7, 23, 41, 12, 58, 36, 64, 5, 19].map((n, i) => {
        const x = 74 + (i % 3) * 34, y = 34 + Math.floor(i / 3) * 27;
        const hit = i === 1 || i === 4 || i === 6;
        return <g key={n} stroke="none"><rect x={x} y={y} width="30" height="23" rx="5" fill={hit ? A : T2} /><text x={x + 15} y={y + 16.500} textAnchor="middle" fontSize="12" fontWeight="800" fill={hit ? DK : W} fontFamily="Public Sans, system-ui, sans-serif">{n}</text></g>;
      })}
    </>
  ),
  jargon: (
    <>
      <path d="M32 46 H108 a12 12 0 0 1 12 12 V80 a12 12 0 0 1 -12 12 H64 L48 104 V92 H44 a12 12 0 0 1 -12 -12 V58 a12 12 0 0 1 12 -12Z" fill={T2} />
      <path d="M44 70 q6 -12 12 0 t12 0 t12 0 t8 0" stroke={A} strokeWidth="3.500" />
      <path d="M132 62 H208 a0 0 0 0 1 0 0 V92 a12 12 0 0 1 -12 12 H176 L160 112 V104 H144 a12 12 0 0 1 -12 -12 Z" fill={W} stroke="none" /><path d="M144 76 H196 M144 88 H180" stroke={DK} strokeWidth="3" />
      <path d="M112 86 Q126 96 136 86" strokeDasharray="1 7" strokeWidth="4" />
    </>
  ),
  spin: (
    <>
      <path d={Array.from({ length: 60 }, (_, i) => { const a = (i / 59) * 4.2 * Math.PI; const r = 3 + a * 2.5; const x = 84 + r * Math.cos(a), y = 78 + r * Math.sin(a); return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(" ")} strokeWidth="4" />
      <circle cx="84" cy="78" r="4" fill={A} stroke="none" />
      <rect x="150" y="32" width="60" height="80" rx="5" fill={W} stroke="none" /><rect x="158" y="40" width="44" height="12" rx="2" fill={DK} stroke="none" /><path d="M158 62 H202 M158 72 H202 M158 82 H190 M158 92 H196" stroke={DK} strokeWidth="2.500" />
    </>
  ),
  quiz: (
    <>
      <path d="M92 112 V60 H148 V112" fill={T2} /><path d="M36 112 V80 H92 V112" fill={T2} /><path d="M148 112 V92 H204 V112" fill={T2} />
      <polygon points={star(120, 38, 14)} fill={A} stroke="none" />
      {[["1", 120, 92], ["2", 64, 104], ["3", 176, 106]].map(([n, x, y]) => <text key={n} x={x} y={y} textAnchor="middle" fontSize="20" fontWeight="800" fill={W} stroke="none" fontFamily="Newsreader, Georgia, serif">{n}</text>)}
    </>
  ),
  election: (
    <>
      <rect x="62" y="24" width="88" height="92" rx="6" fill={W} stroke="none" />
      {[40, 64, 88].map((y, i) => <g key={y}><rect x="72" y={y} width="18" height="18" rx="3" stroke={DK} strokeWidth="2.500" fill="none" /><path d={`M98 ${y + 9} H138`} stroke={DK} strokeWidth="3" />{i === 1 && <path d={`M75 ${y + 3} L87 ${y + 15} M87 ${y + 3} L75 ${y + 15}`} stroke="#C0283C" strokeWidth="3.500" />}</g>)}
      <polygon points="164,104 168,86 192,62 204,74 180,98" fill={A} stroke="none" /><polygon points="164,104 168,86 180,98" fill={W} stroke="none" />
    </>
  ),
  budget: (
    <>
      {[2, 3, 4, 5].map((n, c) => Array.from({ length: n }, (_, i) => <rect key={`${c}-${i}`} x={46 + c * 42} y={98 - i * 17} width="34" height="14" rx="3" fill={c === 3 && i === 4 ? A : T2} stroke={W} strokeWidth="2" />))}
      <path d="M32 114 H212" />
    </>
  ),
  petition: (
    <>
      <rect x="72" y="30" width="96" height="86" rx="8" fill={W} stroke="none" /><rect x="104" y="22" width="32" height="14" rx="5" fill={A} stroke="none" />
      {[52, 72, 92].map((y) => <g key={y}><circle cx="88" cy={y} r="5" fill={DK} stroke="none" /><path d={`M100 ${y + 3} q6 -12 12 0 t12 0 t12 0 t8 0`} stroke={DK} strokeWidth="2.500" /></g>)}
    </>
  ),
};

export default function CoverArt({ name }) {
  const art = ART[name];
  if (!art) return null;
  return <svg className="act-art" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><g transform="translate(120 118) scale(0.84) translate(-120 -118)">{art}</g></svg>;
}
