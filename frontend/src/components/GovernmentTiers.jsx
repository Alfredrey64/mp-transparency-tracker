import { useState, useReducer, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "../theme";
import { IconParliament, IconCabinet, IconDevolved, IconTransport, IconCouncil, IconHome, IconGroup } from "./icons";
import { NATIONS, TIERS, CONNECTORS, VOTE_FOR, CHECKS, WHO_TO_CONTACT, contactAnswer, SCENARIOS, scenarioSteps, YOU } from "../data/governmentTiers";

const SECTION_COLOR = "#B5533C";
const DWELL_MS = 3800;
const YOU_INDEX = TIERS.length;
const ICONS = { parliament: IconParliament, government: IconCabinet, devolved: IconDevolved, combined: IconTransport, council: IconCouncil, parish: IconHome, you: IconGroup };

// Where the marker sits for a step: a tier's position (0 at the top), or the
// voter at the bottom for "you" and "vote".
function activeIndex(step) {
  if (!step) return 0;
  return step.tier === "you" || step.tier === "vote" ? YOU_INDEX : TIERS.findIndex((t) => t.key === step.tier);
}

function reducer(state, a) {
  if (a.type === "reset") return { step: 0, from: 0 };
  const to = Math.max(0, Math.min(a.to, a.steps.length - 1));
  return { step: to, from: activeIndex(a.steps[state.step]) };
}

// How long the marker takes to travel to a step, in seconds: longer for longer
// hops, and a slow climb for the vote so the way back up reads as its own moment.
function travelSeconds(from, step) {
  if (!step) return 0.6;
  if (step.tier === "vote") return 2.6;
  return Math.min(2.2, 0.75 + 0.3 * Math.abs(activeIndex(step) - from));
}

function Heading({ children }) {
  return <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, margin: "0 0 6px" }}>{children}</div>;
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
        fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "8px 15px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 7,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
        border: `1px solid ${primary ? SECTION_COLOR : COLORS.hairline}`, background: primary ? SECTION_COLOR : "transparent", color: primary ? "#fff" : COLORS.ink,
      }}
    >
      {children}
    </button>
  );
}

function Legend() {
  const item = (down, text) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
      <span aria-hidden="true" className="tier-legend-lane" data-dir={down ? "down" : "up"} style={{ "--lane": down ? SECTION_COLOR : COLORS.commonsGreen }} />
      {text}
    </span>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 26px", marginBottom: 16 }}>
      {item(true, "Laws, rules and money flow down")}
      {item(false, "Votes and scrutiny flow up")}
    </div>
  );
}

// One tier of the diagram, placed by its index so nothing ever reflows while the
// walk-through plays. `lit` and `arrive` time the highlight to the marker.
function Slab({ i, tier, exists, nationLabel, figure, selected, active, lit, arriveDelay, tokenLabel, onClick }) {
  const Icon = ICONS[tier.key];
  const color = tier.color;
  return (
    <>
      <span
        aria-hidden="true"
        className="tier-node"
        data-lit={lit ? "1" : "0"}
        style={{ "--i": i, "--c": color, "--delay": `${arriveDelay}s` }}
      />
      <button
        onClick={onClick}
        aria-pressed={selected}
        aria-current={active ? "step" : undefined}
        className="tier-slab"
        data-active={active || selected ? "1" : "0"}
        data-missing={exists ? "0" : "1"}
        style={{ "--i": i, "--c": color, "--delay": `${arriveDelay}s` }}
      >
        <span className="tier-slab-icon"><Icon size={22} /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="tier-slab-name">{tier.name}</span>
          <span className="tier-sub tier-slab-short">{tier.short}</span>
          {tier.keywords && <span className="tier-keys tier-slab-keys">{tier.keywords}</span>}
        </span>
        <span className="tier-slab-fig">
          {exists ? (
            <>
              <span className="tier-slab-num">{figure.value}</span>
              <span className="tier-sub tier-slab-label">{figure.label}</span>
            </>
          ) : (
            <span className="tier-slab-label">Not in {nationLabel}</span>
          )}
        </span>
        {tokenLabel && <span className="tier-pill" data-on={active ? "1" : "0"} style={{ "--c": color }}>{tokenLabel}</span>}
      </button>
    </>
  );
}

function Spine({ action, voting, tpos, fpos, tokenColor, stepKey }) {
  return (
    <div className="tier-spine" data-flow={action ? "off" : "on"} style={{ "--tpos": tpos, "--fpos": fpos, "--up": voting ? 1 : 0, "--tokc": tokenColor }}>
      <span className="tier-trk tier-trk-down" style={{ "--lane": SECTION_COLOR }} />
      <span className="tier-trk tier-trk-up" style={{ "--lane": COLORS.commonsGreen }} />
      <span className="tier-fill tier-fill-down" />
      <span className="tier-fill tier-fill-up" />
      <span className="tier-tok" data-on={action ? "1" : "0"} data-up={voting ? "1" : "0"}>
        <span key={stepKey} className="tier-ripple" />
      </span>
    </div>
  );
}

function TierInfo({ index, nation, nationLabel }) {
  const isYou = index === YOU_INDEX;
  const tier = isYou ? null : TIERS[index];
  const exists = isYou || tier.here[nation] !== undefined;
  const Icon = ICONS[isYou ? "you" : tier.key];
  const color = isYou ? COLORS.accent : tier.color;
  const name = isYou ? YOU.name : tier.name;
  const para = { fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 14px" };
  const links = isYou ? YOU.links : tier.links;
  const above = !isYou && index > 0 ? CONNECTORS[index - 1] : null;
  const below = !isYou && index < CONNECTORS.length ? CONNECTORS[index] : null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span className="tier-slab-icon" style={{ "--c": color }}><Icon size={22} /></span>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, margin: 0, lineHeight: 1.25 }}>{name}</h3>
      </div>
      {!exists ? (
        <p style={para}>{tier.absentNote ?? `There is no ${tier.name.toLowerCase()} in ${nationLabel}.`}</p>
      ) : (
        <>
          <Heading>What it does</Heading>
          <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft }}>
            {(isYou ? YOU.does : tier.does).map((d) => <li key={d} style={{ marginBottom: 4 }}>{d}</li>)}
          </ul>
          {!isYou && (
            <>
              <Heading>How you have a say</Heading>
              <p style={para}>{tier.chosen}</p>
              {tier.here[nation] && (
                <>
                  <Heading>In {nationLabel}</Heading>
                  <p style={para}>{tier.here[nation]}</p>
                </>
              )}
            </>
          )}
          {isYou && (
            <>
              <Heading>In {nationLabel}</Heading>
              <p style={para}>You vote for {VOTE_FOR[nation]}.</p>
            </>
          )}
          {(above || below) && (
            <>
              <Heading>How it connects</Heading>
              {above && <p style={{ ...para, margin: "0 0 6px" }}><strong style={{ color: COLORS.ink }}>Above:</strong> {above}.</p>}
              {below && <p style={para}><strong style={{ color: COLORS.ink }}>Below:</strong> {below}.</p>}
            </>
          )}
        </>
      )}
      {links.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color }}>{l.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionPanel({ scenarioKey, onScenario, steps, step, playing, finished, dispatch, onPlayPause, tokenLabel }) {
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Segmented label="Walk-through" small value={scenarioKey} onChange={onScenario} options={SCENARIOS.map((s) => ({ key: s.key, label: s.label }))} />
      <p className="tier-sub" style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "10px 0 12px" }}>{scenario.blurb}. A simplified illustration.</p>
      <ol aria-live="polite" style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {steps.map((s, i) => {
          const on = i === step;
          const done = i < step;
          return (
            <li key={s.tier} className="tier-step" data-active={on ? "1" : "0"}>
              <button onClick={() => dispatch({ type: "go", to: i, steps, user: true })} style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", padding: "6px 0", cursor: "pointer", font: "inherit" }}>
                <span
                  style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                    fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, transition: "background 0.3s, color 0.3s, border-color 0.3s",
                    background: on ? SECTION_COLOR : "transparent", color: on ? "#fff" : done ? SECTION_COLOR : COLORS.inkSoft, border: `1.5px solid ${on || done ? SECTION_COLOR : COLORS.hairline}`,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: on ? 17 : 15, fontWeight: on ? 600 : 500, color: on ? COLORS.ink : COLORS.inkSoft, lineHeight: 1.3, transition: "color 0.3s" }}>{s.title}</span>
                  {on && (
                    <span className="tier-step-body">
                      {tokenLabel && <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: SECTION_COLOR, marginTop: 3 }}>Carrying: {tokenLabel}</span>}
                      <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, marginTop: 3 }}>{s.text}</span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${COLORS.hairline}`, marginTop: 10 }}>
        <Control onClick={() => dispatch({ type: "go", to: step - 1, steps, user: true })} disabled={step === 0}>Back</Control>
        <Control primary onClick={onPlayPause}>
          {finished ? ReplayGlyph : playing ? PauseGlyph : PlayGlyph}
          {finished ? "Replay" : playing ? "Pause" : "Play"}
        </Control>
        <Control onClick={() => dispatch({ type: "go", to: step + 1, steps, user: true })} disabled={finished}>Next</Control>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginLeft: "auto" }}>Step {step + 1} of {steps.length}</span>
      </div>
    </div>
  );
}

export default function GovernmentTiers() {
  const [nation, setNation] = useState("england");
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState("explore");
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const [playing, setPlaying] = useState(false);
  const [{ step, from }, dispatch] = useReducer(reducer, { step: 0, from: 0 });
  const stageRef = useRef(null);

  const nationLabel = NATIONS.find((n) => n.key === nation).label;
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  const steps = useMemo(() => scenarioSteps(scenario, nation), [scenario, nation]);
  const cur = steps[Math.min(step, steps.length - 1)];
  const finished = step >= steps.length - 1;
  const action = mode === "action";
  const idx = activeIndex(cur);
  const voting = cur.tier === "vote";
  const dur = travelSeconds(from, cur);
  const runs = action && playing && !finished;

  // Auto-advance: once the marker has arrived, rest on the step for a moment,
  // then move on. Nothing here scrolls the page.
  useEffect(() => {
    if (!runs) return undefined;
    const id = setTimeout(() => dispatch({ type: "go", to: step + 1, steps }), dur * 1000 + DWELL_MS);
    return () => clearTimeout(id);
  }, [runs, step, steps, dur]);

  const bringIntoView = () => requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  const wrapped = (a) => {
    dispatch(a);
    if (a.user) setPlaying(false);
  };
  const enterAction = () => { setMode("action"); dispatch({ type: "reset" }); setPlaying(true); bringIntoView(); };
  const onMode = (k) => (k === "action" ? enterAction() : (setMode("explore"), setPlaying(false)));
  const onNation = (k) => { setNation(k); dispatch({ type: "reset" }); };
  const onScenario = (k) => { setScenarioKey(k); dispatch({ type: "reset" }); setPlaying(true); };
  const onPlayPause = () => {
    if (finished) { dispatch({ type: "reset" }); setPlaying(true); } else setPlaying(!playing);
  };
  const onSlab = (i) => {
    if (!action) { setSelected(i); return; }
    const at = steps.findIndex((s) => activeIndex(s) === i);
    if (at >= 0) wrapped({ type: "go", to: at, steps });
  };

  const tokenColor = voting ? COLORS.commonsGreen : idx === YOU_INDEX ? COLORS.accent : TIERS[idx].color;
  const slabs = [...TIERS, { key: "you", name: YOU.name, short: YOU.short, color: COLORS.accent, figure: YOU.figure, here: { [nation]: "" } }];
  const span = Math.max(1, Math.abs(idx - from));

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

      <div className="tier-wrap" ref={stageRef}>
        <div className="tier-grid">
          <div className="tier-diagram" style={{ "--dur": `${dur}s` }}>
            <Spine action={action} voting={voting} tpos={voting ? 0 : idx} fpos={action ? idx : 0} tokenColor={tokenColor} stepKey={`${scenarioKey}-${step}-${nation}`} />
            {slabs.map((t, i) => {
              const exists = t.here[nation] !== undefined;
              const lit = action && i <= idx;
              const frac = action && i > from && i <= idx ? (i - from) / span : 0;
              const arriveDelay = action ? dur * 0.9 * frac : 0;
              const here = action && (i === idx);
              return (
                <Slab
                  key={t.key}
                  i={i}
                  tier={t}
                  exists={exists}
                  nationLabel={nationLabel}
                  figure={t.figureHere?.[nation] ?? t.figure}
                  selected={!action && selected === i}
                  active={here}
                  lit={lit}
                  arriveDelay={here ? dur * 0.85 : arriveDelay}
                  tokenLabel={here && cur.token ? cur.token : null}
                  onClick={() => onSlab(i)}
                />
              );
            })}
          </div>

          <div className="tier-panel" style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "18px 20px" }}>
            {action ? (
              <ActionPanel
                scenarioKey={scenarioKey} onScenario={onScenario} steps={steps} step={Math.min(step, steps.length - 1)} playing={playing} finished={finished}
                dispatch={wrapped} onPlayPause={onPlayPause} tokenLabel={cur.token}
              />
            ) : (
              <div style={{ height: "100%", overflowY: "auto" }}>
                <TierInfo index={selected} nation={nation} nationLabel={nationLabel} />
              </div>
            )}
          </div>
        </div>
      </div>

      <Checks />
      <WhoToContact nation={nation} nationLabel={nationLabel} />
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
