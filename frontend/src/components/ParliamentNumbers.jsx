import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { computeParliamentStats } from "../lib/parliamentStats";
import { computeCareerStats } from "../lib/careerStats";
import { PageHeader, LoadFailedNote } from "./shared";
import { PartyHemicycle } from "./PartyHemicycle";
import { IconChartBars } from "./icons";
import BarRow from "./BarRow";
import CountUp from "./CountUp";
import Reveal from "./Reveal";
import DownloadCsvButton from "./DownloadCsvButton";
import { SEATS_COLUMNS } from "../lib/exportColumns";

const fmt = (n) => n.toLocaleString("en-GB");
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const pct0 = (n) => `${Math.round(n)}%`;
const joinNames = (n) => (n.length <= 2 ? n.join(" and ") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);
const goSeat = (name) => {
  window.location.hash = `#/constituency/${encodeURIComponent(name)}`;
};

// A tile of the grid: a coloured edge for what kind of fact it holds (people,
// careers, seats, change), a title, a one-line note, then the chart.
const EDGE = { people: "#4F46E5", careers: "#1FA97C", seats: "#E8A33D", change: "#E0367A" };

function Tile({ span, edge = "people", title, note, children, delay = 0, style }) {
  return (
    <div className={span} style={{ minWidth: 0 }}>
      <Reveal delay={delay}>
        <section style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${EDGE[edge]}`, borderRadius: 18, padding: "18px 20px 20px", height: "100%", boxSizing: "border-box", ...style }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
          {note && <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: "4px 0 0", maxWidth: 560 }}>{note}</p>}
          <div style={{ marginTop: 16 }}>{children}</div>
        </section>
      </Reveal>
    </div>
  );
}

function Figure({ value, format, label, note, size = 38 }) {
  return (
    <div>
      <div style={{ ...numeric, fontSize: size, fontWeight: 600, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.02em" }}>
        <CountUp value={value} format={format} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{label}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 1, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

// ---- Seats by party, on one scale ----------------------------------------
// Every bar is drawn against the same 0 to 650 axis, labelled, with the
// majority line on it. Parties with only a seat or two are grouped, so the
// chart is about the parties that decide votes.

const COLUMNS = "minmax(120px, 190px) minmax(0, 1fr) 118px";

function SeatsChart({ stats }) {
  const reduce = useReducedMotion();
  const total = stats.total;
  const major = stats.majorityLine;
  const big = stats.seatsByParty.filter((r) => r.count >= 3);
  const small = stats.seatsByParty.filter((r) => r.count < 3);
  const rows = [
    ...big.map((r) => ({ key: r.party, label: r.coop ? `${r.party} (incl. Co-op)` : r.party, colour: partyColour(r.colour, COLORS.inkSoft), count: r.count, pct: r.pct, title: null })),
    ...(small.length ? [{ key: "others", label: `${small.length} smaller parties`, colour: COLORS.inkSoft, count: small.reduce((n, r) => n + r.count, 0), pct: (small.reduce((n, r) => n + r.count, 0) / total) * 100, title: small.map((r) => `${r.party} ${r.count}`).join(", ") }] : []),
  ];
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 12, marginBottom: 4 }}>
        <span />
        <div style={{ position: "relative", height: 18 }}>
          {ticks.map((t) => (
            <span key={t} style={{ position: "absolute", left: `${t * 100}%`, transform: t === 0 ? "none" : t === 1 ? "translateX(-100%)" : "translateX(-50%)", fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>
              {fmt(Math.round(total * t))}
            </span>
          ))}
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.inkSoft, textAlign: "right" }}>seats · share</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.key} title={r.title ?? `${r.label}: ${r.count} seats`} style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 12, alignItems: "center", padding: "5px 0" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
          <div style={{ position: "relative", height: 14, background: COLORS.paper, borderRadius: 4 }}>
            {[0.25, 0.75].map((t) => (
              <span key={t} aria-hidden="true" style={{ position: "absolute", left: `${t * 100}%`, top: 0, bottom: 0, borderLeft: `1px solid ${COLORS.hairline}` }} />
            ))}
            <motion.div
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${(r.count / total) * 100}%` }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.8, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "100%", minWidth: 3, background: r.colour, borderRadius: "0 4px 4px 0" }}
            />
            <span aria-hidden="true" style={{ position: "absolute", left: `${(major / total) * 100}%`, top: -5, bottom: -5, borderLeft: `2px dashed ${COLORS.ink}`, opacity: 0.75 }} />
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <span style={{ ...numeric, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{fmt(r.count)}</span>
            <span style={{ ...numeric, fontSize: 12.5, color: COLORS.inkSoft }}> · {pct1(r.pct)}</span>
          </div>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 12, marginTop: 6 }}>
        <span />
        <div style={{ position: "relative", height: 16 }}>
          <span style={{ position: "absolute", left: `${(major / total) * 100}%`, transform: "translateX(-50%)", fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap" }}>{major} = majority</span>
        </div>
        <span />
      </div>
    </div>
  );
}

function SeatsTable({ stats }) {
  const cell = { padding: "7px 10px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, borderBottom: `1px solid ${COLORS.hairline}`, textAlign: "right" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
        <thead>
          <tr>
            {["Party", "MPs", "Share of seats", "Women", "Share women"].map((h, i) => (
              <th key={h} style={{ ...cell, textAlign: i === 0 ? "left" : "right", fontWeight: 700, color: COLORS.inkSoft, fontSize: 11.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.seatsByParty.map((r) => (
            <tr key={r.party}>
              <td style={{ ...cell, textAlign: "left" }}>{r.party}</td>
              <td style={{ ...cell, ...numeric }}>{fmt(r.count)}</td>
              <td style={{ ...cell, ...numeric }}>{pct1(r.pct)}</td>
              <td style={{ ...cell, ...numeric }}>{fmt(r.women)}</td>
              <td style={{ ...cell, ...numeric }}>{pct1(r.womenPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Women: one dot per MP ------------------------------------------------
function WomenWaffle({ women, total }) {
  const columns = 26;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} role="img" aria-label={`${women} of ${total} MPs are women`} style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 3.5 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={inView ? "waffle-dot" : undefined}
          style={{ aspectRatio: "1", borderRadius: "50%", background: i < women ? COLORS.accent : COLORS.hairline, opacity: inView ? undefined : 0, animationDelay: `${Math.floor(i / columns) * 22}ms` }}
        />
      ))}
    </div>
  );
}

// ---- Intakes: who arrived when, and for which party -----------------------
function CohortChart({ cohorts }) {
  const reduce = useReducedMotion();
  const totals = new Map();
  cohorts.forEach((c) => c.parties.forEach((p) => totals.set(p.party, (totals.get(p.party) ?? 0) + p.count)));
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p]) => p);
  const colourOf = new Map();
  cohorts.forEach((c) => c.parties.forEach((p) => colourOf.set(p.party, p.colour)));
  const max = Math.max(1, ...cohorts.map((c) => c.count));
  const HEIGHT = 190;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cohorts.length}, minmax(0, 1fr))`, gap: "0 10px", alignItems: "end" }}>
        {cohorts.map((c, ci) => {
          const segments = [...top.map((p) => ({ party: p, count: c.parties.find((x) => x.party === p)?.count ?? 0, colour: partyColour(colourOf.get(p), COLORS.inkSoft) })), { party: "Others", count: c.parties.filter((x) => !top.includes(x.party)).reduce((n, x) => n + x.count, 0), colour: COLORS.inkSoft }].filter((s) => s.count > 0);
          return (
            <div key={c.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
              <div style={{ ...numeric, fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>{c.count}</div>
              <div style={{ height: HEIGHT, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <motion.div
                  initial={reduce ? false : { height: 0 }}
                  whileInView={{ height: `${(c.count / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: ci * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: "100%", display: "flex", flexDirection: "column-reverse", gap: 1.5, borderRadius: "6px 6px 0 0", overflow: "hidden" }}
                >
                  {segments.map((s) => (
                    <div key={s.party} title={`${s.party}: ${s.count}`} style={{ flexGrow: s.count, flexBasis: 0, background: s.colour, minHeight: 2 }} />
                  ))}
                </motion.div>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.ink, marginTop: 8, textAlign: "center", lineHeight: 1.25 }}>{c.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 16 }}>
        {[...top, "Others"].map((p) => (
          <span key={p} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p === "Others" ? COLORS.inkSoft : partyColour(colourOf.get(p), COLORS.inkSoft) }} />
            {p}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 8 }}>Coloured by the party each MP sits for today, not the one they arrived with.</div>
    </div>
  );
}

// ---- Safe seats ------------------------------------------------------------
function SafetyHistogram({ summary }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...summary.histogram.map((h) => h.count));
  const HEIGHT = 150;
  const band = (from) => (from < 5 ? 0 : from < 20 ? 1 : 2);
  const counts = [0, 0, 0];
  summary.histogram.forEach((h) => {
    counts[band(h.from)] += h.count;
  });
  const labels = ["Marginal", "Fairly safe", "Safe"];
  const shade = [0.4, 0.7, 1];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: HEIGHT }}>
        {summary.histogram.map((h, i) => (
          <div key={h.from} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", alignItems: "center" }} title={`${h.to == null ? `${h.from}% or more` : `${h.from}–${h.to}%`}: ${h.count} seats`}>
            <div style={{ ...numeric, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, marginBottom: 3 }}>{h.count}</div>
            <motion.div
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${(h.count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", minHeight: h.count ? 3 : 0, background: COLORS.accent, opacity: shade[band(h.from)], borderRadius: "5px 5px 0 0" }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
        {summary.histogram.map((h) => (
          <div key={h.from} style={{ flex: 1, textAlign: "center", fontFamily: FONT_BODY, fontSize: 10, color: COLORS.inkSoft }}>
            {h.from}
            {h.to == null ? "+" : ""}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>Winner's majority, % of votes cast</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", marginTop: 14 }}>
        {labels.map((l, i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: COLORS.accent, opacity: shade[i] }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
              {l} <strong style={{ ...numeric, fontWeight: 700 }}>{fmt(counts[i])}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatList({ title, seats }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 2 }}>{title}</div>
      {seats.map((s, i) => (
        <button key={s.name} type="button" onClick={() => goSeat(s.name)} style={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr) auto", gap: 8, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, padding: "7px 0", cursor: "pointer" }}>
          <span style={{ ...numeric, fontSize: 12, color: COLORS.inkSoft }}>{i + 1}</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: partyColour(s.colour, COLORS.inkSoft), flexShrink: 0 }} />
              {s.mp}
            </span>
          </span>
          <span style={{ textAlign: "right" }}>
            <span style={{ display: "block", ...numeric, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{fmt(s.majority)}</span>
            {s.majorityPct != null && <span style={{ display: "block", ...numeric, fontSize: 11, color: COLORS.inkSoft }}>{s.majorityPct.toFixed(1)}% lead</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---- Careers ---------------------------------------------------------------
function TermsBands({ bands, total, average }) {
  const max = Math.max(1, ...bands.map((b) => b.count));
  return (
    <div>
      {bands.map((b, i) => (
        <BarRow key={b.key} label={b.label} color={COLORS.accent} fraction={b.count / max} valueText={fmt(b.count)} detail={pct0((b.count / total) * 100)} labelWidth={120} valueWidth={96} delay={i * 0.05} />
      ))}
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 8 }}>
        On average, MPs have won <strong style={{ ...numeric, color: COLORS.ink }}>{(Math.round(average * 10) / 10).toFixed(1)}</strong> elections, including by-elections.
      </div>
    </div>
  );
}

function Switches({ switchers }) {
  if (switchers.transitions.length === 0) return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No party changes recorded among current MPs.</div>;
  const max = Math.max(1, ...switchers.transitions.map((t) => t.count));
  return (
    <div>
      {switchers.transitions.map((t, i) => (
        <div key={`${t.from}-${t.to}`} title={t.names.join(", ")} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 90px", gap: 12, alignItems: "center", padding: "7px 0", borderTop: i === 0 ? "none" : `1px solid ${COLORS.hairline}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
              <strong>{t.from}</strong> <span style={{ color: COLORS.inkSoft }}>→</span> <strong>{t.to}</strong>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.names.slice(0, 4).join(", ")}{t.names.length > 4 ? ` and ${t.names.length - 4} more` : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 7, background: COLORS.paper, borderRadius: 4 }}>
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${(t.count / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.06 }} style={{ height: "100%", background: "#E0367A", borderRadius: "0 4px 4px 0" }} />
            </div>
            <span style={{ ...numeric, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{t.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ParliamentNumbers({ onNavigate }) {
  const [rows, setRows] = useState(null);
  const [byElections, setByElections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [careers, setCareers] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    supabase
      .from("politicians")
      .select("name, party, party_colour, gender, membership_start_date, parliament_member_id")
      .then(({ data, error }) => {
        setFailed(Boolean(error));
        setRows(data ?? []);
      });
    supabase.from("by_elections").select("status, result").then(({ data }) => setByElections(data ?? []));
    import("../data/constituencySummary.json").then((m) => setSummary(m.default)).catch(() => setSummary(null));
    import("../data/mpCareers.json").then((m) => setCareers(m.default)).catch(() => setCareers(null));
  }, []);

  const stats = useMemo(() => (rows ? computeParliamentStats(rows, byElections) : null), [rows, byElections]);
  const career = useMemo(() => (rows && careers ? computeCareerStats(careers.mps, rows) : null), [rows, careers]);
  const labour = stats?.seatsByParty.find((r) => r.party === "Labour");

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconChartBars}
        kicker="Public Record · Parliament in Numbers"
        title="The House of Commons, by the numbers"
        subtitle="Who sits in the Commons right now, where they came from, and how safe their seats are. All worked out from live parliamentary records."
      />

      {rows === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {rows !== null && failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the list of MPs" /></div>}

      {stats && !failed && stats.total > 0 && (
        <div className="bento" style={{ marginTop: 26 }}>
          <div className="bento-grid">
            <Tile span="s8" edge="people" title="The chamber" note={`${labour ? `Labour holds ${fmt(labour.count)} of the seats (${pct1(labour.pct)}). ` : ""}${stats.majorityLine} are enough to win any vote outright.`}>
              <PartyHemicycle
                politicians={rows}
                legendCount={6}
                centre={
                  <div>
                    <div style={{ ...numeric, fontSize: "clamp(22px, 4.4cqw, 34px)", fontWeight: 700, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.03em" }}>
                      <CountUp value={stats.total} duration={1.3} />
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>MPs</div>
                  </div>
                }
              />
            </Tile>

            <Tile span="s4" edge="people" title="At a glance" delay={0.05}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Figure value={stats.womenPct} format={(n) => pct1(n)} label="are women" note={`${fmt(stats.women)} of ${fmt(stats.total)}`} />
                <Figure value={stats.newMps} format={(n) => fmt(Math.round(n))} label="new since July 2024" note="Including by-election winners" />
                <Figure value={stats.medianTenure} format={(n) => `${(Math.round(n * 10) / 10).toFixed(1)} yrs`} label="median time as an MP" note={`Average ${(Math.round(stats.averageTenure * 10) / 10).toFixed(1)} years`} />
              </div>
            </Tile>

            <Tile span="s7" edge="seats" title="Seats by party" note="Every bar is on the same 0 to 650 scale. The dashed line is a majority.">
              <SeatsChart stats={stats} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", marginTop: 12 }}>
                <button type="button" onClick={() => setShowTable((v) => !v)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                  {showTable ? "Hide the table" : "View every party as a table"}
                </button>
                <DownloadCsvButton label="Download (CSV)" slug="seats-by-party" columns={SEATS_COLUMNS} rows={stats.seatsByParty} />
              </div>
              {showTable && <div style={{ marginTop: 10 }}><SeatsTable stats={stats} /></div>}
            </Tile>

            <Tile span="s5" edge="people" title="Women in the Commons" note="Each dot is one MP. The coloured ones are women." delay={0.05}>
              <WomenWaffle women={stats.women} total={stats.total} />
              <div style={{ marginTop: 16 }}>
                {stats.womenByParty.slice(0, 5).map((r, i) => (
                  <BarRow key={r.party} label={r.party} color={COLORS.accent} fraction={r.womenPct / 100} valueText={pct0(r.womenPct)} detail={`${r.women}/${r.count}`} labelWidth={130} valueWidth={96} delay={i * 0.04} />
                ))}
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each party who are women (the five largest to rank).</div>
              </div>
            </Tile>

            {career && (
              <>
                <Tile span="s12" edge="careers" title="Who arrived when" note={`MPs grouped by the general election they first came in on, so by-election winners sit with the intake before them.${career.cohorts.find((c) => c.key === 2024) ? ` The 2024 intake is ${pct0((career.cohorts.find((c) => c.key === 2024).count / career.total) * 100)} of the House.` : ""}`}>
                  <CohortChart cohorts={career.cohorts} />
                </Tile>

                <Tile span="s5" edge="careers" title="How many terms" note="Elections each MP has won, by-elections included.">
                  <TermsBands bands={career.electedBands} total={career.total} average={career.averageElected} />
                </Tile>

                <Tile span="s7" edge="careers" title="Experience of office" delay={0.05} note="Who has held a government post, in this Parliament or any before it.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px", marginBottom: 14 }}>
                    <Figure value={career.government.everMinister} format={(n) => fmt(Math.round(n))} label="have been ministers" note={`${pct0(career.government.everMinisterPct)} of MPs`} size={32} />
                    <Figure value={career.government.inGovernmentNow} format={(n) => fmt(Math.round(n))} label="are in government now" size={32} />
                    <Figure value={career.government.shadowEver} format={(n) => fmt(Math.round(n))} label="have been shadow ministers" size={32} />
                  </div>
                  {career.government.byParty.slice(0, 5).map((r, i) => (
                    <BarRow key={r.party} label={r.party} color={partyColour(r.colour, COLORS.inkSoft)} fraction={r.pct / 100} valueText={pct0(r.pct)} detail={`${r.everMinister}/${r.count}`} labelWidth={150} valueWidth={110} delay={i * 0.04} />
                  ))}
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each party's MPs who have ever held a government post.</div>
                </Tile>

                <Tile span="s7" edge="change" title="Changing sides" note={`${career.switchers.switched} MPs now sit for a different party from the one they belonged to before, and ${career.switchers.nowIndependent} sit as independents having left one. A spell as an independent that ended back in the same party isn't counted.`}>
                  <Switches switchers={career.switchers} />
                </Tile>

                <Tile span="s5" edge="change" title="Persistence" delay={0.05} note="Parliament records the elections each MP contested without winning.">
                  <Figure value={career.persistence.lostBeforePct} format={(n) => pct0(n)} label="lost at least one election first" note={`${career.persistence.lostBefore} of ${career.total} current MPs`} size={42} />
                  <div style={{ marginTop: 16, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.7 }}>
                    {career.persistence.mostLost.map((m) => (
                      <div key={m.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${COLORS.hairline}`, padding: "6px 0" }}>
                        <span>{m.name}</span>
                        <span><strong style={{ ...numeric }}>{m.times}</strong> <span style={{ color: COLORS.inkSoft }}>defeats before winning</span></span>
                      </div>
                    ))}
                    {career.mostElected[0] && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${COLORS.hairline}`, padding: "6px 0" }}>
                        <span>{career.mostElected[0].name}</span>
                        <span><strong style={{ ...numeric }}>{career.mostElected[0].times}</strong> <span style={{ color: COLORS.inkSoft }}>elections won, the most</span></span>
                      </div>
                    )}
                  </div>
                </Tile>
              </>
            )}

            {summary && (
              <>
                <Tile span="s7" edge="seats" title="How safe are the seats?" note={`The winner's lead in each of ${fmt(summary.total)} seats at the last election. A small lead means a seat could change hands; a big one almost never does.`}>
                  <SafetyHistogram summary={summary} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}` }}>
                    <Figure value={summary.wonWithUnderHalf} format={(n) => fmt(Math.round(n))} label="MPs won with under half the vote" size={32} />
                    <Figure value={summary.changedHandsAtGeneralElection} format={(n) => fmt(Math.round(n))} label="seats changed party in 2024" size={32} />
                    <Figure value={summary.turnout.median} format={(n) => pct1(n)} label="median turnout" size={32} />
                  </div>
                </Tile>
                <Tile span="s5" edge="seats" title="Closest and biggest" delay={0.05} note="Ranked by the winner's lead as a share of votes cast. Tap a seat to see its full result.">
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <SeatList title="Closest results" seats={summary.narrowest.slice(0, 5)} />
                    <SeatList title="Biggest majorities" seats={summary.biggest.slice(0, 5)} />
                  </div>
                </Tile>
              </>
            )}

            <Tile span="s5" edge="change" title="Seats that changed hands" note="Elections held since the general election, to fill seats that fell vacant.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px" }}>
                <Figure value={stats.byElections.total} format={(n) => fmt(Math.round(n))} label={`by-election${stats.byElections.total === 1 ? "" : "s"}`} size={34} />
                <Figure value={stats.byElections.gains} format={(n) => fmt(Math.round(n))} label="changed hands" note={`${fmt(stats.byElections.holds)} held`} size={34} />
              </div>
              {onNavigate && (
                <button type="button" onClick={() => onNavigate("byElections")} style={{ marginTop: 14, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                  See each by-election →
                </button>
              )}
            </Tile>

            <Tile span="s7" edge="people" title="What isn't here, and why" delay={0.05}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.7, color: COLORS.inkSoft, margin: 0 }}>
                Parliament's official records for MPs cover name, party, gender, constituency, elections, posts and committees, but not ethnicity, age or education. Without
                an official source, this page won't guess at people's identities. The House of Commons Library publishes research on the make-up of the Commons, drawing
                on its own surveys:{" "}
                <a href="https://commonslibrary.parliament.uk/" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>commonslibrary.parliament.uk ↗</a>
              </p>
            </Tile>
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 22 }}>
            Sources: Parliament's Members API (current Commons members, their biographies and the 2024 election results) and the by-elections record on this site. The
            Speaker is counted as an MP but listed under their own heading rather than a party. Figures change whenever an MP is elected, resigns or changes party.
            {stats.longest && ` The longest-serving ${stats.longest.names.length > 1 ? "are" : "is"} ${joinNames(stats.longest.names)}, at ${Math.floor(stats.longest.years)} years.`}
          </p>
        </div>
      )}
    </div>
  );
}
