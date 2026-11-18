/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { lookUpPostcode, savedPostcode, savePostcode } from "../../lib/postcodeLookup";
import { tilesAround, schoolsWithin, inspectionRows, nearestTrusts, PHASE_NAME, CONCERN_NAME, CARD_GRADES, SAFEGUARDING_TEXT } from "../../lib/nearYou";
import { useDataFile } from "../../lib/useDataFile";
import { aeNearYou } from "../../lib/dataFiles";
import "../../accountability.css";

// The postcode tool on the Schools and A&E near you page. The postcode is looked up once with postcodes.io; the schools within three miles come from small map-tile files on this
// site (public/data/schools), so only the few tiles round that point are downloaded, and nothing about the postcode is sent to us.

const RADIUS = 3;
const PAGE = 8;
const PHASES = [["all", "All"], ["P", "Primary"], ["S", "Secondary"], ["X", "Special"]];

async function loadSchools(point) {
  const tiles = await Promise.all(tilesAround(point, RADIUS).map((k) => fetch(`/data/schools/${k}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => [])));
  return tiles.flat();
}

// One school. Every school has the same parts in the same order: its name and distance, what kind of school it is, one row for each inspection result it has, and (when it
// has a report card) a drop-down with the six areas the card grades.
function Pill({ tone, children }) {
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

function School({ s }) {
  const rows = inspectionRows(s);
  const card = rows.find((r) => r.kind === "card");
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
      <dl className="sc-rows">{rows.map((r) => <Result key={r.kind} row={r} />)}</dl>
      {card && <SixAreas row={card} />}
    </li>
  );
}

function GradeKey() {
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

function Schools({ point }) {
  const [state, setState] = useState({ list: null, failed: false });
  const [phase, setPhase] = useState("all");
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    let alive = true;
    loadSchools(point).then((records) => alive && setState({ list: records, failed: false })).catch(() => alive && setState({ list: null, failed: true }));
    return () => { alive = false; };
  }, [point]);
  if (state.failed) return <p className="ac-error">The school figures did not load. Try again in a moment.</p>;
  if (point.country && point.country !== "England") return <p className="ac-empty">These school results cover state-funded schools in England. Schools in {point.country} are inspected and reported separately.</p>;
  if (!state.list) return <p className="ac-empty">Finding schools...</p>;
  const all = schoolsWithin(state.list, point, RADIUS);
  const list = phase === "all" ? all : all.filter((s) => s.p === phase);
  return (
    <div>
      <div className="ac-tools" role="group" aria-label="Kind of school">
        {PHASES.map(([k, label]) => <button key={k} type="button" aria-pressed={phase === k} onClick={() => { setPhase(k); setShown(PAGE); }}>{label} ({k === "all" ? all.length : all.filter((s) => s.p === k).length})</button>)}
      </div>
      {list.length === 0 ? <p className="ac-empty">No schools of that kind are listed within {RADIUS} miles.</p> : <><GradeKey /><ul className="ac-list">{list.slice(0, shown).map((s) => <School key={s.u} s={s} />)}</ul></>}
      {list.length > shown && <button type="button" className="ac-more" onClick={() => setShown(shown + PAGE)}>Show {Math.min(PAGE, list.length - shown)} more ({list.length - shown} left)</button>}
    </div>
  );
}

function Emergency({ point }) {
  const { data, failed } = useDataFile(aeNearYou);
  if (failed) return <p className="ac-error">The A&amp;E figures did not load. Try again in a moment.</p>;
  if (!data) return <p className="ac-empty">Finding A&amp;E departments...</p>;
  if (point.country && point.country !== "England") return <p className="ac-empty">These figures are for NHS trusts in England. Health services in {point.country} are run and reported separately.</p>;
  const near = nearestTrusts(data.trusts, point, 3);
  const nat = data.national;
  return (
    <div>
      <ul className="ac-list">
        {near.map((t) => (
          <li key={t.code} className="ac-item" style={{ "--ac": t.allWithin4 >= 85 ? "#3F7D5C" : t.allWithin4 >= nat.allWithin4 ? "#2C7DA0" : "#B3262E" }}>
            <h3>{t.name}</h3>
            <div className="ac-meta"><span><b>{t.miles.toFixed(1)}</b> miles from the trust's main address</span><span>{t.region}</span></div>
            <div className="ac-figs">
              <div className="ac-fig"><b>{t.allWithin4}%</b><span>seen, treated and admitted or discharged within four hours</span><small>All A&amp;E types, {data.month}. England: {nat.allWithin4}%.</small></div>
              <div className="ac-fig"><b>{t.within4}%</b><span>within four hours at the major A&amp;E</span><small>Type 1 departments only. England: {nat.within4}%.</small></div>
              <div className="ac-fig"><b>{t.waited12.toLocaleString("en-GB")}</b><span>waited 12 hours or more from the decision to admit</span><small>{t.attendances.toLocaleString("en-GB")} major A&amp;E attendances in the month.</small></div>
            </div>
            <div className="ac-meter" role="img" aria-label={`${t.allWithin4} percent within four hours. The 95 percent standard is marked.`}><i style={{ width: `${t.allWithin4}%`, "--ac": "#2C7DA0" }} /><b style={{ left: "95%" }} /></div>
            <small style={{ font: "500 12.5px 'Public Sans', system-ui, sans-serif", color: "var(--c-ink-soft)" }}>The line marks the 95% standard.</small>
          </li>
        ))}
      </ul>
      <p className="ac-note">A trust can run more than one hospital, and the distance is measured to its main address, so the nearest A&amp;E to your door may belong to a different trust. Figures are NHS England's for {data.month}, the latest month published.</p>
    </div>
  );
}

export default function NearYouTool() {
  const [postcode, setPostcode] = useState(savedPostcode);
  const [point, setPoint] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const find = async (value) => {
    setBusy(true); setError("");
    try {
      const p = await lookUpPostcode(value);
      savePostcode(p.postcode);
      setPostcode(p.postcode);
      setPoint(p);
    } catch (e) {
      setPoint(null);
      setError(e.message === "postcode" ? "We couldn't find that postcode. Check it is a full, valid UK postcode." : "That lookup didn't work just now. Try again in a moment.");
    }
    setBusy(false);
  };
  // A visitor who has already given a postcode on another page is shown their results straight away.
  useEffect(() => { const saved = savedPostcode(); if (saved) find(saved); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  return (
    <div>
      <form className="ac-pc" onSubmit={(e) => { e.preventDefault(); if (postcode.trim()) find(postcode); }}>
        <label>Your postcode<input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="For example SW1A 0AA" autoComplete="postal-code" /></label>
        <button type="submit" disabled={busy}>{busy ? "Looking..." : "Show what's near me"}</button>
      </form>
      {error && <p className="ac-error" role="alert">{error}</p>}
      <p className="ac-note" style={{ marginTop: 0 }}>Your postcode is looked up once with postcodes.io and saved only in this browser. We never see it.</p>
      {point && (
        <>
          <h3 style={{ margin: "22px 0 8px", font: "700 20px 'Figures', 'Newsreader', Georgia, serif", color: "var(--c-ink)" }}>Schools within {RADIUS} miles of {point.postcode}</h3>
          <Schools point={point} />
          <h3 style={{ margin: "30px 0 8px", font: "700 20px 'Figures', 'Newsreader', Georgia, serif", color: "var(--c-ink)" }}>The three nearest A&amp;E trusts</h3>
          <Emergency point={point} />
        </>
      )}
    </div>
  );
}
