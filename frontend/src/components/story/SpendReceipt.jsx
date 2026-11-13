/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import {
  LARGE_PARTIES, SMALL_PARTIES, SMALL_CAMPAIGNERS, LARGE_CAMPAIGNERS, CANDIDATES, REPORTED_TOTAL,
} from "../../data/spending2024";
import "../../story.css";
import "../../heroes.css";

// The banner of the election spending page: the 2024 spending as a till receipt that prints line by line, a line for each of the seven biggest parties, the smaller parties,
// the campaigners who were not standing and the candidates, then a running total and a stamp for the day the Electoral Commission published it. The money is the Commission's,
// as in data/spending2024.js; the candidate line is the Commons Library's rounded £23.3m and is printed as "about".
//   why      the reason it matters, in a sentence
//   figures  [{ value, label, sub }]
const gbp = (n) => `£${n.toLocaleString("en-GB")}`;
const short = (name) => name.replace(" (SNP)", "").replace("Conservative and Unionist Party", "Conservative and Unionist");
const campaigners = LARGE_CAMPAIGNERS.reduce((n, c) => n + c.spent, 0) + SMALL_CAMPAIGNERS.spent;
const campaignerCount = LARGE_CAMPAIGNERS.length + SMALL_CAMPAIGNERS.count;

export default function SpendReceipt({ why, figures }) {
  const [ref, go] = useGo(0.2);
  let n = 0;
  const line = (extra = {}) => ({ "--i": n++, ...extra });
  const rows = LARGE_PARTIES.length + 7; // lines that print (three headings, the parties, the smaller parties, candidates, campaigners, the total), for the timing of the stamp
  return (
    <section ref={ref} className="hx hx-spend" data-go={go} aria-label="At a glance">
      <div className="hx-spend-grid">
        <div className="hx-spend-text">
          <p className="hx-why"><strong>Why it matters</strong>{why}</p>
          {figures && (
            <ul className="hx-stack">
              {figures.map((f, i) => (
                <li key={f.label} style={{ "--i": i }}>
                  <b><AnimatedValue text={f.value} /></b>
                  <span>{f.label}</span>
                  {f.sub && <em>{f.sub}</em>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <figure className="hx-receipt" style={{ "--rows": rows }}>
          <div className="hx-paper">
            <figcaption>
              <b>Return of campaign spending</b>
              <span>UK general election, 4 July 2024</span>
            </figcaption>

            <p className="hx-rc-head" style={line()}>Parties: the national campaign</p>
            <ul>
              {LARGE_PARTIES.map((p) => (
                <li key={p.name} style={line()}><i style={{ background: p.colour }} aria-hidden="true" /><span className="nm">{short(p.name)}</span><span className="dots" aria-hidden="true" /><span className="amt">{gbp(p.spent)}</span></li>
              ))}
              <li style={line()}><i className="plus" aria-hidden="true">+</i><span className="nm">{SMALL_PARTIES.count} smaller parties</span><span className="dots" aria-hidden="true" /><span className="amt">{gbp(SMALL_PARTIES.spent)}</span></li>
            </ul>

            <p className="hx-rc-head" style={line()}>Candidates: the local campaigns</p>
            <ul>
              <li style={line()}><i className="plus" aria-hidden="true">+</i><span className="nm">Every candidate, in their own seat</span><span className="dots" aria-hidden="true" /><span className="amt">about £{(CANDIDATES.spent / 1e6).toFixed(1)}m</span></li>
            </ul>

            <p className="hx-rc-head" style={line()}>Campaigners who were not standing</p>
            <ul>
              <li style={line()}><i className="plus" aria-hidden="true">+</i><span className="nm">{campaignerCount} unions, groups and companies</span><span className="dots" aria-hidden="true" /><span className="amt">{gbp(campaigners)}</span></li>
            </ul>

            <p className="hx-rc-total" style={line()}><span>Total reported</span><b><AnimatedValue text={`£${(REPORTED_TOTAL / 1e6).toFixed(1)}m`} /></b></p>

            <p className="hx-rc-stamp" aria-label="Published by the Electoral Commission on 17 July 2025"><span>Published</span><b>17 July 2025</b></p>
          </div>
          <p className="hx-rc-note">Figures as published by the Electoral Commission and the House of Commons Library.</p>
        </figure>
      </div>
    </section>
  );
}
