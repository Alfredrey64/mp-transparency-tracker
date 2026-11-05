/** @jsxImportSource react */
import { CommitteeIcon } from "../committeeIcon";
import { committeeColour } from "../../lib/committeeColour";
import { useId, useMemo, useState } from "react";
import { useGo } from "./useGo";
import { browse, describe, summary } from "../../lib/reportsView";
import { dateLong } from "../../lib/upcoming";
import DownloadCsvButton from "../DownloadCsvButton";

// Every select committee report on the Committee reports page, one card each. A card shows who published the report, when, what it looked into and where the government's reply stands;
// pressing it opens a plain-English account of what the report is about (the committee's own description of the inquiry, tidied), who the committee is, whether the government has
// replied and what a reply is, the dates, and links to the report and the reply on Parliament's own site. It can be filtered by where the report stands and searched by committee or
// subject. Ten show at first; a button shows ten more.
const FILTERS = [["all", "All"], ["answered", "Replied"], ["waiting", "Not yet due"], ["overdue", "No reply, past deadline"]];
const PAGE = 10;

const WHAT_A_REPLY_IS = "A reply is the government's written answer to the committee. It says which recommendations it accepts, which it turns down and which it will think about further. It is not a vote, and nothing forces the government to agree.";

const dateShort = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

// The report's reply clock drawn along a line: the day it came out, the deadline (the diamond) and either today or the day the reply came. Purely a picture of what the chip and
// the dates beside it already say in words, so it is hidden from screen readers.
function Clock({ r, d, reply }) {
  const mark = d.replyAt ?? d.todayAt;
  const at = (p) => ({ left: `${p}%`, transform: `translateX(-${p}%)` });
  return (
    <div className="rb-clock" aria-hidden="true">
      <div className="rb-track" style={{ "--w": `${d.fill}%` }}>
        <i className="rb-fill" />
        <b className="rb-due" style={{ left: `${d.dueAt}%` }} />
        <span className="rb-now" style={{ left: `${mark}%` }}><em style={{ transform: `translateX(-${mark}%)` }}>{reply ? `Replied ${dateShort(reply.date)}` : "Today"}</em></span>
      </div>
      <div className="rb-ends">
        <span>Report out {dateShort(r.date)}</span>
        <span style={at(d.dueAt)}>Reply due {dateShort(r.due)}</span>
      </div>
    </div>
  );
}

// All the reports in one bar, by where each stands, so the page opens with the whole picture before the cards.
const STRIP = [["ontime", "Replied on time"], ["late", "Replied late"], ["waiting", "Not yet due"], ["overdue", "No reply, past deadline"]];
function Strip({ data }) {
  const s = summary(data, data.generated);
  return (
    <figure className="rb-strip">
      <div className="rb-stripbar" role="img" aria-label={`Of ${s.total} reports, ${s.ontime} were answered on time, ${s.late} late, ${s.waiting} are not yet due and ${s.overdue} have no reply past the deadline.`}>
        {STRIP.map(([k]) => s[k] > 0 && <i key={k} data-st={k} style={{ flexGrow: s[k] }} />)}
      </div>
      <ul className="rb-legend">
        {STRIP.map(([k, label]) => <li key={k} data-st={k}><b>{s[k]}</b> {label}</li>)}
      </ul>
    </figure>
  );
}

function Card({ r, today, index }) {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const d = describe(r, today);
  const reply = r.replies[0];
  const peek = r.plain ?? r.about?.[0] ?? d.say;
  return (
    <li className="ib-card" data-st={d.status} data-open={open} data-topic="1" style={{ "--i": index, "--tc": committeeColour(r.committee) }}>
      <div className="rb-head">
        <span className="rb-tile" aria-hidden="true"><CommitteeIcon name={r.committee} size={24} /></span>
        <div className="rb-headtext">
          <div className="ib-top">
            <span className="ib-chip">{d.label}</span>
            <span className="ib-kind">{r.house}</span>
            <time dateTime={r.date}>Published {dateLong(r.date)}</time>
          </div>
          <h3>
            <button type="button" className="ib-toggle" aria-expanded={open} aria-controls={`${uid}-panel`} onClick={() => setOpen((v) => !v)}>
              <span>{r.title}</span>
              <i className="ib-chev" aria-hidden="true" />
            </button>
          </h3>
          <p className="ib-who">{r.committee}{r.inquiry && <> · looked into <em>{r.inquiry}</em></>}</p>
        </div>
      </div>
      {!open && <p className="ib-peek">{peek}</p>}
      <Clock r={r} d={d} reply={reply} />
      <div className="ib-panel" id={`${uid}-panel`} role="region" aria-label={`More about ${r.title}`} inert={!open}>
        <div>
          <div className="ib-body">
            <section>
              <h4>What the report is about</h4>
              {r.plain
                ? <>
                    <p>{r.plain}</p>
                    <p className="ib-src">Rewritten in plain English by an AI tool from the committee's description of the inquiry. It can make mistakes, so the committee's own words are below.</p>
                    <details className="ib-orig"><summary>The committee's own words</summary>{r.about.map((p, i) => <p key={i}>{p}</p>)}</details>
                  </>
                : r.about?.length
                ? <>{r.about.map((p, i) => <p key={i}>{p}</p>)}<p className="ib-src">In the committee's own words, from its description of the inquiry.</p></>
                : <p>Parliament has not published a description of this inquiry. Going by the title, the committee looked at {r.inquiry ? `“${r.inquiry}”` : `“${r.title}”`} and made recommendations to the government. The report itself has the detail.</p>}
            </section>
            {r.role && (
              <section>
                <h4>Who wrote it</h4>
                <p>{r.role}</p>
              </section>
            )}
            <section>
              <h4>Has the government replied?</h4>
              <p>{d.say}</p>
              <p className="ib-src">{WHAT_A_REPLY_IS}</p>
            </section>
            <dl className="ib-dates">
              <div><dt>Report published</dt><dd>{dateLong(r.date)}</dd></div>
              <div><dt>Reply due by</dt><dd>{dateLong(r.due)}</dd></div>
              <div><dt>{reply ? "Government replied" : "Government reply"}</dt><dd>{reply ? dateLong(reply.date) : "Not listed yet"}</dd></div>
            </dl>
            <p className="ib-link">
              <a href={r.url} target="_blank" rel="noreferrer">Read the report<span className="sr-only"> (opens in a new tab)</span></a>
              {reply && <a href={reply.url} target="_blank" rel="noreferrer">Read the government's reply<span className="sr-only"> (opens in a new tab)</span></a>}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

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
    <div ref={ref} className="rb ib" data-go={go}>
      <Strip data={data} />
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
      <ul className="ib-list">
        {list.slice(0, shown).map((r, i) => <Card key={r.id} r={r} today={today} index={i % PAGE} />)}
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
