/** @jsxImportSource react */
import { useState } from "react";
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import { FILTERS, INQUIRIES, inquiriesBy } from "../../data/publicInquiries";
import "../../inquiries.css";

// The public inquiries list: one card for each. Every card has the same parts in the same places: the name and status on the left, a calendar leaf with the month and year of the
// latest report on the right, a line of the dates that matter, the three plain steps (why it began, what it found, what followed), a dot for each recommendation where the sources
// give the number, and the sources it was written from. Each card plays once as it scrolls into view. Colour marks the inquiry; status and dates are always written in words.
const STEPS = [["why", "Why it started"], ["found", "What it found"], ["followed", "What followed"]];
const STATUS = { reporting: "Still reporting", finished: "Finished" };

function Dots({ recs }) {
  const { n, extra = 0, out = 0 } = recs;
  const dots = [];
  for (let i = 0; i < n; i++) dots.push(<i key={`a${i}`} data-out={i >= n - out ? "1" : undefined} style={{ "--d": i }} />);
  for (let i = 0; i < extra; i++) dots.push(<i key={`b${i}`} data-extra="1" style={{ "--d": n + i }} />);
  return <span className="iq-dots" aria-hidden="true">{dots}</span>;
}

function Card({ q, i }) {
  const [ref, go] = useGo(0.12);
  const r = q.recs;
  return (
    <li ref={ref} className="iq-card" data-go={go} data-st={q.status} style={{ "--c": q.colour, "--i": i % 3 }}>
      <header className="iq-head">
        <div className="iq-title">
          <span className="iq-status">{STATUS[q.status]}</span>
          <h3>{q.name}</h3>
          <p>{q.started}</p>
        </div>
        <div className="iq-leaf" role="img" aria-label={`Latest report: ${q.report.what}, ${q.report.month} ${q.report.year}`}>
          <small>Latest report</small>
          <b>{q.report.month}</b>
          <strong>{q.report.year}</strong>
          <em>{q.report.what}</em>
        </div>
      </header>

      <ol className="iq-tl" aria-label="Key dates" style={{ "--of": q.timeline.length }}>
        {q.timeline.map(([when, what], k) => (
          <li key={when + what} style={{ "--k": k }}>
            <i aria-hidden="true" />
            <b>{when}</b>
            <span>{what}</span>
          </li>
        ))}
      </ol>

      <ol className="iq-steps">
        {STEPS.map(([k, label], n) => (
          <li key={k} style={{ "--n": n }}>
            <h4><i aria-hidden="true">{n + 1}</i>{label}</h4>
            <p>{q[k]}</p>
          </li>
        ))}
      </ol>

      {r && (
        <div className="iq-recs">
          <p className="iq-recs-n"><b><AnimatedValue text={String(r.n)} /></b><span>{r.label}</span></p>
          <Dots recs={r} />
          {(r.extra || r.out) ? (
            <p className="iq-recs-key">
              {r.extra ? <span><i data-extra="1" />{r.extra} {r.extraLabel}</span> : null}
              {r.out ? <span><i data-out="1" />{r.out} not accepted</span> : null}
            </p>
          ) : null}
        </div>
      )}

      <p className="iq-src"><span>Read it in full:</span>{q.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>)}</p>
    </li>
  );
}

export default function InquiryList() {
  const [filter, setFilter] = useState("all");
  const list = inquiriesBy(filter);

  return (
    <div className="iq">
      <div className="iq-filter" role="group" aria-label="Which inquiries to show">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}<span>{k === "all" ? INQUIRIES.length : inquiriesBy(k).length}</span></button>
        ))}
      </div>
      <ul className="iq-list">
        {list.map((q, i) => <Card key={q.id} q={q} i={i} />)}
      </ul>
    </div>
  );
}
