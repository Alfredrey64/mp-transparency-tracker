import { useWatchlistChanges } from "../lib/useWatchlistChanges";
import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, readable, solid } from "../theme";
import { formatDate, partyColour, shortCategory, timeAgo } from "../lib/format";
import pipelineStatus from "../data/pipelineStatus.json";
import { categoriseBill } from "../lib/bills";
import { getWatchlist, removeFromWatchlist } from "../lib/watchlist";
import { IconSearch, IconCoin, IconBills, IconInfluence, IconPetition, IconGroup, IconRoute, IconTrend, IconAsk, IconPin, IconSwing, IconCompareTime, IconGlossary, IconClassroom } from "./icons";
import { LoadFailedNote } from "./MpCards";
import { PartyHemicycle } from "./PartyHemicycle";
import { withScrollPreserved } from "../lib/preserveScroll";
import Loading from "./Loading";
import { keyboardActivate } from "../lib/a11y";

// One orchestrated reveal for the masthead (headline + ticker rail together,
// staggered as a single moment) rather than every section fading in
// independently as it scrolls into view — the latter is the generic default
// this page used to lean on.
const revealParent = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const revealChild = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

// The look shared by the white panels further down the page.
const panel = { background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, boxShadow: "var(--shadow-1)", padding: "clamp(18px, 3vw, 26px)" };
const panelTitle = { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em", lineHeight: 1.25, color: COLORS.ink, margin: 0 };

const money = (n) => Number(n).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 });

function yearsAgo(year) {
  const n = new Date().getFullYear() - year;
  return n === 1 ? "1 year ago" : `${n} years ago`;
}

const CHANGE_FEED_TYPES = {
  donation: { icon: IconCoin, color: "#F2622A", label: "Declared interest" },
  bill: { icon: IconBills, color: "#9B4FE0", label: "Bill update" },
  gift: { icon: IconInfluence, color: "#D9A62A", label: "Ministerial gift" },
  petition: { icon: IconPetition, color: "#1FA97C", label: "Petition response" },
};

// What the site can do, one tile each. Every destination keeps the accent its section uses in the sidebar, so a colour learned
// here means the same thing everywhere else.
const FEATURES = [
  { key: "myMP", label: "Find your MP", line: "See who represents you, how they vote and what they have declared.", icon: IconPin, color: "#1E4FB8" },
  { key: "followTheMoney", label: "Follow the money", line: "Trace a donor to every MP and party they have given money to.", icon: IconSearch, color: "#F2622A" },
  { key: "voting", label: "Understand the bills", line: "Plain-English guides to the laws being debated, and how MPs voted.", icon: IconBills, color: "#9B4FE0" },
  { key: "answers", label: "Ask a question", line: "Why is housing so expensive? Get a short answer, the latest figures and what each party says.", icon: IconAsk, color: "#2F80ED" },
  { key: "economy", label: "See the numbers", line: "Prices, jobs, housing, crime and more, in charts you can actually read.", icon: IconTrend, color: "#0E9AA7" },
  { key: "marginals", label: "Check your seat", line: "How close your seat was at the last election, and what could flip it.", icon: IconSwing, color: "#E5484D" },
  { key: "indicators", label: "Compare over time", line: "Pick any figures and watch how they moved under each government.", icon: IconCompareTime, color: "#D9A62A" },
  { key: "glossary", label: "Learn the language", line: "A jargon buster for the words used in politics and the news.", icon: IconGlossary, color: "#C0478A" },
];

// A quiet line for anyone following MPs: how many new things there are for
// them since the Watchlist was last opened. Shows nothing when there is
// nothing, or when this browser follows no one.
function WatchlistNote({ onNavigate }) {
  const watch = useWatchlistChanges();
  if (!watch || watch.changes === 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
      <button
        type="button"
        onClick={() => onNavigate?.("watchlist")}
        style={{ display: "flex", alignItems: "center", gap: 10, background: "#F2622A14", border: "1px solid #F2622A55", borderRadius: 999, padding: "9px 18px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}
      >
        <span style={{ minWidth: 22, height: 22, padding: "0 6px", boxSizing: "border-box", borderRadius: 999, background: solid("#F2622A"), color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{watch.changes > 99 ? "99+" : watch.changes}</span>
        New since you last looked, for the {watch.following} MP{watch.following === 1 ? "" : "s"} you follow
      </button>
    </div>
  );
}

function CountUp({ value }) {
  const [display, setDisplay] = useState(0);
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!value) return;
    const controls = animate(mv, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, mv]);

  return <>{value ? display : "…"}</>;
}

export default function Home({ onBrowse, onNavigate, onViewProfile, mpCount }) {
  const [activeTab, setActiveTab] = useState("donations");
  const [donations, setDonations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentFailed, setRecentFailed] = useState(false);
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [constituencyQuery, setConstituencyQuery] = useState("");
  const [watchlist, setWatchlist] = useState(() => getWatchlist());
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [onThisDay, setOnThisDay] = useState(null);
  const [recentChanges, setRecentChanges] = useState(null);
  const [parliamentTab, setParliamentTab] = useState("changes");

  useEffect(() => {
    async function loadRecent() {
      const [donationsRes, rolesRes] = await Promise.all([
        supabase
          .from("financial_interests")
          .select("id, summary, value_amount, date_registered, donor_name, category, politicians(id, name, party, party_colour)")
          .not("value_amount", "is", null)
          .order("date_registered", { ascending: false })
          .order("id", { ascending: false })
          .limit(7),
        supabase
          .from("financial_interests")
          .select("id, summary, date_registered, category, politicians(id, name, party, party_colour)")
          .eq("category", "Employment and earnings")
          .not("date_registered", "is", null)
          .order("date_registered", { ascending: false })
          .order("id", { ascending: false })
          .limit(7),
      ]);
      setRecentFailed(Boolean(donationsRes.error || rolesRes.error));
      setDonations(donationsRes.data ?? []);
      setRoles(rolesRes.data ?? []);
      setLoading(false);
    }
    loadRecent();
  }, []);

  useEffect(() => {
    async function loadExtras() {
      const [politiciansRes, billsRes] = await Promise.all([
        supabase.from("politicians").select("id, name, party, party_colour, constituency, thumbnail_url"),
        supabase
          .from("bills")
          .select("*")
          .not("next_sitting_date", "is", null)
          .order("next_sitting_date", { ascending: true })
          .limit(7),
      ]);
      setAllPoliticians(politiciansRes.data ?? []);
      setUpcomingBills(billsRes.data ?? []);
      setLoadingExtras(false);
    }
    loadExtras();
  }, []);

  useEffect(() => {
    async function loadOnThisDay() {
      const { data } = await supabase.from("on_this_day").select("*").order("year", { ascending: false });
      setOnThisDay(data ?? []);
    }
    loadOnThisDay();
  }, []);

  useEffect(() => {
    async function loadRecentChanges() {
      const [donationsRes, billsRes, giftsRes, petitionsRes] = await Promise.all([
        supabase
          .from("financial_interests")
          .select("id, summary, value_amount, date_registered, donor_name, politicians(id, name)")
          .not("value_amount", "is", null)
          .order("date_registered", { ascending: false })
          .order("id", { ascending: false })
          .limit(4),
        supabase
          .from("bills")
          .select("bill_id, short_title, current_stage, last_updated, sponsoring_department")
          .not("last_updated", "is", null)
          .order("last_updated", { ascending: false })
          .limit(4),
        supabase
          .from("ministerial_gifts")
          .select("id, department, kind, date_or_period, description, politicians(id, name)")
          .order("date_or_period", { ascending: false })
          .limit(3),
        supabase
          .from("petitions")
          .select("id, action, government_responded_at, signature_count")
          .not("government_responded_at", "is", null)
          .order("government_responded_at", { ascending: false })
          .limit(3),
      ]);

      const donationItems = (donationsRes.data ?? []).map((d) => ({
        type: "donation", date: d.date_registered,
        title: d.politicians?.name ?? "Unknown MP",
        detail: `${d.donor_name ?? d.summary}${d.value_amount ? ` · £${money(d.value_amount)}` : ""}`,
        politicianId: d.politicians?.id ?? null,
      }));
      const billItems = (billsRes.data ?? []).map((b) => ({
        type: "bill", date: b.last_updated,
        title: b.short_title,
        detail: `${b.current_stage ?? "Stage update"}${b.sponsoring_department ? ` · ${b.sponsoring_department}` : ""}`,
        billId: b.bill_id,
      }));
      const giftItems = (giftsRes.data ?? []).map((g) => ({
        type: "gift", date: g.date_or_period,
        title: g.politicians?.name ?? "Minister",
        detail: `${g.description ?? g.kind}${g.department ? ` · ${g.department}` : ""}`,
        politicianId: g.politicians?.id ?? null,
      }));
      const petitionItems = (petitionsRes.data ?? []).map((p) => ({
        type: "petition", date: p.government_responded_at,
        title: p.action,
        detail: `Government responded · ${p.signature_count?.toLocaleString() ?? "?"} signatures`,
      }));

      const all = [...donationItems, ...billItems, ...giftItems, ...petitionItems]
        .filter((i) => i.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);
      setRecentChanges(all);
    }
    loadRecentChanges();
  }, []);

  const items = activeTab === "donations" ? donations : roles;
  const donationsTotal = useMemo(
    () => donations.reduce((sum, d) => sum + (d.value_amount ?? 0), 0),
    [donations]
  );

  const politicianById = useMemo(() => {
    const map = new Map();
    for (const p of allPoliticians) map.set(p.id, p);
    return map;
  }, [allPoliticians]);

  const constituencyMatches = useMemo(() => {
    const q = constituencyQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return allPoliticians.filter((p) => p.constituency?.toLowerCase().includes(q)).slice(0, 6);
  }, [allPoliticians, constituencyQuery]);

  function handleSelectPolitician(p) {
    onViewProfile?.(p);
  }

  function handleSelectPoliticianById(id) {
    const p = politicianById.get(id);
    if (p) handleSelectPolitician(p);
  }

  function handleChangeFeedClick(item) {
    if (item.type === "bill") onNavigate?.("voting", item.billId ? { bill_id: item.billId } : undefined);
    else if (item.type === "donation" || item.type === "gift") handleSelectPoliticianById(item.politicianId);
    else if (item.type === "petition") onNavigate?.("petitions");
  }

  function handleRemoveWatched(id) {
    removeFromWatchlist(id);
    setWatchlist(getWatchlist());
  }

  const statItems = [
    { value: <CountUp value={mpCount} />, label: "MPs tracked" },
    pipelineStatus.generatedAt
      ? { value: timeAgo(pipelineStatus.generatedAt), label: "last updated" }
      : { value: "Daily", label: "kept up to date" },
    { value: "Official", label: "source data only" },
  ];

  const switcher = (tabs, current, set) => (
    <div className="seg seg-sm" role="group" aria-label="Choose a list">
      {tabs.map((tab) => (
        <button key={tab.key} type="button" className="seg-btn hit-tab" aria-pressed={current === tab.key} onClick={() => withScrollPreserved(() => set(tab.key))} style={{ "--c": "#F2622A" }}>
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <motion.div className="home-hero-inner" initial="hidden" animate="visible" variants={revealParent}>
          <div className="home-hero-copy">
            <motion.p variants={revealChild} className="home-pill"><span aria-hidden="true" />Independent and unofficial</motion.p>
            <motion.h1 variants={revealChild} id="home-title">A simple breakdown of UK politics.</motion.h1>
            <motion.p variants={revealChild} className="home-lede">
              Who your MP is, who funds them, how they vote and what the numbers say about the country. Everything comes from
              official sources and is explained in plain English, with no jargon and no spin.
            </motion.p>
            <motion.div variants={revealChild} className="home-cta">
              <button type="button" className="btn btn-lg btn-on-navy" onClick={onBrowse}><IconGroup size={18} />Browse MPs</button>
              <button type="button" className="tour-link" onClick={() => onNavigate?.("start")}>
                <span aria-hidden="true"><IconRoute size={20} /></span>
                <span><b>Never used this before?</b><small>Take the five-minute guided tour</small></span>
              </button>
              <button type="button" className="tour-link" style={{ "--ic": "#7A5AF0" }} onClick={() => onNavigate?.("teacher")}>
                <span aria-hidden="true"><IconClassroom size={20} /></span>
                <span><b>Teaching a class?</b><small>Open Teacher mode</small></span>
              </button>
            </motion.div>
            <motion.dl variants={revealChild} className="home-stats">
              {statItems.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
          <motion.div variants={revealChild} className="home-hero-visual">
            {allPoliticians.length > 0 ? (
              <>
                <PartyHemicycle politicians={allPoliticians} onSelectParty={() => onNavigate?.("list")} legendCount={6} light />
                <p className="home-hero-caption"><b>The Commons, seat by seat.</b> Every current seat, coloured by party. Hover a party below to pick it out. Labour (Co-op) MPs are Labour MPs who also belong to the Co-operative Party.</p>
              </>
            ) : (
              <div className="home-hero-placeholder" aria-hidden="true" />
            )}
          </motion.div>
        </motion.div>
      </section>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(28px, 5vw, 48px) clamp(16px, 5vw, 24px) 24px", position: "relative" }}>
        <WatchlistNote onNavigate={onNavigate} />

        <section aria-labelledby="h-can-do" style={{ marginBottom: 48 }}>
          <h2 id="h-can-do" style={{ ...panelTitle, fontSize: "clamp(26px, 3.4vw, 34px)" }}>What you can do here</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: COLORS.inkSoft, lineHeight: 1.6, margin: "8px 0 24px", maxWidth: 560 }}>
            Pick a starting point. Every page explains itself as you go.
          </p>
          <div className="home-features">
            {FEATURES.map((f) => (
              <button key={f.key} type="button" className="feature-card glow" onClick={() => onNavigate?.(f.key)} style={{ "--f": f.color, "--k": f.color }}>
                <span className="feature-icon"><f.icon size={22} /></span>
                <span className="feature-title">{f.label}</span>
                <span className="feature-line">{f.line}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="home-grid">
          <div className="home-col">
          <section aria-labelledby="h-interests" style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
              <h2 id="h-interests" style={panelTitle}>Latest declared interests</h2>
              {switcher([{ key: "donations", label: "Donations" }, { key: "roles", label: "Roles" }], activeTab, setActiveTab)}
            </div>

            {activeTab === "donations" && !loading && donations.length > 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginBottom: 12 }}>
                <strong style={{ fontFamily: FONT_MONO, color: readable("#F2622A") }}>£{Math.round(donationsTotal).toLocaleString()}</strong> declared
                across these {donations.length} entries
              </div>
            )}

            {loading && <Loading compact />}
            {!loading && recentFailed && <LoadFailedNote item="recent declared interests" />}
            {!loading && !recentFailed && items.length === 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, padding: "10px 0" }}>No entries found.</div>
            )}

            {!loading && items.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="row-link"
                    onClick={() => handleSelectPoliticianById(item.politicians?.id)}
                    {...(item.politicians?.id ? keyboardActivate(() => handleSelectPoliticianById(item.politicians.id)) : {})}
                    style={{ borderBottom: i < items.length - 1 ? `1px solid ${COLORS.hairline}` : "none", cursor: item.politicians?.id ? "pointer" : "default" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: COLORS.ink }}>{item.politicians?.name ?? "Unknown MP"}</div>
                        {item.politicians?.party && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyColour(item.politicians.party_colour, COLORS.inkSoft), flexShrink: 0 }} />
                            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
                              {item.politicians.party}
                              {activeTab === "donations" && item.category && ` · ${shortCategory(item.category)}`}
                            </span>
                          </div>
                        )}
                        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, marginTop: 4 }}>
                          {activeTab === "donations" ? `from ${item.donor_name ?? item.summary}` : item.summary}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{formatDate(item.date_registered)}</div>
                      </div>
                      {activeTab === "donations" && item.value_amount && (
                        <div style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: readable("#F2622A") }}>£{money(item.value_amount)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="h-bills" style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10 }}>
              <h2 id="h-bills" style={panelTitle}>Bills going through Parliament</h2>
              {onNavigate && (
                <button type="button" className="hit-tab btn-link" onClick={() => onNavigate("voting")}>View all</button>
              )}
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 12px" }}>
              A bill becomes law by passing a second reading, committee stage and report stage in each House, then Royal Assent. The stage shown is where each one has got to.
            </p>
            {loadingExtras && <Loading compact />}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {upcomingBills.map((bill, i) => {
                const category = categoriseBill(bill);
                return (
                  <div
                    key={bill.bill_id}
                    className="row-link"
                    onClick={() => onNavigate?.("voting", bill)}
                    role={onNavigate ? "button" : undefined}
                    tabIndex={onNavigate ? 0 : undefined}
                    onKeyDown={(e) => { if (onNavigate && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onNavigate("voting", bill); } }}
                    style={{ borderLeft: `4px solid ${category.color}`, paddingLeft: 14, borderBottom: i < upcomingBills.length - 1 ? `1px solid ${COLORS.hairline}` : "none", cursor: onNavigate ? "pointer" : "default" }}
                  >
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16.5, color: COLORS.ink }}>{bill.short_title}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 2 }}>
                      {bill.current_stage ?? "Unknown stage"} · Next sitting {formatDate(bill.next_sitting_date)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          </div>
          <div className="home-col">
          <section aria-labelledby="h-changes" style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 12, flexWrap: "wrap" }}>
              <h2 id="h-changes" style={panelTitle}>{parliamentTab === "changes" ? "What's changed" : "On this day"}</h2>
              {switcher([{ key: "changes", label: "What's changed" }, { key: "history", label: "On this day" }], parliamentTab, setParliamentTab)}
            </div>

            {parliamentTab === "changes" ? (
              <>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
                  The most recent declared interests, bill updates, ministerial gifts, and petition responses on this site.
                </div>

                {recentChanges === null && <Loading compact />}
                {recentChanges !== null && recentChanges.length === 0 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, padding: "10px 0" }}>Nothing to show yet.</div>
                )}

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recentChanges?.map((item, i) => {
                    const meta = CHANGE_FEED_TYPES[item.type];
                    const Icon = meta.icon;
                    const clickable = item.type === "bill" || item.type === "petition" || (item.politicianId != null);
                    return (
                      <div
                        key={`${item.type}-${i}`}
                        className="row-link"
                        onClick={clickable ? () => handleChangeFeedClick(item) : undefined}
                        role={clickable ? "button" : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleChangeFeedClick(item); } } : undefined}
                        style={{ display: "flex", gap: 14, alignItems: "flex-start", borderBottom: i < recentChanges.length - 1 ? `1px solid ${COLORS.hairline}` : "none", cursor: clickable ? "pointer" : "default" }}
                      >
                        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: `${meta.color}18`, color: readable(meta.color), marginTop: 1 }}>
                          <Icon size={16} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: readable(meta.color), marginBottom: 2 }}>
                            {meta.label} · {formatDate(item.date)}
                          </div>
                          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16, color: COLORS.ink, lineHeight: 1.35 }}>{item.title}</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 2 }}>{item.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
                  Debates the Commons actually held on today's date in past years, straight from the official Hansard record.
                </div>

                {onThisDay === null && <Loading compact />}
                {onThisDay !== null && onThisDay.length === 0 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, padding: "10px 0" }}>
                    Nothing notable turned up in Hansard for today's date. Check back tomorrow.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {onThisDay?.map((item, i) => (
                    <a
                      key={`${item.year}-${item.title}`}
                      className="row-link"
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "flex", gap: 14, alignItems: "flex-start", textDecoration: "none", borderBottom: i < onThisDay.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}
                    >
                      <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 13.5, fontWeight: 600, color: "#fff", background: "var(--c-navy)", borderRadius: 6, padding: "4px 9px", marginTop: 1 }}>{item.year}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16, color: COLORS.ink, lineHeight: 1.35 }}>{item.title}</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 3 }}>
                          {yearsAgo(item.year)} · Hansard record<span className="sr-only"> (opens in a new tab)</span> ↗
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="h-find" className="find-card">
            <h2 id="h-find" style={{ ...panelTitle, color: "#fff" }}>Find your MP</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: "var(--c-on-navy-soft)", lineHeight: 1.5, margin: "6px 0 16px" }}>
              Search by constituency to jump straight to their profile.
            </p>

            {watchlist.length > 0 && (
              <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: "var(--c-on-navy-soft)" }}>Watching:</span>
                {watchlist.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", borderRadius: 8, padding: "2px 4px 2px 10px" }}>
                    <button type="button" onClick={() => handleSelectPolitician(p)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: "8px 0", cursor: "pointer" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyColour(p.party_colour, "#5a6478"), flexShrink: 0 }} />
                      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: "#0A1424", whiteSpace: "nowrap" }}>{p.name}</span>
                    </button>
                    <button type="button" onClick={() => handleRemoveWatched(p.id)} aria-label={`Stop watching ${p.name}`} title="Remove from watchlist" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "none", border: "none", color: "#3A465A", cursor: "pointer", fontSize: 18 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#3A465A", display: "flex" }}><IconSearch size={17} /></span>
              <input
                value={constituencyQuery}
                onChange={(e) => setConstituencyQuery(e.target.value)}
                aria-label="Search by constituency"
                placeholder="e.g. Holborn and St Pancras"
                style={{ width: "100%", boxSizing: "border-box", minHeight: 50, padding: "12px 14px 12px 42px", fontFamily: FONT_BODY, fontSize: 16, border: "1px solid transparent", borderRadius: 10, background: "#fff", color: "#0A1424" }}
              />
            </div>

            {constituencyQuery.trim().length >= 2 && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
                {constituencyMatches.length === 0 ? (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: "var(--c-on-navy-soft)", padding: "8px 2px" }}>No constituency matches that search.</div>
                ) : (
                  constituencyMatches.map((p) => (
                    <button key={p.id} type="button" className="find-result" onClick={() => handleSelectPolitician(p)}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: partyColour(p.party_colour, "#B9C5DB"), flexShrink: 0, boxShadow: "0 0 0 2px rgba(255,255,255,0.7)" }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.constituency}</span>
                        <span style={{ display: "block", fontSize: 13.5, color: "var(--c-on-navy-soft)" }}>{p.name} · {p.party}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </section>
          </div>
        </div>
      </div>
    </>
  );
}
