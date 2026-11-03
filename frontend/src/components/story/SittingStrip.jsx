/** @jsxImportSource react */
import { useGo } from "./useGo";
import { useEntryDialog } from "./useEntryDialog";
import { weeks, dayShort, dayLong, londonToday, mixByDay, KIND_GROUPS } from "../../lib/upcoming";

// One calendar across the whole width: a row for each of the next four weeks, Monday to Friday along the top. Each day shows its date and whether the Commons and the Lords sit,
// as a solid bar for sitting, a hatched one for recess and an outline for a weekday the house is not sitting, always with the word as well. Press a day to see what is listed for
// it. Drawn from data/parliamentCalendar.json.
const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const say = (s) => (s === "off" ? "not sitting" : WORD[s].toLowerCase());
const WORD = { sitting: "Sitting", recess: "Recess", off: "Off", weekend: "Weekend" };
const month = (d) => dayLong(d).split(" ")[2];
const dom = (d) => String(Number(d.slice(8)));

// A calendar event as the rows and the panel read it.
const entry = (e) => ({ ...e, id: `${e.k}-${e.d}-${e.t}-${e.time}`, kind: e.k, title: e.t.replace(/\s*\(including Topical Questions\)\s*/i, " (with topical questions)").trim(), date: e.d });

// "(2 bills, 5 committee evidence)" for the spoken label of a day.
const mixText = (m) => {
  const parts = m ? KIND_GROUPS.filter((g) => m[g.key] > 0).map((g) => `${m[g.key]} ${g.label.toLowerCase()}`) : [];
  return parts.length ? `: ${parts.join(", ")}` : "";
};

function dayEntry(data, d) {
  const items = data.events.filter((e) => e.d === d.date).sort((a, b) => (a.time || "99").localeCompare(b.time || "99")).map(entry);
  const say = (s) => `${s === "sitting" ? "is sitting" : s === "recess" ? "is in recess" : "is not sitting"}.`;
  return {
    id: `day-${d.date}`, kind: "day", title: dayLong(d.date), date: d.date, items,
    houses: ["Commons", "Lords"].map((name) => ({ name, text: say(d[name[0]]) })),
  };
}

// The days that open a new month on the calendar (the first day shown, and the first day of each month after), which get the month's name beside the date.
function monthStarts(list) {
  const starts = new Set();
  let last = null;
  for (const d of list.flatMap((w) => w.days)) {
    if (!d.inside) continue;
    if (month(d.date) !== last) starts.add(d.date);
    last = month(d.date);
  }
  return starts;
}

export default function SittingStrip({ data }) {
  const [ref, go] = useGo(0.12);
  const [open, dialog] = useEntryDialog();
  const list = weeks(data);
  const today = londonToday();
  const starts = monthStarts(list);
  const mix = mixByDay(data);
  return (
    <figure ref={ref} className="up-cal" data-go={go}>
      <p className="up-key" aria-hidden="true">
        <span><i className="on" />Sitting</span><span><i className="recess" />Recess</span><span><i className="off" />Off (not sitting)</span><span className="up-key-c"><i data-house="Commons" />Commons</span><span className="up-key-c"><i data-house="Lords" />Lords</span>
      </p>
      <p className="up-key up-key-mix" aria-hidden="true">
        <b>What is listed on each day:</b>
        {KIND_GROUPS.map((g) => <span key={g.key}><i style={{ background: g.colour }} />{g.label}</span>)}
      </p>
      <div className="uc" role="table" aria-label={`Sitting days from ${dayLong(data.from)} to ${dayLong(data.to)}. Press a day to see what is listed.`}>
        <div className="uc-row uc-head" role="row">
          <span className="uc-corner" role="columnheader"><span className="sr-only">Week</span></span>
          {DAY.map((d) => <span key={d} className="uc-dow" role="columnheader">{d}</span>)}
        </div>
        {list.map((w, wi) => (
          <div key={w.start} className="uc-row" role="row" style={{ "--w": wi }}>
            <span className="uc-week" role="rowheader"><small>Week of</small><b>{dayShort(w.start).split(" ").slice(1).join(" ")}</b></span>
            {w.days.map((d) => {
              const showMonth = starts.has(d.date);
              if (!d.inside) return <div key={d.date} role="cell" className="uc-cell" data-out="1"><span className="uc-date"><b>{dom(d.date)}</b></span><span className="sr-only">{dayLong(d.date)} is outside the dates shown</span></div>;
              const label = `${dayLong(d.date)}${d.date === today ? ", today" : ""}. Commons: ${say(d.C)}. Lords: ${say(d.L)}. ${d.n ? `${d.n} ${d.n === 1 ? "item" : "items"} listed${mixText(mix.get(d.date))}.` : "Nothing listed yet."}`;
              return (
                <div key={d.date} role="cell" className="uc-cell" data-today={d.date === today ? "1" : undefined}>
                  <button type="button" aria-haspopup="dialog" onClick={(ev) => open(dayEntry(data, d), ev.currentTarget)}>
                    <span className="sr-only">{label}</span>
                    <span className="uc-date" aria-hidden="true"><b>{dom(d.date)}</b>{showMonth && <small>{month(d.date)}</small>}{d.date === today && <em>Today</em>}</span>
                    {["Commons", "Lords"].map((house) => (
                      <span key={house} className="uc-bar" data-house={house} data-s={d[house[0]]} aria-hidden="true"><span className="uc-hn">{house[0]}<span>{house.slice(1)}</span></span><span className="uc-st">{WORD[d[house[0]]]}</span></span>
                    ))}
                    <span className="uc-n" aria-hidden="true">{d.n ? <><b>{d.n}</b><span> listed</span></> : <span>Nothing listed yet</span>}</span>
                    {mix.get(d.date) && <span className="uc-mix" aria-hidden="true">{KIND_GROUPS.filter((g) => mix.get(d.date)[g.key] > 0).map((g, i) => <i key={g.key} style={{ flexGrow: mix.get(d.date)[g.key], background: g.colour, "--k": i }} />)}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {dialog}
    </figure>
  );
}
