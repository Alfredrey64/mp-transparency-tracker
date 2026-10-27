import { useState, useReducer, useRef, useEffect, useMemo } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import TierFlow from "./TierFlow";
import { lowData } from "../lib/lowData";
import { loadGsapCore } from "../lib/gsapLoader";
import { COLORS, FONT_DISPLAY, FONT_BODY, readable } from "../theme";
import { IconParliament, IconCabinet, IconDevolved, IconTransport, IconCouncil, IconHome, IconGroup } from "./icons";
import { buildLayout, routeBetween } from "../lib/tierTree";
import { NATIONS, TIERS, VOTE_FOR, CHECKS, WHO_TO_CONTACT, contactAnswer, SCENARIOS, scenarioSteps, YOU, visibleTierKeys, linkBetween } from "../data/governmentTiers";

const SECTION_COLOR = "#1E3A6E";
const DWELL_MS = 3800;
const ICONS = { parliament: IconParliament, government: IconCabinet, devolved: IconDevolved, combined: IconTransport, council: IconCouncil, parish: IconHome, you: IconGroup };
const YOU_TIER = { key: "you", name: YOU.name, short: YOU.short, color: COLORS.accent, figure: YOU.figure, links: YOU.links };

// How far a tier reaches, from the whole country down to your own front door: drawn as rings inside each box, with the tier's own ring filled in.
const SCOPE = { parliament: 0, government: 0, devolved: 1, combined: 2, council: 3, parish: 4, you: 5 };
const SCOPE_NAME = ["the whole UK", "a nation", "a city region", "a council area", "a village or town", "your home"];
function ScopeRings({ at }) {
  return (
    <svg className="tier-rings" viewBox="10 0 100 100" aria-hidden="true">
      {[46, 38, 30, 22, 14].map((r, i) => <circle key={r} cx="60" cy="50" r={r} className={i === at ? "tier-ring tier-ring-on" : "tier-ring"} />)}
      <circle cx="60" cy="50" r="5.5" className={at === 5 ? "tier-ring tier-ring-on" : "tier-ring"} />
    </svg>
  );
}

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
      <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true" fill="none" stroke={down ? "#3B4A66" : "#2E7D5B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {down ? <path d="M6 2v11M2 9l4 4 4-4" /> : <path d="M6 14V3M2 7l4-4 4 4" />}
      </svg>
      {text}
    </span>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 26px", marginBottom: 16 }}>
      {item(true, "Laws, rules and money flow down")}
      {item(false, "Votes and scrutiny flow up")}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
        <svg width="18" height="18" viewBox="10 0 100 100" aria-hidden="true" fill="none" stroke="#6B7A90" strokeWidth="6">{[46, 32, 18].map((r) => <circle key={r} cx="60" cy="50" r={r} />)}</svg>
        Rings show how far a tier reaches: the whole UK outside, your home in the middle
      </span>
    </div>
  );
}

// One tier of the diagram, placed by its position in the stack so nothing ever
// reflows while the walk-through plays.
function Slab({ box, tier, figure, selected, active, state, index, arriveDelay, tokenLabel, onClick }) {
  const Icon = ICONS[tier.key];
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-current={active ? "step" : undefined}
      className="tier-slab"
      data-key={tier.key}
      data-active={active || selected ? "1" : "0"}
      data-state={state}
      style={{ left: box.left, top: box.top, width: box.width, height: box.height, "--c": tier.color, "--ct": readable(tier.color), "--delay": `${arriveDelay}s`, "--i": index }}
    >
      <span className="tier-slab-icon"><Icon size={22} /><svg className="tier-tick" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="7" fill="currentColor" /><path d="M3.8 7.2 6 9.3l4.2-4.4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="tier-slab-name">{tier.slabName ?? tier.name}</span>
        <span className="tier-sub tier-slab-short">{tier.short}</span>
        {tier.keywords && <span className="tier-keys tier-slab-keys">{tier.keywords}</span>}
      </span>
      <span className="tier-slab-scope" role="img" aria-label={`Covers ${SCOPE_NAME[SCOPE[tier.key]]}`} title={`Covers ${SCOPE_NAME[SCOPE[tier.key]]}`}><ScopeRings at={SCOPE[tier.key]} /></span>
      <span className="tier-slab-fig">
        <span className="tier-slab-num">{figure.value}</span>
        <span className="tier-sub tier-slab-label">{figure.label}</span>
      </span>
      {tokenLabel && <span className="tier-pill" data-on={active ? "1" : "0"} style={{ "--c": tier.color }}>{tokenLabel}</span>}
    </button>
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

function ActionPanel({ scenarioKey, onScenario, steps, step, playing, finished, dispatch, onPlayPause, tokenLabel, dur }) {
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
  const [mode, setMode] = useState("explore");
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const [playing, setPlaying] = useState(false);
  const [{ step, from }, dispatch] = useReducer(reducer, { step: 0, from: null });
  const stageRef = useRef(null);
  const diaRef = useRef(null);
  const sheetRef = useRef(null);
  const calm = useReducedMotion();
  const seen = useInView(diaRef, { once: true, margin: "0px 0px -12% 0px" });
  const onScreen = useInView(diaRef, { margin: "120px 0px 120px 0px" });
  const still = Boolean(calm) || lowData();
  const [gsapReady, setGsapReady] = useState(false);
  const [introFlag, setIntroFlag] = useState(false);
  const introDone = still || introFlag;
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
  // The same room is kept in every mode and for every nation, so choosing one never changes how tall the diagram is, and nothing below it moves.
  const availH = Math.max(320, screenH - (stacked ? 270 : 190));
  const layout = useMemo(() => buildLayout(nation, width, availH), [nation, width, availH]);
  const fullH = useMemo(() => Math.max(...NATIONS.map((n) => buildLayout(n.key, width, availH).height)), [width, availH]);
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
    // A phone's address bar slides away as you scroll and changes the window height by a few dozen pixels; redrawing the diagram for that makes it jump.
    let lastW = window.innerWidth;
    const onResize = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      setScreenH((prev) => (w !== lastW || Math.abs(h - prev) > 140 ? h : prev));
      lastW = w;
    };
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      ro2?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // GSAP is fetched as soon as the section is on the page, so it is ready by the time the diagram scrolls into view.
  useEffect(() => {
    if (still) return undefined;
    let alive = true;
    loadGsapCore().then(() => { if (alive) setGsapReady(true); }).catch(() => {});
    return () => { alive = false; };
  }, [still]);

  // The entrance: the tiers slide in one after another, their icons pop, and the branches draw themselves between them. Everything is put back
  // to its normal state when it ends, and the drifting dots only start then.
  useEffect(() => {
    const dia = diaRef.current;
    if (still || !seen || !gsapReady || !dia) return undefined;
    let ctx;
    let dead = false;
    // A safety net: whatever happens to the animation, the boxes and branches are put back to plain and visible after a few seconds.
    const guard = setTimeout(() => {
      dia.querySelectorAll(".tier-slab, .tier-slab-icon, .tb-base, .tb-dot").forEach((el) => {
        el.style.removeProperty("visibility"); el.style.removeProperty("opacity"); el.style.removeProperty("transform");
      });
      setIntroFlag(true);
    }, 4500);
    loadGsapCore().then(({ gsap }) => {
      if (dead) return;
      ctx = gsap.context(() => {
        const slabs = dia.querySelectorAll(".tier-slab");
        const icons = dia.querySelectorAll(".tier-slab-icon");
        const bases = dia.querySelectorAll(".tb-base");
        const dots = dia.querySelectorAll(".tb-dot");
        bases.forEach((b) => b.setAttribute("marker-end", "none"));
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            bases.forEach((b) => b.setAttribute("marker-end", `url(#tb-arr-${b.dataset.marker})`));
            setIntroFlag(true);
            clearTimeout(guard);
          },
        });
        tl.fromTo(slabs, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09, clearProps: "transform,opacity,visibility" }, 0);
        tl.fromTo(icons, { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: "power2.out", stagger: 0.09, clearProps: "transform,opacity,visibility" }, 0.12);
        tl.fromTo(bases, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut", stagger: 0.08, clearProps: "strokeDasharray,strokeDashoffset" }, 0.4);
        tl.fromTo(dots, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.3, ease: "power2.out", stagger: 0.04, clearProps: "transform" }, 0.8);
      }, dia);
    }).catch(() => setIntroFlag(true));
    return () => { dead = true; clearTimeout(guard); ctx?.revert(); };
  }, [seen, gsapReady, still]);

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
  const enterAction = () => { setMode("action"); dispatch({ type: "reset" }); setPlaying(true); };
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
  // Tiers the story reached before this step; their branches are already drawn in.
  const reachedBefore = steps.slice(0, step).map((st) => (st.tier === "vote" ? "you" : st.tier));
  const reachedNow = new Set([...reachedBefore, curKey]);
  const colors = useMemo(() => Object.fromEntries([...TIERS.map((t) => [t.key, t.color]), ["you", YOU_TIER.color]]), []);
  // Exploring: the tiers from the top down to the one picked, so the diagram can show the line of who answers to whom.
  const chain = useMemo(() => {
    const out = [];
    for (let k = layout.byKey[selKey]; k && k.parent; k = layout.byKey[k.parent]) out.unshift(k.key);
    return out;
  }, [layout, selKey]);
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
        <Segmented
          label="View"
          value={mode}
          onChange={onMode}
          options={[{ key: "explore", label: "Explore" }, { key: "action", label: "See it in action", icon: PlayGlyph }]}
        />
      </div>

      <Legend />

      <div className="tier-wrap" ref={stageRef}>
        <div className="tier-grid" style={{ "--len": `${fullH}px` }}>
          <div className="tier-diagram" ref={diaRef} data-density={layout.metrics.density} data-in={seen || calm ? "1" : "0"} data-gsap={gsapReady && !still ? "1" : "0"} data-mode={action ? "action" : "explore"} data-run={!action && !still && onScreen && introDone ? "1" : "0"} style={{ "--dur": `${dur}s`, height: fullH }}>
            <TierFlow
              layout={layout} action={action} calm={still} visible={onScreen && introDone} curKey={curKey} voting={voting} route={beadPath} dur={dur} color={tokenColor}
              stepKey={`${scenarioKey}-${step}-${nation}`} reachedBefore={reachedBefore} colors={colors} chain={chain}
            />
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
                  state={!action ? "idle" : here ? "active" : reachedNow.has(t.key) ? "done" : "todo"}
                  index={i}
                  arriveDelay={here ? dur * 0.85 : dur * 0.9 * frac}
                  tokenLabel={here && cur.token ? cur.token : null}
                  onClick={() => onSlab(t.key)}
                />
              );
            })}
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
            {action ? (
              <ActionPanel
                scenarioKey={scenarioKey} onScenario={onScenario} steps={steps} step={Math.min(step, steps.length - 1)} playing={playing} finished={finished}
                dispatch={wrapped} onPlayPause={onPlayPause} tokenLabel={cur.token} dur={dur}
              />
            ) : (
              <div className="tier-scroll">
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
