/** @jsxImportSource react */
import "../../servicesart.css";
import { Scene, Defs } from "./EconArt";
import { rnd, windows } from "./sceneKit";

// The pictures along the foot of the heading band on the five Public services pages: a school and the steps up to a degree (Education), a train over a viaduct with a bus and a car below (Transport),
// the police station, the court and the prison with a case file travelling between them (Courts and prisons), a street at night with a police car arriving and a camera watching (Crime), and a
// data centre, a network and a shield (Digital and online safety). They are decoration only (hidden from screen readers), take their colours from the page's accent, and each plays once or for a
// little while and then rests. With calmer motion asked for they are simply finished (see servicesart.css).

const Ground = () => <g className="hs-3"><rect x="0" y="188" width="1440" height="12" /></g>;
const SKY = Array.from({ length: 40 }, (_, i) => ({ x: i * 38 - 10 + rnd(i + 4) * 12, w: 20 + rnd(i) * 22, h: 22 + rnd(i + 9) * 52 }));
const Backdrop = ({ id }) => (
  <>
    <Defs id={id} />
    <rect width="1440" height="200" fill={`url(#${id}-glow)`} />
    <g className="hs-1" opacity=".8">{SKY.map((b, i) => <rect key={i} x={b.x} y={200 - b.h} width={b.w} height={b.h} />)}</g>
  </>
);

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
      <Backdrop id="sv-ed" />
      {/* the school: two wings, a centre block with a pediment, a clock tower whose minute hand turns once, and a flag run up its pole */}
      <g className="hs-3"><rect x="566" y="128" width="124" height="60" /><rect x="750" y="128" width="124" height="60" /><rect x="660" y="100" width="120" height="88" /></g>
      <path className="hs-2" d="M650 100 720 68 790 100Z" />
      <rect className="hs-3" x="702" y="32" width="36" height="38" />
      <path className="hs-2" d="M697 32 720 8 743 32Z" />
      <circle className="hs-warm" cx="720" cy="50" r="11" />
      <g className="sv-clock" stroke="#3A2A12" strokeWidth="1.6" strokeLinecap="round"><path d="M720 50V43" /></g>
      <path d="M720 50 725 53" stroke="#3A2A12" strokeWidth="1.8" strokeLinecap="round" />
      <g className="hs-lamp">{windows(574, 138, 8, 3, 14, 16, 5)}{windows(758, 138, 8, 3, 14, 16, 11)}{windows(672, 112, 6, 2, 16, 18, 19)}</g>
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
      <g transform="translate(1320 66)"><g className="sv-hat">
        <path className="hs-warm" d="M0 -12 30 0 0 12 -30 0Z" /><path className="hs-3" d="M-14 6v10q14 8 28 0V6l-14 7Z" /><path d="M30 0v18" stroke="#F2C94C" strokeWidth="2" /><circle cx="30" cy="20" r="2.6" fill="#F2C94C" />
      </g></g>
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
      {Array.from({ length: 7 }, (_, k) => <rect key={k} className="hs-win hs-warm" x={10 + k * 17} y="98" width="11" height="9" rx="1.6" style={{ "--d": `${1 + k * 0.15}s` }} />)}
      <rect className="hs-1" x="4" y="122" width="128" height="3" />
    </g>
  );
}
export function TransportScene() {
  return (
    <Scene kind="transport">
      <Backdrop id="sv-tr" />
      <g transform="translate(1180 30)"><g className="sv-plane"><path d="M0 0 22 -3 32 -14 36 -14 31 -2 52 4 54 8 30 6 24 12 20 12 22 5 4 6Z" className="hs-4" /><path className="sv-trail" d="M-320 5 0 5" /></g></g>
      {/* the viaduct: a deck on a row of arches */}
      <rect className="hs-2" x="0" y="126" width="1440" height="62" />
      {ARCHES.map((x) => <path key={x} className="hs-1" d={`M${x + 10} 188V160a30 30 0 0 1 60 0V188Z`} />)}
      <rect className="hs-3" x="0" y="122" width="1440" height="7" />
      <path className="hs-line" d="M0 80H1440" strokeWidth="1.2" />
      {Array.from({ length: 13 }, (_, i) => <path key={i} className="hs-line" d={`M${i * 120 + 40} 122V74h-10`} />)}
      <g className="sv-train">
        <Carriage x={230} /><Carriage x={372} /><Carriage x={514} /><Carriage x={656} lead />
        <circle className="hs-warm" cx="796" cy="110" r="4" /><path d="M800 108 940 90v40Z" fill="var(--lamp)" opacity=".16" />
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

// ---------- Courts and prisons: a police station, a court with the scales on its dome, and a prison with a searchlight, with a case file travelling from one to the next ----------
const BARS = Array.from({ length: 16 }, (_, i) => ({ x: 1132 + (i % 8) * 25, y: 112 + Math.floor(i / 8) * 22 }));
export function JusticeScene() {
  return (
    <Scene kind="justice">
      <Backdrop id="sv-ju" />
      {/* police station */}
      <g className="hs-3"><rect x="130" y="124" width="196" height="64" /></g>
      <rect className="hs-2" x="124" y="118" width="208" height="9" /><rect className="hs-acc" x="196" y="136" width="64" height="15" rx="2" />
      <g className="hs-lamp">{windows(144, 160, 4, 1, 22, 13, 3)}{windows(272, 160, 2, 1, 22, 13, 8)}</g>
      <rect className="hs-1" x="216" y="158" width="26" height="30" rx="2" />
      <circle className="sv-glow" cx="229" cy="104" r="22" fill="#3B7BFF" /><rect className="hs-2" x="221" y="108" width="16" height="10" rx="2" /><circle className="sv-blue" cx="229" cy="104" r="8" fill="#5C9BFF" />
      {/* court */}
      <rect className="hs-2" x="548" y="176" width="344" height="12" /><rect className="hs-3" x="560" y="165" width="320" height="12" />
      <path className="hs-2" d="M684 54a36 36 0 0 1 72 0Z" /><rect className="hs-3" x="714" y="26" width="12" height="10" />
      <path className="hs-3" d="M556 96 720 54 884 96Z" /><rect className="hs-2" x="564" y="94" width="312" height="12" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} className="hs-4" x={584 + i * 36} y="106" width="14" height="59" rx="2" />)}
      {Array.from({ length: 7 }, (_, i) => <rect key={i} className="hs-win hs-warm" x={602 + i * 36} y="122" width="14" height="30" rx="2" style={{ "--d": `${1.4 + i * 0.3}s` }} />)}
      <g className="sv-scales" transform="translate(720 22)">
        <path d="M0 0V-14" stroke="#F7D675" strokeWidth="2" />
        <g className="sv-beam"><path d="M-12 -12H12" stroke="#F7D675" strokeWidth="2" strokeLinecap="round" /><path d="M-12 -12 -17 -2M-12 -12 -7 -2M12 -12 7 -2M12 -12 17 -2" stroke="#F7D675" strokeWidth="1" /><path d="M-18 -2h12q-2 5-6 5t-6-5ZM6 -2h12q-2 5-6 5t-6-5Z" fill="#F7D675" /></g>
      </g>
      {/* prison: a cell block behind a wall with two towers, one of them sweeping a searchlight */}
      <rect className="hs-3" x="1116" y="98" width="226" height="52" />
      {BARS.map((b, i) => <g key={i}><rect className="hs-win hs-lamp" x={b.x} y={b.y} width="12" height="14" rx="1.5" style={{ "--d": `${1.2 + rnd(i) * 3}s` }} /><path d={`M${b.x + 4} ${b.y}v14M${b.x + 8} ${b.y}v14`} stroke="var(--s1)" strokeWidth="1.4" /></g>)}
      <rect className="hs-2" x="1080" y="146" width="302" height="42" /><path className="hs-line" d="M1080 142 1096 136 1112 142 1128 136 1144 142 1160 136 1176 142 1192 136 1208 142 1224 136 1240 142 1256 136 1272 142 1288 136 1304 142 1320 136 1336 142 1352 136 1368 142 1382 138" stroke="var(--s4)" strokeWidth="1.2" />
      <rect className="hs-1" x="1218" y="160" width="30" height="28" rx="2" />
      {[[1084, "a"], [1356, "b"]].map(([x, k]) => (
        <g key={k}><rect className="hs-3" x={x} y="106" width="24" height="42" /><rect className="hs-2" x={x - 5} y="90" width="34" height="18" rx="2" /><path className="hs-1" d={`M${x - 7} 90 ${x + 12} 76 ${x + 31} 90Z`} /><rect className="hs-warm" x={x + 4} y="95" width="16" height="8" rx="1.5" /></g>
      ))}
      <g transform="translate(1096 99)"><g className="sv-sweep"><path d="M0 0 220 -10 220 60Z" fill="var(--lamp)" opacity=".2" /></g></g>
      {/* the case file travels from the station, to the court, and on to the prison */}
      <path className="hs-dash" d="M346 194H1068" />
      <g className="sv-token"><rect className="hs-warm" x="1222" y="184" width="18" height="12" rx="2" /><path d="M1226 188h10M1226 191h7" stroke="#3A2A12" strokeWidth="1.2" /></g>
      <Ground />
    </Scene>
  );
}

// ---------- Crime: a street at night, its windows lit, a police car arriving with its lights going, an officer, and a camera watching the corner ----------
const HOUSES = Array.from({ length: 8 }, (_, i) => 380 + i * 74);
const LAMPS = [330, 560, 790, 1020, 1270];
export function CrimeScene() {
  return (
    <Scene kind="crime">
      <Backdrop id="sv-cr" />
      <g className="sv-shield"><path className="hs-line" d="M150 44 90 64v38c0 34 28 54 60 66 32-12 60-32 60-66V64Z" style={{ stroke: "var(--lamp)" }} /><path className="hs-line" d="M122 104l20 20 38-40" style={{ stroke: "var(--lamp)", strokeWidth: 5 }} /></g>
      {HOUSES.map((x, i) => (
        <g key={x}>
          <rect className={i % 2 ? "hs-2" : "hs-3"} x={x} y="116" width="72" height="72" />
          <path className="hs-1" d={`M${x - 4} 116 ${x + 36} 90 ${x + 76} 116Z`} />
          <rect className="hs-1" x={x + 52} y="80" width="9" height="18" />
          <g className="hs-lamp">{windows(x + 10, 128, 2, 1, 32, 13, i * 5)}{windows(x + 10, 150, 1, 1, 20, 13, i * 3 + 1)}</g>
          <rect className="hs-1" x={x + 46} y="158" width="18" height="30" rx="2" />
        </g>
      ))}
      {LAMPS.map((x, i) => (
        <g key={x} transform={`translate(${x} 188)`}>
          <circle className="ec-lampglow" cy="-70" r="26" fill="#FFD98A" style={{ "--d": `${0.6 + i * 0.4}s` }} />
          <path d="M0 0V-68q0-8 9-8" stroke="var(--s3)" strokeWidth="3" fill="none" strokeLinecap="round" /><rect x="6" y="-80" width="11" height="5" rx="2.5" fill="#FFE6A8" />
        </g>
      ))}
      {/* the camera on its pole sweeps the corner */}
      <g transform="translate(1380 188)">
        <path className="hs-line" d="M0 0V-96" strokeWidth="4" />
        <g transform="translate(0 -96)"><g className="sv-scan"><path d="M0 0 -150 70 -150 -4Z" fill="var(--lamp)" opacity=".16" /><rect className="hs-4" x="-16" y="-6" width="26" height="12" rx="3" /><circle className="sv-led" cx="6" cy="0" r="2.4" fill="#FF5C5C" /></g></g>
      </g>
      {/* the officer and the police car */}
      <g transform="translate(1010 188)"><rect x="-4" y="-34" width="8" height="34" rx="2" fill="#232B40" /><rect x="-6" y="-36" width="12" height="17" rx="3" fill="#2B3A66" /><path d="M-6 -30h12M-6 -25h12" stroke="#F2E04A" strokeWidth="2" /><circle cy="-41" r="4.4" fill="#EBB98F" /><path d="M-5.5 -43h11l-1-4h-9Z" fill="#232B40" /></g>
      <g className="sv-police">
        <path className="hs-4" d="M1062 180v-12l16-5 14-15h46l14 15 16 3v14Z" /><path className="hs-1" d="M1096 150h40l9 13h-58Z" opacity=".65" /><rect className="hs-acc" x="1062" y="168" width="106" height="5" />
        <rect className="hs-2" x="1106" y="138" width="26" height="6" rx="2" /><circle className="sv-blue" cx="1112" cy="136" r="6" fill="#5C9BFF" /><circle className="sv-red" cx="1126" cy="136" r="6" fill="#FF5C5C" />
        <circle className="hs-1" cx="1086" cy="182" r="8" /><circle className="hs-1" cx="1148" cy="182" r="8" />
      </g>
      <Ground />
    </Scene>
  );
}

// ---------- Digital and online safety: a mast sending out signals, a data centre whose lights blink, a network of connected points, and a shield with a padlock ----------
const NODES = [[120, 58], [280, 96], [450, 46], [640, 86], [820, 38], [1000, 80], [1180, 44], [1340, 92]];
export function DigitalScene() {
  return (
    <Scene kind="digital">
      <Backdrop id="sv-dg" />
      <g className="hs-dash sv-net">{NODES.slice(1).map(([x, y], i) => <path key={i} d={`M${NODES[i][0]} ${NODES[i][1]}L${x} ${y}`} />)}<path d="M120 58 450 46M450 46 820 38M820 38 1180 44M280 96 640 86M640 86 1000 80" /></g>
      {NODES.map(([x, y], i) => (
        <g key={i}><circle className="ec-halo" cx={x} cy={y} r="5" style={{ "--i": i * 0.5 }} /><circle className="ec-dot" cx={x} cy={y} r="4" style={{ "--i": i * 0.5 }} /></g>
      ))}
      {/* the mast, with signal rings spreading from its top */}
      <g transform="translate(200 188)">
        <path className="hs-line" d="M-18 0 0 -110 18 0M-12 -30H12M-8 -56H8M-5 -82H5M-18 0 12 -30 -8 -56 8 -56 -12 -30 18 0" strokeWidth="2" />
        {[0, 1, 2].map((i) => <circle key={i} className="sv-ring" cx="0" cy="-116" r="10" style={{ "--i": i }} />)}<circle className="hs-warm" cx="0" cy="-116" r="4" />
      </g>
      {/* the data centre */}
      <rect className="hs-3" x="556" y="112" width="328" height="76" /><rect className="hs-2" x="548" y="106" width="344" height="8" />
      {[0, 1, 2, 3].map((i) => <rect key={i} className="hs-2" x={584 + i * 74} y="92" width="46" height="14" rx="2" />)}
      <g className="hs-lamp">{windows(570, 124, 14, 4, 22, 15, 7)}</g>
      <rect className="hs-1" x="700" y="166" width="40" height="22" rx="2" />
      {/* a laptop, and a shield with a padlock whose tick draws itself */}
      <g transform="translate(1290 188)"><rect className="hs-3" x="-40" y="-8" width="80" height="8" rx="3" /><rect className="hs-2" x="-30" y="-52" width="60" height="44" rx="3" /><rect className="hs-win hs-lamp" x="-26" y="-48" width="52" height="36" rx="2" /><path className="sv-tick" pathLength="1" d="M-12 -30 -4 -22 12 -40" /></g>
      <g transform="translate(1110 0)">
        <path className="hs-2" d="M0 56 -36 70v34c0 28 18 46 36 56 18-10 36-28 36-56V70Z" style={{ stroke: "var(--lamp)", strokeWidth: 2 }} />
        <rect className="hs-4" x="-13" y="102" width="26" height="22" rx="3" /><path d="M-8 102V94a8 8 0 0 1 16 0v8" fill="none" stroke="var(--s4)" strokeWidth="3.4" /><circle cx="0" cy="112" r="2.6" className="hs-2" />
      </g>
      <Ground />
    </Scene>
  );
}
