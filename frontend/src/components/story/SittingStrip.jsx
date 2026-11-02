/** @jsxImportSource react */
import { useGo } from "./useGo";
import { weeks, dayShort } from "../../lib/upcoming";

// Four weeks of Monday to Friday with a row for each house, coloured by whether it sits: a filled square for a sitting day, a hatched one for recess, a pale one for a
// weekday the house is not sitting. Drawn from data/parliamentCalendar.json.
const LABEL = { sitting: "sitting", recess: "recess", off: "not sitting", weekend: "weekend" };
const DAY = { 0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri" };

export default function SittingStrip({ data }) {
  const [ref, go] = useGo(0.15);
  const list = weeks(data);
  return (
    <figure ref={ref} className="up-strip" data-go={go}>
      <p className="up-key" aria-hidden="true">
        <span><i className="on" />Sitting</span><span><i className="recess" />Recess</span><span><i className="off" />Not sitting</span>
      </p>
      <ol>
        {list.map((w, wi) => (
          <li key={w.start} style={{ "--w": wi }}>
            <h3>Week of {dayShort(w.start).replace(/^\w+ /, "")}</h3>
            <div className="up-days" role="table" aria-label={`Week of ${dayShort(w.start)}`}>
              <span className="up-corner" aria-hidden="true" />
              {w.days.map((d, i) => <span key={d.date} className="up-dow" data-out={d.inside ? "0" : "1"} role="columnheader"><b>{DAY[i]}</b>{d.date.slice(8).replace(/^0/, "")}</span>)}
              {["Commons", "Lords"].map((house) => [
                <span key={`${house}-name`} className="up-house" data-house={house} role="rowheader">{house}</span>,
                ...w.days.map((d, i) => {
                  const state = !d.inside ? "out" : d[house[0]];
                  const text = `${house} on ${dayShort(d.date)}: ${LABEL[state] ?? "outside the dates shown"}`;
                  return <span key={`${house}-${d.date}`} className="up-cell" data-house={house} data-s={state} style={{ "--i": i }} role="cell" aria-label={text} title={text} />;
                }),
              ])}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
