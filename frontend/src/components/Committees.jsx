import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { partyColour, stripHtml, formatDate } from "../lib/format";
import { IconCommittee } from "./icons";

const HOUSE_FILTERS = ["All", "Commons", "Lords", "Joint"];

function MemberChip({ member }) {
  const color = partyColour(member.party_colour, COLORS.inkSoft);
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5,
        padding: "5px 10px 5px 8px", borderRadius: 999, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ color: COLORS.ink, fontWeight: member.is_chair ? 700 : 400 }}>
        {member.name}{member.is_chair ? " (Chair)" : ""}
      </span>
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

function CommitteeCard({ committee, index, open, onToggle }) {
  const color = partyColour(committee.chair_party_colour, COLORS.brass);
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
              flexShrink: 0, fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: COLORS.inkSoft,
              background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "3px 9px", textTransform: "uppercase",
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
                {(committee.members ?? []).map((m, i) => <MemberChip key={i} member={m} />)}
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
  const [houseFilter, setHouseFilter] = useState("All");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    supabase.from("committees").select("*").order("name", { ascending: true }).then(({ data }) => setCommittees(data ?? []));
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

      {committees !== null && committees.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>
          No committee data available yet.
        </div>
      )}

      {committees !== null && committees.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24, marginBottom: 20 }}>
            {HOUSE_FILTERS.map((h) => (
              <button
                key={h}
                onClick={() => setHouseFilter(h)}
                style={{
                  fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
                  border: `1px solid ${houseFilter === h ? COLORS.ink : COLORS.hairline}`,
                  background: houseFilter === h ? COLORS.ink : "transparent",
                  color: houseFilter === h ? "#fff" : COLORS.inkSoft, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {h}
              </button>
            ))}
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
