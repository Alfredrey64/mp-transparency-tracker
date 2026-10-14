import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";

// A real institutional fact, not a decorative choice: Commons benches are
// green, Lords benches are red, and that colour-coding is how the two
// Houses are told apart everywhere from the chamber carpets to the annunciator
// screens — so it's what tells the two tracks below apart too, rather than
// an arbitrary two-colour palette.
const HOUSE_COLOR = { Commons: COLORS.commonsGreen, Lords: COLORS.garnet };

const STAGE_DEFS = [
  { key: "1st reading", label: "1st Reading" },
  { key: "2nd reading", label: "2nd Reading" },
  { key: "committee", label: "Committee" },
  { key: "report", label: "Report" },
  { key: "3rd reading", label: "3rd Reading" },
];

function normalizeStage(stage) {
  const s = (stage ?? "").toLowerCase();
  if (s.includes("1st") || s.includes("first")) return "1st reading";
  if (s.includes("2nd") || s.includes("second")) return "2nd reading";
  if (s.includes("committee")) return "committee";
  if (s.includes("report")) return "report";
  if (s.includes("3rd") || s.includes("third")) return "3rd reading";
  return null;
}

function bucketBills(bills) {
  const tracks = {
    Commons: Object.fromEntries(STAGE_DEFS.map((s) => [s.key, []])),
    Lords: Object.fromEntries(STAGE_DEFS.map((s) => [s.key, []])),
  };
  const assent = [];
  const other = [];
  for (const b of bills) {
    if (b.is_act) { assent.push(b); continue; }
    const stage = normalizeStage(b.current_stage);
    if (!stage || (b.current_house !== "Commons" && b.current_house !== "Lords")) { other.push(b); continue; }
    tracks[b.current_house][stage].push(b);
  }
  return { tracks, assent, other };
}

const revealParent = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const revealNode = { hidden: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "backOut" } } };

function StageNode({ label, count, color, active, onClick }) {
  const size = count === 0 ? 26 : Math.min(30 + Math.sqrt(count) * 11, 62);
  return (
    <motion.button
      variants={revealNode}
      onClick={onClick}
      disabled={count === 0}
      style={{
        position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%", minWidth: 0,
        background: "none", border: "none", padding: "4px 0", cursor: count > 0 ? "pointer" : "default",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 64, width: "100%" }}>
        <span
          style={{
            width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: count === 0 ? COLORS.paper : active ? color : `color-mix(in srgb, ${color} 14%, ${COLORS.paper})`,
            border: `2px solid ${count === 0 ? COLORS.hairline : color}`,
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: count === 0 ? 11 : 15, color: count === 0 ? COLORS.inkSoft : active ? "#fff" : color }}>
            {count}
          </span>
        </span>
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: count === 0 ? COLORS.inkSoft : COLORS.ink, textAlign: "center", lineHeight: 1.25, opacity: count === 0 ? 0.6 : 1 }}>
        {label}
      </span>
    </motion.button>
  );
}

function HouseRow({ house, stageCounts, activeKey, onSelect }) {
  const color = HOUSE_COLOR[house];
  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11.5, color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
        {house === "Commons" ? "House of Commons" : "House of Lords"}
      </div>
      <motion.div
        className="mp-bill-track"
        role="group"
        aria-label={`Bill stages in the House of ${house}`}
        variants={revealParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${STAGE_DEFS.length}, minmax(0, 1fr))`, alignItems: "start" }}
      >
        {/* The line the stages sit on, from the middle of the first to the middle of the last. */}
        <div aria-hidden="true" style={{ position: "absolute", left: `${50 / STAGE_DEFS.length}%`, right: `${50 / STAGE_DEFS.length}%`, top: 4 + 32 - 1, height: 2, background: COLORS.hairline }} />
        {STAGE_DEFS.map((stage) => (
          <StageNode
            key={stage.key}
            label={stage.label}
            count={stageCounts[stage.key].length}
            color={color}
            active={activeKey === `${house}:${stage.key}`}
            onClick={() => onSelect(house, stage.key, stageCounts[stage.key])}
          />
        ))}
      </motion.div>
    </div>
  );
}

// A bill that one House has finished with goes to the other, and amendments can be sent back and forth between them (parliamentary "ping-pong").
// Faint arrows zig-zag between the Commons row above and the Lords row below, stage to stage, one after another. Each arrow is a whole piece that is
// drawn, held and faded away together, so nothing is cut off at an edge. Decorative only: the real positions are in the circles.
function PingPong({ width }) {
  const n = STAGE_DEFS.length;
  const col = width / n;
  const height = Math.round(Math.min(96, Math.max(60, col * 0.5)));
  const inset = 10; // gap kept between an arrow and whatever it points at
  const arrows = [];
  for (let k = 0; k < n - 1; k += 1) {
    const down = k % 2 === 0;
    const x1 = col * (k + 0.5);
    const x2 = col * (k + 1.5);
    const y1 = down ? 2 : height - 2;
    const y2 = down ? height - 2 : 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    arrows.push({
      k, down, angle: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI,
      sx: x1 + ux * inset, sy: y1 + uy * inset, ex: x2 - ux * (inset - 2), ey: y2 - uy * (inset - 2),
    });
  }
  const from = (a) => (a.down ? HOUSE_COLOR.Commons : HOUSE_COLOR.Lords);
  const to = (a) => (a.down ? HOUSE_COLOR.Lords : HOUSE_COLOR.Commons);
  return (
    <svg aria-hidden="true" focusable="false" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible", margin: "2px 0" }}>
      <defs>
        {arrows.map((a) => (
          <linearGradient key={a.k} id={`pp-g${a.k}`} gradientUnits="userSpaceOnUse" x1={a.sx} y1={a.sy} x2={a.ex} y2={a.ey}>
            <stop offset="0" style={{ stopColor: from(a) }} />
            <stop offset="1" style={{ stopColor: to(a) }} />
          </linearGradient>
        ))}
      </defs>
      {arrows.map((a) => (
        <g key={a.k} className="pp-arrow" style={{ animationDelay: `${a.k * 1.15}s` }}>
          <line className="pp-line" pathLength="1" x1={a.sx} y1={a.sy} x2={a.ex} y2={a.ey} stroke={`url(#pp-g${a.k})`} strokeWidth="2" strokeLinecap="round" style={{ animationDelay: "inherit" }} />
          <g className="pp-head" style={{ animationDelay: "inherit" }}>
            <path d="M -8 -5.5 L 0 0 L -8 5.5" transform={`translate(${a.ex} ${a.ey}) rotate(${a.angle})`} fill="none" style={{ stroke: to(a) }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      ))}
    </svg>
  );
}

function StageBoard({ tracks, activeKey, onSelect }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ marginBottom: 22 }}>
      <HouseRow house="Commons" stageCounts={tracks.Commons} activeKey={activeKey} onSelect={onSelect} />
      {width > 0 ? <PingPong width={width} /> : <div style={{ height: 64 }} />}
      <HouseRow house="Lords" stageCounts={tracks.Lords} activeKey={activeKey} onSelect={onSelect} />
    </div>
  );
}

export function BillJourney({ bills }) {
  const [selected, setSelected] = useState(null); // { house, stageKey, bills }

  const { tracks, assent, other } = useMemo(() => bucketBills(bills), [bills]);

  function handleSelect(house, stageKey, list) {
    const key = `${house}:${stageKey}`;
    setSelected((current) => (current?.house === house && current?.stageKey === stageKey ? null : { house, stageKey, key, list }));
  }

  if (bills.length === 0) return null;

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: COLORS.ink, marginBottom: 4 }}>Where bills currently stand</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 18, lineHeight: 1.5, maxWidth: 640 }}>
        Every live bill's real position in the process, grouped by House. Tap a stage to see which bills are sitting
        there right now.
      </div>

      <StageBoard tracks={tracks} activeKey={selected?.key} onSelect={handleSelect} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
        <span>
          <strong style={{ color: COLORS.accent, fontFamily: FONT_MONO }}>{assent.length}</strong> have received Royal
          Assent and are now law
        </span>
        {other.length > 0 && (
          <span>
            <strong style={{ color: COLORS.ink, fontFamily: FONT_MONO }}>{other.length}</strong> between Houses or at a
            procedural stage
          </span>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                marginTop: 16, padding: "14px 16px", borderRadius: 12,
                background: `${HOUSE_COLOR[selected.house]}0f`, border: `1px solid ${HOUSE_COLOR[selected.house]}33`,
              }}
            >
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11.5, color: HOUSE_COLOR[selected.house], textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                {selected.house} · {STAGE_DEFS.find((s) => s.key === selected.stageKey)?.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selected.list.slice(0, 12).map((b) => (
                  <div key={b.bill_id} style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink }}>
                    {b.short_title}
                  </div>
                ))}
                {selected.list.length > 12 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                    +{selected.list.length - 12} more
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
