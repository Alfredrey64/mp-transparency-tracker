import PartyChangeNote from "./PartyChangeNote";
import { usePartyChange } from "../lib/usePartyChange";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import PageGuide from "./PageGuide";
import { DeclaredMeaning } from "./MpMeaning";
import ShareButton from "./ShareButton";
import { mpReportSpec } from "../lib/shareSpecs";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable } from "../theme";
import { HeroBand } from "./shared";
import { partyColour, timeInOffice, shortCategory, formatDate, initials, ONGOING_ROLE_CATEGORIES, stripTrailingAmount } from "../lib/format";
import { isWatched, toggleWatch } from "../lib/watchlist";
import { withScrollPreserved } from "../lib/preserveScroll";

// The Career tab pulls in a chart and a chunk of career data, so it loads
// only when someone opens it.
const CareerTab = lazy(() => import("./CareerTab"));
import MpSummary from "./MpSummary";
import MpMoneyProfile from "./MpMoneyProfile";
import DownloadCsvButton from "./DownloadCsvButton";
import { fetchAllRows } from "../lib/supabasePagination";
import { interestColumns, voteColumns } from "../lib/exportColumns";
import { IconStar, IconCoin, IconMeeting, IconGlobe, IconHome, IconEconomy, IconBriefcase, IconQuestion, IconGroup } from "./icons";
import { SectionDivider } from "./shared";
import { BiographyBox, ContactBox, CabinetRoleBox, VotingSummaryBox, RebellionRateBox, RecentActivityBox, StandardsBox, NewsBox, LoadFailedNote } from "./MpCards";
import { FundingBySectorBox, MoneyAndVotesBox, CommitteeConflictsBox, CrossRegisterBox, CurrentRolesBox } from "./MpFundingBoxes";
import { ClaimsTabContent, GiftsTabContent } from "./MpRegisterTabs";
import { ManifestoTabContent } from "./MpManifestoTab";
import { navigate } from "../lib/route";

const DETAIL_TABS = [
  { key: "all", label: "All" },
  { key: "donations", label: "Donations" },
  { key: "claims", label: "Claims" },
  { key: "gifts", label: "Gifts" },
  { key: "roles", label: "Roles" },
  { key: "manifesto", label: "Manifesto" },
  { key: "career", label: "Career" },
];

// Every entry in the register reads as the same flat sentence right now
// regardless of whether it's a £700k ongoing directorship or a £50 bottle
// of wine — this gives each register category its own colour and icon (the
// colours reuse hues already meaningful elsewhere on this site: the same
// orange as "Current Outside Roles", the same teal as Foreign Affairs
// bills, and so on) so a long list of interests reads as distinct kinds of
// thing at a glance, not one undifferentiated column of grey cards.
const DEFAULT_CATEGORY_META = { color: readable("#6B7280"), Icon: IconQuestion };
const CATEGORY_META = {
  "Donations and other support (including loans) for activities as an MP": { color: COLORS.accentText, Icon: IconCoin },
  "Gifts, benefits and hospitality from UK sources": { color: readable("#B0508A"), Icon: IconMeeting },
  "Gifts and benefits from sources outside the UK": { color: readable("#2E6F6F"), Icon: IconGlobe },
  "Visits outside the UK": { color: readable("#2E6F6F"), Icon: IconGlobe },
  "Land and property (within or outside the UK)": { color: readable("#A0522D"), Icon: IconHome },
  Shareholdings: { color: readable("#8A7A3D"), Icon: IconEconomy },
  "Employment and earnings": { color: readable("#F2622A"), Icon: IconBriefcase },
  "Employment and earnings - Ongoing paid employment": { color: readable("#F2622A"), Icon: IconBriefcase },
  "Employment and earnings - Ad hoc payments": { color: readable("#D9A62A"), Icon: IconCoin },
  Miscellaneous: DEFAULT_CATEGORY_META,
  "Family members employed": { color: readable("#6B5B95"), Icon: IconGroup },
  "Family members engaged in third-party lobbying": { color: readable("#7A4B4B"), Icon: IconGroup },
};

function categoryMeta(category) {
  return CATEGORY_META[category] ?? DEFAULT_CATEGORY_META;
}

export default function PoliticianDetail({ politician, onBack, onNavigate }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interestsFailed, setInterestsFailed] = useState(false);
  const [gifts, setGifts] = useState(null);
  const [giftsFailed, setGiftsFailed] = useState(false);
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
      const { data, error } = await supabase
        .from("financial_interests")
        .select("*")
        .eq("politician_id", politician.id)
        .order("date_registered", { ascending: false });
      setInterestsFailed(Boolean(error));
      setInterests(data ?? []);
      setLoading(false);
    }
    load();
  }, [politician.id]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("ministerial_gifts")
        .select("kind, department, date_or_period, description, given_or_received, counterparty, value_amount, outcome, source_url")
        .eq("politician_id", politician.id)
        .order("date_or_period", { ascending: false });
      setGiftsFailed(Boolean(error));
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
  const partyChangeNote = usePartyChange(politician);

  return (
    <motion.div
      key={politician.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ padding: PAGE_PADDING }}
    >
      <HeroBand crumbs={[<button key="b" type="button" className="crumb-btn" onClick={onBack}>All MPs</button>, <span key="n">{politician.name}</span>]} accent={color} wide maxWidth={1200}>
        <div className="mp-band">
          {politician.thumbnail_url && !avatarErrored ? (
            <div className="mp-band-photo" style={{ boxShadow: `0 0 0 3px ${color}` }}>
              <img loading="lazy" decoding="async" src={politician.thumbnail_url} alt="" onError={() => setAvatarErrored(true)} onLoad={() => setAvatarLoaded(true)} style={{ opacity: avatarLoaded ? 1 : 0, transition: "opacity 0.25s ease" }} />
            </div>
          ) : (
            <div className="mp-band-photo" style={{ boxShadow: `0 0 0 3px ${color}`, fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: "#fff", background: color === "#FFFFFF" ? "#444" : "rgba(255,255,255,0.12)" }}>
              {initials(politician.name)}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 className="page-hero-title" style={{ fontSize: "clamp(30px, 5vw, 46px)" }}>{politician.name}</h1>
              <button
                type="button"
                onClick={() => setWatched(toggleWatch(politician))}
                aria-pressed={watched}
                title={watched ? "Remove from your watchlist" : "Add to your watchlist"}
                aria-label={watched ? "Remove from your watchlist" : "Add to your watchlist"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.4)", background: watched ? "#fff" : "rgba(255,255,255,0.1)", color: watched ? "#0B1B33" : "#fff", cursor: "pointer", transition: "background 0.15s, color 0.15s" }}
              >
                <IconStar size={18} filled={watched} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 10px", fontFamily: FONT_BODY, fontSize: 17, color: "var(--c-on-navy-soft)", marginTop: 8, lineHeight: 1.4 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", color: "#fff", fontWeight: 600 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: color, boxShadow: "0 0 0 2px rgba(255,255,255,0.75)", flexShrink: 0 }} />
                {politician.party}
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => { navigate(`#/constituency/${encodeURIComponent(politician.constituency)}`); }}
                title="See how this constituency voted and what people there are petitioning for"
                style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "#fff", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}
              >
                {politician.constituency}
              </button>
              {office && <span style={{ flexBasis: "100%", fontSize: 15 }}>MP for {office}</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 18 }}>
              <ShareButton
                filename={`${politician.name}-report-card`}
                label="Share report card"
                getSpec={async () => {
                  const [careers, rows, questions, money] = await Promise.all([
                    import("../data/mpCareers.json").then((m) => m.default),
                    fetchAllRows(() => supabase.from("voting_records").select("title, date, voted_with_party_majority").eq("politician_id", politician.id).order("date", { ascending: false })).catch(() => []),
                    supabase.from("written_questions").select("*", { count: "exact", head: true }).eq("politician_id", politician.id).then((r) => r.count ?? 0).catch(() => 0),
                    import("../lib/mpMoney").then((m) => m.topSources(interests, 4)),
                  ]);
                  const counted = rows.filter((r) => r.voted_with_party_majority !== null && r.voted_with_party_majority !== undefined);
                  const votes = counted.length ? { cast: counted.length, withParty: counted.filter((r) => r.voted_with_party_majority).length, against: counted.filter((r) => !r.voted_with_party_majority).map((r) => ({ title: r.title, date: r.date })), hasParty: !/^(independent|speaker)/i.test(politician.party ?? "") } : null;
                  return mpReportSpec({ politician, career: careers.mps[politician.parliament_member_id], votes, interests, expenses: politician.ipsa_expenses ?? null, committees: myCommittees.map((c) => c.name), questions, topSources: money, link: window.location.href });
                }}
                style={{ color: "#fff", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, minHeight: 40, padding: "0 16px" }}
              />
              {totalDeclaredValue > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 16px", borderRadius: 8, background: "#fff", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: "#0B1B33" }}>
                  £{Math.round(totalDeclaredValue).toLocaleString()} total declared value
                </span>
              )}
            </div>
          </div>
        </div>
      </HeroBand>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ paddingBottom: 18, borderBottom: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          <PartyChangeNote change={partyChangeNote} style={{ margin: "0 auto", maxWidth: 560 }} />
          <DeclaredMeaning politician={politician} total={totalDeclaredValue} />
          <SectionDivider />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 22px", paddingTop: 14 }}>
          {interests.length > 0 && (
            <DownloadCsvButton
              label="Download their declared interests (CSV)"
              slug={`${politician.name}-declared-interests`}
              columns={interestColumns(() => politician)}
              rows={interests}
            />
          )}
          <DownloadCsvButton
            label="Download their voting record (CSV)"
            slug={`${politician.name}-votes`}
            columns={voteColumns(politician)}
            loadRows={() => fetchAllRows(() => supabase.from("voting_records").select("*").eq("politician_id", politician.id).order("date", { ascending: false }))}
          />
        </div>

        <MpSummary
          politician={politician}
          interests={interests}
          interestsLoading={loading}
          interestsFailed={interestsFailed}
          gifts={gifts}
          committees={myCommittees}
        />

        <PageGuide viewKey="mp" style={{ maxWidth: 760, marginLeft: "auto", marginRight: "auto", marginTop: 20 }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 24, paddingTop: 24, alignItems: "start" }}>
          {/* ---- Left column: financial interests ---- */}
          <div style={activeTab === "career" ? { gridColumn: "1 / -1" } : undefined}>
            <div
              className="mp-bill-track"
              style={{ position: "relative", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 4, paddingBottom: 12, overflowX: "auto" }}
            >
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => withScrollPreserved(() => setActiveTab(tab.key))}
                  style={{
                    position: "relative",
                    flexShrink: 0,
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
                <GiftsTabContent gifts={gifts} failed={giftsFailed} />
              ) : activeTab === "manifesto" ? (
                <ManifestoTabContent politician={politician} />
              ) : activeTab === "career" ? (
                <Suspense fallback={<div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft, padding: "20px 0" }}>Loading career…</div>}>
                  <CareerTab politician={politician} />
                </Suspense>
              ) : (
                <>
                  {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading declared interests…</div>}

                  {!loading && interestsFailed && <LoadFailedNote item="declared financial interests" />}

                  {!loading && !interestsFailed && filteredInterests.length === 0 && (
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
                      style={{ display: "flex", flexDirection: "column", gap: 12 }}
                    >
                      {filteredInterests.map((item, i) => {
                        const meta = categoryMeta(item.category);
                        return (
                          <motion.div
                            key={item.id}
                            className="contrib glow"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                            style={{ "--k": meta.color }}
                          >
                            <span aria-hidden="true" className="contrib-bar" />
                            <div className="contrib-icon" style={{ color: readable(meta.color) }}>
                              <meta.Icon size={20} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: readable(meta.color), marginBottom: 5 }}>
                                {shortCategory(item.category)}
                              </div>
                              <div style={{ fontFamily: FONT_BODY, fontSize: 17, fontWeight: 500, color: COLORS.ink, lineHeight: 1.4 }}>
                                {stripTrailingAmount(item.summary)}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8, fontSize: 13.5, color: COLORS.inkSoft }}>
                                {item.date_registered && <span style={{ fontFamily: FONT_BODY }}>{formatDate(item.date_registered)}</span>}
                                {item.date_registered && item.source_url && <span aria-hidden="true">·</span>}
                                {item.source_url && (
                                  <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY, textDecoration: "underline", textUnderlineOffset: 3 }}>
                                    source ↗<span className="sr-only"> (opens in a new tab)</span>
                                  </a>
                                )}
                              </div>
                            </div>
                            {item.value_amount && (
                              <div className="contrib-amount" style={{ color: readable(meta.color) }}>
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
          <div style={{ display: activeTab === "career" ? "none" : "flex", flexDirection: "column", gap: 16 }}>
            <MpMoneyProfile interests={interests} loading={loading} />
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
