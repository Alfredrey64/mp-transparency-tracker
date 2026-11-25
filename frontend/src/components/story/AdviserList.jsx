/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { Batches } from "../Unfold";
import "../../accountability.css";
import "../../advisers.css";

// Every special adviser in the Cabinet Office's annual list (data/specialAdvisers.json), searchable by name and filterable by the minister they work for or their pay band.
// The salary is shown only where the report gives one: for advisers paid £81,000 or more it gives a £5,000 band, and for the rest nothing.
const PAGE = 20;
const BAND_COLOUR = { 1: "#7B5BD6", 2: "#2C7DA0", 3: "#3F7D5C", 4: "#C88A1E" };
const key = (a) => `${a.role}|${a.minister ?? ""}`;
const label = (a) => (a.minister ? `${a.role} (${a.minister})` : a.role);

export default function AdviserList({ advisers, bands, ministers }) {
  const [q, setQ] = useState("");
  const [who, setWho] = useState("all");
  const [band, setBand] = useState(0);
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return advisers.filter((a) => (who === "all" || key(a) === who) && (!band || a.band === band) && (!needle || a.name.toLowerCase().includes(needle)));
  }, [advisers, q, who, band]);
  const reset = () => setShown(PAGE);
  return (
    <div className="adv">
      <div className="ac-tools">
        <input type="search" aria-label="Search advisers by name" placeholder="Search by name" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
        <select aria-label="Show the advisers of one minister" value={who} onChange={(e) => { setWho(e.target.value); reset(); }}>
          <option value="all">All ministers</option>
          {ministers.map((m) => <option key={key(m)} value={key(m)}>{label(m)}, {m.count}</option>)}
        </select>
      </div>
      <div className="ac-tools" role="group" aria-label="Pay band">
        <button type="button" aria-pressed={band === 0} onClick={() => { setBand(0); reset(); }}>Any band</button>
        {bands.map((b) => <button key={b.band} type="button" aria-pressed={band === b.band} onClick={() => { setBand(b.band); reset(); }}>Band {b.band}</button>)}
      </div>
      <p className="adv-count" aria-live="polite">{list.length === advisers.length ? `All ${list.length} entries` : `${list.length} of ${advisers.length} entries`}</p>
      {list.length === 0 ? <p className="ac-empty">No one matches. Try a shorter name, or all ministers.</p> : (
        <Batches items={list} shown={shown} page={PAGE} className="adv-list" render={(a, i) => (
          <li key={`${a.name}-${key(a)}-${i}`} className="adv-row" style={{ "--ac": BAND_COLOUR[a.band] }}>
            <span className="adv-band" aria-label={`Pay band ${a.band}`}><small>Band</small><b>{a.band}</b></span>
            <span className="adv-main">
              <b className="adv-name">{a.name}</b>
              <span className="adv-who">{a.role}{a.minister ? <>, <span>{a.minister}</span></> : null}</span>
              {a.notes.length > 0 && <span className="adv-notes">{a.notes.join(" · ")}</span>}
            </span>
            <span className="adv-pay">{a.salary ?? <em>Not published</em>}</span>
          </li>
        )} />
      )}
      {list.length > shown && <button type="button" className="ac-more" onClick={() => setShown(shown + PAGE)}>Show {Math.min(PAGE, list.length - shown)} more ({list.length - shown} left)</button>}
    </div>
  );
}
