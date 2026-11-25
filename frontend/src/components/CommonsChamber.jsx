import { useState, useEffect, useMemo } from "react";
import { m as motion } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_MONO } from "../theme";
import { partyColour } from "../lib/format";
import { CommonsBadge } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { useGo } from "./story/useGo";
import "../chamber.css";

const PER_ROW = 22;
const SPACING = 15;
const ROW_SPACING = 13;
const DOT_R = 4.5;
// The Government's benches start a little to the right of the centre line, and the Opposition's a little to the left, so the dotted line runs down the aisle between them and not through a row of seats.
const AISLE = 400;
const GOV_X = 418;
const OPP_X = 382;

function packSeats(n, originX, originY, growLeft) {
  const seats = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / PER_ROW);
    const col = i % PER_ROW;
    const x = growLeft ? originX - col * SPACING : originX + col * SPACING;
    const y = originY + row * ROW_SPACING;
    seats.push({ x, y });
  }
  return seats;
}

export default function CommonsChamber() {
  const [politicians, setPoliticians] = useState(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [goRef, go] = useGo(0.3);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("politicians")
        .select("id, name, party, party_colour, constituency, cabinet_role")
        .order("party");
      if (!cancelled) {
        setFailed(Boolean(error));
        setPoliticians(data ?? []);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const layout = useMemo(() => {
    if (!politicians) return null;

    const speaker = politicians.find((p) => p.party === "Speaker");
    const rest = politicians.filter((p) => p.party !== "Speaker");

    const byParty = new Map();
    for (const p of rest) {
      if (!byParty.has(p.party)) byParty.set(p.party, []);
      byParty.get(p.party).push(p);
    }
    const partyGroups = [...byParty.entries()]
      .map(([name, members]) => ({ name, members, color: partyColour(members[0]?.party_colour, COLORS.inkSoft) }))
      .sort((a, b) => b.members.length - a.members.length);

    const government = partyGroups[0] ?? null;
    const opposition = partyGroups.slice(1);

    const pm = rest.find((p) => (p.cabinet_role ?? "").toLowerCase().includes("prime minister"));
    const oppositionLeader = rest.find((p) => (p.cabinet_role ?? "").toLowerCase().includes("leader of the opposition"));

    const govSeats = government
      ? packSeats(government.members.length, GOV_X, 60, false).map((seat, i) => ({ ...seat, mp: government.members[i], color: government.color, g: 0 }))
      : [];

    let oppSeats = [];
    let cursor = 0;
    opposition.forEach((group, gi) => {
      const seats = group.members.map((mp, i) => {
        const idx = cursor + i;
        const row = Math.floor(idx / PER_ROW);
        const col = idx % PER_ROW;
        return { x: OPP_X - col * SPACING, y: 60 + row * ROW_SPACING, mp, color: group.color, g: gi + 1 };
      });
      oppSeats = oppSeats.concat(seats);
      cursor += group.members.length;
    });

    // Each seat appears a moment after the one nearer the aisle, so the benches fill from the middle outwards.
    [...govSeats, ...oppSeats].forEach((seat) => {
      seat.delay = +((Math.abs(seat.x - AISLE) / AISLE) * 0.85 + ((seat.y - 60) % 97) / 1400).toFixed(2);
    });

    const maxRow = Math.max(
      govSeats.length ? Math.ceil(govSeats.length / PER_ROW) : 0,
      oppSeats.length ? Math.ceil(oppSeats.length / PER_ROW) : 0
    );

    return { speaker, government, opposition, pm, oppositionLeader, govSeats, oppSeats, maxRow, partyGroups };
  }, [politicians]);

  if (!layout) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{
          marginTop: 14,
          background: COLORS.paperCard,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 16,
          padding: 14,
          fontFamily: FONT_BODY,
          fontSize: 13.5,
          color: COLORS.inkSoft,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CommonsBadge size={30} />
          Loading the chamber…
        </div>
      </motion.div>
    );
  }

  // An empty chamber (every seat missing) reads as a genuine visual glitch
  // either way, but a failed fetch specifically deserves its own message —
  // an empty diagram with no explanation just looks broken, not "no MPs".
  if (failed) {
    return (
      <div style={{ marginTop: 14 }}>
        <LoadFailedNote item="the Commons seating data" />
      </div>
    );
  }

  const active = hover ?? pinned;
  const chamberHeight = 90 + layout.maxRow * ROW_SPACING;
  const viewBoxHeight = chamberHeight + 40;
  const govTint = `${layout.government?.color ?? COLORS.inkSoft}0f`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        marginTop: 14,
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 16,
        padding: "18px clamp(12px, 3vw, 22px) 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        <CommonsBadge size={30} />
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: COLORS.ink }}>
          The Commons Chamber
        </div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12, marginLeft: 40 }}>
        Live seat count from the current data, grouped by party. Hover a dot to see who it is.
      </div>

      <div ref={goRef} className="chm-plan" data-go={go}>
        <svg
          role="img"
          aria-label="Seating plan of the House of Commons, one dot for each MP, grouped by party. The Government benches are on the right and the Opposition benches on the left."
          width="100%"
          viewBox={`0 0 800 ${viewBoxHeight}`}
          style={{ maxWidth: 780, display: "block", margin: "0 auto" }}
        >
          <g>
          {/* Chamber floor */}
          <rect x={4} y={4} width={792} height={viewBoxHeight - 8} rx={18} fill={COLORS.paper} stroke={COLORS.hairline} strokeWidth={1} />
          <path d={`M${AISLE} 4H778a18 18 0 0 1 18 18V${viewBoxHeight - 22}a18 18 0 0 1-18 18H${AISLE}Z`} fill={govTint} />

          {/* Centre aisle */}
          <line x1={AISLE} y1={54} x2={AISLE} y2={viewBoxHeight - 14} stroke={COLORS.hairline} strokeWidth={1.5} strokeDasharray="3 5" />

          {/* Speaker's chair */}
          <rect x={366} y={20} width={7} height={14} rx={2} fill={COLORS.ink} />
          <rect x={427} y={20} width={7} height={14} rx={2} fill={COLORS.ink} />
          <rect x={372} y={24} width={56} height={10} rx={3} fill={COLORS.ink} />
          <rect x={380} y={7} width={40} height={21} rx={4} fill={COLORS.ink} />
          <text x={400} y={21} textAnchor="middle" fontFamily={FONT_MONO} fontSize={7.5} letterSpacing={0.3} fill="#fff">SPEAKER</text>

          {/* Despatch table */}
          <rect x={350} y={46} width={100} height={7} rx={3} fill={COLORS.hairline} />

          {/* Side labels */}
          <text x={770} y={64} textAnchor="end" fontFamily={FONT_BODY} fontWeight={700} fontSize={12} fill={layout.government?.color ?? COLORS.inkSoft}>
            Government · {layout.government?.name}
          </text>
          <text x={30} y={64} textAnchor="start" fontFamily={FONT_BODY} fontWeight={700} fontSize={12} fill={COLORS.inkSoft}>
            Opposition benches
          </text>

          {/* Seats: one dot for each MP, on their party's benches, filling from the aisle outwards. */}
          {[...layout.govSeats, ...layout.oppSeats].map((seat) => {
            const leader = seat.g === 0 ? layout.pm : layout.oppositionLeader;
            const marked = leader && seat.mp.id === leader.id;
            return (
              <circle
                key={seat.mp.id}
                className="chm-seat"
                cx={seat.x}
                cy={seat.y + 20}
                r={marked ? DOT_R + 1.5 : DOT_R}
                fill={seat.color}
                stroke={marked ? COLORS.ink : "#fff"}
                strokeWidth={marked ? 1.5 : 0.75}
                style={{ "--d": `${seat.delay}s`, "--sc": seat.color, opacity: active == null || active === seat.g ? 1 : 0.14 }}
              >
                <title>{seat.mp.name}, {seat.mp.party}{marked ? (seat.g === 0 ? " (Prime Minister)" : " (Leader of the Opposition)") : ""}</title>
              </circle>
            );
          })}

          {/* Speaker dot */}
          {layout.speaker && (
            <circle
              cx={400}
              cy={40}
              r={5}
              fill={COLORS.ink}
              stroke="#fff"
              strokeWidth={1}
            >
              <title>{layout.speaker.name}, Speaker</title>
            </circle>
          )}
          </g>
        </svg>
      </div>

      <div className="chm-chips" onMouseLeave={() => setHover(null)}>
        {layout.partyGroups.map((g, gi) => (
          <button
            key={g.name}
            type="button"
            className="chm-chip"
            aria-pressed={pinned === gi}
            style={{ "--pc": g.color }}
            onMouseEnter={() => setHover(gi)}
            onFocus={() => setHover(gi)}
            onBlur={() => setHover(null)}
            onClick={() => setPinned((p) => (p === gi ? null : gi))}
          >
            <span className="chm-chip-dot" />
            <span className="chm-chip-name">{g.name}</span>
            <span className="chm-chip-n">{g.members.length}</span>
          </button>
        ))}
      </div>
      <div className="chm-hint">Hover or press a party to find its seats.</div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
        Seats are grouped by party, not individual real assignments. Parliament doesn't publish exactly who sits
        where. The Speaker, and the Prime Minister and Opposition Leader (outlined, where identifiable from the
        data) are placed for illustration.
      </div>
    </motion.div>
  );
}
