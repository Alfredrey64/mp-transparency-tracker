import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import LineChart from "./LineChart";
import CountUp from "./CountUp";
import { sectorByKey, ONS_SERIES_PAGE, WEEKLY_DEATHS } from "../data/onsSectors";
import { loadSector } from "../lib/onsData";
import {
  formatValue, formatAxis, latestInfo, changeWords, changeShort, sentenceFor, sliceRange, periodLabel,
} from "../lib/onsFormat";
import { compareStats } from "../lib/onsStats";
import { toLineData, yearTicks } from "../lib/onsChart";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { IconTrend, IconBasket, IconBriefcase, IconLedger, IconPopulation, IconHeartbeat, IconHouse, IconGlobe, IconLeaf } from "./icons";

// One page per sector, all drawn from the same data and the same layout: a
// short story, the headline figures, then a chart for every series with the
// history behind it, what it measures and why it matters. The numbers come from
// the Office for National Statistics, saved by fetch-ons.js.

const ICONS = { economy: IconTrend, prices: IconBasket, jobs: IconBriefcase, publicFinances: IconLedger, population: IconPopulation, health: IconHeartbeat, housing: IconHouse, trade: IconGlobe, environment: IconLeaf };
const RANGES = [{ years: 2, label: "2 years" }, { years: 5, label: "5 years" }, { years: 10, label: "10 years" }, { years: 25, label: "25 years" }, { years: 0, label: "Everything" }];
const WHOLE_HISTORY = new Set(["population", "environment"]);
const NOW = new Date().getFullYear() + 1;

const card = { background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "20px 22px" };
const dateText = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function DrawSpark({ points, color }) {
  const reduce = useReducedMotion();
  const pts = points.slice(-36);
  if (pts.length < 2) return null;
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x = (i) => (i / (pts.length - 1)) * 100;
  const y = (v) => 26 - ((v - lo) / (hi - lo || 1)) * 22 - 2;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" width="100%" height="28" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", marginTop: 10, overflow: "visible" }}>
      <motion.path
        d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

function Tile({ def, item, accent, index }) {
  const reduce = useReducedMotion();
  const info = latestInfo(def, item.points);
  if (!info) return null;
  const up = info.change && info.change.amount > 0;
  const flat = !info.change || Math.abs(info.change.amount) < 0.05;
  return (
    <motion.a
      href={`#s-${def.id}`}
      onClick={(e) => { e.preventDefault(); document.getElementById(`s-${def.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -3 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.07, ease: "easeOut" }}
      style={{ ...card, padding: "16px 18px", position: "relative", overflow: "hidden", textDecoration: "none", display: "block", borderColor: `${accent}55` }}
    >
      <span aria-hidden="true" style={{ position: "absolute", inset: "0 0 auto 0", height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.35 }}>{def.label}</div>
      <div style={{ ...numeric, fontSize: 36, lineHeight: 1.15, color: COLORS.ink, marginTop: 6 }}>
        <CountUp value={info.value} format={(n) => formatValue(def.format, n)} duration={1.3} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{info.label}</div>
      {info.change && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6, display: "flex", gap: 6, alignItems: "baseline" }}>
          <span aria-hidden="true" style={{ color: flat ? COLORS.inkSoft : accent, fontSize: 11 }}>{flat ? "–" : up ? "▲" : "▼"}</span>
          <span>{changeWords(info.change)}</span>
        </div>
      )}
      <DrawSpark points={item.points} color={accent} />
    </motion.a>
  );
}

function Fact({ label, children, sub }) {
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "9px 12px" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{label}</div>
      <div style={{ ...numeric, fontSize: 17, color: COLORS.ink, marginTop: 1 }}>{children}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// How today compares with the past: a year, five years and ten years ago, and the best and worst the series has seen.
function Facts({ def, points }) {
  const st = compareStats(def, points);
  if (!st) return null;
  const then = (key, name) => {
    const c = st[key];
    return c ? <Fact key={key} label={`${name} (${c.label})`} sub={changeShort(c.change)}>{formatValue(def.format, c.value)}</Fact> : null;
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 8, marginTop: 14 }}>
      {then("yearAgo", "A year ago")}
      {then("fiveAgo", "Five years ago")}
      {then("tenAgo", "Ten years ago")}
      <Fact label={`Highest since ${st.since}`} sub={st.high.isNow ? "That is now" : st.high.label}>{formatValue(def.format, st.high.value)}</Fact>
      <Fact label={`Lowest since ${st.since}`} sub={st.low.isNow ? "That is now" : st.low.label}>{formatValue(def.format, st.low.value)}</Fact>
    </div>
  );
}

function SeriesCard({ def, item, range, accent, showGovernments, sectorKey }) {
  const pts = sliceRange(item.points, range);
  const data = toLineData(pts);
  const sentence = sentenceFor(def, item.points);
  const recent = item.points.slice(-12).reverse();
  const st = compareStats(def, item.points);
  const bands = useMemo(
    () => (showGovernments && data.length ? bandsBetween(data[0].x, data.at(-1).x + 0.05, NOW).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })) : []),
    [showGovernments, data],
  );
  return (
    <motion.section
      id={`s-${def.id}`}
      aria-labelledby={`h-${def.id}`}
      style={{ ...card, scrollMarginTop: 84 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h2 id={`h-${def.id}`} style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: accent, flexShrink: 0 }} />
        {def.label}
      </h2>
      {sentence && <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "8px 0 16px" }}>{sentence}</p>}
      {data.length > 1 ? (
        <LineChart
          key={`${range}-${showGovernments}`}
          lines={[{ name: def.label, points: data }]}
          xTicks={yearTicks(data[0].x, data.at(-1).x)}
          yFormat={(v) => formatAxis(def.format, v)}
          ariaLabel={`${def.label}: line chart. ${sentence}`}
          accent={accent}
          bands={bands}
          animateIn
        />
      ) : (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Not enough data for this period.</p>
      )}
      <Facts def={def} points={item.points} />
      {st && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "10px 0 0" }}>
          Higher than {st.higherThanShare}% of the {st.count.toLocaleString("en-GB")} readings since {st.since}.
          {def.nominal && " These amounts are not adjusted for inflation, so figures from many years ago look smaller than they were worth."}
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "14px 24px", marginTop: 16 }}>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 3 }}>What it measures</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>{def.explain}</p>
        </div>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 3 }}>Why it matters</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>{def.why}</p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", alignItems: "center", marginTop: 14 }}>
        <a href={`#/indicators/${sectorKey}.${def.id}`} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: accent, padding: "5px 0" }}>Compare with other measures over time</a>
      </div>
      <details style={{ marginTop: 6 }}>
        <summary style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Show the latest figures as a table</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6, fontFamily: FONT_BODY, fontSize: 13 }}>
          <tbody>
            {recent.map(([p, v]) => (
              <tr key={p} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                <td style={{ padding: "6px 0", color: COLORS.inkSoft }}>{periodLabel(p)}</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: COLORS.ink, fontWeight: 600 }}>{formatValue(def.format, v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 10 }}>
        {def.derive ? "Worked out from ONS figures." : <>Source: ONS series {def.cdid} ({def.dataset.toUpperCase()})</>}
        {item.updated ? `, released ${dateText(item.updated)}` : ""}.{" "}
        {!def.derive && <a href={ONS_SERIES_PAGE(def)} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, textDecoration: "underline" }}>See it on the ONS site</a>}
      </div>
    </motion.section>
  );
}

function WeeklyDeaths({ data, accent }) {
  const years = Object.keys(data.years).sort();
  const thisYear = years.at(-1);
  const lastYear = years.length > 1 ? years.at(-2) : null;
  const mk = (year) => data.years[year].map((v, i) => (!v ? null : { x: i + 1, y: v, label: `Week ${i + 1} of ${year}` })).filter(Boolean);
  const now = mk(thisYear);
  if (now.length < 2) return null;
  const before = lastYear ? mk(lastYear) : [];
  const latest = now.at(-1);
  const same = before.find((p) => p.x === latest.x);
  const gap = same ? ((latest.y - same.y) / same.y) * 100 : null;
  const sentence = `In week ${latest.x} of ${thisYear}, ${latest.y.toLocaleString("en-GB")} deaths were registered in England and Wales${
    gap === null ? "." : `, ${Math.abs(gap) < 0.5 ? "about the same as" : `${Math.abs(gap).toFixed(0)}% ${gap > 0 ? "more than" : "fewer than"}`} the same week of ${lastYear}.`
  }`;
  const lines = [{ name: thisYear, color: accent, points: now, format: (v) => v.toLocaleString("en-GB") }];
  if (before.length) lines.push({ name: lastYear, color: COLORS.inkSoft, points: before, format: (v) => v.toLocaleString("en-GB") });
  return (
    <motion.section
      aria-labelledby="h-weekly-deaths" style={{ ...card, scrollMarginTop: 84 }} id="s-weekly-deaths"
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}
    >
      <h2 id="h-weekly-deaths" style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: accent }} />
        Deaths registered each week
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "8px 0 16px" }}>{sentence}</p>
      <LineChart
        lines={lines}
        xTicks={[{ x: 1, label: "Jan" }, { x: 14, label: "Apr" }, { x: 27, label: "Jul" }, { x: 40, label: "Oct" }, { x: 52, label: "Dec" }]}
        domainX={[1, 52]}
        yFormat={(v) => `${Math.round(v / 1000)}k`}
        ariaLabel={`Deaths registered each week in England and Wales, ${thisYear}${lastYear ? ` compared with ${lastYear}` : ""}. ${sentence}`}
        accent={accent}
        animateIn
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "14px 24px", marginTop: 16 }}>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 3 }}>What it measures</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>
            The number of deaths registered in each week, from all causes, in England and Wales. These are registrations, not the dates people died, so weeks with a bank holiday look lower and the week after looks higher.
          </p>
        </div>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 3 }}>Why it matters</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>
            Comparing with the same week last year shows quickly whether something unusual is happening, such as a harsh winter flu season, a heatwave or a pandemic wave.
          </p>
        </div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 12 }}>
        Source: ONS weekly deaths by region (dataset: {WEEKLY_DEATHS.dataset}){data.updated ? `, released ${dateText(data.updated)}` : ""}. The first and last weeks of a year are partial.
      </div>
    </motion.section>
  );
}

function Toggle({ on, onChange, children }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: "6px 0", font: "inherit" }}
    >
      <span aria-hidden="true" style={{ width: 38, height: 22, borderRadius: 11, background: on ? COLORS.ink : COLORS.hairline, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: 8, background: on ? COLORS.paper : COLORS.inkSoft, transition: "left 0.2s" }} />
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>{children}</span>
    </button>
  );
}

export default function SectorPage({ sector }) {
  const def = sectorByKey(sector);
  const [loaded, setLoaded] = useState(null);
  const [failed, setFailed] = useState(false);
  const [range, setRange] = useState(WHOLE_HISTORY.has(sector) ? 0 : 10);
  const [showGovernments, setShowGovernments] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSector(sector).then((r) => alive && setLoaded(r)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [sector]);

  const Icon = ICONS[sector];
  const shown = useMemo(() => (def && loaded ? def.series.filter((s) => loaded.series[s.id]) : []), [def, loaded]);
  if (!def) return null;
  const tiles = shown.filter((s) => s.headline);
  const compareRefs = tiles.slice(0, 3).map((s) => `${def.key}.${s.id}`).join(",");
  const newest = shown.map((s) => loaded.series[s.id].updated).filter(Boolean).sort().at(-1);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={Icon} title={def.title} subtitle={def.subtitle} maxWidth={760} />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="these figures" /></div>}
      {!loaded && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}

      {loaded && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{
              position: "relative", overflow: "hidden", borderRadius: 18, padding: "22px 24px", marginTop: 24, border: `1px solid ${def.accent}44`,
              background: `radial-gradient(700px 220px at 100% -20%, ${def.accent}2e, transparent 70%), ${COLORS.paperCard}`,
            }}
          >
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(17px, 2.4vw, 21px)", lineHeight: 1.45, color: COLORS.ink, margin: 0, maxWidth: 760 }}>{def.story}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", marginTop: 16, alignItems: "center" }}>
              <a
                href={`#/indicators/${compareRefs}`}
                style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: "#fff", background: def.accent, borderRadius: 10, padding: "9px 16px", textDecoration: "none" }}
              >
                Watch these change over time
              </a>
              {newest && <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Latest ONS release: {dateText(newest)}</span>}
            </div>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 14, marginTop: 18 }}>
            {tiles.map((s, i) => <Tile key={s.id} def={s} item={loaded.series[s.id]} accent={def.accent} index={i} />)}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px 24px", margin: "30px 0 8px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Show</span>
              <div role="radiogroup" aria-label="How far back to show" style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
                {RANGES.map((r) => {
                  const on = range === r.years;
                  return (
                    <button
                      key={r.years}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setRange(r.years)}
                      style={{
                        fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: on ? 700 : 500, padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, background: on ? COLORS.ink : "transparent", color: on ? COLORS.paper : COLORS.inkSoft,
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Toggle on={showGovernments} onChange={setShowGovernments}>Show who was in government</Toggle>
          </div>
          {showGovernments && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 10px", maxWidth: 760 }}>
              The shading shows which prime minister was in office, blue for Conservative and red for Labour. It shows when something changed, not why. Most of what these charts measure is shaped by world events and by decisions made long before.
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(460px, 100%), 1fr))", gap: 16, alignItems: "start", marginTop: 10 }}>
            {loaded.data.weeklyDeaths && <WeeklyDeaths data={loaded.data.weeklyDeaths} accent={def.accent} />}
            {shown.map((s) => (
              <SeriesCard key={s.id} def={s} item={loaded.series[s.id]} range={range} accent={def.accent} showGovernments={showGovernments} sectorKey={def.key} />
            ))}
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 28, maxWidth: 760 }}>
            All figures are from the Office for National Statistics (ONS), published under the Open Government Licence v3.0. This site is independent and is not part of the ONS.
            Official statistics are revised as more information arrives, so recent figures can change. We refresh them every day, and they only change when the ONS publishes.
          </p>
        </>
      )}
    </div>
  );
}
