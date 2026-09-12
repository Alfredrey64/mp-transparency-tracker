import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { PageHeader } from "./shared";
import { IconFormerMP } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";

const REASON_COLOR = {
  "Resigned": "#B08A2E",
  "Did not return at the next election": COLORS.inkSoft,
  "Death": "#6B5B95",
};

const REASON_ORDER = ["Resigned", "Did not return at the next election", "Death"];

const SORTS = [
  { key: "recent", label: "Most recent" },
  { key: "az", label: "A–Z" },
];

function Avatar({ url, name, color }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: color, color: "#fff", fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600 }}>
        {name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
      </div>
    );
  }
  return (
    <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}` }}>
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", objectPosition: "center", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
      />
    </div>
  );
}

export default function FormerMps() {
  const [mps, setMps] = useState(null);
  const [query, setQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("former_mps")
        .select("*")
        .order("membership_end_date", { ascending: false });
      setMps(data ?? []);
    }
    load();
  }, []);

  const reasons = useMemo(() => {
    if (!mps) return [];
    const present = new Set(mps.map((m) => m.membership_end_reason).filter(Boolean));
    const ordered = REASON_ORDER.filter((r) => present.has(r));
    const extra = [...present].filter((r) => !REASON_ORDER.includes(r));
    return [...ordered, ...extra];
  }, [mps]);

  const reasonCounts = useMemo(() => {
    if (!mps) return null;
    const counts = new Map();
    for (const m of mps) {
      const r = m.membership_end_reason ?? "Unknown";
      counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    return counts;
  }, [mps]);

  const filtered = useMemo(() => {
    if (!mps) return [];
    const q = query.trim().toLowerCase();
    let list = mps.filter((m) => {
      if (reasonFilter !== "All" && m.membership_end_reason !== reasonFilter) return false;
      if (!q) return true;
      return m.name?.toLowerCase().includes(q) || m.constituency?.toLowerCase().includes(q) || m.party?.toLowerCase().includes(q);
    });
    if (sort === "az") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [mps, query, reasonFilter, sort]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconFormerMP}
        kicker="Public Record · Former MPs"
        title="Who's recently left Parliament"
        subtitle="The most recent MPs to leave the Commons — by resignation, at a general election, or death — pulled daily from the official record."
      />

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
          marginTop: 24, marginBottom: 24, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        This shows <em>that</em> someone left and Parliament's own recorded reason for it — it can't tell you what
        they went on to do afterwards. There's no reliable, automatically-updating source for that, so rather than
        guess, we've simply left it out.
      </div>

      {reasonCounts && reasonCounts.size > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          {reasons.map((r) => (
            <div
              key={r}
              style={{
                display: "flex", alignItems: "center", gap: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`,
                borderRadius: 10, padding: "9px 14px",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: REASON_COLOR[r] ?? COLORS.inkSoft, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
                <strong>{reasonCounts.get(r) ?? 0}</strong> <span style={{ color: COLORS.inkSoft }}>{r}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, constituency, or party"
        style={{
          width: "100%", maxWidth: 420, boxSizing: "border-box", marginBottom: 16, padding: "12px 16px",
          fontFamily: FONT_BODY, fontSize: 15, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
          background: COLORS.paperCard, color: COLORS.ink,
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["All", ...reasons].map((r) => (
            <button
              key={r}
              onClick={() => withScrollPreserved(() => setReasonFilter(r))}
              style={{
                fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999,
                border: `1px solid ${reasonFilter === r ? COLORS.ink : COLORS.hairline}`,
                background: reasonFilter === r ? COLORS.ink : "transparent",
                color: reasonFilter === r ? COLORS.paper : COLORS.inkSoft,
                cursor: "pointer",
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 2, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 3 }}>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => withScrollPreserved(() => setSort(s.key))}
              style={{
                position: "relative", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999,
                border: "none", cursor: "pointer", background: "transparent", color: sort === s.key ? "#fff" : COLORS.inkSoft,
              }}
            >
              {sort === s.key && (
                <motion.span
                  layoutId="former-mps-sort-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  style={{ position: "absolute", inset: 0, background: COLORS.ink, borderRadius: 999, zIndex: 0 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {mps === null && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>}
      {mps !== null && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          {mps.length === 0 ? "No data yet — check back after the next daily update." : "No one matches that search."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map((m) => {
          const color = partyColour(m.party_colour, COLORS.inkSoft);
          const reasonColor = REASON_COLOR[m.membership_end_reason] ?? COLORS.inkSoft;
          const isOpen = expanded === m.parliament_member_id;
          return (
            <div key={m.parliament_member_id} style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
              <button
                onClick={() => setExpanded(isOpen ? null : m.parliament_member_id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 0", width: "100%",
                  background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <Avatar url={m.thumbnail_url} name={m.name} color={color} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{m.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.party} · {m.constituency}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>{formatDate(m.membership_end_date)}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: reasonColor, marginTop: 2 }}>{m.membership_end_reason}</div>
                </div>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: COLORS.inkSoft, fontSize: 11, marginLeft: 4 }}>▾</motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 0 16px 58px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6 }}>
                      Represented {m.constituency} for the {m.party}, until leaving the Commons on{" "}
                      {formatDate(m.membership_end_date)}.
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={`https://members.parliament.uk/member/${m.parliament_member_id}/`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: color }}
                        >
                          View official Parliament profile ↗
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
