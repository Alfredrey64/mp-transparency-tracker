/** @jsxImportSource react */
import { explainEntry } from "../../lib/entryExplain";
import { clock, dayShort, houseName } from "../../lib/upcoming";
import "../../entries.css";

// One clickable row for each entry. `open(entry, button)` is called when it is pressed (see useEntryDialog).
const rowSub = (e, label) => e.sub ?? [e.about, e.where && !label.includes(e.where) ? e.where : null, e.stage].filter(Boolean).join(", ");

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
            <button type="button" className="en-row" data-house={house ?? undefined} data-kind={e.kind} aria-haspopup="dialog" style={e.colour ? { "--ec": e.colour } : undefined} onClick={(ev) => open(e, ev.currentTarget)}>
              {(anyTime || dateColumn) && (
                <span className="en-when" data-empty={e.time || dateColumn ? undefined : "1"}>
                  {dateColumn && e.date ? <><b>{dayShort(e.date).split(" ")[0]}</b>{dayShort(e.date).split(" ").slice(1).join(" ")}</> : e.time ? clock(e.time) : "No time listed"}
                </span>
              )}
              <span className="en-body">
                <span className="en-meta">{house && <em data-house={house}>{house}</em>}<span>{x.label}</span></span>
                <b>{e.title}</b>
                {sub && <small>{sub}</small>}
              </span>
              <span className="en-go" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

