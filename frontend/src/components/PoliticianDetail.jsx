import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { partyColour, timeInOffice, shortCategory, formatDate, initials, ONGOING_ROLE_CATEGORIES, stripTrailingAmount } from "../lib/format";
import { getDonorSector, sectorColor } from "../lib/donorSectors";
import { sectorToBillCategory } from "../lib/sectorBillMapping";
import { sectorToCommittee } from "../lib/sectorCommitteeMapping";
import { categoriseBill, matchBillForVote } from "../lib/bills";
import { findManifesto } from "../data/partyManifestos";
import { manifestoSectionToBillCategory } from "../lib/manifestoBillMapping";
import { getBillDescription } from "../lib/billDescriptions";
import { isWatched, toggleWatch } from "../lib/watchlist";
import { withScrollPreserved } from "../lib/preserveScroll";
import { IconStar, IconCoin, IconMeeting, IconGlobe, IconHome, IconEconomy, IconBriefcase, IconQuestion, IconGroup } from "./icons";
import {
  SectionDivider,
  CardShell,
  BiographyBox,
  ContactBox,
  CabinetRoleBox,
  VotingSummaryBox,
  RebellionRateBox,
  RecentActivityBox,
  StandardsBox,
  NewsBox,
} from "./shared";

const DETAIL_TABS = [
  { key: "all", label: "All" },
  { key: "donations", label: "Donations" },
  { key: "claims", label: "Claims" },
  { key: "gifts", label: "Gifts" },
  { key: "roles", label: "Roles" },
  { key: "manifesto", label: "Manifesto" },
];

// Every entry in the register reads as the same flat sentence right now
// regardless of whether it's a £700k ongoing directorship or a £50 bottle
// of wine — this gives each register category its own colour and icon (the
// colours reuse hues already meaningful elsewhere on this site: the same
// orange as "Current Outside Roles", the same teal as Foreign Affairs
// bills, and so on) so a long list of interests reads as distinct kinds of
// thing at a glance, not one undifferentiated column of grey cards.
const DEFAULT_CATEGORY_META = { color: "#6B7280", Icon: IconQuestion };
const CATEGORY_META = {
  "Donations and other support (including loans) for activities as an MP": { color: COLORS.accent, Icon: IconCoin },
  "Gifts, benefits and hospitality from UK sources": { color: "#B0508A", Icon: IconMeeting },
  "Gifts and benefits from sources outside the UK": { color: "#2E6F6F", Icon: IconGlobe },
  "Visits outside the UK": { color: "#2E6F6F", Icon: IconGlobe },
  "Land and property (within or outside the UK)": { color: "#A0522D", Icon: IconHome },
  Shareholdings: { color: "#8A7A3D", Icon: IconEconomy },
  "Employment and earnings": { color: "#F2622A", Icon: IconBriefcase },
  "Employment and earnings - Ongoing paid employment": { color: "#F2622A", Icon: IconBriefcase },
  "Employment and earnings - Ad hoc payments": { color: "#D9A62A", Icon: IconCoin },
  Miscellaneous: DEFAULT_CATEGORY_META,
  "Family members employed": { color: "#6B5B95", Icon: IconGroup },
  "Family members engaged in third-party lobbying": { color: "#7A4B4B", Icon: IconGroup },
};

function categoryMeta(category) {
  return CATEGORY_META[category] ?? DEFAULT_CATEGORY_META;
}

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

// Cross-references two things that never otherwise appear on the same
// page: which select committee an MP sits on, and which industries their
// declared donors are in. A committee's remit is public and an MP's
// committee membership is their own choice (subject to their party's
// approval), so an MP scrutinising the same industry as their donors is a
// real, checkable fact — not proof the donation bought the seat. Committee
// places are handed out based on an MP's background and interests, which is
// very often exactly why someone with, say, pharmaceutical donors ends up
// on the Health and Social Care Committee in the first place.
function CommitteeConflictsBox({ interests, myCommittees }) {
  const conflicts = useMemo(() => {
    if (myCommittees.length === 0) return [];
    const bySector = groupInterestsBySector(interests);
    return bySector
      .map((s) => {
        const targetCommittee = sectorToCommittee(s.sector);
        if (!targetCommittee) return null;
        const committee = myCommittees.find((c) => c.name === targetCommittee);
        if (!committee) return null;
        return { sector: s.sector, color: s.color, sectorTotal: s.total, donations: s.donations, committeeName: committee.name };
      })
      .filter(Boolean);
  }, [interests, myCommittees]);

  if (conflicts.length === 0) return null;

  return (
    <CardShell title="Committee & Donor Overlap">
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
        Where this MP sits on a select committee that scrutinises the same industry as one of their declared donors.
        This is a factual overlap, not evidence of undue influence — committee places reflect an MP's background and
        interests, which is very often exactly why it lines up with their donors' industry.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {conflicts.map((c) => (
          <div key={c.sector} style={{ background: `${c.color}0c`, border: `1px solid ${c.color}33`, borderRadius: 10, padding: "10px 13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                <strong>£{Math.round(c.sectorTotal).toLocaleString()}</strong> from {c.sector} donors
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                  + {c.donations.length - 5} more — see the Donations tab above.
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
function CrossRegisterBox({ interests, gifts }) {
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
        anything improper — ministers routinely meet and receive hospitality from many of the same organisations
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

// The "Claims" tab: a compact IPSA summary (this year vs last, by category)
// followed by every itemised claim behind it, so it's clear not just how
// much was claimed but what it was actually for.
function ClaimsTabContent({ politician, claims }) {
  const summary = politician.ipsa_expenses;

  if (!summary) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
        No IPSA business cost data available for this MP yet.
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.accent}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.ink }}>
            £{summary.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
            claimed in {summary.year.replace("_", "/20")}
          </span>
        </div>
        {summary.previousYear && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 10 }}>
            vs £{summary.previousYear.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} in {summary.previousYear.year.replace("_", "/20")}
          </div>
        )}
        {summary.byCategory?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {summary.byCategory.map((c) => (
              <span key={c.category} style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, background: COLORS.paper, padding: "3px 9px", borderRadius: 999 }}>
                {c.category} · £{c.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
          Business costs (staffing, travel, accommodation, office running costs) claimed through IPSA — separate from
          their salary and from the donations shown under the Donations tab.{" "}
          <a
            href="https://www.theipsa.org.uk/mp-staffing-business-costs/your-mp"
            target="_blank"
            rel="noreferrer"
            style={{ color: COLORS.ink, fontWeight: 600 }}
          >
            Full record on IPSA's site ↗
          </a>
        </div>
      </div>

      {claims.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
          No itemised claims recorded for {summary.year.replace("_", "/20")} yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {claims.map((c, i) => (
            <div key={i} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "11px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink }}>
                  {c.category}{c.expenseType && c.expenseType !== c.category ? ` · ${c.expenseType}` : ""}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: COLORS.accent, flexShrink: 0,
                    lineHeight: 1.5, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", background: `${COLORS.accent}14`,
                    padding: "2px 9px", borderRadius: 999,
                  }}
                >
                  £{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {c.description && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>{c.description}</div>
              )}
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, opacity: 0.8, marginTop: 3 }}>{formatDate(c.date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// One manifesto policy area, its actual promises, and — where the heading
// maps onto a trackable bill category — how this MP voted on legislation
// touching that same area. Matched by title against Commons divisions, the
// same imperfect-but-reasonable heuristic VotingRecords.jsx and
// MoneyAndVotesBox already use elsewhere on this site.
function ManifestoSectionCard({ section }) {
  const hasCategory = Boolean(section.targetCategory);
  const hasVotes = section.relatedBills.length > 0;

  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: COLORS.ink, marginBottom: 8 }}>{section.heading}</div>
      <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>
        {section.points.map((p, i) => (
          <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 4, lineHeight: 1.5 }}>{p}</li>
        ))}
      </ul>
      {!hasCategory ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, fontStyle: "italic" }}>
          No single legislation category maps cleanly onto this policy area.
        </div>
      ) : !hasVotes ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
          No recorded {section.targetCategory} votes for this MP in the tracked period yet.
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 10 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            How they voted on {section.targetCategory} legislation
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {section.relatedBills.map((bill) => (
              <div key={bill.short_title}>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: COLORS.ink, marginBottom: 2 }}>
                  {bill.short_title}
                </div>
                {bill.description && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 7, lineHeight: 1.5 }}>
                    {bill.description}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {bill.votes.map((v, i) => {
                    const stageLabel = v.title.startsWith(bill.short_title)
                      ? v.title.slice(bill.short_title.length).replace(/^:?\s*/, "")
                      : v.title;
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", paddingLeft: 10 }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {stageLabel}
                        </span>
                        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", padding: "1px 7px", borderRadius: 999,
                              background: v.voted_aye ? "#E4EEE7" : "#F3E4E2", color: v.voted_aye ? "#2F6F4E" : "#9C3B3B",
                            }}
                          >
                            {v.voted_aye ? "Aye" : "No"}
                          </span>
                          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>{formatDate(v.date)}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// The "Manifesto" tab: this MP's own party's 2024 manifesto, section by
// section, next to their actual votes on legislation in the same policy
// area. Deliberately doesn't try to score a pledge as "kept" or "broken" —
// manifesto text is too broad for that to be defensible — it just puts the
// promise and the voting record side by side and lets the reader judge.
function ManifestoTabContent({ politician }) {
  const [votes, setVotes] = useState(null);
  const [bills, setBills] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: b }] = await Promise.all([
        supabase.from("voting_records").select("title, date, voted_aye").eq("politician_id", politician.id),
        supabase.from("bills").select("short_title, long_title, sponsoring_department"),
      ]);
      setVotes(v ?? []);
      setBills(b ?? []);
    }
    load();
  }, [politician.id]);

  const manifesto = useMemo(() => findManifesto(politician.party), [politician.party]);
  const loading = votes === null || bills === null;

  const sections = useMemo(() => {
    if (!manifesto?.sections || loading) return null;
    const categorisedBills = bills.map((b) => ({ ...b, category: categoriseBill(b) }));
    return manifesto.sections.map((section) => {
      const targetCategory = manifestoSectionToBillCategory(section.heading);
      const relatedVotes = targetCategory
        ? votes
            .map((v) => ({ ...v, bill: matchBillForVote(v.title, categorisedBills) }))
            .filter((v) => v.bill?.category.label === targetCategory)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        : [];

      // Grouped by bill rather than shown as one long flat list of
      // near-identically-named clause/amendment votes — a real description
      // once per bill (see lib/billDescriptions.js — falling back to the
      // official long_title, which is usually generic boilerplate) does
      // far more to make "New Clause 142" legible than the vote title
      // alone ever could.
      const relatedBills = [];
      const billIndex = new Map();
      for (const v of relatedVotes) {
        const key = v.bill.short_title;
        if (!billIndex.has(key)) {
          const entry = { short_title: v.bill.short_title, description: getBillDescription(v.bill.short_title, v.bill.long_title), votes: [] };
          billIndex.set(key, entry);
          relatedBills.push(entry);
        }
        billIndex.get(key).votes.push(v);
      }

      return { ...section, targetCategory, relatedBills };
    });
  }, [manifesto, votes, bills, loading]);

  if (!manifesto) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
        No 2024 manifesto on record for {politician.party ?? "this MP's party"}.
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.accent}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.55 }}>
          {manifesto.shortName}'s {manifesto.manifestoYear} manifesto, <em>{manifesto.manifestoTitle}</em> — summarised
          independently rather than reproduced (manifestos are copyrighted) — matched below against{" "}
          {politician.name.split(" ").slice(-1)[0]}'s actual Commons votes in the same policy area. Votes are matched
          by title against official divisions, which can occasionally miss one or pick up an unrelated vote with a
          similar name; a policy area with none listed just means no matching bill has come to a vote yet, not that
          nothing has happened.
        </div>
        <a href={manifesto.manifestoUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.accent }}>
          Read {manifesto.shortName}'s full manifesto ↗
        </a>
      </div>

      {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>Checking voting history…</div>}

      {!loading && sections && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sections.map((section) => (
            <ManifestoSectionCard key={section.heading} section={section} />
          ))}
        </div>
      )}

      {!loading && !sections && manifesto.highlights?.length > 0 && (
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.ink, marginBottom: 10 }}>Key manifesto commitments</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {manifesto.highlights.map((h, i) => (
              <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, marginBottom: 6, lineHeight: 1.5 }}>{h}</li>
            ))}
          </ul>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
            This party's manifesto isn't broken into the policy-area sections used elsewhere on this site, so votes
            can't be matched to a specific pledge here.
          </div>
        </div>
      )}
    </div>
  );
}

// The "Gifts" tab — only ever populated for the MPs currently holding a
// government post; everyone else just sees the explanatory empty state.
function GiftsTabContent({ gifts }) {
  if (gifts === null) {
    return <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>;
  }

  if (gifts.length === 0) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0", lineHeight: 1.6 }}>
        No ministerial gifts or hospitality declared for this MP — this register only applies to MPs currently
        holding a government post.
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
        Declared under the Cabinet Office's monthly Register of Ministers' Gifts and Hospitality — covers this
        ministerial role, not their personal financial interests shown under Donations.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gifts.map((g, i) => (
          <div key={i} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "11px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 4 }}>
              <span
                style={{
                  fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                  color: COLORS.accent, background: `${COLORS.accent}18`, padding: "2px 8px", borderRadius: 999,
                }}
              >
                {g.kind}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>{g.department}</span>
              {g.given_or_received && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>· {g.given_or_received}</span>
              )}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.4 }}>
              {g.description || "(no description given)"}
              {g.counterparty && <span style={{ color: COLORS.inkSoft }}> — {g.given_or_received === "Given" ? "to" : "from"} {g.counterparty}</span>}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>
              {g.date_or_period}
              {g.value_amount != null && ` · £${g.value_amount.toLocaleString()}`}
              {g.outcome && g.outcome !== "N/A" ? ` · ${g.outcome}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PoliticianDetail({ politician, onBack, onNavigate }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [avatarErrored, setAvatarErrored] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [watched, setWatched] = useState(() => isWatched(politician.id));
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    supabase.from("committees").select("id, name, members").then(({ data }) => setCommittees(data ?? []));
  }, []);

  const myCommittees = useMemo(
    () => committees.filter((c) => (c.members ?? []).some((m) => m.parliament_member_id === politician.parliament_member_id)),
    [committees, politician.parliament_member_id]
  );

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

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("ministerial_gifts")
        .select("kind, department, date_or_period, description, given_or_received, counterparty, value_amount, outcome, source_url")
        .eq("politician_id", politician.id)
        .order("date_or_period", { ascending: false });
      setGifts(data ?? []);
    }
    load();
  }, [politician.id]);

  const claims = politician.ipsa_expenses?.claims ?? [];

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
                  width: 32, height: 32, borderRadius: "50%", border: `1px solid ${watched ? COLORS.accent : COLORS.hairline}`,
                  background: watched ? `${COLORS.accent}14` : "transparent", color: watched ? COLORS.accent : COLORS.inkSoft,
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
                  borderRadius: 999, background: `${COLORS.accent}14`, fontFamily: FONT_BODY, fontSize: 13,
                  fontWeight: 700, color: COLORS.accent,
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
                  onClick={() => withScrollPreserved(() => setActiveTab(tab.key))}
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
                      style={{ position: "absolute", inset: 0, background: COLORS.accent, borderRadius: 999, zIndex: -1 }}
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeTab === "claims" ? (
                <ClaimsTabContent politician={politician} claims={claims} />
              ) : activeTab === "gifts" ? (
                <GiftsTabContent gifts={gifts} />
              ) : activeTab === "manifesto" ? (
                <ManifestoTabContent politician={politician} />
              ) : (
                <>
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
                      {filteredInterests.map((item, i) => {
                        const meta = categoryMeta(item.category);
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                            style={{
                              display: "flex", alignItems: "center", gap: 14,
                              padding: "14px 16px", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`,
                              borderLeft: `3px solid ${meta.color}`, borderRadius: 12,
                            }}
                          >
                            <div
                              style={{
                                flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: `${meta.color}1c`, color: meta.color,
                              }}
                            >
                              <meta.Icon size={16} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, color: meta.color, marginBottom: 6 }}>
                                {shortCategory(item.category)}
                              </div>
                              <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: COLORS.ink, lineHeight: 1.4 }}>
                                {stripTrailingAmount(item.summary)}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, color: COLORS.inkSoft }}>
                                {item.date_registered && <span style={{ fontFamily: FONT_BODY }}>{formatDate(item.date_registered)}</span>}
                                {item.date_registered && item.source_url && <span>·</span>}
                                {item.source_url && (
                                  <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY }}>
                                    source ↗
                                  </a>
                                )}
                              </div>
                            </div>
                            {item.value_amount && (
                              <div style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 16.5, fontWeight: 700, color: meta.color, whiteSpace: "nowrap" }}>
                                £{Number(item.value_amount).toLocaleString()}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          {/* ---- Right column: everything else ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BiographyBox politician={politician} />
            <CurrentRolesBox interests={interests} />
            <FundingBySectorBox interests={interests} />
            <MoneyAndVotesBox politician={politician} interests={interests} />
            <CommitteeConflictsBox interests={interests} myCommittees={myCommittees} />
            <CrossRegisterBox interests={interests} gifts={gifts} />
            <CabinetRoleBox politician={politician} />
            <VotingSummaryBox politician={politician} onNavigate={onNavigate} />
            <RebellionRateBox politician={politician} />
            <RecentActivityBox politician={politician} onNavigate={onNavigate} />
            <StandardsBox politician={politician} />
            <NewsBox politician={politician} />
            <ContactBox politician={politician} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
