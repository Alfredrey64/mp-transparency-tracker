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
        width: 240,
        flexShrink: 0,
        background: COLORS.ink,
        minHeight: "100vh",
        padding: "28px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 36 }}>
        <EyebrowLabel>Public Record</EyebrowLabel>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: "#fff", lineHeight: 1.2, marginTop: 4 }}>
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
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: item.soon ? "rgba(199,206,224,0.4)" : COLORS.sidebarText,
                fontFamily: FONT_BODY,
                fontSize: 14,
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
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      const { data, error } = await supabase
        .from("financial_interests")
        .select("summary, value_amount, date_registered, donor_name, politicians(name)")
        .not("date_registered", "is", null)
        .order("date_registered", { ascending: false })
        .limit(3);
      if (!error) setRecent(data ?? []);
      setLoadingRecent(false);
    }
    loadRecent();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 44, color: COLORS.ink, margin: "12px 0 0", lineHeight: 1.1 }}>
        Follow the money behind every MP.
      </h1>
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: COLORS.inkSoft, marginTop: 20, lineHeight: 1.6, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
        A plain-language look at declared gifts, donations, and financial interests for every current
        Member of Parliament — pulled automatically from the official Register of Interests and updated
        every day, with no editorial spin.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 36, marginBottom: 36 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: COLORS.ink }}>{mpCount ?? "…"}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Current MPs tracked</div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: COLORS.ink }}>Daily</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Automatic updates</div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: COLORS.ink }}>Official</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Source data only</div>
        </div>
      </div>

      <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "18px 20px", marginBottom: 36, textAlign: "left" }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, textAlign: "center" }}>
          Most Recently Declared
        </div>
        {loadingRecent && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, textAlign: "center" }}>Loading…</div>
        )}
        {!loadingRecent && recent.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, textAlign: "center" }}>No entries found.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, paddingTop: i > 0 ? 10 : 0, borderTop: i > 0 ? `1px solid ${COLORS.hairline}` : "none" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink }}>
                  {item.politicians?.name ?? "Unknown MP"}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
                  from {item.donor_name ?? item.summary}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {item.value_amount && (
                  <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
                    £{Number(item.value_amount).toLocaleString()}
                  </div>
                )}
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{formatDate(item.date_registered)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onBrowse}
        style={{
          fontFamily: FONT_BODY,
          fontSize: 14.5,
          fontWeight: 600,
          color: "#fff",
          background: COLORS.ink,
          border: "none",
          borderRadius: 10,
          padding: "13px 24px",
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
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: COLORS.ink, margin: "8px 0 0" }}>
          MP Financial Interests
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 6 }}>
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
            padding: "10px 14px",
            fontFamily: FONT_BODY,
            fontSize: 14,
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
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyColour(p.party_colour), flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: COLORS.ink }}>{p.name}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
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
function PoliticianDetail({ politician, onBack }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const office = timeInOffice(politician.membership_start_date);

  return (
    <div style={{ padding: "40px 40px 60px" }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: 0, marginBottom: 20 }}
      >
        ← All MPs
      </button>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ paddingBottom: 20, borderBottom: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          {politician.thumbnail_url && (
            <img
              src={politician.thumbnail_url}
              alt=""
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `1px solid ${COLORS.hairline}` }}
            />
          )}
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, margin: 0 }}>{politician.name}</h1>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 3 }}>
              {politician.party} · {politician.constituency}
              {office && ` · MP for ${office}`}
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading declared interests…</div>}

          {!loading && interests.length === 0 && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
              No declared financial interests found for this MP.
            </div>
          )}

          {interests.map((item) => (
            <div key={item.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                {shortCategory(item.category)}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.4 }}>
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
