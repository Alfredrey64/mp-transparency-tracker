/** @jsxImportSource react */
import "../../justiceart.css";
import { Fragment } from "react";
import { useGo } from "./useGo";
import { useCount } from "./useCount";
import { JUSTICE, PRISON_PROJECTION as PP, fmtN, pctChange } from "../../data/justiceFigures";

// The pictures on the Courts, police and prisons page: the three links of the chain as illustrated cards with the case moving between them, the Crown Court queue as a hundred dots, and the
// projected prison population against the places there are. Every figure is one the page already gives or the official sources it names; each picture plays once when it scrolls into view.

// The three pictures are the same size and each has its own small bit of life that plays when the card scrolls into view: a patrol car pulls up at the station with its lights going, a gavel comes down in
// the court with the case files stacking up beside it, and a searchlight sweeps the prison wall while the cell windows light. All of them are finite and end at rest.
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
    <path d="M62 42 120 20 178 42Z" fill="currentColor" /><rect x="66" y="42" width="108" height="7" fill="currentColor" opacity=".8" />
    {Array.from({ length: 5 }, (_, i) => <rect key={i} x={76 + i * 20} y="50" width="8" height="28" rx="1.5" fill="currentColor" opacity=".9" />)}
    <rect x="68" y="78" width="104" height="6" fill="currentColor" /><rect x="62" y="84" width="116" height="6" fill="currentColor" />
    <g className="jc-scales" transform="translate(120 20)"><g className="jc-beam"><path d="M-16 -10H16M0 -10V0" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".9" /><path d="M-16 -10-21 -1M-16 -10-11 -1M16 -10 11 -1M16 -10 21 -1" stroke="#fff" strokeWidth="1" opacity=".8" /><path d="M-23 -1h14q-2 6-7 6t-7-6ZM9 -1h14q-2 6-7 6t-7-6Z" fill="#fff" opacity=".9" /></g></g>
    <rect x="14" y="76" width="34" height="8" rx="2" fill="currentColor" /><circle className="jc-tap" cx="31" cy="76" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <g transform="translate(60 66)"><g className="jc-gavel"><rect x="-34" y="-1.5" width="34" height="3" rx="1.5" fill="currentColor" opacity=".8" /><rect x="-46" y="-9" width="14" height="18" rx="2.5" fill="currentColor" /></g></g>
    {[[194, 76, 30], [196, 68, 28], [194, 60, 30], [197, 52, 26]].map(([x, y, w], i) => <rect key={i} className="jc-doc" style={{ "--k": i }} x={x} y={y} width={w} height="8" rx="1.6" fill="currentColor" opacity={i % 2 ? 0.55 : 0.9} />)}
  </svg>
);
const Prison = () => (
  <svg viewBox="0 0 240 100" aria-hidden="true" focusable="false">
    <path d="M0 90H240" stroke="currentColor" strokeWidth="2" opacity=".35" />
    <rect x="20" y="64" width="200" height="26" fill="currentColor" opacity=".85" /><rect x="68" y="34" width="104" height="56" fill="currentColor" opacity=".9" />
    <rect x="22" y="30" width="32" height="60" fill="currentColor" /><rect x="186" y="30" width="32" height="60" fill="currentColor" /><path d="M18 30 38 18l20 12ZM182 30l20-12 20 12Z" fill="currentColor" />
    {[0, 1, 2].flatMap((c) => [0, 1].map((r) => <g key={`${c}${r}`} className="jc-cellwin" style={{ "--k": c * 2 + r }}><rect x={80 + c * 28} y={44 + r * 20} width="18" height="13" rx="1.5" fill="#FFE9A8" /><path d={`M${85 + c * 28} ${44 + r * 20}v13M${89 + c * 28} ${44 + r * 20}v13M${93 + c * 28} ${44 + r * 20}v13`} stroke="currentColor" strokeWidth="1.5" /></g>))}
    <rect x="108" y="66" width="24" height="24" rx="1.5" fill="#fff" opacity=".5" />
    <g transform="translate(38 26)"><g className="jc-sweep"><path d="M0 0 150 -16 150 44Z" fill="#FFE9A8" opacity=".3" /></g></g>
    <circle cx="38" cy="26" r="3.4" fill="#FFE9A8" />
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
function Count({ n, go }) {
  return fmtN(Math.round(useCount(n, go)));
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
            {i > 0 && <div className="jc-link" style={{ "--d": `${0.5 + i * 0.7}s` }} aria-hidden="true"><i /><b /><b /><b /></div>}
            <div className="jc-card" style={{ "--c": l.colour, "--d": `${i * 0.7}s` }}>
              <div className="jc-art"><l.Art /></div>
              <h3>{l.name} <small>{l.verb}</small></h3>
              <p className="jc-fig"><b><Count n={l.figure} go={go} /></b> <span>{l.unit}</span></p>
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
