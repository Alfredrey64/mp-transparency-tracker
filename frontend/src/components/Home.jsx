import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { categoriseBill } from "../lib/bills";
import { getWatchlist, removeFromWatchlist } from "../lib/watchlist";
import { IconSearch, IconCoin, IconBills, IconInfluence, IconPetition } from "./icons";
import { EyebrowLabel, ParliamentSilhouette } from "./shared";
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
  donation: { icon: IconCoin, color: "#B5533C", label: "Declared interest" },
  bill: { icon: IconBills, color: "#9C6B30", label: "Bill update" },
  gift: { icon: IconInfluence, color: "#6E4B6E", label: "Ministerial gift" },
  petition: { icon: IconPetition, color: "#3F7D5C", label: "Petition response" },
};

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
          .select("id, summary, value_amount, date_registered, donor_name, politicians(name)")
          .not("value_amount", "is", null)
          .order("date_registered", { ascending: false })
          .order("id", { ascending: false })
          .limit(4),
        supabase
          .from("financial_interests")
          .select("id, summary, date_registered, politicians(name)")
          .eq("category", "Employment and earnings")
          .not("date_registered", "is", null)
          .order("date_registered", { ascending: false })
          .order("id", { ascending: false })
          .limit(4),
      ]);
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
          .select("id, summary, value_amount, date_registered, donor_name, politicians(name)")
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
          .select("id, department, kind, date_or_period, description, politicians(name)")
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
      }));
      const billItems = (billsRes.data ?? []).map((b) => ({
        type: "bill", date: b.last_updated,
        title: b.short_title,
        detail: `${b.current_stage ?? "Stage update"}${b.sponsoring_department ? ` · ${b.sponsoring_department}` : ""}`,
      }));
      const giftItems = (giftsRes.data ?? []).map((g) => ({
        type: "gift", date: g.date_or_period,
        title: g.politicians?.name ?? "Minister",
        detail: `${g.description ?? g.kind}${g.department ? ` · ${g.department}` : ""}`,
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

  const constituencyMatches = useMemo(() => {
    const q = constituencyQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return allPoliticians.filter((p) => p.constituency?.toLowerCase().includes(q)).slice(0, 6);
  }, [allPoliticians, constituencyQuery]);

  function handleSelectPolitician(p) {
    onViewProfile?.(p);
  }

  function handleRemoveWatched(id) {
    removeFromWatchlist(id);
    setWatchlist(getWatchlist());
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(32px, 6vw, 56px) clamp(16px, 5vw, 24px) 60px", position: "relative" }}>
      <div
        aria-hidden
        style={{ position: "absolute", top: -10, right: "clamp(-40px, -2vw, 0px)", opacity: 0.05, pointerEvents: "none", zIndex: 0 }}
      >
        <ParliamentSilhouette width={460} color={COLORS.brass} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={revealParent}
        style={{
          position: "relative", zIndex: 1, display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "clamp(28px, 5vw, 56px)",
          alignItems: "start", marginBottom: 44,
        }}
      >
        {/* Left: masthead */}
        <motion.div variants={revealChild}>
          <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 5vw, 54px)", color: COLORS.ink, margin: "14px 0 0", lineHeight: 1.1 }}>
            Follow the money behind every MP.
          </h1>
          <div style={{ width: 42, height: 2, background: COLORS.brass, margin: "18px 0" }} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: COLORS.inkSoft, lineHeight: 1.65, maxWidth: 520, margin: 0 }}>
            An objective look at declared gifts, donations, and financial interests for every current Member of
            Parliament, taken straight from the official Register of Members' Financial Interests and kept up to
            date.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", margin: "28px 0 30px" }}>
            {[
              { value: <CountUp value={mpCount} />, label: "MPs tracked" },
              { value: "Daily", label: "kept up to date" },
              { value: "Official", label: "source data only" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <span style={{ width: 1, height: 30, background: COLORS.hairline, margin: "0 20px", flexShrink: 0 }} />}
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 600, color: COLORS.ink }}>{s.value}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <motion.button
            onClick={onBrowse}
            whileTap={{ scale: 0.98 }}
            style={{
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: "#fff", background: COLORS.brass,
              border: "none", borderRadius: 6, padding: "15px 28px", cursor: "pointer",
            }}
          >
            Browse MPs
          </motion.button>
        </motion.div>

        {/* Right: live ticker rail */}
        <motion.div variants={revealChild} style={{ borderLeft: `1px solid ${COLORS.hairline}`, paddingLeft: 28 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
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
                  background: activeTab === tab.key ? COLORS.brass : "transparent",
                  color: activeTab === tab.key ? "#fff" : COLORS.inkSoft,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>Loading…</div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>No entries found.</div>
          )}

          {!loading && items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {items.map((item, i) => (
                <div key={item.id} style={{ padding: "12px 0", borderBottom: i < items.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink }}>
                        {item.politicians?.name ?? "Unknown MP"}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 1 }}>
                        {activeTab === "donations" ? `from ${item.donor_name ?? item.summary}` : item.summary}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginTop: 2 }}>
                        {formatDate(item.date_registered)}
                      </div>
                    </div>
                    {activeTab === "donations" && item.value_amount && (
                      <div style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: COLORS.brass }}>
                        £{Number(item.value_amount).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Find Your MP: full-width band */}
      <div style={{ borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, padding: "24px 0", marginBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, alignItems: "start" }}>
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
                        style={{ background: "none", border: "none", color: COLORS.inkSoft, cursor: "pointer", fontSize: 13, padding: "0 2px", opacity: 0.6 }}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "clamp(28px, 5vw, 56px)" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink }}>Bills Going Through Parliament</div>
            {onNavigate && (
              <button
                onClick={() => onNavigate("voting")}
                style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.brass, background: "none", border: "none", cursor: "pointer", padding: 0 }}
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
                  style={{
                    borderLeft: `3px solid ${category.color}`,
                    padding: "10px 0 10px 12px",
                    borderBottom: i < upcomingBills.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                  }}
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

        <div>
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
                    background: parliamentTab === tab.key ? COLORS.brass : "transparent",
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
                    return (
                      <div
                        key={`${item.type}-${i}`}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          paddingBottom: 10,
                          borderBottom: i < recentChanges.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                        }}
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
                          background: COLORS.brass,
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
