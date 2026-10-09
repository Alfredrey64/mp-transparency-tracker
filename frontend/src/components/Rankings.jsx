import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../lib/supabasePagination";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import WhatThisMeans, { Everyday } from "./WhatThisMeans";
import { describeSpread } from "../lib/interpret";
import { GlossaryTerm } from "./GlossaryTerm";
import { partyColour, initials } from "../lib/format";
import { IconRankings, IconSearch } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";

// Independents and the Speaker don't sit under a party whip, so "voted
// against the party majority" isn't a meaningful idea for them — the same
// exclusion PoliticianDetail's RebellionRateBox applies one MP at a time.
const NO_PARTY_MAJORITY_CONCEPT = ["independent", "speaker"];

// A brand-new MP (by-election, or one who's simply missed most divisions)
// can otherwise post a misleading 100% rebellion rate off a single vote —
// this is the same kind of floor the site already uses elsewhere (e.g. only
// the largest donors get sector-tagged) to keep a ranking meaningful.
const MIN_VOTES_FOR_REBELLION_RANKING = 10;

const EARNINGS_CATEGORIES = [
  "Employment and earnings",
  "Employment and earnings - Ad hoc payments",
  "Employment and earnings - Ongoing paid employment",
];

const TOP_N = 30;

function Avatar({ url, name, color, size = 36 }) {
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        style={{
          flexShrink: 0, width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}22`, color, fontFamily: FONT_DISPLAY, fontSize: size * 0.36, fontWeight: 600,
        }}
      >
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      onError={() => setErrored(true)}
      style={{ flexShrink: 0, width: size, height: size, borderRadius: "50%", objectFit: "cover", background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}
    />
  );
}

// The standard "nice numbers" axis algorithm (Heckbert) — picks a step
// that's always 1, 2, or 5 times a power of ten, so ticks land on round
// values like £50,000 or 10% instead of whatever the data's actual min/max
// happen to divide into (quintiles of £166,813 gives you a tick at
// "£41,703", which nobody reads as a scale — they read it as a specific
// MP's figure that got mislabelled).
function niceNumber(range, round) {
  if (!range || range <= 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * 10 ** exponent;
}

function niceScale(dataMin, dataMax, targetTicks = 5) {
  const range = niceNumber(dataMax - dataMin, false);
  const step = niceNumber(range / (targetTicks - 1), true);
  const niceMin = Math.floor(dataMin / step) * step;
  const niceMax = Math.ceil(dataMax / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { niceMin, niceMax, step, ticks };
}

// Where does the shown Top 30 actually sit against all of Parliament? A
// ranked list alone can't answer that — two MPs one place apart in rank
// could be nearly tied or worlds apart in value. Bucketing every ranked
// MP's value (not just the visible Top 30) into a real histogram shows
// the actual shape of the spread — often a long tail, not evenly spaced —
// with the bins that make up the list below highlighted against the rest.
// The bars and the axis share the same niceMin/niceMax domain, so a tick
// at "£50,000" always lines up with the bar actually at £50,000. Every
// non-empty bar is also clickable — the only way to actually find "who has
// the lowest attendance" is to be able to select the bottom of the chart,
// not just read the shape of it.
function DistributionChart({ data, color, shownCount, formatValue, activeBin, onSelectBin }) {
  const BINS = 24;
  const { bins, min, max, ticks, binWidth } = useMemo(() => {
    const values = data.map((e) => e.value);
    const dataMin = Math.min(...values, 0);
    const dataMax = Math.max(...values);
    const scale = niceScale(dataMin, dataMax);
    const width = (scale.niceMax - scale.niceMin) / BINS || 1;
    const counts = Array.from({ length: BINS }, () => 0);
    for (const v of values) {
      const idx = Math.min(BINS - 1, Math.max(0, Math.floor((v - scale.niceMin) / width)));
      counts[idx]++;
    }
    return { bins: counts, min: scale.niceMin, max: scale.niceMax, ticks: scale.ticks, binWidth: width };
  }, [data]);

  const maxBinCount = Math.max(...bins, 1);
  const thresholdValue = data[Math.min(shownCount, data.length) - 1]?.value ?? min;
  const thresholdBin = Math.min(BINS - 1, Math.floor(((thresholdValue - min) / (max - min || 1)) * BINS));

  return (
    <div style={{ marginBottom: 22, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "16px 18px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.ink }}>
          How {data.length} ranked MPs spread out. Tap a bar to see who's there
        </div>
        {activeBin != null && (
          <button
            onClick={() => onSelectBin?.(null)}
            style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Clear selection ×
          </button>
        )}
      </div>

      <div style={{ position: "relative", height: 92, paddingTop: 16, marginBottom: 2, boxSizing: "border-box" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: `${(thresholdBin / BINS) * 100}%`, right: 0, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, borderRight: `2px solid ${color}`, height: 8, borderRadius: "4px 4px 0 0", opacity: 0.8 }} />
        <span aria-hidden="true" style={{ position: "absolute", top: -1, right: 6, transform: "translateY(-100%)", fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color, background: COLORS.paperCard, padding: "0 4px" }}>the {Math.min(shownCount, data.length)} shown below</span>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "100%" }}>
          {bins.map((count, i) => {
            const isActive = activeBin === i;
            return (
              <motion.button
                key={i}
                onClick={() => count > 0 && onSelectBin?.(isActive ? null : i, { min: min + i * binWidth, max: min + (i + 1) * binWidth })}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay: i * 0.012, ease: "easeOut" }}
                whileHover={count > 0 ? { scaleY: 1.04 } : {}}
                style={{
                  flex: 1, height: `${Math.max((count / maxBinCount) * 100, count > 0 ? 4 : 0)}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}88)`, opacity: isActive ? 1 : i >= thresholdBin ? 0.98 : 0.28,
                  border: isActive ? `2px solid ${COLORS.ink}` : "none",
                  boxShadow: isActive ? `0 0 14px ${color}` : i >= thresholdBin && count > 0 ? `0 -4px 12px -6px ${color}` : "none",
                  borderRadius: "6px 6px 0 0", transformOrigin: "bottom", padding: 0,
                  cursor: count > 0 ? "pointer" : "default",
                }}
                title={`${count} MP${count === 1 ? "" : "s"}`}
              />
            );
          })}
        </div>
      </div>

      {/* The axis: a baseline with five real, formatted values along it —
          not just "low"/"high", plus tick marks so each label clearly
          points at its position on the bars above, the way a real chart
          axis does. */}
      <div style={{ position: "relative", height: 28, borderTop: `1px solid ${COLORS.hairline}` }}>
        {ticks.map((value) => {
          const f = (value - min) / (max - min || 1);
          const atStart = f < 0.02;
          const atEnd = f > 0.98;
          return (
            <div
              key={value}
              style={{
                position: "absolute", left: `${f * 100}%`, top: 0, transform: `translateX(-${f * 100}%)`,
                display: "flex", flexDirection: "column", alignItems: atStart ? "flex-start" : atEnd ? "flex-end" : "center",
              }}
            >
              <div style={{ width: 1, height: 5, background: COLORS.hairline, marginLeft: atStart ? 0 : atEnd ? "auto" : "50%" }} />
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: COLORS.ink, marginTop: 4, whiteSpace: "nowrap" }}>
                {formatValue({ value })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 6, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
        The bracket marks where the {Math.min(shownCount, data.length)} MPs shown below fall.
      </div>
    </div>
  );
}

const MEDALS = { 1: ["#E8B53A", "#B8862E"], 2: ["#C9CED6", "#8E96A3"], 3: ["#D08A55", "#9A5D2F"] };

function Medal({ rank, size = 26 }) {
  const [light, dark] = MEDALS[rank] ?? ["#8A8FA8", "#5b6075"];
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0, width: size, height: size, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(145deg, ${light}, ${dark})`, color: "#fff", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: size * 0.5,
        boxShadow: `0 2px 0 ${dark}, 0 6px 12px ${dark}55`, textShadow: "0 1px 1px rgba(0,0,0,0.35)",
      }}
    >
      {rank}
    </span>
  );
}

// The top three on a podium: the tallest column in the middle, with the MP's face, their party's colour round it and a medal.
function Podium({ entries, color, formatValue, maxValue, onSelectPolitician }) {
  const reduce = useReducedMotion();
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <div role="list" aria-label="The top three" style={{ display: "grid", gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))`, gap: "clamp(6px, 2vw, 18px)", alignItems: "end", margin: "6px 0 22px", padding: "18px clamp(8px, 2vw, 22px) 0", borderRadius: 18, background: `radial-gradient(420px 220px at 50% 0%, ${color}26, transparent 70%)` }}>
      {order.map((entry) => {
        const p = entry.politician;
        const pColor = partyColour(p.party_colour, COLORS.inkSoft);
        const first = entry.rank === 1;
        const height = 54 + Math.max(0.18, entry.value / maxValue) * (first ? 120 : 96);
        const avatar = first ? 84 : 66;
        return (
          <motion.button
            key={p.id} role="listitem" type="button" onClick={() => onSelectPolitician(p)}
            initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: first ? 0.05 : entry.rank === 2 ? 0.2 : 0.32, type: "spring", stiffness: 160, damping: 18 }}
            whileHover={reduce ? undefined : { y: -4 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", minWidth: 0, color: "inherit" }}
          >
            <span style={{ position: "relative", display: "inline-flex", marginBottom: 8 }}>
              <span style={{ display: "inline-flex", borderRadius: "50%", padding: 3, background: `linear-gradient(145deg, ${pColor}, ${pColor}88)`, boxShadow: `0 10px 26px -8px ${pColor}aa` }}>
                <Avatar url={p.thumbnail_url} name={p.name} color={pColor} size={avatar} />
              </span>
              <span style={{ position: "absolute", right: -6, bottom: -4 }}><Medal rank={entry.rank} size={first ? 32 : 28} /></span>
            </span>
            <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: first ? 14.5 : 13, color: COLORS.ink, textAlign: "center", lineHeight: 1.25, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, textAlign: "center", marginBottom: 6, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.party ?? "No party"}</span>
            <motion.span
              aria-hidden="true"
              initial={reduce ? false : { height: 0 }} animate={{ height }} transition={{ delay: 0.1, type: "spring", stiffness: 90, damping: 16 }}
              style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "center", width: "100%", borderRadius: "14px 14px 0 0", background: `linear-gradient(180deg, ${color}, ${color}55)`, boxShadow: `inset 0 2px 0 rgba(255,255,255,0.35), 0 -10px 30px -14px ${color}`, overflow: "hidden" }}
            >
              <span style={{ marginTop: 10, fontFamily: FONT_MONO, fontWeight: 800, fontSize: first ? 20 : 16, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "-0.02em" }}>{formatValue(entry)}</span>
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -14, textAlign: "center", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 84, lineHeight: 1, color: "rgba(255,255,255,0.14)" }}>{entry.rank}</span>
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}

// One MP in the race: their face rides at the end of their bar, so the length of the bar and the position of the face both say how far ahead they are.
function RaceRow({ entry, index, maxValue, color, valueLabel, onSelectPolitician }) {
  const reduce = useReducedMotion();
  const p = entry.politician;
  const pColor = partyColour(p.party_colour, COLORS.inkSoft);
  const pct = Math.min(100, Math.max(8, (entry.value / maxValue) * 100));
  return (
    <motion.button
      layout="position"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.02 }}
      whileHover={reduce ? undefined : { x: 3 }}
      onClick={() => onSelectPolitician(p)}
      className="race-row"
      style={{
        display: "grid", gridTemplateColumns: "34px minmax(0, 1fr)", gap: "0 12px", alignItems: "center", width: "100%", textAlign: "left", cursor: "pointer",
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "10px 14px 10px 10px",
      }}
    >
      <span style={{ alignSelf: "center", justifySelf: "center" }}>
        {entry.rank <= 3 ? <Medal rank={entry.rank} size={28} /> : <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: COLORS.inkSoft }}>{entry.rank}</span>}
      </span>
      <span style={{ minWidth: 0, display: "block" }}>
        <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <span style={{ minWidth: 0, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.name}
            <span style={{ fontWeight: 500, fontSize: 11.5, color: COLORS.inkSoft }}>{"  "}{p.party ?? "No party"} · {p.constituency ?? "No constituency"}</span>
          </span>
          <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontWeight: 800, fontSize: 14, color }}>{valueLabel}</span>
        </span>
        <span aria-hidden="true" style={{ position: "relative", display: "block", height: 34, marginTop: 4 }}>
          <motion.span
            initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", left: 0, top: 10, height: 14, borderRadius: 7, background: `linear-gradient(90deg, ${color}55, ${color})` }}
          />
          <motion.span
            initial={reduce ? false : { left: "0%" }} animate={{ left: `${pct}%` }} transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", top: 0, transform: "translateX(-100%)", display: "inline-flex", borderRadius: "50%", padding: 2, background: pColor }}
          >
            <Avatar url={p.thumbnail_url} name={p.name} color={pColor} size={30} />
          </motion.span>
        </span>
      </span>
    </motion.button>
  );
}

// Who is in the list, by party: one bar split into the parties' colours.
function PartyStrip({ entries }) {
  const parts = useMemo(() => {
    const m = new Map();
    for (const e of entries) {
      const key = e.politician.party ?? "No party";
      const cur = m.get(key) ?? { party: key, colour: partyColour(e.politician.party_colour, COLORS.inkSoft), count: 0 };
      cur.count++;
      m.set(key, cur);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [entries]);
  if (entries.length < 4) return null;
  return (
    <div style={{ margin: "0 0 18px" }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.ink, marginBottom: 8 }}>Which parties the {entries.length} MPs below belong to</div>
      <div role="img" aria-label={parts.map((p) => `${p.party} ${p.count}`).join(", ")} style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", gap: 2 }}>
        {parts.map((p) => <motion.span key={p.party} initial={{ flexGrow: 0 }} animate={{ flexGrow: p.count }} transition={{ duration: 0.6 }} style={{ flexBasis: 0, background: p.colour, minWidth: 4 }} title={`${p.party}: ${p.count}`} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", marginTop: 8 }}>
        {parts.slice(0, 8).map((p) => (
          <span key={p.party} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.ink }}>
            <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: p.colour }} />
            {p.party} <strong style={{ fontFamily: FONT_MONO }}>{p.count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Rankings({ onSelectPolitician, onNavigate }) {
  const [politicians, setPoliticians] = useState(null);
  const [votingRows, setVotingRows] = useState(null);
  const [interestRows, setInterestRows] = useState(null);
  const [category, setCategory] = useState("expenses");
  const [query, setQuery] = useState("");
  const [binFilter, setBinFilter] = useState(null); // { index, min, max } | null

  function changeCategory(key) {
    setCategory(key);
    setBinFilter(null);
  }

  useEffect(() => {
    async function load() {
      const [p, v, i] = await Promise.all([
        fetchAllRows(() => supabase.from("politicians").select("id, name, party, party_colour, constituency, thumbnail_url, ipsa_expenses")),
        fetchAllRows(() => supabase.from("voting_records").select("politician_id, division_id, voted_with_party_majority")),
        fetchAllRows(() => supabase.from("financial_interests").select("politician_id, category, value_amount")),
      ]);
      setPoliticians(p);
      setVotingRows(v);
      setInterestRows(i);
    }
    load();
  }, []);

  const politicianById = useMemo(() => new Map((politicians ?? []).map((p) => [p.id, p])), [politicians]);

  const totalDivisions = useMemo(() => {
    if (!votingRows) return 0;
    return new Set(votingRows.map((r) => r.division_id)).size;
  }, [votingRows]);

  const expensesRanking = useMemo(() => {
    if (!politicians) return null;
    return politicians
      .filter((p) => p.ipsa_expenses?.total)
      .map((p) => ({ politician: p, value: p.ipsa_expenses.total }))
      .sort((a, b) => b.value - a.value)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [politicians]);

  const earningsRanking = useMemo(() => {
    if (!politicians || !interestRows) return null;
    const totals = new Map();
    for (const row of interestRows) {
      if (!EARNINGS_CATEGORIES.includes(row.category) || !row.value_amount) continue;
      totals.set(row.politician_id, (totals.get(row.politician_id) ?? 0) + row.value_amount);
    }
    return [...totals.entries()]
      .map(([politicianId, value]) => ({ politician: politicianById.get(politicianId), value }))
      .filter((e) => e.politician)
      .sort((a, b) => b.value - a.value)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [politicians, interestRows, politicianById]);

  const rebellionRanking = useMemo(() => {
    if (!politicians || !votingRows) return null;
    const tallies = new Map(); // politician_id -> { total, against }
    for (const row of votingRows) {
      if (row.voted_with_party_majority === null || row.voted_with_party_majority === undefined) continue;
      const t = tallies.get(row.politician_id) ?? { total: 0, against: 0 };
      t.total += 1;
      if (row.voted_with_party_majority === false) t.against += 1;
      tallies.set(row.politician_id, t);
    }
    return [...tallies.entries()]
      .map(([politicianId, t]) => ({ politician: politicianById.get(politicianId), total: t.total, against: t.against }))
      .filter((e) => e.politician && !NO_PARTY_MAJORITY_CONCEPT.includes((e.politician.party ?? "").toLowerCase()) && e.total >= MIN_VOTES_FOR_REBELLION_RANKING)
      .map((e) => ({ politician: e.politician, value: Math.round((e.against / e.total) * 1000) / 10, total: e.total }))
      .sort((a, b) => b.value - a.value)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [politicians, votingRows, politicianById]);

  const attendanceRanking = useMemo(() => {
    if (!politicians || !votingRows || totalDivisions === 0) return null;
    const counts = new Map();
    for (const row of votingRows) {
      counts.set(row.politician_id, (counts.get(row.politician_id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([politicianId, count]) => ({ politician: politicianById.get(politicianId), count }))
      .filter((e) => e.politician)
      .map((e) => ({ politician: e.politician, value: Math.round((e.count / totalDivisions) * 1000) / 10, count: e.count }))
      .sort((a, b) => b.value - a.value)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [politicians, votingRows, politicianById, totalDivisions]);

  const CATEGORIES = useMemo(
    () => [
      {
        key: "expenses",
        label: "Business Expenses",
        color: "#2F6FA3",
        data: expensesRanking,
        formatValue: (e) => `£${Math.round(e.value).toLocaleString()}`,
        intro: (
          <>
            How much each MP has claimed in business costs, staffing, travel, accommodation, and office running
            costs, through IPSA, the Independent Parliamentary Standards Authority
            {onNavigate && (
              <>
                {" "}(
                <button
                  onClick={() => withScrollPreserved(() => onNavigate("glossary"))}
                  style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", textDecoration: "underline", cursor: "pointer" }}
                >
                  see Glossary
                </button>
                )
              </>
            )}
            , this financial year.
          </>
        ),
        caveat: "A high total often reflects a large constituency, a big staff, or higher regional costs, not impropriety: every claim is itself checked and audited by IPSA before it's paid out. See the Claims tab on an MP's own page for the itemised breakdown.",
      },
      {
        key: "earnings",
        label: "Outside Earnings",
        color: "#1E8E85",
        data: earningsRanking,
        formatValue: (e) => `£${Math.round(e.value).toLocaleString()}`,
        intro: "Total declared outside earnings (ongoing paid roles and one-off payments such as speeches, articles, or consultancy) from the Register of Members' Financial Interests.",
        caveat: "Declaring outside earnings isn't a breach of any rule. It's what the register is for. MPs with no entries here simply haven't declared any outside income, not necessarily none at all if something is below the registration threshold.",
      },
      {
        key: "rebellion",
        label: "Rebellion Rate",
        color: "#7A5BC7",
        data: rebellionRanking,
        formatValue: (e) => `${e.value}%`,
        intro: (
          <>
            How often an MP voted against their own party's majority, across the {totalDivisions} Commons{" "}
            <GlossaryTerm term="Division">divisions</GlossaryTerm> recorded so far.
          </>
        ),
        caveat: `Only MPs with at least ${MIN_VOTES_FOR_REBELLION_RANKING} recorded votes are ranked, so a handful of votes can't inflate a rate. Independents and the Speaker aren't ranked: a party "majority" isn't a meaningful idea for them.`,
      },
      {
        key: "attendance",
        label: "Attendance",
        color: "#3E9B4F",
        data: attendanceRanking,
        formatValue: (e) => `${e.value}%`,
        intro: (
          <>
            The share of the {totalDivisions} recorded Commons <GlossaryTerm term="Division">divisions</GlossaryTerm>{" "}
            each MP voted in, tracked so far.
          </>
        ),
        caveat: (
          <>
            Official records don't distinguish being absent from being{" "}
            <GlossaryTerm term="Pairing">paired</GlossaryTerm> or deliberately abstaining, and an MP who joined
            Parliament partway through this window will show a lower rate simply because they weren't yet in office
            for earlier votes.
          </>
        ),
      },
    ],
    [expensesRanking, earningsRanking, rebellionRanking, attendanceRanking, totalDivisions, onNavigate]
  );

  const active = CATEGORIES.find((c) => c.key === category);
  const loading = active.data === null;

  const filtered = useMemo(() => {
    if (!active.data) return [];
    let list = active.data;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.politician.name.toLowerCase().includes(q) || (e.politician.constituency ?? "").toLowerCase().includes(q));
    if (binFilter) list = list.filter((e) => e.value >= binFilter.min && e.value < binFilter.max);
    return list;
  }, [active.data, query, binFilter]);

  // With no bin selected, this is a "Top 30" leaderboard. Selecting a bar
  // on the histogram switches it to "every MP in that exact range" instead
  // — that's the only way to actually answer "who has the lowest
  // attendance", since the bottom of the distribution is never in the
  // Top 30 by definition.
  const shown = binFilter ? filtered : filtered.slice(0, TOP_N);
  // One line on how spread out the ranked figures are, and, for money, what
  // the biggest one comes to in everyday terms.
  const spread = useMemo(() => {
    if (!active.data?.length) return null;
    const sorted = active.data.map((e) => e.value).sort((a, b) => a - b);
    return describeSpread({ sorted, format: (v) => active.formatValue({ value: v }), noun: "MP", zero: "have none" });
  }, [active]);
  const topValueEveryday = active.key === "expenses" || active.key === "earnings" ? active.data?.[0]?.value : null;
  const maxValue = active.data?.[0]?.value || 1;
  // The podium is for the plain top of the table; a search or a clicked bar shows a plain list instead.
  const showPodium = !binFilter && !query.trim() && shown.length >= 3 && shown[0]?.rank === 1;
  const rest = showPodium ? shown.slice(3) : shown;
  // Below the podium the bars are measured against the first one left, so the gaps between MPs are easy to see.
  const restMax = showPodium ? rest[0]?.value || maxValue : maxValue;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconRankings}
        kicker="Rankings"
        title="MP league tables"
        subtitle="Four measures, each built from data tracked elsewhere on this site: business expenses, outside earnings, rebellion rate and voting attendance. None is a verdict on an individual MP. Read the note under each table for what it can and can't tell you."
      />

      <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 4, marginTop: 24, marginBottom: 20 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => changeCategory(c.key)}
            style={{
              position: "relative", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "8px 16px", borderRadius: 999,
              border: "none", background: "transparent", color: category === c.key ? "#fff" : COLORS.inkSoft, cursor: "pointer", zIndex: 1,
            }}
          >
            {category === c.key && (
              <motion.div
                layoutId="rankingsTogglePill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                style={{ position: "absolute", inset: 0, background: c.color, borderRadius: 999, zIndex: -1 }}
              />
            )}
            {c.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: `${active.color}0c`, border: `1px solid ${active.color}33`, borderRadius: 12, padding: "14px 18px",
          marginBottom: 20, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.ink,
        }}
      >
        <div style={{ marginBottom: 6 }}>{active.intro}</div>
        <div style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>{active.caveat}</div>
      </div>

      {!loading && active.data.length > 0 && (
        <>
          {spread && (
            <WhatThisMeans
              result={{ marker: "How spread out it is", tone: "mid", text: spread }}
              style={{ marginTop: 0, marginBottom: 14 }}
            />
          )}
          {topValueEveryday && <div style={{ marginBottom: 14 }}><Everyday amount={topValueEveryday} lead={`The largest figure here, ${active.formatValue({ value: topValueEveryday })}, is`} /></div>}
        <DistributionChart
          key={active.key}
          data={active.data}
          color={active.color}
          shownCount={TOP_N}
          formatValue={active.formatValue}
          activeBin={binFilter?.index}
          onSelectBin={(index, range) => setBinFilter(index == null ? null : { index, ...range })}
        />
        </>
      )}

      <div style={{ position: "relative", maxWidth: 420, marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by MP or constituency…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      {binFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, fontFamily: FONT_BODY, fontSize: 13 }}>
          <span style={{ color: COLORS.ink }}>
            Showing all <strong>{filtered.length}</strong> MP{filtered.length === 1 ? "" : "s"} between{" "}
            <strong>{active.formatValue({ value: binFilter.min })}</strong> and <strong>{active.formatValue({ value: binFilter.max })}</strong>
          </span>
          <button
            onClick={() => setBinFilter(null)}
            style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: active.color, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Back to Top {TOP_N}
          </button>
        </div>
      )}

      {loading && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No matches.</div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {showPodium && <Podium entries={shown.slice(0, 3)} color={active.color} formatValue={active.formatValue} maxValue={maxValue} onSelectPolitician={onSelectPolitician} />}
          {!loading && shown.length > 0 && <PartyStrip entries={shown} />}
          {showPodium && rest.length > 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, margin: "-6px 0 2px" }}>The bars below are measured against {rest[0].politician.name}, in 4th place, so the gaps between MPs are easy to see.</div>}
          {rest.map((entry, i) => (
            <RaceRow
              key={entry.politician.id}
              entry={entry}
              index={i}
              maxValue={restMax}
              color={active.color}
              valueLabel={active.formatValue(entry)}
              onSelectPolitician={onSelectPolitician}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {!loading && filtered.length > TOP_N && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, textAlign: "center", marginTop: 16 }}>
          Showing the top {TOP_N} of {filtered.length} ranked MPs. Search by name to find someone further down the list.
        </div>
      )}
    </div>
  );
}
