import { useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconTimeline } from "./icons";
import { GOVERNMENTS, LANDMARK_VOTES, OUTCOME_COLOR } from "../lib/politicalHistoryData";
import { BillIcon } from "./billIcons";
import { withScrollPreserved } from "../lib/preserveScroll";

function historicPartyColor(party) {
  if (/labour/i.test(party)) return "#C8102E";
  if (/conservative|tory/i.test(party)) return "#0087DC";
  if (/whig|liberal/i.test(party)) return "#D4A017";
  if (/national/i.test(party)) return "#7A7A7A";
  if (/coalition/i.test(party)) return "#6B5B95";
  if (/peelite/i.test(party)) return "#4C7A6B";
  return COLORS.inkSoft;
}

// Short lineage notes for every party label that appears in GOVERNMENTS —
// used to add context when a government entry is expanded.
const PARTY_LINEAGE = {
  Whig: "Whigs were the dominant party of the 18th and early 19th centuries — the direct ancestor of the Liberal Party, and via it, today's Liberal Democrats.",
  Tory: "Tories were the 18th-century ancestor of today's Conservative Party, formally reorganised under that name in the 1830s.",
  Conservative: "Traces back to the Tories, reorganised as the Conservative Party under Robert Peel in the 1830s — still the party's name today.",
  "Conservative (Coalition)": "The Conservative Party leading a coalition government, governing jointly with another party rather than alone.",
  Liberal: "Formed from an 1859 merger of Whigs, Peelites and Radicals. Eclipsed by Labour after 1918, and merged with the SDP in 1988 to form the Liberal Democrats.",
  "Liberal (Coalition)": "The Liberal Party leading a wartime coalition government, governing jointly with Conservative and Labour ministers.",
  Peelite: "Followers of Robert Peel who split from the Conservatives over the 1846 repeal of the Corn Laws. Most later joined the Liberal Party.",
  Coalition: "A temporary alliance between parties formed to govern together, not a permanent party in its own right.",
  "National Government": "A cross-party coalition formed to handle a national economic crisis, drawing ministers from Labour, Conservative and Liberal ranks.",
  Labour: "Founded in 1900 as the Labour Representation Committee, becoming the Labour Party in 1906 — Britain's main party of the left ever since.",
};

const SORTED_GOVERNMENTS = [...GOVERNMENTS].sort((a, b) => a.year - b.year);

// Returns null for anything before 1721 — there simply was no "Prime
// Minister" to attribute it to yet, and guessing would be misleading.
function governmentAt(year) {
  if (year < SORTED_GOVERNMENTS[0].year) return null;
  let result = SORTED_GOVERNMENTS[0];
  for (const g of SORTED_GOVERNMENTS) {
    if (g.year <= year) result = g;
    else break;
  }
  return result;
}

function billsDuringGovernment(gov) {
  const idx = SORTED_GOVERNMENTS.findIndex((g) => g.year === gov.year && g.pm === gov.pm && g.party === gov.party);
  const nextYear = idx >= 0 && idx < SORTED_GOVERNMENTS.length - 1 ? SORTED_GOVERNMENTS[idx + 1].year : Infinity;
  return LANDMARK_VOTES.filter((v) => v.year >= gov.year && v.year < nextYear).sort((a, b) => a.year - b.year);
}

// A merged, chronological read of every government formation and every
// landmark bill — the two datasets from the Political History tab, woven
// into a single feed. Split into rough eras purely for navigability; the
// boundaries are an editorial judgement call, not an official periodisation.
const ERAS = [
  { key: "georgian", label: "Georgian Britain", range: "1689–1831", from: -Infinity, to: 1831, accent: "#8A6D3B" },
  { key: "victorian", label: "Victorian Era", range: "1832–1900", from: 1832, to: 1900, accent: "#4C7A6B" },
  { key: "wartime", label: "Edwardian Britain & the World Wars", range: "1901–1945", from: 1901, to: 1945, accent: "#7A4B4B" },
  { key: "postwar", label: "The Post-War Consensus", range: "1946–1978", from: 1946, to: 1978, accent: "#3F7D5C" },
  { key: "thatcher", label: "Thatcher to New Labour", range: "1979–2009", from: 1979, to: 2009, accent: "#5A7FA6" },
  { key: "modern", label: "Coalition, Brexit & Beyond", range: "2010–present", from: 2010, to: Infinity, accent: "#6E4B6E" },
];

function eraFor(year) {
  return ERAS.find((e) => year >= e.from && year <= e.to) ?? ERAS[ERAS.length - 1];
}

const FULL_TIMELINE = [
  ...GOVERNMENTS.map((g) => ({ type: "government", year: g.year, ...g })),
  ...LANDMARK_VOTES.map((v) => ({ type: "bill", year: v.year, ...v })),
].sort((a, b) => {
  if (a.year !== b.year) return a.year - b.year;
  if (a.type !== b.type) return a.type === "government" ? -1 : 1;
  return 0;
});

const ERA_GROUPS = ERAS.map((era) => ({
  ...era,
  entries: FULL_TIMELINE.filter((e) => eraFor(e.year).key === era.key),
})).filter((g) => g.entries.length > 0);

const PM_ERA_GROUPS = ERAS.map((era) => ({
  ...era,
  entries: SORTED_GOVERNMENTS.filter((g) => eraFor(g.year).key === era.key),
})).filter((g) => g.entries.length > 0);

// Abbreviates a full date string ("26 June 1846" or "December 1689") down
// to a short day/month tag ("26 Jun" or "Dec") for a compact, typographic
// date column — returns null for entries that are only ever given a bare
// year ("1701"), since there's nothing more precise to show.
function shortDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(" ");
  if (parts.length === 3) return `${parts[0]} ${parts[1].slice(0, 3)}`;
  if (parts.length === 2 && Number.isNaN(Number(parts[0]))) return parts[0].slice(0, 3);
  return null;
}

function termFor(gov) {
  const idx = SORTED_GOVERNMENTS.findIndex((g) => g.year === gov.year && g.pm === gov.pm && g.party === gov.party);
  const endYear = idx >= 0 && idx < SORTED_GOVERNMENTS.length - 1 ? SORTED_GOVERNMENTS[idx + 1].year : null;
  return { endYear, years: endYear ? endYear - gov.year : new Date().getFullYear() - gov.year };
}

function GovernmentEntry({ entry, index, showTerm }) {
  const [open, setOpen] = useState(false);
  const color = historicPartyColor(entry.party);
  const lineage = PARTY_LINEAGE[entry.party];
  const bills = open ? billsDuringGovernment(entry) : [];
  const term = showTerm ? termFor(entry) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16, scale: 0.98 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 10) * 0.03, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.15, delay: 0 } }}
      onClick={() => setOpen((v) => !v)}
      style={{
        display: "flex", gap: 16, alignItems: "center", background: `${color}0c`,
        border: `1px solid ${color}30`, borderRadius: 12, padding: "16px 20px", margin: "18px 0",
        cursor: "pointer",
      }}
    >
      <div style={{ flexShrink: 0, width: showTerm ? 68 : 58, textAlign: showTerm ? "center" : "right" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: showTerm ? 16 : 17, color, lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>
          {entry.year}
        </div>
        {showTerm && (
          <>
            <div style={{ width: 18, height: 1, background: `${color}55`, margin: "5px auto" }} />
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: `${color}cc`, fontVariantNumeric: "tabular-nums" }}>
              {term.endYear ?? "Present"}
            </div>
          </>
        )}
      </div>
      <div style={{ flexShrink: 0, width: 2, alignSelf: "stretch", background: color, borderRadius: 2, minHeight: 20, opacity: 0.5 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink }}>{entry.pm}</span>
          <span
            style={{
              fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
              color, background: `${color}1e`, padding: "2px 9px", borderRadius: 999,
            }}
          >
            {entry.party}
          </span>
          {showTerm && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
              {term.years < 1 ? "Less than a year" : `${term.years} ${term.years === 1 ? "year" : "years"}`} in office
            </span>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ marginLeft: "auto", color: COLORS.inkSoft, fontSize: 12 }}>▾</motion.span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 6 }}>{entry.note}</div>

        <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${color}30` }}>
              {entry.events && entry.events.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Major events
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {entry.events.map((e, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.25 }}
                        style={{ display: "flex", gap: 9, alignItems: "flex-start" }}
                      >
                        <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: "50%", background: color, marginTop: 7 }} />
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.55 }}>{e}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {lineage && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                    About the {entry.party}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6 }}>{lineage}</div>
                </div>
              )}
              {bills.length > 0 && (
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Landmark bills passed under this government
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {bills.map((b) => (
                      <div key={b.title} style={{ display: "flex", gap: 8, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
                        <span style={{ color: COLORS.ink, fontWeight: 600, flexShrink: 0 }}>{b.year}</span>
                        <span>{b.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function BillEntry({ entry, index }) {
  const [open, setOpen] = useState(false);
  const color = OUTCOME_COLOR[entry.outcome];
  const gov = governmentAt(entry.year);
  const govColor = gov ? historicPartyColor(gov.party) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.03, ease: "easeOut" }}
      style={{ display: "flex", gap: 16, alignItems: "center", margin: "14px 0" }}
    >
      <div style={{ flexShrink: 0, width: 58, textAlign: "right" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: COLORS.ink, lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>
          {entry.year}
        </div>
        {shortDate(entry.date) && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: COLORS.inkSoft, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {shortDate(entry.date)}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, width: 2, alignSelf: "stretch", background: COLORS.hairline, borderRadius: 2, minHeight: 16 }} />
      <motion.div
        onClick={() => setOpen((v) => !v)}
        whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(20,30,32,0.10)", transition: { duration: 0.15, delay: 0 } }}
        style={{
          minWidth: 0, flex: 1, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${color}`,
          borderRadius: 10, padding: "13px 17px", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
          <span
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 9, background: `${color}16`,
              display: "flex", alignItems: "center", justifyContent: "center", color, marginTop: 1,
            }}
          >
            <BillIcon title={entry.title} size={17} color={color} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{entry.title}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color, textTransform: "uppercase" }}>{entry.result}</span>
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ marginLeft: "auto", color: COLORS.inkSoft, fontSize: 12 }}>▾</motion.span>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6 }}>{entry.detail}</div>
          </div>
        </div>

        <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.hairline}` }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Passed under
              </div>
              {!gov ? (
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55 }}>
                  This predates Robert Walpole's 1721 premiership — the office of Prime Minister didn't exist yet.
                </div>
              ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink }}>{gov.pm}</span>
                <span
                  style={{
                    fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                    color: govColor, background: `${govColor}1e`, padding: "2px 8px", borderRadius: 999,
                  }}
                >
                  {gov.party}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>since {gov.year}</span>
              </div>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function EraSection({ era }) {
  return (
    <div id={era.key} style={{ marginBottom: 64, scrollMarginTop: 90 }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4 }}
        style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 }}
      >
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: era.accent, flexShrink: 0 }} />
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 25, color: COLORS.ink }}>{era.label}</div>
        <span style={{ flex: 1, height: 1, background: COLORS.hairline }} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, flexShrink: 0 }}>{era.range}</span>
      </motion.div>
      <div style={{ paddingLeft: 26 }}>
        {era.entries.map((entry, i) =>
          entry.type === "government" ? (
            <GovernmentEntry key={`gov-${entry.year}-${i}`} entry={entry} index={i} />
          ) : (
            <BillEntry key={`bill-${entry.year}-${i}`} entry={entry} index={i} />
          )
        )}
      </div>
    </div>
  );
}

function PmEraSection({ era }) {
  return (
    <div id={`pm-${era.key}`} style={{ marginBottom: 64, scrollMarginTop: 90 }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4 }}
        style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 }}
      >
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: era.accent, flexShrink: 0 }} />
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 25, color: COLORS.ink }}>{era.label}</div>
        <span style={{ flex: 1, height: 1, background: COLORS.hairline }} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, flexShrink: 0 }}>{era.range}</span>
      </motion.div>
      <div style={{ paddingLeft: 26 }}>
        {era.entries.map((entry, i) => (
          <GovernmentEntry key={`pm-${entry.year}-${entry.pm}-${i}`} entry={entry} index={i} showTerm />
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { key: "timeline", label: "Full Timeline" },
  { key: "pms", label: "Prime Ministers" },
];

export default function Timeline() {
  const [tab, setTab] = useState("timeline");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });

  function jumpTo(key) {
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING, position: "relative" }}>
      <motion.div
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3, transformOrigin: "0% 50%",
          background: `linear-gradient(90deg, ${COLORS.brass}, #6E4B6E)`, scaleX: progress, zIndex: 50,
        }}
      />

      <PageHeader
        icon={IconTimeline}
        kicker="Public Record · Timeline"
        title="Three centuries in one timeline"
        subtitle="Every government formed since Robert Walpole in 1721, and every landmark bill from the Political History tab, woven into a single chronological sweep of who was in power and what they did with it. Click any entry for more."
      />

      <div style={{ display: "flex", gap: 4, marginTop: 28, marginBottom: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 4, width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => withScrollPreserved(() => setTab(t.key))}
            style={{
              position: "relative", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "9px 18px",
              borderRadius: 999, border: "none", cursor: "pointer", background: "transparent",
              color: tab === t.key ? "#fff" : COLORS.inkSoft, zIndex: 1,
            }}
          >
            {tab === t.key && (
              <motion.span layoutId="timeline-tab-pill" transition={{ type: "spring", stiffness: 500, damping: 35 }} style={{ position: "absolute", inset: 0, background: COLORS.ink, borderRadius: 999, zIndex: -1 }} />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "timeline" && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", margin: "24px 0 24px", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: `${COLORS.brass}20`, border: `1px solid ${COLORS.brass}` }} />
              New government — click to expand
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 3, height: 12, borderRadius: 2, background: OUTCOME_COLOR.achieved }} />
              Bill passed
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 3, height: 12, borderRadius: 2, background: OUTCOME_COLOR.not_kept }} />
              Bill/motion defeated
            </span>
          </motion.div>

          <div style={{ position: "sticky", top: 0, zIndex: 5, background: COLORS.paper, paddingTop: 14, paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ERA_GROUPS.map((era) => (
                <button
                  key={era.key}
                  onClick={() => jumpTo(era.key)}
                  style={{
                    fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 999,
                    border: `1px solid ${era.accent}55`, background: `${era.accent}12`, color: era.accent, cursor: "pointer",
                  }}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </div>

          {ERA_GROUPS.map((era) => (
            <EraSection key={era.key} era={era} />
          ))}
        </>
      )}

      {tab === "pms" && (
        <>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, margin: "24px 0 24px" }}>
            All {SORTED_GOVERNMENTS.length} government formations since Robert Walpole in 1721 — click any Prime Minister for their party's lineage and the landmark bills passed on their watch.
          </div>

          <div style={{ position: "sticky", top: 0, zIndex: 5, background: COLORS.paper, paddingTop: 14, paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PM_ERA_GROUPS.map((era) => (
                <button
                  key={era.key}
                  onClick={() => jumpTo(`pm-${era.key}`)}
                  style={{
                    fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 999,
                    border: `1px solid ${era.accent}55`, background: `${era.accent}12`, color: era.accent, cursor: "pointer",
                  }}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </div>

          {PM_ERA_GROUPS.map((era) => (
            <PmEraSection key={era.key} era={era} />
          ))}
        </>
      )}
    </div>
  );
}
