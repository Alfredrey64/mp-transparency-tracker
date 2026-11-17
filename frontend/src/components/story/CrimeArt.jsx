/** @jsxImportSource react */
import "../../justiceart.css";
import { useGo } from "./useGo";

// The picture at the top of the Crime page: what happened to the crimes police recorded in the year to March 2026, as a hundred dots. The shares are the Home Office's own (Crime outcomes in
// England and Wales 2025 to 2026, published 23 July 2026), for victim-based offences, which exclude fraud and offences recorded centrally. The "all other outcomes" share is what is left of
// the hundred once the four published shares are taken away.

const GROUPS = [
  { key: "charged", pct: 7.3, dots: 7, colour: "#2F7D55", label: "Charged or summonsed", note: "Sent forward to be prosecuted." },
  { key: "evidence", pct: 39.0, dots: 39, colour: "#C98A1B", label: "Evidential difficulties", note: "Closed because the evidence was not enough to take it further." },
  { key: "nosuspect", pct: 40.9, dots: 41, colour: "#6B7A8F", label: "No suspect identified", note: "The investigation finished without finding who did it." },
  { key: "open", pct: 6.9, dots: 7, colour: "#7FA7D6", label: "Still being investigated", note: "Still open at the end of March 2026." },
  { key: "other", pct: 5.9, dots: 6, colour: "#C9CED6", label: "All other outcomes", note: "The rest of the hundred." },
];
const CHIPS = [
  ["Robbery", "10.5%", "charged, up from 7.5%"],
  ["Theft", "9.1%", "charged, up from 7.3%"],
  ["Knife-enabled offences", "13.0%", "charged, up from 11.5%"],
  ["Firearm offences", "12.9%", "charged, up from 12.0%"],
  ["Rape", "3.4%", "charged so far; this rises as cases finish"],
  ["Time to a charge", "40 days", "the middle case, down from 41"],
];
export default function CrimeOutcomes() {
  const [ref, go] = useGo(0.15);
  let n = 0;
  const dots = GROUPS.flatMap((g) => Array.from({ length: g.dots }, () => ({ g, i: n++ })));
  return (
    <figure ref={ref} className="co" data-go={go}>
      <figcaption>
        <b>What happens to 100 crimes the police record</b>
        <span>About 4.4 million crimes with a victim were recorded in England and Wales in the year to March 2026, 2% fewer than the year before. This is how they ended up, from the Home Office's outcomes figures.</span>
      </figcaption>
      <div className="co-body">
        <div className="co-grid" role="img" aria-label="Of 100 recorded crimes with a victim: 7 were charged or summonsed, 39 closed for evidential difficulties, 41 closed with no suspect identified, 7 were still being investigated and 6 had another outcome.">
          {dots.map(({ g, i }) => <i key={i} style={{ "--c": g.colour, "--i": i }} />)}
        </div>
        <ul className="co-key">
          {GROUPS.map((g, k) => (
            <li key={g.key} style={{ "--c": g.colour, "--k": k }}>
              <span className="co-pct"><b>{g.pct.toFixed(1)}%</b></span>
              <span className="co-txt"><strong>{g.label}</strong><small>{g.note}</small></span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="co-chips">
        {CHIPS.map(([a, b, c]) => <li key={a}><small>{a}</small><b>{b}</b><span>{c}</span></li>)}
      </ul>
      <p className="co-src">Victim-based offences only: fraud and offences recorded centrally are left out. One dot is about one crime in a hundred, so the dots are rounded. Source: <a href="https://www.gov.uk/government/statistics/crime-outcomes-in-england-and-wales-2025-to-2026/crime-outcomes-in-england-and-wales-2025-to-2026" target="_blank" rel="noopener noreferrer">Home Office, Crime outcomes in England and Wales 2025 to 2026</a>, published 23 July 2026.</p>
    </figure>
  );
}
