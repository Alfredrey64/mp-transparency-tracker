/** @jsxImportSource react */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconGlossary, IconSearch } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";
import { PROCEDURE_TERMS, POLITICS_TERMS, STATISTICS_TERMS } from "../data/glossaryTerms";

const TABS = [
  { key: "procedure", label: "Parliamentary Terms", accent: COLORS.accent },
  { key: "politics", label: "Political Terms & Issues", accent: "#6E4B6E" },
  { key: "statistics", label: "Statistics & economy", accent: "#0E9AA7" },
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
          {i > 0 && <span style={{ color: accent, fontSize: 12, fontWeight: 700 }}>→</span>}
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
      <span style={{ color: accent, fontSize: 18, fontWeight: 700 }}>⇄</span>
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

function TermRow({ t, isOpen, onToggle, accent }) {
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
      <button
        onClick={onToggle}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer", textAlign: "left", gap: 10 }}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16.5, color: COLORS.ink }}>{t.term}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: accent, fontSize: 13, flexShrink: 0 }}>▾</motion.span>
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
            <div style={{ padding: "0 2px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.65 }}>{t.def}</div>
              {t.example && (
                <div style={{ background: `${accent}0c`, borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: "9px 13px" }}>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: COLORS.ink }}>Example: </span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{t.example}</span>
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

  function selectTab(key) {
    withScrollPreserved(() => {
      setTab(key);
      setOpenTerm(null);
    });
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconGlossary}
        kicker="Glossary"
        title="Jargon buster"
        subtitle="Every term you will meet on this site and in most UK political news, explained simply. Pick a group, search, or tap a term to open it. The statistics and economy group covers the figures on the Britain in numbers pages."
      />

      <div style={{ display: "flex", gap: 2, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 24, padding: 3, marginTop: 24, marginBottom: 20, width: "fit-content", maxWidth: "100%", flexWrap: "wrap" }} role="tablist" aria-label="Group of terms">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => selectTab(t.key)}
            style={{
              position: "relative",
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 600,
              padding: "10px 16px",
              minHeight: 40,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: tab === t.key ? "#fff" : COLORS.inkSoft,
              transition: "color 0.15s",
            }}
          >
            {tab === t.key && (
              <motion.span
                layoutId="glossary-tab-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                style={{ position: "absolute", inset: 0, background: t.accent, borderRadius: 999, zIndex: 0 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a term…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "12px 16px 12px 40px",
            fontFamily: FONT_BODY, fontSize: 15, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
            background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 20 }}>
        {filtered.length} term{filtered.length === 1 ? "" : "s"}{query.trim() ? ` matching "${query}"` : ""}
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No terms match "{query}".</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {groups.map((group) => (
            <div key={group.letter}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
                <span
                  style={{
                    flexShrink: 0, width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: activeTab.accent, background: `${activeTab.accent}1a`,
                  }}
                >
                  {group.letter}
                </span>
                <span style={{ flex: 1, height: 1, background: COLORS.hairline }} />
              </div>
              <div>
                {group.items.map((t) => (
                  <TermRow
                    key={t.term}
                    t={t}
                    accent={activeTab.accent}
                    isOpen={openTerm === t.term}
                    onToggle={() => withScrollPreserved(() => setOpenTerm(openTerm === t.term ? null : t.term))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
