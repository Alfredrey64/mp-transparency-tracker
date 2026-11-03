/** @jsxImportSource react */
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { useGo } from "./useGo";
import { useDataFile } from "../../lib/useDataFile";
import { parliamentCalendar } from "../../lib/dataFiles";
import { dayLong, dayShort, dateLong, dayView, londonToday, nextBusyDay } from "../../lib/upcoming";
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
const entry = (e) => ({ ...e, kind: e.k, title: e.t.replace(/\s*\(including Topical Questions\)\s*/i, " (with topical questions)").trim() });

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

function Group({ title, colour, children, i }) {
  return (
    <section className="td-group" style={{ "--tc": colour, "--i": i }}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function TodayInParliament({ onAhead }) {
  const { data, failed } = useDataFile(parliamentCalendar);
  const [ref, go] = useGo(0.1);
  if (!data) return failed ? <LoadFailedNote item="Parliament's calendar" /> : <Loading />;

  const date = londonToday();
  const v = dayView(data, date);
  const commonsCount = [...v.business, ...v.questions, ...v.bills, ...v.hearings].filter((e) => e.h === "C").length;
  const lordsCount = [...v.business, ...v.bills, ...v.hearings].filter((e) => e.h === "L").length;
  const total = v.business.length + v.questions.length + v.bills.length + v.hearings.length;
  const next = total === 0 ? nextBusyDay(data, date) : null;

  return (
    <div ref={ref} className="td" data-go={go}>
      <div className="td-date">
        <b>{dayLong(date)}</b>
        <span>What the calendar lists for today</span>
      </div>
      <div className="td-houses">
        <House name="Commons" state={v.commons} away={data.away} count={commonsCount} inRange={v.inRange} />
        <House name="Lords" state={v.lords} away={data.away} count={lordsCount} inRange={v.inRange} />
      </div>

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

      {v.business.length > 0 && (
        <Group i={0} title="In the chambers" colour="#5A4FCF">
          <EntryList items={v.business.map(entry)} label="In the chambers" />
        </Group>
      )}
      {v.questions.length > 0 && (
        <Group i={1} title="Questions to ministers" colour="#B45A3C">
          <EntryList items={v.questions.map(entry)} label="Questions to ministers" />
        </Group>
      )}
      {v.bills.length > 0 && (
        <Group i={2} title="Bills being debated" colour="#7B5BD6">
          <EntryList items={v.bills.map(entry)} label="Bills being debated" />
        </Group>
      )}
      {v.hearings.length > 0 && (
        <Group i={3} title="Committees taking evidence" colour="#2C7DA0">
          <EntryList items={v.hearings.map(entry)} label="Committees taking evidence" />
        </Group>
      )}
      <p className="td-foot">From Parliament's What's On calendar, refreshed each day, last on {dateLong(data.generated)}. It lists planned business, so it may not match what actually happens.</p>
    </div>
  );
}
