/** @jsxImportSource react */
import "../../envart.css";
import { Scene, Backdrop } from "./EconArt";
import { rnd, windows } from "./sceneKit";

// The pictures along the foot of the heading band on the four Environment and energy pages: wind, sun and a power line lighting a village (Net zero and energy bills), a valley at
// sunrise (Environment), the journey of water from rain to reservoir to tap to sea (Water and sewage) and a flooding river town beside an air-quality gauge (Flooding and air quality).
// They are decoration only (hidden from screen readers), take their colours from the page's accent (a few shift it towards blue or gold), and each plays once or for a while and then
// rests. With calmer motion asked for they are simply finished (see econart.css and envart.css).

// A sine wave `n` periods long drawn from x = -len; sliding it left by `len` loops it. Closed below so it can be filled.
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
    <rect className="hs-3 env-wall" x="0" y={-h} width={w} height={h} />
    <path className="hs-2 env-roof" d={`M-3 ${-h} L${w / 2} ${-h - roof} L${w + 3} ${-h}Z`} />
    <rect className="hs-2 env-roof" x={w * 0.72} y={-h - roof * 0.9} width="4" height="9" />
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
      <Backdrop id="en" day sun={null} far={false} clouds={[[150, 36, 1, 50], [560, 28, 0.8, 61], [790, 50, 0.6, 72], [1170, 30, 1, 83]]} />
      <g className="ec-sun"><circle cx="352" cy="70" r="62" fill="url(#en-sun)" opacity=".7" /><circle cx="352" cy="70" r="25" fill="#FFEBA6" opacity=".95" /></g>
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
              <path className="env-panel" d={d} fill="var(--s4)" stroke="var(--s3)" strokeWidth=".8" opacity=".92" />
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
      <g className="hs-3 sv-ground"><rect x="0" y="188" width="1440" height="12" /></g>
    </Scene>
  );
}

// ---------- Environment: a valley at sunrise, a river catching the sun, a forest swaying, a flock crossing the sky and wildflowers coming up in the foreground ----------
const MOUNTAINS = "M0 120L70 84L120 112L190 70L260 116L330 92L420 126L520 76L610 118L700 96L800 130L900 90L1000 124L1100 80L1190 120L1280 88L1360 118L1440 100V200H0Z";
const FOREST = Array.from({ length: 66 }, (_, i) => ({ x: 8 + i * 22 + rnd(i + 3) * 12, y: 153 + rnd(i + 7) * 9, s: 0.5 + rnd(i + 9) * 0.5, oak: rnd(i + 5) > 0.72, i })).filter((t) => t.x < 940 || t.x > 1076);
const FRONT = Array.from({ length: 22 }, (_, i) => ({ x: 20 + i * 66 + rnd(i + 13) * 30, s: 0.9 + rnd(i + 17) * 0.7, oak: rnd(i + 2) > 0.55, i })).filter((t) => t.x < 900 || t.x > 1110);
// Three birds in a V: [x, y, scale, wing phase]. Each is a body, a tail and two wings that beat from the shoulder.
const BIRDS = [[0, 0, 1, 0], [-27, -10, 0.88, 1.3], [-27, 11, 0.84, 2.4]];
const Bird = ({ x, y, k, p }) => (
  <g className="env-bird" transform={`translate(${x} ${y}) scale(${k})`} fill="#EAF3F0" opacity=".94">
    <path d="M-3.4 0L-8 -1.3L-7 0.2L-8 1.6Z" />
    <ellipse rx="3.7" ry="1.65" /><circle cx="3.4" cy="-.3" r="1.35" /><path d="M4.4 -.4L6.6 .2L4.4 .7Z" />
    <g className="env-wl" style={{ "--p": p }}><path d="M0 -.2C-4 -4.8-10 -6.6-17.5 -3.4C-10.5 -3.6-5 -1.6 0 1.1Z" /></g>
    <g className="env-wr" style={{ "--p": p }}><path d="M0 -.2C4 -4.8 10 -6.6 17.5 -3.4C10.5 -3.6 5 -1.6 0 1.1Z" /></g>
  </g>
);
export function EnvironmentScene() {
  return (
    <Scene kind="nature">
      <Backdrop id="nt" day sun={null} far={false} clouds={[[240, 44, 1, 101], [640, 30, 0.75, 112], [1180, 56, 1.1, 123], [440, 66, 0.5, 134]]} />
      <g className="ec-sun">
        <circle cx="1010" cy="84" r="74" fill="url(#nt-sun)" opacity=".75" />
        <g stroke="#FFE2A0" strokeWidth="1.4" opacity=".5" strokeLinecap="round">{Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <path key={i} d={`M${1010 + Math.cos(a) * 36} ${84 + Math.sin(a) * 36}L${1010 + Math.cos(a) * 56} ${84 + Math.sin(a) * 56}`} />; })}</g>
        <circle cx="1010" cy="84" r="26" fill="#FFEBA6" opacity=".96" />
      </g>
      <path className="env-mtn" d={MOUNTAINS} />
      <path className="hs-2" d="M0 150C130 126 260 138 400 146S640 128 800 142 1100 124 1250 140 1400 134 1440 138V200H0Z" />
      {FOREST.map((t) => (t.oak ? <Oak key={t.i} x={t.x} y={t.y} s={t.s * 0.8} i={t.i % 7} cls="hs-1" /> : <Pine key={t.i} x={t.x} y={t.y} s={t.s} i={t.i % 7} cls="hs-1" />))}
      {/* the river runs from the sun's horizon towards the viewer, with the light sparkling on it */}
      <path d="M1004 140C990 156 1030 164 1000 178S946 192 930 202H1110C1096 190 1066 184 1052 170S1022 150 1016 140Z" fill="var(--s4)" opacity=".5" />
      <path className="env-streamflow" d="M1010 142C1014 154 1028 162 1026 176S1022 190 1020 200" fill="none" stroke="#FFF4D0" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <path className="hs-3" d="M0 176C160 160 320 170 480 176S800 164 1000 178 1300 166 1440 176V200H0Z" />
      {FRONT.map((t) => (t.oak ? <Oak key={t.i} x={t.x} y={188} s={t.s} i={t.i % 7} cls="hs-1" /> : <Pine key={t.i} x={t.x} y={188} s={t.s} i={t.i % 7} cls="hs-1" />))}
      {/* a flock crosses the whole sky once */}
      <g transform="translate(0 54)"><g className="env-flock">{BIRDS.map(([x, y, k, p]) => <Bird key={p} x={x} y={y} k={k} p={p} />)}</g></g>
      <g className="hs-3 sv-ground"><rect x="0" y="194" width="1440" height="6" /></g>
    </Scene>
  );
}

// ---------- Water and sewage: a reservoir on the hill, a pipe under the ground through the treatment works and tower to the homes, and, when it rains, a storm overflow into the river ----------
const SUPPLY = "M268 148L300 152Q328 158 336 177H1120";
// Rain for a cloud whose underside is an ellipse (cx, cy, rx, ry): each drop starts a little way up inside it, at a place the cloud covers, and the cloud is drawn over the rain, so
// every drop comes out from underneath it. The rain sits inside the cloud's own drifting group, so it moves with the cloud.
const rainFor = (cx, cy, rx, ry, n, seed) => Array.from({ length: n }, (_, i) => {
  const x = cx - rx * 0.72 + ((i + rnd(seed + i) * 0.7) / n) * rx * 1.44;
  const t = (x - cx) / rx;
  return { x: +x.toFixed(1), y: +(cy + ry * Math.sqrt(Math.max(0, 1 - t * t)) - 7).toFixed(1), i: i % 11 };
});
const Rain = ({ drops, colour }) => <g stroke={colour} strokeWidth="1.5" strokeLinecap="round">{drops.map((r, k) => <path key={k} className="env-rain" d={`M${r.x} ${r.y}l-3 11`} style={{ "--i": r.i }} />)}</g>;
const RAIN = rainFor(1010, 50, 84, 14, 14, 2);
export function WaterScene() {
  return (
    <Scene kind="water">
      <Backdrop id="wt" day sun={null} far={false} clouds={[[300, 42, 1, 141], [560, 26, 0.7, 152], [1250, 40, 0.9, 163]]} />
      <defs><linearGradient id="wt-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--a) 55%, #A9DBFF)" }} /><stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--a) 80%, #1B4F8A)" }} /></linearGradient></defs>
      <path className="hs-1 env-far" d="M0 138C140 118 300 124 460 136S760 146 940 136 1260 122 1440 132V200H0Z" />
      <path className="hs-2 env-slope" d="M0 166C80 132 200 122 306 140S410 170 520 170H1440V184H0Z" />
      {/* the reservoir on the hill, with its dam */}
      <path d="M74 148C104 136 226 134 268 146C246 156 108 158 74 148Z" fill="url(#wt-w)" />
      <path className="env-streamflow" d="M100 146Q170 141 246 146" fill="none" stroke="#DDF1FF" strokeWidth="1.2" opacity=".75" />
      <path className="hs-3" d="M262 142H284L288 154H258Z" />
      {/* the ground, with the supply pipe running through it, and the drops travelling along it */}
      <rect className="hs-3 env-soil" x="320" y="170" width="1120" height="14" />
      <path d={SUPPLY} fill="none" stroke="var(--s4)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity=".6" />
      {[0, 1, 2, 3].map((k) => <circle key={k} r="3.2" className="env-drop" style={{ offsetPath: `path("${SUPPLY}")`, "--d": `${1.2 + k * 1.7}s` }} />)}
      {/* the treatment works: three round tanks with a walkway over them, a control building and the filter beds */}
      {[430, 500, 570].map((x) => (
        <g key={x}>
          <rect className="hs-3" x={x - 30} y="148" width="60" height="22" /><rect className="hs-acc" x={x - 30} y="157" width="60" height="3" opacity=".8" />
          <ellipse className="hs-4" cx={x} cy="148" rx="30" ry="5" /><ellipse cx={x} cy="148" rx="22" ry="2.6" fill="url(#wt-w)" />
        </g>
      ))}
      <path className="hs-line" d="M404 141H596M404 141V147M500 141V147M596 141V147" style={{ strokeWidth: 1.6 }} />
      <g className="hs-3"><rect x="630" y="138" width="76" height="32" /></g><g className="hs-2"><rect x="626" y="133" width="84" height="6" /></g>
      <g className="hs-lamp">{windows(640, 148, 5, 1, 13, 14, 3)}</g>
      <rect x="724" y="164" width="58" height="6" fill="url(#wt-w)" /><rect x="724" y="156" width="58" height="6" fill="url(#wt-w)" opacity=".8" />
      {/* the water tower */}
      <g className="hs-3"><rect x="862" y="116" width="40" height="26" rx="2" /><path className="hs-line" d="M866 142L860 170M898 142L904 170M882 142V170" style={{ strokeWidth: 2.2 }} /></g>
      <path className="hs-2" d="M858 116L882 100L906 116Z" /><rect className="hs-acc" x="862" y="126" width="40" height="4" opacity=".85" />
      {/* the homes, whose windows come on as the water reaches them */}
      <House x={940} y={170} lit={[0, 1]} d={4.6} />
      <House x={984} y={170} w={28} h={24} roof={13} lit={[0, 1]} d={5.6} />
      <House x={1028} y={170} lit={[0, 1]} d={6.6} />
      <House x={1072} y={170} w={30} h={20} lit={[0, 1]} d={7.6} />
      {/* rain over the town, and the storm overflow that opens into the river while it rains */}
      <g className="env-cloud" style={{ "--i": 0 }}><g>
        <Rain drops={RAIN} colour="#E8F4FF" />
        <g fill="color-mix(in srgb, var(--a) 14%, #D3DDEA)"><ellipse cx="1010" cy="50" rx="84" ry="14" /><ellipse cx="976" cy="40" rx="36" ry="16" /><ellipse cx="1030" cy="35" rx="44" ry="19" /><ellipse cx="1066" cy="46" rx="32" ry="13" /></g>
      </g></g>
      <g className="hs-3"><rect x="1128" y="166" width="26" height="18" rx="2" /></g><rect x="1136" y="172" width="10" height="7" rx="3.5" fill="var(--s1)" />
      {/* the river along the foot, with the pale plume from the overflow drifting downstream and then thinning */}
      <rect x="0" y="184" width="1440" height="16" fill="url(#wt-w)" />
      <path className="env-plume" d="M1142 185C1182 183 1222 189 1310 186V196C1222 198 1182 193 1142 191Z" fill="#D7C48E" />
      <path d={crest(188, 2, 60, 26)} fill="none" stroke="#DDF1FF" strokeWidth="1.1" opacity=".75" className="env-wave" />
      <path d={crest(195, 2.2, 80, 20)} fill="none" stroke="#DDF1FF" strokeWidth="1" opacity=".4" className="env-wave env-wave-slow" />
      <Oak x={1262} y={170} s={0.95} i={1} cls="hs-1" /><Oak x={1306} y={170} s={0.8} i={3} cls="hs-1" /><Pine x={1352} y={170} s={1} i={5} cls="hs-1" /><Pine x={1398} y={170} s={0.85} i={2} cls="hs-1" />
    </Scene>
  );
}

// ---------- Flooding and air quality: on the left a river rising up a flood wall past a river-level board and a warning, with homes safe behind it; on the right a city under a haze that clears beside an air-quality monitor ----------
const GAUGE = [["#4FB36B", 180, 120], ["#F3C65A", 120, 60], ["#D8584A", 60, 0]];
const arc = (r, a0, a1) => { const p = (a) => [(Math.cos((a * Math.PI) / 180) * r).toFixed(2), (-Math.sin((a * Math.PI) / 180) * r).toFixed(2)]; const [x0, y0] = p(a0); const [x1, y1] = p(a1); return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`; };
const STORM_A = rainFor(170, 46, 84, 15, 11, 5);
const STORM_B = rainFor(380, 40, 70, 13, 8, 17);
// The city: [x, height, width]. The factory stands to the left of it and the monitor to the right.
const SKYLINE = [[900, 58, 28], [932, 84, 26], [964, 44, 32], [1000, 70, 24], [1030, 96, 28], [1062, 62, 30]];
export function FloodScene() {
  return (
    <Scene kind="flood">
      <Backdrop id="fl" day sun={null} far={false} clouds={[[620, 34, 0.9, 171], [1320, 36, 0.8, 182]]} />
      <defs>
        <clipPath id="fl-river"><rect x="-120" y="150" width="840" height="50" /></clipPath>
        <linearGradient id="fl-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--a) 55%, #9CC4EE)" }} /><stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--a) 80%, #1F3F70)" }} /></linearGradient>
        <linearGradient id="fl-road" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--s1)" stopOpacity="0" /><stop offset=".12" stopColor="var(--s1)" /></linearGradient>
        <radialGradient id="fl-haze" cx="50%" cy="60%" r="60%"><stop offset="0" stopColor="#B9AA92" stopOpacity=".62" /><stop offset="1" stopColor="#B9AA92" stopOpacity="0" /></radialGradient>
      </defs>
      <path className="hs-1 env-far" d="M0 138C160 120 320 132 480 138S720 128 900 134 1200 122 1440 130V200H0Z" />
      {/* the left: a storm cloud, homes behind a flood wall, and the river rising up the wall */}
      <g transform="translate(96 0)">
      <g className="env-cloud" style={{ "--i": 0 }}><g>
        <Rain drops={STORM_A} colour="#E6F0FC" />
        <g fill="color-mix(in srgb, var(--a) 16%, #7F8DA6)"><ellipse cx="170" cy="46" rx="84" ry="15" /><ellipse cx="136" cy="34" rx="38" ry="17" /><ellipse cx="194" cy="30" rx="46" ry="21" /><ellipse cx="238" cy="42" rx="34" ry="14" /></g>
      </g></g>
      <g className="env-cloud" style={{ "--i": 1 }}><g>
        <Rain drops={STORM_B} colour="#E6F0FC" />
        <g fill="color-mix(in srgb, var(--a) 12%, #6F7D96)"><ellipse cx="380" cy="40" rx="70" ry="13" /><ellipse cx="356" cy="30" rx="32" ry="14" /><ellipse cx="400" cy="26" rx="38" ry="17" /></g>
      </g></g>
      <rect className="hs-2" x="-120" y="160" width="780" height="40" />
      <House x={92} y={170} w={34} h={26} roof={15} lit={[0, 1]} d={9} />
      <House x={170} y={170} w={30} h={24} roof={14} lit={[0, 1]} d={9.6} />
      <House x={248} y={170} w={34} h={26} roof={15} lit={[0, 1]} d={10.2} />
      <House x={326} y={170} w={30} h={24} roof={14} lit={[0]} d={10.8} />
      <path className="hs-3" d="M40 164H620V200H40Z" />
      <rect x="36" y="162" width="588" height="4" rx="2" fill="var(--s4)" opacity=".85" />
      <g className="hs-2"><rect x="400" y="164" width="46" height="36" /></g>
      <path d="M409 164V200M419 164V200M429 164V200M439 164V200" stroke="var(--s3)" strokeWidth="1.6" />
      <g clipPath="url(#fl-river)">
        <g className="env-rise" style={{ "--dy": "26px" }}>
          <rect x="-120" y="174" width="840" height="60" fill="url(#fl-w)" opacity=".92" />
          <g transform="translate(-70 0)"><path d={crest(174, 2.6, 60, 14)} fill="none" stroke="#DCEBFB" strokeWidth="1.3" opacity=".9" className="env-wave" /></g>
          <g transform="translate(-70 0)"><path d={crest(184, 3, 80, 10)} fill="none" stroke="#DCEBFB" strokeWidth="1" opacity=".4" className="env-wave env-wave-slow" /></g>
        </g>
      </g>
      {/* the river-level board, with its green, amber and red bands, and the warning sign on the wall */}
      <g transform="translate(496 0)"><rect className="hs-3" x="-5" y="130" width="10" height="70" /><rect x="-3.5" y="134" width="7" height="22" fill="#D8584A" /><rect x="-3.5" y="156" width="7" height="14" fill="#F3C65A" /><rect x="-3.5" y="170" width="7" height="30" fill="#4FB36B" /><path d="M-9 144H-5M-9 156H-5M-9 170H-5M-9 184H-5" stroke="var(--lamp)" strokeWidth="1.2" /></g>
      <g transform="translate(572 162)">
        <rect className="hs-3" x="-1.6" y="-28" width="3.2" height="28" />
        <circle className="ec-halo" cy="-40" r="8" style={{ "--i": 0 }} /><circle className="ec-halo" cy="-40" r="8" style={{ "--i": 1 }} />
        <path d="M0 -54L13 -32H-13Z" fill="#F3C65A" stroke="#B88A2C" strokeWidth="1.4" strokeLinejoin="round" /><path d="M0 -48V-39M0 -36V-34" stroke="#5A3F0A" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* the bank: the river runs in under rising ground, the flood wall ties into it, and it settles back to the level of the town, so the two halves are one landscape */}
      <path className="hs-2" d="M590 200V188C628 186 648 160 700 155C752 150 790 156 830 170V200Z" />
      <path className="hs-1" d="M606 187C632 184 650 162 700 157C748 153 786 158 822 169" fill="none" strokeWidth="2" style={{ stroke: "var(--s3)" }} opacity=".7" />
      </g>
      {/* the right is the air: a factory and traffic putting smoke into the air over a city, a haze that thins, and the air-quality monitor (AIR, with a dial that swings from red to green) */}
      <rect className="hs-2" x="800" y="170" width="640" height="30" />
      {SKYLINE.map(([x, h, w], i) => <g key={x}><rect className="hs-3" x={x} y={170 - h} width={w} height={h} /><g className="hs-lamp">{windows(x + 4, 170 - h + 8, Math.floor((w - 6) / 9), Math.floor((h - 14) / 14), 9, 14, i * 5)}</g></g>)}
      <g transform="translate(0 0)">
        <rect className="hs-3" x="760" y="140" width="96" height="30" />
        <path className="hs-2" d="M760 140V128L778 140V128L796 140V128L814 140V128L832 140V128L850 140V140Z" />
        <g className="hs-lamp">{windows(768, 150, 5, 1, 16, 8, 2)}</g>
        {[[778, 92], [816, 104]].map(([x, top], k) => (
          <g key={x}>
            <rect className="hs-2" x={x - 6} y={top} width="12" height={140 - top} />
            <rect fill="#C75B4B" x={x - 6} y={top} width="12" height="5" />
            {[0, 1, 2].map((q) => <circle key={q} className="ec-puff" cx={x} cy={top - 3} r="5" style={{ "--i": k * 0.5 + q }} />)}
          </g>
        ))}
      </g>
      <rect x="800" y="180" width="640" height="9" fill="url(#fl-road)" />
      <path d="M820 184.500H1300" stroke="var(--lamp)" strokeWidth="1.2" strokeDasharray="10 9" opacity=".55" />
      {[[1046, 0], [1118, 1]].map(([x, k]) => (
        <g key={x} transform={`translate(${x} 182)`}>
          <rect className="hs-4" x="-14" y="-9" width="28" height="8" rx="2.5" />
          <path className="hs-4" d="M-8 -9L-4 -15H6L10 -9Z" />
          <circle cx="-8" cy="-1" r="3" fill="var(--s4)" /><circle cx="8" cy="-1" r="3" fill="var(--s4)" />
          <rect className="hs-win hs-warm" x="11" y="-7" width="3" height="2.4" rx="1" style={{ "--d": "2s" }} />
          <circle className="ec-puff" cx="-17" cy="-4" r="3.500" style={{ "--i": k * 0.7 }} /><circle className="ec-puff" cx="-17" cy="-4" r="3.500" style={{ "--i": k * 0.7 + 1.1 }} />
        </g>
      ))}
      <g className="env-haze"><ellipse cx="900" cy="116" rx="230" ry="54" fill="url(#fl-haze)" /><ellipse cx="1060" cy="126" rx="190" ry="46" fill="url(#fl-haze)" /></g>
      <g className="hs-3"><rect x="1183" y="134" width="5" height="36" /></g>
      <g transform="translate(1186 92)">
        <rect className="hs-3" x="-58" y="-44" width="116" height="92" rx="12" />
        <rect className="env-panel2" x="-53" y="-39" width="106" height="82" rx="9" fill="var(--s2)" stroke="var(--lamp)" strokeWidth="1" opacity=".95" />
        <text x="0" y="-16" textAnchor="middle" fontSize="11.500" fontWeight="800" letterSpacing="1" fill="var(--lamp)" fontFamily="Public Sans, system-ui, sans-serif">AIR QUALITY</text>
        <g transform="translate(0 28)">
          {GAUGE.map(([c, a0, a1]) => <path key={c} d={arc(30, a0, a1)} fill="none" stroke={c} strokeWidth="9" />)}
          <g className="env-needle"><path d="M-2.6 0L0 -27L2.6 0Z" fill="#F4F8FF" /></g>
          <circle r="5" fill="#F4F8FF" />
        </g>
        <circle className="env-led" cx="43" cy="-31" r="3.200" fill="#4FB36B" />
      </g>
      <Oak x={1290} y={170} s={1} i={2} cls="hs-1" /><Pine x={1336} y={170} s={1.05} i={4} cls="hs-1" /><Oak x={1384} y={170} s={0.85} i={5} cls="hs-1" /><Pine x={1428} y={170} s={0.95} i={1} cls="hs-1" />
    </Scene>
  );
}
