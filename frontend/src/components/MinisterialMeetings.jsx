import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { formatDate } from "../lib/format";
import { IconMeeting, IconSearch } from "./icons";
import {
  MINISTERIAL_MEETINGS,
  MINISTERIAL_MEETINGS_UPDATED,
  MINISTERIAL_MEETINGS_PERIOD,
  MINISTERIAL_MEETINGS_COLLECTION_URL,
} from "../data/ministerialMeetings";

const DEPARTMENT_PALETTE = ["#9C6B30", "#5A7FA6", "#6E4B6E", "#3F7D5C", "#B5533C", "#A8456B"];

function monthLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function ministerInitials(name) {
  return name.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
}

// Roundtable meetings can list a dozen-plus attendees in one comma-separated
// string — showing all of them as the card's headline makes the card
// unreadable, so this trims to the first few names plus a "+N more" count,
// with the full list still available on hover.
function summariseAttendees(organisation, max = 3) {
  const names = organisation.split(",").map((n) => n.trim()).filter(Boolean);
  if (names.length <= max) return { headline: organisation, full: null };
  return { headline: `${names.slice(0, max).join(", ")}, +${names.length - max} more`, full: organisation };
}

function StatChip({ value, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.ink }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

function FilterPill({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 999,
        border: `1px solid ${active ? color : COLORS.hairline}`, background: active ? `${color}18` : "transparent",
        color: active ? color : COLORS.inkSoft, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}

function MeetingCard({ meeting, color, index }) {
  const { headline, full } = summariseAttendees(meeting.organisation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -2, boxShadow: "0 10px 24px rgba(30,42,68,0.12)" }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.02 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${color}`, borderRadius: 12, padding: "16px 18px" }}
    >
      {/* A fixed-shape metadata row (avatar, minister, department pill, date) that
          never reflows, however long the attendee list below it turns out to be. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: `${color}18`, color, fontFamily: FONT_DISPLAY, fontSize: 12.5, fontWeight: 600,
          }}
        >
          {ministerInitials(meeting.minister)}
        </div>
        <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap" }}>{meeting.minister}</span>
          <span
            style={{
              fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color, background: `${color}14`,
              padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap",
            }}
          >
            {meeting.department}
          </span>
        </div>
        <span style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{formatDate(meeting.date)}</span>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
        Met with
      </div>
      <div
        title={full ?? undefined}
        style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: COLORS.ink, lineHeight: 1.4, marginBottom: 8, cursor: full ? "help" : "default" }}
      >
        {headline}
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
        {meeting.purpose}
      </div>
      <a
        href={meeting.sourceUrl}
        target="_blank"
        rel="noreferrer"
        style={{ display: "inline-block", marginTop: 10, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color }}
      >
        View official return ↗
      </a>
    </motion.div>
  );
}

export default function MinisterialMeetings() {
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [ministerFilter, setMinisterFilter] = useState("All");

  const departments = useMemo(() => [...new Set(MINISTERIAL_MEETINGS.map((m) => m.department))], []);
  const departmentColor = useMemo(() => {
    const map = {};
    departments.forEach((d, i) => { map[d] = DEPARTMENT_PALETTE[i % DEPARTMENT_PALETTE.length]; });
    return map;
  }, [departments]);
  const ministers = useMemo(() => [...new Set(MINISTERIAL_MEETINGS.map((m) => m.minister))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MINISTERIAL_MEETINGS.filter((m) => {
      if (departmentFilter !== "All" && m.department !== departmentFilter) return false;
      if (ministerFilter !== "All" && m.minister !== ministerFilter) return false;
      if (q && !(`${m.minister} ${m.organisation} ${m.purpose}`.toLowerCase().includes(q))) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [query, departmentFilter, ministerFilter]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const m of filtered) {
      const label = monthLabel(m.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconMeeting}
        kicker="Public Record · Ministerial Meetings"
        title="Who's getting a minister's time"
        subtitle="Every minister has to declare who they meet with outside government — companies, charities, industry bodies, unions. This is where that access becomes visible: a sample of those declared meetings, taken directly from each department's own published transparency return."
      />

      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between",
          background: `linear-gradient(160deg, ${COLORS.brass}12, ${COLORS.paperCard} 70%)`,
          border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.brass}`, borderRadius: 14, padding: "20px 24px",
          marginTop: 24, marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 30 }}>
          <StatChip value={MINISTERIAL_MEETINGS.length} label="Meetings" />
          <StatChip value={ministers.length} label="Ministers" />
          <StatChip value={departments.length} label="Departments" />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: COLORS.ink }}>{MINISTERIAL_MEETINGS_PERIOD}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>the latest quarter any department has published</div>
        </div>
      </div>

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
          fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginBottom: 24,
        }}
      >
        <strong style={{ color: COLORS.ink }}>About this data:</strong> departments publish ministers' meetings on a
        lag of several months by design — the {MINISTERIAL_MEETINGS_PERIOD} return wasn't published until late June
        2026, so this genuinely is the most current record available anywhere, not a stale fetch. It's also a curated
        sample rather than a complete one — every department publishes separately, in its own format, on its own
        schedule, so an exhaustive automatic feed isn't realistic here (see Data & Methodology for why). For the full
        picture, browse{" "}
        <a href={MINISTERIAL_MEETINGS_COLLECTION_URL} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
          every department's own releases
        </a>{" "}
        directly. Last refreshed {MINISTERIAL_MEETINGS_UPDATED}.
      </div>

      <div style={{ position: "relative", maxWidth: 460, marginBottom: 20 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by minister, organisation, or topic…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <FilterGroup label="Department">
        <FilterPill active={departmentFilter === "All"} color={COLORS.ink} onClick={() => setDepartmentFilter("All")}>All</FilterPill>
        {departments.map((d) => (
          <FilterPill key={d} active={departmentFilter === d} color={departmentColor[d]} onClick={() => setDepartmentFilter(d)}>{d}</FilterPill>
        ))}
      </FilterGroup>
      <FilterGroup label="Minister">
        <FilterPill active={ministerFilter === "All"} color={COLORS.ink} onClick={() => setMinisterFilter("All")}>All</FilterPill>
        {ministers.map((m) => (
          <FilterPill key={m} active={ministerFilter === m} color={COLORS.ink} onClick={() => setMinisterFilter(m)}>{m}</FilterPill>
        ))}
      </FilterGroup>

      <div style={{ marginTop: 12 }}>
        {groups.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: "20px 0" }}>
            Nothing matches that search.
          </div>
        )}

        {groups.map(([label, meetings]) => (
          <div key={label} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.brass, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                {label}
              </span>
              <span style={{ flex: 1, height: 1, background: COLORS.hairline }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {meetings.map((m, i) => (
                <MeetingCard key={`${m.minister}-${m.date}-${i}`} meeting={m} color={departmentColor[m.department]} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
