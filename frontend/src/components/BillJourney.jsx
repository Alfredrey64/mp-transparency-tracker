import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, readable, solid } from "../theme";
import { STAGE_DEFS, buildRoute } from "../lib/billRoute";
import { plainSentence } from "../lib/billPlain";
import { getBillDescription } from "../lib/billDescriptions";

// A real institutional fact, not a decorative choice: Commons benches are
// green, Lords benches are red, and that colour-coding is how the two
// Houses are told apart everywhere from the chamber carpets to the annunciator
// screens — so it's what tells the two tracks below apart too, rather than
// an arbitrary two-colour palette.
const HOUSE_COLOR = { Commons: COLORS.commonsGreen, Lords: COLORS.garnet };


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
            background: count === 0 ? COLORS.paper : active ? solid(color) : `color-mix(in srgb, ${color} 14%, ${COLORS.paper})`,
            border: `2px solid ${count === 0 ? COLORS.hairline : color}`,
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: count === 0 ? 11 : 15, color: count === 0 ? COLORS.inkSoft : active ? "#fff" : readable(color) }}>
            {count}
          </span>
        </span>
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: count === 0 ? COLORS.inkSoft : COLORS.ink, textAlign: "center", lineHeight: 1.25, opacity: count === 0 ? 0.85 : 1 }}>
        {label}
      </span>
    </motion.button>
  );
}

const nodeSize = (count) => (count === 0 ? 26 : Math.min(30 + Math.sqrt(count) * 11, 62));

function HouseRow({ house, stageCounts, activeKey, onSelect, trackRef }) {
  const color = HOUSE_COLOR[house];
  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11.5, color: readable(color), textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
        {house === "Commons" ? "House of Commons" : "House of Lords"}
      </div>
      <motion.div
        ref={trackRef}
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

// ---- The walk-through ----
// Bills can start in either House, so the animation does not assume one. A glowing ring travels through the stages of the House a bill starts in,
// hands over to the other House, goes back and forth for a moment (ping-pong, when the Houses disagree on changes) and ends at Royal Assent. It
// plays one route that starts in the Commons, then one that starts in the Lords, and a caption says what is happening at each step.

function StageBoard({ tracks, activeKey, onSelect }) {
  const reduce = useReducedMotion();
  const boardRef = useRef(null);
  const commonsRef = useRef(null);
  const lordsRef = useRef(null);
  const [geo, setGeo] = useState({ width: 0, commons: 0, lords: 0 });
  const [onScreen, setOnScreen] = useState(false);
  const [playing, setPlaying] = useState(!reduce);
  // Nothing moves until it is started when the visitor prefers less motion; then a caption describes the stages instead.
  const [started, setStarted] = useState(!reduce);
  const [route, setRoute] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const first = route % 2 === 0 ? "Commons" : "Lords";
  const steps = useMemo(() => buildRoute(first), [first]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;
    const measure = () => {
      const top = board.getBoundingClientRect().top;
      const centre = (el) => (el ? el.getBoundingClientRect().top - top + 4 + 32 : 0);
      setGeo({ width: Math.round(board.clientWidth), commons: centre(commonsRef.current), lords: centre(lordsRef.current) });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 });
    io.observe(board);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  // Move on to the next step after this one has been shown for its time; at the end of a route, start the other route.
  useEffect(() => {
    if (!playing || !onScreen) return undefined;
    const id = setTimeout(() => {
      if (stepIndex + 1 >= steps.length) { setRoute((r) => r + 1); setStepIndex(0); } else setStepIndex(stepIndex + 1);
    }, step.ms);
    return () => clearTimeout(id);
  }, [playing, onScreen, stepIndex, steps.length, step.ms]);

  const count = tracks[step.house][STAGE_DEFS[step.col].key].length;
  const size = nodeSize(count) + 20;
  const x = `${((step.col + 0.5) / STAGE_DEFS.length) * 100}%`;
  const y = step.house === "Commons" ? geo.commons : geo.lords;
  const colour = HOUSE_COLOR[step.house];
  const glide = step.glide && !reduce;
  const ready = geo.width > 0 && started;
  return (
    <div style={{ marginBottom: 22 }}>
      <div ref={boardRef} style={{ position: "relative" }}>
        <HouseRow house="Commons" stageCounts={tracks.Commons} activeKey={activeKey} onSelect={onSelect} trackRef={commonsRef} />
        <div style={{ height: 34 }} aria-hidden="true" />
        <HouseRow house="Lords" stageCounts={tracks.Lords} activeKey={activeKey} onSelect={onSelect} trackRef={lordsRef} />
        <div
          aria-hidden="true"
          className="bill-ring"
          style={{
            "--ring": step.done ? COLORS.accent : colour, left: x, top: y, width: size, height: size,
            opacity: ready && step.show ? 1 : 0,
            transition: glide ? "left 0.9s cubic-bezier(.45,.05,.2,1), top 0.7s cubic-bezier(.45,.05,.2,1), width 0.4s, height 0.4s, opacity 0.35s, border-color 0.4s" : "opacity 0.35s, width 0.3s, height 0.3s",
          }}
        />
      </div>
      <Caption steps={steps} stepIndex={Math.min(stepIndex, steps.length - 1)} route={route} first={first} started={started} playing={playing} onScreen={onScreen}
        onToggle={() => { setStarted(true); setPlaying((p) => !p); }} />
    </div>
  );
}

// The box under the board that says what is happening. Every step's words sit in the same grid cell with only the current one showing, so the
// box is always as tall as the longest step and nothing around it moves when the words change. A thin bar along the foot fills over the time the
// step is shown, and the four chips show how far through the journey it is.
const PHASES = (first) => {
  const second = first === "Commons" ? "Lords" : "Commons";
  return [{ label: first, color: HOUSE_COLOR[first] }, { label: second, color: HOUSE_COLOR[second] }, { label: "Ping-pong", color: COLORS.inkSoft }, { label: "Royal Assent", color: COLORS.accent }];
};

function StepBadge({ step, color }) {
  const icon = step.done ? "tick" : step.phase === 2 ? "swap" : !step.show ? "swap" : null;
  return (
    <span className="bill-cap-badge" style={{ background: solid(color) }} aria-hidden="true">
      {icon === "tick" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
      {icon === "swap" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4" /></svg>}
      {!icon && <span><b>{step.col + 1}</b><i>of {STAGE_DEFS.length}</i></span>}
    </span>
  );
}

function Caption({ steps, stepIndex, route, first, started, playing, onScreen, onToggle }) {
  const step = steps[stepIndex];
  const colour = step.done ? COLORS.accent : HOUSE_COLOR[step.house];
  const phases = PHASES(first);
  const running = started && playing && onScreen;
  return (
    <div className="bill-cap" style={{ "--hc": colour, "--fd": FONT_DISPLAY, "--fm": FONT_MONO, "--fb": FONT_BODY }} data-done={step.done ? "1" : "0"}>
      <div className="bill-cap-row">
        <StepBadge step={started ? step : { col: 0, show: true, phase: 0 }} color={colour} />
        <div className="bill-cap-words" aria-live="off">
          {started ? steps.map((st, i) => (
            <div key={i} className="bill-cap-step" data-on={i === stepIndex ? "1" : "0"} aria-hidden={i === stepIndex ? undefined : "true"}>
              <div className="bill-cap-title">{st.title}</div>
              <div className="bill-cap-text">{st.text}</div>
            </div>
          )) : (
            <div className="bill-cap-step" data-on="1">
              <div className="bill-cap-title">How a bill becomes law</div>
              <div className="bill-cap-text">A bill goes through five stages in one House, then the other, and can go back and forth between them until both agree. Then it gets Royal Assent and becomes law. Bills can start in either House.</div>
            </div>
          )}
        </div>
        <button type="button" className="bill-cap-btn" onClick={onToggle}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">{playing ? <path d="M2.5 1.5h2.6v9H2.5zM6.9 1.5h2.6v9H6.9z" /> : <path d="M3 1.5l7 4.5-7 4.5z" />}</svg>
          {playing ? "Pause the walk-through" : "Play the walk-through"}
        </button>
      </div>
      <ol className="bill-cap-phases" aria-label="Where the walk-through has got to">
        {phases.map((ph, i) => (
          <li key={ph.label} style={{ "--pc": ph.color }} data-state={!started ? "todo" : i < step.phase ? "done" : i === step.phase ? "now" : "todo"}>{ph.label}</li>
        ))}
      </ol>
      <div className="bill-cap-bar" aria-hidden="true">
        {started && <i key={`${route}-${stepIndex}`} style={{ animationDuration: `${step.ms}ms`, animationPlayState: running ? "running" : "paused" }} />}
      </div>
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
          <strong style={{ color: COLORS.accentText, fontFamily: FONT_MONO }}>{assent.length}</strong> have received Royal
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
                marginTop: 16, padding: "16px 18px", borderRadius: 16,
                background: `linear-gradient(135deg, color-mix(in srgb, ${HOUSE_COLOR[selected.house]} 11%, ${COLORS.paperCard}), ${COLORS.paperCard} 70%)`,
                border: `1px solid color-mix(in srgb, ${HOUSE_COLOR[selected.house]} 32%, ${COLORS.hairline})`,
                borderLeft: `5px solid ${HOUSE_COLOR[selected.house]}`,
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: COLORS.ink, marginBottom: 10 }}>
                {selected.list.length} {selected.list.length === 1 ? "bill" : "bills"} at {STAGE_DEFS.find((s) => s.key === selected.stageKey)?.label} in the House of {selected.house}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selected.list.slice(0, 12).map((b) => {
                  const line = getBillDescription(b.short_title, null) ?? plainSentence(b.long_title);
                  return (
                    <div key={b.bill_id} style={{ display: "flex", gap: 10 }}>
                      <span aria-hidden="true" style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: HOUSE_COLOR[selected.house], marginTop: 7 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.35 }}>{b.short_title}</div>
                        {line && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.45, marginTop: 1 }}>{line}</div>}
                      </div>
                    </div>
                  );
                })}
                {selected.list.length > 12 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
                    +{selected.list.length - 12} more below in the full list
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
