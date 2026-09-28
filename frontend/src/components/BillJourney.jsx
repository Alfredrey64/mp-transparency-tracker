import { useMemo, useState } from "react";
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
  const size = count === 0 ? 26 : Math.min(30 + Math.sqrt(count) * 11, 64);
  return (
    <motion.button
      variants={revealNode}
      onClick={onClick}
      disabled={count === 0}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 92, flexShrink: 0,
        background: "none", border: "none", padding: "4px 0", cursor: count > 0 ? "pointer" : "default",
      }}
    >
      <div
        style={{
          width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: count === 0 ? "transparent" : active ? color : `${color}22`,
          border: `2px solid ${count === 0 ? COLORS.hairline : color}`,
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: count === 0 ? 11 : 15, color: count === 0 ? COLORS.inkSoft : active ? "#fff" : color }}>
          {count}
        </span>
      </div>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: count === 0 ? COLORS.inkSoft : COLORS.ink, textAlign: "center", lineHeight: 1.25, opacity: count === 0 ? 0.6 : 1 }}>
        {label}
      </span>
    </motion.button>
  );
}

function HouseTrack({ house, stageCounts, activeKey, onSelect }) {
  const color = HOUSE_COLOR[house];
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11.5, color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {house === "Commons" ? "House of Commons" : "House of Lords"}
      </div>
      <motion.div
        className="mp-bill-track"
        variants={revealParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 8 }}
      >
        {STAGE_DEFS.map((stage, i) => (
          <div key={stage.key} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && <div style={{ width: 20, height: 2, background: COLORS.hairline, flexShrink: 0 }} />}
            <StageNode
              label={stage.label}
              count={stageCounts[stage.key].length}
              color={color}
              active={activeKey === `${house}:${stage.key}`}
              onClick={() => onSelect(house, stage.key, stageCounts[stage.key])}
            />
          </div>
        ))}
      </motion.div>
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
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, marginBottom: 4 }}>Where Bills Currently Stand</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 18, lineHeight: 1.5, maxWidth: 640 }}>
        Every live bill's real position in the process, grouped by House — tap a stage to see which bills are sitting
        there right now.
      </div>

      <HouseTrack house="Commons" stageCounts={tracks.Commons} activeKey={selected?.key} onSelect={handleSelect} />
      <HouseTrack house="Lords" stageCounts={tracks.Lords} activeKey={selected?.key} onSelect={handleSelect} />

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
