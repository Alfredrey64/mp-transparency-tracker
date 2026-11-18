/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { councilsForCodes } from "../../lib/councils";
import { figuresFor, councilOptions, against, investigated, OUTCOMES } from "../../lib/complaintsView";
import { lookUpPostcode, savedPostcode, savePostcode } from "../../lib/postcodeLookup";
import "../../accountability.css";

// "How does my council do?": pick a council from the list, or give a postcode and the council or councils that cover it are chosen for you. Each answer is the Ombudsman's own
// figures for that council with the average for similar councils beside them.

export function CouncilFigures({ c, year }) {
  const rel = against(c);
  const inv = investigated(c);
  return (
    <section aria-label={`${c.name}: complaints to the Ombudsman`} className="ac-item" style={{ "--ac": "#2C7DA0", marginTop: 12 }}>
      <h3>{c.name}</h3>
      <p>
        {c.decided === 0 ? `The Ombudsman decided no complaints about this council in ${year}.`
          : inv === 0 ? `In ${year} the Ombudsman decided ${c.decided} complaints and enquiries about this council. None went to a full investigation, so there is no uphold rate.`
            : rel ? `In ${year} the share of investigated complaints that were upheld was ${rel} the average for similar councils.` : `In ${year} fewer than five complaints were investigated, so the uphold rate says little on its own.`}
      </p>
      <div className="ac-figs">
        {figuresFor(c).map((f) => (
          <div key={f.label} className="ac-fig"><b>{f.value}</b><span>{f.label}</span>{f.note && <small>{f.note}</small>}</div>
        ))}
      </div>
    </section>
  );
}

export default function ComplaintsLookup({ data }) {
  const options = useMemo(() => councilOptions(data), [data]);
  const [ids, setIds] = useState([]);
  const [postcode, setPostcode] = useState(savedPostcode);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const find = async (value) => {
    setBusy(true); setError("");
    try {
      const [place, index] = await Promise.all([lookUpPostcode(value), import("../../data/councilsIndex.json").then((m) => m.default)]);
      const { district, county } = councilsForCodes(index.index, place.codes);
      const found = [district?.id, county?.id].filter((id) => id && data.councils[id]);
      if (!found.length) setError(place.country && place.country !== "England" ? "The Ombudsman's figures cover councils in England only." : "No figures are listed for the councils at that postcode.");
      else { setIds(found); savePostcode(place.postcode); }
    } catch (e) {
      setError(e.message === "postcode" ? "We couldn't find that postcode. Check it is a full, valid UK postcode." : "That lookup didn't work just now. Try again in a moment.");
    }
    setBusy(false);
  };

  // A visitor who has already given a postcode on another page is shown their council straight away.
  useEffect(() => { const saved = savedPostcode(); if (saved) find(saved); }, []); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  return (
    <div>
      <form className="ac-pc" onSubmit={(e) => { e.preventDefault(); if (postcode.trim()) find(postcode); }}>
        <label>Your postcode<input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="For example SW1A 0AA" autoComplete="postal-code" /></label>
        <button type="submit" disabled={busy}>{busy ? "Looking..." : "Find my council"}</button>
      </form>
      <div className="ac-tools">
        <select aria-label="Or choose a council from the list" value={ids.length === 1 ? ids[0] : ""} onChange={(e) => setIds(e.target.value ? [e.target.value] : [])}>
          <option value="">Or choose a council from the list</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      {error && <p className="ac-error" role="alert">{error}</p>}
      {ids.length === 0 && !error && <p className="ac-empty">Give a postcode or choose a council to see how complaints about it were decided. England's county and district councils share the work in many areas, so you may see two.</p>}
      {ids.map((id) => <CouncilFigures key={id} c={data.councils[id]} year={data.year} />)}
      <p className="ac-note">Your postcode is looked up once with postcodes.io and saved only in this browser. We never see it.</p>
    </div>
  );
}

// The national split of everything the Ombudsman decided, as one bar.
export function NationalSplit({ national }) {
  const total = national.decided;
  const parts = OUTCOMES.map((o) => ({ ...o, value: national[o.key] ?? 0 })).filter((o) => o.value > 0);
  return (
    <figure style={{ margin: 0 }}>
      <div className="ac-bar" role="img" aria-label={parts.map((p) => `${p.value.toLocaleString("en-GB")} ${p.label.toLowerCase()}`).join(", ")} style={{ height: 34 }}>
        {parts.map((p) => <i key={p.key} style={{ flexGrow: p.value, "--seg": p.seg }} title={`${p.label}: ${p.value.toLocaleString("en-GB")}`} />)}
      </div>
      <ul className="ac-key">
        {parts.map((p) => <li key={p.key} style={{ "--seg": p.seg }}><b style={{ color: "var(--c-ink)" }}>{p.value.toLocaleString("en-GB")}</b> {p.label.toLowerCase()} ({Math.round((p.value / total) * 100)}%)</li>)}
      </ul>
    </figure>
  );
}
