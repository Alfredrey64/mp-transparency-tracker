/** @jsxImportSource react */
import { inspectionRows, PHASE_NAME, CONCERN_NAME, CARD_GRADES, SAFEGUARDING_TEXT } from "../../lib/nearYou";
import { resultRow } from "../../lib/schoolResults";
import resultsMeta from "../../data/schoolResultsMeta.json";
import "../../accountability.css";

// The cards used by both the Schools and A&E near you page and the Your area page, so a school or an A&E department looks the same wherever it is shown.

// One school. Every school has the same parts in the same order: its name and distance, what kind of school it is, one row for each inspection result it has, and (when it
// has a report card) a drop-down with the six areas the card grades.
export function Pill({ tone, children }) {
  return <span className="sc-pill" style={{ "--tone": tone }}>{children}</span>;
}

function SixAreas({ row }) {
  return (
    <details className="sc-areas">
      <summary>See the six areas Ofsted graded</summary>
      <ol>
        {row.areas.map((a) => (
          <li key={a.name}>
            <div className="sc-area-head"><b>{a.name}</b><Pill tone={a.grade.tone}>{a.grade.name}</Pill></div>
            <p>{a.text}</p>
          </li>
        ))}
        {row.safeguarding && (
          <li>
            <div className="sc-area-head"><b>Safeguarding</b><Pill tone={row.safeguarding === "met" ? "#2F8F6B" : "#B3262E"}>{row.safeguarding === "met" ? "Met" : "Not met"}</Pill></div>
            <p>{SAFEGUARDING_TEXT}</p>
          </li>
        )}
      </ol>
      <p className="sc-areas-note">Wording follows Ofsted's school inspection toolkit and its guide for parents. Grades from the report card cannot be compared with the old overall grades.</p>
    </details>
  );
}

function Result({ row }) {
  return (
    <div className="sc-row">
      <dt>{row.label}{row.date && <small>{row.date}</small>}</dt>
      <dd>
        {row.kind === "card" && (
          <>
            <span className="sc-strip" role="img" aria-label={row.areas.map((a) => `${a.name}: ${a.grade.name}`).join(". ")}>
              {row.areas.map((a) => <i key={a.name} style={{ "--tone": a.grade.tone }} />)}
            </span>
            <span className="sc-sum">{row.summary}{row.safeguarding ? `. Safeguarding ${row.safeguarding}.` : "."}</span>
          </>
        )}
        {row.kind === "grade" && <Pill tone={row.tone}>{row.value}</Pill>}
        {row.kind === "short" && <span className="sc-sum">{row.value}</span>}
        {row.kind === "none" && <span className="sc-sum sc-none">{row.value}</span>}
      </dd>
    </div>
  );
}

export function School({ s }) {
  const rows = inspectionRows(s);
  const card = rows.find((r) => r.kind === "card");
  const results = resultRow(s, resultsMeta);
  return (
    <li className="sc-card" style={{ "--ac": s.x ? "#B3262E" : card ? (card.weak ? "#C88A1E" : "#2F8F6B") : "#8DA2C0" }}>
      <div className="sc-head">
        <h3><a href={`https://reports.ofsted.gov.uk/provider/21/${s.u}`} target="_blank" rel="noreferrer">{s.n}<span className="sr-only"> (opens in a new tab)</span></a></h3>
        <span className="sc-dist"><b>{s.miles.toFixed(1)}</b> miles away</span>
      </div>
      <div className="sc-tags">
        <span className="sc-tag">{PHASE_NAME[s.p]}</span>
        {s.k > 0 && <span className="sc-tag">{s.k.toLocaleString("en-GB")} pupils</span>}
        {s.x && <span className="sc-tag sc-alert">Ofsted category: {CONCERN_NAME[s.x] ?? s.x}</span>}
      </div>
      <dl className="sc-rows">
        {rows.map((r) => <Result key={r.kind} row={r} />)}
        {results && (
          <div className="sc-row">
            <dt>{results.label}<small>{results.small}</small></dt>
            <dd><span className="sc-big">{results.big}</span><span className="sc-sum">{results.text}</span></dd>
          </div>
        )}
      </dl>
      {results?.extra.length > 0 && (
        <details className="sc-areas">
          <summary>More about these results</summary>
          <ol>{results.extra.map((e) => <li key={e.label}><div className="sc-area-head"><b>{e.label}</b></div><p>{e.text}</p></li>)}</ol>
          <p className="sc-areas-note">From the Department for Education's school performance tables. Results describe past pupils, not how a school will do for yours, and they follow a school's intake as much as its teaching.</p>
        </details>
      )}
      {card && <SixAreas row={card} />}
    </li>
  );
}

export function GradeKey() {
  return (
    <details className="sc-key">
      <summary>What the five grades mean</summary>
      <ul>
        {Object.values(CARD_GRADES).map((g) => <li key={g.name}><Pill tone={g.tone}>{g.name}</Pill><span>{g.text}</span></li>)}
      </ul>
      <p className="sc-areas-note">From Ofsted's guide for parents, Understanding Ofsted report cards and grades. A school can have a mix of grades across its report card.</p>
    </details>
  );
}

// One NHS trust's four-hour A&E figures, laid out like a school: name and distance, region, then one row for each measure.
export function TrustCard({ t, nat, month, wait = null, waitMonth = "", waitNat = null }) {
  const tone = t.allWithin4 >= 85 ? "#3F7D5C" : t.allWithin4 >= nat.allWithin4 ? "#2C7DA0" : "#B3262E";
  return (
    <li className="sc-card" style={{ "--ac": tone }}>
      <div className="sc-head">
        <h3>{t.name}</h3>
        <span className="sc-dist"><b>{t.miles.toFixed(1)}</b> miles away</span>
      </div>
      <div className="sc-tags"><span className="sc-tag">{t.region}</span><span className="sc-tag">Measured to the trust's main address</span></div>
      <dl className="sc-rows">
        <div className="sc-row">
          <dt>All A&amp;E types<small>{month}</small></dt>
          <dd>
            <span className="sc-big">{t.allWithin4}%</span>
            <span className="sc-sum">seen, treated and admitted or discharged within four hours. England: {nat.allWithin4}%.</span>
            <span className="ac-meter sc-meter" role="img" aria-label={`${t.allWithin4} percent within four hours. The 95 percent standard is marked.`}><i style={{ width: `${t.allWithin4}%`, "--ac": tone }} /><b style={{ left: "95%" }} /></span>
          </dd>
        </div>
        <div className="sc-row">
          <dt>Major A&amp;E<small>Type 1 departments</small></dt>
          <dd><span className="sc-big">{t.within4}%</span><span className="sc-sum">within four hours. England: {nat.within4}%.</span></dd>
        </div>
        <div className="sc-row">
          <dt>Long waits<small>12 hours or more</small></dt>
          <dd><span className="sc-big">{t.waited12.toLocaleString("en-GB")}</span><span className="sc-sum">waited from the decision to admit. {t.attendances.toLocaleString("en-GB")} major A&amp;E attendances in the month.</span></dd>
        </div>
        {wait && (
          <div className="sc-row">
            <dt>Waiting list<small>{waitMonth}</small></dt>
            <dd>
              <span className="sc-big">{wait.pct18}%</span>
              <span className="sc-sum">of the {wait.waiting.toLocaleString("en-GB")} people waiting for planned treatment have waited under 18 weeks. The standard is 92%{waitNat != null ? `; the trusts that reported average ${waitNat}%` : ""}. The typical wait so far is {wait.median} weeks, and {wait.w52.toLocaleString("en-GB")} have waited over a year.</span>
              <span className="ac-meter sc-meter" role="img" aria-label={`${wait.pct18} percent have waited under 18 weeks. The 92 percent standard is marked.`}><i style={{ width: `${wait.pct18}%`, "--ac": wait.tone }} /><b style={{ left: "92%" }} /></span>
            </dd>
          </div>
        )}
      </dl>
    </li>
  );
}

// A place with figures, laid out like a school: its name (linked if there is a page for it) and distance, tags, then one row for each measure. Used for the In numbers
// view's health services, bathing waters and sewage overflows so every nearby place on Your area looks alike. A row is { label, small, pill: {tone, label}, big, text, note }.
export function PlaceCard({ name, href, miles, tags = [], tone = "#8DA2C0", rows = [], children }) {
  return (
    <li className="sc-card" style={{ "--ac": tone }}>
      <div className="sc-head">
        <h3>{href ? <a href={href} target="_blank" rel="noreferrer">{name}<span className="sr-only"> (opens in a new tab)</span></a> : name}</h3>
        {miles != null && <span className="sc-dist"><b>{miles.toFixed(1)}</b> miles away</span>}
      </div>
      {tags.length > 0 && <div className="sc-tags">{tags.map((t) => <span key={t.text ?? t} className={`sc-tag${t.alert ? " sc-alert" : ""}`}>{t.text ?? t}</span>)}</div>}
      {rows.length > 0 && (
        <dl className="sc-rows">
          {rows.map((r) => (
            <div className="sc-row" key={r.label}>
              <dt>{r.label}{r.small && <small>{r.small}</small>}</dt>
              <dd>
                {r.pill && <Pill tone={r.pill.tone}>{r.pill.label}</Pill>}
                {r.big != null && <span className="sc-big">{r.big}</span>}
                {r.text && <span className="sc-sum">{r.text}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </li>
  );
}
