/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { useGo } from "./useGo";
import { FILTERS, browse, describe } from "../../lib/instrumentsView";
import { dateLong } from "../../lib/upcoming";
import DownloadCsvButton from "../DownloadCsvButton";

// The newest statutory instruments on the Laws made by ministers page, one card each: the title, which department laid it, the day it was laid, how it gets through Parliament
// and when it takes effect. It can be filtered by that route and searched by title or department. Ten show at first; a button shows ten more. The card links to the instrument
// itself on legislation.gov.uk, and the figures can be downloaded.
const PAGE = 10;
const COLUMNS = [
  ["name", "Title"], ["ref", "Reference"], ["department", "Laid by"], ["laid", "Laid before Parliament"], ["made", "Made"], ["inForce", "Comes into force"], ["procedure", "How it goes through Parliament"],
];

export default function InstrumentBrowser({ data }) {
  const [ref, go] = useGo(0.1);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k]) => [k, browse(data, { filter: k, query }).length])), [data, query]);
  const list = useMemo(() => browse(data, { filter, query }), [data, filter, query]);
  const change = (fn) => (...args) => { fn(...args); setShown(PAGE); };

  return (
    <div ref={ref} className="rb" data-go={go}>
      <div className="rb-tools">
        <div className="rb-filter" role="group" aria-label="Which instruments to show">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={change(() => setFilter(k))}>{label}<span>{counts[k]}</span></button>
          ))}
        </div>
        <label className="rb-search">
          <span>Search by title or department</span>
          <input type="search" value={query} onChange={change((e) => setQuery(e.target.value))} placeholder="For example fishing, pensions or Home Office" />
        </label>
      </div>

      {list.length === 0 && <p className="rb-none">No instruments match. Try a different word or filter.</p>}
      <ul className="rb-list">
        {list.slice(0, shown).map((r, i) => {
          const d = describe(data, r, data.generated);
          return (
            <li key={r.id} className="rb-card" data-st={r.route} style={{ "--i": i % PAGE }}>
              <div className="rb-head">
                <span className="rb-chip">{d.label}</span>
                <time dateTime={r.laid}>Laid {dateLong(r.laid)}</time>
              </div>
              <h3>{r.link ? <a href={r.link} target="_blank" rel="noreferrer">{r.name}</a> : r.name}</h3>
              <p className="rb-who">{r.department ? `Laid by ${r.department}` : "Department not listed"}{r.ref && <> · {r.ref}</>}</p>
              <p className="rb-say">{d.say}{d.force && <> It {d.force} {dateLong(r.inForce)}.</>}</p>
              {r.link && <p className="rb-links"><a href={r.link} target="_blank" rel="noreferrer">Read it on legislation.gov.uk</a></p>}
            </li>
          );
        })}
      </ul>
      {list.length > shown && <button type="button" className="rb-more" onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, list.length - shown)} more of {list.length - shown}</button>}
      <p className="rb-csv"><DownloadCsvButton label="Download these as a spreadsheet" slug="statutory-instruments" columns={COLUMNS.map(([key, header]) => ({ key, header }))} rows={list} /></p>
    </div>
  );
}
