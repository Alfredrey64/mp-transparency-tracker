import { useWatchlistChanges } from "../lib/useWatchlistChanges";
import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, readable, solid } from "../theme";
import { formatDate, partyColour, shortCategory, timeAgo } from "../lib/format";
import pipelineStatus from "../data/pipelineStatus.json";
import { categoriseBill } from "../lib/bills";
import { getWatchlist, removeFromWatchlist } from "../lib/watchlist";
import { IconSearch, IconCoin, IconBills, IconInfluence, IconPetition, IconGroup, IconPulse, IconShield, IconRoute, IconTrend, IconAsk, IconPin, IconSwing, IconCompareTime, IconGlossary } from "./icons";
import { EyebrowLabel, LoadFailedNote } from "./shared";
import { PartyHemicycleSection } from "./PartyHemicycle";
import { withScrollPreserved } from "../lib/preserveScroll";

// One orchestrated reveal for the masthead (headline + ticker rail together,
// staggered as a single moment) rather than every section fading in
// independently as it scrolls into view — the latter is the generic default
// this page used to lean on.
const revealParent = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const revealChild = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } };

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
  { key: "myMP", label: "Find your MP", line: "See who represents you, how they vote and what they have declared.", icon: IconPin, color: "#4F46E5" },
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
        detail: `${d.donor_name ?? d.summary}${d.value_amount ? ` · £${Number(d.value_amount).toLocaleString()}` : ""}`,
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

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(32px, 6vw, 56px) clamp(16px, 5vw, 24px) 60px", position: "relative" }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={revealParent}
        style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: 48 }}
      >
        <motion.div variants={revealChild}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <EyebrowLabel>Independent and unofficial</EyebrowLabel>
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(36px, 6vw, 58px)", color: COLORS.ink, margin: "16px auto 0", lineHeight: 1.08, maxWidth: 760 }}>
            A simple breakdown of UK politics.
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: COLORS.inkSoft, lineHeight: 1.65, maxWidth: 640, margin: "18px auto 0" }}>
            Who your MP is, who funds them, how they vote and what the numbers say about the country. Everything comes from
            official sources and is explained in plain English, with no jargon and no spin.
          </p>
        </motion.div>

        <motion.div className="hero-stats" variants={revealChild} style={{ display: "flex", justifyContent: "center", gap: "clamp(20px, 5vw, 52px)", flexWrap: "wrap", margin: "38px 0 34px" }}>
          {[
            { value: <CountUp value={mpCount} />, label: "MPs tracked", icon: IconGroup, color: COLORS.accent },
            pipelineStatus.generatedAt
              ? { value: timeAgo(pipelineStatus.generatedAt), label: "last updated", icon: IconPulse, color: "#F2622A" }
              : { value: "Daily", label: "kept up to date", icon: IconPulse, color: "#F2622A" },
            { value: "Official", label: "source data only", icon: IconShield, color: "#1FA97C" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 108 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}18`, color: s.color }}>
                <s.icon size={20} />
              </div>
              <div className="hero-stat-value" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, color: COLORS.ink }}>{s.value}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div className="hero-links" variants={revealChild} style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <motion.button
            onClick={onBrowse}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{
              fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: "#fff", background: COLORS.accent,
              border: "none", borderRadius: 999, padding: "13px 24px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <IconGroup size={16} />
            Browse MPs
          </motion.button>
        </motion.div>

        <WatchlistNote onNavigate={onNavigate} />

        {/* A different kind of thing from the buttons above, so it isn't one more
            pill in the row: an invitation for anyone who's never been here. */}
        <motion.div variants={revealChild} style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <motion.button
            onClick={() => onNavigate?.("start")}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            style={{
              display: "flex", alignItems: "center", gap: 14, textAlign: "left", maxWidth: 440, width: "100%",
              background: "#1FA97C14", border: "1px solid #1FA97C55", borderRadius: 18, padding: "13px 18px", cursor: "pointer",
            }}
          >
            <span style={{ width: 42, height: 42, borderRadius: "50%", background: "#1FA97C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconRoute size={20} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>Never used this before?</span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 1 }}>Take the five-minute guided tour</span>
            </span>
          </motion.button>
        </motion.div>

        <motion.section variants={revealChild} aria-labelledby="h-can-do" style={{ marginTop: 52, textAlign: "left" }}>
          <h2 id="h-can-do" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(22px, 3.4vw, 28px)", color: COLORS.ink, margin: 0, textAlign: "center" }}>What you can do here</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.6, margin: "8px auto 22px", maxWidth: 560, textAlign: "center" }}>
            Pick a starting point. Every page explains itself as you go.
          </p>
          <div className="home-features" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
            {FEATURES.map((f) => (
              <motion.button
                key={f.key} type="button" onClick={() => onNavigate?.(f.key)} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                style={{ textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, padding: "18px 18px 20px", borderRadius: 20, border: `1px solid ${f.color}40`, background: `linear-gradient(160deg, ${f.color}1c, ${COLORS.paperCard} 62%)` }}
              >
                <span style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: solid(f.color), color: "#fff" }}><f.icon size={20} /></span>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: COLORS.ink, lineHeight: 1.2 }}>{f.label}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: COLORS.inkSoft }}>{f.line}</span>
              </motion.button>
            ))}
          </div>
          <style>{`.home-features { } @media (max-width: 1000px) { .home-features { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } } @media (max-width: 420px) { .home-features { gap: 10px !important; } .home-features > button { padding: 14px 14px 16px !important; } }`}</style>
        </motion.section>
      </motion.div>

      {/* Latest activity: its own bordered rail, not squeezed beside the
          hero: the centred masthead above is a single clear opening
          statement, and this ticker is a distinct, subsequent section. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        style={{
          position: "relative", zIndex: 1, marginBottom: 44, borderRadius: 16,
          border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid #F2622A`,
          background: COLORS.paperCard, padding: "22px clamp(18px, 4vw, 30px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: COLORS.ink }}>Latest declared interests</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "donations", label: "Donations" },
              { key: "roles", label: "Roles" },
            ].map((tab) => (
              <button
                key={tab.key}
                className="hit-tab"
                onClick={() => withScrollPreserved(() => setActiveTab(tab.key))}
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === tab.key ? solid("#F2622A") : "transparent",
                  color: activeTab === tab.key ? "#fff" : COLORS.inkSoft,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "donations" && !loading && donations.length > 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14 }}>
            <strong style={{ fontFamily: FONT_MONO, color: readable("#F2622A") }}>£{Math.round(donationsTotal).toLocaleString()}</strong> declared
            across these {donations.length} entries
          </div>
        )}

        {loading && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>Loading…</div>
        )}
        {!loading && recentFailed && <LoadFailedNote item="recent declared interests" />}

        {!loading && !recentFailed && items.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>No entries found.</div>
        )}

        {!loading && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                onClick={() => handleSelectPoliticianById(item.politicians?.id)}
                style={{
                  padding: "14px 8px",
                  margin: "0 -8px",
                  borderRadius: 8,
                  borderBottom: i < items.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                  cursor: item.politicians?.id ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (item.politicians?.id) e.currentTarget.style.background = COLORS.paper; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16, color: COLORS.ink }}>
                      {item.politicians?.name ?? "Unknown MP"}
                    </div>
                    {item.politicians?.party && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: partyColour(item.politicians.party_colour, COLORS.inkSoft), flexShrink: 0 }} />
                        <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
                          {item.politicians.party}
                          {activeTab === "donations" && item.category && ` · ${shortCategory(item.category)}`}
                        </span>
                      </div>
                    )}
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, marginTop: 3 }}>
                      {activeTab === "donations" ? `from ${item.donor_name ?? item.summary}` : item.summary}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginTop: 2 }}>
                      {formatDate(item.date_registered)}
                    </div>
                  </div>
                  {activeTab === "donations" && item.value_amount && (
                    <div style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: readable("#F2622A") }}>
                      £{Number(item.value_amount).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {allPoliticians.length > 0 && (
        <PartyHemicycleSection politicians={allPoliticians} onSelectParty={() => onNavigate?.("list")} subtitle="Every current seat, coloured by party. Hover a party below to pick it out. Labour (Co-op) MPs are Labour MPs who also belong to the Co-operative Party." />
      )}

      {/* Find Your MP: full-width band */}
      <div style={{ borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, padding: "24px 0", marginBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>Find your MP</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>
              Search by constituency to jump straight to their profile.
            </div>
          </div>

          <div>
            {watchlist.length > 0 && (
              <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Watching:
                </span>
                {watchlist.map((p) => {
                  const wColor = partyColour(p.party_colour, COLORS.inkSoft);
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "4px 6px 4px 10px" }}>
                      <button
                        onClick={() => handleSelectPolitician(p)}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: wColor, flexShrink: 0 }} />
                        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, whiteSpace: "nowrap" }}>{p.name}</span>
                      </button>
                      <button
                        onClick={() => handleRemoveWatched(p.id)}
                        title="Remove from watchlist"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 24, height: 24, background: "none", border: "none",
                          color: COLORS.inkSoft, cursor: "pointer", fontSize: 13, opacity: 0.6,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ position: "relative", maxWidth: 440 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
                <IconSearch size={15} />
              </span>
              <input
                value={constituencyQuery}
                onChange={(e) => setConstituencyQuery(e.target.value)}
                placeholder="e.g. Holborn and St Pancras"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "11px 12px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
                  border: `1px solid ${COLORS.hairline}`, borderRadius: 9, background: COLORS.paperCard, color: COLORS.ink,
                }}
              />
            </div>

            {constituencyQuery.trim().length >= 2 && (
              <div style={{ marginTop: 8, maxWidth: 440, display: "flex", flexDirection: "column", gap: 2 }}>
                {constituencyMatches.length === 0 ? (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, padding: "8px 2px" }}>No constituency matches that search.</div>
                ) : (
                  constituencyMatches.map((p) => {
                    const mColor = partyColour(p.party_colour, COLORS.inkSoft);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPolitician(p)}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: "7px 4px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.paperCard; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: mColor, flexShrink: 0 }} />
                        <span style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.constituency}</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{p.name} · {p.party}</div>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "clamp(24px, 4vw, 32px)", marginBottom: 40 }}>
        <div style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: COLORS.ink }}>Bills going through Parliament</div>
            {onNavigate && (
              <button
                className="hit-tab"
                onClick={() => onNavigate("voting")}
                style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                View all
              </button>
            )}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 12px" }}>
            A bill becomes law by passing a second reading, committee stage and report stage in each House, then Royal Assent. The stage shown is where each one has got to.
          </p>
          {loadingExtras && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Loading…</div>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {upcomingBills.map((bill, i) => {
              const category = categoriseBill(bill);
              return (
                <div
                  key={bill.bill_id}
                  onClick={() => onNavigate?.("voting", bill)}
                  role={onNavigate ? "button" : undefined}
                  tabIndex={onNavigate ? 0 : undefined}
                  onKeyDown={(e) => { if (onNavigate && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onNavigate("voting", bill); } }}
                  style={{
                    borderLeft: `3px solid ${category.color}`,
                    padding: "10px 10px 10px 12px",
                    marginRight: -10,
                    borderRadius: "0 6px 6px 0",
                    borderBottom: i < upcomingBills.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                    cursor: onNavigate ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (onNavigate) e.currentTarget.style.background = COLORS.paperCard; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: COLORS.ink }}>
                    {bill.short_title}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 1 }}>
                    {bill.current_stage ?? "Unknown stage"} · Next sitting {formatDate(bill.next_sitting_date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
              {parliamentTab === "changes" ? "What's changed" : "On this day"}
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[
                { key: "changes", label: "What's changed" },
                { key: "history", label: "On this day" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className="hit-tab"
                  onClick={() => withScrollPreserved(() => setParliamentTab(tab.key))}
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "5px 11px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: parliamentTab === tab.key ? COLORS.accent : "transparent",
                    color: parliamentTab === tab.key ? "#fff" : COLORS.inkSoft,
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

            {parliamentTab === "changes" ? (
              <>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginBottom: 14 }}>
                  The most recent declared interests, bill updates, ministerial gifts, and petition responses on this site.
                </div>

                {recentChanges === null && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>Loading…</div>
                )}
                {recentChanges !== null && recentChanges.length === 0 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>
                    Nothing to show yet.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentChanges?.map((item, i) => {
                    const meta = CHANGE_FEED_TYPES[item.type];
                    const Icon = meta.icon;
                    const clickable = item.type === "bill" || item.type === "petition" || (item.politicianId != null);
                    return (
                      <div
                        key={`${item.type}-${i}`}
                        onClick={clickable ? () => handleChangeFeedClick(item) : undefined}
                        role={clickable ? "button" : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleChangeFeedClick(item); } } : undefined}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          padding: "0 6px 10px 0",
                          margin: "0 -6px 0 0",
                          borderRadius: 6,
                          borderBottom: i < recentChanges.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                          cursor: clickable ? "pointer" : "default",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { if (clickable) e.currentTarget.style.background = COLORS.paperCard; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span
                          style={{
                            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: 8, background: `${meta.color}14`, color: meta.color, marginTop: 1,
                          }}
                        >
                          <Icon size={14} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: readable(meta.color), textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                            {meta.label} · {formatDate(item.date)}
                          </div>
                          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.35 }}>
                            {item.title}
                          </div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                            {item.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginBottom: 14 }}>
                  Debates the Commons actually held on today's date in past years, straight from the official Hansard record.
                </div>

                {onThisDay === null && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>Loading…</div>
                )}
                {onThisDay !== null && onThisDay.length === 0 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>
                    Nothing notable turned up in Hansard for today's date. Check back tomorrow.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {onThisDay?.map((item, i) => (
                    <a
                      key={`${item.year}-${item.title}`}
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        textDecoration: "none",
                        paddingBottom: 12,
                        borderBottom: i < onThisDay.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          fontFamily: FONT_DISPLAY,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#fff",
                          background: COLORS.accent,
                          borderRadius: 999,
                          padding: "3px 10px",
                          marginTop: 2,
                        }}
                      >
                        {item.year}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.35 }}>
                          {item.title}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>
                          {yearsAgo(item.year)} · Hansard record ↗
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
}
