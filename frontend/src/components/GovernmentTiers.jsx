import { useState, useReducer, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "../theme";
import { IconParliament, IconCabinet, IconDevolved, IconTransport, IconCouncil, IconHome, IconGroup } from "./icons";
import { buildLayout, routeBetween } from "../lib/tierTree";
import { NATIONS, TIERS, VOTE_FOR, CHECKS, WHO_TO_CONTACT, contactAnswer, SCENARIOS, scenarioSteps, YOU, visibleTierKeys, linkBetween } from "../data/governmentTiers";

const SECTION_COLOR = "#B5533C";
const DWELL_MS = 3800;
const ICONS = { parliament: IconParliament, government: IconCabinet, devolved: IconDevolved, combined: IconTransport, council: IconCouncil, parish: IconHome, you: IconGroup };
const YOU_TIER = { key: "you", name: YOU.name, short: YOU.short, color: COLORS.accent, figure: YOU.figure, links: YOU.links };

// Where the marker sits for a step: a tier's place in the stack (0 at the top),
// or the voter at the bottom for "you" and "vote".
function positionOf(tierKey, order) {
  if (tierKey === "you" || tierKey === "vote") return order.length - 1;
  return Math.max(0, order.indexOf(tierKey));
}

// On a phone the walk-through sheet covers the bottom of the screen, so nudge
// the page (smoothly, and only when needed) to keep the active box in the clear
// area above it.
function followBox(layout, key, diagramEl, sheetEl) {
  if (!sheetEl || !diagramEl || getComputedStyle(sheetEl).display === "none") return;
  const box = layout.byKey[key];
  if (!box) return;
  const top = diagramEl.getBoundingClientRect().top + box.top;
  const sheetH = sheetEl.getBoundingClientRect().height + 20;
  const minTop = 76;
  const maxBottom = window.innerHeight - sheetH;
  if (top < minTop || top + box.height > maxBottom) {
    const want = Math.max(minTop, (maxBottom - box.height) / 2);
    window.scrollBy({ top: top - want, behavior: "smooth" });
  }
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
      <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true" fill="none" stroke={down ? SECTION_COLOR : COLORS.commonsGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {down ? <path d="M6 2v11M2 9l4 4 4-4" /> : <path d="M6 14V3M2 7l4-4 4 4" />}
      </svg>
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

// One tier of the diagram, placed by its position in the stack so nothing ever
// reflows while the walk-through plays.
function Slab({ box, tier, figure, selected, active, arriveDelay, tokenLabel, onClick }) {
  const Icon = ICONS[tier.key];
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-current={active ? "step" : undefined}
      className="tier-slab"
      data-active={active || selected ? "1" : "0"}
      style={{ left: box.left, top: box.top, width: box.width, height: box.height, "--c": tier.color, "--delay": `${arriveDelay}s` }}
    >
      <span className="tier-slab-icon"><Icon size={22} /></span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="tier-slab-name">{tier.slabName ?? tier.name}</span>
        <span className="tier-sub tier-slab-short">{tier.short}</span>
        {tier.keywords && <span className="tier-keys tier-slab-keys">{tier.keywords}</span>}
      </span>
      <span className="tier-slab-fig">
        <span className="tier-slab-num">{figure.value}</span>
        <span className="tier-sub tier-slab-label">{figure.label}</span>
      </span>
      {tokenLabel && <span className="tier-pill" data-on={active ? "1" : "0"} style={{ "--c": tier.color }}>{tokenLabel}</span>}
    </button>
  );
}

// The branches: red down through the tiers, green back up from you. Dots drift
// along them in Explore. In the walk-through each branch fills in as the bead
// reaches the tier it leads to.
function Branches({ layout, action, reached, voting, dur }) {
  const { width, height } = layout;
  const arrow = (id, color) => (
    <marker id={id} viewBox="0 0 12 12" refX="9" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M2.5 2 L9 6 L2.5 10" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </marker>
  );
  return (
    <svg className="tb-svg" data-mode={action ? "action" : "explore"} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        {arrow("tb-arr-down", "#D4573A")}
        {arrow("tb-arr-up", "#1FA97C")}
      </defs>
      {layout.edges.map((e) => (
        <g key={e.key} className="tb-down">
          <path d={e.d} className="tb-base" markerEnd="url(#tb-arr-down)" />
          <path d={e.d} className="tb-flow" />
          <path d={e.d} className="tb-done" pathLength="1" data-done={action && reached.has(e.key) ? "1" : "0"} />
        </g>
      ))}
      <g className="tb-up">
        <path d={layout.trunk} className="tb-base" markerEnd="url(#tb-arr-up)" />
        <path d={layout.trunk} className="tb-flow" />
        <path d={layout.trunk} className="tb-done" pathLength="1" data-done={action && voting ? "1" : "0"} />
        {layout.stubs.map((st) => (
          <g key={st.key}>
            <path d={st.d} className="tb-base" markerEnd="url(#tb-arr-up)" />
            <path d={st.d} className="tb-flow" />
            <path d={st.d} className="tb-done" pathLength="1" data-done={action && voting ? "1" : "0"} style={{ transitionDelay: action && voting ? `${(dur * (1 - st.at) * 0.9).toFixed(2)}s` : "0s" }} />
          </g>
        ))}
      </g>
      {layout.dots.map((d) => {
        const lit = action && (d.up ? voting : reached.has(d.fromLast ? "you" : d.key));
        return (
          <circle
            key={d.key} cx={d.x} cy={d.y} r="5" className={`tb-dot ${d.up ? "tb-dot-up" : "tb-dot-down"}`} data-lit={lit ? "1" : "0"}
            style={d.up && action && voting ? { transitionDelay: `${(dur * (1 - d.at) * 0.9).toFixed(2)}s` } : undefined}
          />
        );
      })}
    </svg>
  );
}

// The glowing bead that travels the branches in the walk-through.
function Bead({ action, path, color, stepKey }) {
  return (
    <span
      key={stepKey}
      className="tb-bead"
      data-on={action ? "1" : "0"}
      aria-hidden="true"
      style={{ offsetPath: `path("${path}")`, "--tokc": color }}
    >
      <span className="tier-ripple" />
    </span>
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
  const para = { fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 14px" };
  const links = isYou ? YOU.links : tier.links;
  const at = order.indexOf(tierKey);
  const aboveKey = at > 0 ? order[at - 1] : null;
  const belowKey = !isYou && at >= 0 ? order[at + 1] : null;
  const above = aboveKey ? linkBetween(aboveKey, tierKey) : null;
  const below = belowKey && belowKey !== "you" ? linkBetween(tierKey, belowKey) : null;
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
            <a key={l.href} href={l.href} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color, padding: "5px 0" }}>{l.label}</a>
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
  const [selected, setSelected] = useState("parliament");
  const [mode, setMode] = useState("explore");
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const [playing, setPlaying] = useState(false);
  const [{ step, from }, dispatch] = useReducer(reducer, { step: 0, from: null });
  const stageRef = useRef(null);
  const colRef = useRef(null);
  const panelRef = useRef(null);
  const diaRef = useRef(null);
  const sheetRef = useRef(null);
  // A first guess at the diagram's width (refined as soon as it is measured), so a phone never starts from a desktop-sized layout.
  // A first guess at the page column's width (refined once measured): the screen minus the menu, if the menu is showing.
  const [wrapWidth, setWrapWidth] = useState(() => (typeof window === "undefined" ? 1000 : window.innerWidth > 880 ? window.innerWidth - 380 : window.innerWidth - 72));
  const [screenH, setScreenH] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 560 : Math.max(240, Math.min(560, window.innerWidth - 72))));

  const nationLabel = NATIONS.find((n) => n.key === nation).label;
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  const steps = useMemo(() => scenarioSteps(scenario, nation), [scenario, nation]);
  const cur = steps[Math.min(step, steps.length - 1)];
  const finished = step >= steps.length - 1;
  const action = mode === "action";
  const order = useMemo(() => visibleTierKeys(nation), [nation]);
  const pos = positionOf(cur.tier, order);
  const fromPos = from === null ? 0 : positionOf(from, order);
  const voting = cur.tier === "vote";
  const dur = travelSeconds(fromPos, pos, voting);
  // Size the diagram so the whole thing fits on screen: less room is kept back
  // on a big screen, more on a phone where the walk-through sheet takes the bottom.
  const stacked = wrapWidth < 780;
  const availH = Math.max(320, screenH - (stacked ? (action ? 270 : 150) : 190));
  const layout = useMemo(() => buildLayout(nation, width, availH), [nation, width, availH]);
  const curKey = voting ? "you" : cur.tier;
  const selKey = order.includes(selected) ? selected : order[0];
  const runs = action && playing && !finished;

  // Keep the diagram's drawing the same width as the space it sits in.
  useEffect(() => {
    const el = diaRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    const wrap = stageRef.current;
    const ro2 = wrap ? new ResizeObserver(([entry]) => setWrapWidth(Math.round(entry.contentRect.width))) : null;
    if (wrap) ro2.observe(wrap);
    const onResize = () => setScreenH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      ro2?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Auto-advance: once the marker has arrived, rest on the step for a moment,
  // then move on. On a phone the page follows the marker, gently.
  useEffect(() => {
    if (!runs) return undefined;
    const next = steps[step + 1];
    const id = setTimeout(() => {
      dispatch({ type: "go", to: step + 1, steps });
      if (next) followBox(layout, next.tier === "vote" ? layout.nodes[0].key : next.tier, diaRef.current, sheetRef.current);
    }, dur * 1000 + DWELL_MS);
    return () => clearTimeout(id);
  }, [runs, step, steps, dur, layout]);

  // The panel follows you down the diagram, then eases back to the top of its
  // column once you have scrolled past the end. The transition on .tier-panel
  // makes both moves smooth.
  useEffect(() => {
    const col = colRef.current;
    const panel = panelRef.current;
    if (!col || !panel) return undefined;
    const place = () => {
      const c = col.getBoundingClientRect();
      const room = Math.max(0, c.height - panel.offsetHeight);
      const extra = parseFloat(getComputedStyle(col).paddingBottom) || 0;
      const past = c.bottom - extra < 140;
      const y = past ? 0 : Math.min(room, Math.max(0, 16 - c.top));
      panel.style.transform = `translateY(${Math.round(y)}px)`;
      panel.style.opacity = past ? "0" : "1";
      panel.style.pointerEvents = past ? "none" : "";
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, []);

  const bringIntoView = () => requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  const wrapped = (a) => {
    dispatch(a);
    if (a.user) {
      setPlaying(false);
      const target = a.steps[Math.max(0, Math.min(a.to, a.steps.length - 1))];
      requestAnimationFrame(() => followBox(layout, target.tier === "vote" ? layout.nodes[0].key : target.tier, diaRef.current, sheetRef.current));
    }
  };
  const enterAction = () => { setMode("action"); dispatch({ type: "reset" }); setPlaying(true); bringIntoView(); };
  const onMode = (k) => (k === "action" ? enterAction() : (setMode("explore"), setPlaying(false)));
  const onNation = (k) => { setNation(k); dispatch({ type: "reset" }); };
  const onScenario = (k) => { setScenarioKey(k); dispatch({ type: "reset" }); setPlaying(true); };
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
  const span = Math.max(1, Math.abs(pos - fromPos));
  // Tiers the story has reached so far; their branches are drawn in.
  const reached = new Set(steps.slice(0, step + 1).map((st) => (st.tier === "vote" ? "you" : st.tier)));
  const toBox = layout.byKey[curKey];
  const beadPath = voting ? layout.trunk : (from !== null ? routeBetween(layout, from === "vote" ? "you" : from, cur.tier) : null) ?? `M ${toBox.left - 9} ${toBox.midY}`;

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
        <Segmented
          label="View"
          value={mode}
          onChange={onMode}
          options={[{ key: "explore", label: "Explore" }, { key: "action", label: "See it in action", icon: PlayGlyph }]}
        />
      </div>

      <Legend />

      <div className="tier-wrap" ref={stageRef}>
        <div className="tier-grid" style={{ "--len": `${layout.height}px` }}>
          <div className="tier-diagram" ref={diaRef} data-density={layout.metrics.density} style={{ "--dur": `${dur}s`, height: layout.height }}>
            <Branches layout={layout} action={action} reached={reached} voting={voting} dur={dur} />
            <Bead action={action} path={beadPath} color={tokenColor} stepKey={`${scenarioKey}-${step}-${nation}`} />
            {slabs.map((t, i) => {
              const here = action && i === pos;
              const frac = action && i > fromPos && i <= pos ? (i - fromPos) / span : 0;
              return (
                <Slab
                  key={t.key}
                  box={layout.byKey[t.key]}
                  tier={t}
                  figure={t.figureHere?.[nation] ?? t.figure}
                  selected={!action && selKey === t.key}
                  active={here}
                  arriveDelay={here ? dur * 0.85 : dur * 0.9 * frac}
                  tokenLabel={here && cur.token ? cur.token : null}
                  onClick={() => onSlab(t.key)}
                />
              );
            })}
          </div>

          {action && (
            <PhoneSheet
              sheetRef={sheetRef} steps={steps} step={Math.min(step, steps.length - 1)} playing={playing} finished={finished}
              dispatch={wrapped} onPlayPause={onPlayPause} color={tokenColor}
            />
          )}

          <div className="tier-panelcol" ref={colRef}>
          <div className="tier-panel" ref={panelRef} style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "18px 20px" }}>
            {action ? (
              <ActionPanel
                scenarioKey={scenarioKey} onScenario={onScenario} steps={steps} step={Math.min(step, steps.length - 1)} playing={playing} finished={finished}
                dispatch={wrapped} onPlayPause={onPlayPause} tokenLabel={cur.token}
              />
            ) : (
              <div style={{ height: "100%", overflowY: "auto" }}>
                <TierInfo tierKey={selKey} order={order} nation={nation} nationLabel={nationLabel} />
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
