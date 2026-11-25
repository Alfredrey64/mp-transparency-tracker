/** @jsxImportSource react */
import { useEffect, useRef } from "react";
import { useGo } from "./useGo";
import { layoutTimeline, LANE_COLOUR } from "../../lib/dayTimeline";
import { clock, clockMinutes } from "../../lib/upcoming";
import { sectorOf } from "../../lib/sectors";
import SectorKey from "./SectorKey";
import { usePhone } from "../../lib/usePhone";

// Today on a clock: a lane for the Commons, the Lords and committee evidence, with a point at the start time of everything that has one, and a line for now. Press a point to
// read about it. The calendar gives start times and not lengths, so these are points and not bars.
const ROW = 38;
const DOT = 26; // the height of a point, so it sits in the middle of its row

const HOUR_PX = 64; // on a phone the clock runs downwards: this many pixels for each hour
const V_DOT = 26; // the least height, in pixels, between two points in one column

// Phone layout: each house is a column (or two side by side if its points would touch). A point sits at its time; if both columns are taken at that moment it is moved a little further down, and its label still
// says the true time. Returns the plot's height and, for each lane, its column count and each point's top and column.
function placeDown(lay) {
  const hoursPx = (lay.hours.length - 1) * HOUR_PX;
  let bottom = hoursPx;
  const lanes = lay.lanes.map((lane) => {
    const run = (cols) => {
      const ends = Array(cols).fill(-Infinity);
      let pushed = false;
      const dots = lane.dots.map((d) => {
        const ideal = (d.at / 100) * hoursPx;
        let c = ends.findIndex((e) => e + V_DOT <= ideal);
        let y = ideal;
        if (c === -1) { pushed = true; c = ends.indexOf(Math.min(...ends)); y = ends[c] + V_DOT; }
        ends[c] = y;
        return { ...d, y, col: c };
      });
      return { dots, pushed };
    };
    let r = run(1);
    let cols = 1;
    if (r.pushed) { r = run(2); cols = 2; }
    bottom = Math.max(bottom, ...r.dots.map((d) => d.y + 18));
    return { ...lane, cols, dots: r.dots };
  });
  return { lanes, hoursPx, height: bottom };
}

export default function DayTimeline({ entries, nowMinutes, nextId, open }) {
  const [ref, go] = useGo(0.1);
  const scroller = useRef(null);
  const phone = usePhone();
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
  if (phone) {
    const pl = placeDown(lay);
    const lanes = pl.lanes;
    const cols = `44px ${lanes.map((l) => `${l.cols}fr`).join(" ")}`;
    return (
      <figure ref={ref} className="dt dt-v" data-go={go}>
        <figcaption>
          <b>Today on a clock</b>
          <span>Each dot is the time something starts. The calendar does not say how long anything lasts. Press a dot to read about it; the same entries are listed below.</span>
        </figcaption>
        <SectorKey entries={lanes.flatMap((l) => l.dots.map((d) => d.entry))} />
        <div className="dtv-heads" style={{ gridTemplateColumns: cols }} aria-hidden="true">
          <span />
          {lanes.map((lane) => <b key={lane.name} style={{ "--lc": LANE_COLOUR[lane.name] }}>{lane.name}</b>)}
        </div>
        <div className="dtv-plot" style={{ height: pl.height, gridTemplateColumns: cols }}>
          <div className="dtv-axis" aria-hidden="true">
            {lay.hours.map((h) => <span key={h.m} style={{ top: (h.at / 100) * pl.hoursPx }}>{clock(`${String(Math.floor(h.m / 60) % 24).padStart(2, "0")}:00`)}</span>)}
          </div>
          {lay.hours.map((h) => <u key={h.m} className="dtv-grid" aria-hidden="true" style={{ top: (h.at / 100) * pl.hoursPx }} />)}
          {lanes.map((lane) => (
            <div key={lane.name} className="dtv-lane" style={{ "--lc": LANE_COLOUR[lane.name], "--cols": lane.cols }}>
              {lane.dots.map(({ entry, y, col }) => {
                const past = nowMinutes !== null && clockMinutes(entry.time) < nowMinutes;
                const sec = sectorOf(entry);
                return (
                  <button
                    key={entry.id} type="button" className="dtv-dot" data-past={past ? "1" : undefined} data-next={entry.id === nextId ? "1" : undefined}
                    style={{ position: "absolute", "--sc": sec.colour, top: y, left: `calc(${col} * 100% / ${lane.cols} + 3px)`, "--k": k++ }} aria-haspopup="dialog" title={`${entry.title} (${sec.label})`} onClick={(ev) => open(entry, ev.currentTarget)}
                  >
                    <i aria-hidden="true" />
                    <span className="dt-t">{clock(entry.time)}</span>
                    <span className="sr-only">: {entry.title}. Subject: {sec.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {nowAt !== null && <div className="dtv-now" aria-hidden="true" style={{ top: (nowAt / 100) * pl.hoursPx }}><span>Now</span></div>}
        </div>
        {lay.untimed > 0 && <p className="dt-note">{lay.untimed} {lay.untimed === 1 ? "entry has" : "entries have"} no time listed yet, so {lay.untimed === 1 ? "it is" : "they are"} only in the lists below.</p>}
      </figure>
    );
  }
  return (
    <figure ref={ref} className="dt" data-go={go}>
      <figcaption>
        <b>Today on a clock</b>
        <span>Each dot is the time something starts. The calendar does not say how long anything lasts. Press a dot to read about it; the same entries are listed below.</span>
      </figcaption>
      <SectorKey entries={lay.lanes.flatMap((l) => l.dots.map((d) => d.entry))} />
      <div ref={scroller} className="dt-scroll">
        <div className="dt-plot" style={{ "--hrs": lay.hours.length - 1 }}>
          <div className="dt-axis" aria-hidden="true">
            {lay.hours.map((h) => <span key={h.m} style={{ left: `${h.at}%` }}>{clock(`${String(Math.floor(h.m / 60) % 24).padStart(2, "0")}:00`)}</span>)}
          </div>
          {lay.lanes.map((lane) => (
            <div key={lane.name} className="dt-lane" style={{ "--lc": LANE_COLOUR[lane.name], "--rows": lane.rows }}>
              <span className="dt-name">{lane.name}</span>
              <div className="dt-track">
                {lay.hours.map((h) => <u key={h.m} className="dt-grid" aria-hidden="true" style={{ "--at": h.at }} />)}
                {lane.dots.map(({ entry, at, row }) => {
                  const past = nowMinutes !== null && clockMinutes(entry.time) < nowMinutes;
                  const sec = sectorOf(entry);
                  return (
                    <button
                      key={entry.id} type="button" className="dt-dot" data-past={past ? "1" : undefined} data-next={entry.id === nextId ? "1" : undefined}
                      style={{ position: "absolute", "--at": at, "--sc": sec.colour, top: row * ROW + (ROW - DOT) / 2, "--k": k++ }} aria-haspopup="dialog" title={`${entry.title} (${sec.label})`} onClick={(ev) => open(entry, ev.currentTarget)}
                    >
                      <i aria-hidden="true" />
                      <span className="dt-t">{clock(entry.time)}</span>
                      <span className="sr-only">: {entry.title}. Subject: {sec.label}</span>
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
