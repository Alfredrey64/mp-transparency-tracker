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
import { monthlyTimeline, valuesOver, ranked, ordinal, domainOf, fraction, tLabel } from "../lib/regionData";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Regions and nations: an interactive, animated map. Pick a measure, slide or play through time,
// and hover, tap or tab to a place to see how it compares with the rest and with the UK.

const PLAY_SECONDS = 18;
const TOGGLE = "Remove inflation (real terms)";

function Switch({ on, onChange, disabled, hint, children }) {
  return (
    <button
      type="button" role="switch" className="ons-tap" aria-checked={on && !disabled} aria-disabled={disabled || undefined} title={disabled ? hint : undefined}
      onClick={() => { if (!disabled) onChange(!on); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: "6px 0", font: "inherit", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
    >
      <span aria-hidden="true" style={{ width: 40, height: 23, borderRadius: 12, background: on && !disabled ? COLORS.ink : COLORS.hairline, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on && !disabled ? 20 : 3, width: 17, height: 17, borderRadius: 9, background: on && !disabled ? COLORS.paper : COLORS.inkSoft, transition: "left 0.2s" }} />
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{children}</span>
    </button>
  );
}

// One region's line over the whole timeline, with the UK as a dotted line and a dot at the date shown.
// Press or drag along it to move the date.
function Sparkline({ values, ukValues, index, color, onScrub, format }) {
  const W = 320;
  const H = 96;
  const all = [...values, ...ukValues].filter((v) => v !== null && v !== undefined);
  if (all.length < 2) return null;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const x = (i) => (i / Math.max(1, values.length - 1)) * W;
  const y = (v) => H - 10 - ((v - lo) / (hi - lo || 1)) * (H - 22);
  const path = (list) => list.map((v, i) => (v === null || v === undefined ? null : `${i && list[i - 1] !== null ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)).filter(Boolean).join(" ");
  const here = values[index];
  const scrub = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    onScrub(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (values.length - 1)));
  };
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label={`Trend over time. Press or drag to move the date. Range ${formatAxis(format, lo)} to ${formatAxis(format, hi)}.`}
      style={{ display: "block", touchAction: "none", cursor: "ew-resize" }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrub(e); }}
      onPointerMove={(e) => { if (e.buttons) scrub(e); }}
    >
      <path d={path(ukValues)} fill="none" stroke={COLORS.inkSoft} strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.8" />
      <path d={path(values)} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={x(index)} x2={x(index)} y1="0" y2={H} stroke={COLORS.inkSoft} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.5" />
      {here !== null && here !== undefined && <circle cx={x(index)} cy={y(here)} r="5" fill={color} stroke={COLORS.paperCard} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

function Panel({ region, metric, def, values, ukValues, valuesByKey, index, timeline, accent, onScrub }) {
  if (!region) return null;
  const v = values[index];
  const uk = ukValues[index];
  const order = ranked(Object.fromEntries(Object.entries(valuesByKey).map(([k, list]) => [k, list[index]])));
  const rank = order.find((o) => o.key === region.key)?.rank;
  const yearBack = Math.max(0, index - 12);
  const before = values[yearBack];
  const change = v !== null && before !== null && index >= 12 ? changeBetween(def, before, v) : null;
  const diff = v !== null && uk !== null && uk !== undefined ? (def.kind === "rate" ? v - uk : ((v - uk) / uk) * 100) : null;
  const cmp = diff === null ? "" : Math.abs(diff) < 0.05 ? "about the same as the UK" : def.kind === "rate" ? `${Math.abs(diff).toFixed(1)} percentage points ${diff > 0 ? "above" : "below"} the UK` : `${Math.abs(diff).toFixed(0)}% ${diff > 0 ? "above" : "below"} the UK`;
  return (
    <div aria-live="polite">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: accent }}>{tLabel(timeline[index])}</div>
      <h2 style={{ ...cardTitle, margin: "2px 0 8px" }}>{region.name}</h2>
      <div style={{ ...numeric, fontSize: 46, fontWeight: 600, lineHeight: 1.05, color: COLORS.ink, letterSpacing: "-0.02em" }}>{v === null ? "No figure" : formatValue(metric.format, v)}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "4px 0 12px" }}>{metric.noun}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {rank && <span style={chip(accent)}>{ordinal(rank)} highest of {order.length}</span>}
        {cmp && <span style={chip(accent)}>{cmp}</span>}
        {change && <span style={chip(accent)}>{changeShort(change)} on a year earlier</span>}
      </div>
      <Sparkline values={values} ukValues={ukValues} index={index} color={accent} onScrub={onScrub} format={metric.format} />
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>
        <span>{tLabel(timeline[0])}</span>
        <span><span style={{ display: "inline-block", width: 16, borderTop: `2px solid ${accent}`, verticalAlign: "middle", marginRight: 5 }} />{region.short}<span style={{ display: "inline-block", width: 16, borderTop: `2px dotted ${COLORS.inkSoft}`, verticalAlign: "middle", margin: "0 5px 0 12px" }} />UK</span>
        <span>{tLabel(timeline.at(-1))}</span>
      </div>
    </div>
  );
}
const chip = (accent) => ({ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, background: `${accent}1f`, borderRadius: 999, padding: "4px 11px" });

export default function RegionsPage({ param }) {
  const reduce = useReducedMotion();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [metricId, setMetricId] = useState(() => metricById(param)?.id ?? "price");
  const [view, setView] = useState("map");
  const [index, setIndex] = useState(null); // null: the latest date
  const [playing, setPlaying] = useState(false);
  const [playFrom, setPlayFrom] = useState(0);
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

  // This metric's points for every region and for the UK, with inflation taken out if asked.
  const series = useMemo(() => {
    if (!data) return null;
    const pick = (ref) => {
      const item = data.sectors[ref.sector]?.series[ref.id];
      if (!item) return null;
      const adjust = real && canAdjust(item.def) && data.deflator;
      return { def: item.def, points: adjust ? toReal(item.points, data.deflator, item.def) : item.points };
    };
    const byRegion = Object.fromEntries(REGIONS.map((r) => [r.key, pick(metric.series[r.key])]));
    return { byRegion, uk: pick(metric.uk) };
  }, [data, metric, real]);

  const timeline = useMemo(() => (series ? monthlyTimeline(REGIONS.map((r) => series.byRegion[r.key]?.points)) : []), [series]);
  const valuesByKey = useMemo(() => (series ? Object.fromEntries(REGIONS.map((r) => [r.key, valuesOver(series.byRegion[r.key]?.points ?? [], timeline)])) : {}), [series, timeline]);
  const ukValues = useMemo(() => (series?.uk ? valuesOver(series.uk.points, timeline) : timeline.map(() => null)), [series, timeline]);
  const last = Math.max(0, timeline.length - 1);
  const idx = Math.min(index ?? last, last);

  const atDate = useMemo(() => Object.fromEntries(REGIONS.map((r) => [r.key, valuesByKey[r.key]?.[idx] ?? null])), [valuesByKey, idx]);
  const fixedDomain = useMemo(() => domainOf(valuesByKey), [valuesByKey]);
  const dateDomain = useMemo(() => domainOf(Object.fromEntries(Object.entries(atDate).map(([k, v]) => [k, [v]]))), [atDate]);
  const domain = scaleMode === "fixed" ? fixedDomain : dateDomain;
  const def = series?.byRegion[REGIONS[0].key]?.def;
  const canReal = Boolean(def && canAdjust(def));

  // Playing: step through the months, taking PLAY_SECONDS to cover the whole timeline.
  useEffect(() => {
    if (!playing || timeline.length < 2) return undefined;
    let raf;
    let position = playFrom;
    let previous = performance.now();
    const perMs = (timeline.length - 1) / (PLAY_SECONDS * 1000);
    const tick = (now) => {
      position += (now - previous) * perMs;
      previous = now;
      if (position >= timeline.length - 1) {
        setIndex(timeline.length - 1);
        setPlaying(false);
        return;
      }
      setIndex(Math.floor(position));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, playFrom, timeline.length]);

  if (failed) return <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}><LoadFailedNote item="the regional figures" /></div>;

  const colour = (key) => {
    const v = atDate[key];
    if (v === null || v === undefined) return COLORS.hairline;
    return `color-mix(in srgb, ${accent} ${Math.round(16 + Math.pow(fraction(v, domain), 0.85) * 84)}%, ${COLORS.paperCard})`;
  };
  const text = (key) => (atDate[key] === null || atDate[key] === undefined ? "n/a" : formatValue(metric.format, atDate[key]));
  const shown = hover ?? selected ?? ranked(atDate)[0]?.key ?? "london";
  const shownRegion = REGIONS.find((r) => r.key === shown);
  const race = ranked(atDate);
  const top = Math.max(...race.map((r) => atDate[r.key]), 1e-9);

  function startPlay() {
    const from = idx >= last - 1 ? 0 : idx;
    setPlayFrom(from);
    setIndex(from);
    setPlaying(true);
  }
  function pickMetric(id) {
    setMetricId(id);
    setIndex(null);
    setPlaying(false);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
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
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 16px", maxWidth: 760 }}>{metric.why}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 20, alignItems: "start" }}>
            <section aria-label="Map" style={{ ...card, background: `radial-gradient(520px 320px at 50% 0%, ${accent}1f, transparent 70%), ${COLORS.paperCard}` }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 14px", marginBottom: 12 }}>
                <div role="radiogroup" aria-label="Map style" style={{ display: "inline-flex", gap: 6 }}>
                  <button type="button" role="radio" aria-checked={view === "map"} className="ons-chip" style={pillStyle(view === "map")} onClick={() => setView("map")}>Map</button>
                  <button type="button" role="radio" aria-checked={view === "tiles"} className="ons-chip" style={pillStyle(view === "tiles")} onClick={() => setView("tiles")}>Equal tiles</button>
                </div>
                <div style={{ ...numeric, fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: COLORS.ink }}>{tLabel(timeline[idx])}</div>
              </div>

              <RegionMap
                regions={REGIONS} view={view} fill={colour} valueText={text} accent={accent}
                a11yLabel={(k) => `${REGIONS.find((r) => r.key === k).name}: ${text(k)}`}
                selected={selected} hover={hover} onHover={setHover} onSelect={(k) => setSelected((cur) => (cur === k ? null : k))}
              />

              <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px auto 0", maxWidth: 420 }}>
                <span style={{ ...numeric, fontSize: 12.5, color: COLORS.inkSoft }}>{formatValue(metric.format, domain[0])}</span>
                <span style={{ flex: 1, height: 10, borderRadius: 5, background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 16%, ${COLORS.paperCard}), ${accent})` }} />
                <span style={{ ...numeric, fontSize: 12.5, color: COLORS.inkSoft }}>{formatValue(metric.format, domain[1])}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                <button
                  type="button" className="ons-tap" onClick={() => (playing ? setPlaying(false) : startPlay())}
                  style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: "#fff", background: accent, border: "none", borderRadius: 10, padding: "9px 18px", minWidth: 92, cursor: "pointer" }}
                >
                  {playing ? "Pause" : idx >= last - 1 ? "Play again" : "Play"}
                </button>
                <input
                  className="ons-range" type="range" min={0} max={last} step={1} value={idx} aria-label="Date" aria-valuetext={tLabel(timeline[idx])}
                  onChange={(e) => { setPlaying(false); setIndex(Number(e.target.value)); }} style={{ flex: 1, minWidth: 0, accentColor: accent }}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 22px", marginTop: 10 }}>
                <Switch on={scaleMode === "date"} onChange={(on) => setScaleMode(on ? "date" : "fixed")}>Compare regions at this date</Switch>
                <Switch on={real} onChange={setReal} disabled={!canReal} hint="Only money amounts, such as house prices, have inflation to take out.">{TOGGLE}</Switch>
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.5, color: COLORS.inkSoft, margin: "6px 0 0" }}>
                {scaleMode === "fixed" ? "Colours use one scale for all dates, so you can see the whole country change over time." : "Colours are reset at each date, so the map shows which places are highest and lowest then."}
                {" "}Jobs figures are for the three months ending at the date shown.
              </p>
            </section>

            <section aria-label="Place detail" style={card}>
              <Panel
                region={shownRegion} metric={metric} def={def} values={valuesByKey[shown] ?? []} ukValues={ukValues} valuesByKey={valuesByKey}
                index={idx} timeline={timeline} accent={accent} onScrub={(i) => { setPlaying(false); setIndex(i); }}
              />
              <a href={metric.link.href} className="ons-tap" style={{ display: "inline-flex", alignItems: "center", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, marginTop: 14 }}>{metric.link.label}</a>
              {!hover && !selected && <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "8px 0 0" }}>Hover over, tap or tab to a place to see it here.</p>}
            </section>
          </div>

          <section aria-labelledby="h-race" style={{ ...card, marginTop: 20 }}>
            <h2 id="h-race" style={cardTitle}>Ranked, highest first</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "6px 0 14px" }}>The bars re-order as the date changes. Tap a bar to choose that place.</p>
            <LayoutGroup>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                {race.map(({ key, rank }) => {
                  const r = REGIONS.find((x) => x.key === key);
                  const v = atDate[key];
                  return (
                    <motion.li key={key} layout={!reduce} transition={{ type: "spring", stiffness: 420, damping: 38 }} style={{ margin: 0 }}>
                      <button
                        type="button" onClick={() => setSelected((cur) => (cur === key ? null : key))} aria-pressed={selected === key}
                        onPointerEnter={() => setHover(key)} onPointerLeave={() => setHover(null)} className="ons-chip"
                        style={{ display: "grid", gridTemplateColumns: "26px minmax(100px, 190px) 1fr auto", gap: 10, alignItems: "center", width: "100%", background: selected === key ? `${accent}18` : "none", border: "none", borderRadius: 10, padding: "5px 8px", cursor: "pointer", font: "inherit", textAlign: "left" }}
                      >
                        <span style={{ ...numeric, fontSize: 13, color: COLORS.inkSoft }}>{rank}</span>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                        <span aria-hidden="true" style={{ height: 12, borderRadius: 6, background: COLORS.hairline, overflow: "hidden" }}>
                          <span style={{ display: "block", height: "100%", width: `${Math.max(2, (Math.max(0, v) / top) * 100)}%`, borderRadius: 6, background: colour(key), minWidth: 4, transition: "width 0.3s ease, background 0.45s ease", boxShadow: `inset 0 0 0 1px ${accent}55` }} />
                        </span>
                        <span style={{ ...numeric, fontSize: 14, fontWeight: 600, color: COLORS.ink, minWidth: 74, textAlign: "right" }}>{text(key)}</span>
                      </button>
                    </motion.li>
                  );
                })}
              </ol>
            </LayoutGroup>
          </section>

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 780 }}>
            House prices are from the UK House Price Index (HM Land Registry with the ONS and others). Jobs figures are from the ONS Labour Force Survey, a sample survey, so differences between regions of a point or two may be noise. Outlines: {geo.attribution} The map shows regions, not the differences inside them: your own area can be very different from its region's average.
          </p>
        </>
      )}
    </div>
  );
}
