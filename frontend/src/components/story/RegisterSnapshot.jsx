/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import REG from "../../data/firsRegister.json";
import "../../foreign.css";

// What the public register of foreign influence held on the day it was last read: the number of entries, which "country or territory of influence" each names, and when each
// was published. The figures are in data/firsRegister.json, copied by hand from the register's own search filters (the register cannot be read by a script), and the picture
// always says on what date. It counts entries; it says nothing about their size or what they cost.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (ym) => { const [y, m] = ym.split("-"); return `${MONTHS[Number(m) - 1]} ${y}`; };
// Every month from the first entry to the last, with the months that had none shown as empty columns rather than left out.
function span(months) {
  const out = [];
  const [y0, m0] = months[0].ym.split("-").map(Number);
  const [y1, m1] = months[months.length - 1].ym.split("-").map(Number);
  const by = new Map(months.map((m) => [m.ym, m.n]));
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? (y++, (m = 1)) : m++) {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ ym, n: by.get(ym) ?? 0 });
  }
  return out;
}
const asOf = new Date(`${REG.checked}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function RegisterSnapshot({ colour = "#5A7FA6" }) {
  const [ref, go] = useGo(0.2);
  const cols = span(REG.months);
  const topMonth = Math.max(...cols.map((c) => c.n));
  const topCountry = REG.countries[0].n;
  return (
    <figure ref={ref} className="fr-snap" data-go={go} style={{ "--tc": colour }}>
      <div className="fr-snap-head">
        <p className="fr-snap-big"><b><AnimatedValue text={String(REG.total)} /></b><span>entries on the public register on {asOf}</span></p>
        <p className="fr-snap-side"><b>{REG.countries.length}</b> countries or territories named · <b>{REG.nameNotDisplayed}</b> entries do not display who registered</p>
      </div>
      <div className="fr-snap-grid">
        <section aria-label="Entries by country or territory of influence">
          <h3>Which country or territory each entry names</h3>
          <ul className="fr-bars">
            {REG.countries.map((c, i) => (
              <li key={c.name} style={{ "--i": i }}>
                <span className="fr-bars-name">{c.name}</span>
                <span className="fr-bars-track" aria-hidden="true"><i style={{ width: `${(c.n / topCountry) * 100}%` }} /></span>
                <b>{c.n}</b>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Entries by month published">
          <h3>When each was published</h3>
          <ol className="fr-cols" style={{ "--n": cols.length }}>
            {cols.map((c, i) => (
              <li key={c.ym} style={{ "--i": i, "--r": c.n / topMonth }} title={`${label(c.ym)}: ${c.n}`}>
                <span className="fr-cols-bar" aria-hidden="true">
                  {c.n > 0 && <b>{c.n}</b>}
                  <i />
                </span>
                <span className="fr-sr">{label(c.ym)}: {c.n}</span>
              </li>
            ))}
          </ol>
          <p className="fr-cols-axis" aria-hidden="true"><span>{label(cols[0].ym)}</span><span>{label(cols[cols.length - 1].ym)}</span></p>
        </section>
      </div>
      <figcaption>
        Counted by hand from the register's own search filters on {asOf}, so it will be out of date as new entries are published. It counts entries, not the size or cost of any activity.{" "}
        <a href={REG.source} target="_blank" rel="noreferrer">Search the register itself</a>.
      </figcaption>
    </figure>
  );
}
