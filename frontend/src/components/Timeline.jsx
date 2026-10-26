import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion } from "motion/react";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable, chip } from "../theme";
import { PageHeader } from "./shared";
import { IconTimeline } from "./icons";
import { GOVERNMENTS, LANDMARK_VOTES, OUTCOME_COLOR } from "../lib/politicalHistoryData";
import { BillIcon } from "./billIcons";
import { withScrollPreserved } from "../lib/preserveScroll";
import pmPortraits from "../data/pmPortraits.json";
import { keyboardActivate } from "../lib/a11y";
import "../timeline.css";

function PmAvatar({ name, color, size = 40 }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const url = pmPortraits[name]?.url;

  if (!url || errored) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          ...chip(color), fontFamily: FONT_DISPLAY, fontSize: size * 0.36, fontWeight: 600,
        }}
      >
        {name.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}` }}>
      <img loading="lazy" decoding="async"
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
      />
    </div>
  );
}

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
  Whig: "Whigs were the dominant party of the 18th and early 19th centuries: the direct ancestor of the Liberal Party, and via it, today's Liberal Democrats.",
  Tory: "Tories were the 18th-century ancestor of today's Conservative Party, formally reorganised under that name in the 1830s.",
  Conservative: "Traces back to the Tories, reorganised as the Conservative Party under Robert Peel in the 1830s, still the party's name today.",
  "Conservative (Coalition)": "The Conservative Party leading a coalition government, governing jointly with another party rather than alone.",
  Liberal: "Formed from an 1859 merger of Whigs, Peelites and Radicals. Eclipsed by Labour after 1918, and merged with the SDP in 1988 to form the Liberal Democrats.",
  "Liberal (Coalition)": "The Liberal Party leading a wartime coalition government, governing jointly with Conservative and Labour ministers.",
  Peelite: "Followers of Robert Peel who split from the Conservatives over the 1846 repeal of the Corn Laws. Most later joined the Liberal Party.",
  Coalition: "A temporary alliance between parties formed to govern together, not a permanent party in its own right.",
  "National Government": "A cross-party coalition formed to handle a national economic crisis, drawing ministers from Labour, Conservative and Liberal ranks.",
  Labour: "Founded in 1900 as the Labour Representation Committee, becoming the Labour Party in 1906, Britain's main party of the left ever since.",
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

const Label = ({ color, children }) => (
  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: readable(color), marginBottom: 7 }}>{children}</div>
);

// A government, as a card: the Prime Minister's portrait in a ring of their party's colour, their name, the party, and a note. Open it for the events of
// those years, where the party came from and the landmark bills passed on their watch.
function GovernmentEntry({ entry, showTerm }) {
  const [open, setOpen] = useState(false);
  const color = historicPartyColor(entry.party);
  const lineage = PARTY_LINEAGE[entry.party];
  const bills = open ? billsDuringGovernment(entry) : [];
  const term = termFor(entry);
  const toggle = () => withScrollPreserved(() => setOpen((v) => !v));

  return (
    <div
      className="tl-card tl-gov" data-open={open ? "1" : "0"} style={{ "--cc": color }}
      onClick={toggle}
      {...keyboardActivate(toggle, { label: `${entry.pm}, ${entry.party}, ${entry.year}. ${open ? "Hide" : "Show"} the details`, expanded: open })}
    >
      <div className="tl-gov-top">
        <span className="tl-ring"><PmAvatar name={entry.pm} color={color} size={showTerm ? 58 : 52} /></span>
        <div className="tl-gov-who">
          <div className="tl-gov-name">{entry.pm}</div>
          <div className="tl-gov-meta">
            <span className="tl-party">{entry.party}</span>
            <span className="tl-term">{entry.year} to {term.endYear ?? "now"}{term.years >= 1 ? `, ${term.years} ${term.years === 1 ? "year" : "years"}` : ", under a year"}</span>
          </div>
        </div>
        <motion.span aria-hidden="true" className="tl-chev" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>▾</motion.span>
      </div>
      <div className="tl-note">{entry.note}</div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
            <div className="tl-more">
              {entry.events && entry.events.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Label color={color}>Major events</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {entry.events.map((e, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.25 }} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: color, marginTop: 7 }} />
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55 }}>{e}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {lineage && (
                <div style={{ marginBottom: 16 }}>
                  <Label color={color}>About the {entry.party}</Label>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.6 }}>{lineage}</div>
                </div>
              )}
              {bills.length > 0 && (
                <div>
                  <Label color={color}>Landmark bills passed under this government</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {bills.map((b) => (
                      <div key={b.title} style={{ display: "flex", gap: 8, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
                        <span style={{ color: COLORS.ink, fontWeight: 700, flexShrink: 0 }}>{b.year}</span>
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
  );
}

// A landmark bill, as a smaller card with its picture.
function BillEntry({ entry }) {
  const [open, setOpen] = useState(false);
  const color = OUTCOME_COLOR[entry.outcome];
  const gov = governmentAt(entry.year);
  const govColor = gov ? historicPartyColor(gov.party) : null;
  const toggle = () => withScrollPreserved(() => setOpen((v) => !v));

  return (
    <div
      className="tl-card tl-bill" data-open={open ? "1" : "0"} style={{ "--cc": color }}
      onClick={toggle}
      {...keyboardActivate(toggle, { label: `${entry.year}: ${entry.title}. ${open ? "Hide" : "Show"} the details`, expanded: open })}
    >
      <div className="tl-bill-top">
        <span className="tl-bill-icon"><BillIcon title={entry.title} size={20} color={color} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="tl-bill-title">{entry.title}</div>
          <div className="tl-bill-meta">
            <span className="tl-result">{entry.result}</span>
            {shortDate(entry.date) && <span>{shortDate(entry.date)} {entry.year}</span>}
          </div>
        </div>
        <motion.span aria-hidden="true" className="tl-chev" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>▾</motion.span>
      </div>
      <div className="tl-note">{entry.detail}</div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
            <div className="tl-more">
              <Label color={COLORS.inkSoft}>Passed under</Label>
              {!gov ? (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55 }}>
                  This predates Robert Walpole's 1721 premiership: the office of Prime Minister didn't exist yet.
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink }}>{gov.pm}</span>
                  <span className="tl-party" style={{ "--cc": govColor }}>{gov.party}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>since {gov.year}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// One era: a banner with its colour, then a spine down the middle that fills in as you scroll, with a card on alternate sides. The spine's year
// markers pop in as they arrive.
function Era({ era, idPrefix = "", renderEntry, stat }) {
  const track = useRef(null);
  const calm = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <section id={`${idPrefix}${era.key}`} className="tl-era" style={{ "--ea": era.accent }} aria-label={era.label}>
      <header className="tl-banner">
        <div>
          <div className="tl-banner-range">{era.range}</div>
          <h2>{era.label}</h2>
        </div>
        <div className="tl-banner-stat">{stat}</div>
      </header>
      <div className="tl-track" ref={track}>
        <span className="tl-spine" aria-hidden="true" />
        <motion.span className="tl-spine-fill" aria-hidden="true" style={calm ? { scaleY: 1 } : { scaleY: fill }} />
        {era.entries.map((entry, i) => (
          <motion.div
            key={`${entry.year}-${entry.type ?? "g"}-${entry.pm ?? entry.title}-${i}`}
            className="tl-row" data-side={i % 2 === 0 ? "l" : "r"}
            initial={calm ? false : { opacity: 0, x: i % 2 === 0 ? -34 : 34 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ type: "spring", stiffness: 190, damping: 24 }}
          >
            <motion.span
              className="tl-node" aria-hidden="true"
              initial={calm ? false : { scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, margin: "-70px" }}
              transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.08 }}
            >
              <b>{entry.year}</b>
            </motion.span>
            {renderEntry(entry)}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const eraStat = (era) => {
  const govs = era.entries.filter((e) => (e.type ?? "government") === "government").length;
  const bills = era.entries.length - govs;
  return `${plural(govs, "government", "governments")}${bills ? `, ${plural(bills, "landmark bill", "landmark bills")}` : ""}`;
};

const TABS = [
  { key: "timeline", label: "Full Timeline" },
  { key: "pms", label: "Prime Ministers" },
];

// The row of era buttons stays in view while reading, and the one for the era on screen is lit.
function EraNav({ groups, idPrefix = "", onJump }) {
  const [active, setActive] = useState(groups[0]?.key);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (seen) setActive(seen.target.id.slice(idPrefix.length));
    }, { rootMargin: "-20% 0px -65% 0px" });
    groups.forEach((g) => { const el = document.getElementById(`${idPrefix}${g.key}`); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [groups, idPrefix]);
  return (
    <nav className="tl-nav" aria-label="Jump to an era">
      {groups.map((era) => (
        <button key={era.key} type="button" aria-current={active === era.key ? "true" : undefined} style={{ "--ea": era.accent }} onClick={() => onJump(`${idPrefix}${era.key}`)}>
          <span aria-hidden="true" />{era.label}
        </button>
      ))}
    </nav>
  );
}

export default function Timeline() {
  const [tab, setTab] = useState("timeline");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });

  function jumpTo(key) {
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING, position: "relative" }}>
      <motion.div
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3, transformOrigin: "0% 50%",
          background: `linear-gradient(90deg, ${COLORS.accent}, #6E4B6E)`, scaleX: progress, zIndex: 50,
        }}
      />

      <PageHeader
        icon={IconTimeline}
        kicker="Timeline"
        title="Three centuries in one timeline"
        subtitle="Every government formed since Robert Walpole took office in 1721, alongside the landmark bills passed along the way: who held power, and what they did with it. Tap any entry for more detail."
      />

      <div className="tl-tabs" role="tablist" aria-label="Which timeline">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => withScrollPreserved(() => setTab(t.key))}>
            {tab === t.key && <motion.span layoutId="timeline-tab-pill" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <i>{t.label}</i>
          </button>
        ))}
      </div>

      {tab === "timeline" && (
        <>
          <div className="tl-key">
            <span><i style={{ background: COLORS.accent }} />A new government. Tap to open</span>
            <span><i style={{ background: OUTCOME_COLOR.achieved }} />Bill passed</span>
            <span><i style={{ background: OUTCOME_COLOR.not_kept }} />Bill or motion defeated</span>
          </div>
          <EraNav groups={ERA_GROUPS} onJump={jumpTo} />
          {ERA_GROUPS.map((era) => (
            <Era key={era.key} era={era} stat={eraStat(era)} renderEntry={(e) => (e.type === "government" ? <GovernmentEntry entry={e} /> : <BillEntry entry={e} />)} />
          ))}
        </>
      )}

      {tab === "pms" && (
        <>
          <p className="tl-lead">All {SORTED_GOVERNMENTS.length} government formations since Robert Walpole in 1721. Tap any Prime Minister for their party's lineage and the landmark bills passed on their watch.</p>
          <EraNav groups={PM_ERA_GROUPS} idPrefix="pm-" onJump={jumpTo} />
          {PM_ERA_GROUPS.map((era) => (
            <Era key={era.key} era={era} idPrefix="pm-" stat={plural(era.entries.length, "government", "governments")} renderEntry={(e) => <GovernmentEntry entry={e} showTerm />} />
          ))}
        </>
      )}
    </div>
  );
}
