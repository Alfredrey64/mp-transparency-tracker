import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import PageGuide from "./PageGuide";
import { DeclaredMeaning } from "./MpMeaning";
import ShareButton from "./ShareButton";
import { mpShareSpec } from "../lib/shareSpecs";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable } from "../theme";
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
              <img loading="lazy" decoding="async"
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
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "2px 8px", fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 5, lineHeight: 1.4 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                {politician.party}
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => { navigate(`#/constituency/${encodeURIComponent(politician.constituency)}`); }}
                title="See how this constituency voted and what people there are petitioning for"
                style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}
              >
                {politician.constituency}
              </button>
              {office && <span style={{ flexBasis: "100%", textAlign: "center", fontSize: 14 }}>MP for {office}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
              <ShareButton
                filename={`${politician.name}-simple-politics`}
                getSpec={async () => {
                  const career = (await import("../data/mpCareers.json")).default.mps[politician.parliament_member_id];
                  return mpShareSpec({ politician, career, interestCount: interests.length, totalDeclared: totalDeclaredValue, link: window.location.href });
                }}
              />
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
            <DeclaredMeaning politician={politician} total={totalDeclaredValue} />
            <SectionDivider />
          </div>
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

        <PageGuide viewKey="mp" style={{ maxWidth: 760, margin: "20px auto 0" }} />

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
                              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, color: readable(meta.color), marginBottom: 6 }}>
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
                              <div style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 16.5, fontWeight: 700, color: readable(meta.color), whiteSpace: "nowrap", marginRight: 8 }}>
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
