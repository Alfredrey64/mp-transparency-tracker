import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { getDonorSector, sectorColor, normalizeDonorKey, donorSectorMetadata } from "../lib/donorSectors";
import { partyColour, formatDate } from "../lib/format";
import { PageHeader } from "./shared";
import { IconInfluence } from "./icons";
import { CompanyDonorsView } from "./CompanyDonorsView";
import { withScrollPreserved } from "../lib/preserveScroll";
import { fetchAllRows } from "../lib/supabasePagination";

const UNTAGGED_COLOR = COLORS.inkSoft;
const UNTAGGED_LABEL = "Untagged / individual donors";

// Some declared entries have no real donor name in the source data — just a
// parsed fragment like "Agreement starting 08 July 2025" (usually outside
// employment income, not a donation). The value still counts toward totals,
// it just can't be attributed to a named donor.
const NOT_A_REAL_DONOR = /^(agreement( starting.*)?|payment received.*|undisclosed|n\/a)$/i;

export default function DonorsLobbying() {
  const [rows, setRows] = useState(null);
  const [expandedSectors, setExpandedSectors] = useState(() => new Set());
  const [expandedDonor, setExpandedDonor] = useState(null);
  const [view, setView] = useState("byDonor");

  function toggleSector(sector) {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  }

  useEffect(() => {
    async function load() {
      const data = await fetchAllRows(() =>
        supabase
          .from("financial_interests")
          .select("donor_name, value_amount, date_registered, politicians(id, name, party, party_colour)")
          .not("value_amount", "is", null)
          .not("donor_name", "is", null)
      );
      setRows(data);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    if (!rows) return null;

    let totalValue = 0;
    let taggedValue = 0;
    const sectorTotals = new Map();
    const sectorByMp = new Map(); // sector -> Map(mpName -> {total, partyColor})
    const sectorDetail = new Map(); // sector -> [{donor, mpName, partyColor, amount}]
    // Keyed by normalised identity, so "Silverstone" and "Silverstone Circuits
    // Ltd" merge into one donor instead of splitting the same money in two.
    const donorTotals = new Map();
    const donorMpDetail = new Map(); // normKey -> [{mpName, partyColor, amount, date}]

    for (const row of rows) {
      const amount = row.value_amount ?? 0;
      totalValue += amount;
      const tag = getDonorSector(row.donor_name);
      const sector = tag?.sector ?? null;
      const mpName = row.politicians?.name ?? "Unknown MP";
      const mpPartyColor = partyColour(row.politicians?.party_colour, COLORS.inkSoft);

      if (sector) {
        taggedValue += amount;
        sectorTotals.set(sector, (sectorTotals.get(sector) ?? 0) + amount);

        if (!sectorByMp.has(sector)) sectorByMp.set(sector, new Map());
        const mpMap = sectorByMp.get(sector);
        const existing = mpMap.get(mpName);
        mpMap.set(mpName, { total: (existing?.total ?? 0) + amount, partyColor: mpPartyColor });

        if (!sectorDetail.has(sector)) sectorDetail.set(sector, []);
        sectorDetail.get(sector).push({ donor: row.donor_name.trim(), mpName, partyColor: mpPartyColor, amount });
      }

      const donorKey = row.donor_name.trim();
      if (NOT_A_REAL_DONOR.test(donorKey)) continue;
      const normKey = normalizeDonorKey(donorKey) || donorKey.toLowerCase();
      if (!donorTotals.has(normKey)) donorTotals.set(normKey, { displayName: donorKey, total: 0, tag: null, mps: new Set() });
      const d = donorTotals.get(normKey);
      d.total += amount;
      if (tag) d.tag = tag;
      if (donorKey.length > d.displayName.length) d.displayName = donorKey;
      if (mpName) d.mps.add(mpName);

      if (!donorMpDetail.has(normKey)) donorMpDetail.set(normKey, []);
      donorMpDetail.get(normKey).push({ mpName, partyColor: mpPartyColor, amount, date: row.date_registered ?? null });
    }

    const untaggedValue = totalValue - taggedValue;

    const sectorBars = [
      { sector: UNTAGGED_LABEL, total: untaggedValue, color: UNTAGGED_COLOR },
      ...[...sectorTotals.entries()].map(([sector, total]) => ({ sector, total, color: sectorColor(sector) })),
    ].sort((a, b) => b.total - a.total);

    const topDonors = [...donorTotals.entries()]
      .map(([normKey, d]) => ({
        key: normKey,
        name: d.displayName,
        total: d.total,
        tag: d.tag,
        mpCount: d.mps.size,
        recipients: (donorMpDetail.get(normKey) ?? []).sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    const sectorLeaderboards = [...sectorByMp.entries()]
      .map(([sector, mpMap]) => ({
        sector,
        color: sectorColor(sector),
        total: sectorTotals.get(sector),
        topMps: [...mpMap.entries()]
          .map(([name, v]) => ({ name, total: v.total, partyColor: v.partyColor }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 3),
        allDonations: (sectorDetail.get(sector) ?? []).sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return { totalValue, taggedValue, untaggedValue, sectorBars, topDonors, sectorLeaderboards };
  }, [rows]);

  if (!stats) {
    return (
      <div style={{ padding: PAGE_PADDING }}>
        <PageHeader icon={IconInfluence} title="Donors & Lobbying" subtitle="Loading…" />
      </div>
    );
  }

  const maxSectorBar = Math.max(1, ...stats.sectorBars.map((s) => s.total));
  const taggedPct = stats.totalValue > 0 ? Math.round((stats.taggedValue / stats.totalValue) * 100) : 0;

  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconInfluence}
        title="Donors & Lobbying"
        subtitle="Who's funding Parliament, grouped by industry where it's confidently identifiable — not a judgement on any MP's views."
        maxWidth={900}
      />

      <EducationSection />

      <div style={{ display: "flex", gap: 2, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 3, marginBottom: 24, width: "fit-content" }}>
        {[
          { key: "byDonor", label: "By Donor & Sector" },
          { key: "byCompany", label: "By Company" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => withScrollPreserved(() => setView(tab.key))}
            style={{
              position: "relative",
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: view === tab.key ? "#fff" : COLORS.inkSoft,
              transition: "color 0.15s",
            }}
          >
            {view === tab.key && (
              <motion.span
                layoutId="donors-view-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                style={{ position: "absolute", inset: 0, background: COLORS.ink, borderRadius: 999, zIndex: 0 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
      {view === "byCompany" ? (
        <motion.div key="byCompany" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeInOut" }}>
          <CompanyDonorsView />
        </motion.div>
      ) : (
        <motion.div key="byDonor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeInOut" }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: COLORS.paperCard,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 28,
          maxWidth: 900,
          fontFamily: FONT_BODY,
          fontSize: 13, lineHeight: 1.6,
          color: COLORS.inkSoft,
        }}
      >
        £{Math.round(stats.taggedValue).toLocaleString()} of £{Math.round(stats.totalValue).toLocaleString()} in declared
        donations (<strong style={{ color: COLORS.ink }}>{taggedPct}%</strong>) is confidently matched to a donor's industry
        so far, using UK company records. The rest is made up of named individuals (deliberately not auto-matched to
        companies, to avoid mistaking a person for an unrelated business) and donors that couldn't be confidently identified.
        See "How this works" below for the full picture.
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 28 }}>
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 14 }}>
            Declared Value by Sector
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.sectorBars.map((s, i) => (
              <motion.div
                key={s.sector}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginBottom: 3 }}>
                  <span>{s.sector}</span>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, color: COLORS.ink }}>£{Math.round(s.total).toLocaleString()}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.total / maxSectorBar) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.05 + i * 0.03, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 999, background: s.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>
            Largest Donors Overall
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            By total declared value, across all MPs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stats.topDonors.map((d, i) => {
              const isOpen = expandedDonor === d.key;
              return (
                <motion.div
                  key={d.key}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  style={{
                    paddingBottom: 8,
                    borderBottom: i < stats.topDonors.length - 1 && !isOpen ? `1px solid ${COLORS.hairline}` : "none",
                  }}
                >
                  <button
                    onClick={() => setExpandedDonor(isOpen ? null : d.key)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%",
                      background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
                    }}
                    title={
                      d.tag?.source === "companies-house"
                        ? `Matched to ${d.tag.companyName} (Companies House ${d.tag.companyNumber}) — SIC ${d.tag.sicCode}`
                        : d.tag?.source === "known-union-list"
                        ? "Identified from a manually curated list of known UK trade unions"
                        : d.tag?.source === "manual-override"
                        ? "Manually verified — automatic company matching was unreliable for this name"
                        : "Not confidently matched to a registered company"
                    }
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.name} <span style={{ color: COLORS.inkSoft, fontSize: 11 }}>{isOpen ? "▾" : "▸"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.tag ? sectorColor(d.tag.sector) : UNTAGGED_COLOR, flexShrink: 0 }} />
                        <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
                          {d.tag?.sector ?? "Untagged"} · {d.mpCount} MP{d.mpCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, flexShrink: 0 }}>
                      £{Math.round(d.total).toLocaleString()}
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
                        <div style={{ padding: "8px 0 4px 4px", display: "flex", flexDirection: "column", gap: 6 }}>
                          {d.recipients.map((r, ri) => (
                            <div key={ri} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.partyColor, flexShrink: 0 }} />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.mpName}</span>
                                {r.date && <span style={{ opacity: 0.7, flexShrink: 0 }}>· {formatDate(r.date)}</span>}
                              </span>
                              <span style={{ fontFamily: FONT_BODY, fontWeight: 700, color: COLORS.ink, flexShrink: 0 }}>£{Math.round(r.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          Who Receives the Most, By Sector
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          The top 3 MPs by declared value for each of the largest sectors.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 32, alignItems: "start" }}>
        {stats.sectorLeaderboards.map((s, i) => {
          const isOpen = expandedSectors.has(s.sector);
          return (
            <motion.div
              key={s.sector}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}
              style={{
                background: isOpen ? `${s.color}0a` : COLORS.paperCard,
                border: `1px solid ${COLORS.hairline}`,
                borderLeft: `5px solid ${s.color}`,
                borderRadius: 12,
                padding: 16,
                transition: "background 0.2s",
              }}
            >
              <button
                onClick={() => toggleSector(s.sector)}
                style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>{s.sector}</span>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: COLORS.ink, flexShrink: 0 }}>£{Math.round(s.total).toLocaleString()}</span>
                </div>
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {s.topMps.map((mp) => (
                  <div key={mp.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", marginRight: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: mp.partyColor, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mp.name}</span>
                    </span>
                    <span style={{ fontFamily: FONT_BODY, fontWeight: 700, color: COLORS.ink, flexShrink: 0 }}>£{Math.round(mp.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toggleSector(s.sector)}
                style={{
                  display: "flex", alignItems: "center", gap: 4, marginTop: 10, background: "none", border: "none",
                  padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, color: s.color,
                }}
              >
                <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }} style={{ display: "inline-block" }}>▸</motion.span>
                {isOpen ? "Hide full list" : `See all ${s.allDonations.length} donations`}
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
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.hairline}`, maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {s.allDonations.slice(0, 40).map((don, di) => (
                        <div key={di} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: don.partyColor, flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {don.donor} → {don.mpName}
                            </span>
                          </span>
                          <span style={{ fontFamily: FONT_BODY, fontWeight: 700, color: COLORS.ink, flexShrink: 0 }}>£{Math.round(don.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      {s.allDonations.length > 40 && (
                        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.inkSoft, opacity: 0.7, fontStyle: "italic" }}>
                          +{s.allDonations.length - 40} more not shown
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
        </motion.div>
      )}
      </AnimatePresence>

      <div
        style={{
          background: COLORS.paperCard,
          border: `1px solid ${COLORS.hairline}`,
          borderTop: `4px solid ${COLORS.ink}`,
          borderRadius: 16,
          padding: "22px clamp(16px, 4vw, 26px)",
          maxWidth: 900,
        }}
      >
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 10 }}>
          How This Works — and Its Limits
        </h2>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.7 }}>
          <p style={{ marginTop: 0 }}>
            Each declared donor is checked against UK Companies House records. If a confident match is found, the
            company's registered industry code is mapped to one of 16 broad sectors above. This tells you what
            industry the <em>donor</em> is in — it is not a claim about what the receiving MP believes or how they vote.
          </p>
          <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: COLORS.ink }}>Names with a title (Mr, Dr, Lord, Baroness…) are excluded outright</strong> —
              that's a reliable signal it's a person, not a company. Everyone else is still checked against Companies
              House, but a match only counts if the company is currently active and its name overlaps closely enough
              with the donor's — loose or partial matches are rejected rather than guessed at.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: COLORS.ink }}>Only the largest ~300 donors by value have been processed</strong>{" "}
              so far — this covers most of the money but not every entry in the register.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: COLORS.ink }}>A company's registered industry code can be a poor proxy</strong>{" "}
              for what a specific donation was actually for, especially for holding companies, consultancies, or PR firms.
            </li>
            <li style={{ marginBottom: 8 }}>
              Hover any donor name to see exactly which company record (or list) a tag came from.
            </li>
            <li>
              This shows correlation, not intent — it does not mean a donation caused any vote or position.
            </li>
          </ul>
        </div>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.7, marginTop: 14, maxWidth: 900 }}>
        Sector tags generated {new Date(donorSectorMetadata.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
        {donorSectorMetadata.donorsTagged} of {donorSectorMetadata.donorsConsidered} top donors tagged ·{" "}
        {donorSectorMetadata.individualsSkipped} excluded as named individuals · minimum match confidence{" "}
        {Math.round(donorSectorMetadata.minMatchConfidence * 100)}%
        {donorSectorMetadata.flaggedForReview ? ` · ${donorSectorMetadata.flaggedForReview} matches removed by an automatic safety check` : ""}.
        This is a snapshot, not a live feed — it needs to be regenerated by hand as new donations are declared.
      </div>
    </div>
  );
}

function EducationCard({ title, children }) {
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "16px 18px", minWidth: 0 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink, margin: "0 0 10px" }}>{title}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </ul>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: COLORS.brass, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>{children}</span>
    </li>
  );
}

function EducationSection() {
  return (
    <div style={{ marginBottom: 32, maxWidth: 1200 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 23, color: COLORS.ink, marginBottom: 4 }}>
        Money & Influence in Parliament, Explained
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 18, maxWidth: 760 }}>
        Before the numbers: what these words actually mean, who regulates them, and why they're politically sensitive
        enough to have their own transparency rules.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <EducationCard title={'What counts as a "donation"?'}>
          <Bullet>
            Covers cash to fund an MP's work, gifts, hospitality (meals, tickets, travel), shareholdings, property,
            and paid outside jobs — all declared in the public{" "}
            <a href="https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/registers-of-interests/register-of-members-financial-interests/" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              Register of Members' Financial Interests
            </a>.
          </Bullet>
          <Bullet>
            Reporting thresholds are deliberately low: <strong style={{ color: COLORS.ink }}>£300</strong> for a
            single gift/hospitality, <strong style={{ color: COLORS.ink }}>£1,500</strong> for donations — both
            within 28 days of receipt.
          </Bullet>
          <Bullet>
            Donations can only legally come from permissible UK sources (registered voters, UK companies, unions) —
            to keep foreign money out of UK politics.
          </Bullet>
          <Bullet>
            Party-level donations are a separate, higher Electoral Commission threshold: £11,180 (£2,230 for
            further donations from the same source in a year).
          </Bullet>
        </EducationCard>

        <EducationCard title="What is lobbying?">
          <Bullet>
            <strong style={{ color: COLORS.ink }}>In-house</strong> — a company's own "public affairs" staff
            contact MPs and ministers directly.
          </Bullet>
          <Bullet>
            <strong style={{ color: COLORS.ink }}>Consultant lobbying</strong> — paid agencies lobby on a client's
            behalf. The only kind covered by the{" "}
            <a href="https://www.legislation.gov.uk/ukpga/2014/4" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              Lobbying Act 2014
            </a>{" "}
            register — and only for direct contact with a minister or permanent secretary, not backbench MPs. Most
            real lobbying, including nearly all in-house lobbying, falls outside it entirely.
          </Bullet>
          <Bullet>
            <strong style={{ color: COLORS.ink }}>APPGs</strong> — cross-party groups often funded or staffed by
            outside organisations with a stake in the topic. See the "APPG Memberships" tab.
          </Bullet>
          <Bullet>
            <strong style={{ color: COLORS.ink }}>The "revolving door"</strong> — former ministers taking jobs in
            industries they used to regulate, overseen (advisory only, not binding) by{" "}
            <a href="https://www.gov.uk/government/organisations/advisory-committee-on-business-appointments" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              ACOBA
            </a>.
          </Bullet>
        </EducationCard>

        <EducationCard title="Why does it matter politically?">
          <Bullet>
            Legitimate side: campaigns cost money, and government benefits from hearing directly from affected
            industries, unions, and experts. Most declared interests here are exactly that — routine and lawful.
          </Bullet>
          <Bullet>
            Concern: money or privileged access could buy influence ordinary constituents don't get — "cash for
            access."
          </Bullet>
          <Bullet>
            That's why disclosure rules exist and keep tightening — from 1990s "cash for questions" to more recent
            undercover lobbying stings.
          </Bullet>
          <Bullet>
            A declared donation isn't evidence of wrongdoing on its own. Transparency just lets you check the
            pattern yourself, rather than take it on trust.
          </Bullet>
        </EducationCard>
      </div>
    </div>
  );
}
