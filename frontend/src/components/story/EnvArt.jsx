/** @jsxImportSource react */
import "../../envart.css";
import { Scene, Defs } from "./EconArt";
import { rnd, windows } from "./sceneKit";

// The pictures along the foot of the heading band on the four Environment and energy pages: wind, sun and a power line lighting a village (Net zero and energy bills), a valley at
// sunrise (Environment), the journey of water from rain to reservoir to tap to sea (Water and sewage) and a flooding river town beside an air-quality gauge (Flooding and air quality).
// They are decoration only (hidden from screen readers), take their colours from the page's accent (a few shift it towards blue or gold), and each plays once or for a while and then
// rests. With calmer motion asked for they are simply finished (see econart.css and envart.css).

// A sine wave `n` periods long drawn from x = -len; sliding it left by `len` loops it. Closed below so it can be filled.
const wave = (y, amp = 3, len = 60, n = 30, bottom = 200) => `M${-len} ${y}q${len / 4} ${-amp} ${len / 2} 0${`t${len / 2} 0`.repeat(n * 2 - 1)}V${bottom}H${-len}Z`;
const crest = (y, amp = 3, len = 60, n = 30) => `M${-len} ${y}q${len / 4} ${-amp} ${len / 2} 0${`t${len / 2} 0`.repeat(n * 2 - 1)}`;

const Pine = ({ x, y, s = 1, i = 0, cls = "hs-1" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="env-sway" style={{ "--i": i }}>
      <rect className={cls} x="-1.4" y="-6" width="2.8" height="6" />
      <path className={cls} d="M0 -42 L-8 -24 H-4 L-11 -11 H-5 L-12 -4 H12 L5 -11 H11 L4 -24 H8Z" />
    </g>
  </g>
);
const Oak = ({ x, y, s = 1, i = 0, cls = "hs-1" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="env-sway" style={{ "--i": i }}>
      <rect className={cls} x="-1.7" y="-15" width="3.4" height="15" />
      <circle className={cls} cx="0" cy="-27" r="11" /><circle className={cls} cx="-8.5" cy="-19" r="8.5" /><circle className={cls} cx="8.5" cy="-19" r="8.5" />
    </g>
  </g>
);
const House = ({ x, y, w = 30, h = 22, roof = 14, lit = [], d = 5 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect className="hs-3" x="0" y={-h} width={w} height={h} />
    <path className="hs-2" d={`M-3 ${-h} L${w / 2} ${-h - roof} L${w + 3} ${-h}Z`} />
    <rect className="hs-2" x={w * 0.72} y={-h - roof * 0.9} width="4" height="9" />
    {lit.map((k, i) => <rect key={i} className="hs-win hs-warm" x={w * 0.14 + i * (w * 0.46)} y={-h * 0.72} width={w * 0.24} height={h * 0.42} rx="1.2" style={{ "--d": `${d + k * 0.5}s` }} />)}
  </g>
);

// ---------- Net zero and energy bills: wind turbines turning over the hills, a solar farm catching the light, and a power line carrying the current to a village whose windows come on ----------
const TURBINES = [
  [58, 150, 0.6, 1100, 34], [150, 152, 0.8, 1500, 30], [244, 151, 0.55, 900, 36], [400, 152, 1, 1700, 28], [506, 152, 0.7, 1250, 33], [610, 151, 0.92, 1450, 31], [716, 152, 0.62, 1000, 35],
];
function Turbine({ x, y, s, r, t }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="hs-3" d="M-2.8 0 L-1.2 -78 L1.2 -78 L2.8 0Z" />
      <g transform="translate(0 -80)">
        <g className="env-blades" style={{ "--r": r, "--t": `${t}s` }}>
          {[0, 120, 240].map((a) => <path key={a} className="hs-4" transform={`rotate(${a})`} d="M-2 0 L-1.1 -7 L0 -48 L2 -9Z" />)}
        </g>
        <rect className="hs-3" x="-3.6" y="-3.4" width="10" height="6.8" rx="2.2" /><circle className="hs-acc" r="3.2" />
      </g>
    </g>
  );
}
const PYLONS = [[960, 84], [1090, 84], [1220, 70]];
const GRID = "M900 136Q930 124 960 106Q1025 132 1090 106Q1155 128 1220 120Q1255 142 1290 150";
export function EnergyScene() {
  return (
    <Scene kind="energy">
      <Defs id="en" />
      <rect width="1440" height="200" fill="url(#en-glow)" />
      <g className="ec-sun"><circle cx="352" cy="96" r="96" fill="url(#en-sun)" opacity=".7" /><circle cx="352" cy="96" r="25" fill="#FFE2A0" opacity=".95" /></g>
      <path className="hs-1" d="M0 146C110 128 220 134 330 142S560 124 700 138 940 150 1100 140 1330 126 1440 138V200H0Z" />
      {TURBINES.map(([x, y, s, r, t]) => <Turbine key={x} x={x} y={y} s={s} r={r} t={t} />)}
      <path className="hs-2" d="M0 170C150 152 300 160 450 168S720 156 900 166 1200 156 1440 168V200H0Z" />
      {/* the solar farm: three rows of panels on the slope, with a glint passing across them */}
      <g>
        {[0, 1, 2].map((row) => Array.from({ length: 8 }, (_, c) => {
          const x = 572 + c * 30 + row * 9; const y = 163 + row * 9;
          const d = `M${x} ${y}L${x + 22} ${y}L${x + 25} ${y + 7}L${x - 3} ${y + 7}Z`;
          return (
            <g key={`${row}-${c}`}>
              <path d={d} fill="var(--s4)" stroke="var(--s3)" strokeWidth=".8" opacity=".92" />
              <path d={`M${x + 11} ${y}L${x + 12.5} ${y + 7}`} stroke="var(--s3)" strokeWidth=".6" />
              <path className="env-glint" d={d} fill="#fff" style={{ "--k": c + row * 2 }} />
            </g>
          );
        }))}
      </g>
      {/* the substation, the pylons and the line between them with current pulsing along it */}
      <g className="hs-3"><rect x="884" y="150" width="28" height="38" /></g>
      <g stroke="var(--lamp)" strokeWidth="1.4" opacity=".55">{[890, 898, 906].map((x) => <path key={x} d={`M${x} 150V138`} />)}</g>
      {PYLONS.map(([x, h]) => (
        <g key={x} transform={`translate(${x} 188)`} className="hs-line" style={{ strokeWidth: 2.2 }}>
          <path d={`M-15 0L-3 ${-h}M15 0L3 ${-h}M-3 ${-h}H3M-10 ${-h * 0.36}H10M-6 ${-h * 0.6}H6M-15 0L6 ${-h * 0.6}M15 0L-6 ${-h * 0.6}M-24 ${-h + 6}H24M-19 ${-h + 18}H19`} />
        </g>
      ))}
      <path d={GRID} fill="none" stroke="var(--lamp)" strokeWidth="9" opacity=".12" strokeLinecap="round" />
      <path d={GRID} fill="none" stroke="var(--lamp)" strokeWidth="1.6" opacity=".7" strokeLinecap="round" />
      {[0, 1, 2].map((k) => <circle key={k} r="3.8" className="ec-flow" style={{ offsetPath: `path("${GRID}")`, "--d": `${1.6 + k * 1.9}s` }} />)}
      {/* the village the current reaches: the windows come on as the pulses arrive */}
      <g className="hs-3"><rect x="1288" y="148" width="3" height="40" /></g>
      <g stroke="var(--lamp)" strokeWidth="1" opacity=".5" fill="none">{[1276, 1318, 1362, 1404].map((x) => <path key={x} d={`M1290 150L${x} 168`} />)}</g>
      <House x={1262} y={188} lit={[0, 1]} d={4.6} />
      <House x={1304} y={188} w={28} h={24} roof={13} lit={[0, 1]} d={5.4} />
      <House x={1346} y={188} lit={[0, 1]} d={6.2} />
      <House x={1388} y={188} w={30} h={20} lit={[0, 1]} d={7} />
      <g className="hs-3"><rect x="0" y="188" width="1440" height="12" /></g>
    </Scene>
  );
}

// ---------- Environment: a valley at sunrise, a river catching the sun, a forest swaying, a flock crossing the sky and wildflowers coming up in the foreground ----------
const MOUNTAINS = "M0 120L70 84L120 112L190 70L260 116L330 92L420 126L520 76L610 118L700 96L800 130L900 90L1000 124L1100 80L1190 120L1280 88L1360 118L1440 100V200H0Z";
const FOREST = Array.from({ length: 66 }, (_, i) => ({ x: 8 + i * 22 + rnd(i + 3) * 12, y: 153 + rnd(i + 7) * 9, s: 0.5 + rnd(i + 9) * 0.5, oak: rnd(i + 5) > 0.72, i })).filter((t) => t.x < 940 || t.x > 1076);
const FRONT = Array.from({ length: 22 }, (_, i) => ({ x: 20 + i * 66 + rnd(i + 13) * 30, s: 0.9 + rnd(i + 17) * 0.7, oak: rnd(i + 2) > 0.55, i })).filter((t) => t.x < 900 || t.x > 1110);
const FLOWERS = Array.from({ length: 36 }, (_, i) => ({ x: 14 + i * 40 + rnd(i + 21) * 26, y: 186 + rnd(i + 4) * 7, c: ["#FFE2A0", "#F7B6C8", "#FFFFFF", "#FFC27A"][i % 4] }));
const BIRDS = [[0, 0], [-15, 7], [-30, 14], [-45, 21], [15, 7], [30, 14], [45, 21]];
export function EnvironmentScene() {
  return (
    <Scene kind="nature">
      <Defs id="nt" />
      <rect width="1440" height="200" fill="url(#nt-glow)" />
      <g className="ec-sun">
        <circle cx="1010" cy="100" r="104" fill="url(#nt-sun)" opacity=".75" />
        <g stroke="#FFE2A0" strokeWidth="1.4" opacity=".3" strokeLinecap="round">{Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <path key={i} d={`M${1010 + Math.cos(a) * 40} ${100 + Math.sin(a) * 40}L${1010 + Math.cos(a) * 66} ${100 + Math.sin(a) * 66}`} />; })}</g>
        <circle cx="1010" cy="100" r="30" fill="#FFE2A0" opacity=".96" />
      </g>
      <path className="hs-2" d={MOUNTAINS} opacity=".7" />
      <g className="hs-4" opacity=".22">
        {[[250, 50, 1], [690, 38, 0.8], [1180, 58, 1.1]].map(([x, y, s], i) => (
          <g key={i} className="env-cloud" transform={`translate(${x} ${y}) scale(${s})`}><g style={{ "--i": i }}><ellipse cx="0" cy="0" rx="46" ry="9" /><ellipse cx="-14" cy="-8" rx="22" ry="10" /><ellipse cx="14" cy="-10" rx="26" ry="12" /></g></g>
        ))}
      </g>
      <path className="hs-2" d="M0 150C130 126 260 138 400 146S640 128 800 142 1100 124 1250 140 1400 134 1440 138V200H0Z" />
      {FOREST.map((t) => (t.oak ? <Oak key={t.i} x={t.x} y={t.y} s={t.s * 0.8} i={t.i % 7} cls="hs-1" /> : <Pine key={t.i} x={t.x} y={t.y} s={t.s} i={t.i % 7} cls="hs-1" />))}
      {/* the river runs from the sun's horizon towards the viewer, with the light sparkling on it */}
      <path d="M1004 140C990 156 1030 164 1000 178S946 192 930 202H1110C1096 190 1066 184 1052 170S1022 150 1016 140Z" fill="var(--s4)" opacity=".5" />
      <path className="env-streamflow" d="M1010 142C1000 156 1032 164 1006 178S952 192 944 200" fill="none" stroke="#FFF4D0" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <path className="hs-3" d="M0 176C160 160 320 170 480 176S800 164 1000 178 1300 166 1440 176V200H0Z" />
      {FRONT.map((t) => (t.oak ? <Oak key={t.i} x={t.x} y={188} s={t.s} i={t.i % 7} cls="hs-1" /> : <Pine key={t.i} x={t.x} y={188} s={t.s} i={t.i % 7} cls="hs-1" />))}
      {FLOWERS.map((f, i) => <circle key={i} className="env-pop" cx={f.x} cy={f.y} r="1.9" fill={f.c} style={{ "--i": i }} />)}
      {/* a flock crosses the whole sky once */}
      <g transform="translate(0 52)"><g className="env-flock">{BIRDS.map(([x, y], i) => <path key={i} className="env-wing" transform={`translate(${x} ${y})`} d="M-7.5 0Q-3.6 -5.4 0 0Q3.6 -5.4 7.5 0" fill="none" stroke="var(--lamp)" strokeWidth="1.7" strokeLinecap="round" style={{ "--i": i }} />)}</g></g>
      <g className="hs-3"><rect x="0" y="194" width="1440" height="6" /></g>
    </Scene>
  );
}

// ---------- Water and sewage: rain on the hills, a stream into a reservoir held by a dam, a pipe to the treatment works and the tower, drops over the homes, then a river out to sea ----------
const PIPE = "M556 183H690Q700 183 700 176V172M700 183H860M860 183H1140";
const DROPS = [[1000, 148], [1044, 140], [1088, 150], [1130, 142]];
const RAIN = Array.from({ length: 22 }, (_, i) => ({ x: 96 + i * 9 + rnd(i + 2) * 5, y: 66 + rnd(i + 8) * 14, i }));
export function WaterScene() {
  return (
    <Scene kind="water">
      <Defs id="wt" />
      <defs>
        <clipPath id="wt-sea"><rect x="1236" y="150" width="204" height="50" /></clipPath>
        <clipPath id="wt-lake"><rect x="338" y="146" width="178" height="44" /></clipPath>
        <linearGradient id="wt-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--a) 55%, #A9DBFF)" }} /><stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--a) 80%, #1B4F8A)" }} /></linearGradient>
      </defs>
      <rect width="1440" height="200" fill="url(#wt-glow)" />
      <path className="hs-1" d="M0 118C80 94 170 110 260 120S400 112 480 126S640 150 760 148 1000 138 1200 146 1340 140 1440 146V200H0Z" />
      <g className="ec-area" fill="none" strokeWidth="5" opacity=".2">{[["#E8756A", 118], ["#F3C65A", 112], ["#6FC48A", 106], ["#6FB1FF", 100], ["#9A86E0", 94]].map(([c, r]) => <path key={c} d={`M${586 - r} 152A${r} ${r} 0 0 1 ${586 + r} 152`} stroke={c} />)}</g>
      <g className="hs-4" opacity=".16">{[[760, 52, 0.8], [1080, 40, 1]].map(([x, y, k], i) => <g key={x} className="env-cloud" transform={`translate(${x} ${y}) scale(${k})`}><g style={{ "--i": i }}><ellipse rx="44" ry="8" /><ellipse cx="-12" cy="-7" rx="20" ry="9" /><ellipse cx="14" cy="-9" rx="24" ry="11" /></g></g>)}</g>
      <path className="hs-2" d="M0 150C100 130 220 144 320 152S440 142 500 152 760 170 1000 165 1300 160 1440 166V200H0Z" />
      {/* a rain cloud over the hills, raining for a while */}
      <g className="env-raincloud" fill="color-mix(in srgb, var(--a) 22%, #AEBDCF)"><g className="env-cloud" style={{ "--i": 0 }}><ellipse cx="190" cy="44" rx="74" ry="14" /><ellipse cx="156" cy="34" rx="34" ry="16" /><ellipse cx="206" cy="29" rx="42" ry="20" /><ellipse cx="238" cy="40" rx="30" ry="13" /></g></g>
      <g stroke="#CFE9FF" strokeWidth="1.6" strokeLinecap="round">{RAIN.map((r) => <path key={r.i} className="env-rain" d={`M${r.x} ${r.y}l-3 12`} style={{ "--i": r.i }} />)}</g>
      {/* the stream down the hill and into the reservoir */}
      <path className="env-streamflow" d="M252 124C290 138 300 150 340 154" fill="none" stroke="#BFE6FF" strokeWidth="3" strokeLinecap="round" />
      <g clipPath="url(#wt-lake)">
        <g className="env-rise" style={{ "--dy": "16px" }}>
          <g transform="translate(300 0)">
            <path d={wave(152, 2.4, 60, 6, 200)} fill="url(#wt-w)" className="env-wave" />
            <path d={crest(152, 2.4, 60, 6)} fill="none" stroke="#DDF1FF" strokeWidth="1.2" opacity=".8" className="env-wave" />
          </g>
        </g>
      </g>
      {/* the dam, the spillway and the pipe leaving it */}
      <path className="hs-3" d="M510 144H550L560 190H502Z" />
      <path d="M510 144H550" stroke="var(--lamp)" strokeWidth="1.4" opacity=".6" />
      <g stroke="#CFE9FF" strokeWidth="2" strokeLinecap="round" opacity=".85">{[520, 532, 544].map((x, i) => <path key={x} className="env-spill" d={`M${x} 152V186`} style={{ "--i": i }} />)}</g>
      <g fill="none" stroke="var(--s3)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d={PIPE} /></g>
      <g fill="none" stroke="var(--s4)" strokeWidth="1.4" strokeLinecap="round" opacity=".6"><path d={PIPE} /></g>
      {[0, 1, 2, 3].map((k) => <circle key={k} r="3.4" className="env-drop" style={{ offsetPath: `path("${PIPE}")`, "--d": `${1.4 + k * 1.5}s` }} />)}
      {/* the treatment works: three round tanks, and the water tower */}
      {[[640, 38, 52], [690, 30, 48], [736, 24, 44]].map(([x, h, w]) => (
        <g key={x} className="hs-3"><rect x={x - w / 2} y={178 - h} width={w} height={h} rx="3" /><ellipse cx={x} cy={178 - h} rx={w / 2} ry="5" className="hs-4" /><rect className="hs-acc" x={x - w / 2 + 4} y={178 - h * 0.55} width={w - 8} height="3" opacity=".8" /></g>
      ))}
      <g className="hs-3"><path d="M820 130H870V152H820Z" /><path d="M816 130L845 114 874 130Z" className="hs-2" /><path d="M826 152L820 184M864 152L870 184M845 152V184" className="hs-line" style={{ strokeWidth: 2.4 }} /><rect className="hs-acc" x="820" y="138" width="50" height="4" opacity=".85" /></g>
      {/* the town: homes whose windows come on, with a drop over each as the water reaches it */}
      <House x={984} y={186} lit={[0, 1]} d={4.2} />
      <House x={1028} y={186} w={28} h={24} roof={13} lit={[0, 1]} d={5.2} />
      <House x={1072} y={186} lit={[0, 1]} d={6.2} />
      <House x={1116} y={186} w={30} h={20} lit={[0, 1]} d={7.2} />
      {DROPS.map(([x, y], i) => <path key={x} className="env-dropicon" d={`M${x + 14} ${y - 14}c5 6 6 10 0 12s-5-6 0-12z`} fill="#BFE6FF" stroke="var(--a)" strokeWidth="1" style={{ "--d": `${4.6 + i * 1}s` }} />)}
      {/* a storm overflow: a pale plume where the sewer meets the river after the rain, then it clears */}
      <g className="hs-3"><rect x="1166" y="170" width="16" height="10" rx="2" /></g>
      <path className="env-plume" d="M1182 172C1204 168 1214 176 1236 172V184C1214 188 1204 182 1182 180Z" fill="#CFC39C" />
      {/* the river's mouth: the sea, its waves and a boat rocking on it */}
      <g clipPath="url(#wt-sea)">
        <rect x="1236" y="156" width="204" height="44" fill="url(#wt-w)" />
        <g className="env-rise" style={{ "--dy": "6px" }}>
          <g transform="translate(1236 0)">
            <path d={wave(158, 3, 60, 8)} fill="url(#wt-w)" className="env-wave" />
            <path d={crest(158, 3, 60, 8)} fill="none" stroke="#DDF1FF" strokeWidth="1.3" opacity=".8" className="env-wave" />
            <path d={crest(172, 3.4, 80, 6)} fill="none" stroke="#DDF1FF" strokeWidth="1" opacity=".45" className="env-wave env-wave-slow" />
          </g>
        </g>
      </g>
      {[1280, 1322, 1372, 1414].map((x, i) => <circle key={x} className="ec-puff" cx={x} cy="150" r="6" style={{ "--i": i * 0.9 }} />)}
      <g transform="translate(1340 156)"><g className="env-bob"><path d="M-14 0H14L9 7H-9Z" className="hs-3" /><path d="M0 -26V0" className="hs-line" /><path d="M2 -25L16 -4H2Z" fill="#F4F8FF" opacity=".95" /><path d="M-2 -20L-12 -4H-2Z" fill="#F4F8FF" opacity=".75" /></g></g>
      <path d="M1140 183H1236" stroke="var(--s3)" strokeWidth="6" strokeLinecap="round" opacity=".0" />
      <g className="hs-3"><rect x="0" y="188" width="1440" height="12" /></g>
    </Scene>
  );
}

// ---------- Flooding and air quality: a storm over a river town as the water rises past a flood warning, and, beyond a turbine, a city whose haze clears while an air-quality dial swings to green ----------
const GAUGE = [["#4FB36B", 180, 120], ["#F3C65A", 120, 60], ["#D8584A", 60, 0]];
const arc = (r, a0, a1) => { const p = (a) => [(Math.cos((a * Math.PI) / 180) * r).toFixed(2), (-Math.sin((a * Math.PI) / 180) * r).toFixed(2)]; const [x0, y0] = p(a0); const [x1, y1] = p(a1); return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`; };
const STORM_RAIN = Array.from({ length: 30 }, (_, i) => ({ x: 70 + i * 13 + rnd(i + 5) * 7, y: 60 + rnd(i + 11) * 18, i }));
const SKYLINE = [[742, 54, 30], [778, 86, 26], [808, 40, 34], [846, 72, 24], [876, 98, 28], [910, 60, 32], [948, 80, 24]];
export function FloodScene() {
  return (
    <Scene kind="flood">
      <Defs id="fl" />
      <defs>
        <clipPath id="fl-river"><rect x="0" y="150" width="660" height="50" /></clipPath>
        <linearGradient id="fl-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--a) 55%, #9CC4EE)" }} /><stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--a) 80%, #1F3F70)" }} /></linearGradient>
        <radialGradient id="fl-haze" cx="50%" cy="60%" r="60%"><stop offset="0" stopColor="#D9C7A3" stopOpacity=".85" /><stop offset="1" stopColor="#D9C7A3" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1440" height="200" fill="url(#fl-glow)" />
      <rect className="env-flash" width="700" height="200" fill="#fff" />
      <path className="hs-1" d="M0 138C120 120 240 132 360 138S560 122 700 134V200H0Z" />
      <path className="hs-1" d="M700 150C820 138 960 146 1080 140S1330 130 1440 142V200H700Z" />
      {/* the storm: dark cloud, slanting rain, one flash of lightning */}
      <g fill="color-mix(in srgb, var(--a) 18%, #4B586F)"><g className="env-cloud" style={{ "--i": 0 }}><ellipse cx="180" cy="42" rx="84" ry="15" /><ellipse cx="146" cy="30" rx="38" ry="17" /><ellipse cx="204" cy="26" rx="46" ry="21" /><ellipse cx="248" cy="38" rx="34" ry="14" /></g></g>
      <g fill="color-mix(in srgb, var(--a) 14%, #3C475C)"><g className="env-cloud" style={{ "--i": 1 }}><ellipse cx="400" cy="36" rx="70" ry="13" /><ellipse cx="376" cy="26" rx="32" ry="14" /><ellipse cx="420" cy="22" rx="38" ry="17" /></g></g>
      <g stroke="#CFE2F8" strokeWidth="1.5" strokeLinecap="round">{STORM_RAIN.map((r) => <path key={r.i} className="env-rain" d={`M${r.x} ${r.y}l-4 13`} style={{ "--i": r.i }} />)}</g>
      <path className="env-bolt" d="M318 56L306 82H314L303 108L324 76H316L326 56Z" fill="#FFF3B8" />
      {/* the river town: homes on the bank, sandbags, a bridge, then the river rising over them */}
      <House x={96} y={176} w={34} h={24} roof={15} lit={[0, 1]} d={9} />
      <House x={158} y={176} w={30} h={22} roof={14} lit={[0]} d={9.6} />
      <House x={232} y={176} w={34} h={24} roof={15} lit={[0, 1]} d={10} />
      <g clipPath="url(#fl-river)">
        <g className="env-rise" style={{ "--dy": "22px" }}>
          <path d={wave(166, 3, 60, 12)} fill="url(#fl-w)" opacity=".9" className="env-wave" />
          <path d={crest(166, 3, 60, 12)} fill="none" stroke="#DCEBFB" strokeWidth="1.3" opacity=".85" className="env-wave" />
          <path d={crest(178, 3.4, 80, 12)} fill="none" stroke="#DCEBFB" strokeWidth="1" opacity=".4" className="env-wave env-wave-slow" />
        </g>
      </g>
      <path className="hs-2" d="M628 200V180C654 172 690 166 744 162V200Z" />
      <g transform="translate(548 166)"><g className="env-bob"><path d="M-17 0H17L12 8H-12Z" fill="#F58A2E" /><path d="M-14 -1.5H14" stroke="#FFD9A8" strokeWidth="2" /><circle cx="-3" cy="-12" r="3.6" fill="#EBB98F" /><rect x="-7" y="-9" width="8" height="9" rx="2.5" fill="#F3C65A" /><path d="M8 -2V-16" stroke="var(--lamp)" strokeWidth="1.2" /><path d="M8 -16L16 -13L8 -10Z" fill="#D8584A" /></g></g>
      <g className="hs-3">{[0, 1, 2].map((r) => Array.from({ length: 4 - r }, (_, c) => <rect key={`${r}${c}`} x={64 + c * 12 + r * 6} y={182 - r * 7} width="12" height="7" rx="3" />))}</g>
      {/* the flood warning on the bank, pulsing */}
      <g transform="translate(426 168)">
        <g className="hs-3"><rect x="-1.6" y="-26" width="3.2" height="26" /></g>
        <circle className="ec-halo" cy="-36" r="8" style={{ "--i": 0 }} /><circle className="ec-halo" cy="-36" r="8" style={{ "--i": 1 }} />
        <path d="M0 -50L13 -28H-13Z" fill="#F3C65A" stroke="#B88A2C" strokeWidth="1.4" strokeLinejoin="round" /><path d="M0 -44V-35M0 -32V-30" stroke="#5A3F0A" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* beyond the river, a turbine, then the city: chimney smoke, a haze that thins, wind passing through */}
      <Turbine x={690} y={172} s={0.72} r={1100} t={30} />
      {SKYLINE.map(([x, h, w], i) => <g key={x}><rect className="hs-2" x={x} y={188 - h} width={w} height={h} />{windows(x + 4, 188 - h + 8, Math.floor((w - 6) / 9), Math.floor((h - 14) / 14), 9, 14, i * 5)}</g>)}
      <g className="hs-3"><rect x="1004" y="112" width="9" height="76" /><rect x="1026" y="124" width="9" height="64" /><rect x="996" y="150" width="46" height="38" /></g>
      {[[1008, 0], [1030, 1]].map(([x, i]) => <g key={x}>{[0, 1, 2].map((k) => <circle key={k} className="ec-puff" cx={x} cy={i ? 118 : 106} r="7" style={{ "--i": i + k * 1.1 }} />)}</g>)}
      <g className="env-haze"><ellipse cx="900" cy="104" rx="250" ry="62" fill="url(#fl-haze)" /><ellipse cx="1130" cy="120" rx="200" ry="50" fill="url(#fl-haze)" /></g>
      <g fill="none" stroke="var(--lamp)" strokeWidth="1.6" strokeLinecap="round">{[[1080, 84], [1120, 104], [1070, 126]].map(([x, y], i) => <path key={i} className="env-wind" d={`M${x - 140} ${y}C${x - 60} ${y - 10} ${x + 20} ${y + 10} ${x + 130} ${y - 2}`} style={{ "--i": i }} />)}</g>
      {/* the air-quality monitor: a mast with a dial whose needle swings from red to green */}
      <g className="hs-3"><rect x="1272" y="150" width="4" height="38" /></g>
      <g transform="translate(1274 112)">
                <rect className="hs-3" x="-48" y="-46" width="96" height="74" rx="10" />
        <rect x="-44" y="-42" width="88" height="66" rx="8" fill="var(--s2)" stroke="var(--lamp)" strokeWidth="1" opacity=".95" />
        <g transform="translate(0 10)">
          {GAUGE.map(([c, a0, a1]) => <path key={c} d={arc(30, a0, a1)} fill="none" stroke={c} strokeWidth="9" />)}
          <g className="env-needle"><path d="M-2.6 0L0 -27L2.6 0Z" fill="#F4F8FF" /></g>
          <circle r="5" fill="#F4F8FF" />
        </g>
        <circle className="env-led" cx="34" cy="-30" r="3.4" fill="#4FB36B" />
      </g>
      <Oak x={1384} y={188} s={0.9} i={2} cls="hs-2" /><Pine x={1412} y={188} s={0.9} i={4} cls="hs-2" /><Oak x={1344} y={188} s={0.72} i={5} cls="hs-2" />
      <g className="hs-3"><rect x="0" y="188" width="1440" height="12" /></g>
    </Scene>
  );
}
