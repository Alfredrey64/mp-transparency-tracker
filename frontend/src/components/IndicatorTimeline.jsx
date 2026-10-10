import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import LineChart from "./LineChart";
import { ALL_SERIES, SECTORS, refOf } from "../data/onsSectors";
import { loadEverything } from "../lib/onsData";
import { formatValue, formatAxis, periodToT, changeShort, periodLabel } from "../lib/onsFormat";
import { changeBetween, valueAtOrBefore } from "../lib/onsStats";
import { toLineData, yearTicks } from "../lib/onsChart";
import { bandsBetween, governmentAt, PARTY_COLOURS } from "../lib/governments";
import { IconCompareTime } from "./icons";
import { card as baseCard } from "../lib/onsStyles";
import { COMPARE_STORIES } from "../data/compareStories";

// Pick a few measures and watch how they moved over time, side by side, with
// who was in government shaded behind them. Press play to watch the story
// unfold, or drag the slider to a moment and compare it with today.

const MAX_PICKED = 4;
const NOW = new Date().getFullYear() + 1;
const PLAY_SECONDS = 16;
const LINE_COLOURS = ["#0E9AA7", "#E07A1F", "#7B5BD6", "#D4577A"];
const DEFAULT_PICKS = ["prices.cpi", "jobs.unemployment", "jobs.pay-real"];

// The same series can sit on more than one page; list each once.
const CHOICES = (() => {
  const seen = new Set();
  return ALL_SERIES.filter((s) => {
    const key = s.cdid ? `${s.cdid}|${s.dataset}` : refOf(s);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})();

// Topics are the Britain in numbers pages; each holds the measures to choose from.
const TOPICS = SECTORS.map((t) => ({ key: t.key, label: t.label, accent: t.accent }))
  .filter((t) => CHOICES.some((c) => c.sector === t.key));

const PRESETS = [
  { label: "Since 1990", from: 1990 },
  { label: "Since 2000", from: 2000 },
  { label: "Since 2010", from: 2010 },
  { label: "Since 2016", from: 2016 },
  { label: "Last 5 years", back: 5 },
  { label: "Everything", from: 0 },
];

const card = { ...baseCard, padding: "clamp(16px, 4.5vw, 22px)" };
const pill = (on) => ({
  fontFamily: FONT_BODY, fontSize: 13, fontWeight: on ? 700 : 500, padding: "6px 12px", borderRadius: 999, cursor: "pointer",
  border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, background: on ? COLORS.ink : "transparent", color: on ? COLORS.paper : COLORS.inkSoft,
});

function ControlGroup({ label, hint, children }) {
  return (
    <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink }}>
        {label}
        {hint && <span style={{ fontWeight: 500, color: COLORS.inkSoft }}> {hint}</span>}
      </div>
      {children}
    </div>
  );
}

// A linked row of options where exactly one is on, so it is obvious which.
function Choice({ options, label }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "inline-flex", flexWrap: "wrap", padding: 3, gap: 2, borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
      {options.map((o) => (
        <button
          key={o.label} type="button" role="radio" aria-checked={o.on} disabled={o.disabled} title={o.title} onClick={o.onClick} className="ons-chip"
          style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: o.on ? 700 : 600, padding: "7px 13px", borderRadius: 9, border: "none", cursor: o.disabled ? "default" : "pointer", opacity: o.disabled ? 0.4 : 1, background: o.on ? COLORS.ink : "transparent", color: o.on ? COLORS.paper : COLORS.inkSoft, transition: "background 0.15s, color 0.15s" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function parsePicks(param) {
  const valid = new Set(CHOICES.map(refOf));
  const wanted = (param ?? "").split(",").map((x) => x.trim()).filter((x) => valid.has(x));
  // A series that sits on two pages may arrive as the other page's reference.
  const mapped = (param ?? "").split(",").map((x) => x.trim()).filter((x) => !valid.has(x)).map((x) => {
    const [, id] = x.split(".");
    return CHOICES.find((c) => c.id === id) ? refOf(CHOICES.find((c) => c.id === id)) : null;
  }).filter(Boolean);
  const picks = [...new Set([...wanted, ...mapped])].slice(0, MAX_PICKED);
  return picks.length ? picks : DEFAULT_PICKS;
}

export default function IndicatorTimeline({ param }) {
  const reduce = useReducedMotion();
  const [everything, setEverything] = useState(null);
  const [failed, setFailed] = useState(false);
  const [picks, setPicks] = useState(() => parsePicks(param));
  const [query, setQuery] = useState("");
  const [topicKey, setTopicKey] = useState(() => {
    const first = parsePicks(param)[0]?.split(".")[0];
    return TOPICS.some((t) => t.key === first) ? first : TOPICS[0]?.key;
  });
  const [fromYear, setFromYear] = useState(2000);
  const [mode, setMode] = useState("separate");
  const [showGov, setShowGov] = useState(true);
  const [hoverX, setHoverX] = useState(null);
  const [playhead, setPlayhead] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [thenYear, setThenYear] = useState(null);
  const headRef = useRef(null);

  useEffect(() => {
    let alive = true;
    loadEverything().then((r) => alive && setEverything(r)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  // Keep the address in step with what is picked, so the view can be shared.
  useEffect(() => {
    window.history.replaceState(null, "", `#/indicators/${picks.join(",")}`);
  }, [picks]);

  const chosen = useMemo(() => (everything ? picks.map((r) => everything[r]).filter(Boolean) : []), [everything, picks]);

  // The window of time all the picked series share, and the end of it.
  const window_ = useMemo(() => {
    if (!chosen.length) return null;
    const ends = chosen.map((c) => periodToT(c.points.at(-1)[0]));
    const starts = chosen.map((c) => periodToT(c.points[0][0]));
    return { earliest: Math.max(...starts), to: Math.max(...ends) };
  }, [chosen]);

  const from = window_ ? Math.max(fromYear || window_.earliest, window_.earliest) : fromYear;
  const to = window_?.to ?? NOW;
  const span = Math.max(1, to - from);

  // Play the timeline: the playhead walks from the start of the window to the end.
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = (headRef.current ?? from) + (dt * span) / PLAY_SECONDS;
      if (next >= to) {
        headRef.current = to;
        setPlayhead(to);
        setPlaying(false);
        return;
      }
      headRef.current = next;
      setPlayhead(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, from, to, span]);

  const toggle = (ref) => {
    setPicks((p) => (p.includes(ref) ? p.filter((x) => x !== ref) : p.length >= MAX_PICKED ? p : [...p, ref]));
    setPlaying(false);
    setPlayhead(null);
    headRef.current = null;
  };

  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (playhead === null || playhead >= to - 0.001) { headRef.current = from; setPlayhead(from); }
    setPlaying(true);
  };
  const stop = () => { setPlaying(false); setPlayhead(null); headRef.current = null; };
  const scrub = (v) => { setPlaying(false); headRef.current = v; setPlayhead(v); };
  const preset = (p) => { setFromYear(p.back ? Math.floor(to - p.back) : p.from); stop(); };
  const applyStory = (story) => {
    setPicks(story.refs);
    setFromYear(story.from);
    setMode(story.mode ?? "separate");
    setThenYear(null);
    setQuery("");
    const first = story.refs[0].split(".")[0];
    if (TOPICS.some((t) => t.key === first)) setTopicKey(first);
    stop();
  };
  const activeStory = COMPARE_STORIES.find((st) => st.refs.length === picks.length && st.refs.every((r) => picks.includes(r)))?.id;

  const sameFormat = chosen.length > 1 && chosen.every((c) => c.def.format === chosen[0].def.format);
  const allLevels = chosen.length > 1 && chosen.every((c) => c.def.kind === "level");
  const overlayOk = sameFormat || allLevels;
  const overlay = mode === "overlay" && overlayOk;
  const indexed = overlay && !sameFormat;

  const windowed = (c) => toLineData(c.points).filter((p) => p.x >= from - 1e-9 && p.x <= to + 1e-9);
  const bands = useMemo(
    () => (showGov ? bandsBetween(from, to + 0.05, NOW).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })) : []),
    [showGov, from, to],
  );
  const ticks = useMemo(() => yearTicks(from, to), [from, to]);
  const here = playhead ?? hoverX;
  const gov = here !== null && here !== undefined ? governmentAt(here) : null;
  const clip = playhead ?? undefined;

  const searching = query.trim().length > 0;
  const topic = TOPICS.find((t) => t.key === topicKey) ?? TOPICS[0];
  const topicItems = CHOICES.filter((c) => c.sector === topic?.key);
  const found = CHOICES.filter((c) => `${c.label} ${c.sectorLabel}`.toLowerCase().includes(query.trim().toLowerCase()));
  const shown = searching ? found : topicItems;
  const pickedIn = (key) => picks.filter((r) => r.startsWith(`${key}.`)).length;

  // "Then and now": the figure at a chosen year against the latest.
  const thenAt = thenYear ?? Math.ceil(from);
  const thenYears = [];
  for (let y = Math.ceil(from); y <= Math.floor(to); y++) thenYears.push(y);
  const rows = chosen.map((c) => {
    const then = valueAtOrBefore(c.points, thenAt + 0.5);
    const now = c.points.at(-1);
    return { c, then, now, change: then ? changeBetween(c.def, then[1], now[1]) : null };
  });

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCompareTime}
        title="Compare the numbers over time"
        subtitle="Pick a topic, tick up to four measures from it, and see how they moved, side by side, with who was in government shaded behind them. Press play to watch the years unfold."
        maxWidth={760}
      />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="these figures" /></div>}
      {!everything && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading the figures…</div>}

      {everything && (
        <>
          <section style={{ marginTop: 24 }} aria-label="Ready-made comparisons">
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: "0 0 4px" }}>Start with a question</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "0 0 12px" }}>Tap one to load the measures that help answer it. You can change them afterwards.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(230px, 100%), 1fr))", gap: 10 }}>
              {COMPARE_STORIES.map((st) => {
                const on = st.id === activeStory;
                return (
                  <button
                    key={st.id} type="button" className="ons-chip" aria-pressed={on} onClick={() => applyStory(st)}
                    style={{ textAlign: "left", display: "block", cursor: "pointer", padding: "13px 15px", borderRadius: 16, fontFamily: FONT_BODY, color: COLORS.ink, background: on ? `${COLORS.accent}18` : COLORS.paperCard, border: `2px solid ${on ? COLORS.accent : COLORS.hairline}`, transition: "background 0.15s, border-color 0.15s" }}
                  >
                    <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, lineHeight: 1.25 }}>{st.title}</span>
                    <span style={{ display: "block", fontSize: 13, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.4 }}>{st.blurb}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section style={{ ...card, marginTop: 22 }} aria-label="Choose measures">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0 }}>
                Or build your own
              </h2>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft }}>{picks.length} of {MAX_PICKED} chosen</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, minHeight: 36 }}>
              {chosen.map((c, i) => (
                <button className="ons-chip"
                  key={refOf({ sector: c.sector, id: c.def.id })}
                  onClick={() => toggle(`${c.sector}.${c.def.id}`)}
                  aria-label={`Remove ${c.def.label}`}
                  style={{ ...pill(true), background: LINE_COLOURS[i % 4], borderColor: LINE_COLOURS[i % 4], color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  {c.def.label}
                  <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>×</span>
                </button>
              ))}
              {chosen.length === 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, alignSelf: "center" }}>Nothing chosen yet. Start with a topic below.</span>}
            </div>

            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "8px 14px", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink }}>1. Pick a topic</div>
              <input className="ons-chip"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Or search, for example rent or debt"
                aria-label="Search measures"
                style={{ fontFamily: FONT_BODY, fontSize: 14, padding: "8px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "min(300px, 100%)" }}
              />
            </div>
            <div role="tablist" aria-label="Topics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 46%), 1fr))", gap: 8, marginTop: 10, opacity: searching ? 0.45 : 1 }}>
              {TOPICS.map((t) => {
                const on = !searching && t.key === topic?.key;
                const n = pickedIn(t.key);
                return (
                  <button
                    key={t.key} type="button" role="tab" aria-selected={on} className="ons-chip"
                    onClick={() => { setTopicKey(t.key); setQuery(""); }}
                    style={{ position: "relative", textAlign: "left", display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", borderRadius: 14, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: on ? `${t.accent}22` : COLORS.paper, border: `2px solid ${on ? t.accent : COLORS.hairline}`, transition: "background 0.15s, border-color 0.15s" }}
                  >
                    <span aria-hidden="true" style={{ flexShrink: 0, width: 12, height: 12, borderRadius: 4, background: t.accent }} />
                    <span style={{ minWidth: 0, lineHeight: 1.2 }}>{t.label}</span>
                    {n > 0 && <span style={{ marginLeft: "auto", flexShrink: 0, minWidth: 20, height: 20, borderRadius: 10, display: "grid", placeItems: "center", background: t.accent, color: "#fff", fontSize: 12, fontWeight: 800 }}>{n}</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "18px 0 8px" }}>
              {searching ? `Results for \u201C${query.trim()}\u201D` : `2. Tick the measures you want from ${topic?.label ?? ""}`}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 6, maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
              {shown.map((c) => {
                const ref = refOf(c);
                const idx = picks.indexOf(ref);
                const on = idx >= 0;
                const full = !on && picks.length >= MAX_PICKED;
                const colour = on ? LINE_COLOURS[idx % 4] : COLORS.hairline;
                return (
                  <li key={ref}>
                    <button
                      type="button" className="ons-chip" role="checkbox" aria-checked={on} disabled={full} onClick={() => toggle(ref)}
                      title={full ? `You can compare up to ${MAX_PICKED} at once. Remove one first.` : undefined}
                      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: on ? 700 : 500, lineHeight: 1.3, color: COLORS.ink, background: on ? `${colour}1f` : "transparent", border: `1px solid ${on ? colour : COLORS.hairline}`, opacity: full ? 0.45 : 1, cursor: full ? "default" : "pointer", transition: "background 0.15s, border-color 0.15s" }}
                    >
                      <span aria-hidden="true" style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", background: on ? colour : "transparent", border: `2px solid ${on ? colour : COLORS.inkSoft}`, color: "#fff", fontSize: 13, fontWeight: 800 }}>{on ? "\u2713" : ""}</span>
                      <span style={{ minWidth: 0 }}>
                        {c.label}
                        {searching && <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: COLORS.inkSoft }}>{c.sectorLabel}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!shown.length && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nothing matches that search.</p>}
          </section>

          {chosen.length === 0 && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>Pick a measure above to see it here.</p>}

          {chosen.length > 0 && window_ && (
            <>
              <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: "16px 28px", alignItems: "flex-start", margin: "22px 0 14px" }}>
                <ControlGroup label="How far back">
                  <Choice
                    label="Time period"
                    options={PRESETS.map((p) => {
                      const target = p.back ? Math.floor(to - p.back) : p.from;
                      return { label: p.label, on: p.from === 0 ? fromYear === 0 : fromYear === target, onClick: () => preset(p) };
                    })}
                  />
                </ControlGroup>
                <ControlGroup label="Show them as">
                  <Choice
                    label="Chart layout"
                    options={[
                      { label: "Separate charts", on: !overlay, onClick: () => setMode("separate") },
                      { label: "One chart", on: overlay, disabled: !overlayOk, onClick: () => overlayOk && setMode("overlay"), title: overlayOk ? "" : "Overlaying needs measures in the same unit, such as all percentages" },
                    ]}
                  />
                </ControlGroup>
                <ControlGroup label="Who was in government">
                  <Choice
                    label="Government shading"
                    options={[
                      { label: "Shaded", on: showGov, onClick: () => setShowGov(true) },
                      { label: "Hidden", on: !showGov, onClick: () => setShowGov(false) },
                    ]}
                  />
                </ControlGroup>
              </div>

              <div style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px", position: "sticky", top: 8, zIndex: 10 }}>
                <button className="ons-chip"
                  onClick={play}
                  style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "none", background: COLORS.ink, color: COLORS.paper, cursor: "pointer", minWidth: 96 }}
                >
                  {playing ? "Pause" : playhead !== null && playhead < to - 0.001 ? "Resume" : "Play"}
                </button>
                {playhead !== null && <button className="ons-chip" onClick={stop} style={pill(false)}>Show it all</button>}
                <div aria-live="off" style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ ...numeric, fontSize: 26, lineHeight: 1.1, color: COLORS.ink }}>{Math.floor(here ?? to)}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: gov ? PARTY_COLOURS[gov.party] : COLORS.inkSoft, fontWeight: 600 }}>
                    {gov ? `${gov.pm} (${gov.party})` : " "}
                  </div>
                </div>
                <input
                  className="ons-range"
                  type="range" min={from} max={to} step={Math.max(0.01, span / 400)} value={playhead ?? to}
                  onChange={(e) => scrub(Number(e.target.value))}
                  aria-label="Move through time"
                  style={{ flex: "1 1 100%", accentColor: COLORS.accent, minWidth: 0, margin: "2px 0" }}
                />
              </div>

              {overlay ? (
                <motion.section
                  style={{ ...card, marginTop: 14 }} aria-label="Chart"
                  initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 10 }}>
                    {chosen.map((c, i) => {
                      const v = valueAtOrBefore(c.points, here ?? to);
                      return (
                        <span key={c.def.id + c.sector} style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <span aria-hidden="true" style={{ width: 12, height: 3, borderRadius: 2, background: LINE_COLOURS[i % 4] }} />
                          {c.def.label}
                          {v && <strong style={{ ...numeric }}>{indexed ? "" : formatValue(c.def.format, v[1])}</strong>}
                        </span>
                      );
                    })}
                  </div>
                  {indexed && <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "0 0 8px" }}>Each line starts at 100 so you can compare how much they have changed, not their size.</p>}
                  <LineChart
                    lines={chosen.map((c, i) => {
                      const data = windowed(c);
                      const base = data[0]?.y;
                      return {
                        name: c.def.label,
                        color: LINE_COLOURS[i % 4],
                        points: indexed && base ? data.map((p) => ({ ...p, y: (p.y / base) * 100 })) : data,
                        format: indexed ? (v) => v.toFixed(0) : (v) => formatValue(c.def.format, v),
                      };
                    })}
                    domainX={[from, to]}
                    xTicks={ticks}
                    yFormat={(v) => (indexed ? String(Math.round(v)) : formatAxis(chosen[0].def.format, v))}
                    ariaLabel={`${chosen.map((c) => c.def.label).join(", ")} over time`}
                    accent={LINE_COLOURS[0]}
                    bands={bands}
                    hoverX={hoverX}
                    onHoverX={setHoverX}
                    clipX={clip}
                    height={300}
                  />
                </motion.section>
              ) : (
                <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
                  {chosen.map((c, i) => {
                    const data = windowed(c);
                    const at = valueAtOrBefore(c.points, here ?? to);
                    return (
                      <motion.section
                        key={`${c.sector}.${c.def.id}`} style={card} aria-label={c.def.label}
                        initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      >
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "4px 14px", marginBottom: 6 }}>
                          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0, display: "flex", alignItems: "center", gap: 9 }}>
                            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: c.accent }} />
                            {c.def.label}
                          </h2>
                          {at && (
                            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
                              <strong style={{ ...numeric, fontSize: 20, color: COLORS.ink }}>{formatValue(c.def.format, at[1])}</strong> in {periodLabel(at[0])}
                            </span>
                          )}
                        </div>
                        <LineChart
                          lines={[{ name: c.def.label, points: data }]}
                          domainX={[from, to]}
                          xTicks={ticks}
                          yFormat={(v) => formatAxis(c.def.format, v)}
                          ariaLabel={`${c.def.label} over time`}
                          accent={c.accent}
                          bands={bands.map((b) => (i === 0 ? b : { ...b, short: "" }))}
                          hoverX={hoverX}
                          onHoverX={setHoverX}
                          clipX={clip}
                          height={190}
                          compact
                        />
                      </motion.section>
                    );
                  })}
                </div>
              )}

              {showGov && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "10px 0 0", maxWidth: 760 }}>
                  Shading shows who was prime minister: blue for Conservative, red for Labour. It shows when something changed, not why. Most of these figures are shaped by world events, and by decisions made years earlier.
                </p>
              )}

              <section style={{ ...card, marginTop: 22 }} aria-label="Then and now">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 16px" }}>
                  <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0 }}>Then and now</h2>
                  <label style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Compare today with
                    <select className="ons-chip"
                      value={thenAt}
                      onChange={(e) => setThenYear(Number(e.target.value))}
                      style={{ fontFamily: FONT_BODY, fontSize: 14, padding: "6px 10px", borderRadius: 8, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink }}
                    >
                      {thenYears.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </label>
                </div>
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14, minWidth: 420 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: COLORS.inkSoft, fontSize: 12.5 }}>
                        <th style={{ padding: "6px 8px 6px 0", fontWeight: 700 }}>Measure</th>
                        <th style={{ padding: "6px 8px", fontWeight: 700, textAlign: "right" }}>{thenAt}</th>
                        <th style={{ padding: "6px 8px", fontWeight: 700, textAlign: "right" }}>Latest</th>
                        <th style={{ padding: "6px 0 6px 8px", fontWeight: 700, textAlign: "right" }}>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ c, then, now, change }) => (
                        <tr key={`${c.sector}.${c.def.id}`} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                          <td style={{ padding: "9px 8px 9px 0", color: COLORS.ink }}>{c.def.label}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", ...numeric }}>{then ? formatValue(c.def.format, then[1]) : "no data"}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", ...numeric }}>{formatValue(c.def.format, now[1])}</td>
                          <td style={{ padding: "9px 0 9px 8px", textAlign: "right", color: COLORS.inkSoft }}>{change ? changeShort(change) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "10px 0 0" }}>
                  Changes in percentages are shown in percentage points, and changes in amounts in per cent. Prices and pay are shown as published, so they are not adjusted for inflation unless the measure says so.
                </p>
              </section>

              <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 760 }}>
                All figures are from the Office for National Statistics (ONS), published under the Open Government Licence v3.0. This site is independent and is not part of the ONS.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
