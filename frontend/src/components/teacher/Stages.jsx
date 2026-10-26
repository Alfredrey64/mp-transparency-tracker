/** @jsxImportSource react */
import { chip } from "../../theme";
import { SKIN } from "./palette";
import { Sky, Ground, Cloud, Person, Bubble, Caption, Parliament, BallotBox, Paper, Bulb, Letter, TownHall, QuestionMark, Confetti, Bus } from "./art";
import { B } from "./Scenes";
import { leaderLook } from "./leaderLooks";
import { LAYERS, VOICES, CHAPTERS } from "../../data/teacherMode";

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
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fontFamily="Figures, Public Sans, system-ui, sans-serif" fill={fill}>{children}</text>
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
      dots.push(<circle key={`${r}-${i}`} data-s="" cx={x - Math.cos(a) * (36 + r * 17)} cy={y - Math.sin(a) * (36 + r * 17)} r="4.2" fill={colour} />);
    }
  }
  return <g>{dots}</g>;
}

export function ChapterScene({ chapter }) {
  const c = chapter.colour;
  const n = CHAPTERS.findIndex((x) => x.key === chapter.key) + 1;
  return (
    <>
      <Sky tone={`color-mix(in srgb, ${c} 22%, #fff)`} tone2="#FFFFFF" />
      <g className="t-float"><circle cx="640" cy="120" r="150" fill={c} opacity="0.12" /></g>
      <g className="t-float" style={{ animationDelay: "-3s" }}><circle cx="120" cy="360" r="190" fill={c} opacity="0.1" /></g>
      <g className="t-numeral"><text x="692" y="214" textAnchor="end" fontSize="230" fontWeight="800" fontFamily="Figures, Newsreader, Georgia, serif" fill={c} opacity="0.2">{n}</text></g>
      <Ground colour={`color-mix(in srgb, ${c} 18%, #E6F0E6)`} path="#EFE8D8" />
      {chapter.key === "why" && <><Person x={300} y={392} shirt={c} skin={SKIN[2]} mood="happy" /><Person x={380} y={392} kid long shirt="#1E4FB8" skin={SKIN[2]} mood="happy" /><Person x={450} y={392} shirt="#0E9AA7" skin={SKIN[1]} mood="happy" /><B n={0}><Bulb x={380} y={200} /></B></>}
      {chapter.key === "who" && <><TownHall x={120} y={370} /><g transform="translate(480 370)"><Parliament x={0} y={0} s={0.9} /></g></>}
      {chapter.key === "parliament" && <g transform="translate(400 372)"><Parliament x={0} y={0} s={1.3} /></g>}
      {chapter.key === "parties" && [0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i} transform={`translate(${150 + i * 85} 372)`}><rect x="-2" y="-170" width="4" height="170" fill="#6B7A90" /><path d={`M2 -170 h56 l-14 20 l14 20 h-56z`} fill={["#DC241F", "#0087DC", "#E08A00", "#12B6CF", "#6AB023", "#E3B400", "#005B54"][i]} /></g>)}
      {chapter.key === "voice" && <><BallotBox x={400} y={392} /><Bubble x={210} y={150} w={96} h={72} tail="right"><Letter x={0} y={0} /></Bubble><Bubble x={494} y={150} w={96} h={72} tail="left"><Paper x={0} y={0} /></Bubble></>}
    </>
  );
}

export function LayersScene() {
  // Three bands, nearest to you at the bottom. The further a group reaches from your front door, the wider its band, so the shape itself says "bigger
  // area, further away". Each has a little picture of itself and says how far it reaches.
  const GLYPHS = {
    council: <g transform="translate(-13 12) scale(0.12)"><TownHall x={0} y={0} /></g>,
    devolved: <g fill="#7A5AF0"><path d="M0 -14 a9 9 0 0 1 9 9 c0 6 -9 17 -9 17 s-9 -11 -9 -17 a9 9 0 0 1 9 -9z" /><circle cx="0" cy="-5" r="3.4" fill="#fff" /></g>,
    uk: <g transform="translate(-13 14) scale(0.12)"><Parliament x={0} y={0} /></g>,
  };
  const band = (key, y, w, c, title, reach, n) => (
    <B n={n} fx="rise">
      <rect x={400 - w / 2} y={y} width={w} height="58" rx="18" fill={c} />
      <circle cx={400 - w / 2 + 34} cy={y + 29} r="22" fill="#fff" />
      <g transform={`translate(${400 - w / 2 + 34} ${y + 29})`}>{GLYPHS[key]}</g>
      <Label x={400 - w / 2 + 68} y={y + 37} size={w < 500 ? 22 : 23} anchor="start">{title}</Label>
      <Label x={400 + w / 2 - 20} y={y + 36} size={15} anchor="end" weight={700} fill="#fff"><tspan opacity="0.9">{reach}</tspan></Label>
    </B>
  );
  return (
    <>
      <Back />
      {band("uk", 50, 720, LAYERS[2].colour, "UK Parliament and government", "The whole UK", 3)}
      {band("devolved", 118, 560, LAYERS[1].colour, "Scotland, Wales, N. Ireland", "Your nation", 2)}
      {band("council", 186, 400, LAYERS[0].colour, "Your local council", "Your area", 1)}
      <B n={0}><g className="t-ripple"><ellipse cx="400" cy="408" rx="92" ry="16" fill="none" stroke="#E0365B" strokeWidth="3" /></g></B>
      <B n={0}>
        {[[110, "#E9B88A", "#B5533C"], [215, "#F4E2B5", "#8A5A3C"], [585, "#D6E6F5", "#4A6FA5"], [690, "#E9B88A", "#B5533C"]].map(([x, wall, roof]) => (
          <g key={x} transform={`translate(${x} 366)`}><rect x="-38" y="-70" width="76" height="70" fill={wall} /><path d="M-46 -70 l46 -36 l46 36z" fill={roof} /><rect x="-10" y="-40" width="20" height="40" fill="#8A5A3C" /><rect x="14" y="-58" width="16" height="16" fill="#BFE0F5" /></g>
        ))}
        <g transform="translate(400 296)">
          <rect x="-84" y="-17" width="168" height="34" rx="17" fill="#fff" fillOpacity="0.95" stroke="#E0365B" strokeWidth="2.5" />
          <Label x={0} y={8} size={21} fill="#0B1B33">You live here</Label>
        </g>
      </B>
      <Person x={340} y={406} s={0.8} shirt="#E0365B" skin={SKIN[2]} mood="happy" />
      <Person x={400} y={406} s={0.8} kid long shirt="#0E9AA7" skin={SKIN[2]} mood="happy" />
      <Person x={460} y={406} s={0.8} shirt="#1E4FB8" skin={SKIN[1]} mood="happy" />
    </>
  );
}

export function HousesScene() {
  // The clock tower stands between the two Houses, with the King's crown on the open ground to its right.
  return (
    <>
      <Back />
      <g transform="translate(300 376)"><Parliament x={0} y={0} s={1.3} /></g>
      <B n={1} stagger><rect x="24" y="30" width="250" height="158" rx="20" fill="#16A34A" opacity="0.14" /><Seats x={149} y={176} colour="#16A34A" /><Label x={149} y={64} size={25} fill="#0F6B30">The Commons</Label></B>
      <B n={2} stagger><rect x="526" y="30" width="250" height="158" rx="20" fill="#C0392B" opacity="0.14" /><Seats x={651} y={176} colour="#C0392B" /><Label x={651} y={64} size={25} fill="#8E241A">The Lords</Label></B>
      <B n={3} fx="drop"><Crown x={640} y={312} s={1.1} /><Label x={640} y={352} size={24} fill="#7A5008">The King</Label></B>
    </>
  );
}

export function RunScene() {
  // Three places, left to right: Parliament makes the laws, 10 Downing Street is where the government works, and the opposition sits across from it.
  // The election, which picks who is in each, comes last and sits above them in the sky.
  return (
    <>
      <Back />
      <g transform="translate(130 372)"><Parliament x={0} y={0} s={0.7} /></g>
      <Caption x={130} y={398} size={17}>Parliament</Caption>
      <B n={1}>
        <g transform="translate(400 372)">
          <rect x="-70" y="-160" width="140" height="160" rx="6" fill="#B66B4B" />
          <rect x="-42" y="-130" width="84" height="130" rx="4" fill="#16213A" />
          <circle cx="26" cy="-62" r="4.5" fill="#F2B632" />
          <Label x={0} y={-72} size={34} fill="#fff" anchor="middle">10</Label>
        </g>
        <Person x={340} y={400} s={0.9} shirt="#0B1B33" trousers="#16213A" skin={SKIN[0]} hair="#8A5A3C" mood="ok" />
        <Caption x={400} y={222} size={24}>The government</Caption>
      </B>
      <B n={2}>
        <g transform="translate(640 372)"><rect x="-90" y="-44" width="180" height="44" rx="8" fill="#8A5A3C" /><rect x="-90" y="-54" width="180" height="14" rx="6" fill="#B07A52" /></g>
        <Person x={600} y={400} s={0.9} shirt="#5B6B84" trousers="#16213A" skin={SKIN[3]} hair="#1E1410" long mood="thinking" />
        <Person x={680} y={400} s={0.9} shirt="#5B6B84" trousers="#16213A" skin={SKIN[1]} hair="#6B6B6B" mood="thinking" />
        <Caption x={640} y={262} size={24}>The opposition</Caption>
      </B>
      <B n={3} fx="rise">
        <BallotBox x={400} y={172} />
        <Caption x={400} y={46} size={26}>General elections</Caption>
        <Caption x={400} y={74} size={18} fill="#44506B">Every area elects one MP</Caption>
      </B>
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

// The House of Commons drawn as 650 dots, one for each seat, fanned out in rows. The party's own seats are coloured in from the left and the rest
// stay grey, so a child can see at a glance how big a party is.
const SEATS_IN_COMMONS = 650;
const FAN = (() => {
  const rows = 10, inner = 48, outer = 114;
  const radii = Array.from({ length: rows }, (_, r) => inner + ((outer - inner) * r) / (rows - 1));
  const total = radii.reduce((t, r) => t + r, 0);
  let left = SEATS_IN_COMMONS;
  const pts = [];
  radii.forEach((r, row) => {
    const n = row === rows - 1 ? left : Math.round((SEATS_IN_COMMONS * r) / total);
    left -= n;
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (k / (n - 1));
      pts.push({ x: -Math.cos(a) * r, y: -Math.sin(a) * r, a, row });
    }
  });
  return pts.sort((p, q) => p.a - q.a || p.row - q.row);
})();

export function PartyScene({ party, seats }) {
  const { background, color } = chip(party.colour);
  const mine = seats ? Math.min(seats, SEATS_IN_COMMONS) : 0;
  const look = leaderLook(party.leader);
  return (
    <>
      <Back tone={`color-mix(in srgb, ${party.colour} 18%, #fff)`} tone2="#FFFFFF" />
      <g className="t-slidein"><rect x="50" y="40" width="700" height="196" rx="28" fill={background} /></g>
      <circle cx="660" cy="100" r="110" fill="#fff" opacity="0.08" />
      <g className="t-slideup" style={{ animationDelay: "0.15s" }}><Label x={90} y={120} size={party.name.length > 14 ? 50 : 62} fill={color} anchor="start" weight={700}>{party.name}</Label></g>
      <g className="t-slideup" style={{ animationDelay: "0.3s" }}><Label x={90} y={168} size={30} fill={color} anchor="start" weight={600}>{party.leader}</Label></g>
      <g className="t-slideup" style={{ animationDelay: "0.42s" }}><Label x={90} y={206} size={party.role.length > 40 ? 17 : 20} fill={color} anchor="start" weight={500}>{party.role.length > 62 ? party.role.slice(0, 60) + "…" : party.role}</Label></g>
      <Person x={650} y={382} s={1.7} shirt="#fff" trousers={`color-mix(in srgb, ${party.colour} 55%, #0B1B33)`} skin={look.skin} hair={look.hair} mood="happy" long={look.long} />
      {mine > 0 && (
        <g transform="translate(165 354)" role="img" aria-label={`${mine} of ${SEATS_IN_COMMONS} seats in the Commons`}>
          {FAN.map((d, i) => (
            i < mine
              ? <circle key={i} className="t-seat" cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r="1.7" fill={party.colour} style={{ animationDelay: `${(0.5 + (i * 1.6) / mine) * 1}s` }} />
              : <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r="1.7" fill="#C3CCDC" />
          ))}
          <text y="-18" textAnchor="middle" fontSize="30" fontWeight="800" fontFamily="Figures, Newsreader, Georgia, serif" fill="#0B1B33">{mine}</text>
          <text y="-2" textAnchor="middle" fontSize="12.5" fontWeight="700" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#44506B">of {SEATS_IN_COMMONS} seats</text>
        </g>
      )}
      <B n={1} fx="rise"><Bubble x={330} y={256} w={110} h={86} tail="left"><Bulb x={0} y={0} /></Bubble></B>
      <B n={2} fx="rise"><Bubble x={460} y={256} w={110} h={86} tail="center"><g><Paper x={0} y={0} /><path d="M-6 4 l7 7 l13 -16" stroke="#16A34A" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g></Bubble></B>
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
          <Label x={x + 110} y="162" size={32}>{label}</Label>
          <Person x={x + 110} y={292} s={0.85} shirt="#fff" skin={SKIN[i + 1]} mood="ok" />
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
        <Bubble x={240} y={150} w={100} h={74} tail="left"><text y="14" textAnchor="middle" fontSize="48" fontWeight="800" fontFamily="Figures, Newsreader, Georgia, serif" fill="#E0365B">!</text></Bubble>
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
            <Label x={x + 103} y={y + 124} size={18.5} fill="#0B1B33" weight={800}>{v.title}</Label>
          </B>
        );
      })}
    </>
  );
}

// The class vote: two columns that grow as the teacher taps in each hand that goes up.
export function VoteScene({ votes = [0, 0] }) {
  const top = Math.max(8, ...votes);
  const cols = [
    { x: 215, colour: "#2F9E6B", icon: (
      <g transform="translate(215 384)">
        <path d="M-52 0 L-30 -62 M52 0 L30 -62 M-30 -62 H30" stroke="#6B7A90" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M-14 -62 v44 M14 -62 v44" stroke="#8A5A3C" strokeWidth="3" /><rect x="-20" y="-20" width="40" height="8" rx="3" fill="#E0775A" />
      </g>) },
    { x: 585, colour: "#1E4FB8", icon: <g transform="translate(585 384) scale(0.6) translate(-125 0)"><Bus x={0} y={0} /></g> },
  ];
  return (
    <>
      <Back tone="#EDE7FF" tone2="#FAF8FF" />
      {cols.map((c, i) => (
        <g key={c.x}>
          <rect x={c.x - 56} y="104" width="112" height="196" rx="16" fill={c.colour} opacity="0.1" />
          <rect className="t-bar" x={c.x - 56} y="104" width="112" height="196" rx="16" fill={c.colour} style={{ transform: `scaleY(${Math.max(votes[i] / top, 0.012)})` }} />
          <text x={c.x} y="86" textAnchor="middle" fontSize="50" fontWeight="800" fontFamily="Figures, Newsreader, Georgia, serif" fill="#0B1B33">{votes[i]}</text>
          {c.icon}
        </g>
      ))}
      {[330, 380, 430, 480].map((x, i) => <Person key={x} x={x} y={400} s={0.7} kid long={i % 2 === 0} shirt={["#7A5AF0", "#E0365B", "#0E9AA7", "#F2622A"][i]} skin={SKIN[(i + 1) % 5]} mood="thinking" />)}
    </>
  );
}

export function QuizScene({ beat }) {
  return (
    <>
      <Back tone="#EDE7FF" tone2="#FAF8FF" />
      <g className="t-bob"><text x="400" y="230" textAnchor="middle" fontSize="170" fontWeight="800" fontFamily="Figures, Newsreader, Georgia, serif" fill="#7A5AF0" opacity="0.9">?</text></g>
      <B n={0} until={1}><Person x={240} y={392} shirt="#7A5AF0" skin={SKIN[1]} mood="thinking" /></B>
      <B n={1} until={2} fx="fade"><Person x={240} y={392} shirt="#7A5AF0" skin={SKIN[1]} mood="happy" /></B>
      <B n={2} fx="fade"><Person x={240} y={392} shirt="#7A5AF0" skin={SKIN[1]} mood="worried" /></B>
      <Person x={560} y={392} kid long shirt="#E0365B" skin={SKIN[2]} mood={beat === 1 || beat === 3 ? "happy" : "ok"} />
      {beat === 3 && <Confetti />}
    </>
  );
}
