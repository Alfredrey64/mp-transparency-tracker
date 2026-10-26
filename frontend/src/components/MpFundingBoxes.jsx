// The money boxes on an MP's page: who funds them, how that lines up with their votes and committees, and their outside roles.
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, readable } from "../theme";
import { formatDate, ONGOING_ROLE_CATEGORIES } from "../lib/format";
import { getDonorSector, sectorColor } from "../lib/donorSectors";
import { sectorToBillCategory } from "../lib/sectorBillMapping";
import { sectorToCommittee } from "../lib/sectorCommitteeMapping";
import { categoriseBill, matchBillForVote } from "../lib/bills";
import { withScrollPreserved } from "../lib/preserveScroll";
import { CardShell } from "./MpCards";

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

export function FundingBySectorBox({ interests }) {
  const [openSector, setOpenSector] = useState(null);
  const bySector = useMemo(() => groupInterestsBySector(interests), [interests]);
  if (bySector.length === 0) return null;
  const max = Math.max(...bySector.map((s) => s.total));

  return (
    <CardShell title="Funding by Sector">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
        Declared donors matched to an industry, where confidently identifiable, not the MP's own stated position.
        Tap a sector to see which donations make it up.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {bySector.map((s) => {
          const isOpen = openSector === s.sector;
          return (
            <div key={s.sector}>
              <button
                onClick={() => withScrollPreserved(() => setOpenSector(isOpen ? null : s.sector))}
                style={{ display: "block", width: "100%", background: "none", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginBottom: 3 }}>
                  <span>{s.sector} {isOpen ? "▾" : "▸"}</span>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 600, color: COLORS.inkSoft }}>£{Math.round(s.total).toLocaleString()}</span>
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
                          <span style={{ fontFamily: FONT_BODY, fontWeight: 600, color: COLORS.ink, flexShrink: 0 }}>£{Math.round(d.amount).toLocaleString()}</span>
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

export function MoneyAndVotesBox({ politician, interests }) {
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
        return { sector: s.sector, color: readable(s.color), sectorTotal: s.total, category: targetCategory, votes: relatedVotes };
      })
      .filter(Boolean);
  }, [votes, bills, interests]);

  if (links === null) return null;
  if (links.length === 0) return null;

  return (
    <CardShell title="Money & Votes">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
        Where this MP's declared donors' industry overlaps with a bill's policy area, and they voted on it. This is
        a factual overlap, not evidence the donation influenced the vote: most MPs vote with their party regardless
        of who has donated to them, and a shared policy area doesn't establish a connection between the two.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {links.map((link) => (
          <div key={link.sector} style={{ background: `${link.color}0c`, border: `1px solid ${link.color}33`, borderRadius: 10, padding: "10px 13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                <strong>£{Math.round(link.sectorTotal).toLocaleString()}</strong> from {link.sector} donors
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: readable(link.color), textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {link.category} · {link.votes.length} vote{link.votes.length === 1 ? "" : "s"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {link.votes.map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</span>
                  <span
                    style={{
                      flexShrink: 0, fontWeight: 700, fontSize: 11, textTransform: "uppercase", padding: "1px 7px", borderRadius: 999,
                      color: v.voted_aye ? readable("#2F6F4E") : readable("#9C3B3B"), background: v.voted_aye ? "#E4EEE7" : "#F3E4E2",
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

// Cross-references two things that never otherwise appear on the same
// page: which select committee an MP sits on, and which industries their
// declared donors are in. A committee's remit is public and an MP's
// committee membership is their own choice (subject to their party's
// approval), so an MP scrutinising the same industry as their donors is a
// real, checkable fact — not proof the donation bought the seat. Committee
// places are handed out based on an MP's background and interests, which is
// very often exactly why someone with, say, pharmaceutical donors ends up
// on the Health and Social Care Committee in the first place.
export function CommitteeConflictsBox({ interests, myCommittees }) {
  const conflicts = useMemo(() => {
    if (myCommittees.length === 0) return [];
    const bySector = groupInterestsBySector(interests);
    return bySector
      .map((s) => {
        const targetCommittee = sectorToCommittee(s.sector);
        if (!targetCommittee) return null;
        const committee = myCommittees.find((c) => c.name === targetCommittee);
        if (!committee) return null;
        return { sector: s.sector, color: readable(s.color), sectorTotal: s.total, donations: s.donations, committeeName: committee.name };
      })
      .filter(Boolean);
  }, [interests, myCommittees]);

  if (conflicts.length === 0) return null;

  return (
    <CardShell title="Committee & Donor Overlap">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
        Where this MP sits on a select committee that scrutinises the same industry as one of their declared donors.
        This is a factual overlap, not evidence of undue influence, committee places reflect an MP's background and
        interests, which is very often exactly why it lines up with their donors' industry.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {conflicts.map((c) => (
          <div key={c.sector} style={{ background: `${c.color}0c`, border: `1px solid ${c.color}33`, borderRadius: 10, padding: "10px 13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                <strong>£{Math.round(c.sectorTotal).toLocaleString()}</strong> from {c.sector} donors
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: readable(c.color), textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Sits on: {c.committeeName}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {c.donations.slice(0, 5).map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.donor}</span>
                  <span style={{ flexShrink: 0 }}>£{Math.round(d.amount).toLocaleString()}</span>
                </div>
              ))}
              {c.donations.length > 5 && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic" }}>
                  + {c.donations.length - 5} more. See the Donations tab above.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

// Words too generic to count as a real name match on their own — "Group",
// "Trust", "Limited" and the like appear in hundreds of unrelated
// organisation names, so two entries sharing only one of these wouldn't be
// a meaningful overlap.
const ORG_STOPWORDS = new Set([
  "the", "ltd", "limited", "plc", "group", "llp", "inc", "co", "and", "of",
  "committee", "association", "foundation", "trust", "international",
  "company", "corporation", "holdings", "services", "uk",
]);

function significantWords(name) {
  return (name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !ORG_STOPWORDS.has(w));
}

function namesOverlap(a, b) {
  const wordsA = new Set(significantWords(a));
  return significantWords(b).some((w) => wordsA.has(w));
}

// Cross-references two registers that never otherwise touch: an MP's own
// declared financial interests, and the separate Cabinet Office register of
// ministerial gifts and hospitality (only populated for MPs who hold a
// government post). A name appearing in both isn't evidence of anything —
// it's a factual overlap, surfaced because it's otherwise invisible: no
// single official source lists both together.
export function CrossRegisterBox({ interests, gifts }) {
  const matches = useMemo(() => {
    if (!interests?.length || !gifts?.length) return [];
    const donors = interests.filter((i) => i.donor_name);
    const found = [];
    for (const g of gifts) {
      if (!g.counterparty) continue;
      for (const d of donors) {
        if (namesOverlap(d.donor_name, g.counterparty)) found.push({ donor: d, gift: g });
      }
    }
    return found;
  }, [interests, gifts]);

  if (matches.length === 0) return null;

  return (
    <CardShell title="Same Name, Two Registers">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
        An organisation or individual appears in both this MP's declared financial interests and the separate
        register of ministerial gifts and hospitality. This is a factual name overlap only, not evidence of
        anything improper, ministers routinely meet and receive hospitality from many of the same organisations
        active in public life more broadly.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {matches.map((m, i) => (
          <div key={i} style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: COLORS.ink, marginBottom: 6 }}>
              {m.gift.counterparty}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5, marginBottom: 4 }}>
              <strong style={{ color: COLORS.ink }}>Declared interest:</strong> {m.donor.summary}
              {m.donor.date_registered && ` · ${formatDate(m.donor.date_registered)}`}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
              <strong style={{ color: COLORS.ink }}>Ministerial register:</strong> {m.gift.kind}
              {m.gift.department && ` · ${m.gift.department}`}
              {m.gift.date_or_period && ` · ${m.gift.date_or_period}`}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function CurrentRolesBox({ interests }) {
  const roles = useMemo(
    () => interests.filter((item) => ONGOING_ROLE_CATEGORIES.includes(item.category)),
    [interests]
  );
  if (roles.length === 0) return null;

  return (
    <CardShell title="Current Outside Roles">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
        Ongoing paid roles or jobs outside Parliament, as declared in the register, separate from one-off payments
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
