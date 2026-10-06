import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import LineChart from "./LineChart";
import CountUp from "./CountUp";
import { sectorByKey, ONS_SERIES_PAGE, WEEKLY_DEATHS } from "../data/onsSectors";
import { loadSector } from "../lib/onsData";
import { formatValue, formatAxis, latestInfo, changeWords, changeShort, sentenceFor, sliceRange, labelFor } from "../lib/onsFormat";
import { compareStats } from "../lib/onsStats";
import { toLineData, yearTicks } from "../lib/onsChart";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { card, cardTitle, smallTitle, pillStyle, dateText } from "../lib/onsStyles";
import { IconTrend, IconBasket, IconBriefcase, IconLedger, IconPopulation, IconHeartbeat, IconHouse, IconGlobe, IconLeaf, IconShield } from "./icons";

// One page per sector, all built from the same pieces: a short story with a
// spotlight figure, the headline numbers, then a card for every measure with its
// history, how today compares with the past, what it measures and why it matters.
// The numbers come from the Office for National Statistics (and, for house prices
// and crime, the bodies named on each card), saved daily by fetch-ons.js.

const ICONS = { economy: IconTrend, prices: IconBasket, jobs: IconBriefcase, publicFinances: IconLedger, population: IconPopulation, health: IconHeartbeat, housing: IconHouse, crime: IconShield, trade: IconGlobe, environment: IconLeaf };
const RANGES = [{ years: 2, label: "2 years" }, { years: 5, label: "5 years" }, { years: 10, label: "10 years" }, { years: 25, label: "25 years" }, { years: 0, label: "Everything" }];
const WHOLE_HISTORY = new Set(["population", "environment", "crime"]);
const NOW = new Date().getFullYear() + 1;

// A line that reveals itself left to right, with a soft fill under it. Drawn with
// a clip rather than by stroking the path, so the line is always one unbroken stroke.
function Spark({ points, color, height = 44 }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const reduce = useReducedMotion();
  const pts = points.slice(-48);
  if (pts.length < 2) return null;
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x = (i) => (i / (pts.length - 1)) * 200;
  const y = (v) => height - 5 - ((v - lo) / (hi - lo || 1)) * (height - 12);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(" ");
  return (
    <svg ref={ref} viewBox={`0 0 200 ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", overflow: "hidden" }}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <motion.rect x="0" y="0" height={height} initial={{ width: reduce ? 200 : 0 }} animate={{ width: inView || reduce ? 200 : 0 }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <path d={`${line} L200 ${height} L0 ${height} Z`} fill={`url(#g${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function ChangeChip({ change, accent }) {
  if (!change) return null;
  const flat = Math.abs(change.amount) < 0.05;
  const up = change.amount > 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, background: `${accent}1f`, borderRadius: 999, padding: "4px 10px" }}>
      <span aria-hidden="true" style={{ color: accent, fontSize: 10 }}>{flat ? "●" : up ? "▲" : "▼"}</span>
      {changeWords(change)}
    </span>
  );
}

function Tile({ def, item, accent, index }) {
  const reduce = useReducedMotion();
  const info = latestInfo(def, item.points);
  if (!info) return null;
  return (
    <motion.a
      href={`#s-${def.id}`}
      onClick={(e) => { e.preventDefault(); document.getElementById(`s-${def.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -4 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index, 7) * 0.06, ease: "easeOut" }}
      style={{
        ...card, padding: "20px 22px 0", position: "relative", overflow: "hidden", textDecoration: "none", display: "flex", flexDirection: "column", color: "inherit",
        background: `linear-gradient(180deg, ${accent}14, ${COLORS.paperCard} 55%)`, borderColor: `${accent}40`,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3 }}>{def.label}</div>
      <div style={{ ...numeric, fontSize: 42, fontWeight: 600, lineHeight: 1.1, color: COLORS.ink, marginTop: 10, letterSpacing: "-0.02em" }}>
        <CountUp value={info.value} format={(n) => formatValue(def.format, n)} duration={1.3} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "2px 0 10px" }}>{info.label}</div>
      <div><ChangeChip change={info.change} accent={accent} /></div>
      <div style={{ margin: "14px -22px 0" }}><Spark points={item.points} color={accent} /></div>
    </motion.a>
  );
}

// How today compares with the past, as one tidy strip.
function Strip({ def, points, accent }) {
  const st = compareStats(def, points);
  if (!st) return null;
  const cells = [];
  for (const [key, name] of [["yearAgo", "A year ago"], ["fiveAgo", "Five years ago"], ["tenAgo", "Ten years ago"]]) {
    const c = st[key];
    if (c) cells.push({ name, when: c.label, value: formatValue(def.format, c.value), note: changeShort(c.change) });
  }
  cells.push({ name: "Highest", when: st.high.isNow ? "That is now" : st.high.label, value: formatValue(def.format, st.high.value) });
  cells.push({ name: "Lowest", when: st.low.isNow ? "That is now" : st.low.label, value: formatValue(def.format, st.low.value) });
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(132px, 100%), 1fr))", border: `1px solid ${COLORS.hairline}`, borderRadius: 14, overflow: "hidden", background: COLORS.paper }}>
        {cells.map((c, i) => (
          <div key={c.name} style={{ padding: "11px 14px", borderLeft: i ? `1px solid ${COLORS.hairline}` : "none", borderTop: "none", minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft }}>{c.name}</div>
            <div style={{ ...numeric, fontSize: 19, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{c.value}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 1 }}>{c.when}</div>
            {c.note && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: accent, marginTop: 1 }}>{c.note}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div aria-hidden="true" style={{ flex: "1 1 160px", maxWidth: 260, height: 8, borderRadius: 4, background: COLORS.hairline, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, width: `${st.higherThanShare}%`, borderRadius: 4, background: `linear-gradient(90deg, ${accent}55, ${accent})` }} />
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
          {st.higherThanShare === 0
            ? `The lowest of the ${st.count.toLocaleString("en-GB")} readings since ${st.since}`
            : st.higherThanShare >= 100
              ? `The highest of the ${st.count.toLocaleString("en-GB")} readings since ${st.since}`
              : `Higher than ${st.higherThanShare}% of the ${st.count.toLocaleString("en-GB")} readings since ${st.since}`}
        </span>
      </div>
    </div>
  );
}

function Explain({ explain, why, accent }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14, marginTop: 20 }}>
      <div style={{ borderLeft: `4px solid ${accent}`, background: `${accent}12`, borderRadius: "4px 14px 14px 4px", padding: "12px 16px" }}>
        <h3 style={smallTitle}>Why it matters</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.ink, margin: 0 }}>{why}</p>
      </div>
      <div style={{ padding: "12px 4px" }}>
        <h3 style={smallTitle}>What it measures</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>{explain}</p>
      </div>
    </div>
  );
}

function SourceLine({ def, item }) {
  const link = def.source?.url ?? (def.cdid ? ONS_SERIES_PAGE(def) : null);
  const name = def.source?.name ?? (def.derive ? "Worked out from ONS figures" : `ONS series ${def.cdid} (${def.dataset?.toUpperCase()})`);
  return (
    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
      Source: {name}{item.updated ? `, released ${dateText(item.updated)}` : ""}.{" "}
      {link && <a href={link} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, textDecoration: "underline" }}>See the source</a>}
    </div>
  );
}

function SeriesCard({ def, item, range, accent, showGovernments, sectorKey }) {
  const pts = sliceRange(item.points, range);
  const data = useMemo(() => toLineData(pts), [pts]);
  const info = latestInfo(def, item.points);
  const sentence = sentenceFor(def, item.points);
  const recent = item.points.slice(-12).reverse();
  const bands = useMemo(
    () => (showGovernments && data.length ? bandsBetween(data[0].x, data.at(-1).x + 0.05, NOW).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })) : []),
    [showGovernments, data],
  );
  return (
    <motion.section
      id={`s-${def.id}`}
      aria-labelledby={`h-${def.id}`}
      style={{ ...card, scrollMarginTop: 110, position: "relative", overflow: "hidden" }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "10px 20px" }}>
        <h2 id={`h-${def.id}`} style={{ ...cardTitle, flex: "1 1 240px" }}>{def.label}</h2>
        {info && (
          <div style={{ textAlign: "right" }}>
            <div style={{ ...numeric, fontSize: 30, fontWeight: 600, lineHeight: 1.1, color: COLORS.ink, letterSpacing: "-0.02em" }}>{formatValue(def.format, info.value)}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{info.label}</div>
          </div>
        )}
      </div>
      {sentence && <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 18px" }}>{sentence}</p>}
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
      <Strip def={def} points={item.points} accent={accent} />
      {def.nominal && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.5, color: COLORS.inkSoft, margin: "10px 0 0" }}>
          These amounts are not adjusted for inflation, so figures from many years ago look smaller than they were worth.
        </p>
      )}
      <Explain explain={def.explain} why={def.why} accent={accent} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 10px", alignItems: "center", marginTop: 16 }}>
        <a href={`#/indicators/${sectorKey}.${def.id}`} style={{ ...pillStyle(false), textDecoration: "none", color: COLORS.ink, borderColor: `${accent}88` }}>Compare over time</a>
      </div>
      <details style={{ marginTop: 8 }}>
        <summary style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Show the latest figures as a table</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6, fontFamily: FONT_BODY, fontSize: 13 }}>
          <tbody>
            {recent.map(([p, v]) => (
              <tr key={p} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                <td style={{ padding: "6px 0", color: COLORS.inkSoft }}>{labelFor(def, p)}</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: COLORS.ink, fontWeight: 600 }}>{formatValue(def.format, v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <SourceLine def={def} item={item} />
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
      aria-labelledby="h-weekly-deaths" style={{ ...card, scrollMarginTop: 110, position: "relative", overflow: "hidden" }} id="s-weekly-deaths"
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55 }}
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-weekly-deaths" style={cardTitle}>Deaths registered each week</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 18px" }}>{sentence}</p>
      <LineChart
        lines={lines}
        xTicks={[{ x: 1, label: "Jan" }, { x: 14, label: "Apr" }, { x: 27, label: "Jul" }, { x: 40, label: "Oct" }, { x: 52, label: "Dec" }]}
        domainX={[1, 52]}
        yFormat={(v) => `${Math.round(v / 1000)}k`}
        ariaLabel={`Deaths registered each week in England and Wales, ${thisYear}${lastYear ? ` compared with ${lastYear}` : ""}. ${sentence}`}
        accent={accent}
        animateIn
      />
      <Explain
        accent={accent}
        why="Comparing with the same week last year shows quickly whether something unusual is happening, such as a harsh winter flu season, a heatwave or a pandemic wave."
        explain="The number of deaths registered in each week, from all causes, in England and Wales. These are registrations, not the dates people died, so weeks with a bank holiday look lower and the week after looks higher."
      />
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
      style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "6px 0", font: "inherit" }}
    >
      <span aria-hidden="true" style={{ width: 40, height: 23, borderRadius: 12, background: on ? COLORS.ink : COLORS.hairline, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 20 : 3, width: 17, height: 17, borderRadius: 9, background: on ? COLORS.paper : COLORS.inkSoft, transition: "left 0.2s" }} />
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{children}</span>
    </button>
  );
}

// The first headline figure, big, beside the story.
function Spotlight({ def, item, accent }) {
  const info = latestInfo(def, item.points);
  if (!info) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: accent, marginBottom: 4 }}>{def.label}</div>
      <div style={{ ...numeric, fontSize: "clamp(46px, 7vw, 68px)", fontWeight: 600, lineHeight: 1.05, color: COLORS.ink, letterSpacing: "-0.03em" }}>
        <CountUp value={info.value} format={(n) => formatValue(def.format, n)} duration={1.6} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "4px 0 10px" }}>{info.label}</div>
      <ChangeChip change={info.change} accent={accent} />
      <div style={{ marginTop: 14 }}><Spark points={item.points} color={accent} height={58} /></div>
    </div>
  );
}

// Which card is on screen, for the jump bar.
function useActiveCard(ids) {
  const [active, setActive] = useState(null);
  const key = ids.join("|");
  useEffect(() => {
    const els = key.split("|").map((id) => document.getElementById(`s-${id}`)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace(/^s-/, ""));
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}

export default function SectorPage({ sector }) {
  const def = sectorByKey(sector);
  const reduce = useReducedMotion();
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
  const active = useActiveCard(shown.map((s) => s.id));
  if (!def) return null;
  const tiles = shown.filter((s) => s.headline);
  const spotlight = tiles[0];
  const compareRefs = tiles.slice(0, 3).map((s) => `${def.key}.${s.id}`).join(",");
  const newest = shown.map((s) => loaded.series[s.id].updated).filter(Boolean).sort().at(-1);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={Icon} title={def.title} subtitle={def.subtitle} maxWidth={780} />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="these figures" /></div>}
      {!loaded && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}

      {loaded && (
        <>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{
              position: "relative", overflow: "hidden", borderRadius: 26, padding: "clamp(22px, 4vw, 36px)", marginTop: 26, border: `1px solid ${def.accent}55`,
              background: `radial-gradient(800px 320px at 100% -10%, ${def.accent}38, transparent 65%), radial-gradient(500px 260px at 0% 120%, ${def.accent}1f, transparent 65%), ${COLORS.paperCard}`,
              boxShadow: "0 30px 60px -36px rgba(0,0,0,0.6)",
            }}
          >
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${COLORS.hairline} 1px, transparent 1px)`, backgroundSize: "22px 22px", opacity: 0.5, maskImage: "linear-gradient(180deg, #000, transparent 80%)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent 80%)" }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: "28px 40px", alignItems: "center" }}>
              <div>
                <p style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(17px, 2.2vw, 21px)", fontWeight: 600, lineHeight: 1.5, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0 }}>{def.story}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", marginTop: 20, alignItems: "center" }}>
                  <a href={`#/indicators/${compareRefs}`} style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: "#fff", background: def.accent, borderRadius: 12, padding: "11px 20px", textDecoration: "none", boxShadow: `0 12px 24px -12px ${def.accent}` }}>
                    Watch these change over time
                  </a>
                  {newest && <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Latest ONS release: {dateText(newest)}</span>}
                </div>
              </div>
              {spotlight && <Spotlight def={spotlight} item={loaded.series[spotlight.id]} accent={def.accent} />}
            </div>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 16, marginTop: 18 }}>
            {tiles.map((s, i) => <Tile key={s.id} def={s} item={loaded.series[s.id]} accent={def.accent} index={i} />)}
          </div>

          <div className="ons-toolbar" style={{ margin: "32px 0 14px", padding: "12px 0" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px 24px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Show</span>
                <div role="radiogroup" aria-label="How far back to show" style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
                  {RANGES.map((r) => (
                    <button key={r.years} role="radio" aria-checked={range === r.years} onClick={() => setRange(r.years)} style={pillStyle(range === r.years)}>{r.label}</button>
                  ))}
                </div>
              </div>
              <Toggle on={showGovernments} onChange={setShowGovernments}>Show who was in government</Toggle>
            </div>
            <div className="ons-jump" role="navigation" aria-label="Jump to a measure">
              {shown.map((s) => (
                <a
                  key={s.id}
                  href={`#s-${s.id}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(`s-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  aria-current={active === s.id ? "true" : undefined}
                  style={{
                    fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: active === s.id ? 700 : 600, whiteSpace: "nowrap", textDecoration: "none", padding: "5px 11px", borderRadius: 999,
                    color: active === s.id ? "#fff" : COLORS.inkSoft, background: active === s.id ? def.accent : "transparent", border: `1px solid ${active === s.id ? def.accent : COLORS.hairline}`,
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          {showGovernments && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 12px", maxWidth: 780 }}>
              The shading shows which prime minister was in office, blue for Conservative and red for Labour. It shows when something changed, not why. Most of what these charts measure is shaped by world events and by decisions made long before.
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(480px, 100%), 1fr))", gap: 20, alignItems: "start", marginTop: 8 }}>
            {loaded.data.weeklyDeaths && <WeeklyDeaths data={loaded.data.weeklyDeaths} accent={def.accent} />}
            {shown.map((s) => (
              <SeriesCard key={s.id} def={s} item={loaded.series[s.id]} range={range} accent={def.accent} showGovernments={showGovernments} sectorKey={def.key} />
            ))}
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 32, maxWidth: 780 }}>
            Most figures are from the Office for National Statistics (ONS), published under the Open Government Licence v3.0. House prices come from the UK House Price Index (HM Land Registry with the ONS and others), and police recorded crime from the Home Office.
            This site is independent and is not part of any of these bodies. Official statistics are revised as more information arrives, so recent figures can change. We refresh them every day, and they only change when the publishers release them.
          </p>
        </>
      )}
    </div>
  );
}
