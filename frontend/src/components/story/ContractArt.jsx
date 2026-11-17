/** @jsxImportSource react */
import { Visual } from "./Kit";
import { Shadow, ArrowDef, Ribbon, Badge } from "./dmx";
import { useGoMotion } from "./useGo";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Figures, Newsreader, Georgia, serif";
const BLUE = "#5A7FA6";
const GREEN = "#3F7D5C";
const GOLD = "#9C6B30";
const RED = "#9C3B3B";

// Every figure here is on the page already (and sourced there): the notice, the conflict rule, 30 days, the £5 million line and 90 days from the Procurement Act 2023; the
// £10.5bn direct awards out of £18.0bn from the National Audit Office. Wording is split by hand into lines for each of the two drawings.
const STEPS = [
  { glyph: "building", c: BLUE, title: ["A public body", "needs something"], wide: ["Departments, councils", "and the NHS buy from", "private companies"], tall: ["Departments, councils and the NHS", "buy from private companies"] },
  { glyph: "doc", c: BLUE, title: ["A notice", "goes out"], wide: ["Published on Find a", "Tender, so any", "company can bid"], tall: ["Published on Find a Tender,", "so any company can bid"] },
  { glyph: "people", c: BLUE, title: ["Bids are", "judged fairly"], wide: ["Conflicts of interest", "must be managed. Some", "suppliers are shut out"], tall: ["Conflicts of interest must be managed.", "Some suppliers are shut out"] },
  { glyph: "tick", c: GREEN, title: ["The contract", "is awarded"], wide: ["Announced within", "30 days of signing"], tall: ["Announced within 30 days of signing"] },
  { glyph: "search", c: GOLD, title: ["Large contracts", "get more checks"], wide: ["Over £5 million: targets", "set, and the contract", "published in 90 days"], tall: ["Over £5 million: targets set, and the", "contract published within 90 days"] },
];

// How a government contract is meant to be won, as five stages along a rail, and the emergency shortcut that skips the middle of them. The boxes arrive first; then a notice
// travels the rail (each stage lights as it passes) and, on a faster loop, a payment-red token takes the shortcut. It is the picture the rest of the page is built on.
export function ContractRoute() {
  return (
    <Visual wide>
      <ContractWide />
      <ContractTall />
      <figcaption>The normal route is open at every stage: anyone can see what is being bought and who won it. The shortcut is allowed in an emergency, and in 2020 it was used on a very large scale.</figcaption>
    </Visual>
  );
}

const Doc = ({ c }) => (
  <>
    <rect x="-10" y="-12" width="20" height="24" rx="3.500" fill="#fff" stroke={c} strokeWidth="2.500" />
    <path d="M -5 -4 H 5 M -5 2 H 5 M -5 8 H 1" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </>
);

// A token that rides a path once per `dur`, fading in at the start and out at the end.
function Rider({ path, begin, dur, children }) {
  return (
    <g opacity="0">
      {children}
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} keyPoints="0;1;1" keyTimes="0;0.9;1" calcMode="linear" />
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.05;0.86;0.92;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
    </g>
  );
}

// A ring that spreads from a stage when the notice reaches it. `at` is how far along the rail (0 to 1) the stage is.
function Ping({ x, y, c, at, start, dur }) {
  const f = at * 0.9;
  const kt = `0;${Math.max(f - 0.001, 0).toFixed(3)};${f.toFixed(3)};${Math.min(f + 0.09, 0.99).toFixed(3)};1`;
  return (
    <circle cx={x} cy={y} r="9" fill="none" stroke={c} strokeWidth="3" opacity="0">
      <animate attributeName="r" values="9;9;9;28;28" keyTimes={kt} dur={`${dur}s`} begin={`${start}s`} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0;0.7;0;0" keyTimes={kt} dur={`${dur}s`} begin={`${start}s`} repeatCount="indefinite" />
    </circle>
  );
}

function ContractWide() {
  const [ref, go, t0] = useGoMotion(0.25, 2.5);
  const x = (i) => 10 + i * 203;
  const cx = (i) => x(i) + 84;
  const rail = 286;
  const lane = `M ${cx(0)} ${rail + 9} C ${cx(0)} 352, ${cx(0) + 28} 394, ${cx(0) + 100} 394 H ${cx(3) - 100} C ${cx(3) - 28} 394, ${cx(3)} 352, ${cx(3)} ${rail + 9}`;
  const railPath = `M 10 ${rail} H 990`;
  const DUR = 10;
  return (
    <svg ref={ref} data-go={go} className="st-trail-wide dmx" viewBox="0 0 1000 540" role="img" aria-label="How a government contract is meant to be won, in five stages: a public body needs something, a notice goes out so any company can bid, bids are judged fairly with conflicts of interest managed, the contract is awarded and announced within 30 days, and contracts over 5 million pounds get further checks. Below it, an emergency shortcut skips the notice and the bidding: a direct award with no competition, which is how 10.5 billion pounds of the 18.0 billion pounds of pandemic contracts were awarded.">
      <defs><Shadow id="cr-sh" /><ArrowDef id="cr-ar" /></defs>
      <Ribbon d={railPath} c={BLUE} delay={0.9} />
      <Ribbon d={lane} c={RED} delay={1.5} arrow="url(#cr-ar)" />
      {STEPS.map((s, i) => (
        <g key={s.title[0]} transform={`translate(${x(i)} 62)`}>
          <g className="dmx-in" style={{ "--d": 0.1 + i * 0.16 }} filter="url(#cr-sh)">
            <rect width="168" height="178" rx="22" fill="#fff" stroke={s.c} strokeWidth="3.500" />
            <text x="84" y="52" textAnchor="middle" fontSize="19" fontWeight="800" fill={INK} fontFamily={S}>{s.title[0]}</text>
            <text x="84" y="75" textAnchor="middle" fontSize="19" fontWeight="800" fill={INK} fontFamily={S}>{s.title[1]}</text>
            {s.wide.map((l, n) => <text key={l} x="84" y={106 + n * 19} textAnchor="middle" fontSize="13.500" fontWeight="600" fill={SOFT} fontFamily={F}>{l}</text>)}
            <Badge x={84} y={0} c={s.c} glyph={s.glyph} k={0.9} />
          </g>
        </g>
      ))}
      <g className="dmx-in" style={{ "--d": 1 }}>
        {STEPS.map((s, i) => <g key={s.glyph}><path d={`M ${cx(i)} 240 V ${rail - 9}`} stroke={s.c} strokeWidth="3" strokeLinecap="round" opacity="0.5" /><circle cx={cx(i)} cy={rail} r="9" fill={s.c} stroke="#fff" strokeWidth="3.500" /></g>)}
      </g>
      <g className="dmx-in" style={{ "--d": 1.7 }}>
        <g transform="translate(192 414)" filter="url(#cr-sh)"><rect width="420" height="36" rx="18" fill="#fff" stroke={RED} strokeWidth="3" strokeDasharray="6 4" /><text x="210" y="24" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Emergency shortcut: a direct award, no competition</text></g>
        <text x="402" y="490" textAnchor="middle" fontSize="18" fontWeight="800" fill={INK} fontFamily={S}>It skips the notice and the bidding.</text>
        <text x="402" y="524" textAnchor="middle" fontSize="16" fontWeight="600" fill={SOFT} fontFamily={F}>In 2020, <tspan fontSize="26" fontWeight="800" fill={RED} fontFamily={S}>£10.5bn</tspan> of the <tspan fontWeight="800" fill={INK}>£18.0bn</tspan> of pandemic contracts was awarded this way.</text>
      </g>
      {t0 !== null && (
        <>
          {STEPS.map((s, i) => <Ping key={s.glyph} x={cx(i)} y={rail} c={s.c} at={(cx(i) - 10) / 980} start={t0} dur={DUR} />)}
          <Rider path={railPath} begin={t0} dur={DUR}><g transform="scale(0.95)"><Doc c={BLUE} /></g></Rider>
          <Rider path={lane} begin={t0 + 1} dur={3.4}>
            <circle r="14" fill={RED} stroke="#fff" strokeWidth="3" /><text y="5" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily={F}>£</text>
          </Rider>
        </>
      )}
    </svg>
  );
}

function ContractTall() {
  const [ref, go, t0] = useGoMotion(0.15, 2.5);
  const y = (i) => 20 + i * 160;
  const cy = (i) => y(i) + 66;
  const rail = 28;
  const lane = `M ${rail} ${cy(0) + 12} C -30 ${cy(0) + 56}, -30 ${cy(3) - 56}, ${rail} ${cy(3) - 12}`;
  const railPath = `M ${rail} ${cy(0)} V ${cy(4)}`;
  const DUR = 10;
  return (
    <svg ref={ref} data-go={go} className="st-trail-tall dmx" viewBox="-34 0 394 880" aria-hidden="true">
      <defs><Shadow id="cr-sh-t" /><ArrowDef id="cr-ar-t" /></defs>
      <Ribbon d={railPath} c={BLUE} delay={0.9} />
      <Ribbon d={lane} c={RED} delay={1.5} arrow="url(#cr-ar-t)" />
      {STEPS.map((s, i) => (
        <g key={s.title[0]} transform={`translate(62 ${y(i)})`}>
          <g className="dmx-in" style={{ "--d": 0.1 + i * 0.16 }} filter="url(#cr-sh-t)">
            <rect width="294" height="132" rx="22" fill="#fff" stroke={s.c} strokeWidth="3.500" />
            <text x="38" y="38" fontSize="18.500" fontWeight="800" fill={INK} fontFamily={S}>{s.title[0]}</text>
            <text x="38" y="60" fontSize="18.500" fontWeight="800" fill={INK} fontFamily={S}>{s.title[1]}</text>
            {s.tall.map((l, n) => <text key={l} x="24" y={92 + n * 19} fontSize="13" fontWeight="600" fill={SOFT} fontFamily={F}>{l}</text>)}
            <Badge x={0} y={66} c={s.c} glyph={s.glyph} k={0.85} />
          </g>
        </g>
      ))}
      <g className="dmx-in" style={{ "--d": 1 }}>
        {STEPS.map((s, i) => <g key={s.glyph}><path d={`M ${rail} ${cy(i)} H 50`} stroke={s.c} strokeWidth="3" strokeLinecap="round" opacity="0.5" /><circle cx={rail} cy={cy(i)} r="9" fill={s.c} stroke="#fff" strokeWidth="3.500" /></g>)}
      </g>
      {t0 !== null && (
        <>
          {STEPS.map((s, i) => <Ping key={s.glyph} x={rail} y={cy(i)} c={s.c} at={(cy(i) - cy(0)) / (cy(4) - cy(0))} start={t0} dur={DUR} />)}
          <Rider path={railPath} begin={t0} dur={DUR}><g transform="scale(0.95)"><Doc c={BLUE} /></g></Rider>
          <Rider path={lane} begin={t0 + 1} dur={3.4}>
            <circle r="14" fill={RED} stroke="#fff" strokeWidth="3" /><text y="5" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily={F}>£</text>
          </Rider>
        </>
      )}
      <g className="dmx-in" style={{ "--d": 1.7 }}>
        <g transform={`translate(-14 ${(cy(0) + cy(3)) / 2}) rotate(-90)`} filter="url(#cr-sh-t)"><rect x="-120" y="-16" width="240" height="32" rx="16" fill="#fff" stroke={RED} strokeWidth="3" strokeDasharray="6 4" /><text y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Emergency shortcut: no competition</text></g>
        <text x="180" y="826" textAnchor="middle" fontSize="16" fontWeight="800" fill={INK} fontFamily={S}>The shortcut skips the notice and the bidding.</text>
        <text x="180" y="858" textAnchor="middle" fontSize="14" fontWeight="600" fill={SOFT} fontFamily={F}>In 2020, <tspan fontSize="22" fontWeight="800" fill={RED} fontFamily={S}>£10.5bn</tspan> of <tspan fontWeight="800" fill={INK}>£18.0bn</tspan> went this way.</text>
      </g>
    </svg>
  );
}

// If 100 suppliers had come in through each lane, how many would have got a contract: 47 of 493 is about ten in a hundred, and 104 of 14,892 is under one. Each lane is a block of
// a hundred dots; the dots that stand for contracts fill in last. A dot is partly filled where the share is not a whole number (9.5 dots, and 0.7 of a dot).
const LANES = [
  { name: "High-priority lane", c: "#E8741A", figure: "47 of 493", words: "suppliers got a contract", big: "about 1 in 10", fill: 9.5 },
  { name: "Ordinary lane", c: "#5A7FA6", figure: "104 of 14,892", words: "suppliers got a contract", big: "fewer than 1 in 100", fill: 0.7 },
];

function Block({ x, y, cols, step, r, c, fill, id, delay }) {
  const dots = Array.from({ length: 100 }, (_, n) => ({ cx: x + r + (n % cols) * step, cy: y + r + Math.floor(n / cols) * step, n }));
  return (
    <g>
      <defs>{dots.filter((d) => d.n < Math.ceil(fill)).map((d) => <clipPath key={d.n} id={`${id}-${d.n}`}><rect x={d.cx - r} y={d.cy - r} width={2 * r * Math.min(1, fill - d.n)} height={2 * r} /></clipPath>)}</defs>
      {dots.map((d) => (
        <g key={d.n} className="lo-dot" style={{ "--n": d.n, "--d": delay }}>
          <circle cx={d.cx} cy={d.cy} r={r} fill="#E6EBF3" />
          {d.n < Math.ceil(fill) && <circle className="lo-win" cx={d.cx} cy={d.cy} r={r} fill={c} clipPath={`url(#${id}-${d.n})`} />}
        </g>
      ))}
    </g>
  );
}

export function LaneOdds() {
  return (
    <Visual wide>
      <LaneWide />
      <LaneTall />
      <figcaption>If 100 suppliers had come in through each lane, about ten would have got a contract through the high-priority lane and fewer than one through the ordinary lane. A part-filled dot is a share that is not a whole number.</figcaption>
    </Visual>
  );
}

function LaneWide() {
  const [ref, go] = useGoMotion(0.3, 0);
  return (
    <svg ref={ref} data-go={go} className="st-trail-wide lo" viewBox="0 0 1000 258" role="img" aria-label="Out of every 100 suppliers, about ten got a contract through the high-priority lane, against fewer than one through the ordinary lane: 47 of 493 suppliers, and 104 of 14,892.">
      {LANES.map((l, k) => (
        <g key={l.name}>
          <text x="10" y={36 + k * 120} fontSize="22" fontWeight="800" fill={l.c} fontFamily={S}>{l.name}</text>
          <text x="10" y={64 + k * 120} fontSize="17" fontWeight="600" fill={SOFT} fontFamily={F}><tspan fontSize="22" fontWeight="800" fill={INK} fontFamily={S}>{l.figure}</tspan> {l.words}</text>
          <text x="990" y={50 + k * 120} textAnchor="end" fontSize="30" fontWeight="800" fill={INK} fontFamily={S}>{l.big}</text>
          <Block id={`lw${k}`} x={10} y={84 + k * 120} cols={50} step={19.6} r={7.5} c={l.c} fill={l.fill} delay={k * 0.5} />
        </g>
      ))}
    </svg>
  );
}

function LaneTall() {
  const [ref, go] = useGoMotion(0.2, 0);
  return (
    <svg ref={ref} data-go={go} className="st-trail-tall lo" viewBox="0 0 360 400" aria-hidden="true">
      {LANES.map((l, k) => (
        <g key={l.name}>
          <text x="8" y={30 + k * 200} fontSize="21" fontWeight="800" fill={l.c} fontFamily={S}>{l.name}</text>
          <text x="8" y={56 + k * 200} fontSize="15" fontWeight="600" fill={SOFT} fontFamily={F}><tspan fontSize="19" fontWeight="800" fill={INK} fontFamily={S}>{l.figure}</tspan> {l.words}</text>
          <text x="8" y={90 + k * 200} fontSize="28" fontWeight="800" fill={INK} fontFamily={S}>{l.big}</text>
          <Block id={`lt${k}`} x={8} y={106 + k * 200} cols={20} step={17.6} r={7} c={l.c} fill={l.fill} delay={k * 0.5} />
        </g>
      ))}
    </svg>
  );
}
