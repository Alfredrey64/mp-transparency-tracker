import { memo, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { hexPoints, hexPosition } from "../lib/seatMap";
import { flatHexPoints, flatHexPosition } from "../lib/electionHistory";
import { scrollRegion } from "../lib/a11y";
import { useMapGestures } from "../lib/useMapGestures";

// A hexagon map of the seats for the General elections page. Every seat is the same size, so a crowded city counts as much as a
// whole Highland county. `seats` is [[code, name, q, r, region]]; `paint(index)` says what colour a seat is (and an optional note for
// the hover card); the page decides what is selected. On a phone: pinch to zoom, press and hold a seat to pin its card.

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

// The scrolling box. It takes the gesture hook's callback as an ordinary prop and hands it to the element as its ref.
function ScrollBox({ attach, children, ...rest }) {
  return <div ref={attach} {...rest}>{children}</div>;
}

const zoomButton = { width: 36, height: 36, borderRadius: 9, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, cursor: "pointer", fontSize: 19, lineHeight: 1 };

export default function ElectionMap({ seats, flat, paint, selected, onSelect, label, compact = false }) {
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

  const painted = useMemo(() => geometry.cells.map((c) => ({ ...c, ...paint(c.i) })), [geometry, paint]);
  const { box } = geometry;
  const at = (e) => {
    const i = e.target?.dataset?.i;
    return i === undefined ? null : Number(i);
  };
  const g = useMapGestures({ aspect: box.width / box.height, vh: compact ? 0.44 : 0.7, readKey: at });

  const cardIndex = g.held ?? hover;
  const card = cardIndex != null ? painted[cardIndex] : null;
  const picked = selected != null ? painted[selected] : null;

  return (
    <div style={{ position: "relative", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: 8 }}>
      <ScrollBox attach={g.attachScroller} {...scrollRegion("Map, scrollable")} style={{ overflow: "auto", maxHeight: compact ? 360 : "min(78vh, 760px)", borderRadius: 12, touchAction: "pan-x pan-y", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}>
        <svg
          role="img"
          aria-label={label}
          viewBox={`${box.minX} ${box.minY} ${box.width} ${box.height}`}
          style={{ width: g.width || "100%", height: "auto", display: "block", margin: g.scale > 1.02 ? 0 : "0 auto", touchAction: "manipulation" }}
          onMouseOver={(e) => { const i = at(e); if (i != null) setHover(i); }}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            if (g.consumeClick()) return;
            const i = at(e);
            if (g.held != null) g.clearHeld();
            if (i != null && onSelect) onSelect(i);
          }}
          {...g.holdProps}
        >
          <Hexes cells={painted} flat={flat} box={box} />
          {picked && <polygon points={(flat ? flatHexPoints : hexPoints)(picked.x, picked.y, SIZE * 1.18)} fill="none" stroke={COLORS.ink} strokeWidth={0.4} style={{ pointerEvents: "none" }} />}
          {g.held != null && painted[g.held] && <polygon points={(flat ? flatHexPoints : hexPoints)(painted[g.held].x, painted[g.held].y, SIZE * 1.3)} fill="none" stroke={COLORS.ink} strokeWidth={0.55} strokeDasharray="1.2 0.9" style={{ pointerEvents: "none" }} />}
        </svg>
      </ScrollBox>
      {!compact && (
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          <button type="button" aria-label="Zoom in" disabled={!g.canZoomIn} onClick={g.zoomIn} style={zoomButton}>+</button>
          <button type="button" aria-label="Zoom out" disabled={!g.canZoomOut} onClick={g.zoomOut} style={zoomButton}>−</button>
        </div>
      )}
      {card && card.i !== selected && (
        <div aria-hidden="true" style={{ position: "absolute", left: 14, bottom: 14, maxWidth: "calc(100% - 28px)", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${card.swatch ?? COLORS.hairline}`, borderRadius: 10, padding: "7px 12px", pointerEvents: "none", boxShadow: g.held != null ? "0 10px 24px -12px rgba(0,0,0,0.5)" : "none" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.2 }}>{card.name}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{card.note}</div>
          {g.held != null && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>Tap the seat to select it</div>}
        </div>
      )}
    </div>
  );
}
