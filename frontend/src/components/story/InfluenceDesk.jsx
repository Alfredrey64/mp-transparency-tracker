/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import REG from "../../data/firsRegister.json";
import "../../story.css";
import "../../heroes.css";

// The banner of the foreign influence page: a case file on the left, a wall of the public register on the right. On the left the four steps from a foreign power's direction to a
// public record light up one after another down a rail; when the last one lights, the wall fills with one small sheet for every entry on the register (the count and the number that
// do not display who registered are from data/firsRegister.json, counted by hand on the date the page says). Entries held back under an exception are not on the register, so
// they are not in the wall and the legend says so. The sheets are not the individual entries: their order and look carry no meaning.
//   stops    [{ icon, title, text }]
//   figures  [{ value, label, sub }]
function Lock() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  );
}

export default function InfluenceDesk({ why, stops, figures }) {
  const [ref, go] = useGo(0.2);
  const sheets = Array.from({ length: REG.total }, (_, k) => k);
  const hidden = REG.nameNotDisplayed;
  return (
    <section ref={ref} className="hx hx-desk" data-go={go} aria-label="At a glance" style={{ "--steps": stops.length }}>
      <p className="hx-why"><strong>Why it matters</strong>{why}</p>

      <div className="hx-desk-grid">
        <ol className="hx-rail">
          {stops.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} style={{ "--i": i }}>
                <span className="hx-rail-node" aria-hidden="true">{Icon && <Icon size={22} />}</span>
                <span className="hx-rail-text"><b>{s.title}</b>{s.text && <small>{s.text}</small>}</span>
              </li>
            );
          })}
        </ol>

        <figure className="hx-wall">
          <figcaption><span>The public register</span><b><AnimatedValue text={String(REG.total)} /> entries</b></figcaption>
          <div className="hx-wall-grid" role="img" aria-label={`${REG.total} entries on the public register, ${hidden} of which do not display who registered`}>
            {sheets.map((k) => (
              <span key={k} className="hx-sheet" data-red={k >= REG.total - hidden ? "1" : "0"} style={{ "--k": k }}><i className="t" /><i className="l" /><i className="l" /><i className="l s" /></span>
            ))}
          </div>
          <p className="hx-held"><Lock /><span>Entries held back under an exception are not on the register, so they are not counted here.</span></p>
          <p className="hx-wall-key" aria-hidden="true"><span><i className="sheet" />One entry</span><span><i className="bar" />Does not display who registered ({hidden})</span></p>
        </figure>
      </div>

      {figures && (
        <ul className="vv-figs">
          {figures.map((f, i) => (
            <li key={f.label} style={{ "--i": i }}>
              <b><AnimatedValue text={f.value} /></b>
              <span>{f.label}</span>
              {f.sub && <em>{f.sub}</em>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
