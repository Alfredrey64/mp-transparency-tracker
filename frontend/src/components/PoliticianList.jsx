import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { partyColour, initials } from "../lib/format";
import { PageHeader } from "./shared";
import { IconCoin } from "./icons";

function SkeletonCard() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 12,
      }}
    >
      <div className="skeleton-pulse" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton-pulse" style={{ width: "70%", height: 14, borderRadius: 4 }} />
        <div className="skeleton-pulse" style={{ width: "45%", height: 11, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function Avatar({ politician, color }) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (politician.thumbnail_url && !errored) {
    return (
      <div
        style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: COLORS.paperCard, border: `2px solid ${COLORS.paperCard}`,
          boxShadow: `0 0 0 2px ${color}55`,
        }}
      >
        <img
          src={politician.thumbnail_url}
          alt=""
          onError={() => setErrored(true)}
          onLoad={() => setLoaded(true)}
          style={{
            width: 35, height: 35, borderRadius: "50%", objectFit: "cover", objectPosition: "center top",
            opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_DISPLAY,
        fontSize: 14,
        fontWeight: 600,
        color: "#fff",
        background: color,
      }}
    >
      {initials(politician.name)}
    </div>
  );
}

export default function PoliticianList({ onSelect }) {
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [activeParty, setActiveParty] = useState("All");
  const [sortBy, setSortBy] = useState("name");

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

  const parties = useMemo(() => {
    const map = new Map();
    for (const p of politicians) {
      if (!p.party) continue;
      if (!map.has(p.party)) map.set(p.party, { name: p.party, color: partyColour(p.party_colour, COLORS.inkSoft), count: 0 });
      map.get(p.party).count += 1;
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [politicians]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = politicians;
    if (activeParty !== "All") list = list.filter((p) => p.party === activeParty);
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.constituency?.toLowerCase().includes(q) ||
          p.party?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "constituency") {
      list = [...list].sort((a, b) => (a.constituency ?? "").localeCompare(b.constituency ?? ""));
    }
    return list;
  }, [politicians, query, activeParty, sortBy]);

  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCoin}
        title="Who's Funding Your MPs?"
        subtitle={loading ? "Loading current MPs…" : `Search, filter, and explore declared gifts, donations, and interests for ${politicians.length} current MPs — updated daily from the official register. Showing ${filtered.length} now.`}
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, constituency, or party"
          style={{
            flex: "1 1 320px",
            maxWidth: 480,
            boxSizing: "border-box",
            padding: "13px 16px",
            fontFamily: FONT_BODY,
            fontSize: 16,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 10,
            background: COLORS.paperCard,
            color: COLORS.ink,
            boxShadow: "0 1px 3px rgba(30,42,68,0.05)",
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = COLORS.brass)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.hairline)}
        />
        <button
          onClick={() => setSortBy(sortBy === "name" ? "constituency" : "name")}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.inkSoft,
            background: "transparent",
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 10,
            padding: "12px 16px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Sort: {sortBy === "name" ? "Name" : "Constituency"} ⇅
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <button
          onClick={() => setActiveParty("All")}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 600,
            padding: "7px 14px",
            borderRadius: 999,
            border: `1px solid ${activeParty === "All" ? COLORS.ink : COLORS.hairline}`,
            background: activeParty === "All" ? COLORS.ink : "transparent",
            color: activeParty === "All" ? "#fff" : COLORS.inkSoft,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          All parties
        </button>
        {parties.map((party) => {
          const active = activeParty === party.name;
          return (
            <button
              key={party.name}
              onClick={() => setActiveParty(active ? "All" : party.name)}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 999,
                border: `1px solid ${active ? party.color : COLORS.hairline}`,
                background: active ? `${party.color}1a` : "transparent",
                color: active ? party.color : COLORS.inkSoft,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: party.color }} />
              {party.name}
              <span style={{ opacity: 0.6, fontWeight: 400 }}>{party.count}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ color: "#9C3B3B", fontFamily: FONT_BODY, fontSize: 13.5, marginBottom: 16 }}>
          Couldn't load data: {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {loading &&
          Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading &&
          filtered.map((p, i) => {
            const color = partyColour(p.party_colour, COLORS.inkSoft);
            return (
              <motion.button
                key={p.id}
                onClick={() => onSelect(p)}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "80px" }}
                transition={{ duration: 0.25, delay: (i % 16) * 0.02, ease: "easeOut" }}
                whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(30,42,68,0.14)", borderColor: color }}
                whileTap={{ y: 0 }}
                style={{
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: `linear-gradient(135deg, ${color}1c, ${color}08 55%, ${COLORS.paperCard} 100%)`,
                  border: `1px solid ${COLORS.hairline}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(30,42,68,0.06)",
                }}
              >
                <Avatar politician={p} color={color} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.party} · {p.constituency}
                  </div>
                </span>
              </motion.button>
            );
          })}

        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
            No MPs match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
