/** @jsxImportSource react */
import { useId, useState } from "react";
import { partyColourByName } from "../../lib/careerTimeline";
import { dateLong } from "../../lib/upcoming";
import "../../accountability.css";
import Open from "./OpenCard";

// The pieces of the Backbench power page that are more than text: how far each kind of private member's bill got, the ballot bills of the session, and the early day motions
// that drew most signatures. Every figure is passed in from data/backbench.json.

const OUTCOME = [
  { key: "law", label: "Became law", seg: "#2F6F4E" },
  { key: "otherHouse", label: "Passed one House, now in the other", seg: "#3F7D5C" },
  { key: "later", label: "Past second reading, still in its own House", seg: "#2C7DA0" },
  { key: "second", label: "Listed at second reading (waiting for a debate, or not reached)", seg: "#8DA2C0" },
  { key: "first", label: "Presented only", seg: "#C4CDDA" },
  { key: "withdrawn", label: "Withdrawn", seg: "#B08A2E" },
];

const KINDS = [
  ["ballot", "Ballot bills"],
  ["tenMinute", "Ten Minute Rule bills"],
  ["presentation", "Presentation bills"],
  ["lords", "Bills that started in the Lords"],
];

// One bar for each kind of bill, divided by how far its bills got, all drawn to the same scale (the biggest kind fills the row).
export function BillOutcomes({ counts, label }) {
  const widest = Math.max(...KINDS.map(([k]) => counts[k]?.total ?? 0), 1);
  return (
    <figure className="ac-stack-figure" style={{ margin: 0 }}>
      <div className="ac-stack" role="list" aria-label={label}>
        {KINDS.map(([k, name]) => {
          const c = counts[k];
          if (!c?.total) return null;
          return (
            <div className="ac-stack-row" role="listitem" key={k}>
              <span>{name}<small>{c.total} presented, {c.law} became law</small></span>
              <div className="ac-bar" style={{ width: `${Math.max(8, (c.total / widest) * 100)}%` }} role="img" aria-label={OUTCOME.filter((o) => c[o.key]).map((o) => `${c[o.key]} ${o.label.toLowerCase()}`).join(", ")}>
                {OUTCOME.map((o) => c[o.key] > 0 && <i key={o.key} style={{ flexGrow: c[o.key], "--seg": o.seg }} title={`${o.label}: ${c[o.key]}`} />)}
              </div>
            </div>
          );
        })}
      </div>
      <ul className="ac-key">{OUTCOME.map((o) => <li key={o.key} style={{ "--seg": o.seg }}>{o.label}</li>)}</ul>
    </figure>
  );
}

const dayMonth = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function BallotList({ ballot }) {
  const [open, setOpen] = useState(null);
  const base = useId();
  if (!ballot?.length) return <p className="ac-empty">No ballot bills are listed for this session yet.</p>;
  return (
    <ul className="bbx-list">
      {ballot.map((b) => {
        const colour = partyColourByName(b.party) ?? "#5B6784";
        return (
          <Open
            key={b.id}
            id={`${base}-b${b.id}`}
            colour={colour}
            open={open === b.id}
            onToggle={() => setOpen(open === b.id ? null : b.id)}
            title={b.title}
            lead={<span className="bbx-lead bbx-when"><small>{b.next ? "Next sitting" : "No date yet"}</small>{b.next && <b>{dayMonth(b.next)}</b>}</span>}
            meta={<>
              {b.sponsor && <span><i className="ac-dot" style={{ "--dot": colour }} /><b>{b.sponsor}</b>{b.party ? `, ${b.party}` : ""}{b.seat ? `, ${b.seat}` : ""}</span>}
              <span className="bbx-pill">{b.stage || "Stage not listed"}</span>
            </>}
          >
            {b.longTitle && (
              <div className="bbx-say">
                <span className="bbx-lab">What the bill says it will do</span>
                <p className="bbx-quote">{b.longTitle}</p>
                <small>This is the bill&apos;s own description, called its long title.</small>
              </div>
            )}
            <dl className="bbx-facts">
              <div><dt>Brought by</dt><dd>{b.sponsor || "Not listed"}{b.party ? `, ${b.party}` : ""}{b.seat ? ` (${b.seat})` : ""}</dd></div>
              <div><dt>Stage</dt><dd>{b.stage || "Not listed"}{b.house ? `, ${b.house}` : ""}</dd></div>
              <div><dt>Next sitting</dt><dd>{b.next ? dateLong(b.next) : "No sitting date set yet"}</dd></div>
            </dl>
            <a className="bbx-link" href={`https://bills.parliament.uk/bills/${b.id}`} target="_blank" rel="noreferrer">Read the bill on bills.parliament.uk <span className="sr-only">(opens in a new tab)</span></a>
          </Open>
        );
      })}
    </ul>
  );
}

// A motion's words are one long sentence of clauses divided by semicolons; setting each clause on its own line leaves the words exactly as Parliament has them.
const clauses = (text) => String(text ?? "").split(/;\s+/).map((c, i, all) => (i < all.length - 1 ? `${c};` : c)).filter(Boolean);

export function MotionBoard({ motions }) {
  const [open, setOpen] = useState(null);
  const base = useId();
  const widest = Math.max(...motions.top.map((m) => m.signatures), 1);
  return (
    <ol className="bbx-list">
      {motions.top.map((m) => {
        const colour = partyColourByName(m.party) ?? "#5B6784";
        return (
          <Open
            key={m.uin}
            id={`${base}-m${m.id}`}
            colour={colour}
            open={open === m.id}
            onToggle={() => setOpen(open === m.id ? null : m.id)}
            title={m.title}
            lead={<span className="bbx-lead bbx-sig"><b>{m.signatures}</b><small>MPs signed</small><span className="bbx-bar" aria-hidden="true"><i style={{ width: `${Math.max(6, (m.signatures / widest) * 100)}%` }} /></span></span>}
            meta={<>
              <span><i className="ac-dot" style={{ "--dot": colour }} />Tabled by <b>{m.sponsor}</b>{m.party ? `, ${m.party}` : ""}</span>
              <span>{dateLong(m.date)}</span>
            </>}
          >
            {m.text ? (
              <div className="bbx-say">
                <span className="bbx-lab">What the motion says</span>
                <ul className="bbx-clauses">{clauses(m.text).map((c, k) => <li key={k}>{c}</li>)}</ul>
                <small>These are the motion&apos;s own words. Signing it puts an MP&apos;s support on the record; Parliament does not vote on it.</small>
              </div>
            ) : <p className="bbx-quote">The wording is on the motion&apos;s page.</p>}
            <a className="bbx-link" href={`https://edm.parliament.uk/early-day-motion/${m.id}`} target="_blank" rel="noreferrer">Read it and see who signed on edm.parliament.uk <span className="sr-only">(opens in a new tab)</span></a>
          </Open>
        );
      })}
    </ol>
  );
}
