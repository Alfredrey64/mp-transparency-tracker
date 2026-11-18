/** @jsxImportSource react */
import { partyColourByName } from "../../lib/careerTimeline";
import { dateLong } from "../../lib/upcoming";
import "../../accountability.css";

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

export function BallotList({ ballot }) {
  if (!ballot?.length) return <p className="ac-empty">No ballot bills are listed for this session yet.</p>;
  return (
    <ul className="ac-list">
      {ballot.map((b) => (
        <li key={b.id} className="ac-item" style={{ "--ac": partyColourByName(b.party) ?? "#5B6784" }}>
          <h3><a href={`https://bills.parliament.uk/bills/${b.id}`} target="_blank" rel="noreferrer">{b.title}</a></h3>
          <div className="ac-meta">
            {b.sponsor && <span><i className="ac-dot" style={{ "--dot": partyColourByName(b.party) ?? "#888" }} /><b>{b.sponsor}</b>{b.party ? `, ${b.party}` : ""}{b.seat ? `, ${b.seat}` : ""}</span>}
            <span>Stage: <b>{b.stage || "not listed"}</b></span>
            <span>{b.next ? <>Next sitting: <b>{dateLong(b.next)}</b></> : "No sitting date set yet"}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MotionBoard({ motions }) {
  return (
    <ol className="ac-list" style={{ listStyle: "none" }}>
      {motions.top.map((m) => (
        <li key={m.uin} className="ac-item" style={{ "--ac": partyColourByName(m.party) ?? "#5B6784" }}>
          <h3><a href={`https://edm.parliament.uk/early-day-motion/${m.id}`} target="_blank" rel="noreferrer">{m.title}</a></h3>
          <div className="ac-meta">
            <span className="ac-chip"><b>{m.signatures}</b> MPs signed</span>
            <span><i className="ac-dot" style={{ "--dot": partyColourByName(m.party) ?? "#888" }} />Tabled by <b>{m.sponsor}</b>{m.party ? `, ${m.party}` : ""}</span>
            <span>{dateLong(m.date)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
