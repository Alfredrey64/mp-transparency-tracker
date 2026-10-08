import { useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, numeric } from "../theme";
import { partyColour } from "../lib/format";

// A real chamber seating chart, not a bar or donut standing in for one —
// the single most recognisable diagram in UK politics (the shape every
// election-night results graphic uses), built here from the same live
// party-count data the rest of the site already has, not hardcoded.
//
// Seats are laid out in concentric rows (a "dome" opening upward, flat
// side at the bottom — the standard hemicycle convention), then coloured
// by sorting every seat across every row by its angle and walking parties
// (largest first) through that single angle-ordered list. That's what
// makes each party's seats fall into one contiguous wedge sweeping across
// the whole dome, the way a real results chart reads, rather than
// scattered per-row like a stadium seating plan would be.
const ROWS = 9;
const INNER_RADIUS = 66;
const ROW_STEP = 25;
const SEAT_RADIUS = 6.2;
// How long the opening sweep takes to cross the dome, left to right.
const SWEEP_SECONDS = 1;

function computeSeatPositions(total, rows = ROWS) {
  const radii = Array.from({ length: rows }, (_, i) => INNER_RADIUS + i * ROW_STEP);
  const totalRadius = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.max(1, Math.round((r / totalRadius) * total)));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  let idx = counts.length - 1;
  while (diff !== 0) {
    counts[idx] = Math.max(1, counts[idx] + (diff > 0 ? 1 : -1));
    diff += diff > 0 ? -1 : 1;
    idx = (idx - 1 + counts.length) % counts.length;
  }

  const seats = [];
  radii.forEach((r, rowIndex) => {
    const n = counts[rowIndex];
    for (let s = 0; s < n; s++) {
      const angle = n === 1 ? Math.PI / 2 : Math.PI * (1 - s / (n - 1));
      seats.push({ angle, x: r * Math.cos(angle), y: -r * Math.sin(angle), row: rowIndex });
    }
  });
  return seats.sort((a, b) => a.angle - b.angle);
}

// `rows` is how many concentric rows the dome has: fewer for a small body (a
// council of 57), the default for the Commons.
export function PartyHemicycle({ politicians, onSelectParty, noPartyLabel = "Independent", legendCount = 8, centre = null, rows: rowCount = ROWS, maxWidth = null }) {
  const [hoveredParty, setHoveredParty] = useState(null);
  // The seats sweep in from the left the first time the dome scrolls into
  // view. Until then they are held invisible, so nothing flashes on first paint.
  const wrapRef = useRef(null);
  const inView = useInView(wrapRef, { once: true, margin: "0px 0px -8% 0px" });
  const reduce = useReducedMotion();
  const shown = inView || reduce;

  const parties = useMemo(() => {
    const counts = new Map();
    for (const p of politicians) {
      const name = p.party ?? noPartyLabel;
      if (!counts.has(name)) counts.set(name, { name, count: 0, color: partyColour(p.party_colour, COLORS.inkSoft) });
      counts.get(name).count += 1;
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [politicians, noPartyLabel]);

  const total = politicians.length;

  const seatData = useMemo(() => {
    if (total === 0) return [];
    const positions = computeSeatPositions(total, rowCount);
    const out = [];
    let cursor = 0;
    for (const party of parties) {
      for (let i = 0; i < party.count; i++) {
        const pos = positions[cursor];
        if (pos) out.push({ ...pos, party: party.name, color: party.color });
        cursor++;
      }
    }
    return out;
  }, [parties, total, rowCount]);

  if (total === 0) return null;

  const maxRadius = INNER_RADIUS + (rowCount - 1) * ROW_STEP + SEAT_RADIUS;
  const viewW = maxRadius * 2 + 20;
  const viewH = maxRadius + 20;

  return (
    <div style={maxWidth ? { maxWidth, margin: "0 auto" } : undefined}>
      <div ref={wrapRef} style={{ position: "relative" }}>
      <svg
        viewBox={`${-viewW / 2} ${-viewH + 10} ${viewW} ${viewH}`}
        style={{ width: "100%", height: "auto", overflow: "visible", display: "block" }}
      >
        {/* The entrance is a sweep: every seat fades and rises into place on
            a delay set by its angle, so a wave crosses the dome from the
            left edge over the top to the right edge, rippling outwards
            through the rows. It is plain CSS (see .seat-sweep), one
            animation per seat with no JavaScript per frame; once it has
            run, the inline opacity below is what controls the hover-dim. */}
        <g style={{ opacity: shown ? 1 : 0 }}>
          {seatData.map((seat, i) => {
            const dimmed = hoveredParty && seat.party !== hoveredParty;
            const delay = (1 - seat.angle / Math.PI) * SWEEP_SECONDS + seat.row * 0.014;
            return (
              <circle
                key={i}
                className={shown && !reduce ? "seat-sweep" : undefined}
                cx={seat.x}
                cy={seat.y}
                r={SEAT_RADIUS}
                fill={seat.color}
                style={{ opacity: dimmed ? 0.18 : 1, transition: "opacity 0.15s", animationDelay: `${delay.toFixed(3)}s` }}
              />
            );
          })}
        </g>
      </svg>
      {/* An optional figure set inside the dome, where the empty floor of the
          chamber is — the way an election-night graphic puts the seat count. */}
      {centre && (
        <div className={shown && !reduce ? "hemi-fade" : undefined} style={{ position: "absolute", left: "50%", bottom: "1%", transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none", opacity: shown ? 1 : 0 }}>
          {centre}
        </div>
      )}
      </div>

      <div className={shown && !reduce ? "hemi-fade hemi-legend" : undefined} style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", marginTop: 14, justifyContent: "center", opacity: shown ? 1 : 0 }}>
        {parties.slice(0, legendCount).map((p) => (
          <button
            key={p.name}
            onClick={(e) => onSelectParty?.(p.name, e)}
            onMouseEnter={() => setHoveredParty(p.name)}
            onMouseLeave={() => setHoveredParty(null)}
            style={{
              display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: "7px 2px",
              cursor: onSelectParty ? "pointer" : "default", opacity: hoveredParty && hoveredParty !== p.name ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>{p.name}</span>
            <span style={{ ...numeric, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft }}>{p.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PartyHemicycleSection({
  politicians,
  onSelectParty,
  heading = "The Commons, seat by seat",
  subtitle = "Every current seat, coloured by party — hover a party below to pick it out.",
  noPartyLabel = "Independent",
  legendCount = 8,
  maxWidth = null,
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 4, textAlign: "center" }}>
        {heading}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, textAlign: "center", marginBottom: 8 }}>
        {subtitle}
      </div>
      <PartyHemicycle politicians={politicians} onSelectParty={onSelectParty} noPartyLabel={noPartyLabel} legendCount={legendCount} maxWidth={maxWidth} />
    </div>
  );
}
