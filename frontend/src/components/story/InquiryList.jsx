/** @jsxImportSource react */
import { useState } from "react";
import { useGo } from "./useGo";
import { FILTERS, INQUIRIES, inquiriesBy } from "../../data/publicInquiries";
import "../../inquiries.css";

// The public inquiries list: one card for each, in three plain steps (why it began, what it found, what followed), with the one figure that sums it up at the top and the sources
// it was written from at the bottom. It can be narrowed to those still to report or those that have finished. Colour marks the inquiry; the status is always written in words.
const STEPS = [["why", "Why it started"], ["found", "What it found"], ["followed", "What followed"]];
const STATUS = { reporting: "Still reporting", finished: "Finished" };

export default function InquiryList() {
  const [ref, go] = useGo(0.01);
  const [filter, setFilter] = useState("all");
  const list = inquiriesBy(filter);
  const count = (k) => inquiriesBy(k).length;

  return (
    <div ref={ref} className="iq" data-go={go}>
      <div className="iq-filter" role="group" aria-label="Which inquiries to show">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}<span>{k === "all" ? INQUIRIES.length : count(k)}</span></button>
        ))}
      </div>
      <ul className="iq-list">
        {list.map((q, i) => (
          <li key={q.id} className="iq-card" data-st={q.status} style={{ "--c": q.colour, "--i": i }}>
            <header className="iq-head">
              <div className="iq-title">
                <span className="iq-status">{STATUS[q.status]}</span>
                <h3>{q.name}</h3>
                <p>{q.started}</p>
              </div>
              <div className="iq-key"><b>{q.key.value}</b><span>{q.key.label}</span></div>
            </header>
            <ol className="iq-steps">
              {STEPS.map(([k, label], n) => (
                <li key={k} style={{ "--n": n }}>
                  <h4><i aria-hidden="true">{n + 1}</i>{label}</h4>
                  <p>{q[k]}</p>
                </li>
              ))}
            </ol>
            <p className="iq-src"><span>Read it in full:</span>{q.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
