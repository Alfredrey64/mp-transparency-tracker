/** @jsxImportSource react */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable, solid } from "../theme";
import { PageHeader } from "./shared";
import { IconGlossary, IconSearch } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";
import { PROCEDURE_TERMS, POLITICS_TERMS, STATISTICS_TERMS } from "../data/glossaryTerms";
import { wordOfTheDay, makeQuestion } from "../lib/glossaryGame";

const TABS = [
  { key: "procedure", label: "Parliamentary terms", blurb: "How Parliament works: bills, votes, committees and who does what.", accent: "#4F46E5" },
  { key: "politics", label: "Political terms and issues", blurb: "Parties, elections and the language of political news.", accent: "#C0478A" },
  { key: "statistics", label: "Statistics and economy", blurb: "The numbers behind the economy and the country.", accent: "#0E9AA7" },
];
const TERMS_BY_TAB = { procedure: PROCEDURE_TERMS, politics: POLITICS_TERMS, statistics: STATISTICS_TERMS };

function groupByLetter(terms) {
  const groups = [];
  let current = null;
  for (const t of terms) {
    const letter = t.term[0].toUpperCase();
    if (!current || current.letter !== letter) {
      current = { letter, items: [] };
      groups.push(current);
    }
    current.items.push(t);
  }
  return groups;
}

function StageFlowDiagram({ items, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, rowGap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <span style={{ color: readable(accent), fontSize: 12, fontWeight: 700 }}>→</span>}
          <div style={{ background: `${accent}14`, border: `1px solid ${accent}45`, borderRadius: 7, padding: "5px 9px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, color: COLORS.ink, whiteSpace: "nowrap" }}>
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}

function BackForthDiagram({ a, b, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ background: `${accent}14`, border: `1px solid ${accent}45`, borderRadius: 8, padding: "8px 16px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.ink }}>{a}</div>
      <span style={{ color: readable(accent), fontSize: 18, fontWeight: 700 }}>⇄</span>
      <div style={{ background: `${accent}14`, border: `1px solid ${accent}45`, borderRadius: 8, padding: "8px 16px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.ink }}>{b}</div>
    </div>
  );
}

function SpectrumDiagram({ left, right, accent }) {
  return (
    <div style={{ maxWidth: 260 }}>
      <div style={{ height: 6, borderRadius: 999, background: `linear-gradient(90deg, #C8102E, ${accent}, #0087DC)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11, color: COLORS.inkSoft }}>
        <span>{left}</span>
        <span>Centre</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function SeatBarDiagram({ segments }) {
  return (
    <div style={{ maxWidth: 320 }}>
      <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden" }}>
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${s.pct}%`, background: s.color }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        {segments.map((s, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TermDiagram({ diagram, accent }) {
  if (diagram.type === "stages") return <StageFlowDiagram items={diagram.items} accent={accent} />;
  if (diagram.type === "backforth") return <BackForthDiagram a={diagram.a} b={diagram.b} accent={accent} />;
  if (diagram.type === "spectrum") return <SpectrumDiagram left={diagram.left} right={diagram.right} accent={accent} />;
  if (diagram.type === "seats") return <SeatBarDiagram segments={diagram.segments} />;
  return null;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// The border is set side by side (never "border" together with "borderLeft"): React only rewrites a property whose value changed,
// so a shorthand that changes would quietly wipe out an unchanged left edge, which is how the coloured edge used to vanish after a click.
function TermRow({ t, isOpen, onToggle, accent }) {
  const edge = isOpen ? `${accent}77` : COLORS.hairline;
  return (
    <div
      className={isOpen ? "gl-row gl-open" : "gl-row"}
      style={{
        borderRadius: 16, borderTop: `1px solid ${edge}`, borderRight: `1px solid ${edge}`, borderBottom: `1px solid ${edge}`, borderLeft: `5px solid ${accent}`,
        background: isOpen ? `linear-gradient(135deg, ${accent}1c, ${COLORS.paperCard} 65%)` : COLORS.paperCard,
        boxShadow: isOpen ? `0 18px 36px -26px ${accent}` : "none", transition: "background 0.2s, box-shadow 0.2s",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="ons-chip gl-row-btn"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", width: "100%", background: "none", border: "none", padding: "14px 18px", cursor: "pointer", textAlign: "left", gap: "2px 14px" }}
      >
        <span className="gl-term-line" style={{ minWidth: 0 }}>
          <span className="gl-term" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: COLORS.ink, lineHeight: 1.25 }}>{t.term}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ width: 28, height: 28, borderRadius: 14, display: "grid", placeItems: "center", background: `${accent}1f`, color: readable(accent), fontSize: 13, flexShrink: 0 }}
        >▾</motion.span>
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
            <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 700 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink, lineHeight: 1.7 }}>{t.def}</div>
              {t.example && (
                <div style={{ background: `${accent}14`, borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: "11px 15px" }}>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>Example: </span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>{t.example}</span>
                </div>
              )}
              {t.diagram && <TermDiagram diagram={t.diagram} accent={accent} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// A different word every day, with the definition up front and a button for another.
function WordOfTheDay({ onOpen }) {
  const all = useMemo(() => TABS.flatMap((tab) => TERMS_BY_TAB[tab.key].map((t) => ({ ...t, tab }))), []);
  const [pick, setPick] = useState(null);
  const word = pick ?? wordOfTheDay(all);
  const accent = word.tab.accent;
  return (
    <section
      aria-label="Word of the day"
      style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding: "clamp(20px, 4vw, 30px)", border: `1px solid ${accent}55`, background: `radial-gradient(520px 260px at 100% 0%, ${accent}38, transparent 70%), radial-gradient(380px 220px at 0% 100%, ${accent}1f, transparent 70%), ${COLORS.paperCard}` }}
    >
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: readable(accent) }}>{pick ? "A random word" : "Word of the day"}</div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={word.term} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, color: COLORS.ink, margin: "6px 0 10px" }}>{word.term}</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.65, color: COLORS.ink, margin: 0, maxWidth: 640 }}>{word.def}</p>
          {word.example && <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "10px 0 0", maxWidth: 640 }}><strong style={{ color: COLORS.ink }}>Example:</strong> {word.example}</p>}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
        <button type="button" className="ons-chip" onClick={() => setPick(all[Math.floor(Math.random() * all.length)])} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, padding: "9px 18px", borderRadius: 999, border: "none", cursor: "pointer", background: solid(accent), color: "#fff" }}>Show me another</button>
        <button type="button" className="ons-chip" onClick={() => onOpen(word)} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, padding: "9px 18px", borderRadius: 999, cursor: "pointer", background: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}>Find it in the list</button>
      </div>
    </section>
  );
}

// "Which word is this?": a definition with the word blanked out and four to choose from.
function Quiz({ terms, accent }) {
  const [q, setQ] = useState(() => makeQuestion(terms));
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  if (!q) return null;
  const done = chosen !== null;
  const right = chosen === q.answer;
  const next = () => { setQ(makeQuestion(terms)); setChosen(null); };
  const answer = (opt) => {
    if (done) return;
    setChosen(opt);
    setScore((s) => ({ right: s.right + (opt === q.answer ? 1 : 0), total: s.total + 1, streak: opt === q.answer ? s.streak + 1 : 0 }));
  };
  const GOOD = "#1F7F57";
  const BAD = "#C5362D";
  return (
    <section
      aria-label="Quiz"
      style={{ display: "flex", flexDirection: "column", borderRadius: 24, padding: "clamp(18px, 4vw, 28px)", border: `1px solid ${accent}44`, background: `radial-gradient(420px 220px at 0% 0%, ${accent}22, transparent 70%), ${COLORS.paperCard}` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Which word is this?</h2>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: readable(accent), background: `${accent}1c`, borderRadius: 999, padding: "4px 12px", whiteSpace: "nowrap" }}>
          {score.right} of {score.total} right{score.streak >= 2 ? `, ${score.streak} in a row` : ""}
        </span>
      </div>

      <p style={{ position: "relative", fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.65, color: COLORS.ink, margin: "16px 0 18px", padding: "14px 16px", borderRadius: 14, background: COLORS.paper, borderLeft: `4px solid ${accent}` }}>
        {q.clue}
      </p>

      <div className="gl-opts" role="group" aria-label="Choose the word">
        {q.options.map((opt, i) => {
          const isAnswer = opt === q.answer;
          const state = !done ? "idle" : isAnswer ? "right" : opt === chosen ? "wrong" : "dim";
          const hue = state === "right" ? GOOD : state === "wrong" ? BAD : accent;
          return (
            <button
              key={opt} type="button" className="ons-chip" onClick={() => answer(opt)} aria-disabled={done || undefined}
              style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 12, textAlign: "left", cursor: done ? "default" : "pointer", padding: "12px 14px", minHeight: 58, borderRadius: 16, fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 700, lineHeight: 1.25, color: COLORS.ink, background: state === "idle" || state === "dim" ? COLORS.paper : `${hue}22`, borderTop: `2px solid ${state === "idle" || state === "dim" ? COLORS.hairline : hue}`, borderRight: `2px solid ${state === "idle" || state === "dim" ? COLORS.hairline : hue}`, borderBottom: `2px solid ${state === "idle" || state === "dim" ? COLORS.hairline : hue}`, borderLeft: `2px solid ${state === "idle" || state === "dim" ? COLORS.hairline : hue}`, opacity: state === "dim" ? 0.5 : 1, transition: "background 0.15s, border-color 0.15s, opacity 0.15s" }}
            >
              <span aria-hidden="true" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 800, background: state === "idle" || state === "dim" ? `${accent}1f` : hue, color: state === "idle" || state === "dim" ? accent : "#fff" }}>
                {state === "right" ? "✓" : state === "wrong" ? "✗" : "ABCD"[i]}
              </span>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{opt}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" style={{ marginTop: "auto", paddingTop: 16 }}>
        {done ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 14, background: `${right ? GOOD : BAD}18`, border: `1px solid ${right ? GOOD : BAD}55` }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{right ? "Correct." : <>Not quite. It was <span style={{ color: BAD }}>{q.answer}</span>.</>}</span>
            <button type="button" className="ons-chip" onClick={next} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, padding: "9px 18px", borderRadius: 999, border: "none", cursor: "pointer", background: solid(accent), color: "#fff" }}>Next question</button>
          </div>
        ) : (
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Tap the word that fits.</span>
        )}
      </div>
    </section>
  );
}

export default function Glossary() {
  const [tab, setTab] = useState("procedure");
  const [query, setQuery] = useState("");
  const [openTerm, setOpenTerm] = useState(null);

  const activeTab = TABS.find((t) => t.key === tab);
  const activeTerms = TERMS_BY_TAB[tab];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeTerms;
    return activeTerms.filter((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q));
  }, [activeTerms, query]);

  const groups = useMemo(() => groupByLetter(filtered), [filtered]);
  const present = useMemo(() => new Set(groups.map((g) => g.letter)), [groups]);

  function selectTab(key) {
    withScrollPreserved(() => {
      setTab(key);
      setOpenTerm(null);
    });
  }

  // Opens a term wherever it lives: switches group, clears the search, opens it and scrolls to it.
  const openWord = useCallback((word) => {
    setQuery("");
    setTab(word.tab.key);
    setOpenTerm(word.term);
    setTimeout(() => document.getElementById(`term-${word.term.replace(/\W+/g, "-")}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }, []);

  const jump = (letter) => document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconGlossary}
        kicker="Glossary"
        title="Jargon buster"
        subtitle="Every term you will meet on this site and in most UK political news, explained simply. Pick a group, search, or tap a term to open it. The statistics and economy group covers the figures on the Britain in numbers pages."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 16, marginTop: 24 }}>
        <WordOfTheDay onOpen={openWord} />
        <Quiz key={tab} terms={activeTerms} accent={activeTab.accent} />
      </div>

      <div role="tablist" aria-label="Group of terms" className="gl-tabs" style={{ marginTop: 28 }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key} role="tab" aria-selected={on} className="ons-chip" onClick={() => selectTab(t.key)}
              style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", padding: "16px 18px", borderRadius: 18, border: `2px solid ${on ? t.accent : COLORS.hairline}`, background: on ? `linear-gradient(135deg, ${t.accent}, ${t.accent}bb)` : `linear-gradient(135deg, ${t.accent}14, ${COLORS.paperCard} 70%)`, color: on ? "#fff" : COLORS.ink, transition: "background 0.2s, border-color 0.2s", boxShadow: on ? `0 18px 36px -24px ${t.accent}` : "none" }}
            >
              <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{t.label}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, opacity: 0.85, flexShrink: 0 }}>{TERMS_BY_TAB[t.key].length}</span>
              </span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.45, marginTop: 5, color: on ? "rgba(255,255,255,0.9)" : COLORS.inkSoft }}>{t.blurb}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18, padding: "clamp(14px, 2.5vw, 20px)", borderRadius: 20, border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, display: "grid", gap: 16 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: activeTab.accent, display: "flex" }}>
            <IconSearch size={18} />
          </span>
          <input
            type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${activeTab.label.toLowerCase()}`} aria-label="Search a term"
            style={{ width: "100%", boxSizing: "border-box", padding: "14px 18px 14px 46px", fontFamily: FONT_BODY, fontSize: 16, border: `2px solid ${COLORS.hairline}`, borderRadius: 14, background: COLORS.paper, color: COLORS.ink, outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = activeTab.accent)} onBlur={(e) => (e.target.style.borderColor = COLORS.hairline)}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px" }}>
          <div role="navigation" aria-label="Jump to a letter" className="gl-az">
            {LETTERS.map((l) => {
              const has = present.has(l);
              return (
                <button
                  key={l} type="button" disabled={!has} onClick={() => jump(l)} aria-label={`Jump to ${l}`}
                  style={{ height: 34, borderRadius: 9, border: "none", cursor: has ? "pointer" : "default", fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, background: has ? `${activeTab.accent}1f` : "transparent", color: has ? activeTab.accent : COLORS.hairline }}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginLeft: "auto" }} aria-live="polite">
            {filtered.length} term{filtered.length === 1 ? "" : "s"}{query.trim() ? ` matching "${query}"` : ""}
          </div>
        </div>
      </div>
      <style>{`
        .gl-az { display: grid; grid-template-columns: repeat(13, 34px); gap: 4px; }
        @media (max-width: 640px) { .gl-az { grid-template-columns: repeat(9, minmax(0, 1fr)); width: 100%; } }
        .gl-tabs { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 720px) { .gl-tabs { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; } }
        .gl-opts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        @media (max-width: 520px) { .gl-opts { grid-template-columns: 1fr; } }
        .gl-row:not(.gl-open):hover { background: ${COLORS.paper} !important; }
      `}</style>

      <div style={{ height: 22 }} />

      {filtered.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>No terms match "{query}".</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {groups.map((group) => (
            <div key={group.letter} id={`letter-${group.letter}`} style={{ scrollMarginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em", color: activeTab.accent }}>{group.letter}</span>
                <span style={{ flex: 1, height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${activeTab.accent}66, transparent)` }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{group.items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.items.map((t) => (
                  <div key={t.term} id={`term-${t.term.replace(/\W+/g, "-")}`} style={{ scrollMarginTop: 80 }}>
                    <TermRow
                      t={t}
                      accent={activeTab.accent}
                      isOpen={openTerm === t.term}
                      onToggle={() => withScrollPreserved(() => setOpenTerm(openTerm === t.term ? null : t.term))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
