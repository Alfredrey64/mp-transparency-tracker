import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_BODY, numeric } from "../theme";
import LineChart from "./LineChart";
import ChartActions from "./ChartActions";
import { formatValue, formatAxis, sliceRange, periodLabel, periodToT } from "../lib/onsFormat";
import { toLineData, yearTicks } from "../lib/onsChart";
import { hasExtremes } from "../lib/squashScale";
import { toReal, canAdjust } from "../lib/onsReal";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { buildShareParam, shareUrl } from "../lib/shareLink";
import { placesCsv } from "../lib/onsDownload";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Several places on one chart: pick up to six, see them over time as real values or as
// growth from the same starting point (every place set to 100), and see all places
// ranked in the bars underneath. Each place keeps its own colour while it is ticked.

const SLOTS = ["#0E9AA7", "#E07A1F", "#7B5BD6", "#D4577A", "#3E7CD9", "#3F9B3F"];
const MAX_PLACES = SLOTS.length;
const NOW = new Date().getFullYear() + 1;

function initialSlots(group, initial) {
  const wanted = (initial?.places ?? group.defaultOn).filter((id) => group.members.includes(id)).slice(0, MAX_PLACES);
  return Array.from({ length: MAX_PLACES }, (_, i) => wanted[i] ?? null);
}

function PlacesChart({ group, sector, series, range, real, deflator, showGovernments, accent, initial }) {
  const [slots, setSlots] = useState(() => initialSlots(group, initial));
  const [indexed, setIndexed] = useState(() => initial?.indexed ?? group.showAs === "index");
  // null: squeeze the scale automatically when one line has an extreme spike; true or false once the reader chooses.
  const [squashPref, setSquashPref] = useState(null);
  const cardId = `s-${group.id}`;
  const selected = slots.filter(Boolean);

  const places = useMemo(() => group.members.map((id) => {
    const item = series[id];
    if (!item) return null;
    const adjust = real && canAdjust(item.def) && deflator;
    const points = adjust ? toReal(item.points, deflator, item.def) : item.points;
    return { id, name: group.names?.[id] ?? item.def.place ?? item.def.label, def: item.def, points: sliceRange(points, range), updated: item.updated };
  }).filter((p) => p && p.points.length > 1), [group, series, range, real, deflator]);

  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);

  // From the latest start among the ticked places, so every place begins together.
  const chosen = useMemo(() => {
    const picks = slots.map((id, slot) => (id && byId.get(id) ? { ...byId.get(id), slot } : null)).filter(Boolean);
    if (!picks.length) return [];
    const data = picks.map((p) => ({ ...p, data: toLineData(p.points) }));
    if (!indexed) return data;
    const start = Math.max(...data.map((p) => p.data[0].x));
    return data.map((p) => {
      const kept = p.data.filter((pt) => pt.x >= start - 1e-9);
      const base = kept[0]?.y || 1;
      return { ...p, data: kept.map((pt) => ({ ...pt, raw: pt.y, y: (pt.y / base) * 100 })) };
    });
  }, [slots, byId, indexed]);

  const lines = chosen.map((p) => ({
    name: p.name,
    color: SLOTS[p.slot],
    points: p.data,
    format: indexed ? (v) => `${v.toFixed(0)} (${v >= 100 ? "+" : ""}${(v - 100).toFixed(0)}%)` : (v) => formatValue(group.format, v),
  }));

  const ranked = useMemo(() => places.map((p) => {
    const start = Math.max(...places.map((q) => periodToT(q.points[0][0])));
    const from = p.points.find(([period]) => periodToT(period) >= start - 1e-9) ?? p.points[0];
    const first = from[1];
    const last = p.points.at(-1)[1];
    return { ...p, value: indexed ? (first ? ((last - first) / Math.abs(first)) * 100 : 0) : last };
  }).sort((a, b) => b.value - a.value), [places, indexed]);
  const biggest = Math.max(...ranked.map((p) => Math.abs(p.value)), 1);
  const slotOf = (id) => slots.indexOf(id);

  function toggle(id) {
    setSlots((current) => {
      const at = current.indexOf(id);
      if (at >= 0) {
        if (current.filter(Boolean).length <= 1) return current;
        return current.map((x, i) => (i === at ? null : x));
      }
      const free = current.indexOf(null);
      return free < 0 ? current : current.map((x, i) => (i === free ? id : x));
    });
  }

  // Percentage lines sometimes have one huge spike (hospitality after the pandemic); a squeezed scale keeps the rest readable.
  const canSquash = !indexed && group.format === "pct";
  const extreme = canSquash && hasExtremes(chosen.flatMap((p) => p.data.map((pt) => pt.y)));
  const squash = canSquash && (squashPref ?? extreme);

  const first = chosen[0]?.data[0];
  const last = chosen[0]?.data.at(-1);
  const xFrom = first ? Math.min(...chosen.map((p) => p.data[0].x)) : 0;
  const xTo = last ? Math.max(...chosen.map((p) => p.data.at(-1).x)) : 1;
  const bands = useMemo(
    () => (showGovernments && chosen.length ? bandsBetween(xFrom, xTo + 0.05, NOW).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })) : []),
    [showGovernments, chosen.length, xFrom, xTo],
  );
  const sentence = squash
    ? `The vertical scale is squeezed so one huge spike does not flatten the other lines: each step up the axis is a bigger jump than the one before. Hover or touch the chart for the real figures.${real ? " Inflation has been taken out." : ""}`
    : indexed
    ? `Each place is set to 100 at the start, so the lines show growth, not size.${real ? " Inflation has been taken out." : ""}`
    : `${real ? "Inflation has been taken out. " : ""}Hover or touch the chart to read each place's figure.`;

  const getInfo = () => ({
    url: shareUrl(sector, buildShareParam({ target: group.id, range, real, indexed, places: selected })),
    title: group.title,
    sentence,
    source: series[group.members[0]]?.def.source?.name ?? "Office for National Statistics",
    accent,
    legend: lines.map((l) => ({ name: l.name, color: l.color })),
    filename: `${group.id}.png`,
    csv: {
      filename: `${group.id}.csv`,
      text: placesCsv({
        places: chosen.map((p) => ({ name: p.name, points: p.data.map((pt) => [pt.period, indexed ? pt.y : pt.raw ?? pt.y]) })),
        source: series[group.members[0]]?.def.source?.name ?? "Office for National Statistics",
        unit: indexed ? "index, start of period = 100" : group.format === "gbp" ? "£" : group.format === "pct" ? "%" : "people",
      }),
    },
  });

  return (
    <motion.section
      className="ons-anchor"
      id={cardId}
      aria-labelledby={`h-${group.id}`}
      style={{ ...card, position: "relative", overflow: "hidden", gridColumn: "1 / -1" }}
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id={`h-${group.id}`} style={cardTitle}>{group.title}</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 14px", maxWidth: 760 }}>{group.blurb}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", alignItems: "center", marginBottom: 12 }}>
        <div role="radiogroup" aria-label="How to show the places" style={{ display: "inline-flex", gap: 6 }}>
          <button type="button" role="radio" aria-checked={!indexed} className="ons-tap" style={pillStyle(!indexed)} onClick={() => setIndexed(false)}>Actual figures</button>
          <button type="button" role="radio" aria-checked={indexed} className="ons-tap" style={pillStyle(indexed)} onClick={() => setIndexed(true)}>Growth (start = 100)</button>
        </div>
        {canSquash && (extreme || squashPref !== null) && (
          <div role="radiogroup" aria-label="Vertical scale" style={{ display: "inline-flex", gap: 6 }}>
            <button type="button" role="radio" aria-checked={!squash} className="ons-tap" style={pillStyle(!squash)} onClick={() => setSquashPref(false)}>Even scale</button>
            <button type="button" role="radio" aria-checked={squash} className="ons-tap" style={pillStyle(squash)} onClick={() => setSquashPref(true)}>Squeeze the extremes</button>
          </div>
        )}
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{selected.length} of {MAX_PLACES} places ticked</span>
      </div>

      <div role="group" aria-label="Places to show" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {places.map((p) => {
          const at = slotOf(p.id);
          const on = at >= 0;
          const full = !on && selected.length >= MAX_PLACES;
          return (
            <button
              key={p.id}
              type="button"
              className="ons-chip"
              aria-pressed={on}
              disabled={full}
              onClick={() => toggle(p.id)}
              style={{
                fontFamily: FONT_BODY, fontSize: 13, fontWeight: on ? 700 : 600, display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999,
                cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.45 : 1, color: COLORS.ink,
                border: `1.5px solid ${on ? SLOTS[at] : COLORS.hairline}`, background: on ? `${SLOTS[at]}22` : "transparent",
              }}
            >
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: on ? SLOTS[at] : COLORS.hairline }} />
              {p.name}
            </button>
          );
        })}
      </div>

      {lines.length > 0 && (
        <LineChart
          key={`${range}-${indexed}-${real}-${showGovernments}-${squash}-${selected.join("|")}`}
          yScale={squash ? "squash" : "linear"}
          height={squash ? 300 : 230}
          lines={lines}
          xTicks={yearTicks(xFrom, xTo)}
          yFormat={indexed ? (v) => String(Math.round(v)) : (v) => formatAxis(group.format, v)}
          ariaLabel={`${group.title}. ${lines.map((l) => l.name).join(", ")}. ${sentence}`}
          accent={accent}
          bands={bands}
          animateIn
        />
      )}
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.5, color: COLORS.inkSoft, margin: "8px 0 0" }}>{sentence}</p>

      <h3 style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: "22px 0 10px" }}>
        {indexed ? "Growth over the period shown, highest first" : "Latest figure, highest first"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: "4px 28px" }}>
        {ranked.map((p) => {
          const at = slotOf(p.id);
          const on = at >= 0;
          const width = `${Math.max(2, (Math.abs(p.value) / biggest) * 100)}%`;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              aria-pressed={on}
              className="ons-chip"
              style={{ display: "grid", gridTemplateColumns: "minmax(96px, 150px) 1fr auto", alignItems: "center", gap: 10, background: "none", border: "none", padding: "5px 0", cursor: "pointer", textAlign: "left", font: "inherit", minWidth: 0 }}
            >
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: on ? 700 : 500, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span aria-hidden="true" style={{ height: 10, borderRadius: 5, background: COLORS.hairline, position: "relative", overflow: "hidden" }}>
                <span style={{ position: "absolute", inset: "0 auto 0 0", width, borderRadius: 5, background: on ? SLOTS[at] : `${accent}77` }} />
              </span>
              <span style={{ ...numeric, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, minWidth: 64, textAlign: "right" }}>
                {indexed ? `${p.value >= 0 ? "+" : ""}${p.value.toFixed(0)}%` : formatValue(group.format, p.value)}
              </span>
            </button>
          );
        })}
      </div>
      {ranked[0] && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "10px 0 0" }}>
          {indexed ? `Change from ${periodLabel(chosen[0]?.data[0]?.period ?? ranked[0].points[0][0])} to ${periodLabel(ranked[0].points.at(-1)[0])}.` : `Latest figures are for ${periodLabel(ranked[0].points.at(-1)[0])}.`}
        </p>
      )}

      <div style={{ marginTop: 16 }}><ChartActions cardId={cardId} getInfo={getInfo} /></div>
    </motion.section>
  );
}

export default memo(PlacesChart);
