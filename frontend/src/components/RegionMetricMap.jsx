import { useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { formatValue } from "../lib/onsFormat";
import { classColour, classOf, niceBands, ordinal, rankOf, ranked } from "../lib/regionData";
import { REGIONS } from "../data/regionMetrics";
import RegionMap from "./RegionMap";
import ColourKey from "./RegionKey";
import { Panel } from "./insight";
import { para } from "../lib/insightStyle";

// The map of the 12 regions and nations, painted by the chosen measure, with a league table and a profile of the chosen place beside it. Used by
// the issue pages. Each metric is { id, group, label, format, accent, blurb, values: () => { regionKey: number|null }, uk: () => number, year, source, higher }
// (`source` is one { label, url } shown under the map). `higher` says what "highest" means in the profile ("highest of 12" by default).

function Profile({ regionKey, onClear, metrics }) {
  const name = REGIONS.find((r) => r.key === regionKey).name;
  return (
    <div style={{ padding: "14px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>{name}</h3>
        <button type="button" onClick={onClear} style={{ ...pillStyle(false), padding: "4px 10px", fontSize: 12.5 }}>Clear</button>
      </div>
      <p style={{ ...para, fontSize: 13, marginTop: 4 }}>Against {(metrics[0].ukLabel ?? "the UK")}, with where it ranks among the places with a figure.</p>
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
        {metrics.map((m) => {
          const values = m.values();
          const v = values[regionKey];
          const r = rankOf(values, regionKey);
          return (
            <li key={m.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "0 10px", fontFamily: FONT_BODY, fontSize: 13.5 }}>
              <span style={{ color: COLORS.ink, fontWeight: 600 }}>{m.label}</span>
              <span style={{ ...numeric, fontWeight: 600, color: COLORS.ink, textAlign: "right" }}>{v === null || v === undefined ? "n/a" : formatValue(m.format, v)}</span>
              <span style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>{m.ukLabel === "England" ? "England" : "UK"} {formatValue(m.format, m.uk())}</span>
              <span style={{ color: COLORS.inkSoft, fontSize: 12.5, textAlign: "right" }}>{r ? `${ordinal(r.rank)} highest of ${r.of}` : ""}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function RegionMetricMap({ id, title, lead, metrics, defaultMetric, selected, onSelect, outlinesNote = true, tapNote }) {
  const [metricId, setMetricId] = useState(defaultMetric ?? metrics[0].id);
  const [view, setView] = useState("map");
  const [hover, setHover] = useState(null);
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0];
  const values = useMemo(() => metric.values(), [metric]);
  const uk = metric.uk();
  const bounds = useMemo(() => {
    const all = [...Object.values(values).filter((v) => v !== null && v !== undefined), uk];
    return niceBands(Math.min(...all), Math.max(...all), 5).bounds;
  }, [values, uk]);
  const n = bounds.length - 1;
  const valid = (v) => v !== null && v !== undefined;
  const fill = (key) => (valid(values[key]) ? classColour(metric.accent, classOf(values[key], bounds), n) : COLORS.hairline);
  const text = (key) => (valid(values[key]) ? formatValue(metric.format, values[key]) : "n/a");
  const order = ranked(values);
  const high = order[0];
  const low = order.at(-1);
  const name = (k) => REGIONS.find((r) => r.key === k).name;
  const sources = metric.source ? [metric.source] : [];
  const ukName = metric.ukLabel ?? "the UK";
  const groups = [...new Set(metrics.map((m) => m.group).filter(Boolean))];
  return (
    <Panel
      id={id} accent={metric.accent} title={title}
      lead={lead}
      sources={sources}
    >
      <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
        {groups.map((g) => (
          <div key={g} role="group" aria-label={g} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, flexBasis: "100%" }}>{g}</span>
            {metrics.filter((m) => m.group === g).map((m) => <button key={m.id} type="button" aria-pressed={m.id === metricId} onClick={() => setMetricId(m.id)} style={pillStyle(m.id === metricId)}>{m.label}</button>)}
          </div>
        ))}
      </div>
      <p style={{ ...para, marginTop: 0 }}>{metric.blurb} <strong style={{ color: COLORS.ink }}>{metric.year}.</strong></p>
      <div className="place-grid" style={{ display: "grid", gap: 18, marginTop: 12, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div role="group" aria-label="Map style" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")} style={pillStyle(view === "map")}>Map</button>
            <button type="button" aria-pressed={view === "tiles"} onClick={() => setView("tiles")} style={pillStyle(view === "tiles")}>Equal tiles</button>
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.5, color: COLORS.ink, margin: "0 0 8px" }} aria-live="polite">
            <strong>{name(high.key)}</strong> is highest ({text(high.key)}) and <strong>{name(low.key)}</strong> lowest ({text(low.key)}). {ukName.charAt(0).toUpperCase() + ukName.slice(1)} is {formatValue(metric.format, uk)}.
          </p>
          <RegionMap
            regions={REGIONS} view={view} fill={fill} valueText={text} compactText={text} accent={metric.accent} smooth
            a11yLabel={(k) => `${name(k)}: ${text(k)}`} selected={selected} hover={hover} onHover={setHover} onSelect={(k) => onSelect(selected === k ? null : k)}
          />
          <ColourKey bounds={bounds} accent={metric.accent} format={metric.format} uk={uk} ukLabel={ukName === "the UK" ? undefined : ukName} caption="Darker means higher" />
        </div>
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          {selected ? (
            <Profile regionKey={selected} onClear={() => onSelect(null)} metrics={metrics} />
          ) : (
            <div style={{ padding: "14px 16px", borderRadius: 16, background: COLORS.paper, border: `1px dashed ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft }}>{tapNote ?? "Tap a place on the map, or a name in the list below, to see how it compares on every measure."}</div>
          )}
          <ol aria-label={`${metric.label} by region, highest first`} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {order.map(({ key, rank }) => (
              <li key={key}>
                <button
                  type="button" onClick={() => onSelect(selected === key ? null : key)} aria-pressed={selected === key}
                  style={{ width: "100%", display: "grid", gridTemplateColumns: "22px 14px minmax(0, 1fr) auto", gap: 8, alignItems: "center", padding: "6px 8px", minHeight: 36, borderRadius: 10, border: `1px solid ${selected === key ? metric.accent : "transparent"}`, background: selected === key ? COLORS.paper : "transparent", cursor: "pointer", textAlign: "left", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}
                >
                  <span style={{ ...numeric, color: COLORS.inkSoft, fontSize: 12 }}>{rank}</span>
                  <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: fill(key), boxShadow: `0 0 0 1px ${COLORS.hairline}` }} />
                  <span style={{ fontWeight: selected === key ? 700 : 500 }}>{name(key)}</span>
                  <span style={{ ...numeric, fontWeight: 600 }}>{text(key)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <style>{`.place-grid { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); } @media (max-width: 860px) { .place-grid { grid-template-columns: minmax(0, 1fr); } }`}</style>
      {outlinesNote && <p style={{ ...para, fontSize: 12.5 }}>Outlines: ONS ITL1 January 2025 boundaries, generalised and simplified (Contains OS data © Crown copyright and database right 2025). Each figure is for the region as a whole; places inside a region can differ a great deal.</p>}
    </Panel>
  );
}
