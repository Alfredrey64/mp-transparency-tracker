import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY } from "../theme";
import { partyColour } from "../lib/format";
import { IconSearch, IconGlossary } from "./icons";
import { SECTIONS } from "../data/sidebarSections";
import { filtersForPhrase } from "../lib/careerFilters";

// Where a search result sends you when it isn't one of the page links.
const goHash = (hash) => {
  window.location.hash = hash;
};

// Words that suggest someone is looking for who held a government post.
const OFFICE_WORDS = /\b(secretary|minister|chancellor|leader|whip|chair|speaker|attorney|treasury|lord chancellor)\b/i;

const GROUP_LABEL = { fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(226,232,232,0.45)", padding: "4px 8px" };

function ResultGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={GROUP_LABEL}>{label}</div>
      {children}
    </div>
  );
}

function ResultRow({ onClick, title, sub, dot }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
      <span style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(226,232,232,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
      </span>
    </button>
  );
}

// Flattened once at module load, not per render — SECTIONS doesn't change
// at runtime, and it's already part of the eager bundle regardless (the
// Sidebar it normally feeds is eager too), so there's no bundle cost to
// pulling it in here as well. PAGES skips "glossary" itself: a glossary
// TERM match already offers exactly that destination, so the page entry
// would just be a second, redundant way to say "go to the Glossary".
const PAGES = SECTIONS.flatMap((s) => s.items).filter((i) => i.key !== "glossary");

// Both tables are small enough (~650 MPs, ~100 bills) to keep entirely in
// memory once fetched and filter client-side on every keystroke — a live
// Supabase query per keystroke would be slower and add no real benefit here.
export default function GlobalSearch({ onSelectPolitician, onNavigate }) {
  const [politicians, setPoliticians] = useState([]);
  const [bills, setBills] = useState([]);
  const [peers, setPeers] = useState([]);
  // Loaded via a dynamic import, not a static one at the top of this file —
  // GlobalSearch lives in the Sidebar, which (like Home) is in the one
  // bundle every page pays for on first load. The glossary's full term
  // list is sizeable text; statically importing it here would add it to
  // that bundle for every visitor, whether or not they ever open the
  // search box. Deferred until mount instead, same outcome for the user
  // (search works from the first keystroke almost always, since mount
  // happens well before anyone's finished typing) without the eager cost.
  const [glossaryEntries, setGlossaryEntries] = useState([]);
  // Written answers to common questions, loaded on demand for the same reason as the glossary.
  const [answerTools, setAnswerTools] = useState(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: b }, { data: l }] = await Promise.all([
        supabase.from("politicians").select("*"),
        supabase.from("bills").select("short_title, current_stage, sponsoring_department"),
        supabase.from("peers").select("id, name, party, party_colour, peerage_type"),
      ]);
      setPoliticians(p ?? []);
      setBills(b ?? []);
      setPeers(l ?? []);
    }
    load();
    Promise.all([import("../data/answers"), import("../lib/answerSearch")]).then(([a, s]) => setAnswerTools({ answers: a.ANSWERS, find: s.findAnswers }));
    import("../data/glossaryTerms").then(({ PROCEDURE_TERMS, POLITICS_TERMS, STATISTICS_TERMS }) => {
      setGlossaryEntries([...PROCEDURE_TERMS, ...POLITICS_TERMS, ...STATISTICS_TERMS]);
    });
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
    if (q.length < 2) return { mps: [], peers: [], seats: [], careers: [], offices: false, bills: [], pages: [], glossary: [], answers: [] };
    // A question, or at least a couple of words, rather than a name.
    const answers = answerTools && q.length >= 4 ? answerTools.find(q, answerTools.answers, 3) : [];
    const mps = politicians
      .filter((p) => p.name?.toLowerCase().includes(q) || p.constituency?.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q))
      .slice(0, 5);
    const matchedBills = bills.filter((b) => b.short_title?.toLowerCase().includes(q)).slice(0, 5);
    const pages = PAGES.filter((p) => [p.label, p.hint, ...(p.aka ?? [])].some((t) => t?.toLowerCase().includes(q))).slice(0, 4);
    const glossary = glossaryEntries.filter((g) => g.term.toLowerCase().includes(q) || (g.aliases ?? []).some((a) => a.toLowerCase().includes(q))).slice(0, 4);
    const matchedPeers = peers.filter((p) => p.name?.toLowerCase().includes(q)).slice(0, 4);
    // Constituencies by name, one entry each, opening that seat's page.
    const seats = [...new Set(politicians.map((p) => p.constituency).filter(Boolean))].filter((c) => c.toLowerCase().includes(q)).slice(0, 3);
    const careers = filtersForPhrase(q).slice(0, 3);
    return { mps, peers: matchedPeers, seats, careers, offices: OFFICE_WORDS.test(q) && q.length >= 4, bills: matchedBills, pages, glossary, answers };
  }, [politicians, peers, bills, glossaryEntries, answerTools, query]);

  const hasResults = results.mps.length > 0 || results.peers.length > 0 || results.seats.length > 0 || results.careers.length > 0 || results.offices || results.bills.length > 0 || results.pages.length > 0 || results.glossary.length > 0 || results.answers.length > 0;

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

  // Opens a result that lives at its own address, then clears the box.
  function openHash(hash) {
    goHash(hash);
    setQuery("");
    setOpen(false);
  }

  function selectPage(key) {
    onNavigate?.(key);
    setQuery("");
    setOpen(false);
  }

  function selectGlossaryTerm() {
    onNavigate?.("glossary");
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
          onFocus={(e) => { setOpen(true); e.target.style.borderColor = COLORS.accentOnDark; e.target.style.boxShadow = `0 0 0 3px ${COLORS.accentOnDark}33`; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
          placeholder="Search MPs, councils, topics…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 32px",
            fontFamily: FONT_BODY, fontSize: 12.5, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.05)",
            color: "#fff", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
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

          {results.answers.length > 0 && (
            <ResultGroup label="Answers">
              {results.answers.map((a) => (
                <ResultRow key={a.id} onClick={() => openHash(`#/answers/${a.id}`)} title={a.question} sub="A plain-English answer with the latest figures" />
              ))}
            </ResultGroup>
          )}

          {results.mps.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(226,232,232,0.45)", padding: "4px 8px" }}>
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
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(226,232,232,0.55)" }}>{p.party} · {p.constituency}</div>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {results.peers.length > 0 && (
            <ResultGroup label="Peers">
              {results.peers.map((p) => (
                <ResultRow key={p.id} onClick={() => openHash(`#/lords/${p.id}`)} title={p.name} sub={`${p.party ?? "Crossbench"} · ${p.peerage_type ?? "Peer"}`} dot={partyColour(p.party_colour, "rgba(226,232,232,0.5)")} />
              ))}
            </ResultGroup>
          )}

          {results.seats.length > 0 && (
            <ResultGroup label="Constituencies">
              {results.seats.map((c) => (
                <ResultRow key={c} onClick={() => openHash(`#/constituency/${encodeURIComponent(c)}`)} title={c} sub="Result, history and local petitions" />
              ))}
            </ResultGroup>
          )}

          {(results.careers.length > 0 || results.offices) && (
            <ResultGroup label="Explore">
              {results.careers.map((f) => (
                <ResultRow key={f.key} onClick={() => openHash(`#/list/career=${f.key}`)} title={`MPs: ${f.label.toLowerCase()}`} sub="Filter the MP list" />
              ))}
              {results.offices && (
                <ResultRow onClick={() => openHash(`#/offices/${encodeURIComponent(query.trim())}`)} title={`Who has held “${query.trim()}”?`} sub="Search government and shadow posts" />
              )}
            </ResultGroup>
          )}

          {results.bills.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(226,232,232,0.45)", padding: "4px 8px" }}>
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
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(226,232,232,0.55)" }}>{b.current_stage ?? "Bill"}</div>
                </button>
              ))}
            </div>
          )}

          {results.pages.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(226,232,232,0.45)", padding: "4px 8px" }}>
                Pages
              </div>
              {results.pages.map((p) => (
                <button
                  key={p.key}
                  onClick={() => selectPage(p.key)}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", color: "rgba(226,232,232,0.55)", flexShrink: 0 }}>
                    <p.icon size={13} />
                  </span>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</div>
                </button>
              ))}
            </div>
          )}

          {results.glossary.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(226,232,232,0.45)", padding: "4px 8px" }}>
                Glossary
              </div>
              {results.glossary.map((g) => (
                <button
                  key={g.term}
                  onClick={selectGlossaryTerm}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", color: "rgba(226,232,232,0.55)", flexShrink: 0, marginTop: 2 }}>
                    <IconGlossary size={13} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#fff" }}>{g.term}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(226,232,232,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.def}</div>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
