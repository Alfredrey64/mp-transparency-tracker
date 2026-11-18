/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { lookUpPostcode, savedPostcode, savePostcode } from "../../lib/postcodeLookup";
import { tilesAround, schoolsWithin, inspectionLines, nearestTrusts, PHASE_NAME, CONCERN_NAME } from "../../lib/nearYou";
import { useDataFile } from "../../lib/useDataFile";
import { aeNearYou } from "../../lib/dataFiles";
import "../../accountability.css";

// The postcode tool on the Schools and A&E near you page. The postcode is looked up once with postcodes.io; the schools within three miles come from small map-tile files on this
// site (public/data/schools), so only the few tiles round that point are downloaded, and nothing about the postcode is sent to us.

const RADIUS = 3;
const PAGE = 8;
const PHASES = [["all", "All"], ["P", "Primary"], ["S", "Secondary"], ["X", "Special"]];
const KIND_COLOUR = { card: "#2C7DA0", grade: "#7B5BD6", short: "#8DA2C0", none: "#C4CDDA" };

async function loadSchools(point) {
  const tiles = await Promise.all(tilesAround(point, RADIUS).map((k) => fetch(`/data/schools/${k}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => [])));
  return tiles.flat();
}

function School({ s }) {
  const lines = inspectionLines(s);
  return (
    <li className="ac-item" style={{ "--ac": s.x ? "#B3262E" : s.c ? "#2C7DA0" : "#8DA2C0" }}>
      <h3><a href={`https://reports.ofsted.gov.uk/provider/21/${s.u}`} target="_blank" rel="noreferrer">{s.n}</a></h3>
      <div className="ac-meta">
        <span>{PHASE_NAME[s.p]}</span>
        <span><b>{s.miles.toFixed(1)}</b> miles away</span>
        {s.k > 0 && <span>{s.k.toLocaleString("en-GB")} pupils</span>}
        {s.x && <span className="ac-chip" style={{ "--ac": "#B3262E" }}>Ofsted category: {CONCERN_NAME[s.x] ?? s.x}</span>}
      </div>
      {lines.map((l) => <p key={l.kind} style={{ borderLeft: `3px solid ${KIND_COLOUR[l.kind]}`, paddingLeft: 10 }}>{l.text}</p>)}
    </li>
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
      {list.length === 0 ? <p className="ac-empty">No schools of that kind are listed within {RADIUS} miles.</p> : <ul className="ac-list">{list.slice(0, shown).map((s) => <School key={s.u} s={s} />)}</ul>}
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
