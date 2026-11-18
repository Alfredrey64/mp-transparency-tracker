/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { dateLong } from "../../lib/upcoming";
import "../../accountability.css";

// Every National Audit Office report from the last year on the Spending watchdog page: a card each with the Office's own one-sentence summary, filtered by the department
// it is about and searched by word. Ten show at first, and a button shows ten more.
const PAGE = 10;
const KIND_COLOUR = { "Value for money": "#2C7DA0", "Accounts audit": "#7B5BD6", "Data tool": "#C88A1E" };

export default function AuditBrowser({ reports, departments }) {
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return reports.filter((r) => (dept === "all" || r.departments.includes(dept)) && (!needle || `${r.title} ${r.summary} ${r.topics.join(" ")}`.toLowerCase().includes(needle)));
  }, [reports, dept, q]);
  return (
    <div>
      <div className="ac-tools">
        <input type="search" aria-label="Search the reports" placeholder="Search by word, such as rail or prisons" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} />
        <select aria-label="Show reports about one department" value={dept} onChange={(e) => { setDept(e.target.value); setShown(PAGE); }}>
          <option value="all">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {list.length === 0 ? <p className="ac-empty">No reports match. Try a shorter word or all departments.</p> : (
        <ul className="ac-list">
          {list.slice(0, shown).map((r) => (
            <li key={r.id} className="ac-item" style={{ "--ac": KIND_COLOUR[r.type] ?? "#5B6784" }}>
              <h3><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></h3>
              {r.summary && <p>{r.summary}</p>}
              <div className="ac-meta">
                <span className="ac-chip">{r.type || "Report"}</span>
                <span>{dateLong(r.date)}</span>
                {r.departments.length > 0 && <span><b>{r.departments.join(", ")}</b></span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.length > shown && <button type="button" className="ac-more" onClick={() => setShown(shown + PAGE)}>Show ten more ({list.length - shown} left)</button>}
    </div>
  );
}
