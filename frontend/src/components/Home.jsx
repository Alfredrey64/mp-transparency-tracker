import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { categoriseBill } from "../lib/bills";
import { getWatchlist, removeFromWatchlist } from "../lib/watchlist";
import { IconSearch } from "./icons";
import { PageHeader } from "./shared";

function yearsAgo(year) {
  const n = new Date().getFullYear() - year;
  return n === 1 ? "1 year ago" : `${n} years ago`;
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
  const [todaysBusiness, setTodaysBusiness] = useState(null);
  const [parliamentTab, setParliamentTab] = useState("today");

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
    async function loadTodaysBusiness() {
      const { data } = await supabase.from("todays_business").select("*").order("id", { ascending: true });
      setTodaysBusiness(data ?? []);
    }
    loadTodaysBusiness();
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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(48px, 10vw, 80px) clamp(16px, 5vw, 24px)", textAlign: "center", position: "relative" }}>
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1.5 }}
        style={{
          position: "absolute",
          top: -40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          height: 280,
          background: `radial-gradient(ellipse at center, ${COLORS.brass}22, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <PageHeader
          kicker="Public Record · UK Parliament"
          title="Follow the money behind every MP."
          subtitle="A plain-language look at declared gifts, donations, and financial interests for every current Member of Parliament — pulled automatically from the official Register of Interests and updated every day, with no editorial spin."
          align="center"
          size="xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 40, marginTop: 36, marginBottom: 36 }}
        >
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, color: COLORS.ink }}><CountUp value={mpCount} /></div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Current MPs tracked</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, color: COLORS.ink }}>Daily</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Automatic updates</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, color: COLORS.ink }}>Official</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Source data only</div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 24, textAlign: "left" }}>
          <div style={{ display: "flex", flexDirection: "column", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "8px 20px 20px", boxShadow: "0 2px 8px rgba(30,42,68,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "10px 0 14px" }}>
              {[
                { key: "donations", label: "Donations" },
                { key: "roles", label: "Roles" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === tab.key ? COLORS.ink : "transparent",
                    color: activeTab === tab.key ? "#fff" : COLORS.inkSoft,
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, textAlign: "center", padding: "10px 0" }}>Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, textAlign: "center", padding: "10px 0" }}>No entries found.</div>
            )}

            {!loading && items.length > 0 && (
              <div style={{ position: "relative", paddingLeft: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
                <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: COLORS.hairline }} />
                {items.map((item) => (
                  <div key={item.id} style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -20, top: 4, width: 9, height: 9, borderRadius: "50%", background: COLORS.brass, border: `2px solid ${COLORS.paperCard}` }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink }}>
                          {item.politicians?.name ?? "Unknown MP"}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 1 }}>
                          {activeTab === "donations" ? `from ${item.donor_name ?? item.summary}` : item.summary}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, opacity: 0.75, marginTop: 2 }}>
                          {formatDate(item.date_registered)}
                        </div>
                      </div>
                      {activeTab === "donations" && item.value_amount && (
                        <div
                          style={{
                            fontFamily: FONT_BODY,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#fff",
                            background: COLORS.brass,
                            padding: "5px 12px",
                            borderRadius: 999,
                            flexShrink: 0,
                          }}
                        >
                          £{Number(item.value_amount).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(30,42,68,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink }}>
                Parliament {parliamentTab === "today" ? "Today" : "On This Day"}
              </div>
              <div style={{ display: "flex", gap: 2, background: COLORS.paper, borderRadius: 999, padding: 2 }}>
                {[
                  { key: "today", label: "Today" },
                  { key: "history", label: "On This Day" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setParliamentTab(tab.key)}
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "5px 11px",
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      background: parliamentTab === tab.key ? COLORS.ink : "transparent",
                      color: parliamentTab === tab.key ? "#fff" : COLORS.inkSoft,
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {parliamentTab === "today" ? (
              <>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginBottom: 14 }}>
                  What's actually scheduled in the Commons chamber today, straight from Parliament's own business calendar.
                </div>

                {todaysBusiness === null && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>Loading…</div>
                )}
                {todaysBusiness !== null && todaysBusiness.length === 0 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "10px 0" }}>
                    The Commons doesn't appear to be sitting today — check back on the next sitting day.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {todaysBusiness?.map((item, i) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        paddingBottom: 10,
                        borderBottom: i < todaysBusiness.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          fontFamily: FONT_BODY,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: COLORS.brass,
                          minWidth: 42,
                          marginTop: 2,
                        }}
                      >
                        {item.event_time ?? "—"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.35 }}>
                          {item.description}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                          {item.category ?? item.event_type}
                          {item.lead_member ? ` · ${item.lead_member}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 36, textAlign: "left" }}>
          <div style={{ display: "flex", flexDirection: "column", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(30,42,68,0.06)" }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>
              Find Your MP
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12 }}>
              Search by constituency to jump straight to their profile
            </div>

            {watchlist.length > 0 && (
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${COLORS.hairline}` }}>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Your Watchlist
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {watchlist.map((p) => {
                    const wColor = partyColour(p.party_colour, COLORS.inkSoft);
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => handleSelectPolitician(p)}
                          style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, background: "none", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: wColor, flexShrink: 0 }} />
                          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                          <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, flexShrink: 0 }}>· {p.constituency}</span>
                        </button>
                        <button
                          onClick={() => handleRemoveWatched(p.id)}
                          title="Remove from watchlist"
                          style={{ flexShrink: 0, background: "none", border: "none", color: COLORS.inkSoft, cursor: "pointer", fontSize: 13, padding: 4, opacity: 0.6 }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
                <IconSearch size={15} />
              </span>
              <input
                value={constituencyQuery}
                onChange={(e) => setConstituencyQuery(e.target.value)}
                placeholder="e.g. Holborn and St Pancras"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
                  border: `1px solid ${COLORS.hairline}`, borderRadius: 9, background: COLORS.paper, color: COLORS.ink,
                }}
              />
            </div>

            {constituencyQuery.trim().length >= 2 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
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
                        onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.paper; }}
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

          <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(30,42,68,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink }}>
                Bills Going Through Parliament
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("voting")}
                  style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.brass, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  View all →
                </button>
              )}
            </div>
            {loadingExtras && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Loading…</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingBills.map((bill, i) => {
                const category = categoriseBill(bill);
                return (
                  <motion.div
                    key={bill.bill_id}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    style={{
                      borderLeft: `3px solid ${category.color}`,
                      paddingLeft: 10,
                      paddingBottom: i < upcomingBills.length - 1 ? 8 : 0,
                      borderBottom: i < upcomingBills.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                    }}
                  >
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink }}>
                      {bill.short_title}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 1 }}>
                      {bill.current_stage ?? "Unknown stage"} · Next sitting {formatDate(bill.next_sitting_date)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <motion.button
          onClick={onBrowse}
          whileHover={{ y: -2, boxShadow: "0 10px 24px rgba(30,42,68,0.22)" }}
          whileTap={{ y: 0 }}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            background: COLORS.ink,
            border: "none",
            borderRadius: 10,
            padding: "15px 28px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(30,42,68,0.15)",
          }}
        >
          Browse MPs →
        </motion.button>
      </div>
    </div>
  );
}
