/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { dateLong } from "../../lib/upcoming";
import { daysBetween } from "../../lib/consultationView";
import "../../accountability.css";

// Every open consultation on the Have your say page: a card each with the department's own one-sentence description and the closing day, searched by word and filtered by
// department. Ten show at first, and a button shows ten more.
const PAGE = 10;

export default function ConsultationBrowser({ items, departments, today }) {
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((c) => (dept === "all" || c.department === dept) && (!needle || `${c.title} ${c.summary} ${c.department}`.toLowerCase().includes(needle)));
  }, [items, dept, q]);
  return (
    <div>
      <div className="ac-tools">
        <input type="search" aria-label="Search the consultations" placeholder="Search by word, such as rail or schools" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} />
        <select aria-label="Show consultations from one department" value={dept} onChange={(e) => { setDept(e.target.value); setShown(PAGE); }}>
          <option value="all">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {list.length === 0 ? <p className="ac-empty">No consultations match. Try a shorter word or all departments.</p> : (
        <ul className="ac-list">
          {list.slice(0, shown).map((c) => {
            const left = c.closes ? daysBetween(today, c.closes) : null;
            const soon = left != null && left <= 14;
            return (
              <li key={c.url} className="ac-item" style={{ "--ac": soon ? "#B3262E" : "#2C7DA0" }}>
                <h3><a href={c.url} target="_blank" rel="noreferrer">{c.title}</a></h3>
                {c.summary && <p>{c.summary}</p>}
                <div className="ac-meta">
                  <span className="ac-chip">{c.closes ? (left === 0 ? "Closes today" : left === 1 ? "Closes tomorrow" : `Closes in ${left} days`) : "No closing day listed"}</span>
                  {c.closes && <span>Closing day <b>{dateLong(c.closes)}</b></span>}
                  {c.department && <span><b>{c.department}</b></span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > shown && <button type="button" className="ac-more" onClick={() => setShown(shown + PAGE)}>Show ten more ({list.length - shown} left)</button>}
    </div>
  );
}
