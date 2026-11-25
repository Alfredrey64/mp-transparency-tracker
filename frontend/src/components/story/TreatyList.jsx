/** @jsxImportSource react */
import { useId, useState } from "react";
import { dateLong } from "../../lib/upcoming";
import { pillStyle } from "../../lib/onsStyles";
import Open from "./OpenCard";
import "../../accountability.css";
import "../../watchdog.css";
import "../../treaties.css";

// Treaties laid before Parliament in the last 12 months, and any whose scrutiny is still open (data/treaties.json, fetch-treaties.js, from Parliament's Treaties API).
// Each treaty is a card that opens to show the steps Parliament recorded. Where a treaty is in its 21 sitting days, the end date is Parliament's own: the page never counts sitting days.

const GREEN = "#3F7D5C";
const BLUE = "#2C7DA0";
const GREY = "#5B6784";
const day = (d) => new Date(`${d}T00:00:00Z`).getTime();
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const today = () => new Date().toISOString().slice(0, 10);

// Where a treaty stands. `now` is a day (YYYY-MM-DD).
function standing(t, now) {
  if (t.status === "withdrawn") return { key: "withdrawn", colour: GREY, label: "Withdrawn", chip: "Withdrawn from Parliament" };
  if (t.status === "clear") return { key: "clear", colour: GREEN, label: "Cleared", chip: t.objectionEnds ? `Objection period ended ${dateLong(t.objectionEnds)}` : "Parliament's scrutiny has ended" };
  if (!t.objectionEnds) return { key: "open", colour: BLUE, label: "Open", chip: "In Parliament's objection period" };
  if (t.objectionEnds >= now) {
    const left = Math.round((day(t.objectionEnds) - day(now)) / 86400000);
    return { key: "open", colour: BLUE, label: "Open", chip: left === 0 ? "Objection period ends today" : `Objection period ends ${dateLong(t.objectionEnds)}` };
  }
  return { key: "ended", colour: GREY, label: "Period over", chip: `Objection period ended ${dateLong(t.objectionEnds)}, outcome not yet recorded` };
}

const MEANING = {
  open: "The treaty has been laid before Parliament. It cannot be ratified until the objection period (21 sitting days) has passed without either House resolving against it. Parliament lists the end date shown here.",
  ended: "The objection period has ended, but Parliament's record does not yet show the scrutiny as concluded. The record is updated by Parliament's staff, so this usually settles within days.",
  clear: "Parliament's record shows the scrutiny as finished with no objection, so the government is free to ratify. Ratifying is a separate step, and the site does not track whether it has happened.",
  withdrawn: "The government took the treaty back from Parliament, so it cannot be ratified in the form that was laid. It may be laid again later.",
};

const FILTERS = [["all", "All"], ["open", "Open now"], ["clear", "Cleared"]];

export default function TreatyList({ treaties }) {
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState("all");
  const base = useId();
  const now = today();
  const rows = treaties.map((t) => ({ t, s: standing(t, now) }));
  const shown = rows.filter(({ s }) => filter === "all" || (filter === "open" ? s.key === "open" || s.key === "ended" : s.key === filter));
  return (
    <>
      <div role="group" aria-label="Show treaties" className="tr-filters">
        {FILTERS.map(([k, label]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} style={pillStyle(filter === k)}>{label}</button>)}
      </div>
      {shown.length === 0 && <p className="ac-empty">No treaties match.</p>}
      <ul className="bbx-list tr-list">
        {shown.map(({ t, s }) => (
          <Open
            key={t.id}
            id={`${base}-${t.id}`}
            colour={s.colour}
            open={open === t.id}
            onToggle={() => setOpen(open === t.id ? null : t.id)}
            title={t.title}
            lead={<span className="bbx-lead wdc-state" data-state={s.key}><small>{s.label}</small></span>}
            meta={<>
              <span>{[t.kind, t.department].filter(Boolean).join(" · ")}{t.laid ? <>, laid <b>{dateLong(t.laid)}</b></> : null}</span>
              <span className="bbx-pill">{s.chip}</span>
            </>}
          >
            {t.title.length > 110 && <p className="tr-full"><span className="bbx-lab">Full title</span>{t.title}</p>}
            <ol className="tr-steps" aria-label="What Parliament recorded">
              {t.steps.map((st, i) => (
                <li key={`${st.date}-${i}`}>
                  <time dateTime={st.date}>{dateLong(st.date)}</time>
                  {st.link ? <a href={st.link} target="_blank" rel="noreferrer">{st.label} <span className="sr-only">(opens in a new tab)</span></a> : <span>{st.label}</span>}
                </li>
              ))}
            </ol>
            <div className="wdc-why">
              <span className="bbx-lab">What this means</span>
              <p>{MEANING[s.key]}</p>
            </div>
            <p className="wdc-role">{[t.paper && `Command paper ${t.paper}`, t.series, t.signed && `signed ${dateLong(t.signed)}`].filter(Boolean).join(" · ")}</p>
            {t.url && <div className="wdc-links"><a className="bbx-link" href={t.url} target="_blank" rel="noreferrer">Read the treaty on GOV.UK <span className="sr-only">(opens in a new tab)</span></a></div>}
          </Open>
        ))}
      </ul>
      <p className="tr-count" aria-live="polite">{plural(shown.length, "treaty")} shown</p>
    </>
  );
}
