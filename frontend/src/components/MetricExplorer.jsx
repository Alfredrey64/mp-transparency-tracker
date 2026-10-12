import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GROUPS } from "../lib/electionHistory";
import { METRICS, formatChange, formatValue, measureAll } from "../lib/governmentMetrics";
import { loadMetric } from "../lib/governmentSeries";
import MetricChart from "./MetricChart";
import Loading from "./Loading";

// Pick a national figure and see how it moved under each government since 1945. The figures are the ONS series from the Britain in numbers pages.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const years = (g) => `${g.from.slice(0, 4)} to ${g.to ? g.to.slice(0, 4) : "now"}`;

export default function MetricExplorer({ selectedId, onSelect }) {
  const [metricId, setMetricId] = useState("growth");
  const [loaded, setLoaded] = useState({ id: null, prepared: null, failed: false });
  const [now] = useState(() => Date.now());
  const metric = METRICS.find((m) => m.id === metricId);

  useEffect(() => {
    let alive = true;
    loadMetric(metric)
      .then((prepared) => alive && setLoaded({ id: metric.id, prepared, failed: false }))
      .catch(() => alive && setLoaded({ id: metric.id, prepared: null, failed: true }));
    return () => { alive = false; };
  }, [metric]);

  const ready = loaded.id === metric.id && loaded.prepared;
  const rows = useMemo(() => (ready ? measureAll(metric, loaded.prepared, now) : []), [ready, metric, loaded.prepared, now]);
  const isRate = metric.kind === "rate";

  return (
    <section aria-labelledby="h-gt-metrics" style={{ ...card, marginTop: 18 }}>
      <h2 id="h-gt-metrics" style={cardTitle}>How the numbers moved</h2>
      <p style={para}>
        Pick a figure to see how it changed from government to government. The bands behind the line show who was in power. Many things move these numbers that no government controls, such as wars, oil prices, pandemics and what happens in other countries, so this shows what happened, not who caused it. Find more on each in <a href="#/economy" style={{ color: COLORS.ink, fontWeight: 600 }}>Britain in numbers</a>.
      </p>
      <div {...scrollRegion("Figures")} role="group" aria-label="Choose a figure" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 2px 8px" }}>
        {METRICS.map((m) => (
          <button key={m.id} type="button" aria-pressed={m.id === metricId} onClick={() => setMetricId(m.id)} style={{ ...pillStyle(m.id === metricId), flexShrink: 0 }}>{m.label}</button>
        ))}
      </div>
      <p style={{ ...para, fontSize: 14, marginTop: 4 }}>{metric.blurb} <a href={`#/${metric.page}`} style={{ color: COLORS.ink, fontWeight: 600 }}>More in Britain in numbers</a></p>

      <div style={{ marginTop: 14, minHeight: 330 }}>
        {loaded.failed && loaded.id === metric.id && <p style={para}>This figure could not be loaded just now.</p>}
        {!ready && !(loaded.failed && loaded.id === metric.id) && <Loading />}
        {ready && <MetricChart metric={metric} prepared={loaded.prepared} now={now} selectedId={selectedId} onSelect={onSelect} />}
      </div>

      {ready && (
        <div {...scrollRegion("Table, scrollable")} style={{ overflowX: "auto", marginTop: 14 }}>
        <table style={{ width: "100%", minWidth: 460, borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14 }}>
          <caption style={{ position: "absolute", left: -9999 }}>{metric.label} under each government</caption>
          <thead>
            <tr style={{ color: COLORS.inkSoft, textAlign: "right", fontSize: 12.5 }}>
              <th scope="col" style={{ textAlign: "left", fontWeight: 600, padding: "6px 0" }}>Government</th>
              {isRate && <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 10px" }}>Average</th>}
              <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 10px" }}>At the start</th>
              <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 10px" }}>At the end</th>
              <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 10px" }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ gov, m }) => (
              <tr key={gov.id} style={{ borderTop: `1px solid ${COLORS.hairline}`, background: gov.id === selectedId ? `color-mix(in srgb, ${COLORS.accent} 8%, transparent)` : "transparent" }}>
                <th scope="row" style={{ textAlign: "left", fontWeight: 600, padding: "9px 0", color: COLORS.ink }}>
                  <button type="button" onClick={() => onSelect(gov.id)} style={{ background: "none", border: 0, padding: 0, margin: 0, font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer", display: "block" }}>
                    <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: gov.party === "l" ? GROUPS.l.colour : GROUPS.c.colour, marginRight: 8, boxShadow: gov.party === "lc" ? `inset -5px 0 0 ${GROUPS.d.colour}` : "none" }} />
                    <span style={{ textDecoration: "underline", textDecorationColor: COLORS.hairline, textUnderlineOffset: 3 }}>{gov.pm}</span>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 400, color: COLORS.inkSoft, marginLeft: 18 }}>{years(gov)}</span>
                  </button>
                </th>
                {m ? (
                  <>
                    {isRate && <td style={{ ...numeric, textAlign: "right", color: COLORS.ink, fontWeight: 700, paddingLeft: 10 }}>{formatValue(metric, m.average)}</td>}
                    <td style={{ ...numeric, textAlign: "right", color: COLORS.inkSoft, paddingLeft: 10 }}>{formatValue(metric, m.start)}</td>
                    <td style={{ ...numeric, textAlign: "right", color: COLORS.inkSoft, paddingLeft: 10 }}>{formatValue(metric, m.end)}{m.ongoing ? "*" : ""}</td>
                    <td style={{ ...numeric, textAlign: "right", color: COLORS.ink, paddingLeft: 10 }}>{formatChange(metric, m.change)}</td>
                  </>
                ) : (
                  <td colSpan={isRate ? 4 : 3} style={{ textAlign: "right", color: COLORS.inkSoft, fontStyle: "italic", fontSize: 13 }}>Not covered by this series</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      {ready && (
        <p style={{ ...para, fontSize: 12.5, marginTop: 12 }}>
          * The latest figure, as the government is still in office. For rates, "average" is the average of the figures published during the government's time in office, and "change" is the difference between the start and the end in percentage points. For amounts, "change" is the percentage change from start to end (or points for a share). Annual series give the figure for the calendar year, so the start and end can fall in years that the government only partly covered. A series is left blank where it covers less than 90% of a government's time in office. Source: Office for National Statistics.
        </p>
      )}
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, margin: "18px 0 0", color: COLORS.ink }}>Reading it fairly</h3>
      <ul style={{ ...para, margin: "6px 0 0", paddingLeft: 20, display: "grid", gap: 6 }}>
        <li>A government inherits the economy it is handed. The start figure shows what it inherited.</li>
        <li>Policies often take years to have an effect, so a figure at the end of a government can reflect decisions made by the one before.</li>
        <li>The Bank of England has set interest rates independently of ministers since May 1997.</li>
        <li>Prices in the older years are in the money of the day, unless the figure says it is adjusted for inflation.</li>
      </ul>
    </section>
  );
}
