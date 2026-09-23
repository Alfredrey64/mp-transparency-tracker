import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { formatDate, partyColour } from "../lib/format";
import { IconGavel, IconSearch } from "./icons";
import STANDARDS_REPORT_DETAILS from "../data/standardsReportDetails.json";

function classifyOutcome(detail) {
  if (!detail) return null;
  const s = detail.sanction.toLowerCase();
  if (s.includes("resigned") || s.includes("stood down") || s.includes("by-election")) {
    return { label: "Resigned / Stood Down", color: "#9C3B3B" };
  }
  if (s.includes("recall petition") && s.includes("lost his seat")) {
    return { label: "Recalled", color: "#9C3B3B" };
  }
  if (s.includes("recall petition") && s.includes("succeeded")) {
    return { label: "Recalled", color: "#9C3B3B" };
  }
  if (s.includes("revoked")) {
    return { label: "Pass Revoked", color: "#9C3B3B" };
  }
  if (s.includes("suspen")) {
    return { label: "Suspended", color: "#B5533C" };
  }
  if (s.includes("no sanction") || s.includes("no further sanction")) {
    return { label: "No Sanction", color: "#4C7A6B" };
  }
  if (s.includes("apolog") || s.includes("briefing")) {
    return { label: "Apology Required", color: "#8A6D1F" };
  }
  return { label: "Committee Finding", color: COLORS.inkSoft };
}

function OutcomeBadge({ outcome }) {
  if (!outcome) return null;
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: outcome.color,
        background: `${outcome.color}1A`,
        border: `1px solid ${outcome.color}33`,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {outcome.label}
    </span>
  );
}

function StatCard({ value, label, color, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
      style={{
        flex: "1 1 130px",
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 12,
        padding: "14px 16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>{label}</div>
    </motion.div>
  );
}

function ReportCard({ report, politician, onSelectPolitician, index }) {
  const color = politician ? partyColour(politician.party_colour, COLORS.inkSoft) : COLORS.inkSoft;
  const clickable = Boolean(politician);
  const detail = STANDARDS_REPORT_DETAILS[String(report.id)];
  const outcome = classifyOutcome(detail);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.02 }}
      whileHover={{ y: -2, boxShadow: "0 10px 24px rgba(30,42,68,0.10)" }}
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 4px rgba(30,42,68,0.04)",
      }}
    >
      {politician?.thumbnail_url ? (
        <img
          src={politician.thumbnail_url}
          alt=""
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", objectFit: "cover", background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}
        />
      ) : (
        <div
          style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: `${color}22`, color, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600,
          }}
        >
          {report.extracted_name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <button
              onClick={clickable ? () => onSelectPolitician(politician) : undefined}
              style={{
                background: "none", border: "none", padding: 0, cursor: clickable ? "pointer" : "default",
                fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, textAlign: "left",
                textDecoration: clickable ? "underline" : "none", textDecorationColor: `${color}55`,
              }}
            >
              {report.extracted_name}
            </button>
            <OutcomeBadge outcome={outcome} />
          </div>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, flexShrink: 0 }}>{formatDate(report.publication_date)}</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 6 }}>
          {politician ? (
            <>{politician.party} · currently sitting</>
          ) : (
            "No longer a current MP — this Parliament, or since left office"
          )}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, opacity: 0.7, marginBottom: 10 }}>{report.title}</div>

        {detail ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 12,
              background: COLORS.paper,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: "#9C3B3B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                What happened
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55 }}>{detail.offence}</div>
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 9 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: outcome?.color ?? color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                The outcome
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55 }}>{detail.sanction}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, fontStyle: "italic", marginBottom: 12 }}>
            See the Committee's full report below for what was found and what followed.
          </div>
        )}

        <a href={report.report_url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.brass }}>
          Read the Committee's report ↗
        </a>
      </div>
    </motion.div>
  );
}

function YearHeading({ year, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 4px" }}>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink }}>{year}</span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "2px 10px" }}>
        {count} {count === 1 ? "report" : "reports"}
      </span>
      <div style={{ flex: 1, height: 1, background: COLORS.hairline }} />
    </div>
  );
}

export default function StandardsReports({ onSelectPolitician }) {
  const [reports, setReports] = useState(null);
  const [politicians, setPoliticians] = useState([]);
  const [query, setQuery] = useState("");
  const [currentOnly, setCurrentOnly] = useState(false);

  useEffect(() => {
    supabase
      .from("standards_reports")
      .select("*")
      .order("publication_date", { ascending: false })
      .then(({ data }) => setReports(data ?? []));
    supabase.from("politicians").select("*").then(({ data }) => setPoliticians(data ?? []));
  }, []);

  const politicianById = useMemo(() => new Map(politicians.map((p) => [p.id, p])), [politicians]);

  const stats = useMemo(() => {
    if (!reports) return null;
    let suspended = 0;
    let resigned = 0;
    let mostRecentYear = null;
    reports.forEach((r) => {
      const detail = STANDARDS_REPORT_DETAILS[String(r.id)];
      const outcome = classifyOutcome(detail);
      if (outcome?.label === "Suspended") suspended += 1;
      if (outcome?.label === "Resigned / Stood Down" || outcome?.label === "Recalled") resigned += 1;
      const y = r.publication_date ? new Date(r.publication_date).getFullYear() : null;
      if (y && (mostRecentYear === null || y > mostRecentYear)) mostRecentYear = y;
    });
    return { total: reports.length, suspended, resigned, mostRecentYear };
  }, [reports]);

  const filtered = useMemo(() => {
    if (!reports) return [];
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (currentOnly && !r.is_current_mp) return false;
      if (q && !`${r.extracted_name} ${r.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reports, query, currentOnly]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const y = r.publication_date ? new Date(r.publication_date).getFullYear() : "Undated";
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(r);
    });
    return Array.from(map.entries()).sort((a, b) => (b[0] === "Undated" ? -1 : a[0] === "Undated" ? 1 : b[0] - a[0]));
  }, [filtered]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconGavel}
        kicker="Public Record · Standards & Sanctions"
        title="When the standards system names an MP"
        subtitle="Every report the Commons Committee on Standards has published about a named MP's individual conduct — as distinct from the committee's separate work reviewing the rules themselves."
      />

      {stats && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24, marginBottom: 20 }}>
          <StatCard value={stats.total} label="Reports on record" color={COLORS.brass} index={0} />
          <StatCard value={stats.suspended} label="Ended in suspension" color="#B5533C" index={1} />
          <StatCard value={stats.resigned} label="Resigned or recalled" color="#9C3B3B" index={2} />
          <StatCard value={stats.mostRecentYear ?? "—"} label="Most recent report" color="#4C7A6B" index={3} />
        </div>
      )}

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
          marginBottom: 24, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        This isn't every allegation or every investigation — most complaints to the Parliamentary Commissioner for
        Standards are resolved informally and never become a public report. This is specifically the committee's
        formal, published findings, which only happen for the more serious cases. A report appearing here is a
        matter of public record, not an accusation from this site.
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
            <IconSearch size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by MP name…"
            style={{
              width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
              border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
            }}
          />
        </div>

        <div style={{ display: "inline-flex", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 3 }}>
          {[
            { key: false, label: "All reports" },
            { key: true, label: "Current MPs only" },
          ].map((opt) => (
            <button
              key={String(opt.key)}
              onClick={() => setCurrentOnly(opt.key)}
              style={{
                position: "relative", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "7px 15px", borderRadius: 999,
                border: "none", background: "transparent", color: currentOnly === opt.key ? "#fff" : COLORS.inkSoft, cursor: "pointer", zIndex: 1,
              }}
            >
              {currentOnly === opt.key && (
                <motion.div
                  layoutId="standardsToggle"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  style={{ position: "absolute", inset: 0, background: COLORS.ink, borderRadius: 999, zIndex: -1 }}
                />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {reports === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
      {reports !== null && reports.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No data yet — check back after the next daily update.</div>
      )}
      {reports !== null && reports.length > 0 && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No matches.</div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={`${query}-${currentOnly}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {grouped.map(([year, yearReports]) => (
            <div key={year} style={{ marginBottom: 22 }}>
              <YearHeading year={year} count={yearReports.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {yearReports.map((r, i) => (
                  <ReportCard key={r.id} report={r} politician={politicianById.get(r.politician_id)} onSelectPolitician={onSelectPolitician} index={i} />
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
