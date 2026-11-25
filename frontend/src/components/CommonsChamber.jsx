import { useState, useEffect, useMemo } from "react";
import { m as motion } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_MONO } from "../theme";
import { partyColour } from "../lib/format";
import { CommonsBadge } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { useGo } from "./story/useGo";
import { usePhone } from "../lib/usePhone";
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

// On a phone the chamber is turned side-on: the Government's benches in a block at the top, the aisle across the middle and the Opposition's block under it, so the dots are big enough to see
// and each side's total sits above its own block instead of in a corner among the seats.
const P_W = 340;
const P_PER = 19;
const P_SP = 16.5;
const P_ROW = 14;
const P_X0 = (P_W - (P_PER - 1) * P_SP) / 2;

function phonePlan(layout) {
  const govRows = Math.max(1, Math.ceil(layout.govSeats.length / P_PER));
  const oppRows = Math.max(1, Math.ceil(layout.oppSeats.length / P_PER));
  const aisle = 118 + (govRows - 1) * P_ROW;
  const oppTop = aisle + 104;
  const gov = layout.govSeats.map((seat, i) => {
    const row = Math.floor(i / P_PER);
    return { ...seat, x: P_X0 + (i % P_PER) * P_SP, y: aisle - 14 - row * P_ROW, delay: +(row * 0.045 + (i % P_PER) * 0.01).toFixed(2) };
  });
  const opp = layout.oppSeats.map((seat, i) => {
    const row = Math.floor(i / P_PER);
    return { ...seat, x: P_X0 + (i % P_PER) * P_SP, y: oppTop + row * P_ROW, delay: +(row * 0.045 + (i % P_PER) * 0.01).toFixed(2) };
  });
  return { gov, opp, aisle, oppTop, govRows, oppRows, height: oppTop + oppRows * P_ROW + 12 };
}

export default function CommonsChamber() {
  const phone = usePhone();
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

    // Labour (Co-op) MPs are Labour MPs (the Co-operative Party works with Labour), so they sit with Labour in the plan; otherwise 43 government MPs would be drawn on the opposition benches.
    const groupName = (party) => (party === "Labour (Co-op)" ? "Labour" : party);
    const byParty = new Map();
    for (const p of rest) {
      const key = groupName(p.party);
      if (!byParty.has(key)) byParty.set(key, []);
      byParty.get(key).push(p);
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
  // The Speaker does not vote, so a majority of the MPs who do: the seats drawn plus the Speaker, divided in half, plus one.
  const total = layout.govSeats.length + layout.oppSeats.length + (layout.speaker ? 1 : 0);
  const majority = Math.floor(total / 2) + 1;
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

      <div ref={goRef} className="chm-plan" data-go={go} data-phone={phone ? "1" : undefined}>
        {phone ? (() => {
          const pp = phonePlan(layout);
          const gc = layout.government?.color ?? COLORS.inkSoft;
          const seatsP = [...pp.gov, ...pp.opp];
          return (
            <svg role="img" aria-label="Seating plan of the House of Commons, one dot for each MP, grouped by party. The Government benches are in the top block and the Opposition benches in the block below it." width="100%" viewBox={`0 0 ${P_W} ${pp.height}`} style={{ display: "block", margin: "0 auto" }}>
              <rect x={2} y={2} width={P_W - 4} height={pp.height - 4} rx={16} fill={COLORS.paper} stroke={COLORS.hairline} strokeWidth={1} />
              <path d={`M2 ${pp.aisle}V18a16 16 0 0 1 16-16H${P_W - 18}a16 16 0 0 1 16 16V${pp.aisle}Z`} fill={`${gc}0f`} />
              <line x1={14} y1={pp.aisle} x2={P_W - 14} y2={pp.aisle} stroke={COLORS.hairline} strokeWidth={1.5} strokeDasharray="3 5" />
              {/* Speaker's chair, at the head of the aisle */}
              <rect x={P_W / 2 - 22} y={pp.aisle - 11} width={44} height={22} rx={5} fill={COLORS.ink} />
              <text x={P_W / 2} y={pp.aisle + 3} textAnchor="middle" fontFamily={FONT_MONO} fontSize={8.5} letterSpacing={0.3} fill="#fff">SPEAKER</text>
              {layout.speaker && <title>{layout.speaker.name}, Speaker</title>}
              {/* The size of each side, above its own block */}
              <g className="chm-count" aria-hidden="true">
                <text x={P_X0 - 6} y={26} fontFamily={FONT_BODY} fontWeight={700} fontSize={13} fill={gc}>Government · {layout.government?.name}</text>
                <text x={P_X0 - 6} y={62} className="chm-count-n" fill={gc}>{layout.govSeats.length}</text>
                <text x={P_X0 + 66} y={56} className="chm-count-l" fill={COLORS.inkSoft}>{layout.government?.name} MPs,</text>
                <text x={P_X0 + 66} y={70} className="chm-count-l" fill={COLORS.inkSoft}>the Government side</text>
                <text x={P_X0 - 6} y={pp.aisle + 40} fontFamily={FONT_BODY} fontWeight={700} fontSize={13} fill={COLORS.inkSoft}>Opposition benches</text>
                <text x={P_X0 - 6} y={pp.aisle + 76} className="chm-count-n" fill={COLORS.ink}>{layout.oppSeats.length}</text>
                <text x={P_X0 + 66} y={pp.aisle + 70} className="chm-count-l" fill={COLORS.inkSoft}>MPs on the</text>
                <text x={P_X0 + 66} y={pp.aisle + 84} className="chm-count-l" fill={COLORS.inkSoft}>Opposition benches</text>
              </g>
              {seatsP.map((seat) => {
                const leader = seat.g === 0 ? layout.pm : layout.oppositionLeader;
                const marked = leader && seat.mp.id === leader.id;
                return (
                  <circle key={seat.mp.id} className="chm-seat" cx={seat.x} cy={seat.y} r={marked ? 6.2 : 4.9} fill={seat.color} stroke={marked ? COLORS.ink : "#fff"} strokeWidth={marked ? 1.5 : 0.75} style={{ "--d": `${seat.delay}s`, "--sc": seat.color, opacity: active == null || active === seat.g ? 1 : 0.14 }}>
                    <title>{seat.mp.name}, {seat.mp.party}{marked ? (seat.g === 0 ? " (Prime Minister)" : " (Leader of the Opposition)") : ""}</title>
                  </circle>
                );
              })}
            </svg>
          );
        })() : (
          <>
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

          {/* The benches: a green strip behind each row of seats, as in the real Chamber */}
          {Array.from({ length: layout.maxRow }, (_, r) => (
            <g key={r} className="chm-bench" aria-hidden="true">
              <rect x={GOV_X - 9} y={60 + r * ROW_SPACING + 20 - 5.5} width={(PER_ROW - 1) * SPACING + 18} height={11} rx={5.5} fill={layout.government?.color ?? COLORS.inkSoft} />
              <rect x={OPP_X - (PER_ROW - 1) * SPACING - 9} y={60 + r * ROW_SPACING + 20 - 5.5} width={(PER_ROW - 1) * SPACING + 18} height={11} rx={5.5} fill={COLORS.inkSoft} />
            </g>
          ))}

          {/* The size of each side, in the space the shorter side leaves */}
          <g className="chm-count" aria-hidden="true">
            <text x={30} y={viewBoxHeight - 48} className="chm-count-n" fill={COLORS.ink}>{layout.oppSeats.length}</text>
            <text x={30} y={viewBoxHeight - 28} className="chm-count-l" fill={COLORS.inkSoft}>MPs on the Opposition benches</text>
            <text x={770} y={viewBoxHeight - 48} textAnchor="end" className="chm-count-n" fill={layout.government?.color ?? COLORS.ink}>{layout.govSeats.length}</text>
            <text x={770} y={viewBoxHeight - 28} textAnchor="end" className="chm-count-l" fill={COLORS.inkSoft}>{layout.government?.name} MPs, the Government side</text>
          </g>

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
          </>
        )}
      </div>

      <div className="chm-maj" data-go={go}>
        <div className="chm-maj-bar" role="img" aria-label={`The Government side holds ${layout.govSeats.length} of the ${total} seats. ${majority} seats is a majority.`}>
          <span className="chm-maj-gov" style={{ width: `${(layout.govSeats.length / total) * 100}%`, "--pc": layout.government?.color ?? COLORS.inkSoft }} />
          <span className="chm-maj-mark" style={{ left: `${(majority / total) * 100}%` }} />
        </div>
        <p className="chm-maj-l"><b>{majority}</b> of {total} seats is a majority. {layout.govSeats.length >= majority ? `${layout.government?.name} holds ${layout.govSeats.length}, which is ${layout.govSeats.length - majority} more than a majority.` : `${layout.government?.name} holds ${layout.govSeats.length}, short of a majority.`}</p>
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
      <div className="chm-hint">Hover or press a party to find its seats. Labour includes the Labour (Co-op) MPs.</div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
        Seats are grouped by party, not individual real assignments. Parliament doesn't publish exactly who sits
        where. The Speaker, and the Prime Minister and Opposition Leader (outlined, where identifiable from the
        data) are placed for illustration.
      </div>
    </motion.div>
  );
}
