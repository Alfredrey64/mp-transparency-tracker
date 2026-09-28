import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../lib/supabasePagination";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { partyColour, initials } from "../lib/format";
import { IconRankings, IconSearch } from "./icons";

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
          How {data.length} ranked MPs spread out — tap a bar to see who's there
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

      <div style={{ position: "relative", height: 76, marginBottom: 2 }}>
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
                  background: color, opacity: isActive ? 1 : i >= thresholdBin ? 0.95 : 0.25,
                  border: isActive ? `2px solid ${COLORS.ink}` : "none",
                  borderRadius: "2px 2px 0 0", transformOrigin: "bottom", padding: 0,
                  cursor: count > 0 ? "pointer" : "default",
                }}
                title={`${count} MP${count === 1 ? "" : "s"}`}
              />
            );
          })}
        </div>
      </div>

      {/* The axis: a baseline with five real, formatted values along it —
          not just "low"/"high" — plus tick marks so each label clearly
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
        The brighter bars on the right are where the {Math.min(shownCount, data.length)} MPs shown below fall.
      </div>
    </div>
  );
}

function RankRow({ entry, index, maxValue, color, valueLabel, onSelectPolitician }) {
  const p = entry.politician;
  const pColor = partyColour(p.party_colour, COLORS.inkSoft);
  const isTop3 = entry.rank <= 3;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.02 }}
      whileHover={{ x: 3 }}
      onClick={() => onSelectPolitician(p)}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
        background: "none", border: "none", borderLeft: `3px solid ${pColor}`, borderBottom: `1px solid ${COLORS.hairline}`,
        padding: "11px 14px",
      }}
    >
      <span
        style={{
          flexShrink: 0, width: 24, textAlign: "center", fontFamily: FONT_DISPLAY, fontSize: 15,
          fontWeight: 700, color: isTop3 ? color : COLORS.inkSoft,
        }}
      >
        {entry.rank}
      </span>
      <Avatar url={p.thumbnail_url} name={p.name} color={pColor} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.name}
          </span>
          <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13, color }}>{valueLabel}</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.party ?? "—"} · {p.constituency ?? "—"}
        </div>
        <div style={{ height: 5, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max((entry.value / maxValue) * 100, 2)}%`, background: color, borderRadius: 999 }} />
        </div>
      </div>
    </motion.button>
  );
}

export default function Rankings({ onSelectPolitician }) {
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
        color: "#9C6B30",
        data: expensesRanking,
        formatValue: (e) => `£${Math.round(e.value).toLocaleString()}`,
        intro: "How much each MP has claimed in business costs — staffing, travel, accommodation, and office running costs — through IPSA this financial year.",
        caveat: "A high total often reflects a large constituency, a big staff, or higher regional costs, not impropriety — every claim is itself checked and audited by IPSA before it's paid out. See the Claims tab on an MP's own page for the itemised breakdown.",
      },
      {
        key: "earnings",
        label: "Outside Earnings",
        color: "#B5533C",
        data: earningsRanking,
        formatValue: (e) => `£${Math.round(e.value).toLocaleString()}`,
        intro: "Total declared outside earnings — ongoing paid roles and one-off payments such as speeches, articles, or consultancy — from the Register of Members' Financial Interests.",
        caveat: "Declaring outside earnings isn't a breach of any rule — it's what the register is for. MPs with no entries here simply haven't declared any outside income, not necessarily none at all if something is below the registration threshold.",
      },
      {
        key: "rebellion",
        label: "Rebellion Rate",
        color: "#6E4B6E",
        data: rebellionRanking,
        formatValue: (e) => `${e.value}%`,
        intro: `How often an MP voted against their own party's majority, across the ${totalDivisions} Commons divisions recorded so far.`,
        caveat: `Only MPs with at least ${MIN_VOTES_FOR_REBELLION_RANKING} recorded votes are ranked, so a handful of votes can't inflate a rate. Independents and the Speaker aren't ranked — a party "majority" isn't a meaningful idea for them.`,
      },
      {
        key: "attendance",
        label: "Attendance",
        color: "#3F7D5C",
        data: attendanceRanking,
        formatValue: (e) => `${e.value}%`,
        intro: `The share of the ${totalDivisions} recorded Commons divisions each MP voted in, tracked so far.`,
        caveat: "Official records don't distinguish being absent from being paired or deliberately abstaining, and an MP who joined Parliament partway through this window will show a lower rate simply because they weren't yet in office for earlier votes.",
      },
    ],
    [expensesRanking, earningsRanking, rebellionRanking, attendanceRanking, totalDivisions]
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
  const maxValue = active.data?.[0]?.value || 1;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconRankings}
        kicker="Public Record · Rankings"
        title="How MPs compare, side by side"
        subtitle="Four metrics, each built from data already tracked elsewhere on this site, ranked head-to-head — business expenses, outside earnings, rebellion rate, and voting attendance. None of these are a verdict on any individual MP; read the note under each ranking for what it can and can't tell you."
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
        <DistributionChart
          key={active.key}
          data={active.data}
          color={active.color}
          shownCount={TOP_N}
          formatValue={active.formatValue}
          activeBin={binFilter?.index}
          onSelectBin={(index, range) => setBinFilter(index == null ? null : { index, ...range })}
        />
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
          {shown.map((entry, i) => (
            <RankRow
              key={entry.politician.id}
              entry={entry}
              index={i}
              maxValue={maxValue}
              color={active.color}
              valueLabel={active.formatValue(entry)}
              onSelectPolitician={onSelectPolitician}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {!loading && filtered.length > TOP_N && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, textAlign: "center", marginTop: 16 }}>
          Showing the top {TOP_N} of {filtered.length} ranked MPs — search by name to find someone further down the list.
        </div>
      )}
    </div>
  );
}
