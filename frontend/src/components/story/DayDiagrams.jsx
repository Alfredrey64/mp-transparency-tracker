/** @jsxImportSource react */
import { layoutTimeline, LANE_COLOUR } from "../../lib/dayTimeline";
import { KIND_GROUPS, groupOf, clock } from "../../lib/upcoming";
import "../../entries.css";

// The pictures at the top of a day's panel: whether each house sits, what kinds of business are listed (one bar, split by kind), and when things start (a clock with a lane for
// the Commons, the Lords and committee evidence). The calendar gives start times and no lengths, so the clock has points and never bars. The entries are listed under it.
// Dots that carry no time label can sit closer than those on the page's wide clock.
const GAP = 9;

function Mix({ items }) {
  const parts = KIND_GROUPS.map((g) => ({ ...g, n: items.filter((e) => groupOf(e.k) === g.key).length })).filter((g) => g.n > 0);
  const text = parts.map((g) => `${g.n} ${g.label.toLowerCase()}`).join(", ");
  return (
    <figure className="dd-card dd-mix">
      <figcaption><b>What is listed</b><span>{items.length} {items.length === 1 ? "item" : "items"}</span></figcaption>
      <div className="dd-bar" role="img" aria-label={text}>
        {parts.map((g, i) => <i key={g.key} style={{ flexGrow: g.n, background: g.colour, "--k": i }} />)}
      </div>
      <ul className="dd-legend" aria-hidden="true">
        {parts.map((g) => <li key={g.key}><i style={{ background: g.colour }} /><b>{g.n}</b> {g.label}</li>)}
      </ul>
    </figure>
  );
}

function Clock({ items, open }) {
  const lay = layoutTimeline(items, null, GAP);
  if (!lay) return null;
  let k = 0;
  return (
    <figure className="dd-card dd-clock">
      <figcaption><b>When things start</b><span>Press a dot to read about it</span></figcaption>
      <div className="dd-plot">
        <div className="dd-axis" aria-hidden="true">
          {lay.hours.map((h) => <span key={h.m} style={{ left: `${h.at}%` }}>{clock(`${String(Math.floor(h.m / 60) % 24).padStart(2, "0")}:00`)}</span>)}
        </div>
        {lay.lanes.map((lane) => (
          <div key={lane.name} className="dd-lane" style={{ "--lc": LANE_COLOUR[lane.name], "--rows": lane.rows }}>
            <span className="dd-name">{lane.name}</span>
            <div className="dd-track" style={{ "--hrs": lay.hours.length - 1 }}>
              {lane.dots.map(({ entry, at, row }) => (
                <button key={entry.id} type="button" className="dd-dot" style={{ left: `${at}%`, "--r": row, "--k": k++ }} aria-haspopup="dialog" title={`${clock(entry.time)}: ${entry.title}`} onClick={(ev) => open(entry, ev.currentTarget)}>
                  <i aria-hidden="true" />
                  <span className="dd-t" aria-hidden="true">{clock(entry.time)}</span>
                  <span className="sr-only">{clock(entry.time)}: {entry.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {lay.untimed > 0 && <p className="dd-note">{lay.untimed} {lay.untimed === 1 ? "item has" : "items have"} no time listed yet, so {lay.untimed === 1 ? "it is" : "they are"} only in the list below.</p>}
    </figure>
  );
}

export default function DayDiagrams({ entry, open }) {
  return (
    <div className="dd">
      <div className="dd-houses">
        {entry.houses.map((h) => (
          <p key={h.name} data-house={h.name} data-s={h.s}>
            <span className="dd-sw" aria-hidden="true" />
            <span><b>{h.name}</b> {h.text}</span>
          </p>
        ))}
      </div>
      {entry.items.length > 0 && <Mix items={entry.items} />}
      {entry.items.length > 0 && <Clock items={entry.items} open={open} />}
    </div>
  );
}
