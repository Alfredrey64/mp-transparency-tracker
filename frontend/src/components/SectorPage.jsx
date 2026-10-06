import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import LineChart from "./LineChart";
import { sectorByKey, ONS_SERIES_PAGE } from "../data/onsSectors";
import {
  formatValue, formatAxis, latestInfo, changeWords, sentenceFor, sliceRange, periodToT, periodLabel, shortPeriodLabel,
} from "../lib/onsFormat";
import { IconTrend, IconBasket, IconBriefcase, IconLedger, IconPopulation, IconHeartbeat, IconHouse } from "./icons";

// One page per sector, all drawn from the same data and the same layout: the
// headline figures first, then a chart for every series with a plain
// explanation of what it measures. The numbers come from the Office for
// National Statistics, saved by fetch-ons.js.

const ICONS = { economy: IconTrend, prices: IconBasket, jobs: IconBriefcase, publicFinances: IconLedger, population: IconPopulation, health: IconHeartbeat, housing: IconHouse };
const FILES = import.meta.glob("../data/ons/*.json");
const RANGES = [{ years: 2, label: "2 years" }, { years: 5, label: "5 years" }, { years: 10, label: "10 years" }, { years: 0, label: "All" }];

const card = { background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "18px 20px" };

function Spark({ points, color }) {
  const pts = points.slice(-24);
  if (pts.length < 2) return null;
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x = (i) => (i / (pts.length - 1)) * 100;
  const y = (v) => 24 - ((v - lo) / (hi - lo || 1)) * 20 - 2;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 26" width="100%" height="26" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", marginTop: 8 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Tile({ def, series, accent }) {
  const info = latestInfo(def, series.points);
  if (!info) return null;
  const up = info.change && info.change.amount > 0;
  const flat = !info.change || Math.abs(info.change.amount) < 0.05;
  return (
    <div style={{ ...card, padding: "16px 18px", borderTop: `3px solid ${accent}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.35 }}>{def.label}</div>
      <div style={{ ...numeric, fontSize: 34, lineHeight: 1.15, color: COLORS.ink, marginTop: 6 }}>{formatValue(def.format, info.value)}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{info.label}</div>
      {info.change && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6, display: "flex", gap: 6, alignItems: "baseline" }}>
          <span aria-hidden="true" style={{ color: flat ? COLORS.inkSoft : accent, fontSize: 11 }}>{flat ? "–" : up ? "▲" : "▼"}</span>
          <span>{changeWords(info.change)}</span>
        </div>
      )}
      <Spark points={series.points} color={accent} />
    </div>
  );
}

// Year ticks for a chart, spaced to suit how much time it covers.
function yearTicks(points) {
  const first = Math.ceil(points[0].x);
  const last = Math.floor(points.at(-1).x);
  const span = last - first;
  const step = span <= 3 ? 1 : span <= 8 ? 2 : span <= 20 ? 5 : span <= 50 ? 10 : 20;
  const ticks = [];
  for (let y = Math.ceil(first / step) * step; y <= last; y += step) ticks.push({ x: y, label: String(y) });
  if (ticks.length < 2) ticks.unshift({ x: points[0].x, label: shortPeriodLabel(points[0].period) });
  return ticks;
}

function SeriesCard({ def, series, range, accent }) {
  const pts = sliceRange(series.points, range);
  const chartPoints = pts.map(([p, v]) => ({ x: periodToT(p), y: v, label: periodLabel(p), period: p }));
  const sentence = sentenceFor(def, series.points);
  const recent = series.points.slice(-12).reverse();
  return (
    <section style={card} aria-labelledby={`h-${def.id}`}>
      <h2 id={`h-${def.id}`} style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: COLORS.ink, margin: 0 }}>{def.label}</h2>
      {sentence && <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink, margin: "6px 0 14px" }}>{sentence}</p>}
      {chartPoints.length > 1 ? (
        <LineChart
          lines={[{ name: def.label, points: chartPoints }]}
          xTicks={yearTicks(chartPoints)}
          yFormat={(v) => formatAxis(def.format, v)}
          ariaLabel={`${def.label}: line chart. ${sentence}`}
          accent={accent}
        />
      ) : (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Not enough data for this period.</p>
      )}
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "12px 0 0" }}>{def.explain}</p>
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, cursor: "pointer", padding: "4px 0" }}>Show the latest figures as a table</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6, fontFamily: FONT_BODY, fontSize: 13 }}>
          <tbody>
            {recent.map(([p, v]) => (
              <tr key={p} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                <td style={{ padding: "6px 0", color: COLORS.inkSoft }}>{periodLabel(p)}</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: COLORS.ink, fontWeight: 600 }}>{formatValue(def.format, v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 10 }}>
        Source: ONS series {def.cdid} ({def.dataset.toUpperCase()}){series.updated ? `, released ${new Date(series.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}.{" "}
        <a href={ONS_SERIES_PAGE(def)} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, textDecoration: "underline" }}>See it on the ONS site</a>
      </div>
    </section>
  );
}

function WeeklyDeaths({ data, accent }) {
  const years = Object.keys(data.years).sort();
  const thisYear = years.at(-1);
  const lastYear = years.length > 1 ? years.at(-2) : null;
  const mk = (year) => data.years[year].map((v, i) => (!v ? null : { x: i + 1, y: v, label: `Week ${i + 1} of ${year}` })).filter(Boolean);
  const now = mk(thisYear);
  if (now.length < 2) return null;
  const before = lastYear ? mk(lastYear) : [];
  const latest = now.at(-1);
  const same = before.find((p) => p.x === latest.x);
  const gap = same ? ((latest.y - same.y) / same.y) * 100 : null;
  const sentence = `In week ${latest.x} of ${thisYear}, ${latest.y.toLocaleString("en-GB")} deaths were registered in England and Wales${
    gap === null ? "." : `, ${Math.abs(gap) < 0.5 ? "about the same as" : `${Math.abs(gap).toFixed(0)}% ${gap > 0 ? "more than" : "fewer than"}`} the same week of ${lastYear}.`
  }`;
  const lines = [{ name: thisYear, color: accent, points: now, format: (v) => v.toLocaleString("en-GB") }];
  if (before.length) lines.push({ name: lastYear, color: COLORS.inkSoft, points: before, format: (v) => v.toLocaleString("en-GB") });
  return (
    <section style={card} aria-labelledby="h-weekly-deaths">
      <h2 id="h-weekly-deaths" style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: COLORS.ink, margin: 0 }}>Deaths registered each week</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink, margin: "6px 0 14px" }}>{sentence}</p>
      <LineChart
        lines={lines}
        xTicks={[{ x: 1, label: "Jan" }, { x: 14, label: "Apr" }, { x: 27, label: "Jul" }, { x: 40, label: "Oct" }, { x: 52, label: "Dec" }]}
        yFormat={(v) => `${Math.round(v / 1000)}k`}
        ariaLabel={`Deaths registered each week in England and Wales, ${thisYear}${lastYear ? ` compared with ${lastYear}` : ""}. ${sentence}`}
        accent={accent}
      />
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "12px 0 0" }}>
        The number of deaths registered in each week, from all causes, in England and Wales. These are registrations, not the dates people died, so weeks with a bank holiday
        look lower and the week after looks higher. The first and last weeks of a year are partial.
      </p>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 10 }}>
        Source: ONS weekly deaths by region (dataset: weekly-deaths-region){data.updated ? `, released ${new Date(data.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
      </div>
    </section>
  );
}

export default function SectorPage({ sector }) {
  const def = sectorByKey(sector);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [range, setRange] = useState(def?.key === "population" ? 0 : 5);

  useEffect(() => {
    let alive = true;
    const load = FILES[`../data/ons/${sector}.json`];
    if (!load) {
      Promise.resolve().then(() => alive && setFailed(true));
      return undefined;
    }
    load().then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [sector]);

  const Icon = ICONS[sector];
  const shown = useMemo(() => (def && data ? def.series.filter((s) => data.series[s.id]) : []), [def, data]);
  if (!def) return null;
  const tiles = shown.filter((s) => s.headline);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={Icon} title={def.title} subtitle={def.subtitle} maxWidth={760} />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="these figures" /></div>}
      {!data && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))", gap: 14, marginTop: 26 }}>
            {tiles.map((s) => <Tile key={s.id} def={s} series={data.series[s.id]} accent={def.accent} />)}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, margin: "28px 0 14px" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Show</span>
            <div role="radiogroup" aria-label="How far back to show" style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
              {RANGES.map((r) => {
                const on = range === r.years;
                return (
                  <button
                    key={r.years}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setRange(r.years)}
                    style={{
                      fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: on ? 700 : 500, padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, background: on ? COLORS.ink : "transparent", color: on ? COLORS.paper : COLORS.inkSoft,
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
            {data.weeklyDeaths && <WeeklyDeaths data={data.weeklyDeaths} accent={def.accent} />}
            {shown.map((s) => <SeriesCard key={s.id} def={s} series={data.series[s.id]} range={range} accent={def.accent} />)}
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 28, maxWidth: 760 }}>
            All figures are from the Office for National Statistics (ONS), published under the Open Government Licence v3.0. This site is independent and is not part of the ONS.
            Official statistics are revised as more information arrives, so recent figures can change. We refresh them every day, and they only change when the ONS publishes.
          </p>
        </>
      )}
    </div>
  );
}
