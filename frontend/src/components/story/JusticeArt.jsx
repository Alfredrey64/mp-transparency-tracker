/** @jsxImportSource react */
import "../../justiceart.css";
import { useGo } from "./useGo";

// The pictures on the Courts, police and prisons page: the three links of the chain as illustrated cards with the case moving between them, the Crown Court queue as a hundred dots, and the
// projected prison population against the places there are. Every figure is one the page already gives or the official sources it names; each picture plays once when it scrolls into view.

const Station = () => (
  <svg viewBox="0 0 120 70" aria-hidden="true" focusable="false">
    <rect x="14" y="26" width="92" height="38" rx="2" fill="currentColor" opacity=".9" /><rect x="10" y="22" width="100" height="6" rx="1.5" fill="currentColor" />
    <rect x="44" y="32" width="32" height="9" rx="1.5" fill="#fff" opacity=".85" /><rect x="53" y="46" width="14" height="18" rx="1.5" fill="#fff" opacity=".55" />
    <rect x="20" y="40" width="8" height="8" rx="1" fill="#fff" opacity=".6" /><rect x="92" y="40" width="8" height="8" rx="1" fill="#fff" opacity=".6" />
    <circle className="jc-lamp" cx="60" cy="12" r="6.5" fill="#4C86F5" /><rect x="54" y="16" width="12" height="7" rx="1.5" fill="currentColor" />
  </svg>
);
const Court = () => (
  <svg viewBox="0 0 120 70" aria-hidden="true" focusable="false">
    <path d="M10 26 60 6l50 20Z" fill="currentColor" /><rect x="14" y="28" width="92" height="5" fill="currentColor" opacity=".8" />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={20 + i * 16} y="35" width="8" height="24" rx="1.5" fill="currentColor" opacity=".9" />)}
    <rect x="10" y="60" width="100" height="6" rx="1.5" fill="currentColor" />
    <g stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".9"><path d="M60 24V12M52 14h16M52 14l-3 6M52 14l3 6M68 14l-3 6M68 14l3 6" /><path d="M48 20h8M64 20h8" /></g>
  </svg>
);
const Prison = () => (
  <svg viewBox="0 0 120 70" aria-hidden="true" focusable="false">
    <rect x="12" y="24" width="96" height="40" rx="2" fill="currentColor" opacity=".9" />
    <rect x="6" y="14" width="22" height="50" fill="currentColor" /><rect x="92" y="14" width="22" height="50" fill="currentColor" /><path d="M3 14 17 6l14 8ZM89 14l14-8 14 8Z" fill="currentColor" />
    {[0, 1, 2, 3].map((i) => <g key={i}><rect x={36 + i * 18} y="32" width="12" height="14" rx="1.5" fill="#fff" opacity=".35" /><path d={`M${40 + i * 18} 32v14M${44 + i * 18} 32v14`} stroke="currentColor" strokeWidth="1.6" /></g>)}
    <rect x="53" y="50" width="14" height="14" rx="1.5" fill="#fff" opacity=".5" />
  </svg>
);

// ---------- the chain: three cards, the case moving from one to the next ----------
const LINKS = [
  { key: "police", Art: Station, colour: "#3F7D5C", name: "Police", figure: "145,886", unit: "officers", verb: "catch and charge", note: "Full-time equivalent officers in England and Wales on 31 March 2026." },
  { key: "courts", Art: Court, colour: "#9C3B3B", name: "Courts", figure: "80,829", unit: "cases waiting", verb: "hear and decide", note: "Open in the Crown Court at the end of June 2026, the highest on record." },
  { key: "prisons", Art: Prison, colour: "#6E4B6E", name: "Prisons", figure: "85,858", unit: "people held", verb: "hold", note: "Prisoners in England and Wales on 30 June 2026, 2% fewer than a year earlier." },
];
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
          <div key={l.key} className="jc-cell">
            {i > 0 && <div className="jc-link" style={{ "--d": `${0.5 + i * 0.7}s` }} aria-hidden="true"><i /><b /><b /><b /></div>}
            <div className="jc-card" style={{ "--c": l.colour, "--d": `${i * 0.7}s` }}>
              <div className="jc-art"><l.Art /></div>
              <h3>{l.name} <small>{l.verb}</small></h3>
              <p className="jc-fig"><b>{l.figure}</b> <span>{l.unit}</span></p>
              <p className="jc-note">{l.note}</p>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}

// ---------- the queue: of every hundred Crown Court cases waiting, about 29 have been waiting a year or more (23,706 of 80,829) ----------
export function QueueDots() {
  const [ref, go] = useGo(0.25);
  const long = Math.round((23706 / 80829) * 100);
  return (
    <figure ref={ref} className="jq" data-go={go}>
      <div className="jq-grid" role="img" aria-label={`Of every 100 Crown Court cases waiting at the end of June 2026, about ${long} had been open for a year or more.`}>
        {Array.from({ length: 100 }, (_, i) => <i key={i} data-long={i < long ? "1" : "0"} style={{ "--i": i }} />)}
      </div>
      <figcaption>
        <p className="jq-big"><b>{long}</b> in every 100</p>
        <p>cases waiting in the Crown Court had been open for <strong>a year or more</strong> at the end of June 2026: 23,706 of the 80,829 open cases.</p>
        <ul className="jq-key"><li data-long="1">Open a year or more</li><li data-long="0">Open for less than a year</li></ul>
        <small>Each dot is about one case in a hundred.</small>
      </figcaption>
    </figure>
  );
}

// ---------- the prison population against the places: the count in September 2025 and the Ministry of Justice's central projection for the next four Septembers ----------
const SERIES = [
  { label: "Sep 2025", sub: "counted", v: 87465, actual: true },
  { label: "Sep 2026", sub: "projected", v: 91400 },
  { label: "Sep 2027", sub: "projected", v: 94700 },
  { label: "Sep 2028", sub: "projected", v: 97400 },
  { label: "Sep 2029", sub: "projected", v: 99600 },
];
const TOP = 105000;
const CAP = 89334;
const fmt = (n) => n.toLocaleString("en-GB");
export function PrisonProjection() {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="jp" data-go={go}>
      <figcaption>
        <b>Prison places and the population the Ministry of Justice expects</b>
        <span>The projection was published on 4 December 2025, before the 30 June 2026 count of 85,858 above. The Ministry's next projection is provisionally due in December 2026.</span>
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
        <div className="jp-labels">{SERIES.map((s) => <span key={s.label}>{s.label}<small>{s.sub}</small></span>)}</div>
      </div>
      <ul className="jp-key">
        <li data-k="cap">Useable operational capacity: {fmt(CAP)} places (24 November 2025)</li>
        <li data-k="actual">Counted</li>
        <li data-k="proj">Central projection</li>
      </ul>
      <p className="jp-note">By March 2030 the Ministry's central estimate is 100,600, within a range of 98,000 to 103,600. The population was 87,332 on 24 November 2025.</p>
    </figure>
  );
}
