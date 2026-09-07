import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_MONO } from "../theme";
import { partyColour } from "../lib/format";
import { CommonsBadge } from "./shared";

const PER_ROW = 22;
const SPACING = 15;
const ROW_SPACING = 13;
const DOT_R = 4.5;

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("politicians")
        .select("id, name, party, party_colour, constituency, cabinet_role")
        .order("party");
      if (!cancelled) setPoliticians(data ?? []);
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
      ? packSeats(government.members.length, 400, 60, false).map((seat, i) => ({ ...seat, mp: government.members[i], color: government.color }))
      : [];

    let oppSeats = [];
    let cursor = 0;
    for (const group of opposition) {
      const seats = group.members.map((mp, i) => {
        const idx = cursor + i;
        const row = Math.floor(idx / PER_ROW);
        const col = idx % PER_ROW;
        return { x: 380 - col * SPACING, y: 60 + row * ROW_SPACING, mp, color: group.color };
      });
      oppSeats = oppSeats.concat(seats);
      cursor += group.members.length;
    }

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

      <div style={{ overflowX: "auto" }}>
        <svg
          width="100%"
          viewBox={`0 0 800 ${viewBoxHeight}`}
          style={{ minWidth: 520, maxWidth: 780, display: "block", margin: "0 auto" }}
        >
          <defs>
            <clipPath id="chamber-reveal">
              <motion.rect
                x={0}
                y={0}
                height={viewBoxHeight}
                initial={{ width: 0 }}
                animate={{ width: 800 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              />
            </clipPath>
          </defs>
          <g clipPath="url(#chamber-reveal)">
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

          {/* Government seats */}
          {layout.govSeats.map((seat) => {
            const isPM = layout.pm && seat.mp.id === layout.pm.id;
            return (
              <circle
                key={seat.mp.id}
                cx={seat.x}
                cy={seat.y + 20}
                r={isPM ? DOT_R + 1.5 : DOT_R}
                fill={seat.color}
                stroke={isPM ? COLORS.ink : "#fff"}
                strokeWidth={isPM ? 1.5 : 0.75}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(seat.mp)}
              >
                <title>{seat.mp.name} — {seat.mp.party}{isPM ? " (Prime Minister)" : ""}</title>
              </circle>
            );
          })}

          {/* Opposition seats */}
          {layout.oppSeats.map((seat) => {
            const isLeader = layout.oppositionLeader && seat.mp.id === layout.oppositionLeader.id;
            return (
              <circle
                key={seat.mp.id}
                cx={seat.x}
                cy={seat.y + 20}
                r={isLeader ? DOT_R + 1.5 : DOT_R}
                fill={seat.color}
                stroke={isLeader ? COLORS.ink : "#fff"}
                strokeWidth={isLeader ? 1.5 : 0.75}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(seat.mp)}
              >
                <title>{seat.mp.name} — {seat.mp.party}{isLeader ? " (Leader of the Opposition)" : ""}</title>
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
              onClick={() => setSelected(layout.speaker)}
            >
              <title>{layout.speaker.name} — Speaker</title>
            </circle>
          )}
          </g>
        </svg>
      </div>

      <motion.div
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
          <span style={{ color: COLORS.inkSoft }}>Click any seat to see who sits there.</span>
        )}
      </motion.div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {layout.partyGroups.map((g) => (
          <div
            key={g.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 11px",
              borderRadius: 999,
              background: `${g.color}12`,
              border: `1px solid ${g.color}30`,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.color, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: COLORS.ink }}>{g.name}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.inkSoft }}>{g.members.length}</span>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginTop: 12, lineHeight: 1.5 }}>
        Seats are grouped by party, not individual real assignments — Parliament doesn't publish exactly who sits
        where. The Speaker, and the Prime Minister and Opposition Leader (outlined, where identifiable from the
        data) are placed for illustration.
      </div>
    </motion.div>
  );
}
