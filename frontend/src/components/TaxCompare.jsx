import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, numeric, readable, solid } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GOVERNMENTS } from "../data/governments";
import { METRICS, formatChange, formatValue, measure } from "../lib/governmentMetrics";
import { loadMetric } from "../lib/governmentSeries";
import { yearTicks } from "../lib/onsChart";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { allTaxes, fmt, governmentOn, todayIso, toT, valueOn } from "../lib/taxRates";
import { Reveal } from "./Motion";
import Loading from "./Loading";
import LineChart from "./LineChart";
import TaxStepChart from "./TaxStepChart";

// Put any tax rate beside a national figure (growth, unemployment, prices, house prices and so on) on the same time axis, with the governments of
// the day behind both, one crosshair that moves across the two charts, and a table by government. It shows what happened side by side. Two
// lines moving together, or apart, does not show that one caused the other.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };
const select = { fontFamily: FONT_BODY, fontSize: 15, padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" };
const label = { display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 };
const LEFT = 60;
const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);

const RANGES = [
  { key: "both", label: "Everything both cover" },
  { key: "1979", label: "Since 1979", from: 1979 },
  { key: "1997", label: "Since 1997", from: 1997 },
  { key: "2010", label: "Since 2010", from: 2010 },
];

const msToT = (ms) => {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  return y + (ms - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
};
const when = (ms, span) => new Date(ms).toLocaleDateString("en-GB", span > 200 * 86400000 ? { year: "numeric", timeZone: "UTC" } : { month: "short", year: "numeric", timeZone: "UTC" });
const isoFromT = (t) => {
  const y = Math.floor(t);
  return new Date(Date.UTC(y, 0, 1) + (t - y) * (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1))).toISOString().slice(0, 10);
};
const axisFmt = (m) => (v) => {
  const n = Math.abs(v);
  if (m.unit === "%") return `${Math.round(v * 10) / 10}%`;
  if (m.unit === "£") return n >= 1000 ? `£${Math.round(v / 1000)}k` : `£${Math.round(v)}`;
  if (m.unit === "% of GDP") return `${Math.round(v)}%`;
  return Math.abs(v) >= 1000 ? `${Math.round(v).toLocaleString("en-GB")}` : `${Math.round(v * 10) / 10}`;
};

export default function TaxCompare({ item, onChange }) {
  const [now] = useState(() => Date.now());
  const nowT = toT(todayIso(now));
  const taxes = useMemo(() => allTaxes(), []);
  const lines = useMemo(() => taxes.flatMap((t) => t.lines.map((l) => ({ tax: t, line: l }))), [taxes]);
  const [lineKeyIn, metricIdIn] = String(item ?? "").split("/");
  const picked = lines.find((x) => x.line.key === lineKeyIn) ?? lines.find((x) => x.line.key === "incomeTax.basic");
  const metric = METRICS.find((m) => m.id === metricIdIn) ?? METRICS[0];
  const line = picked.line;
  const [rangeKey, setRangeKey] = useState("both");
  const [hover, setHover] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadMetric(metric).then((data) => { if (alive) { setLoaded({ id: metric.id, data }); setFailed(false); } }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [metric]);
  const data = loaded && loaded.id === metric.id ? loaded.data : null;

  const range = RANGES.find((r) => r.key === rangeKey);
  const first = data ? Math.max(line.points[0].t, msToT(data.points[0][0])) : line.points[0].t;
  const from = Math.min(Math.floor(range.from ?? first), Math.floor(nowT) - 3);
  const to = nowT;

  const change = (nextLine, nextMetric) => { setHover(null); onChange(`${nextLine}/${nextMetric}`); };

  const metricLine = useMemo(() => {
    if (!data) return null;
    const pts = data.points
      .map(([ms, v]) => ({ x: msToT(ms), y: v, label: when(ms, data.span) }))
      .filter((p) => p.x >= from - 1 && p.x <= to + 0.3);
    return [{ name: metric.label, points: pts, color: metric.colour }];
  }, [data, metric, from, to]);
  const bands = useMemo(() => bandsBetween(from, to, to).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })), [from, to]);
  const xTicks = useMemo(() => yearTicks(from, to), [from, to]);

  // The readout under the controls: the day under the crosshair, or today.
  const at = hover ?? nowT;
  const atIso = isoFromT(Math.min(at, nowT));
  const taxHere = valueOn(line, atIso);
  const metricHere = data ? [...data.points].reverse().find(([ms]) => msToT(ms) <= at) : null;
  const govHere = governmentOn(atIso);

  const fromIso = isoFromT(from);
  const rows = !data ? [] : GOVERNMENTS.filter((g) => (g.to ? g.to > fromIso : true)).map((g) => {
    const lastDay = g.to ? new Date(Date.parse(g.to) - 86400000).toISOString().slice(0, 10) : todayIso(now);
    return { g, a: valueOn(line, g.from), b: valueOn(line, lastDay), m: measure(metric, data, g, now) };
  });

  return (
    <div>
      <Reveal as="section" aria-labelledby="h-tax-cmp" style={{ ...card, marginTop: 14 }}>
        <h2 id="h-tax-cmp" style={cardTitle}>Compare a tax rate with another measure</h2>
        <p style={para}>Choose a tax rate and a national figure. Both are drawn on the same years, with who was in government behind them, and one marker moves across both. This shows what happened side by side. It does not show that the tax caused the change in the other figure, or the other way round.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 16, marginTop: 16 }}>
          <div>
            <label htmlFor="tc-line" style={label}>Tax rate</label>
            <select id="tc-line" value={line.key} onChange={(e) => change(e.target.value, metric.id)} style={select}>
              {taxes.map((t) => (
                <optgroup key={t.id} label={t.name}>
                  {t.lines.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <span style={label}>Years</span>
            <div role="group" aria-label="Years to show" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {RANGES.map((r) => <button key={r.key} type="button" aria-pressed={rangeKey === r.key} onClick={() => setRangeKey(r.key)} style={pillStyle(rangeKey === r.key)}>{r.label}</button>)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <span style={label}>National figure</span>
          <div role="group" aria-label="National figure" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {METRICS.map((m) => {
              const on = m.id === metric.id;
              return (
                <button
                  key={m.id} type="button" aria-pressed={on} onClick={() => change(line.key, m.id)}
                  style={{ ...pillStyle(false), display: "inline-flex", alignItems: "center", gap: 7, background: on ? solid(m.colour) : "transparent", borderColor: on ? solid(m.colour) : COLORS.hairline, color: on ? "#fff" : COLORS.ink }}
                >
                  <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: on ? "#fff" : m.colour }} />
                  {m.label}
                </button>
              );
            })}
          </div>
          <p style={{ ...para, fontSize: 13.5, marginTop: 8 }}>{metric.blurb}</p>
        </div>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-tax-cmp-chart" style={{ ...card, marginTop: 16 }}>
        <h2 id="h-tax-cmp-chart" style={{ ...cardTitle, fontSize: 20 }}>{picked.tax.name}: {line.label}, and {lowerFirst(metric.label)}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 10, marginTop: 14 }}>
          <div style={{ padding: "11px 14px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${line.colour}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{hover === null ? "Today" : atIso.slice(0, 4)}{govHere && hover !== null ? `, ${govHere.pm.split(" and ")[0]}` : ""}</div>
            <div style={{ ...numeric, fontSize: 24, fontWeight: 600, color: COLORS.ink }}>{taxHere === undefined ? "no record" : fmt(line.unit, taxHere)}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{line.label}</div>
          </div>
          <div style={{ padding: "11px 14px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${metric.colour}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{metricHere && data ? when(metricHere[0], data.span) : hover === null ? "Latest" : "no figure yet"}</div>
            <div style={{ ...numeric, fontSize: 24, fontWeight: 600, color: COLORS.ink }}>{metricHere ? formatValue(metric, metricHere[1]) : "no record"}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{metric.label}</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: readable(line.colour), marginBottom: 2 }}>{picked.tax.name}: {line.label}</div>
          <TaxStepChart
            lines={[line]} unit={line.unit} from={from} to={to} height={210} leftPad={LEFT} tooltip={false} hoverT={hover} onHoverT={setHover}
            ariaLabel={`${picked.tax.name}, ${line.label}, ${Math.floor(from)} to now. Now ${fmt(line.unit, valueOn(line, todayIso(now)))}.`}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: readable(metric.colour), marginBottom: 2 }}>{metric.label}</div>
          {failed && <p style={para}>The figures for this measure could not be loaded. Try again in a moment.</p>}
          {!data && !failed && <Loading />}
          {data && metricLine && (
            <LineChart
              lines={metricLine} xTicks={xTicks} yFormat={axisFmt(metric)} accent={metric.colour} height={210} bands={bands} domainX={[from, to]}
              hoverX={hover} onHoverX={setHover} leftPad={LEFT}
              ariaLabel={`${metric.label}, ${Math.floor(from)} to now. Latest ${formatValue(metric, data.points.at(-1)[1])}.`}
            />
          )}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "8px 0 0" }}>Shaded bands show who was in government. Touch or hover on either chart and the marker moves on both. Figures are from the Office for National Statistics.</p>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-tax-cmp-gov" style={{ ...card, marginTop: 16 }}>
        <h2 id="h-tax-cmp-gov" style={{ ...cardTitle, fontSize: 20 }}>Government by government</h2>
        <p style={para}>The rate when each government began and when it ended, beside what the national figure did in the same years. {metric.kind === "rate" ? "For a rate, the table gives the average over the government's time in office." : "For an amount, the table gives how much it changed over the government's time in office."} A blank means the figures do not cover enough of that government's time.</p>
        {!data ? <Loading /> : (
          <div {...scrollRegion("Rates and figures by government, scrollable")} style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14 }}>
              <caption style={{ position: "absolute", left: -9999 }}>{line.label} and {lowerFirst(metric.label)} by government</caption>
              <thead>
                <tr style={{ color: COLORS.inkSoft, textAlign: "left", fontSize: 12.5 }}>
                  <th scope="col" style={{ fontWeight: 600, padding: "6px 0" }}>Government</th>
                  <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>{line.label}</th>
                  <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>{metric.label}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ g, a, b, m }) => (
                  <tr key={g.id} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                    <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "9px 0" }}>
                      <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: g.party === "l" ? PARTY_COLOURS.Labour : PARTY_COLOURS.Conservative, marginRight: 8 }} />
                      {g.pm.split(" and ")[0]} <span style={{ color: COLORS.inkSoft, fontWeight: 500, fontSize: 12.5 }}>{g.from.slice(0, 4)} to {g.to ? g.to.slice(0, 4) : "now"}</span>
                    </th>
                    <td style={{ ...numeric, padding: "9px 0 9px 12px", color: COLORS.ink }}>
                      {a === undefined && b === undefined ? <span style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY, fontSize: 13 }}>no record yet</span> : a === b || a === undefined ? fmt(line.unit, b) : `${fmt(line.unit, a)} to ${fmt(line.unit, b)}`}
                    </td>
                    <td style={{ ...numeric, padding: "9px 0 9px 12px", color: COLORS.ink }}>
                      {m ? (metric.kind === "rate" ? `average ${formatValue(metric, m.average)}` : formatChange(metric, m.change)) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ ...para, fontSize: 13, marginTop: 10 }}>
          Most national figures move because of events far beyond any one government, such as world prices, wars, pandemics and the economic cycle. Tax changes are one of many influences, and often a response to the figures rather than the cause.
          {" "}<a href={`#/${metric.page}`} style={{ color: COLORS.ink, fontWeight: 700 }}>More on this measure</a>
        </p>
      </Reveal>
    </div>
  );
}

