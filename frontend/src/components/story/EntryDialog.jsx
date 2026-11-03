/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useDialog } from "../../lib/useDialog";
import { explainEntry } from "../../lib/entryExplain";
import { explainStage } from "../../lib/billExplain";
import { summariseBill, billSearchUrl } from "../../lib/billSummary";
import { plainPoints } from "../../lib/billPlain";
import { clock, dayLong, houseName } from "../../lib/upcoming";
import EntryRows from "./EntryRows";
import "../../entries.css";

// The panel a row opens: what the entry is and what it is for, in plain English, with its facts and a link to Parliament's page.
// What a bill is for, from its official long title, looked up when the panel opens.
function useBillRow(entry) {
  const given = entry.kind === "bill" ? entry.bill : undefined;
  const [found, setFound] = useState({ title: null, row: undefined });
  const wanted = entry.kind === "bill" && given === undefined ? entry.title : null;
  useEffect(() => {
    if (!wanted) return undefined;
    let alive = true;
    supabase.from("bills").select("short_title, long_title, current_stage, current_house, sponsoring_department, is_act, is_defeated, source_url").ilike("short_title", wanted).limit(1)
      .then(({ data }) => { if (alive) setFound({ title: wanted, row: data?.[0] ?? null }); }, () => { if (alive) setFound({ title: wanted, row: null }); });
    return () => { alive = false; };
  }, [wanted]);
  if (given !== undefined) return given;
  return found.title === wanted ? found.row : undefined;
}

function BillPurpose({ entry }) {
  const row = useBillRow(entry);
  if (row === undefined) return <p role="status">Looking up what the bill is for…</p>;
  const sum = summariseBill(row);
  const points = row ? plainPoints(row.long_title) : [];
  if (!sum?.summary) return <p>Its official title is too general to put more simply. Parliament's page for the bill has the full text and a summary.</p>;
  return (
    <>
      <p>{sum.summary}</p>
      {points.length > 1 && <ul className="en-points">{points.slice(0, 4).map((pt) => <li key={pt}>{pt}</li>)}</ul>}
      {sum.context && <p className="en-sub">{sum.context}</p>}
    </>
  );
}

function Facts({ entry }) {
  const rows = [];
  if (entry.h) rows.push(["House", houseName(entry.h)]);
  if (entry.date) rows.push(["Date", `${dayLong(entry.date)}${entry.time ? `, ${clock(entry.time)}` : ""}`]);
  if (entry.where) rows.push(["Where", entry.where]);
  if (entry.about) rows.push(["Subject", entry.about]);
  if (entry.stage && !entry.stages) rows.push(["Stage", entry.stage]);
  if (entry.detail && entry.kind !== "bill") rows.push(["Detail", entry.detail]);
  if (!rows.length) return null;
  return <dl className="en-facts">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

function Stages({ stages }) {
  return (
    <ol className="en-stages">
      {stages.map((s, i) => {
        const m = explainStage(s.stage);
        const same = i > 0 && explainStage(stages[i - 1].stage)?.means === m?.means;
        return (
          <li key={i}>
            <b>{dayLong(s.d)}, {houseName(s.h)}{s.stage ? `: ${s.stage}` : ""}</b>
            {m && !same && <span>{m.means}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function DayList({ entry, open }) {
  return (
    <>
      <div className="en-houses">
        {entry.houses.map((h) => <p key={h.name} data-house={h.name}><b>{h.name}</b> {h.text}</p>)}
      </div>
      {entry.items.length > 0
        ? <EntryRows items={entry.items} open={open} label={`Listed for ${dayLong(entry.date)}`} />
        : <p>Nothing is listed for this day yet. Business is added as each day gets closer.</p>}
    </>
  );
}

export default function EntryDialog({ entry, depth, onOpen, onBack, onClose, returnFocusRef }) {
  const panelRef = useRef(null);
  const headRef = useRef(null);
  const closeRef = useRef(null);
  useDialog({ open: true, onClose, panelRef, returnFocusRef, initialFocusRef: closeRef });
  useEffect(() => { if (depth > 1) headRef.current?.focus({ preventScroll: true }); }, [entry, depth]);

  const isDay = entry.kind === "day";
  const x = isDay ? { label: "Day", doesTitle: "", what: "", does: "" } : explainEntry(entry);
  const href = entry.href ?? entry.url ?? (entry.kind === "bill" ? billSearchUrl(entry.title) : null);
  const external = entry.href ? Boolean(entry.external) : Boolean(href);
  const linkText = !external ? "See more on this site" : entry.kind === "bill" ? "Read the bill on Parliament's site" : "Read more on Parliament's site";

  return (
    <div className="en-layer" onMouseDown={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}>
      <div ref={panelRef} className="en-box" role="dialog" aria-modal="true" aria-labelledby="en-h" tabIndex={-1} data-house={entry.h ? houseName(entry.h) : undefined}>
        <div className="en-top">
          {depth > 1 ? <button type="button" className="en-back" onClick={onBack}>Back to the day</button> : <span className="en-label">{x.label}</span>}
          <button ref={closeRef} type="button" className="en-x" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <h2 id="en-h" ref={headRef} tabIndex={-1}>{entry.title}</h2>
        {depth > 1 && <p className="en-label">{x.label}</p>}

        {isDay ? <DayList entry={entry} open={onOpen} /> : (
          <>
            <Facts entry={entry} />
            <section><h3>What this is</h3><p>{x.what}</p></section>
            {entry.kind === "bill" && <section><h3>What the bill proposes</h3><BillPurpose entry={entry} /></section>}
            {entry.stages && <section><h3>When it is due</h3><Stages stages={entry.stages} /></section>}
            {entry.dates && (
              <section>
                <h3>Dates listed</h3>
                <ul className="en-dates">{entry.dates.map((d, i) => <li key={i}>{dayLong(d.d)}{d.time ? `, ${clock(d.time)}` : ""}</li>)}</ul>
              </section>
            )}
            <section><h3>{x.doesTitle}</h3><p>{x.does}</p></section>
            {href && (
              <p className="en-link">
                <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{linkText}{external && <span className="sr-only"> (opens in a new tab)</span>}</a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

