import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconPetition } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const FILTERS = [
  { key: "open", label: "Open now" },
  { key: "responded", label: "Got a government response" },
  { key: "debated", label: "Debated in Parliament" },
];

function SignatureBar({ count, threshold, label, color }) {
  const pct = Math.min(100, Math.round((count / threshold) * 100));
  const reached = count >= threshold;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: reached ? color : COLORS.inkSoft, fontWeight: reached ? 700 : 400 }}>
          {reached ? "Reached" : `${count.toLocaleString()} / ${threshold.toLocaleString()}`}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function PetitionRow({ petition, index, isOpen, onToggle }) {
  const isOpenState = petition.state === "open";
  const color = petition.debate_outcome_summary || petition.debate_scheduled_on ? "#6E4B6E" : petition.government_responded_at ? "#2F6F4E" : COLORS.brass;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.03, ease: "easeOut" }}
      style={{
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${color}`,
        borderRadius: 12, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 4px rgba(20,30,32,0.05)",
      }}
    >
      <button onClick={onToggle} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink, lineHeight: 1.4 }}>{petition.action}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color }}>
                  {petition.signature_count.toLocaleString()}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 500, color: COLORS.inkSoft }}>
                  signatures
                </span>
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
                {isOpenState ? "Open" : "Closed"}
                {petition.government_responded_at ? " · Government responded" : ""}
                {petition.debate_scheduled_on || petition.debate_outcome_summary ? " · Debated" : ""}
              </span>
            </div>
          </div>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: COLORS.inkSoft, fontSize: 12, flexShrink: 0, marginTop: 4 }}>▾</motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", gap: 12 }}>
              {petition.background && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6 }}>{petition.background}</div>
              )}

              {isOpenState && (
                <div>
                  <SignatureBar count={petition.signature_count} threshold={10000} label="Threshold for a government response" color="#2F6F4E" />
                  <SignatureBar count={petition.signature_count} threshold={100000} label="Threshold for a Commons debate" color="#6E4B6E" />
                </div>
              )}

              {petition.government_response_summary && (
                <div style={{ background: "#2F6F4E0c", borderLeft: "3px solid #2F6F4E", borderRadius: 6, padding: "9px 13px" }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: "#2F6F4E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    Government response{petition.government_responded_at ? ` · ${formatDate(petition.government_responded_at)}` : ""}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, lineHeight: 1.55 }}>{petition.government_response_summary}</div>
                </div>
              )}

              {(petition.debate_outcome_summary || petition.debate_scheduled_on) && (
                <div style={{ background: "#6E4B6E0c", borderLeft: "3px solid #6E4B6E", borderRadius: 6, padding: "9px 13px" }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: "#6E4B6E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    {petition.debate_outcome_summary ? "Commons debate" : "Debate scheduled"}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, lineHeight: 1.55 }}>
                    {petition.debate_outcome_summary || `Scheduled for ${formatDate(petition.debate_scheduled_on)}`}
                  </div>
                </div>
              )}

              <a href={petition.url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink }}>
                View full petition on petitions.parliament.uk ↗
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Petitions() {
  const [petitions, setPetitions] = useState(null);
  const [filter, setFilter] = useState("open");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("petitions").select("*").order("signature_count", { ascending: false });
      setPetitions(data ?? []);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!petitions) return [];
    if (filter === "open") return petitions.filter((p) => p.state === "open");
    if (filter === "responded") return petitions.filter((p) => p.government_responded_at);
    if (filter === "debated") return petitions.filter((p) => p.debate_outcome_summary || p.debate_scheduled_on);
    return petitions;
  }, [petitions, filter]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconPetition}
        kicker="Public Record · Petitions"
        title="Public petitions to Parliament"
        subtitle="The most-signed petitions currently open, plus recent ones that got a government response or a Commons debate — taken straight from petitions.parliament.uk itself, with no editorial curation of which petitions appear."
      />

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
          marginTop: 24, marginBottom: 22, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        Any UK citizen or resident can create or sign a petition to Parliament. At <strong style={{ color: COLORS.ink }}>10,000 signatures</strong>,
        the government must respond in writing; at <strong style={{ color: COLORS.ink }}>100,000</strong>, it's considered for a
        Commons debate — though a debate isn't guaranteed, and neither a response nor a debate changes the law by itself. Petitions run
        for six months from opening, and each one is moderated before publication.
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => withScrollPreserved(() => setFilter(f.key))}
              style={{
                fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
                border: `1px solid ${active ? COLORS.ink : COLORS.hairline}`, background: active ? COLORS.ink : "transparent",
                color: active ? "#fff" : COLORS.inkSoft, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {petitions === null && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>
      )}

      {petitions !== null && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: "20px 0" }}>
          No petitions match this filter right now.
        </div>
      )}

      {filtered.map((p, i) => (
        <PetitionRow
          key={p.id}
          petition={p}
          index={i}
          isOpen={openId === p.id}
          onToggle={() => withScrollPreserved(() => setOpenId(openId === p.id ? null : p.id))}
        />
      ))}
    </div>
  );
}
