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

function stripHtml(text) {
  if (!text) return text;
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
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

function ParliamentSilhouette({ width = 200, opacity = 1, color = COLORS.ink }) {
  return (
    <svg width={width} viewBox="0 0 240 120" fill="none" style={{ opacity }}>
      <line x1="0" y1="112" x2="240" y2="112" stroke={color} strokeWidth="1.5" />
      <rect x="18" y="70" width="120" height="42" fill={color} />
      {[18, 30, 42, 54, 66, 78, 90, 102, 114, 126].map((x) => (
        <rect key={x} x={x} y="64" width="6" height="8" fill={color} />
      ))}
      <rect x="10" y="58" width="10" height="54" fill={color} />
      <polygon points="10,58 15,46 20,58" fill={color} />
      <rect x="150" y="30" width="26" height="82" fill={color} />
      <rect x="146" y="24" width="34" height="8" fill={color} />
      <polygon points="150,24 163,4 176,24" fill={color} />
      <circle cx="163" cy="46" r="7" fill={COLORS.paper} stroke={color} strokeWidth="2" />
      <line x1="163" y1="4" x2="163" y2="-6" stroke={color} strokeWidth="2" />
      <rect x="190" y="80" width="14" height="32" fill={color} />
      <polygon points="190,80 197,66 204,80" fill={color} />
    </svg>
  );
}

function SectionDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "14px 0" }}>
      <span style={{ width: 24, height: 1, background: COLORS.hairline }} />
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.brass }} />
      <span style={{ width: 24, height: 1, background: COLORS.hairline }} />
    </div>
  );
}

function CardShell({ title, children }) {
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.brass}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(30,42,68,0.05)" }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function BiographyBox({ politician }) {
  const bio = stripHtml(politician.biography);
  return (
    <CardShell title="Biography">
      {bio ? (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.65 }}>
          {bio}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No official biography published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

function ContactRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 10.5, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>{children}</div>
    </div>
  );
}

function ContactBox({ politician }) {
  const hasContact = politician.parliamentary_address || politician.parliamentary_phone || politician.parliamentary_email;
  return (
    <CardShell title="Parliamentary Contact">
      {hasContact ? (
        <div>
          {politician.parliamentary_address && <ContactRow label="Address">{politician.parliamentary_address}</ContactRow>}
          {politician.parliamentary_phone && <ContactRow label="Phone">{politician.parliamentary_phone}</ContactRow>}
          {politician.parliamentary_email && (
            <ContactRow label="Email">
              <a href={`mailto:${politician.parliamentary_email}`} style={{ color: COLORS.ink }}>
                {politician.parliamentary_email}
              </a>
            </ContactRow>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No parliamentary contact details published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

function CabinetRoleBox({ politician }) {
  return (
    <CardShell title="Cabinet Role">
      {politician.cabinet_role ? (
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: COLORS.ink }}>
            {politician.cabinet_role}
          </div>
          {politician.cabinet_role_start_date && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>
              Since {formatDate(politician.cabinet_role_start_date)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No current government post — this MP is a backbencher.
        </div>
      )}
    </CardShell>
  );
}

function StandardsBox({ politician }) {
  const encodedName = encodeURIComponent(politician.name);
  return (
    <CardShell title="Standards & Investigations">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 10 }}>
        There's no reliable automated feed for this, so rather than guess, here are direct links to
        check the official record yourself:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <a
          href={`https://committees.parliament.uk/committee/62/standards/publications/`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, fontWeight: 600 }}
        >
          Committee on Standards — published findings ↗
        </a>
        <a
          href={`https://www.parliament.uk/site-information/search/?q=${encodedName}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, fontWeight: 600 }}
        >
          Search parliament.uk for "{politician.name}" ↗
        </a>
      </div>
    </CardShell>
  );
}

function VotingSummaryBox({ politician }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("voting_records")
        .select("voted_with_party_majority")
        .eq("politician_id", politician.id);
      if (!data || data.length === 0) {
        setStats({ total: 0 });
        return;
      }
      const withParty = data.filter((v) => v.voted_with_party_majority === true).length;
      const decisive = data.filter((v) => v.voted_with_party_majority !== null).length;
      setStats({ total: data.length, withParty, decisive });
    }
    load();
  }, [politician.id]);

  return (
    <CardShell title="Voting Record">
      {stats === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
      {stats && stats.total === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No recorded votes found for this MP in the tracked period.
        </div>
      )}
      {stats && stats.total > 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
          {stats.total} recorded vote{stats.total === 1 ? "" : "s"} tracked — voted with their own party's
          majority in {stats.withParty} of {stats.decisive}.
          <div style={{ marginTop: 6, fontSize: 12.5, color: COLORS.inkSoft }}>
            See the "Voting Records" tab in the sidebar for their full history.
          </div>
        </div>
      )}
    </CardShell>
  );
}

function PlaceholderBox({ title, note }) {
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.brass}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(30,42,68,0.05)" }}>
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
  { key: "howitworks", label: "How Parliament Works" },
  { key: "list", label: "Financial Interests" },
  { key: "voting", label: "Voting Records" },
  { key: "appg", label: "APPG Memberships" },
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
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <ParliamentSilhouette width={72} color={COLORS.brass} opacity={0.9} />
        </div>
        <EyebrowLabel>Public Record</EyebrowLabel>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: "#fff", lineHeight: 1.25, marginTop: 6 }}>
          UK Parliament Tracker
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
          <span style={{ width: 36, height: 1, background: "rgba(255,255,255,0.15)" }} />
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

  const items = activeTab === "donations" ? donations : roles;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px", textAlign: "center", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, right: 24, pointerEvents: "none" }}>
        <ParliamentSilhouette width={220} color={COLORS.ink} opacity={0.045} />
      </div>
      <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 56, color: COLORS.ink, margin: "16px 0 0", lineHeight: 1.1 }}>
        Follow the money behind every MP.
      </h1>
      <SectionDivider />
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
            boxShadow: "0 1px 3px rgba(30,42,68,0.05)",
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
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(30,42,68,0.06)",
              transition: "box-shadow 0.15s, transform 0.15s",
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: 0 }}
        >
          ← All MPs
        </button>
        <span
          title={politician.party}
          style={{ width: 14, height: 14, borderRadius: "50%", background: partyColour(politician.party_colour), border: `1px solid ${COLORS.hairline}` }}
        />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ position: "relative", paddingBottom: 28, borderBottom: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, overflow: "hidden" }}>
          {politician.thumbnail_url && (
            <img
              src={politician.thumbnail_url}
              alt=""
              style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: `3px solid ${COLORS.paperCard}`, outline: `1px solid ${COLORS.hairline}`, boxShadow: "0 4px 14px rgba(30,42,68,0.12)" }}
            />
          )}
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: COLORS.ink, margin: 0 }}>{politician.name}</h1>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 3 }}>
              {politician.party} · {politician.constituency}
              {office && ` · MP for ${office}`}
            </div>
            <SectionDivider />
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
                <div key={item.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(30,42,68,0.05)" }}>
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

          {/* ---- Right column: everything else ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BiographyBox politician={politician} />
            <ContactBox politician={politician} />
            <CabinetRoleBox politician={politician} />
            <VotingSummaryBox politician={politician} />
            <StandardsBox politician={politician} />
            <PlaceholderBox title="In the News" note="Coming soon" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Voting Records tab ----
const BILL_CATEGORIES = [
  { match: ["health and social care"], label: "Health", color: "#B5533C" },
  { match: ["defence"], label: "Defence", color: "#3A6EA5" },
  { match: ["treasury"], label: "Economy & Finance", color: "#8A7A3D" },
  { match: ["transport"], label: "Transport", color: "#4C7A6B" },
  { match: ["science, innovation", "digital, culture", "technology"], label: "Science & Tech", color: "#5B4E8A" },
  { match: ["justice", "home office", "home department"], label: "Justice & Home Affairs", color: "#7A4B4B" },
  { match: ["energy security", "net zero", "environment, food"], label: "Environment & Energy", color: "#2F6F4E" },
  { match: ["education"], label: "Education", color: "#C08A2E" },
  { match: ["work and pensions"], label: "Work & Pensions", color: "#6B5B95" },
  { match: ["housing, communities", "levelling up"], label: "Housing & Communities", color: "#A0522D" },
  { match: ["foreign, commonwealth"], label: "Foreign Affairs", color: "#2E6F6F" },
  { match: ["culture, media"], label: "Culture & Media", color: "#B0508A" },
];

function categoriseBill(bill) {
  const dept = (bill.sponsoring_department ?? "").toLowerCase();
  for (const cat of BILL_CATEGORIES) {
    if (cat.match.some((m) => dept.includes(m))) return cat;
  }
  return { label: "General", color: COLORS.inkSoft };
}

function UpcomingBillCard({ bill }) {
  const category = categoriseBill(bill);
  return (
    <div
      style={{
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderLeft: `5px solid ${category.color}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 4px rgba(30,42,68,0.05)",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
    >
      <div
        style={{
          display: "inline-block",
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: category.color,
          background: `${category.color}1A`,
          padding: "3px 9px",
          borderRadius: 999,
          marginBottom: 8,
        }}
      >
        {category.label}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink }}>{bill.short_title}</div>
      {bill.long_title && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
          {bill.long_title}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
        {[
          `Current stage: ${bill.current_stage ?? "Unknown"} (${bill.current_house})`,
          bill.sponsor_name
            ? `Sponsored by ${bill.sponsor_name}${bill.sponsoring_department ? ` · ${bill.sponsoring_department}` : ""}`
            : null,
          bill.next_sitting_date ? `Next sitting: ${formatDate(bill.next_sitting_date)}` : null,
        ]
          .filter(Boolean)
          .map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: category.color, flexShrink: 0 }} />
              <span>{line}</span>
            </div>
          ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <a href={bill.source_url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: category.color }}>
          Full bill page ↗
        </a>
      </div>
    </div>
  );
}

function MpVotingHistory({ politician, onBack }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("voting_records")
        .select("*")
        .eq("politician_id", politician.id)
        .order("date", { ascending: false });
      setVotes(data ?? []);
      setLoading(false);
    }
    load();
  }, [politician.id]);

  const withPartyCount = votes.filter((v) => v.voted_with_party_majority === true).length;
  const againstPartyCount = votes.filter((v) => v.voted_with_party_majority === false).length;

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: 0, marginBottom: 16 }}
      >
        ← Choose a different MP
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {politician.thumbnail_url && (
          <img src={politician.thumbnail_url} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `1px solid ${COLORS.hairline}` }} />
        )}
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink }}>{politician.name}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{politician.party} · {politician.constituency}</div>
        </div>
      </div>

      {!loading && votes.length > 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
          Voted with their own party's majority in <strong style={{ color: COLORS.ink }}>{withPartyCount}</strong> of the last{" "}
          {withPartyCount + againstPartyCount} recorded votes where a party majority existed.
        </div>
      )}

      {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading voting history…</div>}
      {!loading && votes.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No recorded votes found for this MP in the tracked period.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {votes.map((v) => (
          <div key={v.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink, marginBottom: 6 }}>{v.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  padding: "3px 9px", borderRadius: 999,
                  background: v.voted_aye ? "#E4EEE7" : "#F3E4E2",
                  color: v.voted_aye ? "#2F6F4E" : "#9C3B3B",
                }}
              >
                {v.voted_aye ? "Aye" : "No"}
              </span>
              {v.voted_with_party_majority !== null && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                  {v.voted_with_party_majority ? "With party majority" : "Against party majority"}
                </span>
              )}
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{formatDate(v.date)}</span>
              <a href={v.source_url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                source ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VotingRecords() {
  const [bills, setBills] = useState([]);
  const [politicians, setPoliticians] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedMp, setSelectedMp] = useState(null);

  useEffect(() => {
    async function load() {
      const [billsRes, politiciansRes] = await Promise.all([
        supabase
          .from("bills")
          .select("*")
          .not("next_sitting_date", "is", null)
          .order("next_sitting_date", { ascending: true })
          .limit(40),
        supabase.from("politicians").select("*").order("name"),
      ]);
      setBills(billsRes.data ?? []);
      setPoliticians(politiciansRes.data ?? []);
      setLoadingBills(false);
    }
    load();
  }, []);

  const filteredPoliticians = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return politicians.filter((p) => p.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [politicians, query]);

  if (selectedMp) {
    return (
      <div style={{ padding: "40px 40px 60px", maxWidth: 800, margin: "0 auto" }}>
        <MpVotingHistory politician={selectedMp} onBack={() => setSelectedMp(null)} />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 40px 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: COLORS.ink, margin: "10px 0 0" }}>
          Voting Records
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 6 }}>
          See how any MP voted, and whether they voted with or against their own party's majority — plus
          what's coming up next in Parliament.
        </p>
      </div>

      <div style={{ marginBottom: 32, maxWidth: 480 }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink, marginBottom: 8 }}>
          Look up an MP's voting history
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by MP name"
          style={{
            width: "100%", boxSizing: "border-box", padding: "13px 16px", fontFamily: FONT_BODY, fontSize: 16,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
        {filteredPoliticians.length > 0 && (
          <div style={{ marginTop: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
            {filteredPoliticians.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedMp(p); setQuery(""); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
                  background: "transparent", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink,
                  borderBottom: `1px solid ${COLORS.hairline}`,
                }}
              >
                {p.name} <span style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>· {p.party}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink, marginBottom: 10 }}>
        Upcoming Bills
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: 16 }}>
        {BILL_CATEGORIES.map((cat) => (
          <div key={cat.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{cat.label}</span>
          </div>
        ))}
      </div>
      {loadingBills && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>}
      {!loadingBills && bills.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No bills with a scheduled sitting date found right now.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {bills.map((bill) => (
          <UpcomingBillCard key={bill.bill_id} bill={bill} />
        ))}
      </div>
    </div>
  );
}

// ---- How Parliament Works tab ----
const STRUCTURE_ROWS = [
  {
    key: "monarch",
    label: "The Monarch",
    tagline: "Ceremonial Head of State",
    desc: "The Monarch is the formal Head of State but has no political power in practice. Every Act of Parliament requires Royal Assent, and the Monarch formally invites the leader of the winning party to become Prime Minister — but by long-standing convention, never refuses or interferes.",
  },
  {
    key: "parliament",
    label: "Parliament",
    tagline: "The legislature — makes the laws",
    desc: "Parliament is made up of two chambers: the elected House of Commons (650 MPs) and the House of Lords (appointed and hereditary members, plus bishops). Together they debate, amend, and vote on new laws.",
  },
  {
    key: "government",
    label: "The Government",
    tagline: "The executive — runs the country day to day",
    desc: "The Government is formed by whichever party (or coalition) holds a majority of seats in the Commons. It's led by the Prime Minister and the Cabinet (senior ministers, each responsible for a department like Health, Defence, or Treasury). The Government proposes most new laws and sets policy.",
  },
  {
    key: "delivery",
    label: "Civil Service & Local Councils",
    tagline: "Implementation — where policy meets daily life",
    desc: "Once a law passes, it's the Civil Service (permanent, non-political staff in government departments) and local councils who actually deliver it — running the NHS, schools, roads, benefits, and local services according to the rules Parliament has set.",
  },
];

const BILL_PROCESS_STAGES = [
  {
    key: "idea",
    label: "Idea",
    desc: "Most bills come from the Government — usually built from manifesto promises and drafted by civil servants in the relevant department. MPs can also propose their own Private Members' Bills (chosen by ballot or a 10-minute slot), and the House of Lords can introduce bills too.",
  },
  {
    key: "first",
    label: "1st Reading",
    desc: "A purely formal step — the bill's title is read out and it's printed. There's no debate or vote at this stage.",
  },
  {
    key: "second",
    label: "2nd Reading",
    desc: "The first real debate. MPs discuss the bill's main principles and purpose, then vote on whether it should proceed. This is usually the first meaningful vote a bill faces.",
  },
  {
    key: "committee",
    label: "Committee Stage",
    desc: "A smaller group of MPs (or occasionally the whole House) examines the bill line by line, proposing and voting on detailed amendments.",
  },
  {
    key: "report",
    label: "Report Stage",
    desc: "The whole House considers the amendments made in Committee, and can propose further changes.",
  },
  {
    key: "third",
    label: "3rd Reading",
    desc: "A final debate and vote on the bill as it now stands, in the House where it started.",
  },
  {
    key: "otherhouse",
    label: "Other House",
    desc: "The bill then goes through the same stages (1st reading through 3rd reading) in the other House — Lords if it started in the Commons, or vice versa.",
  },
  {
    key: "pingpong",
    label: "\"Ping Pong\"",
    desc: "If the two Houses disagree on amendments, the bill bounces back and forth between them until they reach agreement — nicknamed \"ping pong\".",
  },
  {
    key: "assent",
    label: "Royal Assent",
    desc: "The Monarch formally approves the bill — a ceremonial step that hasn't been refused since 1708. The bill is now an Act of Parliament: it's law.",
  },
  {
    key: "implementation",
    label: "Implementation",
    desc: "Laws often don't take effect immediately. Ministers issue \"commencement orders\" to bring parts of an Act into force, and further detailed rules (secondary legislation) are often needed before departments and councils can actually enforce it.",
  },
];

const ELECTION_STAGES = [
  {
    key: "called",
    label: "Election Called",
    desc: "General elections happen at least every 5 years, but the Prime Minister can request one sooner. All 650 Commons seats are contested at once.",
  },
  {
    key: "candidates",
    label: "Candidates Stand",
    desc: "In each of the UK's 650 constituencies, candidates put themselves forward — representing a party, or standing as independents.",
  },
  {
    key: "vote",
    label: "Voters Vote (FPTP)",
    desc: "The UK uses First Past The Post: each voter gets one vote in their own constituency, and whoever gets the most votes there wins — even without an outright majority of votes cast.",
  },
  {
    key: "mp",
    label: "An MP Is Elected",
    desc: "The winning candidate in each constituency becomes that area's Member of Parliament, taking a seat in the House of Commons.",
  },
  {
    key: "government-formed",
    label: "Government Forms",
    desc: "Whichever party wins more than half of the 650 seats (326+) can form a Government alone. If no party reaches that, parties may form a coalition, or one may govern as a minority.",
  },
  {
    key: "pm-appointed",
    label: "PM Appointed",
    desc: "The Monarch formally invites the leader of the party that can command a Commons majority to become Prime Minister and form a Government.",
  },
];

function FlowDiagram({ stages, activeKey, onSelect, color }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      {stages.map((stage, i) => {
        const active = activeKey === stage.key;
        return (
          <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => onSelect(stage.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 16px 9px 9px",
                borderRadius: 999,
                border: `1.5px solid ${active ? color : COLORS.hairline}`,
                background: active ? color : COLORS.paperCard,
                color: active ? "#fff" : COLORS.ink,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: active ? "0 3px 10px rgba(30,42,68,0.18)" : "none",
                transition: "all 0.15s",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  fontSize: 11,
                  fontFamily: FONT_MONO,
                  background: active ? "rgba(255,255,255,0.25)" : `${color}1A`,
                  color: active ? "#fff" : color,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              {stage.label}
            </button>
            {i < stages.length - 1 && (
              <span style={{ color: color, opacity: 0.4, fontSize: 18, fontWeight: 700 }}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DiagramSection({ title, intro, stages, color }) {
  const [activeKey, setActiveKey] = useState(stages[0].key);
  const active = stages.find((s) => s.key === activeKey);

  return (
    <div
      style={{
        marginBottom: 32,
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderTop: `4px solid ${color}`,
        borderRadius: 16,
        padding: "24px 28px",
        boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>{title}</h2>
      {intro && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 18, maxWidth: 780 }}>
          {intro}
        </p>
      )}
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <FlowDiagram stages={stages} activeKey={activeKey} onSelect={setActiveKey} color={color} />
      </div>
      {active && (
        <div
          style={{
            marginTop: 18,
            background: COLORS.paper,
            border: `1px solid ${COLORS.hairline}`,
            borderLeft: `4px solid ${color}`,
            borderRadius: 10,
            padding: "16px 18px",
            maxWidth: 780,
          }}
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, marginBottom: 6 }}>{active.label}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6 }}>{active.desc}</div>
        </div>
      )}
    </div>
  );
}

function ConstituencyLookup() {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        setError("Couldn't find that postcode — double check it's a valid UK postcode.");
        setLoading(false);
        return;
      }
      const constituency = data.result.parliamentary_constituency;
      const { data: matches } = await supabase.from("politicians").select("*").eq("constituency", constituency).limit(1);
      setResult({ constituency, mp: matches?.[0] ?? null });
    } catch {
      setError("Something went wrong looking that up — please try again.");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderTop: `4px solid ${COLORS.brass}`,
        borderRadius: 16,
        padding: "24px 28px",
        boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>
        Find Your MP
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16, maxWidth: 620 }}>
        Enter your postcode to see which constituency you're in, and who currently represents it in Parliament.
      </p>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, maxWidth: 420, marginBottom: 16 }}>
        <input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="e.g. SW1A 1AA"
          style={{
            flex: 1,
            boxSizing: "border-box",
            padding: "12px 14px",
            fontFamily: FONT_BODY,
            fontSize: 15,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 10,
            background: COLORS.paper,
            color: COLORS.ink,
          }}
        />
        <button
          type="submit"
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 600,
            fontSize: 14,
            padding: "0 20px",
            borderRadius: 10,
            border: "none",
            background: COLORS.ink,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {loading && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Looking up…</div>}
      {error && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: "#9C3B3B" }}>{error}</div>}

      {result && (
        <div style={{ borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 10 }}>
            Constituency: <strong style={{ color: COLORS.ink }}>{result.constituency}</strong>
          </div>
          {result.mp ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {result.mp.thumbnail_url && (
                <img
                  src={result.mp.thumbnail_url}
                  alt=""
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `1px solid ${COLORS.hairline}` }}
                />
              )}
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink }}>{result.mp.name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{result.mp.party}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
              We don't currently have a matching record for this constituency — it may use a slightly
              different name in our data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HowParliamentWorks() {
  return (
    <div style={{ padding: "40px 40px 60px" }}>
      <div style={{ marginBottom: 32, maxWidth: 900 }}>
        <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: COLORS.ink, margin: "10px 0 0" }}>
          How Parliament Works
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 6 }}>
          Click through each stage below to see a plain-English explanation — from who's actually in charge,
          to how a bill becomes law, to how your own MP ends up in Parliament in the first place.
        </p>
      </div>

      <div style={{ maxWidth: 1400 }}>
        <DiagramSection
          title="Who's In Charge?"
          intro="The UK's system separates ceremonial authority, law-making, and day-to-day running of the country into distinct roles."
          stages={STRUCTURE_ROWS}
          color={COLORS.brass}
        />

        <DiagramSection
          title="How a Bill Becomes Law"
          intro="Every law goes through the same basic journey — though it can take anywhere from weeks to years."
          stages={BILL_PROCESS_STAGES}
          color="#3A6EA5"
        />

        <DiagramSection
          title="How MPs Are Elected"
          intro="Every MP in this app got their seat through the same process."
          stages={ELECTION_STAGES}
          color="#2F6F4E"
        />

        <ConstituencyLookup />
      </div>
    </div>
  );
}

// ---- APPG Memberships tab ----
function InfoCard({ title, color, children }) {
  return (
    <div
      style={{
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderTop: `4px solid ${color}`,
        borderRadius: 16,
        padding: "22px 26px",
        boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
        marginBottom: 20,
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

const APPG_EXAMPLES = [
  {
    name: "All-Party Parliamentary Group on Cancer",
    tag: "Health",
    color: "#B5533C",
    desc: "Founded in 1998 to keep cancer care and treatment high on the political agenda. It brings MPs, peers, doctors, researchers, and patients together to push for better, more consistent cancer services across the NHS.",
    secretariat: "Run day-to-day by Macmillan Cancer Support, a cancer charity.",
  },
  {
    name: "All-Party Parliamentary Beer Group",
    tag: "Industry",
    color: "#8A7A3D",
    desc: "Promotes the UK brewing and pub industry — its economic contribution, cultural role, and the challenges pubs and breweries face, from tax to planning rules.",
    secretariat: "Its administration is provided by Ocklynge Consulting, a public affairs firm working for the brewing sector.",
  },
  {
    name: "All-Party Parliamentary Group on Portugal",
    tag: "International",
    color: "#2E6F6F",
    desc: "Builds relationships between UK and Portuguese parliamentarians, and supports trade and cultural ties between the two countries.",
    secretariat: "Administered by the Portuguese Chamber of Commerce in the UK.",
  },
  {
    name: "All-Party Parliamentary Group on Europe",
    tag: "International",
    color: "#5B4E8A",
    desc: "A newer group (first met in late 2024) focused on the UK's evolving relationship with Europe and the EU, aiming to encourage informed, cross-party discussion rather than push a single position.",
    secretariat: "Its secretariat is provided by European Movement UK, a campaign group.",
  },
];

function AppgMemberships() {
  return (
    <div style={{ padding: "40px 40px 60px" }}>
      <div style={{ marginBottom: 28, maxWidth: 900 }}>
        <EyebrowLabel>Public Record · UK Parliament</EyebrowLabel>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: COLORS.ink, margin: "10px 0 0" }}>
          APPG Memberships
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 6 }}>
          All-Party Parliamentary Groups are informal, cross-party groups MPs and peers join to focus on a
          particular topic — and one of the earliest, least visible ways outside organisations connect with
          Parliament.
        </p>
      </div>

      <div style={{ maxWidth: 900 }}>
        <InfoCard title="What is an APPG?" color={COLORS.brass}>
          An All-Party Parliamentary Group brings together MPs and members of the House of Lords who share
          an interest in a topic — a country, a health condition, an industry, a social issue. They have{" "}
          <strong style={{ color: COLORS.ink }}>no official power in Parliament</strong> — they can't pass
          laws — but they regularly host outside speakers, run inquiries, and publish reports that can
          genuinely shape how MPs and ministers think about an issue.
        </InfoCard>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
            A Few Real Examples
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
            APPGs cover almost every topic imaginable — here's a small, varied sample.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {APPG_EXAMPLES.map((group) => (
              <div
                key={group.name}
                style={{
                  background: COLORS.paperCard,
                  border: `1px solid ${COLORS.hairline}`,
                  borderLeft: `5px solid ${group.color}`,
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 1px 4px rgba(30,42,68,0.05)",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    fontFamily: FONT_BODY,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: group.color,
                    background: `${group.color}1A`,
                    padding: "3px 9px",
                    borderRadius: 999,
                    marginBottom: 8,
                  }}
                >
                  {group.tag}
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, marginBottom: 6 }}>
                  {group.name}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.55, marginBottom: 8 }}>
                  {group.desc}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, fontStyle: "italic" }}>
                  {group.secretariat}
                </div>
              </div>
            ))}
          </div>
        </div>

        <InfoCard title="Why It's Worth Knowing About" color="#3A6EA5">
          Running a group takes staff and admin, and that support — called a "secretariat" — is very often
          provided by an outside organisation with a direct stake in the topic: a charity, a trade body, or
          a public affairs firm working for an industry. That's not necessarily improper — it's how these
          groups are usually formed — but it's a genuine, early signal of who an MP is working closely with,
          often well before any formal donation would ever be declared elsewhere.
        </InfoCard>

        <InfoCard title="The Rules APPGs Must Follow" color="#2F6F4E">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>At least 20 members, with officers from more than one political party</li>
            <li style={{ marginBottom: 8 }}>At least two meetings a year, including one Annual General Meeting</li>
            <li style={{ marginBottom: 8 }}>Must publicly declare income or benefits above a set threshold, including secretariat support</li>
            <li>Must re-register roughly every 6 weeks, or the group is automatically dissolved</li>
          </ul>
        </InfoCard>

        <div
          style={{
            background: COLORS.paperCard,
            border: `1px solid ${COLORS.hairline}`,
            borderTop: `4px solid ${COLORS.ink}`,
            borderRadius: 16,
            padding: "22px 26px",
            boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
          }}
        >
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 10 }}>
            Look Up Any MP's Memberships
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 0 }}>
            The full official register is public and searchable — find any MP by name to see every group
            they chair or belong to, and what funding each one has declared. It's updated every few weeks,
            so it's always the most current source.
          </p>
          <a
            href="https://publications.parliament.uk/pa/cm/cmallparty/register/contents.htm"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginTop: 6,
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 14,
              color: "#fff",
              background: COLORS.ink,
              padding: "10px 20px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Open the official APPG Register ↗
          </a>
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
        {view === "appg" && <AppgMemberships />}
        {view === "howitworks" && <HowParliamentWorks />}
        {view === "voting" && <VotingRecords />}
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
