/** @jsxImportSource react */
import "../../justiceart.css";
import { Fragment } from "react";
import { useGo } from "./useGo";
import { useCount } from "./useCount";
import { JUSTICE, PRISON_PROJECTION as PP, fmtN, pctChange } from "../../data/justiceFigures";

// The pictures on the Courts, police and prisons page: the three links of the chain as illustrated cards with the case moving between them, the Crown Court queue as a hundred dots, and the
// projected prison population against the places there are. Every figure is one the page already gives or the official sources it names; each picture plays once when it scrolls into view.

// The three pictures are the same size and each has its own small bit of life that plays when the card scrolls into view: a patrol car pulls up at the station with its lights going, a gavel comes down in
// the court with the case files stacking up beside it, and the cell windows light up one by one and a flag rises on each tower. All of them are finite and end at rest.
const Station = () => (
  <svg viewBox="0 0 240 100" aria-hidden="true" focusable="false">
    <path d="M0 90H240" stroke="currentColor" strokeWidth="2" opacity=".35" />
    <rect x="128" y="40" width="96" height="50" fill="currentColor" opacity=".9" /><rect x="122" y="34" width="108" height="8" fill="currentColor" />
    <rect x="152" y="50" width="48" height="12" rx="1.5" fill="#fff" opacity=".85" /><rect x="166" y="66" width="20" height="24" rx="1.5" fill="#fff" opacity=".5" />
    <rect x="138" y="52" width="8" height="9" rx="1" fill="#fff" opacity=".6" /><rect x="206" y="52" width="8" height="9" rx="1" fill="#fff" opacity=".6" />
    <circle className="jc-lamp" cx="176" cy="20" r="7.5" fill="#4C86F5" /><rect x="170" y="24" width="12" height="10" rx="1.5" fill="currentColor" />
    <g className="jc-car">
      <path d="M14 84V72l12-4 10-12h32l10 12 12 3v13Z" fill="currentColor" /><path d="M40 68l7-9h24l8 9Z" fill="#fff" opacity=".75" /><rect x="14" y="74" width="86" height="4" fill="#fff" opacity=".6" />
      <rect x="52" y="51" width="16" height="5" rx="2" fill="#1c2233" /><circle className="jc-lamp" cx="56" cy="49" r="3.4" fill="#4C86F5" /><circle className="jc-lamp jc-lamp-b" cx="64" cy="49" r="3.4" fill="#FF5C5C" />
      <circle cx="34" cy="85" r="7" fill="#1c2233" /><circle cx="82" cy="85" r="7" fill="#1c2233" />
    </g>
  </svg>
);
const Court = () => (
  <svg viewBox="0 0 240 100" aria-hidden="true" focusable="false">
    <path d="M0 90H240" stroke="currentColor" strokeWidth="2" opacity=".35" />
    {/* the court: a pediment, six columns and two steps, centred on the picture */}
    <path d="M54 48 120 27 186 48Z" fill="currentColor" /><rect x="58" y="48" width="124" height="6" fill="currentColor" opacity=".8" />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={65 + i * 22.2} y="55" width="8" height="24" rx="1.5" fill="currentColor" opacity=".9" />)}
    <rect x="60" y="79" width="120" height="5" fill="currentColor" /><rect x="54" y="84" width="132" height="6" fill="currentColor" />
    <g transform="translate(120 19)"><g className="jc-beam"><path d="M-17 -9H17M0 -9V3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><path d="M-17 -9-22 0M-17 -9-12 0M17 -9 12 0M17 -9 22 0" stroke="currentColor" strokeWidth="1.1" /><path d="M-25 0h16q-2 6-8 6t-8-6ZM9 0h16q-2 6-8 6t-8-6Z" fill="currentColor" /></g></g>
    {/* the gavel comes down on its block at the left; the case files stack up at the right, the two sides mirroring each other */}
    <rect x="6" y="78" width="28" height="12" rx="2" fill="currentColor" /><circle className="jc-tap" cx="20" cy="78" r="12" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <g transform="translate(46 70)"><g className="jc-gavel"><rect x="-26" y="-1.5" width="26" height="3" rx="1.5" fill="currentColor" opacity=".8" /><rect x="-36" y="-8" width="13" height="16" rx="2.5" fill="currentColor" /></g></g>
    {[0, 1, 2, 3].map((i) => <rect key={i} className="jc-doc" style={{ "--k": i }} x="206" y={82 - i * 9} width="28" height="8" rx="1.6" fill="currentColor" opacity={i % 2 ? 0.55 : 0.9} />)}
  </svg>
);
const WIN = [0, 1, 2, 3];
const Prison = () => (
  <svg viewBox="0 0 240 100" aria-hidden="true" focusable="false">
    <path d="M0 90H240" stroke="currentColor" strokeWidth="2" opacity=".35" />
    {/* everything is laid out about the centre line x = 120: a cell block with two rows of four barred windows and a door, a wall either side, and a tower at each end */}
    <rect x="20" y="64" width="200" height="26" fill="currentColor" opacity=".85" /><rect x="64" y="30" width="112" height="60" fill="currentColor" opacity=".9" />
    <path d="M60 30 120 14 180 30Z" fill="currentColor" />
    <rect x="22" y="34" width="30" height="56" fill="currentColor" /><rect x="188" y="34" width="30" height="56" fill="currentColor" /><path d="M18 34 37 20l19 14ZM184 34l19-14 19 14Z" fill="currentColor" />
    {[0, 1].flatMap((r) => WIN.map((c) => {
      const x = 74 + c * 24; const y = 38 + r * 17;
      return <g key={`${c}${r}`} className="jc-cellwin" style={{ "--k": c + r * 4 }}><rect x={x} y={y} width="20" height="12" rx="1.5" fill="#FFE9A8" /><path d={`M${x + 5} ${y}v12M${x + 10} ${y}v12M${x + 15} ${y}v12`} stroke="currentColor" strokeWidth="1.3" /></g>;
    }))}
    {[37, 203].map((cx) => <g key={cx} className="jc-cellwin" style={{ "--k": 8 }}><rect x={cx - 5} y="46" width="10" height="14" rx="1.5" fill="#FFE9A8" /><path d={`M${cx - 1.7} 46v14M${cx + 1.7} 46v14`} stroke="currentColor" strokeWidth="1.2" /></g>)}
    <rect x="108" y="66" width="24" height="24" rx="1.5" fill="#fff" opacity=".5" /><path d="M120 66v24" stroke="currentColor" strokeWidth="1.4" opacity=".6" />
    <path d="M37 20V9M203 20V9" stroke="currentColor" strokeWidth="1.8" /><g className="jc-flag"><path d="M37 9h12v7H37ZM203 9h12v7h-12Z" fill="currentColor" opacity=".7" /></g>
  </svg>
);

// ---------- the chain: three cards of one size, the case moving from one to the next ----------
const { courts: C, prisons: P, police: PO } = JUSTICE;
const courtsUp = pctChange(C.crownBefore, C.crown);
const LINKS = [
  { key: "police", Art: Station, colour: "#3F7D5C", name: "Police", figure: PO.officers, unit: "officers", verb: "catch and charge", note: `Full-time equivalent officers in England and Wales on ${PO.asAt}.` },
  { key: "courts", Art: Court, colour: "#9C3B3B", name: "Courts", figure: C.crown, unit: "cases waiting", verb: "hear and decide", note: `Open in the Crown Court at the ${C.asAt}, the highest on record${courtsUp > 0 ? `, up ${courtsUp}% on a year earlier` : ""}.` },
  { key: "prisons", Art: Prison, colour: "#6E4B6E", name: "Prisons", figure: P.population, unit: "people held", verb: "hold", note: `Prisoners in England and Wales on ${P.asAt}, ${P.change}.` },
];
// The figure counts up from zero without the layout moving: the final number is always what takes up the room (and what a screen reader reads), and while it counts the changing
// digits are drawn on top of it from a data attribute (see .jc-num in justiceart.css).
function Count({ n, go, delay }) {
  const v = useCount(n, go, 1500, delay);
  const counting = v !== n;
  return <span className="jc-num" data-v={counting ? fmtN(Math.round(v)) : undefined}>{fmtN(n)}</span>;
}
export function JusticeChain() {
  const [ref, go] = useGo(0.2);
  return (
    <figure ref={ref} className="jc" data-go={go}>
      <figcaption>
        <b>One chain, three links</b>
        <span>A crime only has a consequence if the police act, a court hears the case in time and there is somewhere to hold the person if they are sentenced. These are three different counts, not one funnel: they show where each link stands.</span>
      </figcaption>
      <div className="jc-row">
        {LINKS.map((l, i) => (
          <Fragment key={l.key}>
            {i > 0 && <div className="jc-link" style={{ "--d": `${0.5 + i * 0.7}s`, "--from": LINKS[i - 1].colour, "--to": l.colour }} aria-hidden="true"><i /><b /></div>}
            <div className="jc-card" style={{ "--c": l.colour, "--d": `${i * 0.7}s` }}>
              <div className="jc-art"><l.Art /></div>
              <h2>{l.name} <small>{l.verb}</small></h2>
              <p className="jc-fig"><b><Count n={l.figure} go={go} delay={i * 700 + 350} /></b> <span>{l.unit}</span></p>
              <p className="jc-note">{l.note}</p>
            </div>
          </Fragment>
        ))}
      </div>
    </figure>
  );
}

// ---------- the queue: of every hundred Crown Court cases waiting, about 29 have been waiting a year or more (23,706 of 80,829) ----------
export function QueueDots() {
  const [ref, go] = useGo(0.25);
  const long = Math.round((C.crownLong / C.crown) * 100);
  return (
    <figure ref={ref} className="jq" data-go={go}>
      <div className="jq-grid" role="img" aria-label={`Of every 100 Crown Court cases waiting at the ${C.asAt}, about ${long} had been open for a year or more.`}>
        {Array.from({ length: 100 }, (_, i) => <i key={i} data-long={i < long ? "1" : "0"} style={{ "--i": i }} />)}
      </div>
      <figcaption>
        <p className="jq-big"><b>{long}</b> in every 100</p>
        <p>cases waiting in the Crown Court had been open for <strong>a year or more</strong> at the {C.asAt}: {fmtN(C.crownLong)} of the {fmtN(C.crown)} open cases.</p>
        <ul className="jq-key"><li data-long="1">Open a year or more</li><li data-long="0">Open for less than a year</li></ul>
        <small>Each dot is about one case in a hundred.</small>
      </figcaption>
    </figure>
  );
}

// ---------- the prison population against the places: the count in September 2025 and the Ministry of Justice's central projection for the next four Septembers ----------
const SERIES = PP.series;
const TOP = PP.top;
const CAP = PP.capacity;
const fmt = fmtN;
export function PrisonProjection() {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="jp" data-go={go}>
      <figcaption>
        <b>Prison places and the population the Ministry of Justice expects</b>
        <span>The projection was published on {PP.published}, before the {P.asAt} count of {fmt(P.population)} above. The Ministry's next projection is provisionally due in {PP.next}.</span>
      </figcaption>
      <div className="jp-chart" style={{ "--cap": CAP / TOP }}>
        <div className="jp-axis"><span style={{ bottom: `calc(${CAP / TOP} * 100%)` }}>{fmt(CAP)}</span></div>
        <div className="jp-plot">
          <div className="jp-cap" aria-hidden="true" />
          {SERIES.map((s, i) => (
            <div key={s.label} className="jp-col">
              <div className="jp-bar" data-actual={s.actual ? "1" : "0"} data-over={s.v > CAP ? "1" : "0"} style={{ "--v": s.v / TOP, "--i": i }}><b>{fmt(s.v)}</b></div>
            </div>
          ))}
        </div>
        <div className="jp-axis" aria-hidden="true" />
        <div className="jp-labels">{SERIES.map((s) => <span key={s.label}>{s.label}<small>{s.sub === "projected" ? <><span className="jp-w">projected</span><span className="jp-n">proj.</span></> : s.sub}</small></span>)}</div>
      </div>
      <ul className="jp-key">
        <li data-k="cap">Useable operational capacity: {fmt(CAP)} places ({PP.capacityDate})</li>
        <li data-k="actual">Counted</li>
        <li data-k="proj">Central projection</li>
      </ul>
      <p className="jp-note">By March 2030 the Ministry's central estimate is {fmt(PP.march2030.central)}, within a range of {fmt(PP.march2030.low)} to {fmt(PP.march2030.high)}. The population was {fmt(PP.populationThen.value)} on {PP.populationThen.date}.</p>
    </figure>
  );
}
