import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY } from "../theme";
import { partyColour } from "../lib/format";
import { IconSearch } from "./icons";

// Both tables are small enough (~650 MPs, ~100 bills) to keep entirely in
// memory once fetched and filter client-side on every keystroke — a live
// Supabase query per keystroke would be slower and add no real benefit here.
export default function GlobalSearch({ onSelectPolitician, onNavigate }) {
  const [politicians, setPoliticians] = useState([]);
  const [bills, setBills] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase.from("politicians").select("*"),
        supabase.from("bills").select("short_title, current_stage, sponsoring_department"),
      ]);
      setPoliticians(p ?? []);
      setBills(b ?? []);
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { mps: [], bills: [] };
    const mps = politicians
      .filter((p) => p.name?.toLowerCase().includes(q) || p.constituency?.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q))
      .slice(0, 5);
    const matchedBills = bills.filter((b) => b.short_title?.toLowerCase().includes(q)).slice(0, 5);
    return { mps, bills: matchedBills };
  }, [politicians, bills, query]);

  const hasResults = results.mps.length > 0 || results.bills.length > 0;

  function selectPolitician(p) {
    onSelectPolitician?.(p);
    setQuery("");
    setOpen(false);
  }

  function selectBill() {
    onNavigate?.("voting");
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", marginBottom: 4 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(226,232,232,0.5)", display: "flex" }}>
          <IconSearch size={14} />
        </span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search MPs, bills…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 32px",
            fontFamily: FONT_BODY, fontSize: 12.5, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.05)",
            color: "#fff", outline: "none",
          }}
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
            background: COLORS.sidebarBgDeep, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
            boxShadow: "0 12px 28px rgba(0,0,0,0.4)", padding: 6, maxHeight: 340, overflowY: "auto",
          }}
        >
          {!hasResults && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "rgba(226,232,232,0.55)", padding: "8px 6px" }}>
              No matches.
            </div>
          )}

          {results.mps.length > 0 && (
            <div style={{ marginBottom: results.bills.length > 0 ? 4 : 0 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(226,232,232,0.45)", padding: "4px 8px" }}>
                MPs
              </div>
              {results.mps.map((p) => {
                const color = partyColour(p.party_colour, "rgba(226,232,232,0.5)");
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPolitician(p)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: "rgba(226,232,232,0.55)" }}>{p.party} · {p.constituency}</div>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {results.bills.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(226,232,232,0.45)", padding: "4px 8px" }}>
                Bills
              </div>
              {results.bills.map((b, i) => (
                <button
                  key={i}
                  onClick={selectBill}
                  style={{ display: "block", width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.short_title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: "rgba(226,232,232,0.55)" }}>{b.current_stage ?? "Bill"}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
