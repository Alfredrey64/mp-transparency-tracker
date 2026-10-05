import { useState, useReducer, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, numeric } from "../theme";
import { withScrollPreserved } from "../lib/preserveScroll";
import { NATIONS, TIERS, CONNECTORS, VOTE_FOR, CHECKS, WHO_TO_CONTACT, contactAnswer, SCENARIOS, scenarioSteps } from "../data/governmentTiers";

const SECTION_COLOR = "#B5533C";
const RAIL = 44;

function Heading({ children }) {
  return <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>{children}</div>;
}

function TierDetail({ tier, nation, nationLabel, exists }) {
  const note = tier.here[nation];
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ overflow: "hidden" }}
    >
      <div style={{ padding: "4px 0 6px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "18px 28px" }}>
        {!exists ? (
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0, gridColumn: "1 / -1", maxWidth: 560 }}>
            {tier.absentNote ?? `There is no ${tier.name.toLowerCase()} in ${nationLabel}.`}
          </p>
        ) : (
          <>
            <div>
              <Heading>What it does</Heading>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft }}>
                {tier.does.map((d) => <li key={d} style={{ marginBottom: 4 }}>{d}</li>)}
              </ul>
            </div>
            <div>
              <Heading>How you have a say</Heading>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 14px" }}>{tier.chosen}</p>
              {note && (
                <>
                  <Heading>In {nationLabel}</Heading>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 14px" }}>{note}</p>
                </>
              )}
              {tier.links.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                  {tier.links.map((l) => (
                    <a key={l.href + l.label} href={l.href} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: tier.color }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Checks() {
  return (
    <div style={{ marginTop: 30 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, margin: "0 0 4px" }}>Who checks all of them</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 12px", maxWidth: 620 }}>
        Voting happens every few years. In between, independent bodies watch every tier.
      </p>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 32px" }}>
        {CHECKS.map((c) => (
          <div key={c.name} style={{ padding: "9px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
            <dt style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{c.name}</dt>
            <dd style={{ margin: "1px 0 0", fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: COLORS.inkSoft }}>{c.what}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WhoToContact({ nation, nationLabel }) {
  const byKey = Object.fromEntries(TIERS.map((t) => [t.key, t]));
  const devolvedNation = nation !== "england";
  return (
    <div style={{ marginTop: 30 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, margin: "0 0 4px" }}>Who do I contact?</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 12px", maxWidth: 620 }}>
        Where to start with common problems{devolvedNation ? `, for ${nationLabel}` : ""}. If you pick the wrong tier, most will point you to the right one.
      </p>
      <div>
        {WHO_TO_CONTACT.map((r) => {
          const tier = byKey[r.tier];
          const answer = contactAnswer(r, nation);
          return (
            <div
              key={r.issue}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2px 24px", padding: "10px 0 10px 12px", borderTop: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${tier.color}` }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.5 }}>{r.issue}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.5 }}>{answer}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STEP_MS = 4600;

function activeIndex(step) {
  if (!step) return 0;
  return step.tier === "you" || step.tier === "vote" ? TIERS.length : TIERS.findIndex((t) => t.key === step.tier);
}

function reducer(state, a) {
  if (a.type === "reset") return { step: 0, from: 0 };
  const to = Math.max(0, Math.min(a.to, a.steps.length - 1));
  return { step: to, from: activeIndex(a.steps[state.step]) };
}

// Brings a row into view only if it has drifted out of the clear area below the
// sticky stage panel, so a watcher isn't scrolled around more than needed.
function revealRow(el, stageEl) {
  if (!el) return;
  const top = window.innerWidth <= 600 ? 76 : (stageEl?.getBoundingClientRect().bottom ?? 0) + 24;
  const r = el.getBoundingClientRect();
  if (r.top < top || r.bottom > window.innerHeight - 40) {
    window.scrollTo({ top: window.scrollY + r.top - (top + (window.innerHeight - top) * 0.3), behavior: "smooth" });
  }
}

// One of the two lanes beside the tiers. In explore mode it just flows (laws
// and money down, votes up); in action mode it fills as the story reaches it.
function Lane({ side, mode, filled, delay = 0, top = 0, bottom = 0, height }) {
  const down = side === "down";
  const color = down ? SECTION_COLOR : COLORS.commonsGreen;
  const pos = { position: "absolute", left: -RAIL + (down ? 16 : 26), width: 2, top, bottom: height === undefined ? bottom : "auto", height, borderRadius: 1 };
  if (mode === "explore") return <span aria-hidden="true" className={down ? "lane-down" : "lane-up"} style={{ ...pos, "--lane": color }} />;
  return (
    <span aria-hidden="true" style={{ ...pos, background: COLORS.hairline }}>
      <motion.span
        initial={false}
        animate={{ scaleY: filled ? 1 : 0 }}
        transition={{ duration: filled ? 0.42 : 0.2, delay: filled ? delay : 0, ease: "easeOut" }}
        style={{ position: "absolute", inset: 0, background: color, transformOrigin: down ? "top" : "bottom", borderRadius: 1 }}
      />
    </span>
  );
}

// The glowing marker that travels down the tiers. All three share one layoutId,
// so it glides from whichever row it was in to the next.
function Token({ color, top }) {
  return (
    <motion.span
      layoutId="tier-token"
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      aria-hidden="true"
      style={{
        position: "absolute", left: -RAIL + 15, top, width: 14, height: 14, borderRadius: 7, zIndex: 3,
        background: color, border: "2px solid #fff", boxShadow: `0 0 0 4px ${color}40, 0 0 16px ${color}`,
      }}
    />
  );
}

function Highlight({ color }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ position: "absolute", left: -6, right: -10, top: 2, bottom: 2, borderRadius: 10, background: `${color}14`, zIndex: 0 }}
    />
  );
}

function Connector({ text, dim, mode, lanes }) {
  return (
    <div style={{ position: "relative", minHeight: 38, opacity: dim ? 0.45 : 1 }}>
      <Lane side="down" mode={mode} filled={lanes.down} delay={lanes.downDelay} />
      <Lane side="up" mode={mode} filled={lanes.up} delay={lanes.upDelay} />
      <div style={{ position: "relative", fontFamily: FONT_BODY, fontSize: 13, fontStyle: "italic", lineHeight: 1.45, color: COLORS.inkSoft, maxWidth: 520, padding: "8px 0" }}>{text}</div>
    </div>
  );
}

function TierRow({ tier, first, open, onToggle, nation, nationLabel, mode, active, lanes, rowRef }) {
  const exists = tier.here[nation] !== undefined;
  const figure = tier.figureHere?.[nation] ?? tier.figure;
  return (
    <div ref={rowRef} style={{ position: "relative", opacity: exists ? 1 : 0.55, transition: "opacity 0.2s" }}>
      <AnimatePresence>{active && <Highlight color={tier.color} />}</AnimatePresence>
      <Lane side="down" mode={mode} filled={lanes.down} delay={lanes.downDelay} top={first ? 24 : 0} />
      <Lane side="up" mode={mode} filled={lanes.up} delay={lanes.upDelay} top={first ? 24 : 0} />
      <span
        aria-hidden="true"
        className={active ? "tier-pulse" : undefined}
        style={{
          position: "absolute", left: -RAIL + 13, top: 15, width: 18, height: 18, borderRadius: 5, zIndex: 2,
          background: exists ? tier.color : COLORS.paperCard, border: `2px solid ${exists ? tier.color : COLORS.hairline}`,
          boxShadow: `0 0 0 4px ${COLORS.paperCard}`, "--pulse": tier.color,
        }}
      />
      {active && <Token color={tier.color} top={17} />}
      <button
        onClick={onToggle}
        aria-expanded={mode === "explore" ? open : undefined}
        aria-current={active ? "step" : undefined}
        style={{
          position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, width: "100%", textAlign: "left",
          background: "none", border: "none", padding: "10px 0", cursor: "pointer", font: "inherit",
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, lineHeight: 1.25 }}>{tier.name}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 2, lineHeight: 1.45 }}>{tier.short}</span>
        </span>
        <span style={{ flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
          {exists ? (
            <>
              <span style={{ display: "block", ...numeric, fontSize: 20, fontWeight: 600, color: tier.color, lineHeight: 1.2 }}>{figure.value}</span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{figure.label}</span>
            </>
          ) : (
            <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Not in {nationLabel}</span>
          )}
        </span>
      </button>
      <div style={{ position: "relative", zIndex: 1 }}>
        <AnimatePresence initial={false}>
          {open && <TierDetail key="detail" tier={tier} nation={nation} nationLabel={nationLabel} exists={exists} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VoterNode({ nation, mode, active, tokenColor, lanes, rowRef }) {
  return (
    <div ref={rowRef} style={{ position: "relative", paddingTop: 4 }}>
      <AnimatePresence>{active && <Highlight color={COLORS.accent} />}</AnimatePresence>
      <Lane side="down" mode={mode} filled={lanes.down} delay={lanes.downDelay} top={0} height={18} />
      <Lane side="up" mode={mode} filled={lanes.up} delay={lanes.upDelay} top={0} height={18} />
      <span
        aria-hidden="true"
        className={active ? "tier-pulse" : undefined}
        style={{ position: "absolute", left: -RAIL + 13, top: 9, width: 18, height: 18, borderRadius: "50%", background: COLORS.ink, zIndex: 2, boxShadow: `0 0 0 4px ${COLORS.paperCard}`, "--pulse": COLORS.accent }}
      />
      {active && <Token color={tokenColor} top={11} />}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, lineHeight: 1.25 }}>You</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "2px 0 0", maxWidth: 600 }}>
          Everything above rests on you. You vote for {VOTE_FOR[nation]}. The rest of the tiers answer to the people you elect.
        </p>
      </div>
    </div>
  );
}

function Segmented({ label, value, onChange, options, small }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button
            key={o.key}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            style={{
              fontFamily: FONT_BODY, fontSize: small ? 13 : 13.5, fontWeight: on ? 700 : 500, padding: small ? "6px 12px" : "7px 14px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, background: on ? COLORS.ink : "transparent",
              color: on ? COLORS.paper : COLORS.inkSoft, transition: "background 0.15s, color 0.15s", display: "inline-flex", alignItems: "center", gap: 7,
            }}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const PlayGlyph = <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5v9l8-4.5z" fill="currentColor" /></svg>;
const PauseGlyph = <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5h2v9H3zM7 1.5h2v9H7z" fill="currentColor" /></svg>;
const ReplayGlyph = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.2 6a3.8 3.8 0 1 0 1.2-2.8M2 1.5v2.2h2.2" />
  </svg>
);

function Control({ onClick, disabled, primary, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "7px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 7,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
        border: `1px solid ${primary ? SECTION_COLOR : COLORS.hairline}`, background: primary ? SECTION_COLOR : "transparent", color: primary ? "#fff" : COLORS.ink,
      }}
    >
      {children}
    </button>
  );
}

function Stage({ stageRef, scenarioKey, onScenario, steps, step, playing, finished, dispatch, onPlayPause, color }) {
  const cur = steps[step];
  return (
    <div
      ref={stageRef}
      className="tier-stage"
      style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}
    >
      <Segmented
        label="Walk-through" small value={scenarioKey} onChange={onScenario}
        options={SCENARIOS.map((s) => ({ key: s.key, label: s.label }))}
      />
      <div aria-live="polite" style={{ marginTop: 12, minHeight: 92 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${scenarioKey}-${step}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}>{cur.title}</span>
              {cur.token && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color, whiteSpace: "nowrap" }}>carrying: {cur.token}</span>
              )}
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "4px 0 0", maxWidth: 680 }}>{cur.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Control onClick={() => dispatch({ type: "go", to: step - 1, steps, user: true })} disabled={step === 0}>Back</Control>
        <Control primary onClick={onPlayPause}>
          {finished ? ReplayGlyph : playing ? PauseGlyph : PlayGlyph}
          {finished ? "Replay" : playing ? "Pause" : "Play"}
        </Control>
        <Control onClick={() => dispatch({ type: "go", to: step + 1, steps, user: true })} disabled={finished}>Next</Control>
        <div role="group" aria-label="Steps" style={{ display: "flex", gap: 4, flex: 1, minWidth: 120, alignItems: "center", justifyContent: "flex-end" }}>
          {steps.map((s, i) => (
            <button
              key={s.tier}
              onClick={() => dispatch({ type: "go", to: i, steps, user: true })}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={i === step ? "step" : undefined}
              style={{ flex: "1 1 0", maxWidth: 34, height: 6, borderRadius: 3, border: "none", padding: 0, cursor: "pointer", background: i <= step ? color : COLORS.hairline, transition: "background 0.25s" }}
            />
          ))}
        </div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 8 }}>
        Step {step + 1} of {steps.length}. A simplified illustration.
      </div>
    </div>
  );
}

// On a phone the full panel scrolls away with the page and this slim bar stays
// pinned, so the current step and the controls are always in reach.
function MiniBar({ steps, step, playing, finished, dispatch, onPlayPause, color }) {
  const btn = { fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "6px 11px", borderRadius: 8, border: `1px solid ${COLORS.hairline}`, background: "transparent", color: COLORS.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };
  return (
    <div className="tier-mini" style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${color}`, borderRadius: 10, padding: "8px 10px", alignItems: "center", gap: 8 }}>
      <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {step + 1}/{steps.length} {steps[step].title}
      </span>
      <button onClick={onPlayPause} style={btn}>{finished ? ReplayGlyph : playing ? PauseGlyph : PlayGlyph}{finished ? "Replay" : playing ? "Pause" : "Play"}</button>
      <button onClick={() => dispatch({ type: "go", to: step + 1, steps, user: true })} disabled={finished} style={{ ...btn, opacity: finished ? 0.4 : 1 }}>Next</button>
    </div>
  );
}

function Legend() {
  const item = (cls, color, text) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
      <span aria-hidden="true" className={cls} style={{ "--lane": color, width: 2, height: 22, borderRadius: 1, display: "inline-block" }} />
      {text}
    </span>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", marginBottom: 18 }}>
      {item("lane-down", SECTION_COLOR, "Laws, rules and money flow down")}
      {item("lane-up", COLORS.commonsGreen, "Votes and scrutiny flow up")}
    </div>
  );
}

export default function GovernmentTiers() {
  const [nation, setNation] = useState("england");
  const [open, setOpen] = useState("parliament");
  const [mode, setMode] = useState("explore");
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const [playing, setPlaying] = useState(false);
  const [{ step, from }, dispatch] = useReducer(reducer, { step: 0, from: 0 });
  const rowRefs = useRef({});
  const stageRef = useRef(null);

  const nationLabel = NATIONS.find((n) => n.key === nation).label;
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  const steps = useMemo(() => scenarioSteps(scenario, nation), [scenario, nation]);
  const cur = steps[Math.min(step, steps.length - 1)];
  const finished = step >= steps.length - 1;
  const action = mode === "action";
  const activeIdx = activeIndex(cur);
  const voting = cur.tier === "vote";
  const youHere = cur.tier === "you" || voting;
  const nextKey = steps[step + 1]?.tier;
  const runs = action && playing && !finished;

  // Auto-advance while playing. The next step's row is scrolled into view
  // first so the marker never travels off screen.
  useEffect(() => {
    if (!runs) return undefined;
    const id = setTimeout(() => {
      dispatch({ type: "go", to: step + 1, steps });
      revealRow(rowRefs.current[nextKey === "vote" ? "you" : nextKey], stageRef.current);
    }, STEP_MS);
    return () => clearTimeout(id);
  }, [runs, step, steps, nextKey]);

  const reveal = (key) => requestAnimationFrame(() => revealRow(rowRefs.current[key], stageRef.current));
  const wrapped = (a) => {
    dispatch(a);
    if (a.user) { setPlaying(false); const s = a.steps[Math.max(0, Math.min(a.to, a.steps.length - 1))]; reveal(s.tier === "vote" ? "you" : s.tier); }
  };

  const enterAction = () => { setMode("action"); dispatch({ type: "reset" }); setPlaying(true); };
  const onMode = (k) => (k === "action" ? enterAction() : setMode("explore"));
  const onNation = (k) => { setNation(k); dispatch({ type: "reset" }); };
  const onScenario = (k) => { setScenarioKey(k); dispatch({ type: "reset" }); setPlaying(true); };
  const onPlayPause = () => {
    if (finished) { dispatch({ type: "reset" }); setPlaying(true); reveal(steps[0].tier); } else setPlaying(!playing);
  };

  const lanesFor = (order, upOrder, downFilled) => ({
    down: action && downFilled,
    downDelay: Math.min(1.4, Math.max(0, order - 2 * from) * 0.14),
    up: action && voting,
    upDelay: upOrder * 0.1,
  });
  const last = TIERS.length - 1;

  return (
    <motion.div
      id="tiers"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      style={{
        marginBottom: 32, background: COLORS.paperCard, borderLeft: `1px solid ${COLORS.hairline}`, borderRight: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${SECTION_COLOR}`, borderRadius: 16, padding: "24px clamp(16px, 4vw, 28px)",
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>Who Does What? The Tiers of Government</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20, maxWidth: 780, lineHeight: 1.6 }}>
        Power in the UK is shared between several tiers, from Parliament down to your village. Each one has its own job and its own voters. This is a map
        of how they connect, not a chain of command: a minister can't tell a councillor what to decide, though they do hold the purse strings.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, fontWeight: 600, marginRight: 4 }}>Where do you live?</span>
          <Segmented label="Where you live" value={nation} onChange={onNation} options={NATIONS} />
        </div>
        <Segmented
          label="View"
          value={mode}
          onChange={onMode}
          options={[{ key: "explore", label: "Explore" }, { key: "action", label: "See it in action", icon: PlayGlyph }]}
        />
      </div>

      <Legend />

      {action && (
        <Stage
          stageRef={stageRef} scenarioKey={scenarioKey} onScenario={onScenario} steps={steps} step={Math.min(step, steps.length - 1)}
          playing={playing} finished={finished} dispatch={wrapped} onPlayPause={onPlayPause}
          color={voting ? COLORS.commonsGreen : TIERS.find((t) => t.key === cur.tier)?.color ?? COLORS.accent}
        />
      )}
      {action && (
        <MiniBar
          steps={steps} step={Math.min(step, steps.length - 1)} playing={playing} finished={finished} dispatch={wrapped} onPlayPause={onPlayPause}
          color={voting ? COLORS.commonsGreen : TIERS.find((t) => t.key === cur.tier)?.color ?? COLORS.accent}
        />
      )}

      <div style={{ position: "relative", marginLeft: RAIL }}>
        {TIERS.map((tier, i) => (
          <div key={tier.key}>
            <TierRow
              tier={tier}
              first={i === 0}
              mode={mode}
              active={action && cur.tier === tier.key}
              open={!action && open === tier.key}
              onToggle={() => {
                if (action) {
                  const at = steps.findIndex((s) => s.tier === tier.key);
                  if (at >= 0) wrapped({ type: "go", to: at, steps, user: true });
                } else withScrollPreserved(() => setOpen(open === tier.key ? null : tier.key));
              }}
              nation={nation}
              nationLabel={nationLabel}
              lanes={lanesFor(2 * i, (last - i) * 2 + 1, i < activeIdx)}
              rowRef={(el) => { rowRefs.current[tier.key] = el; }}
            />
            <Connector
              text={CONNECTORS[i] ?? "Everyone in these tiers answers to voters at the next election"}
              dim={tier.here[nation] === undefined || (TIERS[i + 1] !== undefined && TIERS[i + 1].here[nation] === undefined)}
              mode={mode}
              lanes={lanesFor(2 * i + 1, (last - i) * 2, i < activeIdx)}
            />
          </div>
        ))}
        <VoterNode
          nation={nation}
          mode={mode}
          active={action && youHere}
          tokenColor={voting ? COLORS.commonsGreen : COLORS.accent}
          lanes={lanesFor(2 * TIERS.length, 0, true)}
          rowRef={(el) => { rowRefs.current.you = el; }}
        />
      </div>

      <Checks />
      <WhoToContact nation={nation} nationLabel={nationLabel} />
    </motion.div>
  );
}
