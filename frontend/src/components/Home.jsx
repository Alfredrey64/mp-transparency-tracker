import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { formatDate, partyColour, shortCategory, timeAgo } from "../lib/format";
import pipelineStatus from "../data/pipelineStatus.json";
import { categoriseBill } from "../lib/bills";
import { getWatchlist, removeFromWatchlist } from "../lib/watchlist";
import { IconSearch, IconCoin, IconBills, IconInfluence, IconPetition, IconGroup, IconPulse, IconShield, IconRankings, IconManifesto, IconPartyFinance, IconRoute } from "./icons";
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

// Each destination keeps the same accent its section uses in the sidebar
// (see Sidebar.jsx's SECTIONS) — a visitor who clicks "Browse Bills" here
// and later sees purple again in the sidebar has already learned what that
// colour means, rather than the homepage inventing its own one-off scheme.
const QUICK_LINKS = [
  { key: "voting", label: "Browse Bills", icon: IconBills, color: "#9B4FE0" },
  { key: "parties", label: "Browse Party Policies", icon: IconManifesto, color: "#2F80ED" },
  { key: "partyFinances", label: "Browse Party Funding", icon: IconPartyFinance, color: "#F2622A" },
  { key: "rankings", label: "Rankings", icon: IconRankings, color: "#D9A62A" },
];

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
  }, [value]);

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
            <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(36px, 6vw, 58px)", color: COLORS.ink, margin: "16px auto 0", lineHeight: 1.08, maxWidth: 760 }}>
            Follow the money behind every MP.
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: COLORS.inkSoft, lineHeight: 1.65, maxWidth: 600, margin: "18px auto 0" }}>
            An objective look at declared gifts, donations, and financial interests for every current Member of
            Parliament, taken straight from the official Register of Members' Financial Interests and kept up to
            date.
          </p>
        </motion.div>

        <motion.div variants={revealChild} style={{ display: "flex", justifyContent: "center", gap: "clamp(20px, 5vw, 52px)", flexWrap: "wrap", margin: "38px 0 34px" }}>
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
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, color: COLORS.ink }}>{s.value}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={revealChild} style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
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
          {QUICK_LINKS.map((link) => (
            <motion.button
              key={link.key}
              onClick={() => onNavigate?.(link.key)}
              whileHover={{ y: -1, borderColor: link.color }}
              whileTap={{ scale: 0.98 }}
              style={{
                fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: link.color, background: `${link.color}12`,
                border: `1px solid ${link.color}40`, borderRadius: 999, padding: "13px 22px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <link.icon size={16} />
              {link.label}
            </motion.button>
          ))}
        </motion.div>

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
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 1 }}>Take the five-minute guided tour →</span>
            </span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Latest activity: its own bordered rail, not squeezed beside the
          hero — the centred masthead above is a single clear opening
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
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: COLORS.ink }}>Latest Declared Interests</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "donations", label: "Donations" },
              { key: "roles", label: "Roles" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => withScrollPreserved(() => setActiveTab(tab.key))}
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === tab.key ? "#F2622A" : "transparent",
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
            <strong style={{ fontFamily: FONT_MONO, color: "#F2622A" }}>£{Math.round(donationsTotal).toLocaleString()}</strong> declared
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
                    <div style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: "#F2622A" }}>
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
        <PartyHemicycleSection politicians={allPoliticians} onSelectParty={() => onNavigate?.("list")} />
      )}

      {/* Find Your MP: full-width band */}
      <div style={{ borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, padding: "24px 0", marginBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, marginBottom: 4 }}>Find Your MP</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>
              Search by constituency to jump straight to their profile.
            </div>
          </div>

          <div>
            {watchlist.length > 0 && (
              <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "clamp(24px, 4vw, 32px)", marginBottom: 40 }}>
        <div style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: COLORS.ink }}>Bills Going Through Parliament</div>
            {onNavigate && (
              <button
                onClick={() => onNavigate("voting")}
                style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                View all
              </button>
            )}
          </div>
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
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink }}>
              {parliamentTab === "changes" ? "What's Changed" : "On This Day"}
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[
                { key: "changes", label: "What's Changed" },
                { key: "history", label: "On This Day" },
              ].map((tab) => (
                <button
                  key={tab.key}
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
                          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: meta.color, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
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
                    Nothing notable turned up in Hansard for today's date — check back tomorrow.
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
