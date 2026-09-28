import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
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

function computeSeatPositions(total) {
  const radii = Array.from({ length: ROWS }, (_, i) => INNER_RADIUS + i * ROW_STEP);
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

export function PartyHemicycle({ politicians, onSelectParty }) {
  const [hoveredParty, setHoveredParty] = useState(null);

  const parties = useMemo(() => {
    const counts = new Map();
    for (const p of politicians) {
      const name = p.party ?? "Independent";
      if (!counts.has(name)) counts.set(name, { name, count: 0, color: partyColour(p.party_colour, COLORS.inkSoft) });
      counts.get(name).count += 1;
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [politicians]);

  const total = politicians.length;

  const seatData = useMemo(() => {
    if (total === 0) return [];
    const positions = computeSeatPositions(total);
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
  }, [parties, total]);

  if (total === 0) return null;

  const maxRadius = INNER_RADIUS + (ROWS - 1) * ROW_STEP + SEAT_RADIUS;
  const viewW = maxRadius * 2 + 20;
  const viewH = maxRadius + 20;

  return (
    <div>
      <svg
        viewBox={`${-viewW / 2} ${-viewH + 10} ${viewW} ${viewH}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        {seatData.map((seat, i) => {
          const dimmed = hoveredParty && seat.party !== hoveredParty;
          return (
            <motion.circle
              key={i}
              cx={seat.x}
              cy={seat.y}
              r={SEAT_RADIUS}
              fill={seat.color}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.0014, ease: "backOut" }}
              style={{ transition: "opacity 0.15s" }}
            />
          );
        })}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 18, justifyContent: "center" }}>
        {parties.slice(0, 8).map((p) => (
          <button
            key={p.name}
            onClick={() => onSelectParty?.(p.name)}
            onMouseEnter={() => setHoveredParty(p.name)}
            onMouseLeave={() => setHoveredParty(null)}
            style={{
              display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: 0,
              cursor: onSelectParty ? "pointer" : "default", opacity: hoveredParty && hoveredParty !== p.name ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>{p.name}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.inkSoft }}>{p.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PartyHemicycleSection({ politicians, onSelectParty }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, marginBottom: 4, textAlign: "center" }}>
        The Commons, seat by seat
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, textAlign: "center", marginBottom: 8 }}>
        Every current seat, coloured by party — hover a party below to pick it out.
      </div>
      <PartyHemicycle politicians={politicians} onSelectParty={onSelectParty} />
    </div>
  );
}
