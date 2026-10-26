/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { STATUS } from "../data/promises";
import file from "../data/fullFactPledges.json";
import { prepare, countsByStatus, areasOf, filterPledges } from "../lib/pledgeList";
import "../pledges.css";

// Every pledge Full Fact tracks, one by one: search it, filter by policy area and verdict, and follow the link to Full Fact's own assessment and
// evidence. We keep only the pledge wording, area, verdict and date; the reasoning stays with Full Fact, who made the call.

const ROWS = prepare(file);
const AREAS = areasOf(ROWS);
const COUNTS = countsByStatus(ROWS);
const PAGE = 24;
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dayOf = (iso) => DATE.format(new Date(`${iso}T12:00:00Z`));

export default function AllPledges() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [area, setArea] = useState("all");
  const [sort, setSort] = useState("area");
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => filterPledges(ROWS, { query, status, area, sort }), [query, status, area, sort]);
  const reset = () => setShown(PAGE);
  return (
    <section className="pl-all" aria-labelledby="h-pl-all">
      <h3 id="h-pl-all">Every pledge, one by one</h3>
      <p>All {ROWS.length} pledges on Full Fact's tracker, with their verdict and when it last changed. Press "Read the evidence" to see why Full Fact rated it that way. Checked {dayOf(file.generatedAt)}.</p>
      <div className="pl-tools">
        <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} placeholder="Search the pledges, for example NHS, tax or police" aria-label="Search pledges" />
        <select value={area} onChange={(e) => { setArea(e.target.value); reset(); }} aria-label="Policy area">
          <option value="all">Every area</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          <option value="area">By area</option>
          <option value="status">Worst first</option>
          <option value="recent">Recently changed</option>
        </select>
      </div>
      <div className="pl-chips" role="group" aria-label="Verdict">
        <button type="button" className="pl-chip" style={{ "--sc": "#1B2438" }} aria-pressed={status === "all"} onClick={() => { setStatus("all"); reset(); }}>All <b>{ROWS.length}</b></button>
        {Object.entries(STATUS).map(([key, s]) => COUNTS[key] > 0 && (
          <button key={key} type="button" className="pl-chip" style={{ "--sc": s.color }} aria-pressed={status === key} onClick={() => { setStatus(status === key ? "all" : key); reset(); }}><i />{s.label} <b>{COUNTS[key]}</b></button>
        ))}
      </div>
      <div className="pl-count" aria-live="polite">{list.length === ROWS.length ? `All ${list.length} pledges` : `${list.length} ${list.length === 1 ? "pledge matches" : "pledges match"}`}</div>
      <ul className="pl-list">
        {list.slice(0, shown).map((r) => {
          const s = STATUS[r.key];
          return (
            <li key={r.slug}>
              <article className="pl-card" style={{ "--sc": s.color }}>
                <div className="pl-card-top"><span className="pl-status">{s.label}</span><span className="pl-area">{r.area}</span></div>
                <p>{r.pledge}</p>
                <div className="pl-card-foot"><span>Verdict changed {dayOf(r.updated)}</span><a href={r.url} target="_blank" rel="noreferrer">Read the evidence on Full Fact</a></div>
              </article>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p>No pledge matches that.</p>}
      {list.length > shown && <div className="pl-more"><button type="button" className="btn btn-secondary btn-lg" onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, list.length - shown)} more of {list.length - shown} left</button></div>}
    </section>
  );
}
