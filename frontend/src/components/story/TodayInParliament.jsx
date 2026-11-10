/** @jsxImportSource react */
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { useState } from "react";
import { useGo } from "./useGo";
import { useLondonNow } from "../../lib/useLondonNow";
import { useEntryDialog } from "./useEntryDialog";
import DayTimeline from "./DayTimeline";
import { useDataFile } from "../../lib/useDataFile";
import { parliamentCalendar } from "../../lib/dataFiles";
import { dayLong, dayShort, dateLong, dayView, londonToday, nextBusyDay, clock, clockMinutes } from "../../lib/upcoming";
import { EntryList } from "./Entries";
import "../../today.css";

// The present tense of the What changed this week page: whether each house is sitting today, and what Parliament's calendar lists for the day. Built from the same file as
// the Coming up part (data/parliamentCalendar.json), so it only says what is listed, and says so when the calendar does not reach today.

const STATE = {
  sitting: { text: "Sitting today", tone: "on" },
  recess: { text: "In recess", tone: "off" },
  off: { text: "Not sitting today", tone: "off" },
  weekend: { text: "Weekend", tone: "off" },
};

// A calendar event as the rows and the panel read it.
const entry = (e) => ({ ...e, id: `${e.k}-${e.d}-${e.t}-${e.time}`, kind: e.k, title: e.t.replace(/\s*\(including Topical Questions\)\s*/i, " (with topical questions)").trim() });

function House({ name, state, away, count, inRange }) {
  const s = inRange ? STATE[state] : { text: "Not in the calendar", tone: "off" };
  const hit = away.find((a) => a.house === name && a.label === "Recess");
  return (
    <div className="td-house" data-tone={s.tone} data-house={name}>
      <span className="td-pulse" aria-hidden="true" />
      <b>{name}</b>
      <span className="td-state">{s.text}</span>
      {inRange && state === "sitting" && <small>{count > 0 ? `${count} ${count === 1 ? "item" : "items"} listed` : "Nothing listed yet"}</small>}
      {inRange && state === "recess" && hit && <small>Away until {dayShort(hit.to)}</small>}
    </div>
  );
}

function Group({ id, title, colour, count, children, i }) {
  return (
    <section id={id} className="td-group" style={{ "--tc": colour, "--i": i }}>
      <h2>{title}<span>{count}</span></h2>
      {children}
    </section>
  );
}

const HOUSE_FILTER = [["all", "Both houses"], ["C", "Commons"], ["L", "Lords"]];
const showsHouse = (filter, h) => filter === "all" || h === filter || h === "J";
const GROUPS = [
  { id: "td-g-chambers", title: "In the chambers", colour: "#5A4FCF", of: (v) => v.business },
  { id: "td-g-questions", title: "Questions to ministers", colour: "#B45A3C", of: (v) => v.questions },
  { id: "td-g-bills", title: "Bills being debated", colour: "#7B5BD6", of: (v) => v.bills },
  { id: "td-g-committees", title: "Committees taking evidence", colour: "#2C7DA0", of: (v) => v.hearings },
];

// "in 25 min", "in 1 h 20 min": how long until something starts.
function until(mins) {
  if (mins <= 0) return "starting now";
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  return `in ${h} h${mins % 60 ? ` ${mins % 60} min` : ""}`;
}

// What comes next, with how long until it starts.
function NextUp({ next, now, open }) {
  if (!next) return <p className="td-next td-next-none"><span className="td-next-tag">Next up</span><b>Nothing else with a time is listed for today</b></p>;
  return (
    <button type="button" className="td-next" aria-haspopup="dialog" onClick={(ev) => open(next, ev.currentTarget)}>
      <span className="td-next-tag">Next up</span>
      <span className="td-next-body"><b>{next.title}</b><span>{clock(next.time)} · Press to read what it is</span></span>
      <span className="td-next-in">{until(clockMinutes(next.time) - now)}</span>
    </button>
  );
}

// The day as one line: every timed item as a dot (Commons, Lords or both), and a marker for the time now, so it is plain at a glance how much of the day has gone.
function DayStrip({ items, now }) {
  const mins = items.map((e) => clockMinutes(e.time));
  const lo = Math.floor(Math.min(...mins, now) / 60) * 60;
  let hi = Math.ceil((Math.max(...mins) + 30) / 60) * 60;
  if (hi - lo < 240) hi = lo + 240;
  const at = (m) => Math.max(0, Math.min(100, ((m - lo) / (hi - lo)) * 100));
  const started = mins.filter((m) => m <= now).length;
  const label = (m) => clock(`${Math.floor(m / 60)}:00`);
  return (
    <div className="td-strip">
      <div className="td-strip-track" aria-hidden="true">
        <span className="td-strip-gone" style={{ "--to": `${at(now)}%` }} />
        {items.map((e, i) => <i key={e.id} data-h={e.h} style={{ left: `${at(clockMinutes(e.time))}%`, "--i": i }} />)}
        <em style={{ left: `${at(now)}%` }}><u>Now</u></em>
      </div>
      <p className="td-strip-ends" aria-hidden="true"><span>{label(lo)}</span><span>{label(lo + (hi - lo) / 2 - (((hi - lo) / 2) % 60))}</span><span>{label(hi)}</span></p>
      <p className="td-strip-cap">
        <span><b>{started} of {items.length}</b> timed {items.length === 1 ? "item has" : "items have"} started</span>
        <span className="td-strip-key" aria-hidden="true"><i data-h="C" />Commons<i data-h="L" />Lords</span>
      </p>
    </div>
  );
}

export default function TodayInParliament({ onAhead }) {
  const { data, failed } = useDataFile(parliamentCalendar);
  const [ref, go] = useGo(0.1);
  const [filter, setFilter] = useState("all");
  const [open, dialog] = useEntryDialog();
  const now = useLondonNow();
  if (!data) return failed ? <LoadFailedNote item="Parliament's calendar" /> : <Loading />;

  const date = londonToday();
  const v = dayView(data, date);
  const commonsCount = [...v.business, ...v.questions, ...v.bills, ...v.hearings].filter((e) => e.h === "C").length;
  const lordsCount = [...v.business, ...v.bills, ...v.hearings].filter((e) => e.h === "L").length;
  const total = v.business.length + v.questions.length + v.bills.length + v.hearings.length;
  const next = total === 0 ? nextBusyDay(data, date) : null;

  // Every entry, tagged as earlier today, the next one up, or still to come, and filtered by house.
  const groups = GROUPS.map((g) => ({ ...g, items: g.of(v).filter((e) => showsHouse(filter, e.h)).map(entry) }));
  const everything = groups.flatMap((g) => g.items);
  const timed = everything.filter((e) => clockMinutes(e.time) !== null).sort((a, b) => clockMinutes(a.time) - clockMinutes(b.time));
  const upcoming = timed.filter((e) => clockMinutes(e.time) >= now.minutes);
  const nextUp = upcoming[0] ?? null;
  const tag = (e) => (clockMinutes(e.time) === null ? e : { ...e, when: e.id === nextUp?.id ? "next" : clockMinutes(e.time) < now.minutes ? "past" : "later" });
  const shown = groups.map((g) => ({ ...g, items: g.items.map(tag) })).filter((g) => g.items.length);
  const timelineItems = shown.flatMap((g) => g.items);
  // The day strip in the top card ignores the house filter: it is the whole day.
  const allTimed = GROUPS.flatMap((g) => g.of(v)).map(entry).filter((e) => clockMinutes(e.time) !== null);

  return (
    <div className="td" data-go={go}>
      {/* The card at the top is what is watched, not the whole tall page, so the page plays as soon as the card is on screen. */}
      <section ref={ref} className="td-top" aria-label="Today in Parliament">
        <div className="td-top-main">
          <div className="td-date">
            <b>{dayLong(date)}</b>
            <span>What Parliament's calendar lists for today</span>
            <span className="td-clock" aria-label={`The time in London is ${clock(now.clock)}`}><i aria-hidden="true" />{clock(now.clock)}<small>London time</small></span>
          </div>
          <div className="td-houses">
            <House name="Commons" state={v.commons} away={data.away} count={commonsCount} inRange={v.inRange} />
            <House name="Lords" state={v.lords} away={data.away} count={lordsCount} inRange={v.inRange} />
          </div>
        </div>
        {allTimed.length > 0 && <DayStrip items={allTimed} now={now.minutes} />}
        {total > 0 && <NextUp next={nextUp} now={now.minutes} open={open} />}
      </section>

      {!v.inRange && (
        <p className="td-empty">The calendar this page reads was last updated on {dateLong(data.generated)} and does not reach today. It is refreshed every day, so check back soon.</p>
      )}

      {v.inRange && total === 0 && (
        <p className="td-empty">
          Nothing is listed for today yet. Business is added as each day gets closer.
          {next && <> The next day with something listed is {dayLong(next.date)}.</>}
          {onAhead && <> <button type="button" onClick={onAhead}>See the next four weeks</button></>}
        </p>
      )}

      {total > 0 && (
        <>
          <div className="td-bar">
            <h2 className="td-bar-title">What is on</h2>
            <div className="td-filter" role="group" aria-label="Which house to show">
              {HOUSE_FILTER.map(([k, label]) => <button key={k} type="button" data-house={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>)}
            </div>
          </div>
          {timelineItems.length > 0 && <div id="td-clock-view"><DayTimeline entries={timelineItems} nowMinutes={now.minutes} nextId={nextUp?.id} open={open} /></div>}
          {shown.length === 0 && <p className="td-empty">Nothing is listed for that house today.</p>}
          {shown.map((g, i) => (
            <Group key={g.id} id={g.id} i={i} title={g.title} colour={g.colour} count={g.items.length}>
              <EntryList items={g.items} label={g.title} />
            </Group>
          ))}
        </>
      )}
      {dialog}
      <p className="td-foot">From Parliament's What's On calendar, refreshed each day, last on {dateLong(data.generated)}. It lists planned business, so it may not match what actually happens.</p>
    </div>
  );
}
