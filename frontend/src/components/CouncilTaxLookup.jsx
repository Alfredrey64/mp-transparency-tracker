import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import data from "../data/councilTaxByCouncil.json";
import { getTax, toT } from "../lib/taxRates";
import TaxStepChart from "./TaxStepChart";

// Look up a council in England and see its Band D bill (the whole bill: the council, the county, police, fire and any London or combined authority
// charge, plus parish charges) each year since 2010 to 2011, beside the England average. Figures are from the Ministry of Housing, Communities and
// Local Government. Scotland, Wales and Northern Ireland have their own systems and are not included.

const money = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export default function CouncilTaxLookup({ accent }) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState("Westminster");
  const q = norm(query);
  const matches = q.length < 2 ? [] : data.rows.filter((r) => norm(r[0]).includes(q)).slice(0, 8);
  const row = data.rows.find((r) => r[0] === name) ?? data.rows[0];
  const years = row[2].map((_, i) => data.from + i);
  const england = getTax("council-tax").lines[0];
  const eng = years.map((y) => england.points.filter((p) => p.date <= `${y}-04-02`).at(-1)?.value);
  const asLine = (key, label, colour, values) => ({ key, taxId: "council-tax", label, unit: "gbp0", kind: "rate", colour, points: values.map((value, i) => ({ date: `${years[i]}-04-01`, t: toT(`${years[i]}-04-01`), value, ann: null, note: null, p: null })) });
  const first = row[2].find((v) => v !== null);
  const last = row[2].at(-1);
  const from = toT(`${years[0]}-04-01`);
  const to = toT(`${years.at(-1)}-12-31`);
  return (
    <div style={{ marginTop: 18, padding: "16px clamp(12px, 3vw, 18px) 14px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Find your council</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "4px 0 10px", lineHeight: 1.5 }}>Type the name of a council in England to see its Band D bill since 2010 to 11.</p>
      <label htmlFor="ct-find" className="sr-only">Council name</label>
      <input id="ct-find" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="For example Bristol, Leeds or Kent" autoComplete="off" style={{ fontFamily: FONT_BODY, fontSize: 15, padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
      {query.trim().length >= 2 && (
        <ul aria-label="Matching councils" style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {matches.length === 0 && <li style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No council in England matches that.</li>}
          {matches.map((r) => (
            <li key={r[0]}><button type="button" onClick={() => { setName(r[0]); setQuery(""); }} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink }}>{r[0]}</button></li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
        <div style={{ padding: "11px 15px", borderRadius: 14, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${accent}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{row[0]}, 2026 to 27</div>
          <div style={{ ...numeric, fontSize: 26, fontWeight: 600, color: COLORS.ink }}>{money(last)}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Band D, the whole bill</div>
        </div>
        <div style={{ padding: "11px 15px", borderRadius: 14, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid #8892a6` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>England average</div>
          <div style={{ ...numeric, fontSize: 26, fontWeight: 600, color: COLORS.ink }}>{money(eng.at(-1))}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{last > eng.at(-1) ? `${money(last - eng.at(-1))} above` : `${money(eng.at(-1) - last)} below`}</div>
        </div>
        <div style={{ padding: "11px 15px", borderRadius: 14, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${accent}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Since {years[0]} to {String(years[0] + 1).slice(2)}</div>
          <div style={{ ...numeric, fontSize: 26, fontWeight: 600, color: COLORS.ink }}>{first ? `up ${Math.round(((last - first) / first) * 100)}%` : "no figure"}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>England average: up {Math.round(((eng.at(-1) - eng[0]) / eng[0]) * 100)}%</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <TaxStepChart
          key={row[0]}
          lines={[asLine("ct.council", row[0], accent, row[2]), asLine("ct.england", "England average", "#8892a6", eng)]} unit="gbp0" from={from} to={to}
          ariaLabel={`Band D council tax in ${row[0]} and the England average, 2010 to 2026. ${row[0]} is ${money(last)} in 2026 to 27.`}
        />
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "8px 0 0", lineHeight: 1.5 }}>The whole Band D bill for the council's area, including the county, police, fire and any mayoral charge, from the Ministry of Housing, Communities and Local Government. Most homes are in a lower band. Some councils were merged or reorganised, so a few years can differ in what they cover.</p>
    </div>
  );
}
