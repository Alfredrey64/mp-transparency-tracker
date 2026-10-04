import { useState, useEffect, useMemo, useRef, memo } from "react";
import ShareButton from "./ShareButton";
import { mapShareSpec } from "../lib/shareSpecs";
import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../lib/supabasePagination";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { buildCells, boundsOf, hexPoints, MODES, partyKey, normSeat } from "../lib/seatMap";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconHexMap } from "./icons";

// All 650 seats as equal-sized hexagons, laid out so each keeps its
// neighbours and every seat can be seen, which a normal map can't do: the
// big rural seats would drown out the 40-odd that fit inside the M25. Switch
// the view to colour them by party, how safe, who changed hands, turnout, or
// women MPs. Tap a seat for its MP and result.

const SIZE = 1;
const ZOOMS = [1, 1.6, 2.4, 3.6];

const goHash = (hash) => {
  window.location.hash = hash;
};

// The hexagons themselves. Memoised: hovering a seat re-renders the page's
// state, and none of the 650 polygons should be redrawn for that.
const HexLayer = memo(function HexLayer({ cells, mode, focusParty, bounds, animate }) {
  return (
    <g>
      {cells.map((c) => {
        const dimmed = focusParty && mode.key === "party" && (c.mp?.party ?? "Unknown") !== focusParty;
        const delay = ((c.x - bounds.minX) / bounds.width) * 1.1;
        return (
          <polygon
            key={c.code}
            data-code={c.code}
            className={animate ? "seat-sweep" : undefined}
            points={hexPoints(c.x, c.y, SIZE * 0.97)}
            fill={mode.colour(c)}
            style={{ transition: "fill 0.35s, opacity 0.2s", opacity: dimmed ? 0.14 : 1, animationDelay: animate ? `${delay.toFixed(3)}s` : undefined, cursor: "pointer" }}
          />
        );
      })}
    </g>
  );
});

function Legend({ mode, cells, focusParty, onFocusParty }) {
  if (mode.key === "party") {
    const key = partyKey(cells, 9);
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 }}>
        {key.map((p) => {
          const on = focusParty === p.party;
          return (
            <button
              key={p.party}
              type="button"
              aria-pressed={on}
              onClick={() => onFocusParty(on ? null : p.party)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: 0, cursor: "pointer", opacity: focusParty && !on ? 0.45 : 1, transition: "opacity 0.15s" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: p.colour, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, fontWeight: on ? 700 : 400 }}>{p.party}</span>
              <span style={{ ...numeric, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft }}>{p.count}</span>
            </button>
          );
        })}
      </div>
    );
  }
  const l = mode.legend;
  if (!l) return null;
  if (l.type === "ramp") {
    return (
      <div style={{ marginTop: 14, maxWidth: 360 }}>
        <div style={{ height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${l.from}, ${l.to})` }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
          <span>{l.left}</span>
          <span>{l.right}</span>
        </div>
      </div>
    );
  }
  return <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 14 }}>{l.text}</div>;
}

function SeatCard({ cell, pinned, onClear }) {
  if (!cell) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
        Hover over a seat, or tap one, to see who represents it and how it voted.
      </div>
    );
  }
  const colour = partyColour(cell.mp?.colour, COLORS.inkSoft);
  const r = cell.result;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {cell.mp?.thumbnail ? (
          <img src={cell.mp.thumbnail} alt="" width={52} height={52} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${colour}`, flexShrink: 0 }} />
        ) : (
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: `${colour}33`, border: `2px solid ${colour}`, flexShrink: 0, boxSizing: "border-box" }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, lineHeight: 1.2 }}>{cell.seatName}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 3 }}>
            {cell.mp ? (
              <>
                <strong style={{ color: COLORS.ink }}>{cell.mp.name}</strong> · {cell.mp.party}
              </>
            ) : (
              "No MP matched to this seat"
            )}
          </div>
        </div>
        {pinned && (
          <button type="button" onClick={onClear} aria-label="Clear the selected seat" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, fontSize: 18, lineHeight: 1, padding: 2 }}>
            ×
          </button>
        )}
      </div>
      {r && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", marginTop: 12, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
          <span><strong style={{ ...numeric, fontSize: 16, color: COLORS.ink }}>{r.majorityPct != null ? `${r.majorityPct.toFixed(1)}%` : "–"}</strong> lead in 2024</span>
          <span><strong style={{ ...numeric, fontSize: 16, color: COLORS.ink }}>{r.turnoutPct != null ? `${r.turnoutPct.toFixed(1)}%` : "–"}</strong> turnout</span>
          {r.outcome && <span><strong style={{ color: COLORS.ink }}>{r.outcome}</strong></span>}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 12 }}>
        <button type="button" onClick={() => goHash(`#/constituency/${encodeURIComponent(cell.seatName)}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
          Open this seat →
        </button>
        {cell.mp && (
          <button type="button" onClick={() => goHash(`#/mp/${cell.mp.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
            {cell.mp.name}'s profile →
          </button>
        )}
      </div>
    </div>
  );
}

export default function SeatMap({ seat = null }) {
  const [hexes, setHexes] = useState(null);
  const [seats, setSeats] = useState(null);
  const [mps, setMps] = useState(null);
  const [failed, setFailed] = useState(false);
  const [modeKey, setModeKey] = useState("party");
  const [focusParty, setFocusParty] = useState(null);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [zoom, setZoom] = useState(() => (typeof window !== "undefined" && window.innerWidth < 640 ? 2 : 0));
  const [query, setQuery] = useState("");
  const scroller = useRef(null);

  useEffect(() => {
    Promise.all([
      import("../data/seatHexes.json").then((m) => m.default.hexes),
      import("../data/constituencies.json").then((m) => m.default.constituencies),
      fetchAllRows(() => supabase.from("politicians").select("id, name, party, party_colour, constituency, gender, thumbnail_url")),
    ])
      .then(([h, s, p]) => {
        setHexes(h);
        setSeats(s);
        setMps(p);
      })
      .catch(() => setFailed(true));
  }, []);

  const cells = useMemo(() => (hexes && seats && mps ? buildCells(hexes, seats, mps, SIZE) : []), [hexes, seats, mps]);
  const bounds = useMemo(() => boundsOf(cells, SIZE), [cells]);
  const byCode = useMemo(() => new Map(cells.map((c) => [c.code, c])), [cells]);
  const mode = MODES.find((m) => m.key === modeKey) ?? MODES[0];
  // A link like #/seatmap/Chorley opens with that seat selected.
  const linked = useMemo(() => (seat ? cells.find((c) => normSeat(c.seatName) === normSeat(seat)) ?? null : null), [cells, seat]);
  const active = byCode.get(pinned) ?? byCode.get(hover) ?? linked ?? null;
  const zoomLevel = ZOOMS[Math.min(zoom, ZOOMS.length - 1)];
  const matches = useMemo(() => {
    const q = normSeat(query);
    return q.length < 2 ? [] : cells.filter((c) => normSeat(c.seatName).includes(q) || normSeat(c.mp?.name).includes(q)).slice(0, 6);
  }, [cells, query]);

  function fromEvent(e) {
    const code = e.target?.dataset?.code;
    return code && byCode.has(code) ? code : null;
  }

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconHexMap}
        kicker="Get Involved · Seat Map"
        title="Every seat in the Commons, on one map"
        subtitle="One hexagon for each of the 650 constituencies, all the same size, so a tiny city seat counts as much as a huge rural one. Pick a view to colour them, then tap a seat to see who represents it."
      />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the seat map" /></div>}
      {!failed && cells.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading the map…</div>}

      {cells.length > 0 && (
        <>
          <div role="group" aria-label="Choose a view" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
            {MODES.map((m) => {
              const on = m.key === modeKey;
              return (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setModeKey(m.key);
                    setFocusParty(null);
                  }}
                  style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "8px 16px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? COLORS.accent : COLORS.hairline}`, background: on ? COLORS.accent : "transparent", color: on ? "#fff" : COLORS.inkSoft, transition: "background-color 0.15s, color 0.15s, border-color 0.15s" }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, margin: "12px 0 0", maxWidth: 700 }}>{mode.blurb}</p>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, marginTop: 16 }} className="seatmap-layout">
            <div>
              <div style={{ position: "relative", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: 8 }}>
                <div ref={scroller} style={{ overflow: "auto", maxHeight: "min(80vh, 820px)", borderRadius: 12 }}>
                  <svg
                    role="img"
                    aria-label={`Hexagon map of the 650 constituencies, coloured by the "${mode.label}" view. Use the search box to find a seat.`}
                    viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
                    style={{ width: zoom === 0 ? `min(100%, calc(76vh * ${(bounds.width / bounds.height).toFixed(3)}))` : `${zoomLevel * 100}%`, height: "auto", display: "block", margin: "0 auto", touchAction: "manipulation" }}
                    onMouseOver={(e) => {
                      const code = fromEvent(e);
                      if (code) setHover((h) => (h === code ? h : code));
                    }}
                    onMouseLeave={() => setHover(null)}
                    onClick={(e) => {
                      const code = fromEvent(e);
                      setPinned((p) => (code && p !== code ? code : null));
                    }}
                  >
                    <HexLayer cells={cells} mode={mode} focusParty={focusParty} bounds={bounds} animate />
                    {active && (
                      <polygon points={hexPoints(active.x, active.y, SIZE * 1.12)} fill="none" stroke={COLORS.ink} strokeWidth={0.35} style={{ pointerEvents: "none" }} />
                    )}
                  </svg>
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                  <button type="button" aria-label="Zoom in" disabled={zoom >= ZOOMS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} style={zoomButton}>+</button>
                  <button type="button" aria-label="Zoom out" disabled={zoom <= 0} onClick={() => setZoom((z) => Math.max(0, z - 1))} style={zoomButton}>−</button>
                </div>
              </div>
              <Legend mode={mode} cells={cells} focusParty={focusParty} onFocusParty={setFocusParty} />
              <div style={{ marginTop: 14 }}>
                <ShareButton filename={`seat-map-${mode.key}`} label="Share this map as an image" getSpec={() => mapShareSpec({ cells, mode, key: partyKey(cells, 6), link: window.location.href })} />
              </div>
            </div>

            <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "16px 18px", alignSelf: "start" }}>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a seat or an MP"
                  aria-label="Find a seat or an MP"
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontFamily: FONT_BODY, fontSize: 14, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paper, color: COLORS.ink }}
                />
                {matches.length > 0 && (
                  <div style={{ marginTop: 6, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden", background: COLORS.paper }}>
                    {matches.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className="nclick"
                        onClick={() => {
                          setPinned(c.code);
                          setQuery("");
                        }}
                        style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "8px 12px", cursor: "pointer", color: "inherit" }}
                      >
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{c.seatName}</span>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}> · {c.mp?.name ?? "no MP matched"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <SeatCard cell={active} pinned={Boolean(pinned && byCode.get(pinned))} onClear={() => setPinned(null)} />
            </div>
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 18, maxWidth: 760 }}>
            Seats are placed by hand to stay close to where they really are, so the shape is a rough outline of the UK, not a true map, and distances aren't to scale. Layout
            from Open Innovations' hexagon maps (MIT licence). Results are the 2024 general election; MPs and parties are today's.
          </p>
        </>
      )}
    </div>
  );
}

const zoomButton = {
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, cursor: "pointer", fontSize: 18, lineHeight: 1,
};
