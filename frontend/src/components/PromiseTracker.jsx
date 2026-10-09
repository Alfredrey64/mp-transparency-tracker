import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { withScrollPreserved } from "../lib/preserveScroll";
import { GlossaryTerm } from "./GlossaryTerm";
import { STATUS, CATEGORIES, LAST_CHECKED, SOURCE_URL } from "../data/promises";

// Sourced from Full Fact's independent, non-partisan Government Tracker
// (fullfact.org/government-tracker), which assesses Labour's 2024 manifesto
// pledges plus later commitments. We didn't judge these ourselves — Full
// Fact did, and we're citing their verdicts as of when we last checked. This
// is a curated ~30-pledge subset of their ~94 tracked pledges, chosen to
// span every major policy area rather than cherry-pick a flattering sample.
const LABOUR_RED = "#C8102E";

// An original rose-bloom motif — a rounded cluster of overlapping petals with
// a spiral swirl (the detail that actually reads as "rose" rather than a
// generic flower), plus a stem and leaf. Evokes Labour's long-standing use of
// the rose as a party symbol without reproducing their actual trademarked
// logo artwork, which we deliberately avoid using anywhere in this app.
function RoseEmblem({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 21.5c-1 3-0.6 6.2 1.4 8.7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      <path d="M17 25.5c2-1.1 4-0.3 4.3 1.6c-2.2 0.9-4.2 0-4.3-1.6Z" fill="#fff" opacity="0.7" />
      <circle cx="12.8" cy="13.8" r="5.6" fill="#fff" opacity="0.55" />
      <circle cx="19.2" cy="13.8" r="5.6" fill="#fff" opacity="0.55" />
      <circle cx="16" cy="10" r="5.6" fill="#fff" opacity="0.55" />
      <circle cx="16" cy="15.5" r="6.4" fill="#fff" opacity="0.6" />
      <path
        d="M16,17.5 C19,17 19.6,13.5 17,12 C15,10.9 12.6,12.4 13,14.7 C13.3,16.4 15.2,17.3 16.1,16.1 C16.8,15.2 16.1,13.8 14.9,14"
        stroke={LABOUR_RED} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.9"
      />
    </svg>
  );
}

const TOTAL_PLEDGES = CATEGORIES.reduce((sum, c) => sum + c.pledges.length, 0);
const OVERALL = [
  { key: "achieved", count: 23 },
  { key: "on_track", count: 18 },
  { key: "in_progress", count: 21 },
  { key: "wait_see", count: 14 },
  { key: "off_track", count: 8 },
  { key: "not_kept", count: 6 },
  { key: "disputed", count: 4 },
];
const OVERALL_TOTAL = 94;

function StatusIcon({ icon, color, size = 15 }) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" fill={`${color}17`} />
      {icon === "check" && <path d="M6 10.2 8.7 13 14 7.5" {...stroke} />}
      {icon === "cross" && <path d="M7 7l6 6M13 7l-6 6" {...stroke} />}
      {icon === "clock" && <><circle cx="10" cy="10" r="4.3" {...stroke} /><path d="M10 7.7v2.5l1.8 1.2" {...stroke} /></>}
      {icon === "warning" && <path d="M10 6.5v4.2M10 13.2v.1M4.5 15h11L10 5.2 4.5 15Z" {...stroke} />}
      {icon === "question" && <><path d="M8 8c0-1.2 1-2 2-2s2 .8 2 1.8c0 1.4-2 1.6-2 3.2" {...stroke} /><circle cx="10" cy="14" r="0.7" fill={color} /></>}
    </svg>
  );
}

function HeroStat({ label, count, color }) {
  return (
    <div style={{ flex: "1 1 120px", minWidth: 110, background: COLORS.paper, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color }}>{count}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: COLORS.inkSoft, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PledgeLine({ pledge }) {
  const [open, setOpen] = useState(false);
  const s = STATUS[pledge.status];
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
      <button
        onClick={() => withScrollPreserved(() => setOpen((v) => !v))}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 2px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <StatusIcon icon={s.icon} color={s.color} size={16} />
        <span
          style={{
            flex: 1, minWidth: 0, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {pledge.promise}
        </span>
        <span
          style={{
            flexShrink: 0, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.03em", padding: "2px 9px", borderRadius: 999, color: s.color, background: `${s.color}18`,
          }}
        >
          {s.label}
        </span>
        <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft }}>{open ? "▾" : "▸"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 2px 14px 26px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
              {pledge.reality}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Looked up live rather than hardcoded, so this stays correct automatically
// if the office changes hands — same "find by cabinet_role" approach used
// for the Commons seating chart's PM marker.
function usePrimeMinister() {
  const [pm, setPm] = useState(null);
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("politicians").select("name, thumbnail_url, cabinet_role");
      const found = (data ?? []).find((p) => (p.cabinet_role ?? "").toLowerCase().includes("prime minister"));
      setPm(found ?? null);
    }
    load();
  }, []);
  return pm;
}

export default function PromiseTracker() {
  const [activeFilter, setActiveFilter] = useState("all");
  const pm = usePrimeMinister();
  const [pmPhotoLoaded, setPmPhotoLoaded] = useState(false);

  const filteredCategories = useMemo(() => {
    if (activeFilter === "all") return CATEGORIES;
    return CATEGORIES.map((c) => ({ ...c, pledges: c.pledges.filter((p) => p.status === activeFilter) })).filter((c) => c.pledges.length > 0);
  }, [activeFilter]);

  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${COLORS.hairline}`,
        borderTop: `4px solid ${LABOUR_RED}`,
        borderRadius: 18,
        background: COLORS.paperCard,
        padding: "26px clamp(16px, 4vw, 28px) 28px",
      }}
    >
      {pm?.thumbnail_url && (
        <div
          style={{
            position: "absolute", top: 20, right: 20, width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paper,
            border: `1px solid ${COLORS.hairline}`,
          }}
          title={`${pm.name}, ${pm.cabinet_role}`}
        >
          <img
            src={pm.thumbnail_url}
            alt=""
            onLoad={() => setPmPhotoLoaded(true)}
            style={{
              width: 43, height: 43, borderRadius: "50%", objectFit: "cover", objectPosition: "center",
              opacity: pmPhotoLoaded ? 1 : 0, transition: "opacity 0.25s ease",
            }}
          />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center",
            justifyContent: "center", background: LABOUR_RED, boxShadow: `0 4px 14px ${LABOUR_RED}40`,
          }}
        >
          <RoseEmblem size={32} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: COLORS.ink, lineHeight: 1.15 }}>
            Labour Government
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 500, color: COLORS.inkSoft, marginTop: 3 }}>
            In office since July 2024
          </div>
        </div>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 18, marginBottom: 0, lineHeight: 1.65, maxWidth: 780 }}>
        As the sitting government, Labour's <GlossaryTerm term="Manifesto">manifesto</GlossaryTerm> pledges are the only ones that can be checked against real
        outcomes rather than promises. We don't make these calls ourselves: every status here comes from{" "}
        <a href={SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: LABOUR_RED, fontWeight: 600 }}>
          Full Fact's independent, non-partisan Government Tracker ↗
        </a>
        , which assesses all {OVERALL_TOTAL} pledges it tracks. This page shows a {TOTAL_PLEDGES}-pledge sample
        spanning every major policy area, last checked {LAST_CHECKED}.
      </p>

      {/* Hero stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
        {OVERALL.map((o) => (
          <HeroStat key={o.key} label={STATUS[o.key].label} count={o.count} color={STATUS[o.key].color} />
        ))}
      </div>
      <div style={{ height: 10, borderRadius: 999, overflow: "hidden", display: "flex", background: COLORS.paper, marginTop: 14 }}>
        {OVERALL.map((o) => (
          <div key={o.key} title={`${STATUS[o.key].label}: ${o.count}`} style={{ width: `${(o.count / OVERALL_TOTAL) * 100}%`, background: STATUS[o.key].color }} />
        ))}
      </div>

      {/* Filter by status */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
        <FilterPill active={activeFilter === "all"} color={COLORS.ink} onClick={() => withScrollPreserved(() => setActiveFilter("all"))}>
          All categories
        </FilterPill>
        {Object.entries(STATUS).map(([key, s]) => (
          <FilterPill key={key} active={activeFilter === key} color={s.color} onClick={() => withScrollPreserved(() => setActiveFilter(key))}>
            {s.label}
          </FilterPill>
        ))}
      </div>

      {/* Grouped pledges */}
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 24 }}>
        <AnimatePresence mode="popLayout">
          {filteredCategories.map((cat) => (
            <motion.div key={cat.name} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2, paddingBottom: 8, borderBottom: `2px solid ${COLORS.ink}` }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{cat.name}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
                  {cat.pledges.length} pledge{cat.pledges.length === 1 ? "" : "s"}
                </span>
              </div>
              <div>
                {cat.pledges.map((p) => (
                  <PledgeLine key={p.promise} pledge={p} />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredCategories.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
            No pledges in this sample match that status.
          </div>
        )}
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}`, lineHeight: 1.6 }}>
        This is a curated sample of the {OVERALL_TOTAL} pledges Full Fact tracks. See{" "}
        <a href={SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
          their full tracker ↗
        </a>{" "}
        for every pledge and their complete methodology. Ratings are Full Fact's own judgement, not ours, and can
        change as circumstances develop.
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999,
        border: `1px solid ${active ? color : COLORS.hairline}`, background: active ? `${color}18` : "transparent",
        color: active ? color : COLORS.inkSoft, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
