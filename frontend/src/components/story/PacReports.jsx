/** @jsxImportSource react */
import { useId, useState } from "react";
import { dateLong } from "../../lib/upcoming";
import Open from "./OpenCard";
import "../../accountability.css";
import "../../watchdog.css";

// The Public Accounts Committee's own reports from the last year, with the government's reply to each (data/committeeReports.json). Each report is a card that opens to explain what it is
// about, where it stands and what the reply status means. The government is asked to reply within two months, which is what the "due" date is.

const GREEN = "#3F7D5C";
const RED = "#B3262E";
const GREY = "#5B6784";
const day = (d) => new Date(`${d}T00:00:00Z`).getTime();
const gap = (a, b) => Math.round((day(b) - day(a)) / 86400000);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

// What state a report is in, from the dates alone.
function standing(r, generated) {
  const reply = r.replies[0];
  if (reply) {
    const late = gap(r.due, reply.date);
    return { key: "replied", colour: GREEN, label: "Replied", chip: `Government replied ${dateLong(reply.date)}`, how: late > 0 ? `The reply came ${plural(late, "day")} after the due date.` : "The reply came on or before the due date." };
  }
  if (r.due < generated) {
    return { key: "overdue", colour: RED, label: "No reply listed", chip: "No reply listed, deadline passed", how: `The due date was ${plural(gap(r.due, generated), "day")} before this page was last updated.` };
  }
  return { key: "waiting", colour: GREY, label: "Reply not yet due", chip: "Reply not yet due", how: `The government has ${plural(gap(generated, r.due), "day")} left before the due date.` };
}

const MEANING = {
  replied: "The government has published a written reply. It says which of the Committee's recommendations it accepts, which it does not, and what it will do. Whether anything then changes depends on the government.",
  overdue: "Parliament's list shows no reply, and the date has passed. A reply may still exist in a form that the list does not link to the report, so this is not proof that the government has ignored it.",
  waiting: "The Committee has published its recommendations. The government has not replied yet, and is still inside the time it has to do so.",
};

// Report published, reply due, reply: three marks on a line, the last one filled only when a reply exists.
function Steps({ r, s, generated }) {
  const reply = r.replies[0];
  const items = [
    { t: "Report published", d: r.date, on: true },
    { t: "Reply due", d: r.due, on: r.due <= generated || Boolean(reply) },
    { t: reply ? "Reply published" : "Reply", d: reply?.date, on: Boolean(reply), none: reply ? "" : s.key === "overdue" ? "None listed" : "Not yet" },
  ];
  return (
    <ol className="wdc-steps" style={{ "--ac": s.colour }}>
      {items.map((it) => (
        <li key={it.t} data-on={it.on ? "1" : "0"}><i aria-hidden="true" /><b>{it.t}</b><span>{it.d ? dateLong(it.d) : it.none}</span></li>
      ))}
    </ol>
  );
}

export default function PacReports({ reports, generated }) {
  const [open, setOpen] = useState(null);
  const base = useId();
  if (!reports.length) return <p className="ac-empty">No Public Accounts Committee reports with a government reply due are listed for the last year.</p>;
  return (
    <ul className="bbx-list">
      {reports.map((r) => {
        const s = standing(r, generated);
        const d = new Date(`${r.date}T00:00:00Z`);
        return (
          <Open
            key={r.id}
            id={`${base}-${r.id}`}
            colour={s.colour}
            open={open === r.id}
            onToggle={() => setOpen(open === r.id ? null : r.id)}
            title={r.title}
            lead={<span className="bbx-lead wdc-state" data-state={s.key}><small>{s.label}</small></span>}
            meta={<>
              <span>{r.number}, published <b>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</b></span>
              <span className="bbx-pill">{s.chip}</span>
            </>}
          >
            <Steps r={r} s={s} generated={generated} />
            <div className="bbx-say">
              <span className="bbx-lab">What the report is about</span>
              {r.about?.length ? r.about.map((t, i) => <p key={i} className="bbx-quote">{t.replace(/([a-z])\.([A-Z])/g, "$1. $2")}</p>) : <p className="bbx-quote">Parliament&apos;s list gives no description of this report.</p>}
              <small>{r.about?.length ? "This is Parliament's own description of the subject." : r.title}</small>
            </div>
            <div className="wdc-why">
              <span className="bbx-lab">What the reply status means</span>
              <p>{MEANING[s.key]} {s.how}</p>
            </div>
            {r.role && <p className="wdc-role"><b>The Committee&apos;s job:</b> {r.role}</p>}
            <div className="wdc-links">
              <a className="bbx-link" href={r.url} target="_blank" rel="noreferrer">Read the report <span className="sr-only">(opens in a new tab)</span></a>
              {r.replies[0]?.url && <a className="bbx-link" href={r.replies[0].url} target="_blank" rel="noreferrer">Read the government&apos;s reply <span className="sr-only">(opens in a new tab)</span></a>}
            </div>
          </Open>
        );
      })}
    </ul>
  );
}
