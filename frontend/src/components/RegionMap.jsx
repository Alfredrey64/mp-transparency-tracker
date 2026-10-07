import { memo, useCallback, useState, useSyncExternalStore } from "react";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { isScrolling } from "../lib/scrollState";
import geo from "../data/regionMap.json";

// The 12 regions and nations drawn two ways: as a map, and as a grid of equal tiles (so London,
// which is tiny on the map, gets the same room as Scotland). Both share one set of colours, hover,
// keyboard and touch behaviour.
//
// On a wide screen the map has a label for every place in the margins, joined to it by a thin line, showing
// its name, its figure and how that has moved. On a phone the map fills the width and carries just the figures.
//
//   fill(key)       the colour for a region
//   valueText(key)  the figure to show ("£260,000")
//   deltaText(key)  how it has moved ("▲ 3.3%"); optional
//   a11yLabel(key)  what a screen reader says for the region

const byKey = Object.fromEntries(geo.regions.map((r) => [r.key, r]));
const LONDON = byKey.london;

// Side labels: which margin each place's label sits in, and how far down. Scotland is big enough to carry its own.
const SLOTS = {
  ni: ["left", 455], nw: ["left", 575], wales: ["left", 655], wm: ["left", 735], sw: ["left", 812],
  ne: ["right", 420], yh: ["right", 500], em: ["right", 585], east: ["right", 665], london: ["right", 740], se: ["right", 812],
};
// Where the figure sits on a narrow map, where the places are too small for side labels.
const COMPACT = { se: [326, 790], london: [408, 770] };
const WIDE_BOX = { x: -205, w: 860 };

// Side labels need room: below this width the map fills the box and carries just the figures.
const WIDE_FROM = 540;

// The width of the box the map sits in, kept up to date as it changes.
function useBoxWidth() {
  const [box, setBox] = useState(null);
  const subscribe = useCallback((notify) => {
    if (!box) return () => {};
    const ro = new ResizeObserver(notify);
    ro.observe(box);
    return () => ro.disconnect();
  }, [box]);
  const width = useSyncExternalStore(subscribe, () => box?.clientWidth ?? 0, () => 0);
  return [setBox, width];
}

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

const halo = { paintOrder: "stroke", stroke: "var(--c-paper, #fff)", strokeWidth: 5, strokeLinejoin: "round" };

function RegionMap({ regions, view, fill, valueText, deltaText, a11yLabel, selected, hover, onHover, onSelect, accent, smooth = true }) {
  const [boxRef, boxWidth] = useBoxWidth();
  const wide = boxWidth === 0 || boxWidth >= WIDE_FROM;
  const [point, setPoint] = useState(null);

  // Where the pointer is inside the map's box, for the label that follows it.
  const track = (e) => {
    const r = e.currentTarget.closest("[data-map-box]")?.getBoundingClientRect();
    if (r) setPoint({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width });
  };
  const handlers = (key) => ({
    onPointerEnter: (e) => { if (!isScrolling()) { onHover(key); track(e); } },
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
  // A label is a second target for the same place, so it needs no focus stop of its own.
  const labelHandlers = (key) => ({
    onPointerEnter: () => { if (!isScrolling()) onHover(key); },
    onPointerLeave: () => onHover(null),
    onClick: () => onSelect(key),
    "aria-hidden": true,
  });
  const name = (key) => regions.find((r) => r.key === key)?.name ?? key;
  const short = (key) => regions.find((r) => r.key === key)?.short ?? key;
  const outline = (key) => (selected === key ? accent : hover === key ? COLORS.ink : COLORS.paperCard);
  const active = (key) => selected === key || hover === key;

  // One side label: name, figure and movement, joined to the place by a line.
  const sideLabel = (key) => {
    const [side, y] = SLOTS[key];
    const r = byKey[key];
    const left = side === "left";
    const x = left ? -12 : 457;
    const anchor = left ? "end" : "start";
    const delta = deltaText?.(key);
    return (
      <g key={key} {...labelHandlers(key)} style={{ cursor: "pointer" }}>
        <path d={`M${r.cx} ${r.cy} L${left ? -6 : 451} ${y}`} stroke={COLORS.inkSoft} strokeWidth="1" opacity={active(key) ? 0.9 : 0.45} fill="none" vectorEffect="non-scaling-stroke" />
        <circle cx={r.cx} cy={r.cy} r="3.5" fill={COLORS.ink} stroke={COLORS.paperCard} strokeWidth="1.5" />
        <rect x={left ? x - 200 : x - 6} y={y - 34} width="206" height="76" fill="transparent" />
        <text x={x} y={y - 11} textAnchor={anchor} fontFamily={FONT_BODY} fontSize="19" fontWeight={active(key) ? 800 : 700} fill={COLORS.ink}>{short(key)}</text>
        <text x={x} y={y + 13} textAnchor={anchor} fontFamily={numeric.fontFamily} fontSize="25" fontWeight="600" fill={COLORS.ink}>{valueText(key)}</text>
        {delta && <text x={x} y={y + 30} textAnchor={anchor} fontFamily={FONT_BODY} fontSize="15" fontWeight="600" fill={COLORS.inkSoft}>{delta}</text>}
      </g>
    );
  };

  const insideLabel = (key, at, size) => {
    const delta = wide ? deltaText?.(key) : null;
    return (
      <g key={key} pointerEvents="none">
        {wide && <text x={at[0]} y={at[1] - 10} textAnchor="middle" fontFamily={FONT_BODY} fontSize={size} fontWeight="700" fill={COLORS.ink} style={halo}>{short(key)}</text>}
        <text x={at[0]} y={at[1] + (wide ? 18 : 5)} textAnchor="middle" fontFamily={numeric.fontFamily} fontSize={wide ? size + 6 : size} fontWeight="600" fill={COLORS.ink} style={halo}>{valueText(key)}</text>
        {delta && <text x={at[0]} y={at[1] + 40} textAnchor="middle" fontFamily={FONT_BODY} fontSize="17" fontWeight="600" fill={COLORS.ink} style={halo}>{delta}</text>}
      </g>
    );
  };

  const viewBox = wide ? `${WIDE_BOX.x} 0 ${WIDE_BOX.w} ${geo.height}` : `0 0 ${geo.width} ${geo.height}`;

  return (
    <div data-map-box ref={boxRef} style={{ position: "relative" }}>
      {view === "map" ? (
        <svg viewBox={viewBox} width="100%" style={{ display: "block", maxHeight: wide ? "min(820px, 88vh)" : "min(680px, 82vh)", margin: "0 auto", overflow: "visible" }} role="group" aria-label="Map of the regions and nations of the UK">
          <g>
            {geo.regions.map((r, i) => (
              <path
                key={r.key}
                d={r.d}
                {...handlers(r.key)}
                className="rm-in"
                style={{
                  "--i": i, fill: fill(r.key), stroke: outline(r.key), strokeWidth: selected === r.key ? 3 : hover === r.key ? 2.2 : 1.6, strokeLinejoin: "round", cursor: "pointer",
                  transition: smooth ? "fill 0.45s ease, stroke 0.15s" : "stroke 0.15s", transformBox: "fill-box", transformOrigin: "center", outline: "none",
                  filter: hover === r.key || selected === r.key ? "drop-shadow(0 4px 8px rgba(0,0,0,0.35))" : undefined,
                }}
              />
            ))}
            {/* London is tiny at this scale, so it also gets a marker you can actually hit. */}
            <g className="rm-in" style={{ "--i": 12 }}>
              <circle
                cx={LONDON.cx} cy={LONDON.cy} r="16" pointerEvents="none"
                style={{ fill: fill("london"), stroke: outline("london"), strokeWidth: selected === "london" ? 3 : 2, transition: smooth ? "fill 0.45s ease" : "none" }}
              />
              {/* A bigger invisible circle, so there is a comfortable target for a finger. */}
              <circle cx={LONDON.cx} cy={LONDON.cy} r="26" {...handlers("london")} style={{ fill: "transparent", cursor: "pointer", outline: "none" }} />
              {!wide && <text x={LONDON.cx} y={LONDON.cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fontFamily={FONT_BODY} fill={COLORS.paper} stroke={COLORS.ink} strokeWidth="2.6" paintOrder="stroke" pointerEvents="none">L</text>}
            </g>
            {wide ? (
              <>
                {Object.keys(SLOTS).map(sideLabel)}
                {insideLabel("scotland", [byKey.scotland.cx, byKey.scotland.cy - 14], 22)}
              </>
            ) : (
              <>
                {geo.regions.map((r) => {
                  const at = COMPACT[r.key] ?? [r.cx, r.cy];
                  return insideLabel(r.key, at, 15);
                })}
              </>
            )}
          </g>
        </svg>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(5, minmax(0, 1fr))", gap: 8, maxWidth: 620, margin: "0 auto" }}>
          {regions.map((r, i) => (
            <div
              key={r.key}
              {...handlers(r.key)}
              className="rm-in"
              style={{
                "--i": i, gridColumn: r.tile[0] + 1, gridRow: r.tile[1] + 1, aspectRatio: "1 / 1", borderRadius: 14, background: fill(r.key), cursor: "pointer", outline: "none",
                border: `2px solid ${selected === r.key ? accent : hover === r.key ? COLORS.ink : "transparent"}`, transition: smooth ? "background 0.45s ease, border-color 0.15s" : "border-color 0.15s",
                display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "8px 9px", minWidth: 0, overflow: "hidden",
              }}
            >
              <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.ink, textShadow: "0 0 4px var(--c-paper, #fff), 0 0 2px var(--c-paper, #fff)", lineHeight: 1.2 }}>{r.short}</span>
              <span style={{ ...numeric, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, textShadow: "0 0 4px var(--c-paper, #fff), 0 0 2px var(--c-paper, #fff)" }}>{valueText(r.key)}</span>
              {deltaText?.(r.key) && <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 600, color: COLORS.ink, textShadow: "0 0 4px var(--c-paper, #fff), 0 0 2px var(--c-paper, #fff)" }}>{deltaText(r.key)}</span>}
            </div>
          ))}
        </div>
      )}
      {view === "map" && !wide && hover && <Tooltip at={point} name={name(hover)} text={valueText(hover)} />}
    </div>
  );
}

export default memo(RegionMap);
