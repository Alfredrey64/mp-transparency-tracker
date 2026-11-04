/** @jsxImportSource react */
import { CommitteeIcon } from "../committeeIcon";
import { useMemo, useState } from "react";
import { useGo } from "./useGo";
import { browse, describe } from "../../lib/reportsView";
import { dateLong } from "../../lib/upcoming";
import DownloadCsvButton from "../DownloadCsvButton";

// Every select committee report on the Committee reports page, one card each, written in plain words: who published it and when, what it looked into, whether the government has
// replied, and a bar showing the days between the report, the deadline and the reply. It can be filtered by where the report stands and searched by committee or subject. Ten
// show at first; a button shows ten more. The text of a report is on Parliament's own site, which each card links to.
const FILTERS = [["all", "All"], ["answered", "Replied"], ["waiting", "Not yet due"], ["overdue", "No reply, past deadline"]];
const PAGE = 10;

export default function ReportBrowser({ data }) {
  const [ref, go] = useGo(0.1);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const today = data.generated;
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k]) => [k, browse(data, { filter: k, query }).length])), [data, query]);
  const list = useMemo(() => browse(data, { filter, query }), [data, filter, query]);
  const change = (fn) => (...args) => { fn(...args); setShown(PAGE); };

  return (
    <div ref={ref} className="rb" data-go={go}>
      <div className="rb-tools">
        <div className="rb-filter" role="group" aria-label="Which reports to show">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={change(() => setFilter(k))}>{label}<span>{counts[k]}</span></button>
          ))}
        </div>
        <label className="rb-search">
          <span>Search by committee or subject</span>
          <input type="search" value={query} onChange={change((e) => setQuery(e.target.value))} placeholder="For example health, defence or the Treasury" />
        </label>
      </div>

      {list.length === 0 && <p className="rb-none">No reports match. Try a different word or filter.</p>}
      <ul className="rb-list">
        {list.slice(0, shown).map((r, i) => {
          const d = describe(r, today);
          const reply = r.replies[0];
          const edge = d.dueAt > 82 ? "r" : d.dueAt < 14 ? "l" : "c";
          return (
            <li key={r.id} className="rb-card" data-st={d.status} style={{ "--i": i % PAGE }}>
              <div className="rb-head">
                <span className="rb-chip">{d.label}</span>
                <time dateTime={r.date}>Published {dateLong(r.date)}</time>
              </div>
              <h3><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></h3>
              <p className="rb-who"><span className="rb-ico" aria-hidden="true"><CommitteeIcon name={r.committee} size={16} /></span>{r.committee}{r.inquiry && <> · looked into <em>{r.inquiry}</em></>}</p>
              <div className="rb-track" role="img" aria-label={`Report ${dateLong(r.date)}, reply due ${dateLong(r.due)}${reply ? `, reply ${dateLong(reply.date)}` : ", no reply listed"}`}>
                <i className="rb-fill" style={{ width: `${d.fill}%` }} />
                <b className="rb-due" data-edge={edge} style={{ left: `${d.dueAt}%` }}><span>Reply due {dateLong(r.due)}</span></b>
                {d.replyAt !== null ? <u className="rb-reply" style={{ left: `${d.replyAt}%` }}><span>Replied {dateLong(reply.date)}</span></u> : <u className="rb-today" style={{ left: `${d.todayAt}%` }}><span>Today</span></u>}
              </div>
              <p className="rb-say">{d.say}</p>
              <p className="rb-links">
                <a href={r.url} target="_blank" rel="noreferrer">Read the report</a>
                {reply && <a href={reply.url} target="_blank" rel="noreferrer">Read the government's reply</a>}
              </p>
            </li>
          );
        })}
      </ul>
      {list.length > shown && <button type="button" className="rb-more" onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, list.length - shown)} more of {list.length - shown}</button>}
      <p className="rb-csv">
        <DownloadCsvButton
          label="Download these reports as a spreadsheet" slug="committee-reports" rows={list}
          columns={[
            { header: "Committee", key: "committee" }, { header: "Report", key: "title" }, { header: "Published", key: "date" }, { header: "Government reply due", key: "due" },
            { header: "Government reply", value: (r) => r.replies[0]?.date ?? "" }, { header: "Link", key: "url" },
          ]}
        />
      </p>
    </div>
  );
}
