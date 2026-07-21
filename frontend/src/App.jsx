import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

// ---- Design tokens (kept consistent with the original prototype) ----
const COLORS = {
  ink: "#1E2A44",
  inkSoft: "#425073",
  paper: "#ECEBE3",
  paperCard: "#F7F6F1",
  hairline: "#D8D6C9",
  brass: "#A8823D",
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

// The official category names are long and wrap awkwardly — shorten the common ones.
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
    <div>
      <div style={{ padding: "24px 20px 12px" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.14em", color: COLORS.brass, textTransform: "uppercase", marginBottom: 4 }}>
          Public Record · UK Parliament
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: COLORS.ink, margin: 0 }}>
          MP Financial Interests
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 6 }}>
          {loading ? "Loading current MPs…" : `${politicians.length} current MPs, updated daily from the official register.`}
        </p>
      </div>

      <div style={{ padding: "0 20px 14px" }}>
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
        <div style={{ padding: "0 20px", color: "#9C3B3B", fontFamily: FONT_BODY, fontSize: 13.5 }}>
          Couldn't load data: {error}
        </div>
      )}

      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
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
    <div>
      <div style={{ padding: "16px 20px 0" }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: 0, marginBottom: 12 }}
        >
          ← All MPs
        </button>
      </div>

      <div style={{ padding: "0 20px 16px", borderBottom: `1px solid ${COLORS.hairline}`, display: "flex", gap: 14, alignItems: "center" }}>
        {politician.thumbnail_url && (
          <img
            src={politician.thumbnail_url}
            alt=""
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `1px solid ${COLORS.hairline}` }}
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

      <div style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading declared interests…</div>}

        {!loading && interests.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
            No declared financial interests found for this MP.
          </div>
        )}

        {interests.map((item) => (
          <div key={item.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, textDecoration: "none" }}>
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
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#DCDACD", minHeight: "100vh", padding: "24px 0", fontFamily: FONT_BODY }}>
      <div style={{ width: "100%", maxWidth: 480, background: COLORS.paper, borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 40px rgba(30,42,68,0.18)", minHeight: 640 }}>
        {selected ? (
          <PoliticianDetail politician={selected} onBack={() => setSelected(null)} />
        ) : (
          <PoliticianList onSelect={setSelected} />
        )}
      </div>
    </div>
  );
}
