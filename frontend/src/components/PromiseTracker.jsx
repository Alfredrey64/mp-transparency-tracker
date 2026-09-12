import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";

// Sourced from Full Fact's independent, non-partisan Government Tracker
// (fullfact.org/government-tracker), which assesses Labour's 2024 manifesto
// pledges plus later commitments. We didn't judge these ourselves — Full
// Fact did, and we're citing their verdicts as of when we last checked. This
// is a curated ~30-pledge subset of their ~94 tracked pledges, chosen to
// span every major policy area rather than cherry-pick a flattering sample.
const LAST_CHECKED = "September 2026";
const SOURCE_URL = "https://fullfact.org/government-tracker/";
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

const STATUS = {
  achieved: { label: "Achieved", color: "#2F6F4E", icon: "check" },
  on_track: { label: "On track", color: "#0D8A7A", icon: "check" },
  in_progress: { label: "In progress", color: "#B08A2E", icon: "clock" },
  wait_see: { label: "Too early to tell", color: "#6B7280", icon: "clock" },
  off_track: { label: "Off track", color: "#C1622E", icon: "warning" },
  not_kept: { label: "Not kept", color: "#9C3B3B", icon: "cross" },
  disputed: { label: "Disputed", color: "#6B5B95", icon: "question" },
};

const CATEGORIES = [
  {
    name: "Economy & Tax",
    pledges: [
      {
        promise: "No tax rises on \"working people\" (income tax, NI, VAT)",
        status: "not_kept",
        reality: "Employer National Insurance was raised in the October 2024 Budget. Income tax and employee NI rates themselves haven't risen, and VAT wasn't raised — but Full Fact rates the broad promise as not kept overall.",
      },
      {
        promise: "Cap Corporation Tax at 25% for the parliament",
        status: "on_track",
        reality: "The rate has been held at 25% throughout.",
      },
      {
        promise: "Set up a National Wealth Fund capitalised with £7.3bn",
        status: "off_track",
        reality: "The fund itself was established and is investing, but its capital came in below the promised £7.3bn figure — Full Fact rates the funding pledge specifically as not kept.",
      },
      {
        promise: "Abolish non-dom tax status",
        status: "achieved",
        reality: "The regime was abolished and replaced with a new residence-based tax scheme, as promised.",
      },
      {
        promise: "One major fiscal event (Budget) per year",
        status: "on_track",
        reality: "The government has stuck to a single annual Budget so far, giving businesses the predictability promised.",
      },
    ],
  },
  {
    name: "Health & Social Care",
    pledges: [
      {
        promise: "40,000 additional NHS appointments every week",
        status: "achieved",
        reality: "Full Fact confirms this numerical target has been met.",
      },
      {
        promise: "Meet the NHS 18-week waiting time standard",
        status: "in_progress",
        reality: "Performance is improving gradually but the standard itself has not yet been met.",
      },
      {
        promise: "Double the number of NHS CT and MRI scanners",
        status: "off_track",
        reality: "New scanner capacity is being added, but slower than the pace originally promised.",
      },
      {
        promise: "700,000 more urgent dental appointments",
        status: "in_progress",
        reality: "Appointment slots are being added but the full total isn't reached yet.",
      },
      {
        promise: "A National Care Service for England",
        status: "wait_see",
        reality: "This is a long-term structural reform; an independent commission is still working through recommendations.",
      },
      {
        promise: "Recruit 8,500 additional mental health staff",
        status: "on_track",
        reality: "Recruitment is progressing against this target.",
      },
    ],
  },
  {
    name: "Immigration & Borders",
    pledges: [
      {
        promise: "Create a Border Security Command",
        status: "achieved",
        reality: "The command has been established with the promised counter-terror-style powers against smuggling gangs.",
      },
      {
        promise: "End the Rwanda removals partnership",
        status: "achieved",
        reality: "The scheme was cancelled, as promised, shortly after taking office.",
      },
      {
        promise: "Close hotels used to house asylum seekers",
        status: "off_track",
        reality: "The transition away from hotel accommodation is underway but well behind the pace needed, per Full Fact.",
      },
      {
        promise: "Add 1,000 returns-enforcement staff",
        status: "not_kept",
        reality: "Staffing levels for this specific pledge fell short of the target.",
      },
      {
        promise: "Reduce net migration",
        status: "on_track",
        reality: "Migration figures are on a declining trend, per the latest official statistics Full Fact reviewed.",
      },
    ],
  },
  {
    name: "Energy & Environment",
    pledges: [
      {
        promise: "Set up Great British Energy, a publicly-owned energy company",
        status: "achieved",
        reality: "The company has been legally established and is operational.",
      },
      {
        promise: "Capitalise Great British Energy with £8.3bn",
        status: "in_progress",
        reality: "Funding is being phased in over the parliament rather than delivered upfront.",
      },
      {
        promise: "No new North Sea oil and gas exploration licences",
        status: "on_track",
        reality: "The policy has been maintained since taking office.",
      },
      {
        promise: "Halve sewage pollution from water companies",
        status: "wait_see",
        reality: "This is a decade-long target — too early in the parliament for a meaningful assessment.",
      },
    ],
  },
  {
    name: "Housing",
    pledges: [
      {
        promise: "Build 1.5 million new homes in England",
        status: "off_track",
        reality: "Planning rules were reformed as promised, but actual housebuilding numbers are running behind the pace needed to hit the target.",
      },
      {
        promise: "Restore mandatory local housing targets",
        status: "achieved",
        reality: "The planning policy framework was updated to reinstate mandatory targets.",
      },
      {
        promise: "Abolish Section 21 \"no-fault\" evictions",
        status: "achieved",
        reality: "The relevant legislation has passed, banning this eviction method.",
      },
      {
        promise: "End rough sleeping",
        status: "wait_see",
        reality: "Programme is in its early stages; too soon for Full Fact to assess delivery.",
      },
    ],
  },
  {
    name: "Education",
    pledges: [
      {
        promise: "Add VAT and business rates to private school fees",
        status: "achieved",
        reality: "VAT and business rates relief were removed from private schools, with revenue earmarked for state education.",
      },
      {
        promise: "Recruit 6,500 new expert teachers",
        status: "on_track",
        reality: "Hiring is progressing toward this target.",
      },
      {
        promise: "Free breakfast clubs in every primary school",
        status: "in_progress",
        reality: "Rollout is underway but not yet universal.",
      },
    ],
  },
  {
    name: "Democracy & Constitution",
    pledges: [
      {
        promise: "Remove the right of hereditary peers to sit in the Lords",
        status: "achieved",
        reality: "Legislation removing this right has passed.",
      },
      {
        promise: "Votes at 16 for UK elections",
        status: "on_track",
        reality: "The legislative framework is being put in place.",
      },
      {
        promise: "No income tax rate increases",
        status: "disputed",
        reality: "Full Fact flags this as disputed — it depends on a technical reading of frozen thresholds versus headline rates, which different sides interpret differently.",
      },
    ],
  },
];

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
        onClick={() => setOpen((v) => !v)}
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
            flexShrink: 0, fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
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
        boxShadow: "0 1px 4px rgba(20,30,32,0.06)",
      }}
    >
      {pm?.thumbnail_url && (
        <div
          style={{
            position: "absolute", top: 20, right: 20, width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paper,
            border: `1px solid ${COLORS.hairline}`, boxShadow: "0 2px 8px rgba(20,30,32,0.1)",
          }}
          title={`${pm.name} — ${pm.cabinet_role}`}
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
        As the sitting government, Labour's manifesto pledges are the only ones that can be checked against real
        outcomes rather than promises. We don't make these calls ourselves — every status here comes from{" "}
        <a href={SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: LABOUR_RED, fontWeight: 600 }}>
          Full Fact's independent, non-partisan Government Tracker ↗
        </a>
        , which assesses all {OVERALL_TOTAL} pledges it tracks — this page shows a {TOTAL_PLEDGES}-pledge sample
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
        <FilterPill active={activeFilter === "all"} color={COLORS.ink} onClick={() => setActiveFilter("all")}>
          All categories
        </FilterPill>
        {Object.entries(STATUS).map(([key, s]) => (
          <FilterPill key={key} active={activeFilter === key} color={s.color} onClick={() => setActiveFilter(key)}>
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
        This is a curated sample of the {OVERALL_TOTAL} pledges Full Fact tracks — see{" "}
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
