/** @jsxImportSource react */
import { useEffect, useRef } from "react";
import { useGo } from "./useGo";
import { layoutTimeline, LANE_COLOUR } from "../../lib/dayTimeline";
import { clock, clockMinutes } from "../../lib/upcoming";

// Today on a clock: a lane for the Commons, the Lords and committee evidence, with a point at the start time of everything that has one, and a line for now. Press a point to
// read about it. The calendar gives start times and not lengths, so these are points and not bars.
const ROW = 38;

export default function DayTimeline({ entries, nowMinutes, nextId, open }) {
  const [ref, go] = useGo(0.1);
  const scroller = useRef(null);
  const lay = layoutTimeline(entries, nowMinutes);
  const nowAt = lay?.now ?? null;

  // On a narrow screen the clock scrolls sideways; start with now in view.
  useEffect(() => {
    const box = scroller.current;
    if (!box || nowAt === null) return;
    const plot = box.scrollWidth - 104;
    box.scrollLeft = Math.max(0, (nowAt / 100) * plot - box.clientWidth / 3);
  }, [nowAt === null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lay) return null;
  let k = 0;
  return (
    <figure ref={ref} className="dt" data-go={go}>
      <figcaption>
        <b>Today on a clock</b>
        <span>Each dot is the time something starts. The calendar does not say how long anything lasts. Press a dot to read about it; the same entries are listed below.</span>
      </figcaption>
      <div ref={scroller} className="dt-scroll">
        <div className="dt-plot" style={{ "--hrs": lay.hours.length - 1 }}>
          <div className="dt-axis" aria-hidden="true">
            {lay.hours.map((h) => <span key={h.m} style={{ left: `${h.at}%` }}>{clock(`${String(Math.floor(h.m / 60) % 24).padStart(2, "0")}:00`)}</span>)}
          </div>
          {lay.lanes.map((lane) => (
            <div key={lane.name} className="dt-lane" style={{ "--lc": LANE_COLOUR[lane.name], "--rows": lane.rows }}>
              <span className="dt-name">{lane.name}</span>
              <div className="dt-track">
                {lane.dots.map(({ entry, at, row }) => {
                  const past = nowMinutes !== null && clockMinutes(entry.time) < nowMinutes;
                  return (
                    <button
                      key={entry.id} type="button" className="dt-dot" data-past={past ? "1" : undefined} data-next={entry.id === nextId ? "1" : undefined}
                      style={{ left: `${at}%`, top: row * ROW + 6, "--k": k++ }} aria-haspopup="dialog" title={entry.title} onClick={(ev) => open(entry, ev.currentTarget)}
                    >
                      <i aria-hidden="true" />
                      <span className="dt-t">{clock(entry.time)}</span>
                      <span className="sr-only">: {entry.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {nowAt !== null && <div className="dt-now" aria-hidden="true"><i style={{ left: `${nowAt}%` }}><span>Now</span></i></div>}
        </div>
      </div>
      {lay.untimed > 0 && <p className="dt-note">{lay.untimed} {lay.untimed === 1 ? "entry has" : "entries have"} no time listed yet, so {lay.untimed === 1 ? "it is" : "they are"} only in the lists below.</p>}
    </figure>
  );
}
