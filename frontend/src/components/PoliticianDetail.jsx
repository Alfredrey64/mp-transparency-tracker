import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { partyColour, timeInOffice, shortCategory, formatDate, initials } from "../lib/format";
import { getDonorSector, sectorColor } from "../lib/donorSectors";
import {
  SectionDivider,
  CardShell,
  BiographyBox,
  ContactBox,
  CabinetRoleBox,
  VotingSummaryBox,
  StandardsBox,
  NewsBox,
} from "./shared";

const DETAIL_TABS = [
  { key: "all", label: "All" },
  { key: "donations", label: "Donations" },
  { key: "roles", label: "Roles" },
];

function groupInterestsBySector(interests) {
  const bySector = new Map();
  for (const item of interests) {
    if (!item.value_amount) continue;
    const tag = getDonorSector(item.donor_name);
    if (!tag) continue;
    if (!bySector.has(tag.sector)) bySector.set(tag.sector, { sector: tag.sector, color: sectorColor(tag.sector), total: 0, donations: [] });
    const entry = bySector.get(tag.sector);
    entry.total += item.value_amount;
    entry.donations.push({ donor: item.donor_name, amount: item.value_amount, date: item.date_registered });
  }
  return [...bySector.values()]
    .map((s) => ({ ...s, donations: s.donations.sort((a, b) => b.amount - a.amount) }))
    .sort((a, b) => b.total - a.total);
}

function FundingBySectorBox({ interests }) {
  const [openSector, setOpenSector] = useState(null);
  const bySector = useMemo(() => groupInterestsBySector(interests), [interests]);
  if (bySector.length === 0) return null;
  const max = Math.max(...bySector.map((s) => s.total));

  return (
    <CardShell title="Funding by Sector">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
        Declared donors matched to an industry, where confidently identifiable — not the MP's own stated position.
        Tap a sector to see which donations make it up.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {bySector.map((s) => {
          const isOpen = openSector === s.sector;
          return (
            <div key={s.sector}>
              <button
                onClick={() => setOpenSector(isOpen ? null : s.sector)}
                style={{ display: "block", width: "100%", background: "none", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginBottom: 3 }}>
                  <span>{s.sector} {isOpen ? "▾" : "▸"}</span>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.inkSoft }}>£{Math.round(s.total).toLocaleString()}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.total / max) * 100}%`, borderRadius: 999, background: s.color }} />
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "8px 0 6px 4px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {s.donations.map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.donor} · {formatDate(d.date)}
                          </span>
                          <span style={{ fontFamily: FONT_MONO, color: COLORS.ink, flexShrink: 0 }}>£{Math.round(d.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

export default function PoliticianDetail({ politician, onBack }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [avatarErrored, setAvatarErrored] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("financial_interests")
        .select("*")
        .eq("politician_id", politician.id)
        .order("date_registered", { ascending: false });
      setInterests(data ?? []);
      setLoading(false);
    }
    load();
  }, [politician.id]);

  const filteredInterests = useMemo(() => {
    if (activeTab === "donations") return interests.filter((item) => item.value_amount != null);
    if (activeTab === "roles") return interests.filter((item) => item.category === "Employment and earnings");
    return interests;
  }, [interests, activeTab]);

  const office = timeInOffice(politician.membership_start_date);
  const color = partyColour(politician.party_colour, COLORS.inkSoft);

  return (
    <motion.div
      key={politician.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ padding: PAGE_PADDING }}
    >
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: FONT_BODY,
          fontSize: 13.5,
          color: COLORS.inkSoft,
          padding: 0,
          marginBottom: 20,
          display: "inline-block",
          transition: "color 0.15s, transform 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.ink; e.currentTarget.style.transform = "translateX(-2px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.inkSoft; e.currentTarget.style.transform = "translateX(0)"; }}
      >
        ← All MPs
      </button>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ position: "relative", paddingBottom: 28, borderBottom: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, overflow: "hidden" }}>
          {politician.thumbnail_url && !avatarErrored ? (
            <div
              style={{
                width: 96, height: 96, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: COLORS.paperCard, border: `3px solid ${COLORS.paperCard}`,
                boxShadow: `0 0 0 2px ${color}55, 0 4px 14px rgba(30,42,68,0.12)`,
              }}
            >
              <img
                src={politician.thumbnail_url}
                alt=""
                onError={() => setAvatarErrored(true)}
                onLoad={() => setAvatarLoaded(true)}
                style={{
                  width: 86, height: 86, borderRadius: "50%", objectFit: "cover", objectPosition: "center top",
                  opacity: avatarLoaded ? 1 : 0, transition: "opacity 0.25s ease",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_DISPLAY,
                fontSize: 30,
                fontWeight: 600,
                color: "#fff",
                background: color,
                border: `3px solid ${COLORS.paperCard}`,
                boxShadow: `0 0 0 2px ${color}55, 0 4px 14px rgba(30,42,68,0.12)`,
              }}
            >
              {initials(politician.name)}
            </div>
          )}
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: COLORS.ink, margin: 0 }}>{politician.name}</h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
              {politician.party} · {politician.constituency}
              {office && ` · MP for ${office}`}
            </div>
            <SectionDivider />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, paddingTop: 24, alignItems: "start" }}>
          {/* ---- Left column: financial interests ---- */}
          <div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 4, paddingBottom: 12 }}>
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    position: "relative",
                    fontFamily: FONT_BODY,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: "transparent",
                    color: activeTab === tab.key ? "#fff" : COLORS.inkSoft,
                    zIndex: 1,
                  }}
                >
                  {activeTab === tab.key && (
                    <motion.span
                      layoutId="detail-tab-pill"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      style={{ position: "absolute", inset: 0, background: COLORS.ink, borderRadius: 999, zIndex: -1 }}
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading declared interests…</div>}

              {!loading && filteredInterests.length === 0 && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
                  {interests.length === 0
                    ? "No declared financial interests found for this MP."
                    : `No entries in "${DETAIL_TABS.find((t) => t.key === activeTab)?.label}" for this MP.`}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {filteredInterests.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.03 }}
                      whileHover={{ y: -2, boxShadow: "0 6px 16px rgba(30,42,68,0.1)" }}
                      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(30,42,68,0.05)" }}
                    >
                      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                        {shortCategory(item.category)}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: COLORS.ink, lineHeight: 1.4 }}>
                        {item.summary}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, fontSize: 12.5, color: COLORS.inkSoft, textAlign: "center" }}>
                        {item.value_amount && (
                          <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: COLORS.ink }}>£{Number(item.value_amount).toLocaleString()}</span>
                        )}
                        {item.value_amount && item.date_registered && <span>-</span>}
                        {item.date_registered && <span style={{ fontFamily: FONT_BODY }}>{formatDate(item.date_registered)}</span>}
                        {(item.value_amount || item.date_registered) && item.source_url && <span>-</span>}
                        {item.source_url && (
                          <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY }}>
                            source ↗
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ---- Right column: everything else ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BiographyBox politician={politician} />
            <FundingBySectorBox interests={interests} />
            <ContactBox politician={politician} />
            <CabinetRoleBox politician={politician} />
            <VotingSummaryBox politician={politician} />
            <StandardsBox politician={politician} />
            <NewsBox politician={politician} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
