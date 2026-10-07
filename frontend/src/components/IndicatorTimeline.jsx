import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import LineChart from "./LineChart";
import { ALL_SERIES, refOf } from "../data/onsSectors";
import { loadEverything } from "../lib/onsData";
import { formatValue, formatAxis, periodToT, changeShort, periodLabel } from "../lib/onsFormat";
import { changeBetween, valueAtOrBefore } from "../lib/onsStats";
import { toLineData, yearTicks } from "../lib/onsChart";
import { bandsBetween, governmentAt, PARTY_COLOURS } from "../lib/governments";
import { IconCompareTime } from "./icons";
import { card as baseCard } from "../lib/onsStyles";

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

  const matches = CHOICES.filter((c) => !query.trim() || `${c.label} ${c.sectorLabel}`.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = [...new Set(matches.map((m) => m.sectorLabel))].map((label) => ({ label, items: matches.filter((m) => m.sectorLabel === label) }));

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
        subtitle="Pick up to four measures from any page and see how they moved, side by side, with who was in government shaded behind them. Press play to watch the years unfold."
        maxWidth={760}
      />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="these figures" /></div>}
      {!everything && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading the figures…</div>}

      {everything && (
        <>
          <section style={{ ...card, marginTop: 24 }} aria-label="Choose measures">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0 }}>
                Choose measures <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: COLORS.inkSoft }}>{picks.length} of {MAX_PICKED}</span>
              </h2>
              <input className="ons-chip"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search, for example rent or debt"
                aria-label="Search measures"
                style={{ fontFamily: FONT_BODY, fontSize: 14, padding: "8px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "min(300px, 100%)" }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
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
            </div>
            <div style={{ maxHeight: 250, overflowY: "auto", marginTop: 14, paddingRight: 4 }}>
              {groups.map((g) => (
                <div key={g.label} style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 6 }}>{g.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {g.items.map((c) => {
                      const ref = refOf(c);
                      const on = picks.includes(ref);
                      const full = !on && picks.length >= MAX_PICKED;
                      return (
                        <button className="ons-chip" key={ref} onClick={() => toggle(ref)} aria-pressed={on} disabled={full} style={{ ...pill(on), opacity: full ? 0.4 : 1, cursor: full ? "default" : "pointer" }}>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!groups.length && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nothing matches that search.</p>}
            </div>
          </section>

          {chosen.length === 0 && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>Pick a measure above to see it here.</p>}

          {chosen.length > 0 && window_ && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", alignItems: "center", margin: "22px 0 12px" }}>
                <div role="group" aria-label="Time period" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PRESETS.map((p) => {
                    const target = p.back ? Math.floor(to - p.back) : p.from;
                    const on = p.from === 0 ? fromYear === 0 : fromYear === target;
                    return <button className="ons-chip" key={p.label} onClick={() => preset(p)} aria-pressed={on} style={pill(on)}>{p.label}</button>;
                  })}
                </div>
                <div role="radiogroup" aria-label="Chart layout" style={{ display: "inline-flex", gap: 6 }}>
                  <button className="ons-chip" role="radio" aria-checked={!overlay} onClick={() => setMode("separate")} style={pill(!overlay)}>Separate charts</button>
                  <button className="ons-chip"
                    role="radio" aria-checked={overlay} onClick={() => overlayOk && setMode("overlay")} disabled={!overlayOk}
                    title={overlayOk ? "" : "Overlaying needs measures in the same unit, such as all percentages"}
                    style={{ ...pill(overlay), opacity: overlayOk ? 1 : 0.4, cursor: overlayOk ? "pointer" : "default" }}
                  >
                    One chart
                  </button>
                </div>
                <button className="ons-chip" role="switch" aria-checked={showGov} onClick={() => setShowGov(!showGov)} style={{ ...pill(showGov) }}>
                  {showGov ? "Hide" : "Show"} who was in government
                </button>
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
