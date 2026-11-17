/** @jsxImportSource react */
import "../../servicesart.css";
import { Scene, Backdrop } from "./EconArt";
import { rnd, windows } from "./sceneKit";

// The pictures along the foot of the heading band on the five Public services pages: a school and the steps up to a degree (Education), a train over a viaduct with a bus and a car below (Transport),
// the police station, the court and the prison with a case file travelling between them (Courts and prisons), a street at night where a robber breaks out of a window and the police chase him off (Crime), and a
// broadband line to a row of homes with an age-check gate across it (Digital and online safety). They are decoration only (hidden from screen readers), take their colours from the page's accent, and each plays once or for a
// little while and then rests. With calmer motion asked for they are simply finished (see servicesart.css).

const Ground = () => <g className="hs-3 sv-ground"><rect x="0" y="188" width="1440" height="12" /></g>;
// ---------- Education: a school with a clock tower and a flag, pupils walking in, a stack of books, and steps up to a mortarboard ----------
const PUPILS = [["#F2A33A", 300], ["#E4574F", 352], ["#3F9E8F", 410], ["#6C7BE0", 466], ["#E27AB0", 520], ["#F2C94C", 962], ["#3F9E8F", 1012]];
function Pupil({ x, c, i }) {
  return (
    <g transform={`translate(${x} 188)`}>
      <g className="ec-walk" style={{ "--i": i }}>
        <g className="ec-bob" style={{ "--i": i }}>
          <g className="ec-leg" style={{ "--i": i, transformOrigin: "-1.8px -7px" }}><rect x="-3.2" y="-7" width="2.8" height="7.4" rx="1.2" fill="#232B40" /></g>
          <g className="ec-leg ec-leg-b" style={{ "--i": i, transformOrigin: "1.8px -7px" }}><rect x="0.4" y="-7" width="2.8" height="7.4" rx="1.2" fill="#232B40" /></g>
          <rect x="-4.6" y="-17" width="9.2" height="11" rx="3" fill={c} />
          <circle cx="0" cy="-21" r="3.8" fill="#EBB98F" />
          <rect x="-8" y="-15" width="4.4" height="7" rx="1.2" fill="#2A3350" />
        </g>
      </g>
    </g>
  );
}
const STEPS = [26, 46, 66, 86, 106];
export function EducationScene() {
  return (
    <Scene kind="education">
      <Backdrop id="sv-ed" day sun={null} clouds={[[200, 46, 1.05, 3], [430, 28, 0.75, 14], [1010, 34, 0.9, 8], [1190, 60, 0.5, 21]]} />
      {/* the school: two wings, a centre block with a pediment, a clock tower whose minute hand turns once, and a flag run up its pole */}
      <g className="hs-3"><rect x="566" y="128" width="94" height="60" /><rect x="780" y="128" width="94" height="60" /><rect x="660" y="100" width="120" height="88" /></g>
      <rect className="hs-3" x="702" y="32" width="36" height="72" />
      <path className="hs-2" d="M650 100 720 68 790 100Z" />
      <path className="hs-2" d="M697 32 720 8 743 32Z" />
      <circle className="hs-warm" cx="720" cy="50" r="11" />
      <g className="sv-clock" stroke="#3A2A12" strokeWidth="1.6" strokeLinecap="round"><path d="M720 50V43" /></g>
      <path d="M720 50 725 53" stroke="#3A2A12" strokeWidth="1.8" strokeLinecap="round" />
      {/* every window is the same size on the same grid, each group centred on its block about x = 720: two wings of six columns by three rows, and the centre block's six by two */}
      <g className="hs-lamp">{windows(575.5, 138, 6, 3, 14, 16, 5)}{windows(789.5, 138, 6, 3, 14, 16, 11)}{windows(677.5, 112, 6, 2, 16, 20, 19)}</g>
      <rect className="hs-1" x="706" y="158" width="28" height="30" rx="2" /><rect className="hs-2" x="696" y="184" width="48" height="4" />
      <path d="M906 188V66" stroke="var(--s3)" strokeWidth="2.4" />
      <g className="ec-flag"><rect className="hs-acc" x="908" y="68" width="30" height="18" rx="1" /><path d="M908 77h30" stroke="#fff" strokeWidth="1.6" opacity=".7" /></g>
      {/* books and a pencil */}
      <g className="sv-pop">
        <rect className="hs-acc" x="130" y="176" width="96" height="12" rx="2" /><rect className="hs-4" x="138" y="164" width="82" height="12" rx="2" />
        <rect className="hs-3" x="128" y="152" width="92" height="12" rx="2" /><rect className="hs-acc" x="140" y="140" width="76" height="12" rx="2" />
      </g>
      <g transform="translate(246 188) rotate(-14)"><g className="sv-pop">
        <rect className="hs-acc" x="-4" y="-70" width="8" height="60" /><path d="M-4 -10 0 0 4 -10Z" fill="#F2CDA8" /><path d="M-1.2 -3 0 0 1.2 -3Z" fill="#2A3350" /><rect className="hs-4" x="-4" y="-76" width="8" height="6" rx="1.5" />
      </g></g>
      {/* the steps up: each grows in turn, and a mortarboard lands on the top */}
      {STEPS.map((h, i) => (
        <g key={i} className="sv-grow" style={{ "--i": i }}>
          <rect className={i % 2 ? "hs-2" : "hs-3"} x={1040 + i * 58} y={188 - h} width="56" height={h} />
          <rect className="hs-4" x={1040 + i * 58} y={188 - h} width="56" height="3" opacity=".7" />
        </g>
      ))}
      {/* the mortarboard drops onto the top step, then settles with a small tilt over the corner of the top step; its tassle swings as a pendulum would and settles hanging straight down */}
      <g transform="translate(1314 64)"><g className="sv-hat"><g className="sv-tip">
        <path className="sv-board" d="M0 -12 30 0 0 12 -30 0Z" /><path className="hs-2" d="M-14 6v10q14 8 28 0V6l-14 7Z" />
        <g className="sv-tassle"><path d="M30 0v18" stroke="#F2C94C" strokeWidth="2" /><circle cx="30" cy="20" r="2.6" fill="#F2C94C" /></g>
      </g></g></g>
      {PUPILS.map(([c, x], i) => <Pupil key={x} x={x} c={c} i={i} />)}
      <Ground />
    </Scene>
  );
}

// ---------- Transport: a train crosses a viaduct under overhead wires, a bus and a car run along the road below, and a plane crosses the sky ----------
const ARCHES = Array.from({ length: 19 }, (_, i) => i * 80 - 20);
function Carriage({ x, lead }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect className="hs-4" x="0" y="92" width="136" height="30" rx={lead ? 12 : 5} />
      <rect className="hs-acc" x="0" y="110" width="136" height="6" />
      {Array.from({ length: 7 }, (_, k) => <rect key={k} className="hs-win hs-glass" x={10 + k * 17} y="98" width="11" height="9" rx="1.6" style={{ "--d": `${1 + k * 0.15}s` }} />)}
      <rect className="hs-1" x="4" y="122" width="128" height="3" />
    </g>
  );
}
// The streaks the plane leaves in the air: a broad soft contrail from each engine and a thin line from each wing tip, all fading out behind it, so it reads as moving fast.
function Contrails() {
  return (
    <g aria-hidden="true" transform="translate(0 2) scale(0.69)">
      <defs>
        <linearGradient id="sv-contrail" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.5" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" /></linearGradient>
      </defs>
      <rect x="-430" y="9" width="395" height="3.2" rx="1.6" fill="url(#sv-contrail)" />
      <rect x="-300" y="14.5" width="262" height="2" rx="1" fill="url(#sv-contrail)" />
      <rect x="-210" y="-1" width="172" height="1.6" rx="0.8" fill="url(#sv-contrail)" />
      <rect x="-250" y="-9" width="215" height="1.4" rx="0.7" fill="url(#sv-contrail)" opacity="0.8" />
    </g>
  );
}
// A side-on airliner flying to the right: a long body with a rounded nose, swept tail fin and tail plane, a swept wing with an engine slung under it, a row of cabin windows and a livery stripe.
function Airliner() {
  return (
    <g transform="scale(0.55)">
      <path className="sv-wing" d="M-47 -9 -33 -9 -43 -34 -53 -34Z" />
      <path className="hs-acc" d="M-47 -9 -33 -9 -36 -17 -49 -17Z" />
      <path className="sv-wing" d="M-36 0 -20 0 -46 11 -54 9Z" />
      <path className="hs-4" d="M-52 -3C-52 -9 -45 -10 -37 -10H34C48 -10 58 -5 62 1C58 6 48 9 34 9H-36C-46 9 -52 6 -52 -3Z" />
      <path className="hs-acc" d="M-47 4H48C52 4 56 3 59 2C56 6 48 9 34 9H-36C-42 9 -46 7 -47 4Z" />
      <path className="sv-wing" d="M-4 5 18 5-18 28-30 28Z" />
      <rect className="hs-2" x="-8" y="13" width="20" height="8" rx="4" />
      <rect className="hs-1" x="10" y="14" width="3" height="6" rx="1.5" />
      <path className="hs-1" d="M42 -7 52 -7C55 -6 57 -3 58 -1L42 -1Z" />
      {Array.from({ length: 12 }, (_, k) => <rect key={k} className="hs-1" x={-36 + k * 6.6} y="-6" width="3.6" height="4.4" rx="1.4" />)}
    </g>
  );
}
export function TransportScene() {
  return (
    <Scene kind="transport">
      <Backdrop id="sv-tr" day clouds={[[300, 82, 1.1, 4], [640, 74, 0.8, 19], [1150, 58, 1, 7]]} />
      <g transform="translate(1180 19)"><g className="sv-plane"><Contrails /><Airliner /></g></g>
      {/* the viaduct: a deck on a row of arches */}
      <rect className="hs-2" x="0" y="126" width="1440" height="62" />
      {ARCHES.map((x) => <path key={x} className="hs-1" d={`M${x + 10} 188V160a30 30 0 0 1 60 0V188Z`} />)}
      <rect className="hs-3" x="0" y="122" width="1440" height="7" />
      <path className="hs-line" d="M0 80H1440" strokeWidth="1.2" />
      {Array.from({ length: 13 }, (_, i) => <path key={i} className="hs-line" d={`M${i * 120 + 40} 122V74h-10`} />)}
      <g className="sv-train">
        <Carriage x={230} /><Carriage x={372} /><Carriage x={514} /><Carriage x={656} lead />
      </g>
      <rect className="hs-1" x="0" y="176" width="1440" height="12" /><path className="hs-dash" d="M0 183H1440" />
      {/* a bus and a car on the road */}
      <g className="sv-bus">
        <rect className="hs-acc" x="1000" y="150" width="96" height="30" rx="5" /><rect className="hs-4" x="1006" y="156" width="14" height="10" rx="1.5" />
        {[0, 1, 2, 3].map((k) => <rect key={k} className="hs-4" x={1026 + k * 16} y="156" width="11" height="10" rx="1.5" />)}
        <circle className="hs-1" cx="1020" cy="182" r="7" /><circle className="hs-1" cx="1078" cy="182" r="7" />
      </g>
      <g className="sv-car">
        <path className="hs-4" d="M1170 180v-10l12-4 10-12h34l12 12 12 2v12Z" /><path className="hs-1" d="M1196 156h26l8 10h-42Z" opacity=".6" />
        <circle className="hs-1" cx="1190" cy="182" r="6.5" /><circle className="hs-1" cx="1236" cy="182" r="6.5" />
      </g>
      <Ground />
    </Scene>
  );
}

// ---------- Courts and prisons: a police station, a court with the scales on its dome, and a prison, with a case file travelling from one to the next ----------
const BARS = Array.from({ length: 16 }, (_, i) => ({ x: 1132 + (i % 8) * 25, y: 112 + Math.floor(i / 8) * 22 }));
export function JusticeScene() {
  return (
    <Scene kind="justice">
      <Backdrop id="sv-ju" day sun={null} clouds={[[250, 34, 1, 6], [470, 58, 0.6, 13], [1030, 36, 1.1, 9], [1200, 22, 0.6, 2]]} />
      {/* police station */}
      <g className="sv-police-wall"><rect x="130" y="124" width="196" height="64" /></g>
      <rect className="sv-police-roof" x="124" y="118" width="208" height="9" /><rect className="hs-acc" x="196" y="136" width="64" height="15" rx="2" />
      {/* two floors of windows in matching columns either side of the sign and door, the building's middle line being x = 228 */}
      {[138, 166, 268, 296].flatMap((x, c) => [136, 160].map((y, r) => <rect key={`${c}${r}`} className="hs-win hs-glass" x={x} y={y} width="22" height="16" rx="2" style={{ "--d": `${0.8 + ((c * 2 + r) % 5) * 0.55}s` }} />))}
      <rect className="hs-1" x="215" y="158" width="26" height="30" rx="2" />
      <circle className="sv-glow" cx="228" cy="104" r="22" fill="#3B7BFF" /><rect className="hs-2" x="220" y="108" width="16" height="10" rx="2" /><circle className="sv-blue" cx="228" cy="104" r="8" fill="#5C9BFF" />
      {/* court */}
      <rect className="hs-2" x="548" y="176" width="344" height="12" /><rect className="hs-3" x="560" y="165" width="320" height="12" />
      <path className="hs-2" d="M684 72V62a36 36 0 0 1 72 0V72Z" /><rect className="hs-3" x="714" y="34" width="12" height="10" />
      <path className="hs-3" d="M556 96 720 54 884 96Z" /><rect className="hs-2" x="564" y="94" width="312" height="12" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} className="hs-4" x={584 + i * 36} y="106" width="14" height="59" rx="2" />)}
      {Array.from({ length: 7 }, (_, i) => <rect key={i} className="hs-win hs-glass" x={602 + i * 36} y="122" width="14" height="30" rx="2" style={{ "--d": `${1.4 + i * 0.3}s` }} />)}
      <g className="sv-scales" transform="translate(720 28)">
        <path d="M0 2V-20" stroke="#F7D675" strokeWidth="2" />
        <g className="sv-beam"><path d="M-12 -18H12" stroke="#F7D675" strokeWidth="2" strokeLinecap="round" /><path d="M-12 -18 -17 -8M-12 -18 -7 -8M12 -18 7 -8M12 -18 17 -8" stroke="#F7D675" strokeWidth="1" /><path d="M-18 -8h12q-2 5-6 5t-6-5ZM6 -8h12q-2 5-6 5t-6-5Z" fill="#F7D675" /></g>
      </g>
      {/* prison: a cell block behind a wall with two towers; drawn 40 to the left of where it started so the whole of it stays inside the picture on a narrow screen */}
      <g transform="translate(-40 0)">
      <rect className="sv-brick" x="1116" y="98" width="226" height="52" />
      {BARS.map((b, i) => <g key={i}><rect className="hs-win hs-glass" x={b.x} y={b.y} width="12" height="14" rx="1.5" style={{ "--d": `${1.2 + rnd(i) * 3}s` }} /><path d={`M${b.x + 4} ${b.y}v14M${b.x + 8} ${b.y}v14`} stroke="var(--s1)" strokeWidth="1.4" /></g>)}
      <rect className="sv-brick2" x="1080" y="146" width="302" height="42" /><path className="hs-line" d="M1080 142 1096 136 1112 142 1128 136 1144 142 1160 136 1176 142 1192 136 1208 142 1224 136 1240 142 1256 136 1272 142 1288 136 1304 142 1320 136 1336 142 1352 136 1368 142 1382 138" stroke="var(--s4)" strokeWidth="1.2" />
      <rect className="hs-1" x="1218" y="160" width="30" height="28" rx="2" />
      {[[1084, "a"], [1356, "b"]].map(([x, k]) => (
        <g key={k}><rect className="sv-brick" x={x} y="106" width="24" height="42" /><rect className="sv-brick2" x={x - 5} y="90" width="34" height="18" rx="2" /><path className="hs-1" d={`M${x - 7} 90 ${x + 12} 76 ${x + 31} 90Z`} /><rect className="hs-glass" x={x + 4} y="95" width="16" height="8" rx="1.5" /></g>
      ))}
      </g>
            {/* the case file travels from the station, to the court, and on to the prison */}
      <path className="hs-dash" d="M346 194H1028" />
      <g className="sv-token"><rect className="hs-warm" x="1182" y="184" width="18" height="12" rx="2" /><path d="M1186 188h10M1186 191h7" stroke="#3A2A12" strokeWidth="1.2" /></g>
      <Ground />
    </Scene>
  );
}

// ---------- Crime: a street at night with a police car that pulls up and stops, an officer's door opening, a robber who bursts out of an upstairs window, and two officers who chase him off the page ----------
const HOUSES = Array.from({ length: 8 }, (_, i) => 380 + i * 74);
const LAMPS = [330, 560, 790, 1020, 1270];
// The police car's front and rear doors: the outline of each panel, its window, where its stripe and handle go, its hinge (the front edge) and where an officer stands as they step out.
const DOORS = [
  { hinge: 1146, cx: 1131, panel: "M1117 149H1135L1146 164V178H1117Z", glass: "M1119.500 152H1134L1141 163H1119.500Z", stripe: [1117, 29], handle: 1120.500 },
  { hinge: 1116, cx: 1101, panel: "M1116 149H1097L1086 164V178H1116Z", glass: "M1113.500 152H1099L1092 163H1113.500Z", stripe: [1086, 30], handle: 1089.500 },
]; // an officer steps out of each
const WINDOW_HOUSE = 3; // the house whose upstairs window the robber comes out of
const WX = HOUSES[WINDOW_HOUSE] + 8; // left edge of that window's frame
// Someone seen side-on, facing left, feet on the line y = 0. Legs swing while they run (`ec-stride` in econart.css), starting after `go` seconds.
function Runner({ cop, go = 0 }) {
  const coat = cop ? "#2B3A66" : "#1E2433";
  return (
    <g className="sv-bounce" style={{ "--go": `${go}s`, "--bd": cop ? "0.46s" : "0.38s" }}>
      <g className="sv-leg" style={{ "--go": `${go}s`, transformOrigin: "-1.6px -12px" }}><rect x="-3.2" y="-12" width="3" height="12.4" rx="1.3" fill="#171C2C" /></g>
      <g className="sv-leg sv-leg-b" style={{ "--go": `${go}s`, transformOrigin: "1.6px -12px" }}><rect x="0.2" y="-12" width="3" height="12.4" rx="1.3" fill="#171C2C" /></g>
      {!cop && <rect x="3.5" y="-22" width="8" height="10" rx="2" fill="#C98A1B" />}
      <rect x="-5.5" y="-25" width="11" height="14" rx="3.4" fill={coat} />
      {cop ? <path d="M-5.5 -20h11M-5.5 -15.5h11" stroke="#F2E04A" strokeWidth="1.8" /> : <path d="M-5.5 -21h11M-5.5 -16h11" stroke="#D9DEE8" strokeWidth="2" />}
      <circle cx="-0.5" cy="-29.5" r="4.6" fill="#EBB98F" />
      {cop ? <path d="M-6 -31.5h12l-1.4-5h-9.2Z" fill="#171C2C" /> : <><path d="M-5.4 -33.5c0-4 2.6-5.6 4.9-5.6s4.9 1.6 4.9 5.6Z" fill="#111522" /><rect x="-5.2" y="-31.4" width="9.4" height="3.4" rx="1.4" fill="#111522" /></>}
    </g>
  );
}
export function CrimeScene() {
  const wx = WX;
  return (
    <Scene kind="crime">
      <Backdrop id="sv-cr" />
      {HOUSES.map((x, i) => (
        <g key={x}>
          <rect className={i % 2 ? "hs-2" : "hs-3"} x={x} y="116" width="72" height="72" />
          <path className="hs-1" d={`M${x - 4} 116 ${x + 36} 90 ${x + 76} 116Z`} />
          <rect className="hs-1" x={x + 52} y="80" width="9" height="18" />
          {i === WINDOW_HOUSE ? (
            <g className="hs-lamp">{windows(x + 44, 128, 1, 1, 20, 13, 3)}{windows(x + 10, 162, 1, 1, 20, 13, 8)}</g>
          ) : (
            <g className="hs-lamp">{windows(x + 10, 128, 2, 1, 32, 13, i * 5)}{windows(x + 10, 150, 1, 1, 20, 13, i * 3 + 1)}</g>
          )}
          <rect className="hs-1" x={x + 46} y="158" width="18" height="30" rx="2" />
        </g>
      ))}
      {/* the robber's window: lit with a figure behind it, then the glass goes and it stays dark and open */}
      <rect className="hs-1" x={wx} y="122" width="30" height="34" rx="2" />
      <rect x={wx + 3} y="125" width="24" height="28" fill="#0E1424" />
      <path className="sv-jag" d={`M${wx + 3} 125 ${wx + 9} 125 ${wx + 5} 133ZM${wx + 27} 125 ${wx + 21} 125 ${wx + 25} 134ZM${wx + 3} 153 ${wx + 10} 153 ${wx + 5} 146ZM${wx + 27} 153 ${wx + 20} 153 ${wx + 25} 145Z`} fill="#9FB4D6" opacity=".55" />
      <g className="sv-lit"><rect className="hs-warm" x={wx + 3} y="125" width="24" height="28" /><path d={`M${wx + 15} 125v28M${wx + 3} 139h24`} stroke="#6A5A38" strokeWidth="1.2" /></g>
      <defs>
        <linearGradient id="cr-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9B0" stopOpacity=".62" /><stop offset=".55" stopColor="#FFDC96" stopOpacity=".2" /><stop offset="1" stopColor="#FFD58A" stopOpacity=".06" /></linearGradient>
        <radialGradient id="cr-bulb"><stop offset="0" stopColor="#FFF3CF" stopOpacity=".95" /><stop offset=".35" stopColor="#FFE29A" stopOpacity=".42" /><stop offset="1" stopColor="#FFD98A" stopOpacity="0" /></radialGradient>
        <radialGradient id="cr-pool"><stop offset="0" stopColor="#FFE6A8" stopOpacity=".5" /><stop offset="1" stopColor="#FFE6A8" stopOpacity="0" /></radialGradient>
        <filter id="cr-soft" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="3.2" /></filter>
      </defs>
      {/* each lamp throws a soft cone of light down from its head, with a bright bulb at the top and a pool where it lands on the pavement */}
      {LAMPS.map((x, i) => (
        <g key={x} transform={`translate(${x} 188)`}>
          <g className="sv-light" style={{ "--d": `${0.6 + i * 0.4}s` }}>
            <path d="M7 -75h9l40 75h-89z" fill="url(#cr-cone)" filter="url(#cr-soft)" />
            <ellipse cx="11.5" cy="-1" rx="46" ry="5.5" fill="url(#cr-pool)" />
            <circle cx="11.5" cy="-77" r="17" fill="url(#cr-bulb)" />
          </g>
          <path d="M0 0V-68q0-8 9-8" stroke="var(--s3)" strokeWidth="3" fill="none" strokeLinecap="round" /><rect x="6" y="-80" width="11" height="5" rx="2.5" fill="#FFF0C4" />
        </g>
      ))}
      {/* the police car drives in and stops; its lights keep going */}
      <g className="sv-police">
        <path className="hs-4" d="M1062 180v-12l16-5 14-15h46l14 15 16 3v14Z" /><path className="hs-1" d="M1096 150h40l9 13h-58Z" opacity=".65" /><rect className="hs-acc" x="1062" y="168" width="106" height="5" />
        <rect className="hs-2" x="1106" y="138" width="26" height="6" rx="2" /><circle className="sv-blue" cx="1112" cy="136" r="6" fill="#5C9BFF" /><circle className="sv-red" cx="1126" cy="136" r="6" fill="#FF5C5C" />
        {/* two doors, cut into the side of the body like a real car's: each has its own window, a handle and the stripe running through it, and a thin seam round it. They swing open on their front edge as the car stops,
            let an officer out each, and shut again; the dark doorway shows while they are open. */}
        {DOORS.map((d, k) => (
          <g key={d.hinge} style={{ "--k": `${k * 0.25}s` }}>
            <path className="sv-doorway" d={d.panel} />
            <g className="sv-door" style={{ transformOrigin: `${d.hinge}px 164px` }}>
              <path className="hs-4 sv-seam" d={d.panel} />
              <path className="hs-1" d={d.glass} opacity=".65" />
              <rect className="hs-acc" x={d.stripe[0]} y="168" width={d.stripe[1]} height="5" />
              <rect className="sv-handle" x={d.handle} y="164.500" width="6" height="1.800" rx=".9" />
            </g>
          </g>
        ))}
        <circle className="hs-1" cx="1086" cy="182" r="8" /><circle className="hs-1" cx="1148" cy="182" r="8" /><circle className="hs-3" cx="1086" cy="182" r="3" /><circle className="hs-3" cx="1148" cy="182" r="3" />
      </g>
      {/* the robber leaps from the window as the glass breaks, lands and runs left; shards fly */}
      {[[-38, 34, 140], [-14, 52, -120], [6, 28, 200], [24, 46, -160], [-26, 20, 90], [40, 56, 260]].map(([dx, dy, r], k) => (
        <g key={k} transform={`translate(${wx + 15 + (k - 2.5) * 3} 136)`}><polygon className="sv-shard" points="0,-4 4,3 -3,2" fill="#BFD2F0" style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, "--r": `${r}deg` }} /></g>
      ))}
      {[-14, 0, 14].map((dx, k) => <circle key={k} className="sv-dust" cx={586 + dx} cy="184" r="5" style={{ "--dx": `${dx * 1.4}px` }} />)}
      <g transform="translate(-90 188)"><g className="sv-robber"><Runner go={7} /></g></g>
      {/* two officers get out of the car and give chase */}
      {DOORS.map((d, k) => (
        <g key={k} transform={`translate(${-90 - k * 26} 188)`}><g className="sv-cop" style={{ "--k": `${k * 0.3}s`, "--off": `${d.cx + 90 + k * 26}px` }}><g className="sv-exit" style={{ "--k": `${k * 0.25}s` }}><Runner cop go={6.5 + k * 0.3} /></g></g></g>
      ))}
      <Ground />
    </Scene>
  );
}

// ---------- Digital and online safety: a broadband cabinet and mast, a fibre line running along the street to a row of homes, an age-check gate across the line that lets good traffic through and stops the harmful, and a child at a window with a tablet ----------
const DG_HOMES = [1010, 1100, 1190, 1280];
const GOOD = DG_HOMES.map((x, i) => ({ to: x + 38, delay: 0.8 + i * 1, dur: 5.2 }));
const BAD = [{ delay: 1.5, dur: 4.2 }, { delay: 3.7, dur: 4.2 }];
const GATE_X = 815;
const CABLE_Y = 176;
export function DigitalScene() {
  return (
    <Scene kind="digital">
      <Backdrop id="sv-dg" day clouds={[[520, 38, 1, 10], [1130, 26, 0.9, 17], [300, 60, 0.6, 5]]} />
      {/* the cabinet and mast at the start of the line, with signal spreading from the mast */}
      <rect className="hs-3" x="70" y="124" width="104" height="64" /><rect className="hs-2" x="64" y="118" width="116" height="8" />
      <g className="hs-lamp">{windows(82, 136, 7, 3, 13, 14, 7)}</g>
      <g transform="translate(236 188)">
        <path className="hs-line" d="M-18 0 0 -110 18 0M-12 -30H12M-8 -56H8M-5 -82H5M-18 0 12 -30 -8 -56 8 -56 -12 -30 18 0" strokeWidth="2" />
        {[0, 1, 2].map((i) => <circle key={i} className="sv-ring" cx="0" cy="-116" r="10" style={{ "--i": i }} />)}<circle className="hs-warm" cx="0" cy="-116" r="4" />
      </g>
      {/* the line along the street, its pulses moving */}
      <path className="hs-line sv-cable" d={`M174 ${CABLE_Y}H1346`} style={{ stroke: "var(--lamp)" }} />
      <path className="hs-dash sv-flowline" d={`M174 ${CABLE_Y}H1346`} />
      {/* the age-check gate across the line: two posts, a bar with a 16+ sign, and a beam that scans whatever passes */}
      <rect className="hs-3" x={GATE_X - 36} y="116" width="7" height={188 - 116} /><rect className="hs-3" x={GATE_X + 29} y="116" width="7" height={188 - 116} />
      <rect className="hs-2" x={GATE_X - 42} y="110" width="84" height="10" rx="3" />
      <rect className="sv-gate-beam" x={GATE_X - 29} y="122" width="58" height={CABLE_Y + 8 - 122} fill="var(--lamp)" />
      <circle className="hs-warm" cx={GATE_X} cy="88" r="19" /><circle cx={GATE_X} cy="88" r="19" fill="none" stroke="#B3402E" strokeWidth="3" />
      <text x={GATE_X} y="94" textAnchor="middle" fontSize="17" fontWeight="800" fill="#3A1D12" fontFamily="Figures, 'Public Sans', system-ui, sans-serif">16+</text>
      <rect className="hs-3" x={GATE_X - 2.5} y="106" width="5" height="6" />
      {/* the homes along the line; the last has a child at a lit window with a tablet, and wifi above the roof */}
      {DG_HOMES.map((x, i) => (
        <g key={x}>
          <rect className={i % 2 ? "hs-2" : "hs-3"} x={x} y="122" width="76" height="66" />
          <path className="hs-1" d={`M${x - 5} 122 ${x + 38} 94 ${x + 81} 122Z`} />
          {i < 3 ? <g className="hs-lamp">{windows(x + 10, 134, 2, 1, 32, 13, i * 5 + 2)}{windows(x + 10, 156, 1, 1, 20, 13, i * 3 + 1)}</g> : null}
          <rect className="hs-1" x={x + 50} y="158" width="16" height="30" rx="2" />
        </g>
      ))}
      <rect className="hs-1" x="1282" y="132" width="34" height="32" rx="2" /><rect className="hs-glass" x="1285" y="135" width="28" height="26" />
      <circle cx="1299" cy="147" r="5.4" fill="#C4905F" /><path d="M1288 161v-6q0-5 11-5t11 5v6Z" fill="#4C6FB5" />
      <rect className="sv-screen" x="1293" y="153" width="14" height="8" rx="1.5" fill="#9BDCFF" />
      {[0, 1, 2].map((i) => <path key={i} className="sv-wifi" style={{ "--i": i }} d={`M${1318 - 9 - i * 7} ${96 - 4 - i * 3}a${12 + i * 9} ${12 + i * 9} 0 0 1 ${18 + i * 14} 0`} fill="none" stroke="var(--lamp)" strokeWidth="2.4" strokeLinecap="round" />)}
      <circle className="hs-warm" cx="1318" cy="102" r="2.8" />
      {/* the traffic: green packets travel to the homes; red ones are stopped at the gate with a cross */}
      {GOOD.map((g, i) => (
        <g key={i} transform={`translate(${g.to} ${CABLE_Y})`}>
          <g className="sv-pkt" style={{ "--from": `${-(g.to - 196)}px`, "--delay": `${g.delay}s`, "--dur": `${g.dur}s` }}><rect x="-6" y="-5" width="12" height="10" rx="2.4" fill="#5DD28E" /><path d="M-3 0l2 2 4-4" stroke="#0B3A22" strokeWidth="1.5" fill="none" strokeLinecap="round" /></g>
        </g>
      ))}
      {BAD.map((b, i) => (
        <g key={i}>
          <g transform={`translate(${GATE_X - 44} ${CABLE_Y})`}><g className="sv-bad" style={{ "--from": `${-(GATE_X - 44 - 196)}px`, "--delay": `${b.delay}s`, "--dur": `${b.dur}s` }}><rect x="-6" y="-5" width="12" height="10" rx="2.4" fill="#FF6B5C" /><path d="M0 -3v3M0 2v.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></g></g>
          <g transform={`translate(${GATE_X - 44} ${CABLE_Y - 18})`}><g className="sv-x" style={{ "--delay": `${b.delay + b.dur * 0.8}s` }}><circle r="9" fill="#B3402E" /><path d="M-4 -4 4 4M4 -4-4 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></g></g>
        </g>
      ))}
      <g className="sv-lbls" fontFamily="Figures, 'Public Sans', system-ui, sans-serif" fontSize="12" fontWeight="700" fill="#0F2A52" opacity=".9" textAnchor="middle">
        <text x="122" y="108">Broadband</text><text x={GATE_X} y="52">Age checks</text><text x="1190" y="86">Safe at home</text>
      </g>
      <Ground />
    </Scene>
  );
}
