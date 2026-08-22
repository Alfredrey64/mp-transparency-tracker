import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

// ---- Design tokens ----
const COLORS = {
  ink: "#1E2A44",
  inkSoft: "#425073",
  paper: "#ECEBE3",
  paperCard: "#F7F6F1",
  hairline: "#D8D6C9",
  brass: "#A8823D",
  sidebarText: "#C7CEE0",
};
const FONT_DISPLAY = "'Newsreader', Georgia, serif";
const FONT_BODY = "'Public Sans', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const CATEGORY_SHORT_NAMES = {
  "Donations and other support (including loans) for activities as an MP": "Donations & Support",
  "Gifts, benefits and hospitality from UK sources": "Gifts & Hospitality",
  "Gifts, benefits and hospitality from sources outside the UK": "Overseas Gifts & Hospitality",
  "Visits outside the UK": "Overseas Visits",
  "Land and property (within or outside the UK)": "Land & Property",
  "Shareholdings": "Shareholdings",
  "Employment and earnings": "Outside Employment",
};

function shortCategory(category) {
  return CATEGORY_SHORT_NAMES[category] ?? category;
}

function partyColour(hex) {
  if (!hex) return COLORS.inkSoft;
  return hex.startsWith("#") ? hex : `#${hex}`;
}

function timeInOffice(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear() -
    (now < new Date(now.getFullYear(), start.getMonth(), start.getDate()) ? 1 : 0);
  return years <= 0 ? "less than a year" : `${years} year${years === 1 ? "" : "s"}`;
}

function EyebrowLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.brass,
        fontVariant: "small-caps",
      }}
    >
      {children}
    </div>
  );
}

function PlaceholderBox({ title, note }) {
  return (
    <div style={{ background: COLORS.paperCard, border: `1px dashed ${COLORS.hairline}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 5 }}>
        {title}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>{note}</div>
    </div>
  );
}

// ---- Sidebar navigation ----
const NAV_ITEMS = [
  { key: "home", label: "Overview" },
  { key: "list", label: "Financial Interests" },
  { key: "voting", label: "Voting Records", soon: true },
  { key: "appg", label: "APPG Memberships", soon: true },
  { key: "companies", label: "Companies House", soon: true },
];

function Sidebar({ activeView, onNavigate }) {
  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: COLORS.ink,
        minHeight: "100vh",
        padding: "28px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 36 }}>
        <EyebrowLabel>Public Record</EyebrowLabel>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: "#fff", lineHeight: 1.2, marginTop: 4 }}>
          UK Parliament Tracker
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => !item.soon && onNavigate(item.key)}
              disabled={item.soon}
              style={{
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 8,
                border: "none",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: item.soon ? "rgba(199,206,224,0.4)" : COLORS.sidebarText,
                fontFamily: FONT_BODY,
                fontSize: 15.5,
                fontWeight: active ? 600 : 400,
                cursor: item.soon ? "default" : "pointer",
              }}
            >
              <span>{item.label}</span>
              {item.soon && (
                <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ---- Landing / overview page ----
function Home({ onBrowse, mpCount }) {
  const [activeTab, setActiveTab] = useState("donations");
  const [donations, setDonations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      const [donationsRes, rolesRes] = await Promise.all([
        supabase
          .from("financial_interests")
          .select("summary, value_amount, date_registered, donor_name, politicians(name)")
          .not("value_amount", "is", null)
          .order("date_registered", { ascending: false })
          .limit(4),
        supabase
          .from("financial_interests")
          .select("summary, date_registered, politicians(name)")
          .eq("category", "Employment and earnings")
          .not("date_registered", "is", null)
          .order("date_registered", { ascending: false })
          .limit(4),
      ]);
      setDonations(donationsRes.data ?? []);
      setRoles(rolesRes.data ?? []);
      setLoading(false);
    }
    loadRecent();
  }, []);

  const items = activeTab === "donations" ? donations : roles;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 56, color: COLORS.ink, margin: "16px 0 0", lineHeight: 1.1 }}>
        Follow the money behind every MP.
      </h1>
      <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: COLORS.inkSoft, marginTop: 22, lineHeight: 1.6, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
        A plain-language look at declared gifts, donations, and financial interests for every current
        Member of Parliament — pulled automatically from the official Register of Interests and updated
        every day, with no editorial spin.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 36, marginBottom: 36 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, color: COLORS.ink }}>{mpCount ?? "…"}</div>
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
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 36, textAlign: "left" }}>
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "8px 20px 20px" }}>
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
                <div key={i} style={{ position: "relative", paddingBottom: i < items.length - 1 ? 16 : 0 }}>
                  <div style={{ position: "absolute", left: -20, top: 4, width: 9, height: 9, borderRadius: "50%", background: COLORS.brass, border: `2px solid ${COLORS.paperCard}` }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink }}>
                        {item.politicians?.name ?? "Unknown MP"}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>
                        {activeTab === "donations" ? `from ${item.donor_name ?? item.summary}` : item.summary}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {activeTab === "donations" && item.value_amount && (
                        <div style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>
                          £{Number(item.value_amount).toLocaleString()}
                        </div>
                      )}
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{formatDate(item.date_registered)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <PlaceholderBox title="Latest Political News" note="Coming soon — recent press coverage of tracked MPs, with a source-bias indicator." />
      </div>

      <button
        onClick={onBrowse}
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
        }}
      >
        Browse MPs →
      </button>
    </div>
  );
}

// ---- List screen: all MPs, searchable ----
function PoliticianList({ onSelect }) {
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("politicians")
        .select("*")
        .order("name");
      if (error) setError(error.message);
      else setPoliticians(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return politicians;
    return politicians.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.constituency?.toLowerCase().includes(q) ||
        p.party?.toLowerCase().includes(q)
    );
  }, [politicians, query]);

  return (
    <div style={{ padding: "40px 40px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: COLORS.ink, margin: "10px 0 0" }}>
          MP Financial Interests
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 6 }}>
          {loading ? "Loading current MPs…" : `${politicians.length} current MPs, updated daily from the official register.`}
        </p>
      </div>

      <div style={{ marginBottom: 20, maxWidth: 480 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, constituency, or party"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "13px 16px",
            fontFamily: FONT_BODY,
            fontSize: 16,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 10,
            background: COLORS.paperCard,
            color: COLORS.ink,
          }}
        />
      </div>

      {error && (
        <div style={{ color: "#9C3B3B", fontFamily: FONT_BODY, fontSize: 13.5, marginBottom: 16 }}>
          Couldn't load data: {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: COLORS.paperCard,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: partyColour(p.party_colour), flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink }}>{p.name}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
                {p.party} · {p.constituency}
              </div>
            </span>
          </button>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
            No MPs match "{query}".
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Detail screen: one MP's declared financial interests ----
const DETAIL_TABS = [
  { key: "all", label: "All" },
  { key: "donations", label: "Donations" },
  { key: "roles", label: "Roles" },
];

function PoliticianDetail({ politician, onBack }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("financial_interests")
        .select("*")
        .eq("politician_id", politician.id)
        .order("date_registered", { ascending: false });
      setInterests(data ?? []);
      setLoading(false);
    }
    load();
  }, [politician.id]);

  const filteredInterests = useMemo(() => {
    if (activeTab === "donations") return interests.filter((item) => item.value_amount != null);
    if (activeTab === "roles") return interests.filter((item) => item.category === "Employment and earnings");
    return interests;
  }, [interests, activeTab]);

  const office = timeInOffice(politician.membership_start_date);

  return (
    <div style={{ padding: "40px 40px 60px" }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: 0, marginBottom: 20 }}
      >
        ← All MPs
      </button>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ paddingBottom: 28, borderBottom: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          {politician.thumbnail_url && (
            <img
              src={politician.thumbnail_url}
              alt=""
              style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: `1px solid ${COLORS.hairline}` }}
            />
          )}
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: COLORS.ink, margin: 0 }}>{politician.name}</h1>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 3 }}>
              {politician.party} · {politician.constituency}
              {office && ` · MP for ${office}`}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 24, paddingTop: 24, alignItems: "start" }}>
          {/* ---- Left column: financial interests ---- */}
          <div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, paddingBottom: 12 }}>
              {DETAIL_TABS.map((tab) => (
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
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading declared interests…</div>}

              {!loading && filteredInterests.length === 0 && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
                  {interests.length === 0
                    ? "No declared financial interests found for this MP."
                    : `No entries in "${DETAIL_TABS.find((t) => t.key === activeTab)?.label}" for this MP.`}
                </div>
              )}

              {filteredInterests.map((item) => (
                <div key={item.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                    {shortCategory(item.category)}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: COLORS.ink, lineHeight: 1.4 }}>
                    {item.summary}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, fontSize: 12.5, color: COLORS.inkSoft, textAlign: "center" }}>
                    {item.value_amount && (
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: COLORS.ink }}>£{Number(item.value_amount).toLocaleString()}</span>
                    )}
                    {item.value_amount && item.date_registered && <span>-</span>}
                    {item.date_registered && <span style={{ fontFamily: FONT_BODY }}>{formatDate(item.date_registered)}</span>}
                    {(item.value_amount || item.date_registered) && item.source_url && <span>-</span>}
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY }}>
                        source ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Right column: everything else, built one piece at a time ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PlaceholderBox title="Biography" note="Coming soon" />
            <PlaceholderBox title="Parliamentary Contact" note="Coming soon" />
            <PlaceholderBox title="Cabinet Role" note="Coming soon" />
            <PlaceholderBox title="Voting Record" note="Coming soon" />
            <PlaceholderBox title="Standards & Investigations" note="Coming soon" />
            <PlaceholderBox title="In the News" note="Coming soon" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [mpCount, setMpCount] = useState(null);

  useEffect(() => {
    async function loadCount() {
      const { count } = await supabase.from("politicians").select("*", { count: "exact", head: true });
      setMpCount(count);
    }
    loadCount();
  }, []);

  function handleNavigate(key) {
    setSelected(null);
    setView(key);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.paper, fontFamily: FONT_BODY }}>
      <Sidebar activeView={view} onNavigate={handleNavigate} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {view === "home" && <Home onBrowse={() => handleNavigate("list")} mpCount={mpCount} />}
        {view === "list" &&
          (selected ? (
            <PoliticianDetail politician={selected} onBack={() => setSelected(null)} />
          ) : (
            <PoliticianList onSelect={setSelected} />
          ))}
      </div>
    </div>
  );
}
