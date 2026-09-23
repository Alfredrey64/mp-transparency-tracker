import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { formatDate, partyColour, stripHtml } from "../lib/format";
import { IconQuestion, IconSearch } from "./icons";

const WINDOW_DAYS = 30;

function DepartmentDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = ["All", ...options];
  const label = value === "All" ? "All departments" : value;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.98 }}
        style={{
          width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink,
          padding: "8px 12px", borderRadius: 8, border: `1px solid ${open ? COLORS.brass : COLORS.hairline}`,
          background: COLORS.paper, cursor: "pointer", textAlign: "left",
          boxShadow: open ? `0 0 0 3px ${COLORS.brass}22` : "none", transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ display: "flex", flexShrink: 0, color: COLORS.inkSoft }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, transformOrigin: "top",
              background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
              boxShadow: "0 12px 28px rgba(30,42,68,0.16)", padding: 5, maxHeight: 280, overflowY: "auto",
            }}
          >
            {items.map((d) => {
              const active = d === value;
              return (
                <motion.button
                  key={d}
                  type="button"
                  onClick={() => {
                    onChange(d);
                    setOpen(false);
                  }}
                  whileHover={{ backgroundColor: `${COLORS.brass}14` }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", fontFamily: FONT_BODY, fontSize: 12.5,
                    fontWeight: active ? 700 : 500, color: active ? COLORS.brass : COLORS.ink,
                    padding: "8px 10px", borderRadius: 7, border: "none",
                    background: active ? `${COLORS.brass}14` : "transparent", cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {d === "All" ? "All departments" : d}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ url, name, color, size = 34 }) {
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        style={{
          flexShrink: 0, width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}22`, color, fontFamily: FONT_DISPLAY, fontSize: size * 0.34, fontWeight: 600,
        }}
      >
        {name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
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

function QuestionCard({ q, politicianById, onSelectPolitician, index }) {
  const color = partyColour(q.asking_member_party_colour, COLORS.inkSoft);
  const answered = Boolean(q.date_answered);
  const clickable = Boolean(q.politician_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.02 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${answered ? COLORS.brass : "#B08A3E"}`, borderRadius: 12, padding: "16px 18px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Avatar url={q.asking_member_thumbnail_url} name={q.asking_member_name} color={color} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <button
            onClick={clickable ? () => onSelectPolitician(politicianById.get(q.politician_id)) : undefined}
            style={{
              background: "none", border: "none", padding: 0, cursor: clickable ? "pointer" : "default",
              fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, textAlign: "left",
              textDecoration: clickable ? "underline" : "none", textDecorationColor: `${color}55`,
            }}
          >
            {q.asking_member_name ?? "Unknown member"}
          </button>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
            {q.asking_member_party ?? "—"} · {q.house}
          </div>
        </div>
        <span
          style={{
            flexShrink: 0, fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
            textTransform: "uppercase", letterSpacing: "0.03em",
            color: answered ? COLORS.brass : "#B08A3E", background: answered ? `${COLORS.brass}14` : "#B08A3E1a",
          }}
        >
          {answered ? "Answered" : "Awaiting answer"}
        </span>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
        To {q.answering_body_name ?? "the government"}{q.heading ? ` · ${q.heading}` : ""}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.5, marginBottom: answered ? 10 : 0 }}>
        {q.question_text}
      </div>
      {answered && q.answer_text && (
        <div style={{ background: COLORS.paper, borderRadius: 10, padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6 }}>
          {stripHtml(q.answer_text)}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
          Tabled {formatDate(q.date_tabled)}{answered ? ` · Answered ${formatDate(q.date_answered)}` : ""}
        </span>
        <a
          href={`https://questions-statements.parliament.uk/written-questions/detail/${q.date_tabled}/${q.uin}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: COLORS.brass }}
        >
          Full record ↗
        </a>
      </div>
    </motion.div>
  );
}

export default function WrittenQuestions({ onSelectPolitician }) {
  const [rows, setRows] = useState(null);
  const [politicians, setPoliticians] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [houseFilter, setHouseFilter] = useState("All");

  useEffect(() => {
    supabase
      .from("written_questions")
      .select("*")
      .order("date_tabled", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
    supabase.from("politicians").select("*").then(({ data }) => setPoliticians(data ?? []));
  }, []);

  const politicianById = useMemo(() => new Map(politicians.map((p) => [p.id, p])), [politicians]);

  const departments = useMemo(() => {
    if (!rows) return [];
    const counts = new Map();
    for (const r of rows) {
      if (!r.answering_body_name) continue;
      counts.set(r.answering_body_name, (counts.get(r.answering_body_name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name);
  }, [rows]);
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (houseFilter !== "All" && r.house !== houseFilter) return false;
      if (departmentFilter !== "All" && r.answering_body_name !== departmentFilter) return false;
      if (statusFilter === "Answered" && !r.date_answered) return false;
      if (statusFilter === "Awaiting" && r.date_answered) return false;
      if (q && !(`${r.asking_member_name} ${r.question_text} ${r.heading ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, query, houseFilter, departmentFilter, statusFilter]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconQuestion}
        kicker="Public Record · Written Questions"
        title="What MPs are actually asking ministers"
        subtitle={`Written questions tabled in either House over the last ${WINDOW_DAYS} days — one of the clearest day-to-day signals of what an MP is actually pressing government on, whether or not it ever makes the news.`}
      />

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
          marginTop: 24, marginBottom: 24, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        A rolling {WINDOW_DAYS}-day window, kept up to date daily — not a full historical archive, which runs into the
        hundreds of thousands of questions. Answers shown are the government's own words, unedited.
      </div>

      <div style={{ position: "relative", maxWidth: 460, marginBottom: 20 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by MP, department, or topic…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: "18px 28px", alignItems: "flex-end",
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 16px", marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
            House
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Commons", "Lords"].map((h) => (
              <button
                key={h}
                onClick={() => setHouseFilter(h)}
                style={{
                  fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 999,
                  border: `1px solid ${houseFilter === h ? COLORS.ink : COLORS.hairline}`,
                  background: houseFilter === h ? COLORS.ink : "transparent", color: houseFilter === h ? "#fff" : COLORS.inkSoft, cursor: "pointer",
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: 1, alignSelf: "stretch", background: COLORS.hairline, minHeight: 44 }} />

        <div>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
            Status
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Answered", "Awaiting"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 999,
                  border: `1px solid ${statusFilter === s ? COLORS.brass : COLORS.hairline}`,
                  background: statusFilter === s ? `${COLORS.brass}18` : "transparent", color: statusFilter === s ? COLORS.brass : COLORS.inkSoft, cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: 1, alignSelf: "stretch", background: COLORS.hairline, minHeight: 44 }} />

        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
            Department
          </div>
          <DepartmentDropdown value={departmentFilter} options={departments} onChange={setDepartmentFilter} />
        </div>
      </div>

      {rows === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
      {rows !== null && rows.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No data yet — check back after the next daily update.</div>
      )}
      {rows !== null && rows.length > 0 && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nothing matches those filters.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.slice(0, 100).map((q, i) => (
          <QuestionCard key={q.id} q={q} politicianById={politicianById} onSelectPolitician={onSelectPolitician} index={i} />
        ))}
      </div>
      {filtered.length > 100 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, textAlign: "center", marginTop: 16 }}>
          Showing the first 100 of {filtered.length} matches — narrow your search to see more specific results.
        </div>
      )}
    </div>
  );
}
