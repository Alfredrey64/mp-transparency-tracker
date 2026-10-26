import { chip } from "../../theme";
import { SKIN } from "./palette";
import { Sky, Ground, Cloud, Person, Bubble, Parliament, BallotBox, Paper, Bulb, Letter, TownHall, QuestionMark } from "./art";
import { B } from "./Scenes";
import { LAYERS, VOICES } from "../../data/teacherMode";

// The pictures for everything that is not one of the four stories. Same rules as Scenes.jsx: a piece appears on the step named by its n.
const Back = ({ tone = "#E3EEFF", tone2 = "#F7FAFF", ground = "#D2E8D2", path = "#EADFC9" }) => (
  <>
    <Sky tone={tone} tone2={tone2} />
    <Cloud x={140} y={70} />
    <Cloud x={620} y={60} s={0.8} delay={-7} />
    <Ground colour={ground} path={path} />
  </>
);

const Label = ({ x, y, size = 30, fill = "#fff", anchor = "middle", weight = 800, children }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fontFamily="Public Sans, system-ui, sans-serif" fill={fill}>{children}</text>
);

const Crown = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-44 0 l-6 -52 l26 24 l24 -40 l24 40 l26 -24 l-6 52z" fill="#F2B632" stroke="#C7871A" strokeWidth="4" strokeLinejoin="round" />
    <rect x="-44" y="0" width="88" height="14" rx="4" fill="#C7871A" />
    <circle cx="-50" cy="-52" r="6" fill="#E0365B" /><circle cx="0" cy="-70" r="6" fill="#E0365B" /><circle cx="50" cy="-52" r="6" fill="#E0365B" />
  </g>
);

function Seats({ x, y, colour, rows = 4 }) {
  const dots = [];
  for (let r = 0; r < rows; r++) {
    const n = 7 + r * 3;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (i / (n - 1));
      dots.push(<circle key={`${r}-${i}`} cx={x - Math.cos(a) * (36 + r * 17)} cy={y - Math.sin(a) * (36 + r * 17)} r="4.2" fill={colour} />);
    }
  }
  return <g>{dots}</g>;
}

export function ChapterScene({ chapter }) {
  const c = chapter.colour;
  return (
    <>
      <Sky tone={`color-mix(in srgb, ${c} 22%, #fff)`} tone2="#FFFFFF" />
      <circle cx="640" cy="120" r="150" fill={c} opacity="0.12" />
      <circle cx="120" cy="360" r="190" fill={c} opacity="0.1" />
      <Ground colour={`color-mix(in srgb, ${c} 18%, #E6F0E6)`} path="#EFE8D8" />
      {chapter.key === "why" && <><Person x={300} y={392} shirt={c} skin={SKIN[2]} mood="happy" /><Person x={380} y={392} kid long shirt="#1E4FB8" skin={SKIN[2]} mood="happy" /><Person x={450} y={392} shirt="#0E9AA7" skin={SKIN[1]} mood="happy" /><B n={0}><Bulb x={380} y={200} /></B></>}
      {chapter.key === "who" && <><TownHall x={120} y={370} /><g transform="translate(480 370)"><Parliament x={0} y={0} s={0.9} /></g></>}
      {chapter.key === "parliament" && <g transform="translate(400 372)"><Parliament x={0} y={0} s={1.6} /></g>}
      {chapter.key === "parties" && [0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i} transform={`translate(${150 + i * 85} 372)`}><rect x="-2" y="-170" width="4" height="170" fill="#6B7A90" /><path d={`M2 -170 h56 l-14 20 l14 20 h-56z`} fill={["#DC241F", "#0087DC", "#E08A00", "#12B6CF", "#6AB023", "#E3B400", "#005B54"][i]} /></g>)}
      {chapter.key === "voice" && <><BallotBox x={400} y={392} /><Bubble x={210} y={150} w={96} h={72} tail="right"><Letter x={0} y={0} /></Bubble><Bubble x={494} y={150} w={96} h={72} tail="left"><Paper x={0} y={0} /></Bubble></>}
    </>
  );
}

export function LayersScene() {
  const band = (y, c, title, n) => (
    <B n={n} fx="rise">
      <rect x="150" y={y} width="500" height="58" rx="16" fill={c} />
      <Label x={400} y={y + 38} size={27}>{title}</Label>
    </B>
  );
  return (
    <>
      <Back />
      {band(150, LAYERS[2].colour, "UK Parliament and government", 3)}
      {band(216, LAYERS[1].colour, "Scotland, Wales, Northern Ireland", 2)}
      {band(282, LAYERS[0].colour, "Your local council", 1)}
      <B n={3} fx="fade"><g transform="translate(176 150)"><Parliament x={0} y={0} s={0.12} /></g></B>
      <Person x={340} y={410} s={0.85} shirt="#E0365B" skin={SKIN[2]} mood="happy" />
      <Person x={400} y={410} s={0.85} kid long shirt="#0E9AA7" skin={SKIN[2]} mood="happy" />
      <Person x={460} y={410} s={0.85} shirt="#1E4FB8" skin={SKIN[1]} mood="happy" />
      <B n={0}>
        <Label x={400} y={118} size={30} fill="#0B1B33">You live here</Label>
        {[[120, "#E9B88A", "#B5533C"], [230, "#F4E2B5", "#8A5A3C"], [570, "#D6E6F5", "#4A6FA5"], [680, "#E9B88A", "#B5533C"]].map(([x, wall, roof]) => (
          <g key={x} transform={`translate(${x} 362)`}><rect x="-38" y="-70" width="76" height="70" fill={wall} /><path d="M-46 -70 l46 -36 l46 36z" fill={roof} /><rect x="-10" y="-40" width="20" height="40" fill="#8A5A3C" /><rect x="14" y="-58" width="16" height="16" fill="#BFE0F5" /></g>
        ))}
      </B>
    </>
  );
}

export function HousesScene() {
  return (
    <>
      <Back />
      <g transform="translate(400 372)"><Parliament x={0} y={0} s={1.35} /></g>
      <B n={1}><rect x="40" y="70" width="250" height="150" rx="20" fill="#16A34A" opacity="0.14" /><Seats x={165} y={196} colour="#16A34A" /><Label x={165} y={104} size={26} fill="#0F6B30">The Commons</Label></B>
      <B n={2}><rect x="510" y="70" width="250" height="150" rx="20" fill="#C0392B" opacity="0.14" /><Seats x={635} y={196} colour="#C0392B" /><Label x={635} y={104} size={26} fill="#8E241A">The Lords</Label></B>
      <B n={3} fx="drop"><Crown x={400} y={90} s={1.1} /></B>
    </>
  );
}

export function RunScene() {
  return (
    <>
      <Back />
      <g transform="translate(130 372)"><Parliament x={0} y={0} s={0.7} /></g>
      <B n={1}>
        <g transform="translate(400 372)">
          <rect x="-70" y="-160" width="140" height="160" rx="6" fill="#B66B4B" />
          <rect x="-42" y="-130" width="84" height="130" rx="4" fill="#16213A" />
          <circle cx="26" cy="-62" r="4.5" fill="#F2B632" />
          <Label x={0} y={-72} size={34} fill="#fff" anchor="middle">10</Label>
        </g>
        <Person x={340} y={400} s={0.9} shirt="#0B1B33" trousers="#16213A" skin={SKIN[0]} hair="#8A5A3C" mood="ok" />
      </B>
      <B n={2}>
        <g transform="translate(640 372)"><rect x="-90" y="-44" width="180" height="44" rx="8" fill="#8A5A3C" /><rect x="-90" y="-54" width="180" height="14" rx="6" fill="#B07A52" /></g>
        <Person x={600} y={400} s={0.9} shirt="#5B6B84" trousers="#16213A" skin={SKIN[3]} hair="#1E1410" long mood="thinking" />
        <Person x={680} y={400} s={0.9} shirt="#5B6B84" trousers="#16213A" skin={SKIN[1]} hair="#6B6B6B" mood="thinking" />
      </B>
      <B n={3} fx="rise"><BallotBox x={400} y={250} /><Label x={400} y={150} size={30} fill="#0B1B33">One MP for each area</Label></B>
    </>
  );
}

export function PartyIntroScene() {
  const flags = ["#DC241F", "#0087DC", "#E08A00", "#12B6CF", "#6AB023"];
  return (
    <>
      <Back />
      {[0, 1, 2, 3, 4].map((i) => <Person key={i} x={200 + i * 100} y={392} shirt={flags[i]} skin={SKIN[i % 5]} mood="happy" long={i % 2 === 0} />)}
      <B n={1} fx="rise">{flags.map((c, i) => <g key={i} transform={`translate(${200 + i * 100} 232)`}><rect x="-2" y="-90" width="4" height="90" fill="#6B7A90" /><path d="M2 -90 h50 l-12 18 l12 18 h-50z" fill={c} /></g>)}</B>
      <B n={2} fx="fade"><Bubble x={330} y={44} w={140} h={80} tail="center"><QuestionMark s={1.2} /></Bubble></B>
    </>
  );
}

export function PartyScene({ party }) {
  const { background, color } = chip(party.colour);
  return (
    <>
      <Back tone={`color-mix(in srgb, ${party.colour} 18%, #fff)`} tone2="#FFFFFF" />
      <rect x="50" y="52" width="700" height="250" rx="28" fill={background} />
      <circle cx="660" cy="112" r="120" fill="#fff" opacity="0.08" />
      <Label x={90} y={140} size={party.name.length > 14 ? 54 : 66} fill={color} anchor="start" weight={700}>{party.name}</Label>
      <Label x={90} y={192} size={32} fill={color} anchor="start" weight={600}>{party.leader}</Label>
      <Label x={90} y={236} size={22} fill={color} anchor="start" weight={500}>{party.role.length > 40 ? party.role.slice(0, 38) + "…" : party.role}</Label>
      <Person x={640} y={382} s={1.7} shirt="#fff" trousers={`color-mix(in srgb, ${party.colour} 55%, #0B1B33)`} skin={SKIN[(party.key.length) % 4]} mood="happy" long={party.key.length % 2 === 0} />
      <B n={1} fx="rise"><Bubble x={90} y={262} w={110} h={86} tail="left"><Bulb x={0} y={0} /></Bubble></B>
      <B n={2} fx="rise"><Bubble x={240} y={262} w={110} h={86} tail="center"><g><Paper x={0} y={0} /><path d="M-6 4 l7 7 l13 -16" stroke="#16A34A" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g></Bubble></B>
    </>
  );
}

export function NiScene() {
  const cols = [["#D46A4C", "Unionist", 70], ["#326760", "Nationalist", 290], ["#C7871A", "Neither", 510]];
  return (
    <>
      <Back />
      {cols.map(([c, label, x], i) => (
        <B key={label} n={i + 1} fx="rise">
          <rect x={x} y={110} width="220" height="190" rx="24" fill={c} />
          <Label x={x + 110} y="196" size={32}>{label}</Label>
          <Person x={x + 110} y={288} s={0.8} shirt="#fff" skin={SKIN[i + 1]} mood="ok" />
        </B>
      ))}
      <Label x={400} y={70} size={30} fill="#0B1B33">Northern Ireland has its own parties</Label>
    </>
  );
}

const ICONS = [
  <g key="s"><rect x="-26" y="-6" width="52" height="30" fill="#E9B88A" /><path d="M-32 -6 l32 -24 l32 24z" fill="#B5533C" /></g>,
  <g key="l"><Letter x={0} y={0} /></g>,
  <g key="p"><Paper x={0} y={0} /><path d="M-6 4 l7 7 l13 -16" stroke="#16A34A" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>,
  <g key="y"><Person x={-22} y={30} s={0.42} kid shirt="#7A5AF0" /><Person x={0} y={30} s={0.42} kid long shirt="#E0365B" /><Person x={22} y={30} s={0.42} kid shirt="#0E9AA7" /></g>,
  <g key="v"><BallotBox x={0} y={26} /></g>,
  <g key="c"><circle cx="-4" cy="-4" r="17" fill="none" stroke="#0E9AA7" strokeWidth="6" /><path d="M9 9 l16 16" stroke="#0E9AA7" strokeWidth="7" strokeLinecap="round" /></g>,
];

export function VoiceScene() {
  return (
    <>
      <Back />
      <B n={0} until={1} fx="fade">
        <Person x={250} y={392} kid shirt="#7A5AF0" skin={SKIN[1]} mood="happy" />
        <Person x={330} y={392} kid long shirt="#E0365B" skin={SKIN[2]} mood="happy" />
        <Person x={410} y={392} kid shirt="#0E9AA7" skin={SKIN[3]} mood="happy" />
        <Person x={490} y={392} kid long shirt="#F2622A" skin={SKIN[0]} mood="happy" />
        <Bubble x={240} y={150} w={100} h={74} tail="left"><text y="14" textAnchor="middle" fontSize="48" fontWeight="800" fontFamily="Newsreader, Georgia, serif" fill="#E0365B">!</text></Bubble>
        <Bubble x={430} y={120} w={120} h={74} tail="right"><Letter x={0} y={0} /></Bubble>
      </B>
      {VOICES.map((v, i) => {
        const n = Math.floor(i / 2) + 1;
        const x = 66 + (i % 3) * 232;
        const y = i < 3 ? 70 : 230;
        return (
          <B key={v.title} n={n} fx="pop">
            <rect x={x} y={y} width="206" height="140" rx="22" fill="#fff" stroke={v.colour} strokeWidth="4" />
            <g transform={`translate(${x + 103} ${y + 56}) scale(0.9)`}>{ICONS[i]}</g>
            <Label x={x + 103} y={y + 124} size={21} fill="#0B1B33" weight={800}>{v.title}</Label>
          </B>
        );
      })}
    </>
  );
}

export function QuizScene({ beat }) {
  return (
    <>
      <Back tone="#EDE7FF" tone2="#FAF8FF" />
      <g className="t-bob"><text x="400" y="230" textAnchor="middle" fontSize="170" fontWeight="800" fontFamily="Newsreader, Georgia, serif" fill="#7A5AF0" opacity="0.9">?</text></g>
      <B n={0} until={1}><Person x={240} y={392} shirt="#7A5AF0" skin={SKIN[1]} mood="thinking" /></B>
      <B n={1} until={2} fx="fade"><Person x={240} y={392} shirt="#7A5AF0" skin={SKIN[1]} mood="happy" /></B>
      <B n={2} fx="fade"><Person x={240} y={392} shirt="#7A5AF0" skin={SKIN[1]} mood="worried" /></B>
      <Person x={560} y={392} kid long shirt="#E0365B" skin={SKIN[2]} mood={beat === 1 ? "happy" : "ok"} />
    </>
  );
}
