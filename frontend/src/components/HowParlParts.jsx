import { useEffect, useId, useRef, useState } from "react";
import { m as motion, useReducedMotion } from "motion/react";
import { COLORS, readable } from "../theme";
import { CommonsBadge } from "./shared";
import { IconLords } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";
import { lowData } from "../lib/lowData";
import { useGo } from "./story/useGo";
import "../howparl.css";

// The pieces of the How Parliament works page that used to be rows of drop-downs: a stepper that shows one stage at a time (with a track you can press, the arrow keys, a swipe
// and a "play" button), the four layers of who is in charge laid out in full, the two Houses as a dot for every member, and the job of an MP as a few cards under three tabs.
// The words are the page's own: every piece is given the stages it shows.

const PLUM = "#7A4B63";

// ---- The stepper --------------------------------------------------------------------------------------------------------------------------------------------------------

const plain = (label) => label.replace(/"/g, "");

export function StageDeck({ stages, color, name }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(false);
  const calm = useReducedMotion() || lowData();
  const touch = useRef(null);
  const tabs = useRef([]);
  const n = stages.length;
  const stage = stages[i];
  const id = useId();

  function go(next, byHand = true) {
    const k = Math.max(0, Math.min(n - 1, next));
    if (byHand) setPlaying(false);
    if (k === i) return;
    withScrollPreserved(() => { setDir(k > i ? 1 : -1); setI(k); });
  }

  // "Play" steps through the stages, a few seconds each, and stops at the last one.
  const running = playing && i < n - 1;
  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(() => { setDir(1); setI((k) => k + 1); }, 6500);
    return () => clearTimeout(t);
  }, [running, i]);

  function onKey(e) {
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    const k = Math.max(0, Math.min(n - 1, to));
    go(k);
    tabs.current[k]?.focus();
  }

  function swipeStart(e) { const t = e.touches[0]; touch.current = [t.clientX, t.clientY]; }
  function swipeEnd(e) {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current[0];
    const dy = t.clientY - touch.current[1];
    touch.current = null;
    if (Math.abs(dx) > 56 && Math.abs(dy) < 40) go(i + (dx < 0 ? 1 : -1));
  }

  return (
    <div className="hwk-deck" style={{ "--c": color, "--cr": readable(color) }}>
      <div className="hwk-track" role="tablist" aria-label={name} onKeyDown={onKey} style={{ "--n": n }}>
        <div className="hwk-rail" aria-hidden="true"><i style={{ transform: `scaleX(${n > 1 ? i / (n - 1) : 1})` }} /></div>
        {stages.map((s, k) => (
          <button
            key={s.key}
            ref={(el) => { tabs.current[k] = el; }}
            type="button"
            role="tab"
            id={`${id}-t${k}`}
            aria-selected={k === i}
            aria-controls={`${id}-p`}
            tabIndex={k === i ? 0 : -1}
            data-state={k < i ? "done" : k === i ? "now" : "todo"}
            onClick={() => go(k)}
            title={plain(s.label)}
            aria-label={`Stage ${k + 1}: ${plain(s.label)}`}
          >
            <span className="hwk-node">{k < i ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : k + 1}</span>
            <span className="hwk-node-label">{plain(s.label)}</span>
          </button>
        ))}
      </div>

      <div className="hwk-panel" id={`${id}-p`} role="tabpanel" aria-labelledby={`${id}-t${i}`} key={stage.key} data-dir={dir} data-vis={stage.visual ? "1" : undefined} onTouchStart={swipeStart} onTouchEnd={swipeEnd}>
        <p className="hwk-count">Stage {i + 1} of {n}</p>
        <h3 className="hwk-title">{plain(stage.label)}</h3>
        <p className="hwk-desc">{stage.desc}</p>
        {stage.visual && <div className="hwk-visual">{stage.visual}</div>}
      </div>

      <div className="hwk-controls">
        <button type="button" className="hwk-btn" onClick={() => go(i - 1)} disabled={i === 0}>Back</button>
        <button type="button" className="hwk-btn hwk-primary" onClick={() => go(i + 1)} disabled={i === n - 1}>Next stage</button>
        {!calm && n > 3 && (
          <button type="button" className="hwk-btn hwk-play" aria-pressed={running} onClick={() => { if (!running && i >= n - 1) { setDir(-1); setI(0); } setPlaying(!running); }}>
            {running ? "Pause" : "Play the walk-through"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Who is in charge ---------------------------------------------------------------------------------------------------------------------------------------------------

const LAYER_COLORS = { monarch: "#A87C3A", parliament: "#2F8F6B", government: COLORS.accent, delivery: "#4C6FA6" };

export function Layers({ stages }) {
  return (
    <ol className="hwk-layers">
      {stages.map((s, k) => {
        const c = LAYER_COLORS[s.key] ?? COLORS.accent;
        return (
          <motion.li
            key={s.key}
            className="hwk-layer"
            style={{ "--c": c, "--cr": readable(c) }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="hwk-layer-head">
              <span className="hwk-layer-n" aria-hidden="true">{k + 1}</span>
              <div>
                <h3 className="hwk-layer-title">{s.label}</h3>
                <p className="hwk-layer-tag">{s.tagline}</p>
              </div>
            </div>
            <div className="hwk-layer-body">
              <p className="hwk-desc">{s.desc}</p>
              {s.visual}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

// ---- The two Houses, a dot for every member -----------------------------------------------------------------------------------------------------------------------------

const COLS = 40;
const GAP = 7;

// Both boxes draw on the same tall canvas (the rows the bigger House needs) so the dots start at the same place and the figure under them sits on the same line in each box.
const ROWS = Math.ceil(800 / COLS);

function Dots({ count, color }) {
  const rows = ROWS;
  return (
    <svg className="hwk-dots" viewBox={`0 0 ${COLS * GAP} ${rows * GAP}`} role="img" aria-label={`${count} dots, one for each member`}>
      {Array.from({ length: count }, (_, k) => (
        <circle key={k} className="hwk-dot" cx={(k % COLS) * GAP + GAP / 2} cy={Math.floor(k / COLS) * GAP + GAP / 2} r="2.5" fill={color} style={{ "--i": k }} />
      ))}
    </svg>
  );
}

export function Houses() {
  const [ref, go] = useGo(0.25);
  return (
    <div className="hwk-houses" ref={ref} data-go={go}>
      <div className="hwk-house" style={{ "--hc": COLORS.accent }}>
        <div className="hwk-house-top">
          <CommonsBadge size={34} />
          <div>
            <h4>House of Commons</h4>
            <p>Directly elected by voters in each constituency</p>
          </div>
        </div>
        <Dots count={650} color={COLORS.accent} />
        <p className="hwk-house-n"><b>650</b> elected MPs</p>
      </div>
      <div className="hwk-house" style={{ "--hc": PLUM }}>
        <div className="hwk-house-top">
          <span className="hwk-lords" aria-hidden="true"><IconLords size={20} /></span>
          <div>
            <h4>House of Lords</h4>
            <p>Appointed peers and bishops</p>
          </div>
        </div>
        <Dots count={800} color={PLUM} />
        <p className="hwk-house-n"><b>~800</b> members</p>
      </div>
      <p className="hwk-houses-note">One dot is one member. The Lords figure is approximate.</p>
    </div>
  );
}

// ---- The job of an MP ---------------------------------------------------------------------------------------------------------------------------------------------------

// The ten topics, under three tabs. Each card keeps the page's own words; a figure is shown large only where the words themselves give one.
const JOB_TABS = [
  { key: "work", label: "The work", keys: ["week", "casework", "chamber", "party-life"] },
  { key: "money", label: "The money", keys: ["salary", "staff", "expenses", "pension"] },
  { key: "rules", label: "The rules", keys: ["outside-jobs", "resigning"] },
];
const FIGURES = {
  casework: ["Hundreds", "of cases a year in a typical MP's office"],
  staff: ["£200,000+", "a year for staff, from IPSA's separate budget"],
  "outside-jobs": ["28 days", "to declare outside earnings above the threshold"],
  resigning: ["1624", "the year of the rule that stops an MP quitting"],
};

export function MpJob({ stages, color }) {
  const [tab, setTab] = useState(0);
  const refs = useRef([]);
  const id = useId();
  const byKey = Object.fromEntries(stages.map((s) => [s.key, s]));

  function onKey(e) {
    const to = { ArrowRight: tab + 1, ArrowLeft: tab - 1, Home: 0, End: JOB_TABS.length - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    const k = (to + JOB_TABS.length) % JOB_TABS.length;
    withScrollPreserved(() => setTab(k));
    refs.current[k]?.focus();
  }

  const group = JOB_TABS[tab];
  return (
    <div className="hwk-job" style={{ "--c": color, "--cr": readable(color) }}>
      <div className="hwk-tabs" role="tablist" aria-label="The job of an MP" onKeyDown={onKey}>
        {JOB_TABS.map((t, k) => (
          <button
            key={t.key}
            ref={(el) => { refs.current[k] = el; }}
            type="button"
            role="tab"
            id={`${id}-t${k}`}
            aria-selected={k === tab}
            aria-controls={`${id}-p`}
            tabIndex={k === tab ? 0 : -1}
            onClick={() => withScrollPreserved(() => setTab(k))}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="hwk-cards" id={`${id}-p`} role="tabpanel" aria-labelledby={`${id}-t${tab}`} key={group.key} data-tab={group.key}>
        {group.keys.map((key, k) => {
          const s = byKey[key];
          if (!s) return null;
          const fig = FIGURES[key];
          return (
            <article key={key} className="hwk-card" data-wide={s.visual ? "1" : undefined} data-fig={fig ? "1" : undefined} style={{ "--k": k }}>
              {fig && (
                <p className="hwk-fig"><b>{fig[0]}</b><span>{fig[1]}</span></p>
              )}
              <h3 className="hwk-card-title">{s.label.replace(/"/g, "")}</h3>
              <p className="hwk-desc">{s.desc}</p>
              {s.visual}
            </article>
          );
        })}
      </div>
    </div>
  );
}
