/** @jsxImportSource react */
import { explainEntry } from "../../lib/entryExplain";
import { clock, dayShort, houseName, daysBetween, mondaysBetween } from "../../lib/upcoming";
import "../../entries.css";

// One clickable row for each entry. `open(entry, button)` is called when it is pressed (see useEntryDialog).
const rowSub = (e, label) => e.sub ?? [e.about, e.where && !label.includes(e.where) ? e.where : null, e.stage].filter(Boolean).join(", ");

// The four weeks as a thin line, with a dot on each date the entry is listed: where in the weeks it falls, at a glance. The days under it are the Mondays.
function Strip({ strip }) {
  const { from, to, marks } = strip;
  const span = Math.max(1, daysBetween(from, to));
  const at = (d) => `${(daysBetween(from, d) / span) * 100}%`;
  const mondays = mondaysBetween(from, to);
  return (
    <span className="en-strip" aria-hidden="true">
      <span className="en-strip-line">
        {mondays.map((m) => <i key={m} style={{ left: at(m) }} />)}
        {marks.map((m, i) => <b key={`${m.d}-${i}`} data-house={houseName(m.h)} style={{ left: at(m.d), "--k": i }} />)}
      </span>
      <span className="en-strip-days">{mondays.map((m) => <small key={m} style={{ left: at(m) }}>{Number(m.slice(8))}</small>)}</span>
    </span>
  );
}

export default function EntryRows({ items, open, dateColumn = false, label = "Entries" }) {
  const anyTime = items.some((e) => e.time);
  return (
    <ul className="en-list" aria-label={label}>
      {items.map((e, i) => {
        const x = explainEntry(e);
        const sub = rowSub(e, x.label);
        const house = e.h ? houseName(e.h) : null;
        return (
          <li key={e.id ?? `${e.kind}-${i}`}>
            <button type="button" className="en-row" data-house={house ?? undefined} data-kind={e.kind} data-when={e.when} aria-haspopup="dialog" style={e.colour ? { "--ec": e.colour } : undefined} onClick={(ev) => open(e, ev.currentTarget)}>
              {(anyTime || dateColumn) && (
                <span className="en-when" data-empty={e.time || dateColumn ? undefined : "1"}>
                  {dateColumn && e.date ? <><b>{dayShort(e.date).split(" ")[0]}</b>{dayShort(e.date).split(" ").slice(1).join(" ")}</> : e.time ? clock(e.time) : "No time listed"}
                </span>
              )}
              <span className="en-body">
                <span className="en-meta">{house && <em data-house={house}>{house}</em>}<span>{x.label}</span>{e.when === "next" && <em className="en-next">Next up</em>}{e.when === "past" && <span className="en-past">Earlier today</span>}</span>
                <b>{e.title}</b>
                {sub && <small>{sub}</small>}
                {e.strip && <Strip strip={e.strip} />}
              </span>
              <span className="en-go" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

