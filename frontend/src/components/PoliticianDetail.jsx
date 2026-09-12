import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { partyColour, timeInOffice, shortCategory, formatDate, initials, ONGOING_ROLE_CATEGORIES } from "../lib/format";
import { getDonorSector, sectorColor } from "../lib/donorSectors";
import { sectorToBillCategory } from "../lib/sectorBillMapping";
import { categoriseBill } from "../lib/bills";
import { isWatched, toggleWatch } from "../lib/watchlist";
import { IconStar } from "./icons";
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

// A division's own `title` (e.g. "Finance Bill: Third Reading") isn't
// linked to a `bills` row by any shared key — the two come from separate
// parliamentary data sources. Matching on a title prefix is the same
// imperfect-but-reasonable approach VotingRecords.jsx uses in the other
// direction (bill → its divisions).
function matchBillForVote(voteTitle, categorisedBills) {
  return categorisedBills.find((b) => b.short_title && voteTitle.startsWith(b.short_title)) ?? null;
}

function MoneyAndVotesBox({ politician, interests }) {
  const [votes, setVotes] = useState(null);
  const [bills, setBills] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: b }] = await Promise.all([
        supabase.from("voting_records").select("title, date, voted_aye").eq("politician_id", politician.id),
        supabase.from("bills").select("short_title, sponsoring_department"),
      ]);
      setVotes(v ?? []);
      setBills(b ?? []);
    }
    load();
  }, [politician.id]);

  const links = useMemo(() => {
    if (!votes || !bills) return null;
    const categorisedBills = bills.map((b) => ({ ...b, category: categoriseBill(b) }));
    const bySector = groupInterestsBySector(interests);

    return bySector
      .map((s) => {
        const targetCategory = sectorToBillCategory(s.sector);
        if (!targetCategory) return null;
        const relatedVotes = votes
          .map((v) => ({ ...v, bill: matchBillForVote(v.title, categorisedBills) }))
          .filter((v) => v.bill?.category.label === targetCategory)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (relatedVotes.length === 0) return null;
        return { sector: s.sector, color: s.color, sectorTotal: s.total, category: targetCategory, votes: relatedVotes };
      })
      .filter(Boolean);
  }, [votes, bills, interests]);

  if (links === null) return null;
  if (links.length === 0) return null;

  return (
    <CardShell title="Money & Votes">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
        Where this MP's declared donors' industry overlaps with a bill's policy area, and they voted on it. This is
        a factual overlap, not evidence the donation influenced the vote — most MPs vote with their party regardless
        of who has donated to them, and a shared policy area doesn't establish a connection between the two.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {links.map((link) => (
          <div key={link.sector} style={{ background: `${link.color}0c`, border: `1px solid ${link.color}33`, borderRadius: 10, padding: "10px 13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                <strong>£{Math.round(link.sectorTotal).toLocaleString()}</strong> from {link.sector} donors
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: link.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {link.category} · {link.votes.length} vote{link.votes.length === 1 ? "" : "s"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {link.votes.map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</span>
                  <span
                    style={{
                      flexShrink: 0, fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", padding: "1px 7px", borderRadius: 999,
                      color: v.voted_aye ? "#2F6F4E" : "#9C3B3B", background: v.voted_aye ? "#E4EEE7" : "#F3E4E2",
                    }}
                  >
                    {v.voted_aye ? "Aye" : "No"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function CurrentRolesBox({ interests }) {
  const roles = useMemo(
    () => interests.filter((item) => ONGOING_ROLE_CATEGORIES.includes(item.category)),
    [interests]
  );
  if (roles.length === 0) return null;

  return (
    <CardShell title="Current Outside Roles">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
        Ongoing paid roles or jobs outside Parliament, as declared in the register — separate from one-off payments
        like a single speech or article fee.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {roles.map((r, i) => (
          <div key={r.id} style={{ paddingBottom: i < roles.length - 1 ? 10 : 0, borderBottom: i < roles.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.5 }}>{r.summary}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
              {r.date_registered && <span>Registered {formatDate(r.date_registered)}</span>}
              {r.source_url && (
                <a href={r.source_url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>
                  source ↗
                </a>
              )}
            </div>
          </div>
        ))}
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
  const [watched, setWatched] = useState(() => isWatched(politician.id));

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
    if (activeTab === "roles") return interests.filter((item) => ONGOING_ROLE_CATEGORIES.includes(item.category));
    return interests;
  }, [interests, activeTab]);

  const totalDeclaredValue = useMemo(
    () => interests.reduce((sum, item) => sum + (item.value_amount ?? 0), 0),
    [interests]
  );

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
        <div style={{ position: "relative", paddingTop: 10, paddingBottom: 28, borderBottom: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
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
                  width: 70, height: 70, borderRadius: "50%", objectFit: "cover", objectPosition: "center",
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: COLORS.ink, margin: 0 }}>{politician.name}</h1>
              <button
                onClick={() => setWatched(toggleWatch(politician))}
                title={watched ? "Remove from your watchlist" : "Add to your watchlist"}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  width: 32, height: 32, borderRadius: "50%", border: `1px solid ${watched ? COLORS.brass : COLORS.hairline}`,
                  background: watched ? `${COLORS.brass}14` : "transparent", color: watched ? COLORS.brass : COLORS.inkSoft,
                  cursor: "pointer", transition: "background 0.15s, border-color 0.15s, color 0.15s",
                }}
              >
                <IconStar size={16} filled={watched} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
              {politician.party} · {politician.constituency}
              {office && ` · MP for ${office}`}
            </div>
            {totalDeclaredValue > 0 && (
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "6px 14px",
                  borderRadius: 999, background: `${COLORS.brass}14`, fontFamily: FONT_BODY, fontSize: 13,
                  fontWeight: 700, color: COLORS.brass,
                }}
              >
                £{Math.round(totalDeclaredValue).toLocaleString()} total declared value
              </div>
            )}
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
            <CurrentRolesBox interests={interests} />
            <FundingBySectorBox interests={interests} />
            <MoneyAndVotesBox politician={politician} interests={interests} />
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
