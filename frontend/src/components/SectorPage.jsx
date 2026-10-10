import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric, readable, solid } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import LineChart from "./LineChart";
import PlacesChart from "./PlacesChart";
import BreakdownCard from "./BreakdownCard";
import MortgageCard from "./MortgageCard";
import PromisesCard from "./PromisesCard";
import { KEY_POINTS } from "../data/onsKeyPoints";
import { fillKeyPoint } from "../lib/onsKeyPoints";
import { SECTOR_PROMISES } from "../data/onsPromises";
import ChartActions from "./ChartActions";
import PopulationExplorer from "./PopulationExplorer";
import SectorExplorer from "./SectorExplorer";
import CrimePeople from "./CrimePeople";
import SectorContents from "./SectorContents";
import { scrollToCard } from "../lib/scrollToCard";
import { sectorByKey, sectorSeries, ONS_SERIES_PAGE, WEEKLY_DEATHS } from "../data/onsSectors";
import { loadSector, loadDeflator } from "../lib/onsData";
import { makeDeflator, toReal, canAdjust } from "../lib/onsReal";
import { buildShareParam, parseShareParam, shareUrl } from "../lib/shareLink";
import { sectorShareSpec } from "../lib/shareSpecs";
import { seriesCsv } from "../lib/onsDownload";
import { PARLIAMENT_LINKS } from "../data/onsParliament";
import { periodToT, formatValue, formatAxis, latestInfo, changeWords, changeShort, sentenceFor, sliceRange, labelFor } from "../lib/onsFormat";
import { compareStats } from "../lib/onsStats";
import { toLineData, yearTicks } from "../lib/onsChart";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { DEEP_DIVES } from "../data/onsDeepDives";
import { card, cardTitle, smallTitle, pillStyle, dateText } from "../lib/onsStyles";
import { IconTrend, IconBasket, IconBriefcase, IconLedger, IconPopulation, IconHeartbeat, IconHouse, IconGlobe, IconLeaf, IconShield, IconTaxes, IconRates, IconMigration, IconFactory } from "./icons";

// One page per sector, all built from the same pieces: a short story with a
// spotlight figure, the headline numbers, then a card for every measure with its
// history, how today compares with the past, what it measures and why it matters.
// The numbers come from the Office for National Statistics (and, for house prices
// and crime, the bodies named on each card), saved daily by fetch-ons.js.

const ICONS = { economy: IconTrend, prices: IconBasket, jobs: IconBriefcase, publicFinances: IconLedger, population: IconPopulation, health: IconHeartbeat, housing: IconHouse, crime: IconShield, trade: IconGlobe, environment: IconLeaf, tax: IconTaxes, rates: IconRates, immigration: IconMigration, business: IconFactory };
const RANGES = [{ years: 2, label: "2 years" }, { years: 5, label: "5 years" }, { years: 10, label: "10 years" }, { years: 25, label: "25 years" }, { years: 0, label: "Everything" }];
// Pages with a bigger interactive card of their own, before the series cards.
const EXPLORERS = {
  population: { id: "who-lives-where", label: "Who lives where" },
  jobs: { id: "who-works-where", label: "Who works where" },
  housing: { id: "housing-by-place", label: "Homes by type and place" },
  crime: { id: "crime-by-place", label: "Crime by place" },
};
// Extra cards on a page that are not charts of a series, in jump-bar order after the explorer.
const EXTRA = { crime: [{ id: "crime-who", label: "Crime by ethnic group, age, sex and income" }] };
// How many headline tiles to put in a row on a wide screen, so the last row is never a lone box: up to four in one row, then threes or fours.
const tileColumns = (n) => (n <= 4 ? Math.max(1, n) : n === 5 || n === 6 ? 3 : 4);
const WHOLE_HISTORY = new Set(["population", "environment", "crime"]);
const NOW = new Date().getFullYear() + 1;

// A small line with a soft fill under it. Drawn once and left alone: it does not animate while the page scrolls.
function Spark({ points, color, height = 44 }) {
  const id = useId().replace(/:/g, "");
  const pts = points.slice(-48);
  if (pts.length < 2) return null;
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x = (i) => (i / (pts.length - 1)) * 200;
  const y = (v) => height - 5 - ((v - lo) / (hi - lo || 1)) * (height - 12);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 200 ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", overflow: "hidden" }}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L200 ${height} L0 ${height} Z`} fill={`url(#g${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ChangeChip({ change, accent }) {
  if (!change) return null;
  const flat = Math.abs(change.amount) < 0.05;
  const up = change.amount > 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, background: `${accent}1f`, borderRadius: 999, padding: "4px 10px" }}>
      <span aria-hidden="true" style={{ color: readable(accent), fontSize: 10 }}>{flat ? "●" : up ? "▲" : "▼"}</span>
      <span>{changeWords(change)}</span>
    </span>
  );
}

// A headline figure. A plain link: it does not fade, count up or move, so nothing shifts as the page scrolls.
const Tile = memo(function Tile({ def, item, accent }) {
  const info = latestInfo(def, item.points);
  if (!info) return null;
  return (
    <a
      className="ons-tile"
      href={`#s-${def.id}`}
      onClick={(e) => { e.preventDefault(); document.getElementById(`s-${def.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
      style={{
        ...card, padding: "20px 22px 0", position: "relative", overflow: "hidden", textDecoration: "none", display: "flex", flexDirection: "column", color: "inherit",
        background: `linear-gradient(180deg, ${accent}14, ${COLORS.paperCard} 55%)`, borderColor: `${accent}40`,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3 }}>{def.label}</div>
      <div className="tile-num" style={{ ...numeric, fontSize: 42, fontWeight: 600, lineHeight: 1.1, color: COLORS.ink, marginTop: 10, letterSpacing: "-0.02em" }}>{formatValue(def.format, info.value)}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "2px 0 10px" }}>{info.label}</div>
      <div><ChangeChip change={info.change} accent={accent} /></div>
      <div style={{ margin: "14px -22px 0" }}><Spark points={item.points} color={accent} /></div>
    </a>
  );
});

// How today compares with the past, as one tidy strip.
function Strip({ def, points, accent }) {
  const st = compareStats(def, points);
  if (!st) return null;
  const cells = [];
  // Four boxes, so they fill one row on a wide card and sit two by two on a phone: "five years ago" is only shown when there is no "ten years ago".
  for (const [key, name] of [["yearAgo", "A year ago"], [st.tenAgo ? "tenAgo" : "fiveAgo", st.tenAgo ? "Ten years ago" : "Five years ago"]]) {
    const c = st[key];
    if (c) cells.push({ name, when: c.label, value: formatValue(def.format, c.value), note: changeShort(c.change) });
  }
  cells.push({ name: "Highest", when: st.high.isNow ? "That is now" : st.high.label, value: formatValue(def.format, st.high.value) });
  cells.push({ name: "Lowest", when: st.low.isNow ? "That is now" : st.low.label, value: formatValue(def.format, st.low.value) });
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 14, overflow: "hidden", background: COLORS.paper }}>
       <div className="box-row" style={{ "--n": cells.length, "--min": "110px", "--gap": "0px", margin: "0 -1px -1px 0" }}>
        {cells.map((c) => (
          <div key={c.name} style={{ padding: "11px 14px", borderRight: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft }}>{c.name}</div>
            <div style={{ ...numeric, fontSize: 19, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{c.value}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 1 }}>{c.when}</div>
            {c.note && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: readable(accent), marginTop: 1 }}>{c.note}</div>}
          </div>
        ))}
       </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div aria-hidden="true" style={{ flex: "1 1 160px", maxWidth: 260, height: 8, borderRadius: 4, background: COLORS.hairline, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, width: `${st.higherThanShare}%`, borderRadius: 4, background: `linear-gradient(90deg, ${accent}55, ${accent})` }} />
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
          {st.higherThanShare === 0
            ? `The lowest of the ${st.count.toLocaleString("en-GB")} readings since ${st.since}`
            : st.higherThanShare >= 100
              ? `The highest of the ${st.count.toLocaleString("en-GB")} readings since ${st.since}`
              : `Higher than ${st.higherThanShare}% of the ${st.count.toLocaleString("en-GB")} readings since ${st.since}`}
        </span>
      </div>
    </div>
  );
}

function Explain({ explain, why, accent }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14, marginTop: 20 }}>
      <div style={{ borderLeft: `4px solid ${accent}`, background: `${accent}12`, borderRadius: "4px 14px 14px 4px", padding: "12px 16px" }}>
        <h3 style={smallTitle}>Why it matters</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.ink, margin: 0 }}>{why}</p>
      </div>
      <div style={{ padding: "12px 4px" }}>
        <h3 style={smallTitle}>What it measures</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>{explain}</p>
      </div>
    </div>
  );
}


// The longer explanation behind each measure: how it is worked out, what moves it,
// and what people try to change to move it. Folded away so the card stays short.
function DeepDive({ id, accent }) {
  const dive = DEEP_DIVES[id];
  if (!dive) return null;
  const blocks = [
    ["How it is measured", dive.how],
    ["What causes it to change", dive.causes],
    ["What is usually changed to move it", dive.levers],
  ];
  return (
    <details className="ons-dive" style={{ marginTop: 16, border: `1px solid ${accent}55`, borderRadius: 16, background: `${accent}0d`, overflow: "hidden" }}>
      <summary className="ons-tap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer", padding: "13px 18px", fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, listStyle: "none" }}>
        <span>How it is measured, what drives it and what changes it</span>
        <span aria-hidden="true" className="ons-dive-chevron" style={{ color: readable(accent), fontSize: 13, flexShrink: 0, transition: "transform 0.2s" }}>▼</span>
      </summary>
      <div style={{ padding: "2px 18px 18px", display: "grid", gap: 16 }}>
        {blocks.map(([title, text], i) => (
          <div key={title} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 10, alignItems: "start" }}>
            <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: solid(accent), color: "#fff", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, display: "grid", placeItems: "center" }}>{i + 1}</span>
            <div style={{ minWidth: 0 }}>
              <h3 style={smallTitle}>{title}</h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>{text}</p>
            </div>
          </div>
        ))}
        <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: 0, paddingTop: 12, borderTop: `1px solid ${COLORS.hairline}` }}>
          This lists the tools that are commonly used, not a view on which are best. Economists and politicians disagree about that, and most tools have trade-offs.
        </p>
      </div>
    </details>
  );
}

const unitOf = (format) => ({ pct: "%", gbp: "£", gbpbn: "£ billion", gbpbn0: "£ billion", gbpbnx: "£ billion", thousands: "thousands", people: "people", count: "count", index: "index", ktonnes: "thousand tonnes", mtoe: "million tonnes of oil equivalent", hours: "hours" }[format] ?? "");

function SourceLine({ def, item }) {
  const link = def.source?.url ?? (def.cdid ? ONS_SERIES_PAGE(def) : null);
  const name = def.source?.name ?? (def.derive ? "Worked out from ONS figures" : `ONS series ${def.cdid} (${def.dataset?.toUpperCase()})`);
  return (
    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
      Source: {name}{item.updated ? `, released ${dateText(item.updated)}` : ""}.{" "}
      {link && <a className="ons-tap ons-inline" href={link} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, textDecoration: "underline" }}>See the source</a>}
    </div>
  );
}

const TOGGLE = "Remove inflation (real terms)";

// What the chart shows once inflation is taken out, and what it shows as published.
function adjustedNote(def, deflator) {
  if (def.realMode === "rate") return "These are real rates: the rate minus inflation.";
  if (def.realMode === "relative") return "These show how much faster or slower this rose than prices in general.";
  return `These figures are in ${deflator.label} prices.`;
}
function adjustedCaption(def) {
  if (def.realMode === "rate") return `Real rate: the interest rate minus the yearly rise in the Consumer Prices Index (inflation). Below zero means prices are rising faster than the rate, so borrowers gain and savers lose. It starts in 1989, when the index allows. Switch "${TOGGLE}" off to see the rate as published.`;
  if (def.realMode === "relative") return `Relative to prices in general: the price rise shown minus overall inflation. Above zero means this rose faster than the average price, below zero slower. Switch "${TOGGLE}" off to see the price rise as published.`;
  return `Adjusted for inflation with the Consumer Prices Index, which starts in 1988, so earlier years are left out. Switch "${TOGGLE}" off to see the amounts as they were published.`;
}
function unadjustedCaption(def) {
  if (def.realMode === "rate") return `Shown as published. Switch on "${TOGGLE}" above to see the real rate, which takes inflation out.`;
  if (def.realMode === "relative") return `Shown as published, so it includes general inflation. Switch on "${TOGGLE}" above to see it relative to prices in general.`;
  return `These amounts are not adjusted for inflation, so figures from many years ago look smaller than they were worth. Switch on "${TOGGLE}" above to compare like with like.`;
}

const SeriesCard = memo(function SeriesCard({ def, item, range, accent, showGovernments, sectorKey, real, deflator }) {
  // With inflation taken out, a money series is re-priced (and starts when the price index does),
  // an interest rate becomes a real rate, and a price rise is shown relative to prices in general.
  const adjustable = canAdjust(def);
  const adjusted = real && adjustable && deflator;
  const points = useMemo(() => (adjusted ? toReal(item.points, deflator, def) : item.points), [adjusted, item.points, deflator, def]);
  const data = useMemo(() => toLineData(sliceRange(points, range)), [points, range]);
  const info = latestInfo(def, points);
  const sentence = sentenceFor(def, points);
  const recent = points.slice(-12).reverse();
  const bands = useMemo(
    () => (showGovernments && data.length ? bandsBetween(data[0].x, data.at(-1).x + 0.05, NOW).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })) : []),
    [showGovernments, data],
  );
  const sourceName = def.source?.name ?? (def.derive ? "Worked out from ONS figures" : `Office for National Statistics, series ${def.cdid}`);
  const getInfo = () => ({
    url: shareUrl(sectorKey, buildShareParam({ target: def.id, range, real: Boolean(adjusted), governments: showGovernments })),
    title: def.label,
    sentence: `${sentence ?? ""}${adjusted ? ` ${adjustedNote(def, deflator)}` : ""}`.trim(),
    source: sourceName,
    accent,
    filename: `${sectorKey}-${def.id}.png`,
    csv: {
      filename: `${sectorKey}-${def.id}.csv`,
      text: seriesCsv({
        title: def.label, source: sourceName, unit: unitOf(def.format), points: item.points,
        adjusted: adjusted ? (() => { const byPeriod = new Map(points); return item.points.map(([p]) => [p, byPeriod.get(p) ?? ""]); })() : null,
      }),
    },
  });
  return (
    <motion.section
      className="ons-anchor"
      id={`s-${def.id}`}
      aria-labelledby={`h-${def.id}`}
      style={{ ...card, position: "relative", overflow: "hidden" }}
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "10px 20px" }}>
        <h2 id={`h-${def.id}`} style={{ ...cardTitle, flex: "1 1 240px" }}>{def.label}</h2>
        {info && (
          <div className="ons-cardvalue">
            <div style={{ ...numeric, fontSize: 30, fontWeight: 600, lineHeight: 1.1, color: COLORS.ink, letterSpacing: "-0.02em" }}>{formatValue(def.format, info.value)}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{info.label}</div>
          </div>
        )}
      </div>
      {sentence && <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 18px" }}>{sentence}{adjusted ? ` ${adjustedNote(def, deflator)}` : ""}</p>}
      {data.length > 1 ? (
        <LineChart
          key={`${range}-${showGovernments}`}
          lines={[{ name: def.label, points: data }]}
          xTicks={yearTicks(data[0].x, data.at(-1).x)}
          yFormat={(v) => formatAxis(def.format, v)}
          ariaLabel={`${def.label}: line chart. ${sentence}`}
          accent={accent}
          bands={bands}
          refLines={adjusted ? undefined : def.targets}
          animateIn
        />
      ) : (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Not enough data for this period.</p>
      )}
      <Strip def={def} points={points} accent={accent} />
      {adjustable && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.5, color: COLORS.inkSoft, margin: "10px 0 0" }}>
          {adjusted ? adjustedCaption(def) : unadjustedCaption(def)}
        </p>
      )}
      <Explain explain={def.explain} why={def.why} accent={accent} />
      <DeepDive id={def.id} accent={accent} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", alignItems: "center", marginTop: 16 }}>
        <a className="ons-tap" href={`#/indicators/${sectorKey}.${def.id}`} style={{ ...pillStyle(false), textDecoration: "none", color: COLORS.ink, borderColor: `${accent}88` }}>Compare over time</a>
        <ChartActions cardId={`s-${def.id}`} getInfo={getInfo} />
      </div>
      <details style={{ marginTop: 8 }}>
        <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Show the latest figures as a table</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6, fontFamily: FONT_BODY, fontSize: 13 }}>
          <tbody>
            {recent.map(([p, v]) => (
              <tr key={p} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                <td style={{ padding: "6px 0", color: COLORS.inkSoft }}>{labelFor(def, p)}</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: COLORS.ink, fontWeight: 600 }}>{formatValue(def.format, v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <SourceLine def={def} item={item} />
    </motion.section>
  );
});

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
  const lines = [{ name: thisYear, color: readable(accent), points: now, format: (v) => v.toLocaleString("en-GB") }];
  if (before.length) lines.push({ name: lastYear, color: COLORS.inkSoft, points: before, format: (v) => v.toLocaleString("en-GB") });
  return (
    <motion.section
      className="ons-anchor"
      aria-labelledby="h-weekly-deaths" style={{ ...card, position: "relative", overflow: "hidden" }} id="s-weekly-deaths"
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-weekly-deaths" style={cardTitle}>Deaths registered each week</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 18px" }}>{sentence}</p>
      <LineChart
        lines={lines}
        xTicks={[{ x: 1, label: "Jan" }, { x: 14, label: "Apr" }, { x: 27, label: "Jul" }, { x: 40, label: "Oct" }, { x: 52, label: "Dec" }]}
        domainX={[1, 52]}
        yFormat={(v) => `${Math.round(v / 1000)}k`}
        ariaLabel={`Deaths registered each week in England and Wales, ${thisYear}${lastYear ? ` compared with ${lastYear}` : ""}. ${sentence}`}
        accent={accent}
        animateIn
      />
      <Explain
        accent={accent}
        why="Comparing with the same week last year shows quickly whether something unusual is happening, such as a harsh winter flu season, a heatwave or a pandemic wave."
        explain="The number of deaths registered in each week, from all causes, in England and Wales. These are registrations, not the dates people died, so weeks with a bank holiday look lower and the week after looks higher."
      />
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 12 }}>
        Source: ONS weekly deaths by region (dataset: {WEEKLY_DEATHS.dataset}){data.updated ? `, released ${dateText(data.updated)}` : ""}. The first and last weeks of a year are partial.
      </div>
    </motion.section>
  );
}

function Toggle({ on, onChange, children, disabled = false, hint }) {
  return (
    <button
      className="ons-tap"
      role="switch"
      aria-checked={on && !disabled}
      aria-disabled={disabled || undefined}
      title={disabled ? hint : undefined}
      onClick={() => { if (!disabled) onChange(!on); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, padding: "6px 0", font: "inherit" }}
    >
      <span aria-hidden="true" style={{ width: 40, height: 23, borderRadius: 12, background: on ? COLORS.ink : COLORS.hairline, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 20 : 3, width: 17, height: 17, borderRadius: 9, background: on ? COLORS.paper : COLORS.inkSoft, transition: "left 0.2s" }} />
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{children}</span>
    </button>
  );
}

// The first headline figure, big, beside the story.
function Spotlight({ def, item, accent }) {
  const info = latestInfo(def, item.points);
  if (!info) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: readable(accent), marginBottom: 4 }}>{def.label}</div>
      <div style={{ ...numeric, fontSize: "clamp(46px, 7vw, 68px)", fontWeight: 600, lineHeight: 1.05, color: COLORS.ink, letterSpacing: "-0.03em" }}>
        {formatValue(def.format, info.value)}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "4px 0 10px" }}>{info.label}</div>
      <ChangeChip change={info.change} accent={accent} />
      <div style={{ marginTop: 14 }}><Spark points={item.points} color={accent} height={58} /></div>
    </div>
  );
}

// The three or four things to take away, in plain English, filled in from the latest figures.
function KeyPoints({ sector, series, accent, skip }) {
  const all = KEY_POINTS[sector] ?? [];
  // The big figure at the top already says the first one, so leave it out when there are enough others.
  const list = all.length > 3 ? all.filter((k) => k.series !== skip) : all;
  const points = list
    .map((k) => {
      const item = series[k.series];
      const parts = item ? fillKeyPoint(k.text, item.def, item.points) : null;
      return parts ? { id: k.series, parts } : null;
    })
    .filter(Boolean);
  if (!points.length) return null;
  const jump = (id) => document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <section aria-labelledby="h-key-points" style={{ ...card, marginTop: 18, position: "relative", overflow: "hidden" }}>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-key-points" style={cardTitle}>The key points</h2>
      <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 12 }}>
        {points.map((p, i) => (
          <li key={p.id} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, alignItems: "start" }}>
            <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: solid(accent), color: "#fff", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, display: "grid", placeItems: "center", marginTop: 1 }}>{i + 1}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.ink, margin: 0 }}>
                {p.parts.map((part, j) => (part.strong ? <strong key={j} style={{ fontWeight: 800 }}>{part.text}</strong> : <span key={j}>{part.text}</span>))}
              </p>
              <button type="button" className="ons-linkbtn" onClick={() => jump(p.id)} style={{ color: COLORS.inkSoft }}>See the chart</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Where these figures meet Parliament: who is asking ministers about the topic, how MPs
// have voted on bills in the area, and related pages on this site.
function InParliament({ sector, accent }) {
  const links = PARLIAMENT_LINKS[sector];
  if (!links) return null;
  const chip = { fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, textDecoration: "none", padding: "8px 14px", borderRadius: 999, border: `1px solid ${accent}77`, background: `${accent}12` };
  return (
    <section aria-labelledby="h-in-parliament" style={{ ...card, marginTop: 28, position: "relative", overflow: "hidden" }}>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-in-parliament" style={cardTitle}>Where this reaches Parliament</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "10px 0 18px", maxWidth: 720 }}>
        Numbers like these are what MPs argue about. See who is asking ministers about them, how MPs have voted, and what the parties promise.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 22 }}>
        <div>
          <h3 style={smallTitle}>MPs and peers asking ministers about…</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {links.topics.map((t) => <a key={t} className="ons-tap" href={`#/topics/${encodeURIComponent(t)}`} style={chip}>{t}</a>)}
          </div>
        </div>
        <div>
          <h3 style={smallTitle}>How MPs voted</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            <a className="ons-tap" href={`#/voting/${encodeURIComponent(links.billCategory)}`} style={chip}>Bills on {links.billCategory.toLowerCase()}</a>
          </div>
        </div>
        <div>
          <h3 style={smallTitle}>More on this site</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {links.pages.map((p) => <a key={p.key} className="ons-tap" href={`#/${p.key}`} style={chip}>{p.label}</a>)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SectorPage({ sector, param = null }) {
  const def = sectorByKey(sector);
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(null);
  const [failed, setFailed] = useState(false);
  // A shared link can open the page at one chart with its range and settings.
  const share = useMemo(() => parseShareParam(param), [param]);
  const [range, setRange] = useState(share?.range ?? (WHOLE_HISTORY.has(sector) ? 0 : 10));
  const [showGovernments, setShowGovernments] = useState(share?.governments ?? false);
  const [real, setReal] = useState(share?.real ?? false);
  const [deflatorData, setDeflatorData] = useState(null);
  // The one chart shown when "show one chart at a time" is on (null: every chart).
  const [focusId, setFocusId] = useState(null);
  const hasMoney = Boolean(def && sectorSeries(def).some(canAdjust));

  useEffect(() => {
    let alive = true;
    loadSector(sector).then((r) => alive && setLoaded(r)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [sector]);

  useEffect(() => {
    if (!hasMoney) return undefined;
    let alive = true;
    loadDeflator().then((d) => alive && setDeflatorData(d)).catch(() => {});
    return () => { alive = false; };
  }, [hasMoney]);
  const deflator = useMemo(() => (deflatorData ? makeDeflator(deflatorData.points) : null), [deflatorData]);

  // Scroll to the chart a shared link points at, once the page has its figures.
  const focused = useRef(false);
  const target = share?.target ?? null;
  useEffect(() => {
    if (!loaded || !target || focused.current) return undefined;
    const timer = setTimeout(() => {
      const el = document.getElementById(`s-${target}`);
      if (!el) return;
      focused.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ons-flash");
      setTimeout(() => el.classList.remove("ons-flash"), 2600);
    }, 700);
    return () => clearTimeout(timer);
  }, [loaded, target]);

  const Icon = ICONS[sector];
  const shown = useMemo(() => (def && loaded ? def.series.filter((s) => loaded.series[s.id]) : []), [def, loaded]);
  const extraCards = useMemo(() => (def ? [...(EXPLORERS[def.key] ? [EXPLORERS[def.key]] : []), ...(EXTRA[def.key] ?? []), ...def.breakdowns.map((x) => ({ id: x.id, label: x.title })), ...(def.mortgage ? [{ id: "mortgage-cost", label: "What a mortgage costs" }] : []), ...def.places.map((g) => ({ id: g.id, label: g.title }))] : []), [def]);
  const hasPromises = Boolean(def && SECTOR_PROMISES[def.key]);
  if (!def) return null;
  const contents = [
    { title: "Compare and explore", items: extraCards },
    { title: "Every measure", items: shown.map((s) => ({ id: s.id, label: s.label })) },
    ...(hasPromises ? [{ title: "Policy", items: [{ id: "promises", label: "What the government promised" }] }] : []),
  ];
  const tiles = shown.filter((s) => s.headline);
  const spotlight = tiles[0];
  const compareRefs = tiles.slice(0, 3).map((s) => `${def.key}.${s.id}`).join(",");
  const newest = shown.map((s) => loaded.series[s.id].updated).filter(Boolean).sort().at(-1);

  // The page's share card: the headline figures and the history of the first.
  const shareCard = () => {
    const tilesOut = tiles.slice(0, 4).map((s) => ({ s, info: latestInfo(s, loaded.series[s.id].points) })).filter((t) => t.info).map(({ s, info }) => ({ value: formatValue(s.format, info.value), label: s.label, when: info.label }));
    const pts = spotlight ? loaded.series[spotlight.id].points : [];
    const first = pts[0];
    const last = pts.at(-1);
    const line = pts.length > 1 ? { points: pts.map(([p, v]) => [periodToT(p), v]), label: spotlight.label, firstLabel: labelFor(spotlight, first[0]), lastLabel: labelFor(spotlight, last[0]), lastText: formatValue(spotlight.format, last[1]) } : null;
    return sectorShareSpec({ title: def.title, subtitle: def.subtitle, accent: def.accent, tiles: tilesOut, line, newest: newest ? dateText(newest) : null, link: window.location.href });
  };

  return (
    <div className="regions-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={Icon} title={def.title} subtitle={def.subtitle} share={loaded ? shareCard : undefined} />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="these figures" /></div>}
      {!loaded && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}

      {loaded && (
        <>
          <motion.div
            className="ons-noprint"
            initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{
              position: "relative", overflow: "hidden", borderRadius: 26, padding: "clamp(22px, 4vw, 36px)", marginTop: 26, border: `1px solid ${def.accent}55`,
              background: `radial-gradient(800px 320px at 100% -10%, ${def.accent}38, transparent 65%), radial-gradient(500px 260px at 0% 120%, ${def.accent}1f, transparent 65%), ${COLORS.paperCard}`,
              boxShadow: "0 30px 60px -36px rgba(0,0,0,0.6)",
            }}
          >
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${COLORS.hairline} 1px, transparent 1px)`, backgroundSize: "22px 22px", opacity: 0.5, maskImage: "linear-gradient(180deg, #000, transparent 80%)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent 80%)" }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: "28px 40px", alignItems: "center" }}>
              <div>
                <p style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(17px, 2.2vw, 21px)", fontWeight: 600, lineHeight: 1.5, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0 }}>{def.story}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", marginTop: 20, alignItems: "center" }}>
                  <a className="ons-tap" href={`#/indicators/${compareRefs}`} style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: "#fff", background: solid(def.accent), borderRadius: 12, padding: "11px 20px", textDecoration: "none", boxShadow: `0 12px 24px -12px ${def.accent}` }}>
                    Watch these change over time
                  </a>
                  {newest && <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Latest ONS release: {dateText(newest)}</span>}
                </div>
              </div>
              {spotlight && <Spotlight def={spotlight} item={loaded.series[spotlight.id]} accent={def.accent} />}
            </div>
          </motion.div>

          <KeyPoints sector={def.key} series={loaded.series} accent={def.accent} skip={spotlight?.id} />

          <SectorContents groups={contents} focusId={focusId} onFocus={setFocusId} accent={def.accent} />

          <div className="ons-noprint box-row" style={{ "--n": tileColumns(tiles.length - 1), "--min": "150px", "--gap": "16px", marginTop: 18 }}>
            {tiles.slice(1).map((s) => <Tile key={s.id} def={s} item={loaded.series[s.id]} accent={def.accent} />)}
          </div>

          <div className="ons-toolbar" style={{ margin: "32px 0 14px", padding: "12px 0" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px 24px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Show</span>
                <div role="radiogroup" aria-label="How far back to show" style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
                  {RANGES.map((r) => (
                    <button key={r.years} className="ons-tap" role="radio" aria-checked={range === r.years} onClick={() => setRange(r.years)} style={pillStyle(range === r.years)}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0 22px" }}>
                <Toggle on={real} onChange={setReal} disabled={!hasMoney} hint="Nothing on this page is a money amount, a price rise or an interest rate, so there is no inflation to take out.">{TOGGLE}</Toggle>
                <Toggle on={showGovernments} onChange={setShowGovernments}>Show who was in government</Toggle>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px", marginTop: 10 }}>
              <label htmlFor="ons-jump-select" style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{focusId ? "Showing" : "Jump to"}</label>
              <select
                id="ons-jump-select" className="ons-chip" value={focusId ?? ""} onChange={(e) => { const v = e.target.value; if (focusId !== null) setFocusId(v || null); else if (v) scrollToCard(v); }}
                style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, padding: "7px 10px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, maxWidth: "100%", minWidth: 0, flex: "1 1 220px" }}
              >
                {focusId === null && <option value="">A chart or tool on this page…</option>}
                {contents.flatMap((g) => g.items).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
              {focusId !== null && <button type="button" className="ons-tap" onClick={() => setFocusId(null)} style={{ ...pillStyle(false), fontSize: 13 }}>Show every chart</button>}
            </div>
          </div>
          {showGovernments && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 12px", maxWidth: 780 }}>
              The shading shows which prime minister was in office, blue for Conservative and red for Labour. It shows when something changed, not why. Most of what these charts measure is shaped by world events and by decisions made long before.
            </p>
          )}

          {focusId !== null && (
            <style>{focusId === "promises" ? ".ons-cards { display: none !important; }" : `.ons-cards > :not(#s-${focusId}) { display: none !important; }`}</style>
          )}
          <div className="ons-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(480px, 100%), 1fr))", gap: 20, alignItems: "start", marginTop: 8 }}>
            {def.key === "population" && <PopulationExplorer accent={def.accent} />}
            {def.key !== "population" && EXPLORERS[def.key] && <SectorExplorer sector={def.key} accent={def.accent} />}
            {def.key === "crime" && <CrimePeople accent={def.accent} />}
            {def.breakdowns.map((x) => <BreakdownCard key={x.id} spec={x} series={loaded.series} accent={def.accent} />)}
            {def.mortgage && loaded.series[def.mortgage] && <MortgageCard points={loaded.series[def.mortgage].points} accent={def.accent} />}
            {def.places.map((g) => (
              <PlacesChart
                key={g.id} group={g} sector={def.key} series={loaded.series} range={range} real={real} deflator={deflator}
                showGovernments={showGovernments} accent={def.accent} initial={share?.target === g.id ? share : null}
              />
            ))}
            {loaded.data.weeklyDeaths && <WeeklyDeaths data={loaded.data.weeklyDeaths} accent={def.accent} />}
            {shown.map((s) => (
              <SeriesCard key={s.id} def={s} item={loaded.series[s.id]} range={range} accent={def.accent} showGovernments={showGovernments} sectorKey={def.key} real={real} deflator={deflator} />
            ))}
          </div>

          {(focusId === null || focusId === "promises") && <PromisesCard sector={def.key} series={loaded.series} accent={def.accent} />}
          {focusId === null && <InParliament sector={def.key} accent={def.accent} />}

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 32, maxWidth: 780 }}>
            Most figures are from the Office for National Statistics (ONS), published under the Open Government Licence v3.0. House prices come from the UK House Price Index (HM Land Registry with the ONS and others), police recorded crime from the Home Office, and interest rates, mortgage approvals and exchange rates from the Bank of England.
            This site is independent and is not part of any of these bodies. Official statistics are revised as more information arrives, so recent figures can change. We refresh them every day, and they only change when the publishers release them.
          </p>
        </>
      )}
    </div>
  );
}
