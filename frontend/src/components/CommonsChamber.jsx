import { useState, useEffect, useMemo } from "react";
import { m as motion } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_MONO } from "../theme";
import { partyColour } from "../lib/format";
import { CommonsBadge } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { withScrollPreserved } from "../lib/preserveScroll";
import { useGo } from "./story/useGo";
import { usePhone } from "../lib/usePhone";
import "../chamber.css";

const PER_ROW = 22;
const SPACING = 15;
const ROW_SPACING = 13;
const DOT_R = 4.5;
// Before the MPs take their seats they stand together in one block, 30 to a row, in the middle of the floor. Each then moves to its own seat.
const BLOCK_COLS = 30;
const BLOCK_X = 400;
const BLOCK_Y = 62;

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
  const [selected, setSelected] = useState(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [goRef, go] = useGo(0.3);
  const phone = usePhone();

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
      ? packSeats(government.members.length, 400, 60, false).map((seat, i) => ({ ...seat, mp: government.members[i], color: government.color, g: 0 }))
      : [];

    let oppSeats = [];
    let cursor = 0;
    opposition.forEach((group, gi) => {
      const seats = group.members.map((mp, i) => {
        const idx = cursor + i;
        const row = Math.floor(idx / PER_ROW);
        const col = idx % PER_ROW;
        return { x: 380 - col * SPACING, y: 60 + row * ROW_SPACING, mp, color: group.color, g: gi + 1 };
      });
      oppSeats = oppSeats.concat(seats);
      cursor += group.members.length;
    });

    // Where each seat's MP starts from: the block's places are paired with the seats left to right, so nobody crosses anybody on the way, and the seats nearest the aisle fill first.
    const everySeat = [...govSeats, ...oppSeats];
    const slots = everySeat.map((_, k) => ({ x: BLOCK_X + (k % BLOCK_COLS - (BLOCK_COLS - 1) / 2) * SPACING, y: BLOCK_Y + Math.floor(k / BLOCK_COLS) * ROW_SPACING }));
    const byPlace = (a, b) => a.x - b.x || a.y - b.y;
    const sortedSeats = [...everySeat].sort(byPlace);
    const sortedSlots = [...slots].sort(byPlace);
    sortedSeats.forEach((seat, k) => {
      seat.dx = Math.round(sortedSlots[k].x - seat.x);
      seat.dy = Math.round(sortedSlots[k].y - seat.y);
      seat.delay = +((Math.abs(seat.x - 400) / 400) * 0.85 + ((seat.y - 60) % 97) / 1400).toFixed(2);
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
        Live seat count from the current data, grouped by party
      </div>

      <div ref={goRef} className="chm-plan" data-go={go} data-lite={phone ? "1" : undefined}>
        <svg
          role="img"
          aria-label="Seating plan of the House of Commons, one dot per MP. To read about a member, press a dot, or choose them from the list below the plan."
          width="100%"
          viewBox={`0 0 800 ${viewBoxHeight}`}
          style={{ maxWidth: 780, display: "block", margin: "0 auto" }}
        >
          <g>
          {/* Chamber floor */}
          <rect x={4} y={4} width={792} height={viewBoxHeight - 8} rx={18} fill={COLORS.paper} stroke={COLORS.hairline} strokeWidth={1} />
          <rect x={404} y={4} width={392} height={viewBoxHeight - 8} rx={18} fill={govTint} />

          {/* Centre aisle */}
          <line x1={400} y1={54} x2={400} y2={viewBoxHeight - 14} stroke={COLORS.hairline} strokeWidth={1.5} strokeDasharray="3 5" />

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

          {/* Seats: each MP starts in the block in the middle of the floor and moves to a seat on their party's benches. */}
          {[...layout.govSeats, ...layout.oppSeats].map((seat) => {
            const leader = seat.g === 0 ? layout.pm : layout.oppositionLeader;
            const marked = leader && seat.mp.id === leader.id;
            const chosen = selected && seat.mp.id === selected.id;
            return (
              <circle
                key={seat.mp.id}
                className="chm-seat"
                cx={seat.x}
                cy={seat.y + 20}
                r={marked || chosen ? DOT_R + 1.5 : DOT_R}
                fill={seat.color}
                stroke={marked || chosen ? COLORS.ink : "#fff"}
                strokeWidth={marked || chosen ? 1.5 : 0.75}
                style={{ cursor: "pointer", "--dx": `${seat.dx}px`, "--dy": `${seat.dy}px`, "--d": `${seat.delay}s`, "--sc": seat.color, opacity: active == null || active === seat.g ? 1 : 0.14 }}
                onClick={() => withScrollPreserved(() => setSelected(seat.mp))}
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
              style={{ cursor: "pointer" }}
              onClick={() => withScrollPreserved(() => setSelected(layout.speaker))}
            >
              <title>{layout.speaker.name}, Speaker</title>
            </circle>
          )}
          </g>
        </svg>
      </div>

      <motion.div
        role="status"
        aria-live="polite"
        initial={false}
        animate={{ opacity: 1 }}
        style={{
          marginTop: 14,
          minHeight: 50,
          background: COLORS.paper,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: FONT_BODY,
          fontSize: 13,
          color: COLORS.ink,
        }}
      >
        {selected ? (
          <div>
            <strong>{selected.name}</strong>
            <span style={{ color: COLORS.inkSoft }}> · {selected.party} · {selected.constituency}</span>
            {selected.cabinet_role && <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 2 }}>{selected.cabinet_role}</div>}
          </div>
        ) : (
          <span style={{ color: COLORS.inkSoft }}>Click any seat, or choose an MP from the list below, to see who sits there.</span>
        )}
      </motion.div>

      <div style={{ marginTop: 10 }}>
        <label htmlFor="chamber-pick" style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 4 }}>Or choose an MP from a list</label>
        <select
          id="chamber-pick"
          value={selected?.id ?? ""}
          onChange={(e) => setSelected(politicians.find((p) => String(p.id) === e.target.value) ?? null)}
          style={{ width: "100%", maxWidth: 420, boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 16 }}
        >
          <option value="">Choose an MP</option>
          {[...politicians].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.party})</option>
          ))}
        </select>
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
