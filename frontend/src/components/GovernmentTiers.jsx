import { Fragment, useState, useReducer, useRef, useEffect, useMemo } from "react";
import { m as motion, useInView, useReducedMotion } from "motion/react";
import { COLORS, FONT_DISPLAY, FONT_BODY, readable } from "../theme";
import { IconParliament, IconCabinet, IconDevolved, IconTransport, IconCouncil, IconHome, IconGroup } from "./icons";
import { NATIONS, TIERS, VOTE_FOR, CHECKS, WHO_TO_CONTACT, contactAnswer, SCENARIOS, scenarioSteps, YOU, visibleTierKeys, linkBetween, flowDown, electedAt } from "../data/governmentTiers";
import "../tiers.css";

const SECTION_COLOR = "#1E3A6E";
const DWELL_MS = 3800;
const ICONS = { parliament: IconParliament, government: IconCabinet, devolved: IconDevolved, combined: IconTransport, council: IconCouncil, parish: IconHome, you: IconGroup };
const YOU_TIER = { key: "you", name: YOU.name, short: YOU.short, color: COLORS.accent, figure: YOU.figure, links: YOU.links };
// The most tiers any nation shows, so the diagram keeps the same height whichever nation is chosen.
const MOST_TIERS = Math.max(...NATIONS.map((n) => visibleTierKeys(n.key).length));

// Where the marker sits for a step: a tier's place in the stack (0 at the top),
// or the voter at the bottom for "you" and "vote".
function positionOf(tierKey, order) {
  if (tierKey === "you" || tierKey === "vote") return order.length - 1;
  return Math.max(0, order.indexOf(tierKey));
}

function reducer(state, a) {
  if (a.type === "reset") return { step: 0, from: null };
  const to = Math.max(0, Math.min(a.to, a.steps.length - 1));
  return { step: to, from: a.steps[state.step]?.tier ?? null };
}

// How long the marker takes to travel to a step, in seconds: longer for longer
// hops, and a slow climb for the vote so the way back up reads as its own moment.
function travelSeconds(fromPos, toPos, isVote) {
  if (isVote) return 2.6;
  return Math.min(2.2, 0.75 + 0.3 * Math.abs(toPos - fromPos));
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
              fontFamily: FONT_BODY, fontSize: small ? 13 : 13.5, fontWeight: 600, padding: small ? "6px 12px" : "7px 14px", borderRadius: 8, cursor: "pointer",
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
const StopGlyph = <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="2" width="8" height="8" rx="1.500" fill="currentColor" /></svg>;
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

// One arrow, drawn the same everywhere: a line and a head made of two strokes with round ends. `dir` is the way it points.
function Arrow({ dir }) {
  const d = { down: "M8 1v22M2.500 17.500 8 23l5.500-5.500", left: "M23 8H1M6.500 2.500 1 8l5.500 5.500", up: "M8 23V1M2.500 6.500 8 1l5.500 5.500" }[dir];
  const wide = dir === "left";
  return (
    <svg className="tier-arrow" data-dir={dir} width={wide ? 24 : 16} height={wide ? 16 : 24} viewBox={wide ? "0 0 24 16" : "0 0 16 24"} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// What the two kinds of arrow mean, drawn with the same arrows as the diagram.
function Key({ hint }) {
  return (
    <div className="tier-keys">
      <span className="tier-key" data-dir="down"><Arrow dir="down" />Laws, rules and money pass down, tier by tier</span>
      <span className="tier-key" data-dir="vote"><Arrow dir="left" />Your votes go straight to each tier you elect</span>
      <span className="tier-hint"><i aria-hidden="true" />{hint}</span>
    </div>
  );
}

// One tier: a band, narrower than the one above because it covers a smaller area. The band is a button, and the green line beside it joins it to your vote.
function Row({ tier, figure, elected, voter, firstVote, selected, active, state, depth, tokenLabel, onClick, ring }) {
  const Icon = ICONS[tier.key];
  return (
    <div className="tier-row" data-state={state} data-you={voter ? "1" : undefined} data-vote={elected ? "1" : "0"} data-first={firstVote ? "1" : undefined} style={{ "--c": tier.color, "--ct": readable(tier.color), "--i": depth }}>
      <button onClick={onClick} aria-pressed={selected} aria-current={active ? "step" : undefined} className="tier-slab" data-key={tier.key} data-on={active || selected ? "1" : "0"}>
        <span className="tier-slab-icon">
          <Icon size={24} />
          <svg className="tier-tick" width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="7" fill="currentColor" /><path d="M3.800 7.200 6 9.300l4.200-4.400" fill="none" stroke="#fff" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {active && ring}
        </span>
        <span className="tier-slab-txt">
          <span className="tier-slab-name">{tier.slabName ?? tier.name}</span>
          {active && tokenLabel ? <span className="tier-pill">{tokenLabel}</span> : <span className="tier-slab-short">{tier.short}</span>}
          {!voter && <span className="tier-chip" data-yes={elected ? "1" : "0"}>{elected ? <>You vote for: <b>{elected}</b></> : "Not voted for directly"}</span>}
        </span>
        <span className="tier-slab-fig">
          <span className="tier-slab-num">{figure.value}</span>
          <span className="tier-slab-label">{figure.label}</span>
        </span>
      </button>
      <span className="tier-vl" aria-hidden="true">{(elected || voter) && <i />}</span>
    </div>
  );
}

// The space between two bands: what passes down. It lights up while the walk-through is crossing it.
function Gap({ text, live, done, token, depth }) {
  return (
    <div className="tier-gap" data-live={live ? "1" : "0"} data-done={done ? "1" : "0"} style={{ "--i": depth }}>
      <div className="tier-gap-mid">
        <Arrow dir="down" />
        <span className="tier-gap-txt"><span className="sr-only">Passes down: </span>{text}{live && token && <b className="tier-gap-token">{token}</b>}</span>
      </div>
      <span className="tier-vl" aria-hidden="true" />
    </div>
  );
}

// On a phone the panel sits below the diagram, so this slim bar rides along
// with the page while the walk-through plays.
function PhoneSheet({ sheetRef, steps, step, playing, finished, dispatch, onPlayPause, color }) {
  const cur = steps[step];
  const btn = { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: "transparent", color: COLORS.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 };
  return (
    <div ref={sheetRef} className="tier-mini" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 2 }}>
        Step {step + 1} of {steps.length}{cur.token ? `. Carrying: ${cur.token}` : ""}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}>{cur.title}</div>
      <p className="tier-mini-text" style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: COLORS.inkSoft, margin: "4px 0 0" }}>{cur.text}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => dispatch({ type: "go", to: step - 1, steps, user: true })} disabled={step === 0} style={{ ...btn, opacity: step === 0 ? 0.4 : 1 }}>Back</button>
        <button onClick={onPlayPause} style={{ ...btn, flex: 1, justifyContent: "center", background: SECTION_COLOR, borderColor: SECTION_COLOR, color: "#fff" }}>
          {finished ? ReplayGlyph : playing ? PauseGlyph : PlayGlyph}{finished ? "Replay" : playing ? "Pause" : "Play"}
        </button>
        <button onClick={() => dispatch({ type: "go", to: step + 1, steps, user: true })} disabled={finished} style={{ ...btn, opacity: finished ? 0.4 : 1 }}>Next</button>
      </div>
    </div>
  );
}

function TierInfo({ tierKey, order, nation, nationLabel }) {
  const isYou = tierKey === "you";
  const tier = isYou ? null : TIERS.find((t) => t.key === tierKey);
  const exists = isYou || tier.here[nation] !== undefined;
  const Icon = ICONS[tierKey];
  const color = isYou ? COLORS.accent : tier.color;
  const name = isYou ? YOU.name : tier.name;
  const para = { fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.ink, margin: "0 0 14px" };
  const links = isYou ? YOU.links : tier.links;
  const at = order.indexOf(tierKey);
  const aboveKey = at > 0 ? order[at - 1] : null;
  const belowKey = !isYou && at >= 0 ? order[at + 1] : null;
  const above = aboveKey ? linkBetween(aboveKey, tierKey) : null;
  const below = belowKey && belowKey !== "you" ? linkBetween(tierKey, belowKey) : null;
  return (
    <div>
      <div className="tier-info-head" style={{ "--c": color }}>
        <span className="tier-slab-icon"><Icon size={24} /></span>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700, color: COLORS.ink, margin: 0, lineHeight: 1.2 }}>{name}</h3>
      </div>
      {!exists ? (
        <p style={para}>{tier.absentNote ?? `There is no ${tier.name.toLowerCase()} in ${nationLabel}.`}</p>
      ) : (
        <>
          <Heading>What it does</Heading>
          <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.ink }}>
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
            <a key={l.href} href={l.href} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: readable(color), padding: "5px 0" }}>{l.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionPanel({ scenarioKey, steps, step, playing, finished, dispatch, onPlayPause, tokenLabel, dur }) {
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <p className="tier-sub" style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "0 0 10px" }}>{scenario.blurb}. A simplified illustration.</p>
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
                      <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink, marginTop: 3 }}>{s.text}</span>
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
      <div className="tier-dwell" aria-hidden="true">
        {playing && !finished && <span key={step} style={{ animationDuration: `${dur + DWELL_MS / 1000}s` }} />}
      </div>
    </div>
  );
}

export default function GovernmentTiers() {
  const [nation, setNation] = useState("england");
  const [selected, setSelected] = useState("parliament");
  const [scenarioKey, setScenarioKey] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [{ step, from }, dispatch] = useReducer(reducer, { step: 0, from: null });
  const diaRef = useRef(null);
  const sheetRef = useRef(null);
  const calm = useReducedMotion();
  const seen = useInView(diaRef, { once: true, margin: "0px 0px -12% 0px" });

  const nationLabel = NATIONS.find((n) => n.key === nation).label;
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey) ?? SCENARIOS[0];
  const steps = useMemo(() => scenarioSteps(scenario, nation), [scenario, nation]);
  const cur = steps[Math.min(step, steps.length - 1)];
  const finished = step >= steps.length - 1;
  const action = scenarioKey !== null;
  const order = useMemo(() => visibleTierKeys(nation), [nation]);
  const pos = positionOf(cur.tier, order);
  const fromPos = from === null ? 0 : positionOf(from, order);
  const voting = cur.tier === "vote";
  const dur = travelSeconds(fromPos, pos, voting);
  const curKey = voting ? "you" : cur.tier;
  const selKey = order.includes(selected) ? selected : order[0];
  const runs = action && playing && !finished;

  // Auto-advance: once the marker has arrived, rest on the step for a moment, then move on. The page itself never scrolls on its own, so nothing moves
  // except the diagram.
  useEffect(() => {
    if (!runs) return undefined;
    const id = setTimeout(() => dispatch({ type: "go", to: step + 1, steps }), dur * 1000 + DWELL_MS);
    return () => clearTimeout(id);
  }, [runs, step, steps, dur]);

  const wrapped = (a) => {
    dispatch(a);
    if (a.user) {
      setPlaying(false);
    }
  };
  const onNation = (k) => { setNation(k); dispatch({ type: "reset" }); };
  // Choosing a walk-through starts it; choosing the one that is running stops it and goes back to reading about tiers.
  const onScenario = (k) => {
    if (k === scenarioKey) { setScenarioKey(null); setPlaying(false); return; }
    setScenarioKey(k); dispatch({ type: "reset" }); setPlaying(true);
  };
  const onPlayPause = () => {
    if (finished) { dispatch({ type: "reset" }); setPlaying(true); } else setPlaying(!playing);
  };
  const onSlab = (key) => {
    if (!action) { setSelected(key); return; }
    const at = steps.findIndex((s) => (s.tier === "vote" ? "you" : s.tier) === key);
    if (at >= 0) wrapped({ type: "go", to: at, steps });
  };

  const slabs = order.map((k) => (k === "you" ? YOU_TIER : TIERS.find((t) => t.key === k)));
  const tokenColor = voting ? COLORS.commonsGreen : slabs[pos].color;
  // Tiers the story reached before this step.
  const reachedBefore = steps.slice(0, step).map((st) => (st.tier === "vote" ? "you" : st.tier));
  const reachedNow = new Set([...reachedBefore, curKey]);
  const colors = useMemo(() => Object.fromEntries([...TIERS.map((t) => [t.key, t.color]), ["you", YOU_TIER.color]]), []);
  // The marker is one element that moves from tier to tier, so it glides across the boxes instead of jumping.
  const ring = (
    <motion.span
      layoutId="tier-marker" className="tier-marker" aria-hidden="true" style={{ "--c": tokenColor }}
      transition={calm ? { duration: 0 } : { duration: Math.max(0.5, dur), ease: [0.45, 0.05, 0.25, 1] }}
    />
  );
  // Top to bottom: a band for each tier, with the arrow for what passes down between them. The first elected tier is where the green votes line begins.
  const firstVote = slabs.findIndex((t) => t.key !== "you" && electedAt(t.key, nation));
  const rows = slabs.map((t, i) => {
    const last = i === slabs.length - 1;
    const here = action && i === pos;
    const next = slabs[i + 1];
    return (
      <Fragment key={t.key}>
        <Row
          tier={t} figure={t.figureHere?.[nation] ?? t.figure} elected={last ? null : electedAt(t.key, nation)} voter={last} firstVote={i === firstVote}
          selected={!action && selKey === t.key} active={here} state={!action ? "idle" : here ? "active" : reachedNow.has(t.key) ? "done" : "todo"} depth={i}
          tokenLabel={here && cur.token ? cur.token : null} onClick={() => onSlab(t.key)} ring={ring}
        />
        {next && <Gap text={flowDown(t.key, next.key)} live={action && pos === i + 1 && !voting} done={action && reachedNow.has(next.key)} token={cur.token} depth={i} />}
      </Fragment>
    );
  });

  return (
    <motion.div
      id="tiers"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      style={{
        marginBottom: 32, background: COLORS.paperCard, borderLeft: `1px solid ${COLORS.hairline}`, borderRight: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`, boxShadow: `var(--shadow-1), inset 0 4px 0 ${SECTION_COLOR}`, borderRadius: 16, padding: "24px clamp(16px, 4vw, 28px)",
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>Who does what? The tiers of government</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20, maxWidth: 780, lineHeight: 1.6 }}>
        Power in the UK is shared between several tiers, from Parliament down to your village. Each one has its own job and its own voters. This is a map
        of how they connect, not a chain of command: a minister can't tell a councillor what to decide, though they do hold the purse strings.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, fontWeight: 600, marginRight: 4 }}>Where do you live?</span>
          <Segmented label="Where you live" value={nation} onChange={onNation} options={NATIONS} />
        </div>
      </div>

      <div className="tier-wrap">
        <div className="tier-grid">
          <div className="tier-diagram" ref={diaRef} data-in={seen || calm ? "1" : "0"} data-mode={action ? "action" : "explore"} data-vote={action && voting ? "1" : "0"}>
            <Key hint={action ? "Follow the marker down the tiers" : "Select any band to read about it"} />
            <div className="tier-stack" style={{ "--n": MOST_TIERS }}>{rows}</div>
          </div>

          {action && (
            <div className="tier-mini-wrap">
            <PhoneSheet
              sheetRef={sheetRef} steps={steps} step={Math.min(step, steps.length - 1)} playing={playing} finished={finished}
              dispatch={wrapped} onPlayPause={onPlayPause} color={tokenColor}
            />
            </div>
          )}

          <div className="tier-panelcol">
          <div className="tier-panel" data-c="1" style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${action ? tokenColor : colors[selKey]}`, borderRadius: 14, padding: "18px 20px", transition: "border-color 0.4s" }}>
            <div className="tier-walk" role="group" aria-label="Watch it happen">
              <span>Watch it happen</span>
              {SCENARIOS.map((sc) => <button key={sc.key} type="button" aria-pressed={scenarioKey === sc.key} onClick={() => onScenario(sc.key)}>{scenarioKey === sc.key ? StopGlyph : PlayGlyph}{sc.label}</button>)}
            </div>
            {action ? (
              <ActionPanel
                scenarioKey={scenarioKey} steps={steps} step={Math.min(step, steps.length - 1)} playing={playing} finished={finished}
                dispatch={wrapped} onPlayPause={onPlayPause} tokenLabel={cur.token} dur={dur}
              />
            ) : (
              <div className="tier-scroll">
                <div key={`${selKey}-${nation}`} className="tier-info-in"><TierInfo tierKey={selKey} order={order} nation={nation} nationLabel={nationLabel} /></div>
              </div>
            )}
          </div>
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
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "0 32px" }}>
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
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "2px 24px", padding: "10px 0 10px 12px", borderTop: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${tier.color}` }}
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
