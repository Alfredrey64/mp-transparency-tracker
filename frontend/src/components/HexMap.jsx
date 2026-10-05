import { useEffect, useRef, memo } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { hexPoints, ZOOMS } from "../lib/seatMap";

// The hexagon map itself: 650 equal hexagons painted by the chosen view, with
// zoom buttons, a ring on the selected seat and a preview card for the seat
// under the pointer. The page decides what is selected; this only draws.

const SIZE = 1;

// The hexagons. Memoised so hovering (which changes page state) doesn't
// redraw all 650 polygons.
const HexLayer = memo(function HexLayer({ cells, mode, dimmed, bounds }) {
  return (
    <g>
      {cells.map((c) => {
        const delay = ((c.x - bounds.minX) / bounds.width) * 1.1;
        return (
          <polygon
            key={c.code}
            data-code={c.code}
            className="seat-sweep"
            points={hexPoints(c.x, c.y, SIZE * 0.97)}
            fill={mode.colour(c)}
            style={{ transition: "fill 0.35s, opacity 0.2s", opacity: dimmed(c) ? 0.14 : 1, animationDelay: `${delay.toFixed(3)}s`, cursor: "pointer" }}
          />
        );
      })}
    </g>
  );
});

function HoverCard({ cell }) {
  if (!cell) return null;
  const colour = partyColour(cell.mp?.colour, COLORS.inkSoft);
  const r = cell.result;
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: 14, bottom: 14, maxWidth: "calc(100% - 28px)", display: "flex", alignItems: "center", gap: 10, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${colour}`, borderRadius: 12, padding: "9px 14px 9px 10px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)", pointerEvents: "none" }}
    >
      {cell.mp?.thumbnail ? (
        <img src={cell.mp.thumbnail} alt="" width={40} height={40} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />
      ) : (
        <span style={{ width: 40, height: 40, borderRadius: "50%", background: `${colour}33`, flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cell.seatName}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {cell.mp ? `${cell.mp.name} · ${cell.mp.party}` : "No MP matched"}
        </div>
        {r && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 1 }}>
            <span style={{ ...numeric, color: COLORS.ink, fontWeight: 600 }}>{r.majorityPct != null && r.majorityPct < 1 ? r.majorityPct.toFixed(2) : r.majorityPct?.toFixed(1)}%</span> lead · <span style={{ ...numeric, color: COLORS.ink, fontWeight: 600 }}>{r.turnoutPct?.toFixed(1)}%</span> turnout
          </div>
        )}
      </div>
    </div>
  );
}

const zoomButton = {
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, cursor: "pointer", fontSize: 18, lineHeight: 1,
};

export default function HexMap({ cells, bounds, mode, dimmed, selected, hoverCell, byCode, onSelect, onHover, zoom, setZoom }) {
  const scroller = useRef(null);
  const level = ZOOMS[Math.min(zoom, ZOOMS.length - 1)];

  // Bring the selected seat to the middle of the view when zoomed in.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !selected || zoom === 0) return;
    const fx = (selected.x - bounds.minX) / bounds.width;
    const fy = (selected.y - bounds.minY) / bounds.height;
    el.scrollTo({ left: fx * el.scrollWidth - el.clientWidth / 2, top: fy * el.scrollHeight - el.clientHeight / 2, behavior: "smooth" });
  }, [selected, zoom, bounds]);

  const codeOf = (e) => {
    const code = e.target?.dataset?.code;
    return code && byCode.has(code) ? code : null;
  };

  return (
    <div style={{ position: "relative", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: 8 }}>
      <div ref={scroller} style={{ overflow: "auto", maxHeight: "min(80vh, 820px)", borderRadius: 12 }}>
        <svg
          role="img"
          aria-label={`Hexagon map of the 650 constituencies, coloured by the "${mode.label}" view. Use the search box to find a seat.`}
          viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
          style={{ width: zoom === 0 ? `min(100%, calc(76vh * ${(bounds.width / bounds.height).toFixed(3)}))` : `${level * 100}%`, height: "auto", display: "block", margin: "0 auto", touchAction: "manipulation" }}
          onMouseOver={(e) => {
            const code = codeOf(e);
            if (code) onHover(code);
          }}
          onMouseLeave={() => onHover(null)}
          onClick={(e) => {
            const code = codeOf(e);
            if (code) onSelect(code);
          }}
        >
          <HexLayer cells={cells} mode={mode} dimmed={dimmed} bounds={bounds} />
          {selected && <polygon points={hexPoints(selected.x, selected.y, SIZE * 1.15)} fill="none" stroke={COLORS.ink} strokeWidth={0.4} style={{ pointerEvents: "none" }} />}
        </svg>
      </div>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 4 }}>
        <button type="button" aria-label="Zoom in" disabled={zoom >= ZOOMS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} style={zoomButton}>+</button>
        <button type="button" aria-label="Zoom out" disabled={zoom <= 0} onClick={() => setZoom((z) => Math.max(0, z - 1))} style={zoomButton}>−</button>
      </div>
      <HoverCard cell={hoverCell && hoverCell !== selected ? hoverCell : null} />
    </div>
  );
}
