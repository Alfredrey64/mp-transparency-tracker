import { memo, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { hexPoints, hexPosition, ZOOMS } from "../lib/seatMap";
import { flatHexPoints, flatHexPosition } from "../lib/electionHistory";
import { scrollRegion } from "../lib/a11y";

// A hexagon map of the seats for the General elections page. Every seat is the same size, so a crowded city counts as much as a
// whole Highland county. `seats` is [[code, name, q, r, region]]; `paint(index)` says what colour a seat is (and an optional note for
// the hover card); the page decides what is selected.

const SIZE = 1;

const Hexes = memo(function Hexes({ cells, flat, box }) {
  return (
    <g>
      {cells.map((c) => (
        <polygon
          key={c.code}
          data-i={c.i}
          className="seat-sweep"
          points={(flat ? flatHexPoints : hexPoints)(c.x, c.y, SIZE * (flat ? 0.96 : 0.97))}
          fill={c.fill}
          style={{ opacity: c.dim ? 0.18 : 1, transition: "fill 0.3s, opacity 0.2s", cursor: "pointer", animationDelay: `${(((c.x - box.minX) / box.width) * 1.0).toFixed(3)}s` }}
        />
      ))}
    </g>
  );
});

const zoomButton = { width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, cursor: "pointer", fontSize: 18, lineHeight: 1 };

export default function ElectionMap({ seats, flat, paint, selected, onSelect, label, compact = false }) {
  const [zoom, setZoom] = useState(0);
  const [hover, setHover] = useState(null);

  const geometry = useMemo(() => {
    const cells = seats.map(([code, name, q, r], i) => ({ code, name, i, ...(flat ? flatHexPosition(q, r, SIZE) : hexPosition(q, r, SIZE)) }));
    const pad = SIZE * 1.2;
    const xs = cells.map((c) => c.x);
    const ys = cells.map((c) => c.y);
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    return { cells, box: { minX, minY, width: Math.max(...xs) + pad - minX, height: Math.max(...ys) + pad - minY } };
  }, [seats, flat]);

  const painted = useMemo(
    () => geometry.cells.map((c) => ({ ...c, ...paint(c.i) })),
    [geometry, paint],
  );

  const { box } = geometry;
  const at = (e) => {
    const i = e.target?.dataset?.i;
    return i === undefined ? null : Number(i);
  };
  const hovered = hover != null ? painted[hover] : null;
  const picked = selected != null ? painted[selected] : null;
  const level = ZOOMS[Math.min(zoom, ZOOMS.length - 1)];

  return (
    <div style={{ position: "relative", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: 8 }}>
      <div {...scrollRegion("Map, scrollable")} style={{ overflow: "auto", maxHeight: compact ? 360 : "min(78vh, 760px)", borderRadius: 12 }}>
        <svg
          role="img"
          aria-label={label}
          viewBox={`${box.minX} ${box.minY} ${box.width} ${box.height}`}
          style={{ width: zoom === 0 ? `min(100%, calc(${compact ? 44 : 70}vh * ${(box.width / box.height).toFixed(3)}))` : `${level * 100}%`, height: "auto", display: "block", margin: "0 auto", touchAction: "manipulation" }}
          onMouseOver={(e) => { const i = at(e); if (i != null) setHover(i); }}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => { const i = at(e); if (i != null && onSelect) onSelect(i); }}
        >
          <Hexes cells={painted} flat={flat} box={box} />
          {picked && <polygon points={(flat ? flatHexPoints : hexPoints)(picked.x, picked.y, SIZE * 1.18)} fill="none" stroke={COLORS.ink} strokeWidth={0.4} style={{ pointerEvents: "none" }} />}
        </svg>
      </div>
      {!compact && (
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          <button type="button" aria-label="Zoom in" disabled={zoom >= ZOOMS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} style={zoomButton}>+</button>
          <button type="button" aria-label="Zoom out" disabled={zoom <= 0} onClick={() => setZoom((z) => Math.max(0, z - 1))} style={zoomButton}>−</button>
        </div>
      )}
      {hovered && hovered.i !== selected && (
        <div aria-hidden="true" style={{ position: "absolute", left: 14, bottom: 14, maxWidth: "calc(100% - 28px)", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${hovered.swatch ?? COLORS.hairline}`, borderRadius: 10, padding: "7px 12px", pointerEvents: "none" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.2 }}>{hovered.name}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{hovered.note}</div>
        </div>
      )}
    </div>
  );
}
