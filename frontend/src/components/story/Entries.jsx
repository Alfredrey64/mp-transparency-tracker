/** @jsxImportSource react */
import { useState } from "react";
import { dayLong, dayShort, relDay, londonToday } from "../../lib/upcoming";
import EntryRows from "./EntryRows";
import { useEntryDialog } from "./useEntryDialog";
import "../../entries.css";

// The list rows and the panel they open, shared by the Today, Coming up and What changed views. Every row is a button: it opens a panel that says, in plain English, what the
// entry is and what it is for or proposes (lib/entryExplain.js), with the dates, the house and a link to Parliament's own page. The panel for a bill also looks up the bill's
// official long title and puts it in simple words, as the voting pages do.

const BANDS = [["Morning", (t) => t < "12:00"], ["Afternoon", (t) => t < "18:00"], ["Evening", () => true]];
const bandOf = (time) => (time ? BANDS.find(([, fits]) => fits(time))[0] : "No time listed");

function groupByBand(items) {
  const out = [];
  for (const e of items) {
    const name = bandOf(e.time);
    const last = out[out.length - 1];
    if (last && last.name === name) last.items.push(e); else out.push({ name, items: [e] });
  }
  return out;
}

// Rows under time-of-day headings when most of the day's items have a time, so a long list can be scanned.
export function BandedRows({ items, open, label }) {
  if (items.length < 5 || !items.some((e) => e.time)) return <EntryRows items={items} open={open} label={label} />;
  return (
    <div className="en-bands">
      {groupByBand(items).map((b) => (
        <section key={b.name} className="en-band">
          <h3>{b.name}<span>{b.items.length}</span></h3>
          <EntryRows items={b.items} open={open} label={`${label}, ${b.name.toLowerCase()}`} />
        </section>
      ))}
    </div>
  );
}

// A list that brings its own panel, for the places that show one list. With `limit`, the rest sits behind a "Show more" button.
export function EntryList({ items, label, dateColumn, banded = true, limit = 0, noun = "more" }) {
  const [open, dialog] = useEntryDialog();
  const [all, setAll] = useState(false);
  const shown = limit && !all ? items.slice(0, limit) : items;
  return (
    <>
      {banded ? <BandedRows items={shown} open={open} label={label} /> : <EntryRows items={shown} open={open} label={label} dateColumn={dateColumn} />}
      {limit > 0 && items.length > limit && (
        <button type="button" className="en-more" aria-expanded={all} onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show ${items.length - limit} ${noun}`}</button>
      )}
      {dialog}
    </>
  );
}

// Days of entries under a heading each, with one shared panel. A row of day buttons above them jumps to a day, and each heading says how far off the day is.
export function DayGroups({ days, label }) {
  const [open, dialog] = useEntryDialog();
  const today = londonToday();
  const slug = label.toLowerCase().replace(/[^a-z]+/g, "-");
  const jump = (d) => document.getElementById(`${slug}-${d}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  return (
    <div className="en-days">
      {days.length > 1 && (
        <nav className="en-daynav" aria-label={`Jump to a day: ${label}`}>
          {days.map((d) => <button key={d.d} type="button" onClick={() => jump(d.d)}><b>{dayShort(d.d).split(" ")[0]}</b>{Number(d.d.slice(8))}<span>{d.items.length}</span></button>)}
        </nav>
      )}
      {days.map((d) => (
        <section key={d.d} id={`${slug}-${d.d}`} className="en-day" data-today={d.d === today ? "1" : undefined}>
          <h3>{dayLong(d.d)}<em>{relDay(d.d, today)}</em><span>{d.items.length}</span></h3>
          <EntryRows items={d.items} open={open} label={`${label}, ${dayLong(d.d)}`} />
        </section>
      ))}
      {dialog}
    </div>
  );
}
