import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { getPartyDonorSector, sectorColor, partyDonorSectorMetadata } from "../lib/donorSectors";
import { getDonorProfile, publicFundDescription } from "../lib/donorProfiles";
import { fetchAllRows } from "../lib/supabasePagination";
import { PageHeader } from "./shared";
import { IconPartyFinance } from "./icons";

// The Electoral Commission's own party names don't always match the short
// forms used elsewhere on this site (party_colour on politicians comes from
// a different API entirely) — so this maps the party-name strings that
// actually appear in the donations register to a recognisable brand colour,
// the same regex-matching approach Timeline.jsx uses for historic parties.
function ecPartyColor(name) {
  if (/labour/i.test(name)) return "#C8102E";
  if (/conservative/i.test(name)) return "#0087DC";
  if (/scottish national|\bsnp\b/i.test(name)) return "#C9A227";
  if (/liberal democrat/i.test(name)) return "#FAA61A";
  if (/green/i.test(name)) return "#6AB023";
  if (/reform uk/i.test(name)) return "#12B6CF";
  if (/plaid cymru/i.test(name)) return "#3F8428";
  if (/democratic unionist|\bdup\b/i.test(name)) return "#D46A4C";
  if (/sinn f[eé]in/i.test(name)) return "#326760";
  if (/ulster unionist|\buup\b/i.test(name)) return "#68A0DC";
  if (/social democratic.*labour|\bsdlp\b/i.test(name)) return "#4C9A4C";
  if (/^alliance/i.test(name)) return "#F6CB2F";
  if (/traditional unionist|\btuv\b/i.test(name)) return "#4A3A8A";
  return COLORS.inkSoft;
}

const NOT_A_REAL_DONOR = /^(agreement( starting.*)?|payment received.*|undisclosed|n\/a)$/i;

// A fixed hex, not COLORS.inkSoft — that resolves through a CSS var, which
// breaks the `${color}1a` alpha-suffix trick used for the status pill's
// background below.
const NEUTRAL_TAG_COLOR = "#8A94A3";

export default function PartyFinances() {
  const [rows, setRows] = useState(null);
  const [expandedParty, setExpandedParty] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchAllRows(() =>
        supabase
          .from("party_donations")
          .select("party_name, donor_name, donor_status, value")
          .not("value", "is", null)
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
    const partyTotals = new Map();
    const partyDonors = new Map(); // party -> Map(donorKey -> {name, total})
    const sectorTotals = new Map();

    for (const row of rows) {
      const value = row.value ?? 0;
      const donorKey = row.donor_name.trim();
      if (NOT_A_REAL_DONOR.test(donorKey)) continue;

      totalValue += value;
      partyTotals.set(row.party_name, (partyTotals.get(row.party_name) ?? 0) + value);

      if (!partyDonors.has(row.party_name)) partyDonors.set(row.party_name, new Map());
      const donorMap = partyDonors.get(row.party_name);
      const existing = donorMap.get(donorKey);
      donorMap.set(donorKey, {
        name: donorKey,
        total: (existing?.total ?? 0) + value,
        status: row.donor_status,
      });

      const tag = getPartyDonorSector(donorKey);
      if (tag) {
        taggedValue += value;
        sectorTotals.set(tag.sector, (sectorTotals.get(tag.sector) ?? 0) + value);
      }
    }

    const parties = [...partyTotals.entries()]
      .map(([name, total]) => ({
        name,
        total,
        color: ecPartyColor(name),
        donors: [...partyDonors.get(name).values()].sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);

    const sectorBars = [...sectorTotals.entries()]
      .map(([sector, total]) => ({ sector, total, color: sectorColor(sector) }))
      .sort((a, b) => b.total - a.total);

    return { totalValue, taggedValue, parties, sectorBars };
  }, [rows]);

  if (!stats) {
    return (
      <div style={{ padding: PAGE_PADDING }}>
        <PageHeader icon={IconPartyFinance} title="Party Finances" subtitle="Loading…" />
      </div>
    );
  }

  const maxPartyBar = Math.max(1, ...stats.parties.map((p) => p.total));
  const maxSectorBar = Math.max(1, ...stats.sectorBars.map((s) => s.total));
  const taggedPct = stats.totalValue > 0 ? Math.round((stats.taggedValue / stats.totalValue) * 100) : 0;

  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconPartyFinance}
        title="Party Finances"
        subtitle="Donations made directly to political parties over the last 12 months — a separate regime and dataset from MPs' own declared interests, regulated and published by the Electoral Commission rather than Parliament."
        maxWidth={900}
      />

      <PartyFinanceRulesSection />

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
          marginBottom: 28, maxWidth: 900, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        This is different from the "Donors & Lobbying" tab, which covers what individual MPs personally declare.
        This covers money given straight to a party's central or local accounts — reported to the{" "}
        <a href="https://search.electoralcommission.org.uk/" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
          Electoral Commission
        </a>{" "}
        under a higher threshold (£11,180, or £2,230 for further donations from the same source in a year). It's a
        rolling 12-month window, refreshed daily, not a full historical record.
      </div>

      {stats.totalValue > 0 && (
        <div
          style={{
            background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
            marginBottom: 28, maxWidth: 900, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
          }}
        >
          £{Math.round(stats.taggedValue).toLocaleString()} of £{Math.round(stats.totalValue).toLocaleString()} declared
          to parties in this period (<strong style={{ color: COLORS.ink }}>{taggedPct}%</strong>) is confidently matched
          to a donor's industry, using UK company records and the Electoral Commission's own donor-type data. The rest
          is named individuals (deliberately not auto-matched to companies) and donors that couldn't be confidently
          identified.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 32 }}>
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 14 }}>
            Total Declared by Party
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.parties.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginBottom: 3 }}>
                  <span>{p.name}</span>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, color: COLORS.ink }}>£{Math.round(p.total).toLocaleString()}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(p.total / maxPartyBar) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.05 + i * 0.03, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 999, background: p.color }}
                  />
                </div>
              </motion.div>
            ))}
            {stats.parties.length === 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No data yet — check back after the next daily update.</div>
            )}
          </div>
        </div>

        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>
            Money by Industry
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            Across all parties, where confidently identifiable
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
            {stats.sectorBars.length === 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No sector-tagged donations yet.</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>Party by Party</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 0 }}>
          Click a party to see its largest individual donors in this period.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {stats.parties.map((p, i) => {
          const isOpen = expandedParty === p.name;
          return (
            <motion.div
              key={p.name}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}
              style={{
                background: isOpen ? `${p.color}0a` : COLORS.paperCard,
                border: `1px solid ${COLORS.hairline}`,
                borderLeft: `5px solid ${p.color}`,
                borderRadius: 12,
                padding: 18,
              }}
            >
              <button
                onClick={() => setExpandedParty(isOpen ? null : p.name)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", gap: 12 }}
              >
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink }}>{p.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                    {p.donors.length} donor{p.donors.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15, color: COLORS.ink }}>£{Math.round(p.total).toLocaleString()}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: COLORS.inkSoft, fontSize: 13 }}>▾</motion.span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ marginTop: 16, paddingTop: 4, borderTop: `1px solid ${COLORS.hairline}`, maxHeight: 420, overflowY: "auto" }}>
                      {p.donors.slice(0, 40).map((d, di) => {
                        const tag = getPartyDonorSector(d.name);
                        const profile = getDonorProfile(d.name);
                        const description = profile?.description ?? (d.status === "Public Fund" ? publicFundDescription(d.name) : null);
                        const badgeColor = d.status === "Public Fund" ? COLORS.brass : tag ? sectorColor(tag.sector) : NEUTRAL_TAG_COLOR;
                        const isLast = di === Math.min(p.donors.length, 40) - 1;
                        return (
                          <div key={d.name} style={{ padding: "12px 0", borderBottom: isLast ? "none" : `1px solid ${COLORS.hairline}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: badgeColor, flexShrink: 0 }} />
                                <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {d.name}
                                </span>
                                <span
                                  style={{
                                    flexShrink: 0, fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                                    color: badgeColor, background: `${badgeColor}1a`, padding: "2px 8px", borderRadius: 999,
                                  }}
                                >
                                  {d.status}
                                </span>
                              </div>
                              <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: COLORS.ink, flexShrink: 0 }}>
                                £{Math.round(d.total).toLocaleString()}
                              </span>
                            </div>
                            {description && (
                              <div
                                style={{
                                  marginTop: 8, marginLeft: 15, paddingLeft: 12, borderLeft: `2px solid ${badgeColor}55`,
                                  fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.6,
                                }}
                              >
                                {description}
                                {profile?.sourceUrl && (
                                  <>
                                    {" "}
                                    ·{" "}
                                    <a href={profile.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 600 }}>
                                      source ↗
                                    </a>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {p.donors.length > 40 && (
                        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, opacity: 0.7, fontStyle: "italic", paddingTop: 12 }}>
                          +{p.donors.length - 40} more not shown
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

      {partyDonorSectorMetadata.generatedAt && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.7, marginTop: 14, maxWidth: 900 }}>
          Sector tags generated {new Date(partyDonorSectorMetadata.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
          {partyDonorSectorMetadata.donorsTagged} of {partyDonorSectorMetadata.donorsConsidered} top donors tagged.
          This is a snapshot, not a live feed.
        </div>
      )}
    </div>
  );
}

function RuleCard({ title, children }) {
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "18px 20px", minWidth: 0 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink, margin: "0 0 10px" }}>{title}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </ul>
    </div>
  );
}

function RuleBullet({ children }) {
  return (
    <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: COLORS.brass, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55 }}>{children}</span>
    </li>
  );
}

function PartyFinanceRulesSection() {
  return (
    <div style={{ marginTop: 24, marginBottom: 4, maxWidth: 1200 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginBottom: 4 }}>
        How Party Funding Is Actually Regulated
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 18, maxWidth: 760 }}>
        A quick, plain-language guide to the rules behind the numbers below — set out in the Political Parties,
        Elections and Referendums Act 2000 (as amended), and enforced by the Electoral Commission.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <RuleCard title="What counts as a reportable donation">
          <RuleBullet>
            Cash, gifts, loans on non-commercial terms, sponsorship, and free or discounted services all count —
            not just cheques.
          </RuleBullet>
          <RuleBullet>
            A party has to report any single donation over <strong style={{ color: COLORS.ink }}>£11,180</strong> to
            its central organisation, or <strong style={{ color: COLORS.ink }}>£2,230</strong> to one of its local
            accounting units (a constituency association, for example) — thresholds set well below what MPs
            themselves have to declare.
          </RuleBullet>
          <RuleBullet>
            Reports go to the Electoral Commission quarterly in normal times, and weekly during the run-up to an
            election — which is why donation activity often spikes sharply just before one.
          </RuleBullet>
        </RuleCard>

        <RuleCard title="Who's actually allowed to give">
          <RuleBullet>
            Only "permissible" UK sources can donate: registered voters, companies that trade in the UK, trade
            unions, and a handful of other UK-based organisations.
          </RuleBullet>
          <RuleBullet>
            Foreign money and anonymous donations are banned outright — a party that accepts one is legally required
            to hand it back or forfeit it to the Treasury.
          </RuleBullet>
          <RuleBullet>
            Donating is separate from spending: parties also face their own campaign spending limits at elections,
            a different cap from how much they're allowed to raise.
          </RuleBullet>
        </RuleCard>

        <RuleCard title={'Not every "donor" below is a donor'}>
          <RuleBullet>
            Entries like "House of Commons" or "Electoral Commission" aren't gifts from a person or company — they're{" "}
            <strong style={{ color: COLORS.ink }}>Short Money</strong> and{" "}
            <strong style={{ color: COLORS.ink }}>Policy Development Grants</strong>, state funding Parliament pays
            opposition parties to do their job.
          </RuleBullet>
          <RuleBullet>
            The House of Lords equivalent is called <strong style={{ color: COLORS.ink }}>Cranborne Money</strong>;
            the devolved legislatures each run their own version too.
          </RuleBullet>
          <RuleBullet>
            The register records both the same way, so this site labels the state-funding ones explicitly wherever
            they appear below, rather than letting them read as a mega-donation from an anonymous "donor."
          </RuleBullet>
        </RuleCard>
      </div>
    </div>
  );
}
