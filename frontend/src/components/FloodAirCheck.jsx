/** @jsxImportSource react */
import { useState } from "react";
import { floodNear, LEVELS } from "../lib/floodWarnings";
import { COLORS, FONT_BODY } from "../theme";

// A postcode check for the flooding page: the flood warnings in force within ten kilometres right now (England, from the Environment Agency's open
// service), and where to look up long-term flood risk and air quality for that nation. The postcode is looked up once with postcodes.io and is not saved.

const FLOOD_RISK = {
  England: ["Check your long-term flood risk (Environment Agency)", "https://check-long-term-flood-risk.service.gov.uk/"],
  Scotland: ["SEPA flood maps", "https://map.sepa.org.uk/floodmaps/"],
  Wales: ["Check your flood risk (Natural Resources Wales)", "https://naturalresources.wales/flooding/check-your-flood-risk/"],
  "Northern Ireland": ["Rivers and flooding (Department for Infrastructure)", "https://www.infrastructure-ni.gov.uk/topics/rivers-and-flooding"],
};

export default function FloodAirCheck() {
  const [code, setCode] = useState("");
  const [state, setState] = useState({ status: "idle" });

  async function check(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setState({ status: "busy" });
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(code.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.result) throw new Error("postcode");
      const r = json.result;
      const warnings = r.country === "England" ? await floodNear(r.latitude, r.longitude) : undefined;
      setState({ status: "done", place: [r.admin_district, r.region ?? r.country].filter(Boolean).join(", "), country: r.country, warnings });
    } catch {
      setState({ status: "error" });
    }
  }

  const { place, country, warnings } = state;
  const link = FLOOD_RISK[country];
  return (
    <div className="st-check">
      <form onSubmit={check} className="st-check-form">
        <label htmlFor="fa-code">Your postcode</label>
        <div>
          <input id="fa-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="For example SW1A 0AA" autoComplete="postal-code" style={{ fontFamily: FONT_BODY }} />
          <button type="submit" className="btn btn-primary" disabled={state.status === "busy"}>{state.status === "busy" ? "Checking…" : "Check"}</button>
        </div>
      </form>
      {state.status === "error" && <p className="st-check-err" role="alert">We could not find that postcode. Check it is a full, valid UK postcode and try again.</p>}
      {state.status === "done" && (
        <div className="st-check-out" aria-live="polite">
          <h4>{place}</h4>
          {country === "England" ? (
            warnings === null ? <p>We could not reach the Environment Agency's warnings service just now. <a href="https://www.gov.uk/check-flooding" target="_blank" rel="noreferrer">Check flooding on GOV.UK</a>.</p> : warnings.length === 0 ? (
              <p className="st-check-ok"><b>No flood warnings or alerts are in force within 10 km of this postcode right now.</b> That says nothing about long-term risk. Use the checker below for that.</p>
            ) : (
              <ul className="st-warns">
                {warnings.map((w) => (
                  <li key={w.id} style={{ "--wc": LEVELS[w.level].colour }}>
                    <b>{LEVELS[w.level].label}</b><span>{w.area}{w.county ? `, ${w.county}` : ""}</span>
                    <small>{LEVELS[w.level].plain}.</small>
                  </li>
                ))}
              </ul>
            )
          ) : <p>Live flood warnings here come from the {country} flood service, not the Environment Agency, so this page cannot show them. Use the link below.</p>}
          <ul className="st-check-links">
            {link && <li><a href={link[1]} target="_blank" rel="noreferrer">{link[0]}</a><span>Whether your property is in an area at risk from rivers, the sea or surface water, now and with climate change.</span></li>}
            {country === "England" && <li><a href="https://www.gov.uk/sign-up-for-flood-warnings" target="_blank" rel="noreferrer">Sign up for free flood warnings</a><span>By phone, text or email.</span></li>}
            <li><a href="https://check-air-quality.service.gov.uk/" target="_blank" rel="noreferrer">Check air quality for your postcode</a><span>The Defra service, with the forecast for today and the next days.</span></li>
          </ul>
        </div>
      )}
      <p style={{ margin: "10px 0 0", fontSize: 12, color: COLORS.inkSoft, fontFamily: FONT_BODY }}>Your postcode is looked up once with postcodes.io. It is not saved or sent to us.</p>
    </div>
  );
}
