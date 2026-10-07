import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import RegionMap from "./RegionMap";
import { IconMap } from "./icons";
import geo from "../data/regionMap.json";
import { REGIONS, METRICS, metricById } from "../data/regionMetrics";
import { loadSector, loadDeflator } from "../lib/onsData";
import { makeDeflator, toReal, canAdjust } from "../lib/onsReal";
import { formatValue, formatAxis, changeBetween, changeShort } from "../lib/onsFormat";
import { monthlyTimeline, valuesOver, ranked, ordinal, domainOf, fraction, tLabel, rampColour, bandsOf, valueAtPosition } from "../lib/regionData";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Regions and nations: an interactive, animated map with a league table beside it. Pick a measure,
// press play (at a speed you choose) or drag the date, and watch the colours, the key and the table change.

const TOGGLE = "Remove inflation (real terms)";
// How fast time runs: months of data per second.
const SPEEDS = [
  { id: "slow", label: "Slow", perSecond: 3, note: "3 months a second" },
  { id: "normal", label: "Normal", perSecond: 6, note: "6 months a second" },
  { id: "fast", label: "Fast", perSecond: 12, note: "1 year a second" },
  { id: "faster", label: "Faster", perSecond: 24, note: "2 years a second" },
];
const WINDOWS = [
  { id: "all", label: "The whole history", months: null },
  { id: "25", label: "The last 25 years", months: 300 },
  { id: "10", label: "The last 10 years", months: 120 },
  { id: "5", label: "The last 5 years", months: 60 },
  { id: "2", label: "The last 2 years", months: 24 },
];

function Switch({ on, onChange, disabled, hint, children }) {
  return (
    <button
      type="button" role="switch" className="ons-tap" aria-checked={on && !disabled} aria-disabled={disabled || undefined} title={disabled ? hint : undefined}
      onClick={() => { if (!disabled) onChange(!on); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: "6px 0", font: "inherit", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, textAlign: "left" }}
    >
      <span aria-hidden="true" style={{ width: 40, height: 23, borderRadius: 12, background: on && !disabled ? COLORS.ink : COLORS.hairline, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on && !disabled ? 20 : 3, width: 17, height: 17, borderRadius: 9, background: on && !disabled ? COLORS.paper : COLORS.inkSoft, transition: "left 0.2s" }} />
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{children}</span>
    </button>
  );
}

// One region's line over the timeline, with the UK as a dotted line and a dot at the date shown.
// Press or drag along it to move the date.
function Sparkline({ values, ukValues, position, from, color, onScrub, format }) {
  const W = 320;
  const H = 86;
  const slice = values.slice(from);
  const ukSlice = ukValues.slice(from);
  const all = [...slice, ...ukSlice].filter((v) => v !== null && v !== undefined);
  if (all.length < 2) return null;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const x = (i) => (i / Math.max(1, slice.length - 1)) * W;
  const y = (v) => H - 10 - ((v - lo) / (hi - lo || 1)) * (H - 22);
  const path = (list) => list.map((v, i) => (v === null || v === undefined ? null : `${i && list[i - 1] !== null ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)).filter(Boolean).join(" ");
  const here = valueAtPosition(values, position);
  const rel = position - from;
  const scrub = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    onScrub(from + Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (slice.length - 1)));
  };
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label={`Trend over time. Press or drag to move the date. Range ${formatAxis(format, lo)} to ${formatAxis(format, hi)}.`}
      style={{ display: "block", touchAction: "none", cursor: "ew-resize" }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrub(e); }}
      onPointerMove={(e) => { if (e.buttons) scrub(e); }}
    >
      <path d={path(ukSlice)} fill="none" stroke={COLORS.inkSoft} strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.8" />
      <path d={path(slice)} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={x(rel)} x2={x(rel)} y1="0" y2={H} stroke={COLORS.inkSoft} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.5" />
      {here !== null && <circle cx={x(rel)} cy={y(here)} r="5" fill={color} stroke={COLORS.paperCard} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

// "▲ 3.3%" or "▼ 0.4 pts": how a figure has moved, short enough to sit under it.
function arrowChange(change) {
  if (!change || change.type === "amount") return "";
  const a = Math.abs(change.amount);
  const n = a < 10 ? a.toFixed(change.type === "points" ? change.digits ?? 1 : 1) : Math.round(a).toString();
  if (Number(n) === 0) return "no change";
  return `${change.amount > 0 ? "▲" : "▼"} ${n}${change.type === "points" ? " pts" : "%"}`;
}

const chip = (accent) => ({ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, background: `${accent}1f`, borderRadius: 999, padding: "4px 11px" });

// The colour key: five steps from lowest to highest, with how many places are in each right now.
function ColourKey({ domain, accent, format, bands, uk, scaleMode }) {
  return (
    <div style={{ margin: "16px auto 0", maxWidth: 460 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 10 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink }}>Colour key</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, textAlign: "right" }}>{scaleMode === "fixed" ? "Same scale at every date" : "Reset at each date"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {bands.map((b, i) => (
          <div key={i} style={{ minWidth: 0 }}>
            <div aria-hidden="true" style={{ height: 14, borderRadius: i === 0 ? "7px 3px 3px 7px" : i === 4 ? "3px 7px 7px 3px" : 3, background: rampColour(accent, b.mid) }} />
            <div style={{ ...numeric, fontSize: 11, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.25, textAlign: "center", overflowWrap: "anywhere" }}>
              {i === 0 ? formatAxis(format, b.from) : ""}{i === 0 ? "+" : ""}
              {i > 0 ? `${formatAxis(format, b.from)}+` : ""}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.ink, textAlign: "center" }}>{b.count === 0 ? "·" : `${b.count} ${b.count === 1 ? "place" : "places"}`}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>
        <span>Lowest {formatValue(format, domain[0])}</span>
        {uk !== null && <span>UK {formatValue(format, uk)}</span>}
        <span>Highest {formatValue(format, domain[1])}</span>
      </div>
    </div>
  );
}

// Every place, highest first, with how it has moved over the past year.
function League({ rows, selected, hover, onHover, onSelect, accent, metric, dateLabel, reduce }) {
  return (
    <section aria-labelledby="h-league" style={card}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h2 id="h-league" style={cardTitle}>League table</h2>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: accent }}>{dateLabel}</span>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.5, color: COLORS.inkSoft, margin: "6px 0 12px" }}>
        Highest first, for {metric.noun}. The small figure under each value is the change over the past year, and the arrow by the rank is how many places the region has moved up or down in a year. Tap a row to choose it.
      </p>
      <LayoutGroup>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 3 }}>
          {rows.map((r) => (
            <motion.li key={r.key} layout={!reduce} transition={{ type: "spring", stiffness: 380, damping: 36 }} style={{ margin: 0 }}>
              <button
                type="button" className="ons-chip" aria-pressed={selected === r.key}
                onClick={() => onSelect(r.key)} onPointerEnter={(e) => { if (e.pointerType !== "touch") onHover(r.key); }} onPointerLeave={(e) => { if (e.pointerType !== "touch") onHover(null); }}
                onFocus={() => onHover(r.key)} onBlur={() => onHover(null)}
                style={{
                  display: "grid", gridTemplateColumns: "34px 14px minmax(0, 1fr) auto", gap: "0 10px", alignItems: "center", width: "100%", textAlign: "left", font: "inherit", cursor: "pointer",
                  background: selected === r.key ? `${accent}1c` : hover === r.key ? `${accent}12` : "none", border: `1.5px solid ${selected === r.key ? accent : "transparent"}`, borderRadius: 10, padding: "6px 9px",
                }}
              >
                <span style={{ ...numeric, fontSize: 13, color: COLORS.inkSoft, display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
                  {r.rank}
                  {r.moved !== 0 && <span style={{ fontSize: 10.5, fontWeight: 700, color: r.moved > 0 ? "#2F6F4E" : "#9C3B3B" }}>{r.moved > 0 ? "▲" : "▼"}{Math.abs(r.moved)}</span>}
                </span>
                <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 4, background: r.colour, boxShadow: `0 0 0 1px ${COLORS.hairline}` }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                <span style={{ textAlign: "right", lineHeight: 1.2 }}>
                  <span style={{ ...numeric, display: "block", fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{r.text}</span>
                  {r.change && <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: COLORS.inkSoft }}>{r.change}</span>}
                </span>
              </button>
            </motion.li>
          ))}
        </ol>
      </LayoutGroup>
    </section>
  );
}

function Detail({ region, metric, def, values, ukValues, valuesByKey, index, position, from, timeline, accent, onScrub }) {
  if (!region) return null;
  const v = values[index];
  const uk = ukValues[index];
  const order = ranked(Object.fromEntries(Object.entries(valuesByKey).map(([k, list]) => [k, list[index]])));
  const rank = order.find((o) => o.key === region.key)?.rank;
  const before = index >= 12 ? values[index - 12] : null;
  const change = v !== null && before !== null && before !== undefined ? changeBetween(def, before, v) : null;
  const diff = v !== null && uk !== null && uk !== undefined ? (def.kind === "rate" ? v - uk : ((v - uk) / uk) * 100) : null;
  const cmp = diff === null ? "" : Math.abs(diff) < 0.05 ? "about the same as the UK" : def.kind === "rate" ? `${Math.abs(diff).toFixed(1)} percentage points ${diff > 0 ? "above" : "below"} the UK` : `${Math.abs(diff).toFixed(0)}% ${diff > 0 ? "above" : "below"} the UK`;
  return (
    <section aria-label="Place detail" style={card}>
      <div aria-live="polite">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: accent }}>{tLabel(timeline[index])}</div>
        <h2 style={{ ...cardTitle, margin: "2px 0 6px" }}>{region.name}</h2>
        <div style={{ ...numeric, fontSize: 42, fontWeight: 600, lineHeight: 1.05, color: COLORS.ink, letterSpacing: "-0.02em" }}>{v === null ? "No figure" : formatValue(metric.format, v)}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "4px 0 12px" }}>{metric.noun}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {rank && <span style={chip(accent)}>{ordinal(rank)} highest of {order.length}</span>}
          {cmp && <span style={chip(accent)}>{cmp}</span>}
          {change && <span style={chip(accent)}>{changeShort(change)} on a year earlier</span>}
        </div>
      </div>
      <Sparkline values={values} ukValues={ukValues} position={position} from={from} color={accent} onScrub={onScrub} format={metric.format} />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2px 12px", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>
        <span>{tLabel(timeline[from])}</span>
        <span><span style={{ display: "inline-block", width: 16, borderTop: `2px solid ${accent}`, verticalAlign: "middle", marginRight: 5 }} />{region.short}<span style={{ display: "inline-block", width: 16, borderTop: `2px dotted ${COLORS.inkSoft}`, verticalAlign: "middle", margin: "0 5px 0 12px" }} />UK</span>
        <span>{tLabel(timeline.at(-1))}</span>
      </div>
      <a href={metric.link.href} className="ons-tap" style={{ display: "inline-flex", alignItems: "center", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, marginTop: 10 }}>{metric.link.label}</a>
    </section>
  );
}

export default function RegionsPage({ param }) {
  const reduce = useReducedMotion();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [metricId, setMetricId] = useState(() => metricById(param)?.id ?? "price");
  const [view, setView] = useState("map");
  const [position, setPosition] = useState(null); // months along the timeline, to a fraction; null: the latest date
  const [playing, setPlaying] = useState(false);
  const [speedId, setSpeedId] = useState("normal");
  const [windowId, setWindowId] = useState("all");
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [real, setReal] = useState(false);
  const [scaleMode, setScaleMode] = useState("fixed");

  useEffect(() => {
    let alive = true;
    Promise.all([loadSector("housing"), loadSector("jobs"), loadSector("regions"), loadDeflator().catch(() => null)])
      .then(([housing, jobs, regions, deflatorData]) => alive && setData({ sectors: { housing, jobs, regions }, deflator: deflatorData ? makeDeflator(deflatorData.points) : null }))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const metric = metricById(metricId);
  const accent = metric.accent;
  const speed = SPEEDS.find((s) => s.id === speedId);

  // This metric's points for every region and for the UK, with inflation taken out if asked.
  const series = useMemo(() => {
    if (!data) return null;
    const pick = (ref) => {
      const item = data.sectors[ref.sector]?.series[ref.id];
      if (!item) return null;
      const adjust = real && canAdjust(item.def) && data.deflator;
      return { def: item.def, points: adjust ? toReal(item.points, data.deflator, item.def) : item.points };
    };
    const m = metricById(metricId);
    return { byRegion: Object.fromEntries(REGIONS.map((r) => [r.key, pick(m.series[r.key])])), uk: pick(m.uk) };
  }, [data, metricId, real]);

  const timeline = useMemo(() => (series ? monthlyTimeline(REGIONS.map((r) => series.byRegion[r.key]?.points)) : []), [series]);
  const valuesByKey = useMemo(() => (series ? Object.fromEntries(REGIONS.map((r) => [r.key, valuesOver(series.byRegion[r.key]?.points ?? [], timeline)])) : {}), [series, timeline]);
  const ukValues = useMemo(() => (series?.uk ? valuesOver(series.uk.points, timeline) : timeline.map(() => null)), [series, timeline]);
  const last = Math.max(0, timeline.length - 1);
  const windowMonths = WINDOWS.find((w) => w.id === windowId).months;
  const from = windowMonths === null ? 0 : Math.max(0, last - windowMonths);
  const pos = Math.max(from, Math.min(position ?? last, last));
  const idx = Math.round(pos);

  // The figures at this date (whole months, for the words), and between months (for smooth colour).
  const atIdx = useMemo(() => Object.fromEntries(REGIONS.map((r) => [r.key, valuesByKey[r.key]?.[idx] ?? null])), [valuesByKey, idx]);
  const atPos = Object.fromEntries(REGIONS.map((r) => [r.key, valueAtPosition(valuesByKey[r.key], pos)]));
  const yearBack = useMemo(() => Object.fromEntries(REGIONS.map((r) => [r.key, idx >= 12 ? valuesByKey[r.key]?.[idx - 12] ?? null : null])), [valuesByKey, idx]);
  const windowDomain = useMemo(() => domainOf(Object.fromEntries(Object.entries(valuesByKey).map(([k, list]) => [k, list.slice(from)]))), [valuesByKey, from]);
  const domain = scaleMode === "fixed" ? windowDomain : domainOf(Object.fromEntries(Object.entries(atPos).map(([k, v]) => [k, [v]])));
  const def = series?.byRegion[REGIONS[0].key]?.def;
  const canReal = Boolean(def && canAdjust(def));

  // Playing: step through the months at the chosen speed, moving smoothly between them.
  useEffect(() => {
    if (!playing || timeline.length < 2) return undefined;
    let raf;
    let current = pos;
    let previous = performance.now();
    const perMs = speed.perSecond / 1000;
    const tick = (now) => {
      current += Math.min(100, now - previous) * perMs;
      previous = now;
      if (current >= timeline.length - 1) {
        setPosition(timeline.length - 1);
        setPlaying(false);
        return;
      }
      setPosition(current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // The loop reads the position it started from; later positions come from its own updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speedId, timeline.length]);

  if (failed) return <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}><LoadFailedNote item="the regional figures" /></div>;

  const valid = (v) => v !== null && v !== undefined;
  const colour = (key) => (valid(atPos[key]) ? rampColour(accent, fraction(atPos[key], domain)) : COLORS.hairline);
  const text = (key) => (valid(atIdx[key]) ? formatValue(metric.format, atIdx[key]) : "n/a");

  const order = ranked(atIdx);
  const orderBefore = ranked(yearBack);
  const league = order.map(({ key, rank }) => {
    const r = REGIONS.find((x) => x.key === key);
    const before = orderBefore.find((o) => o.key === key)?.rank ?? rank;
    const c = valid(yearBack[key]) ? changeBetween(def, yearBack[key], atIdx[key]) : null;
    return { key, rank, name: r.name, text: text(key), colour: colour(key), moved: before - rank, change: arrowChange(c), direction: c ? Math.sign(c.amount) : 0 };
  });
  const bands = bandsOf(atPos, domain, 5);
  const shown = hover ?? selected ?? order[0]?.key ?? "london";
  const shownRegion = REGIONS.find((r) => r.key === shown);
  const glance = order.length > 1
    ? { high: { name: league[0].name, value: atIdx[order[0].key] }, low: { name: league.at(-1).name, value: atIdx[order.at(-1).key] } }
    : null;

  const jump = (i) => { setPlaying(false); setPosition(Math.max(from, Math.min(last, i))); };
  function startPlay() {
    if (pos >= last - 0.5) setPosition(from);
    setPlaying(true);
  }
  function pickMetric(id) {
    setMetricId(id);
    setPosition(null);
    setPlaying(false);
  }
  function pickWindow(id) {
    setWindowId(id);
    setPlaying(false);
    const months = WINDOWS.find((w) => w.id === id).months;
    setPosition(months === null ? 0 : Math.max(0, last - months));
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconMap} title="Regions and nations" subtitle="How the 12 regions and nations of the UK compare. Pick a measure, then press play to watch it change, or tap a place to see it up close." maxWidth={780} />

      {!data && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}

      {data && series && timeline.length > 1 && (
        <>
          <div role="radiogroup" aria-label="What to show" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 14px" }}>
            {METRICS.map((m) => (
              <button
                key={m.id} type="button" role="radio" aria-checked={metricId === m.id} className="ons-chip" onClick={() => pickMetric(m.id)}
                style={{ ...pillStyle(metricId === m.id), background: metricId === m.id ? m.accent : "transparent", borderColor: metricId === m.id ? m.accent : COLORS.hairline, color: metricId === m.id ? "#fff" : COLORS.inkSoft }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 4px", maxWidth: 760 }}>{metric.blurb}</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 14px", maxWidth: 760 }}>{metric.why}</p>

          <ol aria-label="How to use this page" style={{ listStyle: "none", margin: "0 0 16px", padding: 0, display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
            {["Pick a measure above", "Press play, or drag the date", "Hover, tap or tab to a place, or use the league table"].map((step, i) => (
              <li key={step} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
                <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 11, background: accent, color: "#fff", fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          {glance && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 16px", maxWidth: 760 }} aria-live="polite">
              In {tLabel(timeline[idx])}, <strong>{glance.high.name}</strong> had the highest {metric.noun} ({formatValue(metric.format, glance.high.value)}) and <strong>{glance.low.name}</strong> the lowest ({formatValue(metric.format, glance.low.value)}).
            </p>
          )}

          <div className="regions-grid">
            <section aria-label="Map" style={{ ...card, background: `radial-gradient(520px 320px at 50% 0%, ${accent}1f, transparent 70%), ${COLORS.paperCard}`, minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 14px", marginBottom: 10 }}>
                <div role="radiogroup" aria-label="Map style" style={{ display: "inline-flex", gap: 6 }}>
                  <button type="button" role="radio" aria-checked={view === "map"} className="ons-chip" style={pillStyle(view === "map")} onClick={() => setView("map")}>Map</button>
                  <button type="button" role="radio" aria-checked={view === "tiles"} className="ons-chip" style={pillStyle(view === "tiles")} onClick={() => setView("tiles")}>Equal tiles</button>
                </div>
                <div style={{ ...numeric, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: COLORS.ink }} aria-hidden="true">{tLabel(timeline[idx])}</div>
              </div>

              <RegionMap
                regions={REGIONS} view={view} fill={colour} valueText={text} accent={accent} smooth={!playing}
                a11yLabel={(k) => `${REGIONS.find((r) => r.key === k).name}: ${text(k)}`}
                selected={selected} hover={hover} onHover={setHover} onSelect={(k) => setSelected((cur) => (cur === k ? null : k))}
              />

              <ColourKey domain={domain} accent={accent} format={metric.format} bands={bands} uk={valid(ukValues[idx]) ? ukValues[idx] : null} scaleMode={scaleMode} />

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
                <button
                  type="button" className="ons-tap" onClick={() => (playing ? setPlaying(false) : startPlay())}
                  style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: "#fff", background: accent, border: "none", borderRadius: 10, padding: "9px 16px", minWidth: 96, cursor: "pointer", flexShrink: 0 }}
                >
                  {playing ? "Pause" : pos >= last - 0.5 ? "Play again" : "Play"}
                </button>
                <button type="button" className="ons-tap" aria-label="Back one year" title="Back one year" onClick={() => jump(idx - 12)} style={stepButton}>−1 yr</button>
                <input
                  className="ons-range" type="range" min={from} max={last} step={1} value={idx} aria-label="Date" aria-valuetext={tLabel(timeline[idx])}
                  onChange={(e) => jump(Number(e.target.value))} style={{ flex: 1, minWidth: 0, accentColor: accent }}
                />
                <button type="button" className="ons-tap" aria-label="Forward one year" title="Forward one year" onClick={() => jump(idx + 12)} style={stepButton}>+1 yr</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "10px 18px", marginTop: 14 }}>
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Speed of time</div>
                  <div role="radiogroup" aria-label="Speed of time" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {SPEEDS.map((s) => (
                      <button key={s.id} type="button" role="radio" aria-checked={speedId === s.id} className="ons-chip" title={s.note} style={pillStyle(speedId === s.id)} onClick={() => setSpeedId(s.id)}>{s.label}</button>
                    ))}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 5 }}>{speed.note}</div>
                </div>
                <div>
                  <label htmlFor="regions-window" style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Show</label>
                  <select
                    id="regions-window" className="ons-chip" value={windowId} onChange={(e) => pickWindow(e.target.value)}
                    style={{ fontFamily: FONT_BODY, fontSize: 14, padding: "8px 10px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", maxWidth: 260 }}
                  >
                    {WINDOWS.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 22px", marginTop: 10 }}>
                <Switch on={scaleMode === "date"} onChange={(on) => setScaleMode(on ? "date" : "fixed")}>Compare places at this date</Switch>
                <Switch on={real} onChange={setReal} disabled={!canReal} hint="Only money amounts, such as house prices, have inflation to take out.">{TOGGLE}</Switch>
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.5, color: COLORS.inkSoft, margin: "6px 0 0" }}>
                {scaleMode === "fixed" ? "Colours use one scale for every date shown, so you can see the whole country change." : "Colours are reset at each date, so the map shows which places are highest and lowest then."}
                {" "}Jobs figures are for the three months ending at the date shown.
              </p>
            </section>

            <div style={{ display: "grid", gap: 20, alignContent: "start", minWidth: 0 }}>
              <League rows={league} selected={selected} hover={hover} onHover={setHover} onSelect={(k) => setSelected((cur) => (cur === k ? null : k))} accent={accent} metric={metric} dateLabel={tLabel(timeline[idx])} reduce={reduce} />
              <Detail
                region={shownRegion} metric={metric} def={def} values={valuesByKey[shown] ?? []} ukValues={ukValues} valuesByKey={valuesByKey}
                index={idx} position={pos} from={from} timeline={timeline} accent={accent} onScrub={jump}
              />
            </div>
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 780 }}>
            House prices are from the UK House Price Index (HM Land Registry with the ONS and others). Jobs figures are from the ONS Labour Force Survey, a sample survey, so differences between regions of a point or two may be noise. Outlines: {geo.attribution} The map shows regions, not the differences inside them: your own area can be very different from its region&apos;s average.
          </p>
        </>
      )}
    </div>
  );
}

const stepButton = { fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "8px 10px", cursor: "pointer", flexShrink: 0, minWidth: 54 };
