import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { computeParliamentStats, GENERAL_ELECTION_2024 } from "../lib/parliamentStats";
import { computeCareerStats, cohortKey, ELECTED_BANDS } from "../lib/careerStats";
import { PageHeader, LoadFailedNote } from "./shared";
import { PartyHemicycle } from "./PartyHemicycle";
import { IconChartBars } from "./icons";
import BarRow from "./BarRow";
import CountUp from "./CountUp";
import Reveal from "./Reveal";
import MembersModal from "./MembersModal";
import DownloadCsvButton from "./DownloadCsvButton";
import { SEATS_COLUMNS } from "../lib/exportColumns";

const fmt = (n) => n.toLocaleString("en-GB");
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const pct0 = (n) => `${Math.round(n)}%`;
const joinNames = (n) => (n.length <= 2 ? n.join(" and ") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);
const family = (n) => String(n ?? "").replace(/\s*\(Co-op\)\s*$/i, "").trim();
const surname = (n) => String(n ?? "").trim().split(/\s+/).pop().toLowerCase();
const byName = (a, b) => surname(a.name).localeCompare(surname(b.name)) || a.name.localeCompare(b.name);
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const leadText = (pct) => `${pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}% lead`;
const goMp = (id) => {
  window.location.hash = `#/mp/${id}`;
};
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

function Figure({ value, format, label, note, size = 38, onOpen }) {
  const body = (
    <>
      <div style={{ ...numeric, fontSize: size, fontWeight: 600, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.02em" }}>
        <CountUp value={value} format={format} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{label}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 1, lineHeight: 1.45 }}>{note}</div>}
      {onOpen && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.accent, marginTop: 4 }}>See who ›</div>}
    </>
  );
  if (!onOpen) return <div>{body}</div>;
  return (
    <button type="button" className="nclick" onClick={onOpen} style={{ display: "block", textAlign: "left", background: "none", border: "none", padding: "6px 8px", margin: "-6px -8px", color: "inherit" }}>
      {body}
    </button>
  );
}

// ---- Seats by party, on one scale ----------------------------------------
// Every bar is drawn against the same 0 to 650 axis, labelled, with the
// majority line on it. Parties with only a seat or two are grouped, so the
// chart is about the parties that decide votes.

const COLUMNS = "minmax(120px, 190px) minmax(0, 1fr) 118px";

function SeatsChart({ stats, onOpen }) {
  const reduce = useReducedMotion();
  const total = stats.total;
  const major = stats.majorityLine;
  const big = stats.seatsByParty.filter((r) => r.count >= 3);
  const small = stats.seatsByParty.filter((r) => r.count < 3);
  const rows = [
    ...big.map((r) => ({ parties: [r.party], key: r.party, label: r.coop ? `${r.party} (incl. Co-op)` : r.party, colour: partyColour(r.colour, COLORS.inkSoft), count: r.count, pct: r.pct, title: null })),
    ...(small.length ? [{ parties: small.map((r) => r.party), key: "others", label: `${small.length} smaller parties`, colour: COLORS.inkSoft, count: small.reduce((n, r) => n + r.count, 0), pct: (small.reduce((n, r) => n + r.count, 0) / total) * 100, title: small.map((r) => `${r.party} ${r.count}`).join(", ") }] : []),
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
        <div
          key={r.key}
          role="button"
          tabIndex={0}
          className="nclick"
          aria-label={`${r.label}: ${r.count} seats. See the MPs`}
          onClick={(e) => onOpen(r, e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(r, e);
            }
          }}
          title={r.title ?? `${r.label}: ${r.count} seats`}
          style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 12, alignItems: "center", padding: "5px 0" }}
        >
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
function CohortChart({ cohorts, onOpen }) {
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
            <button type="button" key={c.key} className="nclick" onClick={(e) => onOpen(c, e)} aria-label={`${c.label}: ${c.count} MPs. See the MPs`} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0, background: "none", border: "none", padding: "4px 0 6px", color: "inherit" }}>
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
            </button>
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
function SafetyHistogram({ summary, onOpen }) {
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
          <button type="button" key={h.from} className="nclick" onClick={(e) => onOpen(h, e)} aria-label={`${h.to == null ? `${h.from}% or more` : `${h.from} to ${h.to}%`} majority: ${h.count} seats. See the MPs`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", alignItems: "center", background: "none", border: "none", padding: 0, color: "inherit" }} title={`${h.to == null ? `${h.from}% or more` : `${h.from}–${h.to}%`}: ${h.count} seats`}>
            <div style={{ ...numeric, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, marginBottom: 3 }}>{h.count}</div>
            <motion.div
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${(h.count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", minHeight: h.count ? 3 : 0, background: COLORS.accent, opacity: shade[band(h.from)], borderRadius: "5px 5px 0 0" }}
            />
          </button>
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
            {s.majorityPct != null && <span style={{ display: "block", ...numeric, fontSize: 11, color: COLORS.inkSoft }}>{leadText(s.majorityPct)}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---- Careers ---------------------------------------------------------------
function TermsBands({ bands, total, average, onOpen }) {
  const max = Math.max(1, ...bands.map((b) => b.count));
  return (
    <div>
      {bands.map((b, i) => (
        <BarRow key={b.key} label={b.label} color={COLORS.accent} fraction={b.count / max} valueText={fmt(b.count)} detail={pct0((b.count / total) * 100)} labelWidth={120} valueWidth={96} delay={i * 0.05} onClick={(e) => onOpen(b, e)} />
      ))}
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 8 }}>
        On average, MPs have won <strong style={{ ...numeric, color: COLORS.ink }}>{(Math.round(average * 10) / 10).toFixed(1)}</strong> elections, including by-elections.
      </div>
    </div>
  );
}

function Switches({ switchers, onOpen }) {
  if (switchers.transitions.length === 0) return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No party changes recorded among current MPs.</div>;
  const max = Math.max(1, ...switchers.transitions.map((t) => t.count));
  return (
    <div>
      {switchers.transitions.map((t, i) => (
        <button type="button" className="nclick" onClick={(e) => onOpen(t, e)} key={`${t.from}-${t.to}`} title={t.names.join(", ")} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 90px", gap: 12, alignItems: "center", padding: "7px 4px", width: "100%", textAlign: "left", background: "none", color: "inherit", border: "none", borderRadius: 0, borderTop: i === 0 ? "none" : `1px solid ${COLORS.hairline}` }}>
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
        </button>
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
  // The pop-up list of MPs behind a figure the visitor tapped.
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    supabase
      .from("politicians")
      .select("id, name, party, party_colour, gender, membership_start_date, parliament_member_id, constituency, thumbnail_url")
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
  const sinn = stats?.seatsByParty.find((r) => r.party === "Sinn Féin");

  // Every MP as a flat record, with their career facts when those have
  // loaded, so any figure on the page can be turned into "who is this?".
  const members = useMemo(
    () =>
      (rows ?? []).map((p) => ({
        id: p.id,
        mid: p.parliament_member_id,
        name: p.name,
        party: p.party,
        colour: p.party_colour,
        constituency: p.constituency,
        thumbnail: p.thumbnail_url,
        gender: p.gender,
        start: p.membership_start_date,
        c: careers?.mps?.[p.parliament_member_id] ?? null,
      })),
    [rows, careers]
  );
  const partyOf = (m) => family(m.party) || "Unknown";

  // Opens the list for whichever MPs `pick` selects. The clicked element is
  // passed on so focus goes back to it when the pop-up closes.
  function see(e, title, note, pick, { sort = byName, badge } = {}) {
    setPanel({ title, note, list: members.filter(pick).sort(sort), badge, opener: e?.currentTarget ?? null });
  }

  // The same, for figures about seats (the 2024 result), which come from the
  // constituency file: loaded the first time one is tapped.
  async function seeSeats(e, title, note, pick) {
    const opener = e?.currentTarget ?? null;
    const m = await import("../data/constituencies.json");
    const seatOf = new Map(Object.values(m.default.constituencies).filter((s) => s.result && pick(s)).map((s) => [s.mp?.memberId, s]));
    const list = members.filter((x) => seatOf.has(x.mid)).sort((a, b) => seatOf.get(a.mid).result.majorityPct - seatOf.get(b.mid).result.majorityPct);
    setPanel({ title, note, list, opener, badge: (x) => leadText(seatOf.get(x.mid).result.majorityPct) });
  }
  const goMember = (memberId) => {
    const id = members.find((x) => x.mid === memberId)?.id;
    if (id != null) goMp(id);
  };
  const ids = (list) => new Set(list);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconChartBars}
        kicker="Public Record · Parliament in Numbers"
        title="The House of Commons, by the numbers"
        subtitle="Who sits in the Commons right now, where they came from, and how safe their seats are. All worked out from live parliamentary records."
      />

      {rows !== null && !failed && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "14px 0 0" }}>
          <strong style={{ color: COLORS.accent }}>Tap any bar, party or figure marked “See who”</strong> to list the MPs behind it. Each name opens that MP's profile.
        </p>
      )}

      {rows === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {rows !== null && failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the list of MPs" /></div>}

      {stats && !failed && stats.total > 0 && (
        <div className="bento" style={{ marginTop: 26 }}>
          <div className="bento-grid">
            <Tile span="s8" edge="people" title="The chamber" note={`${labour ? `Labour holds ${fmt(labour.count)} of the seats (${pct1(labour.pct)}). ` : ""}${stats.majorityLine} are enough to win any vote outright.`}>
              <PartyHemicycle
                politicians={rows}
                legendCount={6}
                onSelectParty={(name, e) => see(e, name, "Every MP currently sitting for this party.", (m) => (m.party ?? "Independent") === name)}
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
                <Figure value={stats.womenPct} format={(n) => pct1(n)} label="are women" note={`${fmt(stats.women)} of ${fmt(stats.total)}`} onOpen={(e) => see(e, "Women in the Commons", "Every woman currently sitting as an MP.", (m) => m.gender === "F")} />
                <Figure value={stats.newMps} format={(n) => fmt(Math.round(n))} label="new since July 2024" note="Including by-election winners" onOpen={(e) => see(e, "New MPs since July 2024", "Elected at the 2024 general election or a by-election since.", (m) => m.start && m.start >= GENERAL_ELECTION_2024, { sort: (a, b) => byName(a, b), badge: (m) => `Since ${formatDate(m.start)}` })} />
                <Figure value={stats.medianTenure} format={(n) => `${(Math.round(n * 10) / 10).toFixed(1)} yrs`} label="typical time as an MP" note={`The median: half have served less. The average is ${(Math.round(stats.averageTenure * 10) / 10).toFixed(1)} years.`} onOpen={(e) => see(e, "Every MP, longest-serving first", "Time since their current run in the Commons began.", (m) => m.start, { sort: (a, b) => String(a.start).localeCompare(String(b.start)), badge: (m) => `${Math.floor((Date.now() - new Date(m.start).getTime()) / YEAR_MS)} yrs` })} />
              </div>
            </Tile>

            <Tile span="s7" edge="seats" title="Seats by party" note={`Every bar is on the same 0 to 650 scale. The dashed line marks ${stats.majorityLine} seats, more than half the House.${sinn ? ` Sinn Féin's ${sinn.count} MPs don't take their seats, so in practice slightly fewer votes are needed.` : ""}`}>
              <SeatsChart
                stats={stats}
                onOpen={(r, e) => see(e, r.key === "others" ? "The smaller parties" : r.label, r.key === "others" ? "MPs from parties with only one or two seats." : "Every MP currently sitting for this party.", (m) => r.parties.includes(partyOf(m)))}
              />
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
                  <BarRow key={r.party} label={r.party} color={COLORS.accent} fraction={r.womenPct / 100} valueText={pct0(r.womenPct)} detail={`${r.women}/${r.count}`} labelWidth={130} valueWidth={96} delay={i * 0.04} onClick={(e) => see(e, `Women MPs: ${r.party}`, "The women currently sitting for this party.", (m) => m.gender === "F" && partyOf(m) === r.party)} />
                ))}
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each party who are women (the five largest to rank).</div>
              </div>
            </Tile>

            {career && (
              <>
                <Tile span="s12" edge="careers" title="Who arrived when" note={`MPs grouped by the general election they first came in on, so by-election winners sit with the intake before them.${career.cohorts.find((c) => c.key === 2024) ? ` The 2024 intake is ${pct0((career.cohorts.find((c) => c.key === 2024).count / career.total) * 100)} of the House.` : ""}`}>
                  <CohortChart
                    cohorts={career.cohorts}
                    onOpen={(c, e) => see(e, c.label === "Before 1997" ? "MPs first elected before 1997" : c.key === 2024 ? "The 2024 intake and since" : `The ${c.key} intake`, "Grouped by the general election they first came in on.", (m) => m.c && cohortKey(m.c[0]) === c.key, { badge: (m) => `First elected ${m.c[0]}` })}
                  />
                </Tile>

                <Tile span="s5" edge="careers" title="How many elections they have won" note="Each win is one term, by-elections included. A first-term MP has won once.">
                  <TermsBands
                    bands={career.electedBands}
                    total={career.total}
                    average={career.averageElected}
                    onOpen={(b, e) => {
                      const test = ELECTED_BANDS.find((x) => x.key === b.key).test;
                      see(e, b.label, "Elections each MP has won, by-elections included.", (m) => m.c && test(m.c[1]), { sort: (x, y) => y.c[1] - x.c[1] || byName(x, y), badge: (m) => `${m.c[1]} won` });
                    }}
                  />
                </Tile>

                <Tile span="s7" edge="careers" title="Who has held office" delay={0.05} note="Ministers are MPs given a government job. Shadow ministers do the same job for the opposition. Counts include any past Parliament.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px", marginBottom: 14 }}>
                    <Figure value={career.government.everMinister} format={(n) => fmt(Math.round(n))} label="have been ministers" note={`${pct0(career.government.everMinisterPct)} of MPs`} size={32} onOpen={(e) => see(e, "MPs who have been ministers", "Anyone who has held a government post, now or in a past Parliament.", (m) => m.c && m.c[2] > 0, { sort: (a, b) => b.c[2] - a.c[2] || byName(a, b), badge: (m) => `${m.c[2]} post${m.c[2] === 1 ? "" : "s"}` })} />
                    <Figure value={career.government.inGovernmentNow} format={(n) => fmt(Math.round(n))} label="are in government now" size={32} onOpen={(e) => see(e, "MPs in government now", "Currently holding a government post.", (m) => m.c && m.c[3] === 1)} />
                    <Figure value={career.government.shadowEver} format={(n) => fmt(Math.round(n))} label="have been shadow ministers" size={32} onOpen={(e) => see(e, "MPs who have been shadow ministers", "Have held a post in an opposition front bench team.", (m) => m.c && m.c[4] > 0, { sort: (a, b) => b.c[4] - a.c[4] || byName(a, b), badge: (m) => `${m.c[4]} post${m.c[4] === 1 ? "" : "s"}` })} />
                  </div>
                  {career.government.byParty.slice(0, 5).map((r, i) => (
                    <BarRow key={r.party} label={r.party} color={partyColour(r.colour, COLORS.inkSoft)} fraction={r.pct / 100} valueText={pct0(r.pct)} detail={`${r.everMinister}/${r.count}`} labelWidth={150} valueWidth={110} delay={i * 0.04} onClick={(e) => see(e, `${r.party} ministers`, "Have held a government post, now or before.", (m) => m.c && m.c[2] > 0 && partyOf(m) === r.party, { sort: (a, b) => b.c[2] - a.c[2] || byName(a, b), badge: (m) => `${m.c[2]} post${m.c[2] === 1 ? "" : "s"}` })} />
                  ))}
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each party's MPs who have ever held a government post.</div>
                </Tile>

                <Tile span="s7" edge="change" title="Changing sides" note={`${career.switchers.switched} MPs now sit for a different party from the one they belonged to before, and ${career.switchers.nowIndependent} sit as independents having left one. A spell as an independent that ended back in the same party isn't counted.`}>
                  <Switches
                    switchers={career.switchers}
                    onOpen={(t, e) => {
                      const set = ids(t.memberIds);
                      see(e, `${t.from} → ${t.to}`, "Current MPs who left one party and now sit with another, or as an independent.", (m) => set.has(m.mid));
                    }}
                  />
                </Tile>

                <Tile span="s5" edge="change" title="Lost before they won" delay={0.05} note="Parliament records the elections each MP stood in without winning. Many of today's MPs tried and failed before getting in.">
                  <Figure value={career.persistence.lostBeforePct} format={(n) => pct0(n)} label="lost at least one election first" note={`${career.persistence.lostBefore} of ${career.total} current MPs`} size={42} onOpen={(e) => see(e, "MPs who lost an election before winning one", "Counted from the elections each MP contested without winning.", (m) => m.c && m.c[7] > 0, { sort: (a, b) => b.c[7] - a.c[7] || byName(a, b), badge: (m) => `${m.c[7]} defeat${m.c[7] === 1 ? "" : "s"}` })} />
                  <div style={{ marginTop: 16, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.7 }}>
                    {career.persistence.mostLost.map((m) => (
                      <button type="button" className="nclick" onClick={() => goMember(m.memberId)} key={m.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "6px 4px", font: "inherit", color: "inherit" }}>
                        <span>{m.name}</span>
                        <span><strong style={{ ...numeric }}>{m.times}</strong> <span style={{ color: COLORS.inkSoft }}>defeats before winning</span></span>
                      </button>
                    ))}
                    {career.mostElected[0] && (
                      <button type="button" className="nclick" onClick={() => goMember(career.mostElected[0].memberId)} style={{ display: "flex", justifyContent: "space-between", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "6px 4px", font: "inherit", color: "inherit" }}>
                        <span>{career.mostElected[0].name}</span>
                        <span><strong style={{ ...numeric }}>{career.mostElected[0].times}</strong> <span style={{ color: COLORS.inkSoft }}>elections won, the most</span></span>
                      </button>
                    )}
                  </div>
                </Tile>
              </>
            )}

            {summary && (
              <>
                <Tile span="s7" edge="seats" title="How safe are the seats?" note={`The winner's lead in each of ${fmt(summary.total)} seats at the last election. A small lead means a seat could change hands; a big one almost never does.`}>
                  <SafetyHistogram
                    summary={summary}
                    onOpen={(h, e) => seeSeats(e, h.to == null ? `Winning by ${h.from}% or more` : `Winning by ${h.from} to ${h.to}%`, "MPs whose lead over the runner-up, as a share of votes cast, falls in this range. Smallest lead first.", (s) => s.result.majorityPct >= h.from && (h.to == null || s.result.majorityPct < h.to))}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}` }}>
                    <Figure value={summary.wonWithUnderHalf} format={(n) => fmt(Math.round(n))} label="MPs won with under half the vote" size={32} onOpen={(e) => seeSeats(e, "MPs elected on under half the vote", "Smallest lead first.", (s) => typeof s.result.candidates?.[0]?.share === "number" && s.result.candidates[0].share < 0.5)} />
                    <Figure value={summary.changedHandsAtGeneralElection} format={(n) => fmt(Math.round(n))} label="seats changed party in 2024" size={32} onOpen={(e) => seeSeats(e, "Seats that changed party in 2024", "A party took the seat from another at the general election. Smallest lead first.", (s) => s.result.isGeneralElection && /gain/i.test(s.result.outcome ?? ""))} />
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
      {panel && <MembersModal title={panel.title} note={panel.note} members={panel.list} badge={panel.badge} returnFocusTo={panel.opener} onClose={() => setPanel(null)} />}
    </div>
  );
}
