import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GOVERNMENTS } from "../data/governments";
import { STATUS, manifestosFor } from "../data/manifestoPledges";
import { GROUPS } from "../lib/electionHistory";
import { METRICS, formatChange, formatValue, measure } from "../lib/governmentMetrics";
import { loadMetric } from "../lib/governmentSeries";
import { Reveal } from "./Motion";
import Loading from "./Loading";

// Compare two governments side by side: how each came to power, what changed, what its party promised and how the figures moved. It lays the facts
// next to each other and does not say which did better.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const select = { fontFamily: FONT_BODY, fontSize: 15, padding: "9px 12px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" };
const partyColour = (p) => (p === "l" ? GROUPS.l.colour : GROUPS.c.colour);
const band = (p) => (p === "lc" ? `linear-gradient(110deg, ${partyColour(p)} 0%, ${partyColour(p)} 64%, ${GROUPS.d.colour} 100%)` : `linear-gradient(120deg, ${partyColour(p)} 0%, color-mix(in srgb, ${partyColour(p)} 62%, #000) 100%)`);
const PARTY = { l: "Labour", c: "Conservative", lc: "Conservative and Liberal Democrat coalition" };
const year = (iso) => iso.slice(0, 4);
const label = (g) => `${g.pm.split(" and ")[0]} (${year(g.from)} to ${g.to ? year(g.to) : "now"})`;

function Column({ gov }) {
  const ms = manifestosFor(gov);
  return (
    <div style={{ minWidth: 0, borderRadius: 18, border: `1px solid ${COLORS.hairline}`, overflow: "hidden", background: COLORS.paper }}>
      <div style={{ background: band(gov.party), color: "#fff", padding: "16px 18px" }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5 }}>{PARTY[gov.party]}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, lineHeight: 1.15, marginTop: 2 }}>{gov.pm}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 4 }}>{year(gov.from)} to {gov.to ? year(gov.to) : "now"}</div>
      </div>
      <div style={{ padding: "14px 18px 18px" }}>
        <p style={{ ...para, marginTop: 0, fontSize: 14 }}>{gov.took}</p>
        <ul style={{ margin: "12px 0 0", paddingLeft: 18, display: "grid", gap: 6, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
          {gov.changes.slice(0, 4).map((c) => <li key={c}>{c}</li>)}
        </ul>
        {ms.length > 0 ? ms.map((m) => {
          const counts = m.pledges.reduce((a, p) => ({ ...a, [p.status]: (a[p.status] ?? 0) + 1 }), {});
          return (
            <p key={m.id} style={{ ...para, fontSize: 13.5, marginTop: 12 }}>
              <strong style={{ color: COLORS.ink }}>{m.election} promises ({m.pledges.length} checked):</strong>{" "}
              {Object.keys(STATUS).filter((k) => counts[k]).map((k) => `${counts[k]} ${STATUS[k].label.toLowerCase()}`).join(", ")}
            </p>
          );
        }) : <p style={{ ...para, fontSize: 13.5, marginTop: 12 }}>Manifestos are only compared from 1997.</p>}
      </div>
    </div>
  );
}

export default function CompareGovernments({ initial = ["thatcher", "blair"] }) {
  const [ids, setIds] = useState(initial);
  const [series, setSeries] = useState(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    Promise.all(METRICS.map((m) => loadMetric(m).then((p) => [m.id, p]).catch(() => [m.id, null]))).then((rows) => alive && setSeries(Object.fromEntries(rows)));
    return () => { alive = false; };
  }, []);

  const [a, b] = ids.map((id) => GOVERNMENTS.find((g) => g.id === id) ?? GOVERNMENTS[0]);
  const rows = useMemo(() => {
    if (!series) return [];
    return METRICS.map((m) => ({ m, a: series[m.id] ? measure(m, series[m.id], a, now) : null, b: series[m.id] ? measure(m, series[m.id], b, now) : null }))
      .filter((r) => r.a || r.b);
  }, [series, a, b, now]);

  const cell = (m, r) => {
    if (!r) return <span style={{ color: COLORS.inkSoft, fontStyle: "italic", fontSize: 13 }}>Not covered</span>;
    return m.kind === "rate"
      ? <><strong style={{ color: COLORS.ink }}>{formatValue(m, r.average)}</strong><span style={{ display: "block", fontSize: 12, color: COLORS.inkSoft }}>average</span></>
      : <><strong style={{ color: COLORS.ink }}>{formatChange(m, r.change)}</strong><span style={{ display: "block", fontSize: 12, color: COLORS.inkSoft }}>{formatValue(m, r.start)} to {formatValue(m, r.end)}</span></>;
  };

  return (
    <Reveal as="section" aria-labelledby="h-gt-compare" style={{ ...card, marginTop: 18 }}>
      <h2 id="h-gt-compare" style={cardTitle}>Compare two governments</h2>
      <p style={para}>Put any two governments side by side. This lays out what happened under each; it does not say which did better, because most of these figures were shaped by much more than any one government.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "14px 0 4px" }}>
        {[0, 1].map((k) => (
          <div key={k} style={{ flex: "1 1 240px", minWidth: 0 }}>
            <label htmlFor={`cg-${k}`} style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 5 }}>{k === 0 ? "First government" : "Second government"}</label>
            <select id={`cg-${k}`} value={ids[k]} onChange={(e) => setIds((p) => (k === 0 ? [e.target.value, p[1]] : [p[0], e.target.value]))} style={select}>
              {GOVERNMENTS.map((g) => <option key={g.id} value={g.id}>{label(g)}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="ge-fade" key={ids.join()} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 14, marginTop: 14 }}>
        <Column gov={a} />
        <Column gov={b} />
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: "22px 0 0", color: COLORS.ink }}>The figures</h3>
      {!series ? <Loading /> : (
        <div {...scrollRegion("Figures, scrollable")} style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", minWidth: 460, borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14 }}>
            <caption style={{ position: "absolute", left: -9999 }}>National figures under {a.pm} and {b.pm}</caption>
            <thead>
              <tr style={{ color: COLORS.inkSoft, textAlign: "left", fontSize: 12.5 }}>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0" }}>Figure</th>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>{a.pm.split(" and ")[0]}</th>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>{b.pm.split(" and ")[0]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, a: ra, b: rb }) => (
                <tr key={m.id} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                  <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "9px 0" }}>
                    <span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: m.colour, marginRight: 8 }} />
                    {m.label}
                  </th>
                  <td style={{ ...numeric, padding: "9px 0 9px 12px" }}>{cell(m, ra)}</td>
                  <td style={{ ...numeric, padding: "9px 0 9px 12px" }}>{cell(m, rb)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ ...para, fontSize: 12.5, marginTop: 12 }}>For figures that are rates (such as unemployment) the table shows the average over the government's time in office. For amounts (such as house prices) it shows the percentage change from the start to the end. A figure is left out when the series covers too little of the time. Source: Office for National Statistics.</p>
    </Reveal>
  );
}
