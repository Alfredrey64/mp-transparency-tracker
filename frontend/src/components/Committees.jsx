import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import { partyColour, stripHtml, formatDate } from "../lib/format";
import { IconCommittee } from "./icons";

const HOUSE_FILTERS = ["All", "Commons", "Lords", "Joint"];

// The same green/red the bill-stage diagram already uses for the two
// Houses — real chamber colours (Commons benches are green, Lords' are
// red), not an arbitrary pair, so it means the same thing wherever it
// shows up on the site. Joint committees get the sitewide accent instead
// of a blend of the two, since "joint" isn't a colour between green and
// red, it's a genuinely different category.
const HOUSE_COLOR = { Commons: COLORS.commonsGreen, Lords: COLORS.garnet, Joint: COLORS.accent };

function MemberChip({ member, showHouse }) {
  const color = partyColour(member.party_colour, COLORS.inkSoft);
  const houseColor = HOUSE_COLOR[member.house];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5,
        padding: "5px 10px 5px 8px", borderRadius: 999, background: COLORS.paper,
        border: `1px solid ${showHouse && houseColor ? `${houseColor}55` : COLORS.hairline}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ color: COLORS.ink, fontWeight: member.is_chair ? 700 : 400 }}>
        {member.name}{member.is_chair ? " (Chair)" : ""}
      </span>
      {showHouse && houseColor && (
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: houseColor }}>
          {member.house}
        </span>
      )}
    </span>
  );
}

function InquiryRow({ inquiry }) {
  return (
    <a
      href={inquiry.url}
      target="_blank"
      rel="noreferrer"
      style={{ display: "block", padding: "10px 0", borderTop: `1px solid ${COLORS.hairline}`, textDecoration: "none" }}
    >
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 2 }}>
        {inquiry.title} ↗
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
        Opened {formatDate(inquiry.open_date)}
        {inquiry.close_date ? ` · Closes ${formatDate(inquiry.close_date)}` : ""}
      </div>
    </a>
  );
}

// A compact stacked bar showing the committee's actual party balance —
// visible even collapsed, so "who's scrutinising the government" has a
// real answer at a glance rather than needing every card opened to find
// it. Same party colours used everywhere else on the site, so no new
// legend is needed for it to read correctly.
function PartyComposition({ members }) {
  const parties = useMemo(() => {
    const counts = new Map();
    for (const m of members ?? []) {
      const name = m.party || "Other";
      if (!counts.has(name)) counts.set(name, { name, count: 0, color: partyColour(m.party_colour, COLORS.inkSoft) });
      counts.get(name).count += 1;
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [members]);

  const total = members?.length ?? 0;
  if (total === 0) return null;

  return (
    <div style={{ display: "flex", height: 7, borderRadius: 999, overflow: "hidden", marginTop: 12, gap: 1 }}>
      {parties.map((p) => (
        <div
          key={p.name}
          style={{ width: `${(p.count / total) * 100}%`, background: p.color, minWidth: 3 }}
          title={`${p.name}: ${p.count} member${p.count === 1 ? "" : "s"}`}
        />
      ))}
    </div>
  );
}

function CommitteeCard({ committee, index, open, onToggle }) {
  const color = partyColour(committee.chair_party_colour, COLORS.accent);
  const purpose = stripHtml(committee.purpose);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03, ease: "easeOut" }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${color}`, borderRadius: 14, padding: 18 }}
    >
      <button onClick={onToggle} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, lineHeight: 1.3 }}>{committee.name}</div>
          <span
            style={{
              flexShrink: 0, fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700,
              color: HOUSE_COLOR[committee.house] ?? COLORS.inkSoft,
              background: `${HOUSE_COLOR[committee.house] ?? COLORS.inkSoft}14`,
              border: `1px solid ${HOUSE_COLOR[committee.house] ?? COLORS.inkSoft}40`,
              borderRadius: 999, padding: "3px 9px", textTransform: "uppercase",
            }}
          >
            {committee.house}
          </span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
          {committee.chair_name ? <>Chaired by <strong style={{ color: COLORS.ink }}>{committee.chair_name}</strong></> : "Chair not currently listed"}
          {" · "}{committee.members?.length ?? 0} members
          {committee.inquiries?.length > 0 && <> · {committee.inquiries.length} open inquir{committee.inquiries.length === 1 ? "y" : "ies"}</>}
        </div>
        <PartyComposition members={committee.members} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.hairline}` }}>
              {purpose && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, marginBottom: 14 }}>
                  {purpose}
                </div>
              )}

              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Members ({committee.members?.length ?? 0})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: committee.inquiries?.length > 0 ? 16 : 0 }}>
                {(committee.members ?? []).map((m, i) => (
                  <MemberChip key={i} member={m} showHouse={committee.house === "Joint"} />
                ))}
              </div>

              {committee.inquiries?.length > 0 && (
                <>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    Open inquiries
                  </div>
                  {committee.inquiries.map((inq, i) => <InquiryRow key={i} inquiry={inq} />)}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Committees() {
  const [committees, setCommittees] = useState(null);
  const [failed, setFailed] = useState(false);
  const [houseFilter, setHouseFilter] = useState("All");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    supabase.from("committees").select("*").order("name", { ascending: true }).then(({ data, error }) => {
      setFailed(Boolean(error));
      setCommittees(data ?? []);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!committees) return [];
    if (houseFilter === "All") return committees;
    return committees.filter((c) => c.house === houseFilter);
  }, [committees, houseFilter]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCommittee}
        kicker="Public Record · Select Committees"
        title="Who's scrutinising the government"
        subtitle="Select committees are the cross-party groups of MPs and peers who question ministers, gather evidence, and publish reports on how well government departments are actually doing their jobs — separate from, and often more detailed than, anything debated on the floor of the Commons or Lords."
      />

      {committees === null && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>
      )}

      {committees !== null && failed && (
        <div style={{ marginTop: 24 }}>
          <LoadFailedNote item="the committee list" />
        </div>
      )}

      {committees !== null && !failed && committees.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>
          No committee data available yet.
        </div>
      )}

      {committees !== null && committees.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24, marginBottom: 20 }}>
            {HOUSE_FILTERS.map((h) => {
              const c = HOUSE_COLOR[h] ?? COLORS.accent;
              const active = houseFilter === h;
              return (
                <button
                  key={h}
                  onClick={() => setHouseFilter(h)}
                  style={{
                    fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
                    border: `1px solid ${active ? c : COLORS.hairline}`,
                    background: active ? c : "transparent",
                    color: active ? "#fff" : COLORS.inkSoft, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {h}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((c, i) => (
              <CommitteeCard
                key={c.id}
                committee={c}
                index={i}
                open={openId === c.id}
                onToggle={() => setOpenId(openId === c.id ? null : c.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
