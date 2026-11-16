import { useState, useEffect, useMemo } from "react";
import PageLead from "./PageLead";
import { shortMoney } from "../lib/shortMoney";
import WhatThisMeans from "./WhatThisMeans";
import { partyConcentrationMeaning } from "../lib/moneyMeaning";
import { m as motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable } from "../theme";
import { getPartyDonorSector, sectorColor, partyDonorSectorMetadata } from "../lib/donorSectors";
import { getDonorProfile, publicFundDescription } from "../lib/donorProfiles";
import { normaliseIndividualDonorName, donorGroupingKey, preferDisplayName } from "../lib/donorNames";
import { fetchAllRows } from "../lib/supabasePagination";
import { LoadFailedNote } from "./MpCards";
import { PageHeader } from "./shared";
import { withScrollPreserved } from "../lib/preserveScroll";
import { IconPartyFinance } from "./icons";
import Loading from "./Loading";
import { FOLD } from "../lib/foldMotion";
import PartyFlag from "./PartyFlag";
import LeaderPortrait from "./LeaderPortrait";
import { FLAG_OF } from "../lib/partyFlags";
import { bannerColours } from "../lib/partyBrand";
import { canonicalParty } from "../lib/donorParty";
import { addFact, dateSpan, typeSummary, ecRecordUrl, companiesHouseUrl } from "../lib/donorFacts";
import LEADERS from "../data/partyLeaders.json";
import "../partyfinances.css";

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

// What the register itself records for one donor in one party's box: the gifts, their dates, the largest, how they were made, who else the donor gave to, and links to check the
// record. All of it is worked out from the donation rows, so it is there for every donor and follows the data.
// Two letters for the round badge beside a donor: first and last name for a person, the first two words for anything else (a company, a state fund).
function initials(name, status) {
  const words = name.replace(/[^\p{L}\s'-]/gu, " ").split(/\s+/).filter((w) => w && !/^(the|of|and|ltd|limited|plc|llp)$/i.test(w));
  if (!words.length) return "?";
  const pick = status === "Individual" && words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 2);
  return pick.map((w) => w[0].toUpperCase()).join("");
}

function DonorFacts({ d }) {
  const f = d.facts;
  if (!f) return null;
  const span = dateSpan(f);
  const record = ecRecordUrl(f.ref);
  const company = d.status === "Individual" ? null : companiesHouseUrl(f.company);
  const also = d.others.slice(0, 4);
  return (
    <div className="pf-d-more">
      <dl className="pf-d-facts">
        <div><dt>Donations</dt><dd>{f.count}</dd></div>
        {span && <div><dt>Accepted</dt><dd>{span}</dd></div>}
        {f.count > 1 && f.biggest > 0 && <div><dt>Largest</dt><dd>£{Math.round(f.biggest).toLocaleString()}</dd></div>}
        <div><dt>Made as</dt><dd>{typeSummary(f.types)}</dd></div>
      </dl>
      {also.length > 0 && (
        <p className="pf-d-also">
          Also gave to {also.map(([party, total], i) => <span key={party}>{i > 0 ? (i === also.length - 1 ? " and " : ", ") : ""}<b>{party}</b> (£{Math.round(total).toLocaleString()})</span>)}
          {d.others.length > also.length ? ` and ${d.others.length - also.length} more` : ""}.
        </p>
      )}
      {(record || company) && (
        <p className="pf-d-links">
          {record && <a href={record} target="_blank" rel="noreferrer">{f.count > 1 ? "Largest donation in the Electoral Commission register" : "Donation in the Electoral Commission register"} ↗</a>}
          {company && <a href={company} target="_blank" rel="noreferrer">Company {f.company} at Companies House ↗</a>}
        </p>
      )}
    </div>
  );
}

// One box for each party: a banner in the party's colour with its flag behind and its leader's portrait on the right (the same look as the Party History cards), the money it
// received, and, when opened, its largest donors as a plain list. The banner is the button; the portrait and flag are decoration.
function PartyCard({ p, i, isOpen, onToggle }) {
  const canon = canonicalParty(p.name);
  const leader = canon ? LEADERS.leaders[canon] : null;
  const flag = canon ? FLAG_OF[canon] : null;
  const brand = /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#5B6577";
  const b = bannerColours(brand);
  const panelId = `pf-${i}`;
  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}
      className="pf-card"
      data-open={isOpen ? "1" : "0"}
      data-dark={b.dark ? "1" : "0"}
      style={{ "--c": brand, "--b1": b.from, "--b2": b.to, "--on": b.on }}
    >
      <header className="pf-banner">
        <div className="pf-art" aria-hidden="true"><span className="pf-pattern" />{flag && <PartyFlag kind={flag} />}</div>
        <h3 className="pf-head">
          <button type="button" className="pf-hit" aria-expanded={isOpen} aria-controls={panelId} onClick={onToggle}>
            <span className="pf-title">
              <span className="pf-name">{p.name}</span>
              <span className="pf-meta">{p.donors.length} donor{p.donors.length === 1 ? "" : "s"}</span>
              {leader && <span className="pf-led">{leader.role === "President" ? "President" : "Leader"} <b>{leader.name}</b></span>}
            </span>
            <span className="pf-total"><span className="pf-sum"><small>Received</small><b>{shortMoney(p.total)}</b><em>£{Math.round(p.total).toLocaleString()}</em></span><i className="pf-chev" aria-hidden="true" /></span>
          </button>
        </h3>
        {leader && <LeaderPortrait leader={leader} />}
      </header>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div id={panelId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={FOLD} style={{ overflow: "hidden" }}>
            <ol className="pf-donors">
              {p.donors.map((d, idx) => {
                const tag = getPartyDonorSector(d.name);
                const profile = getDonorProfile(d.name);
                const description = profile?.description ?? (d.status === "Public Fund" ? publicFundDescription(d.name) : null);
                const badgeColor = d.status === "Public Fund" ? COLORS.accent : tag ? sectorColor(tag.sector) : NEUTRAL_TAG_COLOR;
                const share = p.total > 0 ? (d.total / p.total) * 100 : 0;
                return (
                  <li key={d.name} className="pf-donor">
                    <div className="pf-d-head">
                      <span className="pf-d-av" aria-hidden="true">{initials(d.name, d.status)}<i>{idx + 1}</i></span>
                      <div className="pf-d-top">
                        <span className="pf-d-who">
                          <span className="pf-d-name">{d.name}</span>
                          <span className="pf-d-tag" style={{ color: readable(badgeColor), background: `${badgeColor}1a` }}>{d.status}</span>
                        </span>
                        <span className="pf-d-amt"><b>£{Math.round(d.total).toLocaleString()}</b><small>{share < 1 ? "under 1%" : `${Math.round(share)}%`} of the party's total</small></span>
                      </div>
                    </div>
                    <div className="pf-d-body">
                      <i className="pf-d-bar" aria-hidden="true"><u style={{ width: `${Math.max(1.5, Math.min(100, share))}%` }} /></i>
                      {description && (
                        <p className="pf-d-desc">
                          {description}
                          {profile?.sourceUrl && <a className="pf-d-src" href={profile.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}
                        </p>
                      )}
                      <DonorFacts d={d} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function PartyFinances() {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [expandedParty, setExpandedParty] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchAllRows(() =>
        supabase
          .from("party_donations")
          .select("party_name, donor_name, donor_status, value, donation_type, accepted_date, received_date, ec_ref, company_registration_number")
          .not("value", "is", null)
          .not("donor_name", "is", null)
          .order("id", { ascending: true })
      );
      setRows(data);
    }
    load().catch(() => setFailed(true));
  }, []);

  const stats = useMemo(() => {
    if (!rows) return null;

    let totalValue = 0;
    let taggedValue = 0;
    const partyTotals = new Map();
    const partyDonors = new Map(); // party -> Map(donorKey -> {name, total})
    const sectorTotals = new Map();
    const givingBy = new Map(); // donorKey -> Map(party -> total)

    for (const row of rows) {
      const value = row.value ?? 0;
      const rawName = row.donor_name.trim();
      if (NOT_A_REAL_DONOR.test(rawName)) continue;
      // The register itself is inconsistent about how a donor's name is
      // spelled between donations — an individual with or without a title,
      // a company with or without punctuation, sometimes in ALL CAPS.
      // donorGroupingKey merges those into one donor instead of splitting
      // their giving across several look-alike entries; preferDisplayName
      // then picks the more readable of the spellings actually seen to show
      // the reader, rather than displaying the aggressive grouping key.
      const donorGroupKey = donorGroupingKey(rawName, row.donor_status);
      const displayName = row.donor_status === "Individual" ? normaliseIndividualDonorName(rawName) : rawName;

      totalValue += value;
      partyTotals.set(row.party_name, (partyTotals.get(row.party_name) ?? 0) + value);

      if (!partyDonors.has(row.party_name)) partyDonors.set(row.party_name, new Map());
      const donorMap = partyDonors.get(row.party_name);
      const existing = donorMap.get(donorGroupKey);
      donorMap.set(donorGroupKey, {
        key: donorGroupKey,
        name: preferDisplayName(existing?.name, displayName),
        total: (existing?.total ?? 0) + value,
        status: row.donor_status,
        facts: addFact(existing?.facts, row),
      });
      // the same donor's giving across every party, so a donor's box can say who else they gave to
      const given = givingBy.get(donorGroupKey) ?? new Map();
      given.set(row.party_name, (given.get(row.party_name) ?? 0) + value);
      givingBy.set(donorGroupKey, given);

      const tag = getPartyDonorSector(displayName);
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
        donors: [...partyDonors.get(name).values()]
          .map((d) => ({ ...d, others: [...(givingBy.get(d.key) ?? [])].filter(([party]) => party !== name).sort((a, b) => b[1] - a[1]) }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);

    const sectorBars = [...sectorTotals.entries()]
      .map(([sector, total]) => ({ sector, total, color: sectorColor(sector) }))
      .sort((a, b) => b.total - a.total);

    return { totalValue, taggedValue, parties, sectorBars };
  }, [rows]);

  if (!stats) {
    return (
      <div className="editorial" style={{ padding: PAGE_PADDING }}>
        <PageHeader icon={IconPartyFinance} title="Who funds the parties" subtitle="Donations made directly to political parties over the last 12 months. This is a separate system from MPs' own declared interests, regulated and published by the Electoral Commission rather than Parliament." />
        {failed ? <LoadFailedNote item="the party donation figures" /> : <Loading />}
      </div>
    );
  }

  const maxPartyBar = Math.max(1, ...stats.parties.map((p) => p.total));
  const maxSectorBar = Math.max(1, ...stats.sectorBars.map((s) => s.total));
  const taggedPct = stats.totalValue > 0 ? Math.round((stats.taggedValue / stats.totalValue) * 100) : 0;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconPartyFinance}
        title="Who funds the parties"
        subtitle="Donations made directly to political parties over the last 12 months. This is a separate system from MPs' own declared interests, regulated and published by the Electoral Commission rather than Parliament."
        maxWidth={900}
      />

      <div className="editorial-body">

      <PageLead
        colour="#E8741A"
        figure={{ value: shortMoney(stats.totalValue), label: "given to parties", sub: "in the last 12 months" }}
        facts={[
          { value: String(stats.parties.length), label: "parties received money", sub: "from registered donors" },
          { value: shortMoney(stats.parties[0]?.total), label: `went to ${stats.parties[0]?.name?.replace(/ and Unionist Party/, "")}`, sub: `${Math.round(((stats.parties[0]?.total ?? 0) / Math.max(1, stats.totalValue)) * 100)}% of the total`, share: (stats.parties[0]?.total ?? 0) / Math.max(1, stats.totalValue) },
          { value: `${taggedPct}%`, label: "traced to an industry", sub: "the rest is individuals or unmatched", share: taggedPct / 100 },
        ]}
        steps={[
          { title: "Start with the totals", text: "The bars show how much each party was given. Longer means more money." },
          { title: "See where it came from", text: "The industry panel groups donors by the kind of business they work in, where that can be shown with confidence." },
          { title: "Open a party", text: "The list further down opens to name that party's biggest donors, with what is known about each." },
        ]}
      />

      {/* The actual numbers, first — this used to sit below a rules
          explainer and three separate text boxes, most of which just
          repeated what the page subtitle already says. Real content
          belongs above the reference material, not after it. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: 24, marginTop: 24, marginBottom: 20 }}>
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 14 }}>
            Total Declared by Party
          </div>
          <WhatThisMeans result={partyConcentrationMeaning({ parties: stats.parties })} style={{ marginTop: 0, marginBottom: 14 }} />
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
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No data yet. Check back after the next daily update.</div>
            )}
          </div>
        </div>

        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>
            Money by Industry
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            {stats.totalValue > 0
              ? `£${Math.round(stats.taggedValue).toLocaleString()} of £${Math.round(stats.totalValue).toLocaleString()} confidently matched to an industry (${taggedPct}%): the rest is named individuals or unidentifiable donors.`
              : "Across all parties, where confidently identifiable"}
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

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "12px 16px",
          marginBottom: 32, maxWidth: "none", fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft,
        }}
      >
        <strong style={{ color: COLORS.ink }}>Missing a donation you saw in the news?</strong> Parties file quarterly,
        with up to 20 working days after the quarter ends, so recent press reports can lag the official register by
        a few months. That's a gap in the reporting timeline, not in this site's data; it's picked up automatically
        once filed.
      </div>

      <PartyFinanceRulesSection />

      <div style={{ marginBottom: 16, marginTop: 8 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>Party by Party</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 0 }}>
          Click a party to see its largest individual donors in this period.
        </p>
      </div>

      <div className="pf-list">
        {stats.parties.map((p, i) => <PartyCard key={p.name} p={p} i={i} isOpen={expandedParty === p.name} onToggle={() => withScrollPreserved(() => setExpandedParty(expandedParty === p.name ? null : p.name))} />)}
      </div>

      {partyDonorSectorMetadata.generatedAt && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 14, maxWidth: "none" }}>
          Sector tags generated {new Date(partyDonorSectorMetadata.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
          {partyDonorSectorMetadata.donorsTagged} of {partyDonorSectorMetadata.donorsConsidered} top donors tagged.
          This is a snapshot, not a live feed.
        </div>
      )}
      </div>
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
      <span style={{ marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: COLORS.accent, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55 }}>{children}</span>
    </li>
  );
}

function PartyFinanceRulesSection() {
  return (
    <div style={{ marginTop: 24, marginBottom: 4, maxWidth: "none" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginBottom: 4 }}>
        How Party Funding Is Actually Regulated
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 18, maxWidth: 760 }}>
        A quick, straightforward guide to the rules behind the numbers below, set out in the Political Parties,
        Elections and Referendums Act 2000 (as amended), and enforced by the Electoral Commission.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 16 }}>
        <RuleCard title="What counts as a reportable donation">
          <RuleBullet>
            Cash, gifts, loans on non-commercial terms, sponsorship, and free or discounted services all count, not just cheques.
          </RuleBullet>
          <RuleBullet>
            A party has to report any single donation over <strong style={{ color: COLORS.ink }}>£11,180</strong> to
            its central organisation, or <strong style={{ color: COLORS.ink }}>£2,230</strong> to one of its local
            accounting units (a constituency association, for example), thresholds set well below what MPs
            themselves have to declare.
          </RuleBullet>
          <RuleBullet>
            Reports go to the Electoral Commission quarterly in normal times, and weekly during the run-up to an
            election, which is why donation activity often spikes sharply just before one.
          </RuleBullet>
        </RuleCard>

        <RuleCard title="Who is allowed to give">
          <RuleBullet>
            Only "permissible" UK sources can donate: registered voters, companies that trade in the UK, trade
            unions, and a handful of other UK-based organisations.
          </RuleBullet>
          <RuleBullet>
            Foreign money and anonymous donations are banned outright: a party that accepts one is legally required
            to hand it back or forfeit it to the Treasury.
          </RuleBullet>
          <RuleBullet>
            Donating is separate from spending: parties also face their own campaign spending limits at elections,
            a different cap from how much they're allowed to raise.
          </RuleBullet>
        </RuleCard>

        <RuleCard title={'Not every "donor" below is a donor'}>
          <RuleBullet>
            Entries like "House of Commons" or "Electoral Commission" aren't gifts from a person or company, they're{" "}
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
