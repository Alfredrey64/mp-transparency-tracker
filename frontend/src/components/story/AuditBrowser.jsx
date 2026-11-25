/** @jsxImportSource react */
import { useId, useMemo, useState } from "react";
import { dateLong } from "../../lib/upcoming";
import { Batches } from "../Unfold";
import Open from "./OpenCard";
import "../../accountability.css";
import "../../watchdog.css";

// Every National Audit Office report from the last year on the Spending watchdog page: a card each with the Office's own one-sentence summary, filtered by the department
// it is about and searched by word. Ten show at first, and a button shows ten more.
const PAGE = 10;
const KIND_COLOUR = { "Value for money": "#2C7DA0", "Accounts audit": "#7B5BD6", "Data tool": "#C88A1E" };

export default function AuditBrowser({ reports, departments }) {
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState(null);
  const base = useId();
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
        <Batches items={list} shown={shown} page={PAGE} className="bbx-list" render={(r) => {
          const d = new Date(`${r.date}T00:00:00Z`);
          const found = r.found?.length ? r.found : null;
          return (
            <Open
              key={r.id}
              id={`${base}-${r.id}`}
              colour={KIND_COLOUR[r.type] ?? "#5B6784"}
              open={open === r.id}
              onToggle={() => setOpen(open === r.id ? null : r.id)}
              title={r.title}
              sub={r.summary}
              lead={<span className="bbx-lead bbx-when"><small>{d.toLocaleDateString("en-GB", { year: "numeric", timeZone: "UTC" })}</small><b>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</b></span>}
              meta={<>
                <span className="bbx-pill">{r.type || "Report"}</span>
                {r.departments.length > 0 && <span><b>{r.departments.join(", ")}</b></span>}
              </>}
            >
              {found ? (
                <div className="bbx-say">
                  <span className="bbx-lab">What the Office found</span>
                  {found.map((t, i) => <p key={i} className="bbx-quote">{t}</p>)}
                  <small>{r.type === "Accounts audit" ? "This is the Office's opinion on the body's accounts, in its own words." : "This is the Office's conclusion, in its own words."}</small>
                </div>
              ) : r.scope?.length ? (
                <div className="bbx-say">
                  <span className="bbx-lab">What the Office looked at</span>
                  {r.scope.map((t, i) => <p key={i} className="bbx-quote">{t}</p>)}
                  <small>The Office&apos;s page for this report does not state a conclusion, so this is what it set out to examine. The full report has the findings.</small>
                </div>
              ) : (
                <p className="wdc-none">The Office&apos;s page for this report gives only the summary above. The full report has the detail.</p>
              )}
              {r.why?.length > 0 && (
                <div className="wdc-why">
                  <span className="bbx-lab">Why it matters</span>
                  {r.why.map((t, i) => <p key={i}>{t}</p>)}
                  <small>From the background section of the Office&apos;s report.</small>
                </div>
              )}
              <dl className="bbx-facts">
                <div><dt>Published</dt><dd>{dateLong(r.date)}</dd></div>
                <div><dt>Kind of report</dt><dd>{r.type || "Report"}</dd></div>
                {r.topics.length > 0 && <div><dt>Topic</dt><dd>{r.topics.join(", ")}</dd></div>}
              </dl>
              <a className="bbx-link" href={r.url} target="_blank" rel="noreferrer">Read the full report on nao.org.uk <span className="sr-only">(opens in a new tab)</span></a>
            </Open>
          );
        }} />
      )}
      {list.length > shown && <button type="button" className="ac-more" onClick={() => setShown(shown + PAGE)}>Show ten more ({list.length - shown} left)</button>}
    </div>
  );
}
