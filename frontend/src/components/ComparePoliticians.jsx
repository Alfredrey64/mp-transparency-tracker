import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { partyColour } from "../lib/format";
import { IconCompare, IconSearch } from "./icons";

const MAX_COMPARE = 3;
const NO_PARTY_MAJORITY_CONCEPT = ["independent", "speaker"];

function Avatar({ url, name, color, size = 56 }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: color, color: "#fff", fontFamily: FONT_DISPLAY, fontSize: size * 0.34, fontWeight: 600,
        }}
      >
        {name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, overflow: "hidden" }}>
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ width: Math.round(size * 0.72), height: Math.round(size * 0.72), borderRadius: "50%", objectFit: "cover", objectPosition: "center", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
      />
    </div>
  );
}

// One count/sum query per metric, per selected MP — small numbers (at most
// MAX_COMPARE MPs at a time) so running them all in parallel on selection
// change is simpler than a combined query, and fast enough not to need
// caching. Keyed by the joined id list so it only re-fetches when the
// actual selection changes, not on every render.
function useComparisonStats(politicianIds) {
  const [stats, setStats] = useState({});
  const key = politicianIds.join(",");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (politicianIds.length === 0) {
        if (!cancelled) setStats({});
        return;
      }
      const entries = await Promise.all(
        politicianIds.map(async (id) => {
          const [interests, votesTotal, votesAye, rebellionTotal, rebellionAgainst] = await Promise.all([
            supabase.from("financial_interests").select("value_amount").eq("politician_id", id).not("value_amount", "is", null),
            supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", id),
            supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", id).eq("voted_aye", true),
            supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", id).not("voted_with_party_majority", "is", null),
            supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", id).eq("voted_with_party_majority", false),
          ]);
          const totalValue = (interests.data ?? []).reduce((sum, r) => sum + (r.value_amount ?? 0), 0);
          return [
            id,
            {
              donationCount: interests.data?.length ?? 0,
              totalValue,
              votesTotal: votesTotal.count ?? 0,
              votesAye: votesAye.count ?? 0,
              rebellionTotal: rebellionTotal.count ?? 0,
              rebellionAgainst: rebellionAgainst.count ?? 0,
            },
          ];
        })
      );
      if (!cancelled) setStats(Object.fromEntries(entries));
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return stats;
}

function SearchPicker({ politicians, selectedIds, onAdd, disabled }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return politicians
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => p.name?.toLowerCase().includes(q) || p.constituency?.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [politicians, query, selectedIds]);

  return (
    <div style={{ position: "relative", maxWidth: 420 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? `Up to ${MAX_COMPARE} MPs at once` : "Search by name or constituency to add an MP…"}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: disabled ? COLORS.paper : COLORS.paperCard,
            color: COLORS.ink, opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>
      {matches.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 10, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, boxShadow: "0 10px 24px rgba(30,42,68,0.12)", padding: 6, maxHeight: 320, overflowY: "auto" }}>
          {matches.map((p) => {
            const color = partyColour(p.party_colour, COLORS.inkSoft);
            return (
              <button
                key={p.id}
                onClick={() => { onAdd(p); setQuery(""); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.paper; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{p.party} · {p.constituency}</div>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, children }) {
  return (
    <div style={{ padding: "10px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function ComparisonCard({ politician, stats, committeeNames, color, onRemove }) {
  const hasRebellionConcept = !NO_PARTY_MAJORITY_CONCEPT.includes((politician.party ?? "").toLowerCase());
  const rebellionPct = stats && hasRebellionConcept && stats.rebellionTotal > 0
    ? Math.round((stats.rebellionAgainst / stats.rebellionTotal) * 1000) / 10
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${color}`, borderRadius: 14, padding: 18, minWidth: 0 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar url={politician.thumbnail_url} name={politician.name} color={color} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {politician.name}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{politician.party}</div>
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${politician.name}`}
          style={{ flexShrink: 0, background: "none", border: "none", color: COLORS.inkSoft, cursor: "pointer", fontSize: 15, padding: 4, opacity: 0.6 }}
        >
          ×
        </button>
      </div>

      <StatRow label="Constituency">{politician.constituency ?? "—"}</StatRow>
      {politician.cabinet_role && <StatRow label="Government role">{politician.cabinet_role}</StatRow>}

      {!stats ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "16px 0" }}>Loading…</div>
      ) : (
        <>
          <StatRow label="Declared interests">
            {stats.donationCount} entr{stats.donationCount === 1 ? "y" : "ies"} with a value
            {stats.totalValue > 0 && <> · £{Math.round(stats.totalValue).toLocaleString()} total</>}
          </StatRow>
          <StatRow label="Recorded Commons votes">
            {stats.votesTotal > 0 ? (
              <>{stats.votesAye} Aye · {stats.votesTotal - stats.votesAye} No <span style={{ color: COLORS.inkSoft }}>(of {stats.votesTotal})</span></>
            ) : "No recorded votes yet"}
          </StatRow>
          {rebellionPct !== null && (
            <StatRow label="Rebellion rate">
              <span style={{ color: rebellionPct > 0 ? "#9C3B3B" : COLORS.ink, fontWeight: 600 }}>{rebellionPct}%</span>
              <span style={{ color: COLORS.inkSoft }}> of {stats.rebellionTotal} party-line votes</span>
            </StatRow>
          )}
          <StatRow label="Select committees">
            {committeeNames.length > 0 ? committeeNames.join(", ") : "Not currently on a select committee"}
          </StatRow>
        </>
      )}
    </motion.div>
  );
}

export default function ComparePoliticians() {
  const [politicians, setPoliticians] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    supabase.from("politicians").select("id, name, party, party_colour, constituency, thumbnail_url, cabinet_role, parliament_member_id").then(({ data }) => setPoliticians(data ?? []));
    supabase.from("committees").select("id, name, members").then(({ data }) => setCommittees(data ?? []));
  }, []);

  const selectedIds = useMemo(() => selected.map((p) => p.id), [selected]);
  const stats = useComparisonStats(selectedIds);

  function addPolitician(p) {
    if (selected.length >= MAX_COMPARE) return;
    setSelected((prev) => [...prev, p]);
  }

  function removePolitician(id) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  function committeesFor(politician) {
    if (!politician.parliament_member_id) return [];
    return committees
      .filter((c) => (c.members ?? []).some((m) => m.parliament_member_id === politician.parliament_member_id))
      .map((c) => c.name);
  }

  const palette = ["#5A7FA6", "#B5533C", "#3F7D5C"];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCompare}
        kicker="Public Record · Compare MPs"
        title="Compare MPs side by side"
        subtitle={`Pick up to ${MAX_COMPARE} MPs to see their declared interests, voting record, rebellion rate, and select committee memberships next to each other.`}
      />

      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <SearchPicker politicians={politicians} selectedIds={selectedIds} onAdd={addPolitician} disabled={selected.length >= MAX_COMPARE} />
      </div>

      {selected.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: "20px 0" }}>
          Search for an MP above to start comparing.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {selected.map((p, i) => (
              <ComparisonCard
                key={p.id}
                politician={p}
                stats={stats[p.id]}
                committeeNames={committeesFor(p)}
                color={partyColour(p.party_colour, palette[i % palette.length])}
                onRemove={() => removePolitician(p.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
