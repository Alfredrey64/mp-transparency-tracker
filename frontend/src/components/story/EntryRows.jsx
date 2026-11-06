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

// A bill's stages that fall in the four weeks, as a short ladder: a dot in the colour of the house, what happens, and the day. Three at most; the panel lists them all.
const SHOWN = 3;
const sentence = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "A stage");
function Ladder({ stages }) {
  return (
    <span className="bl">
      {stages.slice(0, SHOWN).map((s, i) => (
        <span key={i} className="bl-step" data-house={houseName(s.h)}>
          <i aria-hidden="true" />
          <span className="bl-what"><em>{houseName(s.h)}</em>{sentence(s.stage)}</span>
          <span className="bl-when">{dayShort(s.d)}</span>
        </span>
      ))}
      {stages.length > SHOWN && <span className="bl-more">{stages.length - SHOWN} more {stages.length - SHOWN === 1 ? "stage" : "stages"} listed</span>}
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
                <span className="en-meta">{house && <em data-house={house}>{house}</em>}<span>{x.label}</span>{e.kind === "bill" && e.stages?.length > 1 && <span className="en-count">{e.stages.length} stages</span>}{e.when === "next" && <em className="en-next">Next up</em>}{e.when === "past" && <span className="en-past">Earlier today</span>}</span>
                <b>{e.title}</b>
                {e.kind === "bill" && e.stages ? <Ladder stages={e.stages} /> : sub && <small>{sub}</small>}
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

