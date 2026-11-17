/** @jsxImportSource react */
import "../../justiceart.css";
import { useGo } from "./useGo";
import { CRIME_OUTCOMES as CO } from "../../data/justiceFigures";

// The picture at the top of the Crime page: what happened to the crimes police recorded in the year to March 2026, as a hundred dots. The shares are the Home Office's own (Crime outcomes in
// England and Wales 2025 to 2026, published 23 July 2026), for victim-based offences, which exclude fraud and offences recorded centrally. The "all other outcomes" share is what is left of
// the hundred once the four published shares are taken away.

const COLOURS = { charged: "#2F7D55", evidence: "#C98A1B", nosuspect: "#6B7A8F", open: "#7FA7D6", other: "#C9CED6" };
// The four published shares, and "all other outcomes" as what is left of the hundred. Dots are whole numbers that always add up to 100.
const published = CO.groups.map((g) => ({ ...g, colour: COLOURS[g.key] }));
const otherPct = Math.round((100 - published.reduce((t, g) => t + g.pct, 0)) * 10) / 10;
const GROUPS = (() => {
  const all = [...published, { key: "other", pct: otherPct, label: "All other outcomes", note: "The rest of the hundred.", colour: COLOURS.other }];
  const dots = all.map((g) => Math.round(g.pct));
  dots[dots.indexOf(Math.max(...dots))] += 100 - dots.reduce((t, d) => t + d, 0);
  return all.map((g, i) => ({ ...g, dots: dots[i] }));
})();
const CHIPS = CO.chips;
export default function CrimeOutcomes() {
  const [ref, go] = useGo(0.15);
  let n = 0;
  const dots = GROUPS.flatMap((g) => Array.from({ length: g.dots }, () => ({ g, i: n++ })));
  return (
    <figure ref={ref} className="co" data-go={go}>
      <figcaption>
        <b>What happens to 100 crimes the police record</b>
        <span>About {CO.recordedMillions} million crimes with a victim were recorded in England and Wales in the {CO.year}, {CO.recordedChange}. This is how they ended up, from the Home Office's outcomes figures.</span>
      </figcaption>
      <div className="co-body">
        <div className="co-grid" role="img" aria-label={`Of 100 recorded crimes with a victim: ${GROUPS.map((g) => `${g.dots} ${g.label.toLowerCase()}`).join(", ")}.`}>
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
      <p className="co-src">Victim-based offences only: fraud and offences recorded centrally are left out. One dot is about one crime in a hundred, so the dots are rounded. Source: <a href="https://www.gov.uk/government/statistics/crime-outcomes-in-england-and-wales-2025-to-2026/crime-outcomes-in-england-and-wales-2025-to-2026" target="_blank" rel="noopener noreferrer">Home Office, Crime outcomes in England and Wales 2025 to 2026</a>, published {CO.published}.</p>
    </figure>
  );
}
