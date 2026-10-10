import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { FONT_BODY } from "../theme";
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

const GROUP_LABEL = { fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--sb-faint)", padding: "4px 8px" };

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
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
      <span style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "var(--sb-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "var(--sb-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
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
  // Statistics, councils and donors, loaded on demand for the same reason.
  const [siteTools, setSiteTools] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Nothing is fetched until the search box is first used (focused or typed in), so a visitor who never searches never pays for the
  // MP list, the glossary, the statistics index and the rest. It starts the moment the box is focused, which is before the first key.
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);
  const startLoading = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    const people = (async () => {
      const [{ data: p }, { data: b }, { data: l }] = await Promise.all([
        supabase.from("politicians").select("*"),
        supabase.from("bills").select("short_title, current_stage, sponsoring_department"),
        supabase.from("peers").select("id, name, party, party_colour, peerage_type"),
      ]);
      setPoliticians(p ?? []);
      setBills(b ?? []);
      setPeers(l ?? []);
    })().catch(() => {});
    const answers = Promise.all([import("../data/answers"), import("../lib/answerSearch")]).then(([a, s]) => setAnswerTools({ answers: a.ANSWERS, find: s.findAnswers }));
    const site = Promise.all([
      import("../lib/siteSearch"), import("../data/onsSectors"), import("../data/councilsIndex.json"),
      import("../data/donorSectors.json"), import("../data/partyDonorSectors.json"), import("../data/donorProfiles.json"),
    ]).then(([ss, ons, councils, donorsA, donorsB, donorsC]) => {
      setSiteTools({
        find: ss,
        measures: ss.buildMeasureIndex(ons.ALL_SERIES, ons.refOf),
        councils: ss.buildCouncilIndex(councils.default.index),
        donors: ss.buildDonorIndex(Object.keys(donorsA.default), Object.keys(donorsB.default), Object.keys(donorsC.default)),
      });
    }).catch(() => {});
    const glossary = import("../data/glossaryTerms").then(({ PROCEDURE_TERMS, POLITICS_TERMS, STATISTICS_TERMS }) => {
      setGlossaryEntries([...PROCEDURE_TERMS, ...POLITICS_TERMS, ...STATISTICS_TERMS]);
    });
    Promise.allSettled([people, answers, site, glossary]).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // "/" or Ctrl/Cmd+K jumps to the search box from anywhere on the page.
  useEffect(() => {
    function onKey(e) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? "") || e.target?.isContentEditable;
      const wants = (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k");
      if (!wants || !inputRef.current || inputRef.current.offsetParent === null) return;
      e.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Arrow keys move through the results, Escape closes them.
  function onBoxKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && !(e.key === "Enter" && e.target === inputRef.current)) return;
    const buttons = [...(dropdownRef.current?.querySelectorAll("button") ?? [])];
    if (!buttons.length) return;
    e.preventDefault();
    if (e.key === "Enter") { buttons[0].click(); return; }
    const at = buttons.indexOf(document.activeElement);
    const next = e.key === "ArrowDown" ? (at + 1) % buttons.length : at <= 0 ? -1 : at - 1;
    if (next === -1) inputRef.current?.focus(); else buttons[next].focus();
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { mps: [], peers: [], seats: [], careers: [], offices: false, bills: [], pages: [], glossary: [], answers: [], measures: [], councils: [], donors: [], trace: false };
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
    const measures = siteTools ? siteTools.find.findMeasures(q, siteTools.measures, 4) : [];
    const councils = siteTools ? siteTools.find.findCouncils(q, siteTools.councils, 3) : [];
    const donors = siteTools ? siteTools.find.findDonors(q, siteTools.donors, 3) : [];
    return { mps, peers: matchedPeers, seats, careers, offices: OFFICE_WORDS.test(q) && q.length >= 4, bills: matchedBills, pages, glossary, answers, measures, councils, donors, trace: q.length >= 3 };
  }, [politicians, peers, bills, glossaryEntries, answerTools, siteTools, query]);

  const hasResults = results.mps.length > 0 || results.peers.length > 0 || results.seats.length > 0 || results.careers.length > 0 || results.offices || results.bills.length > 0 || results.pages.length > 0 || results.glossary.length > 0 || results.answers.length > 0 || results.measures.length > 0 || results.councils.length > 0 || results.donors.length > 0 || results.trace;

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
      <div style={{ position: "relative" }} onKeyDown={onBoxKeyDown}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sb-faint)", display: "flex" }}>
          <IconSearch size={14} />
        </span>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search the site"
          value={query}
          onChange={(e) => { startLoading(); setQuery(e.target.value); setOpen(true); }}
          onFocus={(e) => { startLoading(); setOpen(true); e.target.style.borderColor = "var(--sb-accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.22)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--sb-border)"; e.target.style.boxShadow = "none"; }}
          placeholder="Search MPs, donors, numbers… (press /)"
          style={{
            width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 32px",
            fontFamily: FONT_BODY, fontSize: 12.5, borderRadius: 8,
            border: "1px solid var(--sb-border)", background: "var(--sb-surface)",
            color: "var(--sb-strong)", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div
          ref={dropdownRef}
          onKeyDown={onBoxKeyDown}
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
            background: "var(--sb-bg-2)", border: "1px solid var(--sb-border-strong)", borderRadius: 10,
            boxShadow: "0 16px 32px -12px rgba(15,15,40,0.35)", padding: 6, maxHeight: 340, overflowY: "auto",
          }}
        >
          {!hasResults && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "var(--sb-soft)", padding: "8px 6px" }}>
              {loading ? "Getting ready…" : "No matches."}
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
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--sb-faint)", padding: "4px 8px" }}>
                MPs
              </div>
              {results.mps.map((p) => {
                const color = partyColour(p.party_colour, "var(--sb-faint)");
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPolitician(p)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "var(--sb-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "var(--sb-soft)" }}>{p.party} · {p.constituency}</div>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {results.peers.length > 0 && (
            <ResultGroup label="Peers">
              {results.peers.map((p) => (
                <ResultRow key={p.id} onClick={() => openHash(`#/lords/${p.id}`)} title={p.name} sub={`${p.party ?? "Crossbench"} · ${p.peerage_type ?? "Peer"}`} dot={partyColour(p.party_colour, "var(--sb-faint)")} />
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
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--sb-faint)", padding: "4px 8px" }}>
                Bills
              </div>
              {results.bills.map((b, i) => (
                <button
                  key={i}
                  onClick={selectBill}
                  style={{ display: "block", width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "var(--sb-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.short_title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "var(--sb-soft)" }}>{b.current_stage ?? "Bill"}</div>
                </button>
              ))}
            </div>
          )}

          {results.measures.length > 0 && (
            <ResultGroup label="Statistics">
              {results.measures.map((m) => (
                <ResultRow key={m.ref} onClick={() => openHash(`#/indicators/${m.ref}`)} title={m.label} sub={`${m.sectorLabel}: see how it has changed`} />
              ))}
            </ResultGroup>
          )}

          {results.councils.length > 0 && (
            <ResultGroup label="Councils">
              {results.councils.map((c) => (
                <ResultRow key={c.id} onClick={() => openHash(`#/councils/${c.id}`)} title={c.name} sub={c.control || "Who runs it and who sits on it"} />
              ))}
            </ResultGroup>
          )}

          {(results.donors.length > 0 || results.trace) && (
            <ResultGroup label="Money">
              {results.donors.map((d) => (
                <ResultRow key={d.name} onClick={() => openHash(`#/followTheMoney/${encodeURIComponent(d.name)}`)} title={d.name} sub="Trace everyone this donor has funded" />
              ))}
              {results.trace && (
                <ResultRow onClick={() => openHash(`#/followTheMoney/${encodeURIComponent(query.trim())}`)} title={`Trace “${query.trim()}” as a donor`} sub="Search MPs' interests and party donations for this name" />
              )}
            </ResultGroup>
          )}

          {results.pages.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--sb-faint)", padding: "4px 8px" }}>
                Pages
              </div>
              {results.pages.map((p) => (
                <button
                  key={p.key}
                  onClick={() => selectPage(p.key)}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", color: "var(--sb-soft)", flexShrink: 0 }}>
                    <p.icon size={13} />
                  </span>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "var(--sb-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</div>
                </button>
              ))}
            </div>
          )}

          {results.glossary.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--sb-faint)", padding: "4px 8px" }}>
                Glossary
              </div>
              {results.glossary.map((g) => (
                <button
                  key={g.term}
                  onClick={selectGlossaryTerm}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%", background: "none", border: "none", padding: "7px 8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", color: "var(--sb-soft)", flexShrink: 0, marginTop: 2 }}>
                    <IconGlossary size={13} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "var(--sb-strong)" }}>{g.term}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "var(--sb-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.def}</div>
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
