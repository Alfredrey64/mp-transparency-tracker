/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { lookUpPostcode, savedPostcode, savePostcode } from "../../lib/postcodeLookup";
import { schoolsWithin, nearestTrusts } from "../../lib/nearYou";
import { loadSchools } from "../../lib/schoolTiles";
import { School, GradeKey, TrustCard } from "./NearYouParts";
import { useDataFile } from "../../lib/useDataFile";
import { aeNearYou } from "../../lib/dataFiles";
import "../../accountability.css";

// The postcode tool on the Schools and A&E near you page. The postcode is looked up once with postcodes.io; the schools within three miles come from small map-tile files on this
// site (public/data/schools), so only the few tiles round that point are downloaded, and nothing about the postcode is sent to us.

const RADIUS = 3;
const PAGE = 8;
const PHASES = [["all", "All"], ["P", "Primary"], ["S", "Secondary"], ["X", "Special"]];


function Schools({ point }) {
  const [state, setState] = useState({ list: null, failed: false });
  const [phase, setPhase] = useState("all");
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    let alive = true;
    loadSchools(point, RADIUS).then((records) => alive && setState({ list: records, failed: false })).catch(() => alive && setState({ list: null, failed: true }));
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
      <ul className="ac-list">{near.map((t) => <TrustCard key={t.code} t={t} nat={nat} month={data.month} />)}</ul>
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
