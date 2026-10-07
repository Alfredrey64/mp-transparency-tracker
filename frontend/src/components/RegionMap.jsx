import { memo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, numeric } from "../theme";
import geo from "../data/regionMap.json";

// The 12 regions and nations drawn two ways: as a map, and as a grid of equal tiles (so London,
// which is tiny on the map, gets the same room as Scotland). Both share one set of colours, hover,
// keyboard and touch behaviour.
//
//   fill(key)       the colour for a region
//   valueText(key)  the figure to show on tiles and in the pointer label ("£260,000")
//   a11yLabel(key)  what a screen reader says for the region

const byKey = Object.fromEntries(geo.regions.map((r) => [r.key, r]));
const LONDON = byKey.london;

function Tooltip({ at, name, text }) {
  if (!at) return null;
  return (
    <div
      role="presentation"
      style={{
        position: "absolute", left: at.x, top: at.y, transform: `translate(${at.x > at.w * 0.6 ? "calc(-100% - 14px)" : "14px"}, -50%)`, pointerEvents: "none", zIndex: 5,
        background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "7px 11px", boxShadow: "0 8px 22px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{name}</div>
      <div style={{ ...numeric, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{text}</div>
    </div>
  );
}

function RegionMap({ regions, view, fill, valueText, a11yLabel, selected, hover, onHover, onSelect, accent }) {
  const reduce = useReducedMotion();
  const [point, setPoint] = useState(null);

  // Where the pointer is inside the map's box, for the label that follows it.
  const track = (e) => {
    const r = e.currentTarget.closest("[data-map-box]")?.getBoundingClientRect();
    if (r) setPoint({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width });
  };
  const handlers = (key) => ({
    onPointerEnter: (e) => { onHover(key); track(e); },
    onPointerMove: track,
    onPointerLeave: () => { onHover(null); setPoint(null); },
    onFocus: () => onHover(key),
    onBlur: () => onHover(null),
    onClick: () => onSelect(key),
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(key); } },
    tabIndex: 0,
    role: "button",
    "aria-pressed": selected === key,
    "aria-label": a11yLabel(key),
  });
  const name = (key) => regions.find((r) => r.key === key)?.name ?? key;
  const outline = (key) => (selected === key ? accent : hover === key ? COLORS.ink : COLORS.paperCard);

  return (
    <div data-map-box style={{ position: "relative" }}>
      {view === "map" ? (
        <svg viewBox={`0 0 ${geo.width} ${geo.height}`} width="100%" style={{ display: "block", maxHeight: 640, margin: "0 auto", overflow: "visible" }} role="group" aria-label="Map of the regions and nations of the UK">
          <g>
            {geo.regions.map((r, i) => (
              <motion.path
                key={r.key}
                d={r.d}
                {...handlers(r.key)}
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduce ? 0 : 0.05 + i * 0.045, duration: 0.5, ease: "easeOut" }}
                style={{
                  fill: fill(r.key), stroke: outline(r.key), strokeWidth: selected === r.key ? 3 : hover === r.key ? 2.2 : 1.4, strokeLinejoin: "round", cursor: "pointer",
                  transition: "fill 0.45s ease, stroke 0.15s", transformBox: "fill-box", transformOrigin: "center", outline: "none",
                  filter: hover === r.key || selected === r.key ? "drop-shadow(0 4px 8px rgba(0,0,0,0.35))" : undefined,
                }}
              />
            ))}
            {/* London is tiny at this scale, so it also gets a marker you can actually hit. */}
            <motion.g initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
              <circle
                cx={LONDON.cx} cy={LONDON.cy} r="15" {...handlers("london")}
                style={{ fill: fill("london"), stroke: outline("london"), strokeWidth: selected === "london" ? 3 : 2, cursor: "pointer", transition: "fill 0.45s ease", outline: "none" }}
              />
              <text x={LONDON.cx} y={LONDON.cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fontFamily={FONT_BODY} fill={COLORS.paper} stroke={COLORS.ink} strokeWidth="2.6" paintOrder="stroke" pointerEvents="none">L</text>
            </motion.g>
          </g>
        </svg>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(5, minmax(0, 1fr))", gap: 8, maxWidth: 560, margin: "0 auto" }}>
          {regions.map((r, i) => (
            <motion.div
              key={r.key}
              {...handlers(r.key)}
              initial={reduce ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduce ? 0 : i * 0.04, type: "spring", stiffness: 300, damping: 22 }}
              style={{
                gridColumn: r.tile[0] + 1, gridRow: r.tile[1] + 1, aspectRatio: "1 / 1", borderRadius: 14, background: fill(r.key), cursor: "pointer", outline: "none",
                border: `2px solid ${selected === r.key ? accent : hover === r.key ? COLORS.ink : "transparent"}`, transition: "background 0.45s ease, border-color 0.15s",
                display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "8px 9px", minWidth: 0, overflow: "hidden",
              }}
            >
              <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.65)", lineHeight: 1.2 }}>{r.short}</span>
              <span style={{ ...numeric, fontSize: 13.5, fontWeight: 600, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.65)" }}>{valueText(r.key)}</span>
            </motion.div>
          ))}
        </div>
      )}
      {view === "map" && hover && <Tooltip at={point} name={name(hover)} text={valueText(hover)} />}
    </div>
  );
}

export default memo(RegionMap);
