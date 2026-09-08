import { useState, useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { categoriseBill } from "../lib/bills";
import { PageHeader } from "./shared";

// Curated snapshot, not a live feed — refresh manually every so often.
const NEWS_ITEMS = [
  {
    headline: "Starmer vows to fight on after Labour's heavy by-election defeat",
    source: "Yahoo News",
    url: "https://www.yahoo.com/news/articles/uk-labour-party-loses-parliamentary-052611773.html",
  },
  {
    headline: "Reform UK now polling neck-and-neck with Labour nationally",
    source: "Euronews",
    url: "https://www.euronews.com/2025/09/28/keir-starmer-urges-labour-party-unity-to-fend-off-nigel-farages-reform-uk-threat",
  },
  {
    headline: "Labour conference: Starmer urges party unity as Reform's threat grows",
    source: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2025/9/28/uks-governing-labour-party-holds-annual-conference-amid-far-right-surge",
  },
  {
    headline: "Parliament returns from summer recess to a packed September agenda",
    source: "UK Parliament",
    url: "https://www.parliament.uk/business/news/2026/august-2026/coming-up-in-the-commons-1-4-september/",
  },
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

export default function Home({ onBrowse, onNavigate, mpCount }) {
  const [activeTab, setActiveTab] = useState("donations");
  const [donations, setDonations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

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
      const [partiesRes, billsRes] = await Promise.all([
        supabase.from("politicians").select("party, party_colour"),
        supabase
          .from("bills")
          .select("*")
          .not("next_sitting_date", "is", null)
          .order("next_sitting_date", { ascending: true })
          .limit(4),
      ]);
      const map = new Map();
      for (const p of partiesRes.data ?? []) {
        if (!p.party) continue;
        if (!map.has(p.party)) map.set(p.party, { name: p.party, color: partyColour(p.party_colour, COLORS.inkSoft), count: 0 });
        map.get(p.party).count += 1;
      }
      setParties([...map.values()].sort((a, b) => b.count - a.count).slice(0, 7));
      setUpcomingBills(billsRes.data ?? []);
      setLoadingExtras(false);
    }
    loadExtras();
  }, []);

  const items = activeTab === "donations" ? donations : roles;
  const maxPartyCount = Math.max(1, ...parties.map((p) => p.count));

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
          <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "8px 20px 20px", boxShadow: "0 2px 8px rgba(30,42,68,0.06)" }}>
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
              <div style={{ position: "relative", paddingLeft: 20 }}>
                <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: COLORS.hairline }} />
                {items.map((item, i) => (
                  <div key={item.id} style={{ position: "relative", paddingBottom: i < items.length - 1 ? 16 : 0 }}>
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
                            fontFamily: FONT_MONO,
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
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>
              Latest Political News
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginBottom: 14 }}>
              A hand-picked snapshot, not a live feed — links go to the original source.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {NEWS_ITEMS.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", textDecoration: "none", paddingBottom: 12, borderBottom: `1px solid ${COLORS.hairline}` }}
                >
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: COLORS.ink, lineHeight: 1.35 }}>
                    {item.headline}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.brass, marginTop: 4, fontWeight: 600 }}>
                    {item.source} ↗
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 36, textAlign: "left" }}>
          <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(30,42,68,0.06)" }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 14 }}>
              Party Breakdown
            </div>
            {loadingExtras && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Loading…</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {parties.map((party, i) => (
                <motion.div
                  key={party.name}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, marginBottom: 3 }}>
                    <span>{party.name}</span>
                    <span style={{ color: COLORS.inkSoft }}>{party.count}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(party.count / maxPartyCount) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.04, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 999, background: party.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
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
