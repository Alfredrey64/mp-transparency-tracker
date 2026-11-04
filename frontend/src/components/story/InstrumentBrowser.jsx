/** @jsxImportSource react */
import { useId, useMemo, useState } from "react";
import { useGo } from "./useGo";
import { FILTERS, browse, describe } from "../../lib/instrumentsView";
import { dateLong } from "../../lib/upcoming";
import DownloadCsvButton from "../DownloadCsvButton";

// The newest statutory instruments on the Laws made by ministers page, one card each. A card shows the title, who laid it, the day it was laid and the first line of what it does;
// pressing it opens what the Government says it does in full, how it goes through Parliament and its dates, with a link to the text on legislation.gov.uk. The list can be
// filtered by how it goes through Parliament and searched by title or department. Ten show at first; a button shows ten more. The figures can be downloaded.
const PAGE = 10;
const COLUMNS = [
  ["name", "Title"], ["ref", "Reference"], ["department", "Laid by"], ["laid", "Laid before Parliament"], ["made", "Made"], ["inForce", "Comes into force"], ["procedure", "How it goes through Parliament"],
];

function Card({ data, r, index }) {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const d = describe(data, r, data.generated);
  const [first, ...rest] = r.summary ?? [];
  return (
    <li className="ib-card" data-st={r.route} data-open={open} style={{ "--i": index }}>
      <div className="ib-top">
        <span className="ib-chip">{d.label}</span>
        {r.kind && <span className="ib-kind">{r.kind}</span>}
        <time dateTime={r.laid}>Laid {dateLong(r.laid)}</time>
      </div>
      <h3>
        <button type="button" className="ib-toggle" aria-expanded={open} aria-controls={`${uid}-panel`} onClick={() => setOpen((v) => !v)}>
          <span>{r.name}</span>
          <i className="ib-chev" aria-hidden="true" />
        </button>
      </h3>
      <p className="ib-who">{r.department ? `Laid by ${r.department}` : "Department not listed"}{r.ref && <> · {r.ref}</>}</p>
      {first && !open && <p className="ib-peek">{first}</p>}
      <div className="ib-panel" id={`${uid}-panel`} role="region" aria-label={`More about ${r.name}`} inert={!open}>
        <div>
          <div className="ib-body">
            {first && (
              <section>
                <h4>What it does</h4>
                <p>{first}</p>
                {rest.map((s, i) => <p key={i}>{s}</p>)}
                <p className="ib-src">In the Government's own words, from the note that comes with the instrument.</p>
              </section>
            )}
            <section>
              <h4>How it goes through Parliament</h4>
              <p>{d.say}</p>
            </section>
            <dl className="ib-dates">
              <div><dt>Laid before Parliament</dt><dd>{dateLong(r.laid)}</dd></div>
              {r.made && <div><dt>Made</dt><dd>{dateLong(r.made)}</dd></div>}
              {r.inForce && <div><dt>{d.force === "comes into force on" ? "Comes into force" : "Came into force"}</dt><dd>{dateLong(r.inForce)}</dd></div>}
            </dl>
            {r.link && <p className="ib-link"><a href={r.link} target="_blank" rel="noreferrer">Read the full text on legislation.gov.uk<span className="sr-only"> (opens in a new tab)</span></a></p>}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function InstrumentBrowser({ data }) {
  const [ref, go] = useGo(0.1);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k]) => [k, browse(data, { filter: k, query }).length])), [data, query]);
  const list = useMemo(() => browse(data, { filter, query }), [data, filter, query]);
  const change = (fn) => (...args) => { fn(...args); setShown(PAGE); };

  return (
    <div ref={ref} className="rb ib" data-go={go}>
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
      <ul className="ib-list">
        {list.slice(0, shown).map((r, i) => <Card key={r.id} data={data} r={r} index={i % PAGE} />)}
      </ul>
      {list.length > shown && <button type="button" className="rb-more" onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, list.length - shown)} more of {list.length - shown}</button>}
      <p className="rb-csv"><DownloadCsvButton label="Download these as a spreadsheet" slug="statutory-instruments" columns={COLUMNS.map(([key, header]) => ({ key, header }))} rows={list} /></p>
    </div>
  );
}
