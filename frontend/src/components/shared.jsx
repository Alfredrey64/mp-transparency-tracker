import { useState, useEffect, useMemo, useContext, lazy, Suspense } from "react";
import PageGuide from "./PageGuide";
import { GuideKeyContext } from "../lib/viewContext";
import { RebelMeaning } from "./MpMeaning";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { supabase } from "../supabaseClient";
import { stripHtml, formatDate } from "../lib/format";
import { matchBillForVote } from "../lib/bills";
import { getBillDescription } from "../lib/billDescriptions";
import { SECTION_ACCENT_BY_ICON, SECTION_LABEL_BY_KEY } from "../data/sidebarSections";
import { withScrollPreserved } from "../lib/preserveScroll";
// Lazy: this file is part of the bundle every page load pays for, and the
// explainer (a table of division-title patterns) is only needed once an MP's
// profile is open.
const VoteExplainer = lazy(() => import("./VoteExplainer"));
const VoteTitle = lazy(() => import("./VoteTitle"));

// An annotated passage, not a dashboard tile: a left margin rule in the
// page's own accent colour and a soft tint of that same colour, open on
// every other edge — no bounding box, no radius, no drop shadow, nothing
// to make several of these in a row read as identical stacked cards.
// Closer to how a printed report marks up a marginal note than to a SaaS
// card kit. The icon is optional and sits inline with the heading rather
// than in its own circular badge.
export function InfoCard({ title, color, children, index = 0, maxWidth = 900, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      style={{
        borderLeft: `3px solid ${color}`, background: `${color}0a`, maxWidth,
        padding: "18px 22px 20px", marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 9 }}>
        {Icon && (
          <span style={{ flexShrink: 0, color, display: "inline-flex", position: "relative", top: 2 }}>
            <Icon size={18} />
          </span>
        )}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.7 }}>{children}</div>
    </motion.div>
  );
}

// A short, high-visibility "here's why you should care" band for pages that
// need to land their real-world stakes before a reader gets into the
// mechanics — a single diagonal-tinted strip in the page's own colour,
// not another full card, so it reads as a headline rather than one more
// section to work through.
export function WhyItMattersBand({ icon: Icon, color, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35 }}
      style={{
        display: "flex", alignItems: "center", gap: 14, maxWidth: 900, marginBottom: 28,
        background: `linear-gradient(135deg, ${color}1A, ${color}05)`, border: `1px solid ${color}33`,
        borderRadius: 14, padding: "16px 20px",
      }}
    >
      <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <Icon size={17} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>
        <strong>Why this matters:</strong> {children}
      </div>
    </motion.div>
  );
}

// One stop in a "how the money/influence actually moves" diagram — an icon
// in a circle with a label underneath. Pass `broken` for the one link in
// the chain that's the actual point of the page (the bit nobody has to
// disclose, the bit no register covers): a dashed outline reads as "this is
// where it stops being traceable" without needing any extra explanation.
export function FlowNode({ icon: Icon, label, color, broken = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, width: 130, flexShrink: 0 }}>
      <div
        style={{
          width: 58, height: 58, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: broken ? "transparent" : `${color}1c`, color,
          border: broken ? `2px dashed ${color}` : `2px solid ${color}40`,
        }}
      >
        <Icon size={24} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: COLORS.ink, textAlign: "center", lineHeight: 1.3 }}>
        {label}
      </div>
    </div>
  );
}

// The connector between two FlowNodes — wraps sensibly on narrow screens
// since it's just an inline glyph, not an absolutely-positioned line. A
// small coin bearing a £ sign travels along the connector to stand in for
// money actually moving between the two nodes: `oscillate` makes it travel
// back and forth (for the revolving-door page, where the whole point is
// people moving both ways) instead of one-way loop (donor → recipient
// pages). `reverse` flips a one-way loop right-to-left instead, for the
// rarer case where the money actually originates from the node drawn on
// the right — e.g. an undisclosed funder paying a talking head, where the
// funder node comes second for narrative reasons ("here's what you see,
// here's what you don't") but the cash itself moves the other way;
// without this the coin reads as the left-hand node paying the right-hand
// one, which is backwards. A gentle spin plus a squash-and-stretch on
// arrival/departure is what keeps a coin sliding along a straight line
// from reading as a flat, robotic dot. `showGlyph` can drop the arrow
// character where a page already has its own connecting visual (e.g. the
// rotating door icon) and just wants the coin. `glyph` swaps (or, passed
// empty, removes) the £ printed on the travelling dot itself — for the one
// non-money use of this pattern (a bill bouncing between the Commons and
// Lords), a blank coin reads as "something is moving" without implying
// cash is changing hands.
const COIN_SIZE = 17;
const OSCILLATE_CLEARANCE = 6;

export function FlowArrow({ color, animated = true, oscillate = false, reverse = false, showGlyph = true, trackWidth = 40, glyph = "£" }) {
  const coinColor = color ?? COLORS.accent;
  const travelStart = OSCILLATE_CLEARANCE;
  const travelEnd = trackWidth - COIN_SIZE - OSCILLATE_CLEARANCE;
  return (
    <div aria-hidden="true" style={{ position: "relative", width: trackWidth, height: 24, flexShrink: 0, alignSelf: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {showGlyph && <span style={{ fontSize: 22, color: color ?? COLORS.inkSoft, opacity: 0.55 }}>→</span>}
      {animated && (
        <motion.div
          animate={
            oscillate
              ? { left: [`${travelStart}px`, `${travelEnd}px`, `${travelStart}px`], rotate: [0, 180, 360], scale: [0.85, 1, 0.85] }
              : reverse
              ? { left: ["79%", "3%"], rotate: [360, 0], scale: [0.5, 1, 1, 0.5], opacity: [0, 1, 1, 0] }
              : { left: ["3%", "79%"], rotate: [0, 360], scale: [0.5, 1, 1, 0.5], opacity: [0, 1, 1, 0] }
          }
          transition={
            oscillate
              ? { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 1.9, repeat: Infinity, ease: "easeInOut", times: [0, 0.18, 0.82, 1] }
          }
          style={{
            position: "absolute", top: "50%", width: 17, height: 17, marginTop: -8.5,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: `radial-gradient(circle at 32% 28%, ${coinColor}, ${coinColor} 55%, ${coinColor}b0)`,
            border: `1px solid ${coinColor}`,
            boxShadow: `0 2px 5px rgba(0,0,0,0.35), 0 0 8px ${coinColor}80`,
          }}
        >
          {glyph && (
            <span style={{ fontFamily: FONT_BODY, fontWeight: 800, fontSize: 11, lineHeight: 1, color: "#fff", textShadow: "0 1px 1px rgba(0,0,0,0.25)" }}>
              {glyph}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

// A simple two-bar comparison for "here's the visible slice vs. the much
// larger part nothing requires anyone to measure" — the second bar is
// deliberately drawn with a diagonal hatch rather than a solid fill, so it
// reads as "illustrative, not a real measurement" rather than a precise
// (and made-up) figure.
export function ScaleComparison({ bars, maxWidth = 900 }) {
  return (
    <div style={{ maxWidth, marginBottom: 30 }}>
      {bars.map((bar, i) => (
        <div key={bar.label} style={{ marginBottom: i < bars.length - 1 ? 16 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: COLORS.ink }}>{bar.label}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: bar.color, fontWeight: 700 }}>{bar.caption}</span>
          </div>
          <div style={{ height: 14, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${bar.width}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.15, ease: "easeOut" }}
              style={{
                height: "100%", borderRadius: 999, background: bar.color,
                backgroundImage: bar.hatched ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 7px, transparent 7px 14px)" : "none",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ kicker = "UK Parliament", title, subtitle, align = "left", size = "lg", maxWidth, icon: Icon }) {
  const isHero = size === "xl";
  // The page's "What you're looking at" box sits under every header.
  const guideKey = useContext(GuideKeyContext);
  // Every page passes its own distinct icon here already — reusing it as
  // the lookup key means each page's header automatically picks up its
  // sidebar section's colour (see data/sidebarSections.js) with no prop
  // threading needed through 30-odd page files. Pages outside any section
  // (Home, Methodology/Settings, standalone pages) just keep the plain
  // sitewide accent.
  const accent = SECTION_ACCENT_BY_ICON.get(Icon) ?? COLORS.accent;
  const kickerText = SECTION_LABEL_BY_KEY.get(guideKey) ?? kicker;
  return (
    <div style={{ marginBottom: isHero ? 0 : 28, maxWidth, textAlign: align }}>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <EyebrowLabel color={accent}>{kickerText}</EyebrowLabel>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.02, ease: "easeOut" }}
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: isHero ? "clamp(32px, 6vw, 56px)" : "clamp(26px, 4vw, 34px)",
          color: COLORS.ink,
          margin: "12px 0 0",
          lineHeight: 1.15,
          display: "flex",
          alignItems: "center",
          justifyContent: align === "center" ? "center" : "flex-start",
          gap: 14,
        }}
      >
        {Icon && (
          <motion.span
            initial={{ scale: 0.75, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.04, ease: "backOut" }}
            style={{ display: "inline-flex", color: accent, flexShrink: 0 }}
          >
            <Icon size={isHero ? 40 : 30} />
          </motion.span>
        )}
        <span>{title}</span>
      </motion.h1>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
        style={{
          transformOrigin: align === "center" ? "center" : "left",
          height: 2,
          width: isHero ? 40 : 28,
          background: accent,
          margin: align === "center" ? "16px auto 0" : "14px 0 0",
        }}
      />
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontFamily: FONT_BODY,
            fontSize: isHero ? 18 : 15,
            color: COLORS.inkSoft,
            marginTop: isHero ? 22 : 8,
            lineHeight: 1.6,
            maxWidth: isHero ? 620 : undefined,
            marginLeft: align === "center" ? "auto" : undefined,
            marginRight: align === "center" ? "auto" : undefined,
          }}
        >
          {subtitle}
        </motion.p>
      )}
      {!isHero && <PageGuide viewKey={guideKey} />}
    </div>
  );
}

// A masthead-style section marker rather than a tracked-out uppercase
// tag — a short accent rule plus the label set in medium-weight Space
// Grotesk. Deliberately not italic: Space Grotesk has no real italic cut,
// so fontStyle:"italic" was forcing the browser's synthetic slant, which
// just reads as skewed rather than as a proper italic.
export function EyebrowLabel({ children, color = COLORS.accent, showRule = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      {showRule && <span style={{ width: 16, height: 2, background: color, flexShrink: 0 }} />}
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 14.5, letterSpacing: "0.01em", color }}>
        {children}
      </span>
    </div>
  );
}

export function ParliamentSilhouette({ width = 200, opacity = 1, color = COLORS.ink }) {
  return (
    <svg width={width} viewBox="0 0 240 120" fill="none" style={{ opacity }}>
      <line x1="0" y1="112" x2="240" y2="112" stroke={color} strokeWidth="1.5" />
      <rect x="18" y="70" width="120" height="42" fill={color} />
      {[18, 30, 42, 54, 66, 78, 90, 102, 114, 126].map((x) => (
        <rect key={x} x={x} y="64" width="6" height="8" fill={color} />
      ))}
      <rect x="10" y="58" width="10" height="54" fill={color} />
      <polygon points="10,58 15,46 20,58" fill={color} />
      <rect x="150" y="30" width="26" height="82" fill={color} />
      <rect x="146" y="24" width="34" height="8" fill={color} />
      <polygon points="150,24 163,4 176,24" fill={color} />
      <circle cx="163" cy="46" r="7" fill={COLORS.paper} stroke={color} strokeWidth="2" />
      <line x1="163" y1="4" x2="163" y2="-6" stroke={color} strokeWidth="2" />
      <rect x="190" y="80" width="14" height="32" fill={color} />
      <polygon points="190,80 197,66 204,80" fill={color} />
    </svg>
  );
}

// Shared across the "Parliament" and "Government" stage panels on How
// Parliament Works — same layoutId, same fixed size in both places, so the
// FLIP transition is a clean translate/scale, not a stretch of mismatched content.
export function CommonsBadge({ size = 36 }) {
  return (
    <motion.div
      layout
      layoutId="commons-badge"
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: COLORS.sidebarBgDeep,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      }}
    >
      <ParliamentSilhouette width={size * 0.55} color="#fff" />
    </motion.div>
  );
}

export function SectionDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "14px 0" }}>
      <span style={{ width: 24, height: 1, background: COLORS.hairline }} />
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.accent }} />
      <span style={{ width: 24, height: 1, background: COLORS.hairline }} />
    </div>
  );
}

// Used to be a bare hairline rule between sections — a dozen of them down
// one column read as one continuous sheet rather than a stack of boxes.
// In practice, on a page this dense (a dozen-plus sections per MP), that
// read as one undifferentiated wall of text rather than clearly separate
// facts, so each section is now a real bordered card, colour-coded by
// what kind of information it is (money-related sections share a colour,
// accountability-related ones share another, and so on) — the same
// per-topic colour language already used for the sidebar and page
// headers elsewhere on the site.
const CARD_ACCENT = {
  "Parliamentary Contact": "#2F80ED",
  "Cabinet Role": "#D9A62A",
  "Standards & Investigations": "#E63946",
  "Voting Record": "#9B4FE0",
  "Rebellion Rate": "#9B4FE0",
  "Recent Parliamentary Activity": "#1FA97C",
  "In the News": "#E0367A",
  "Funding by Sector": "#F2622A",
  "Money & Votes": "#F2622A",
  "Current Outside Roles": "#F2622A",
  "Committee & Donor Overlap": "#E63946",
  "Same Name, Two Registers": "#E63946",
  "Ministerial History": "#D9A62A",
  "Committee Service": "#6E4B6E",
  "How They Got Here": "#5A7FA6",
  "Previously an MP": COLORS.commonsGreen,
};

// "Cabinet Role" reads as "Cabinet role": cards use the same sentence case as
// every other heading. Acronyms and the like keep their capitals.
const KEEP_CAPS = new Set(["MP", "MPs", "UK", "APPG", "APPGs", "IPSA"]);
function sentenceCase(text) {
  return text
    .split(" ")
    .map((w, i) => (i === 0 || KEEP_CAPS.has(w) || /\d/.test(w) ? w : w.toLowerCase()))
    .join(" ");
}

export function CardShell({ title, children }) {
  const accent = CARD_ACCENT[title] ?? COLORS.accent;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${accent}`,
        borderRadius: 14, padding: "18px 20px",
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: COLORS.ink, marginBottom: 10 }}>
        {sentenceCase(title)}
      </div>
      {children}
    </motion.div>
  );
}

export function BiographyBox({ politician }) {
  const bio = stripHtml(politician.biography);
  return (
    <CardShell title="Biography">
      {bio ? (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.65 }}>
          {bio}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No official biography published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

export function ContactRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>{children}</div>
    </div>
  );
}

export function ContactBox({ politician }) {
  const hasContact = politician.parliamentary_address || politician.parliamentary_phone || politician.parliamentary_email;
  return (
    <CardShell title="Parliamentary Contact">
      {hasContact ? (
        <div>
          {politician.parliamentary_address && <ContactRow label="Address">{politician.parliamentary_address}</ContactRow>}
          {politician.parliamentary_phone && <ContactRow label="Phone">{politician.parliamentary_phone}</ContactRow>}
          {politician.parliamentary_email && (
            <ContactRow label="Email">
              <a href={`mailto:${politician.parliamentary_email}`} style={{ color: COLORS.ink }}>
                {politician.parliamentary_email}
              </a>
            </ContactRow>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No parliamentary contact details published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

export function CabinetRoleBox({ politician }) {
  return (
    <CardShell title="Cabinet Role">
      {politician.cabinet_role ? (
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: COLORS.ink }}>
            {politician.cabinet_role}
          </div>
          {politician.cabinet_role_start_date && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>
              Since {formatDate(politician.cabinet_role_start_date)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No current government post — this MP is a backbencher.
        </div>
      )}
    </CardShell>
  );
}

export function StandardsBox({ politician }) {
  const encodedName = encodeURIComponent(politician.name);
  const [reports, setReports] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("standards_reports").select("title, report_url, publication_date").eq("politician_id", politician.id);
      setFailed(Boolean(error));
      setReports(data ?? []);
    }
    load();
  }, [politician.id]);

  if (failed) {
    return (
      <CardShell title="Standards & Investigations">
        <LoadFailedNote item="Standards & Investigations data" />
      </CardShell>
    );
  }

  return (
    <CardShell title="Standards & Investigations">
      {reports?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {reports.map((r) => (
            <a
              key={r.report_url}
              href={r.report_url}
              target="_blank"
              rel="noreferrer"
              style={{ display: "block", background: "#F3E4E2", borderRadius: 8, padding: "8px 10px", fontFamily: FONT_BODY, fontSize: 12.5, color: "#9C3B3B", fontWeight: 600 }}
            >
              {r.title} ↗
            </a>
          ))}
        </div>
      )}
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 10 }}>
        {reports?.length > 0
          ? "The published finding above is a matter of public record — see the Standards & Sanctions tab for the full context. For anything more recent:"
          : "No published Committee on Standards finding currently matched to this MP. To check for yourself:"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <a
          href="https://committees.parliament.uk/committee/290/committee-on-standards/publications/"
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, fontWeight: 600 }}
        >
          Committee on Standards — published findings ↗
        </a>
        <a
          href={`https://www.parliament.uk/site-information/search/?q=${encodedName}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, fontWeight: 600 }}
        >
          Search parliament.uk for "{politician.name}" ↗
        </a>
      </div>
    </CardShell>
  );
}

// MPs sitting under these labels don't belong to a whipped party, so "voted
// with their own party's majority" isn't a meaningful comparison for them.
const NO_PARTY_MAJORITY_CONCEPT = ["independent", "speaker"];

export function VotingSummaryBox({ politician, onNavigate }) {
  const [votes, setVotes] = useState(null);
  const [bills, setBills] = useState(null);
  const [failed, setFailed] = useState(false);
  const hasPartyMajorityConcept = !NO_PARTY_MAJORITY_CONCEPT.includes((politician.party ?? "").toLowerCase());

  useEffect(() => {
    async function load() {
      const [{ data: v, error: vErr }, { data: b, error: bErr }] = await Promise.all([
        supabase
          .from("voting_records")
          .select("title, date, voted_aye, voted_with_party_majority, source_url")
          .eq("politician_id", politician.id)
          .order("date", { ascending: false })
          .limit(4),
        supabase.from("bills").select("short_title, long_title"),
      ]);
      setFailed(Boolean(vErr || bErr));
      setVotes(v ?? []);
      setBills(b ?? []);
    }
    load();
  }, [politician.id]);

  // Each vote's own title (e.g. "Finance Bill: New Clause 4") rarely says
  // what the bill actually does — matching it back to the bill it belongs
  // to gets a real, plain-English description onto the row, using the same
  // hand-written-or-fall-back-to-official-title approach as the Manifesto
  // tab, rather than inventing summary text this site can't stand behind.
  const billByVote = useMemo(() => {
    if (!bills) return null;
    const map = new Map();
    for (const v of votes ?? []) {
      if (map.has(v.title)) continue;
      const bill = matchBillForVote(v.title, bills);
      if (bill) map.set(v.title, getBillDescription(bill.short_title, bill.long_title));
    }
    return map;
  }, [votes, bills]);

  if (votes === null) {
    return (
      <CardShell title="Voting Record">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>
      </CardShell>
    );
  }

  if (failed) {
    return (
      <CardShell title="Voting Record">
        <LoadFailedNote item="voting record" />
      </CardShell>
    );
  }

  if (votes.length === 0) {
    return (
      <CardShell title="Voting Record">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No recorded votes found for this MP in the tracked period.
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell title="Voting Record">
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 10 }}>
        Their {votes.length} most recent recorded vote{votes.length === 1 ? "" : "s"} — tap any of these, or their full
        history below, to see every recorded vote.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {votes.map((v, i) => {
          const againstParty = hasPartyMajorityConcept && v.voted_with_party_majority === false;
          const description = billByVote?.get(v.title);
          return (
            <button
              key={i}
              onClick={() => withScrollPreserved(() => onNavigate?.("voting", politician))}
              style={{
                display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: onNavigate ? "pointer" : "default", padding: 0,
                borderLeft: `3px solid ${againstParty ? "#9C3B3B" : COLORS.hairline}`,
                paddingLeft: 10,
                paddingBottom: i < votes.length - 1 ? 8 : 0,
                borderBottom: i < votes.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
              }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4 }}>
                <Suspense fallback={v.title}>
                  <VoteTitle title={v.title} />
                </Suspense>
              </div>
              {description && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 3 }}>
                  {description}
                </div>
              )}
              <Suspense fallback={null}>
                <VoteExplainer title={v.title} votedAye={v.voted_aye} inline />
              </Suspense>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                <span
                  style={{
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    padding: "2px 7px", borderRadius: 999,
                    background: v.voted_aye ? "#E4EEE7" : "#F3E4E2",
                    color: v.voted_aye ? "#2F6F4E" : "#9C3B3B",
                  }}
                >
                  {v.voted_aye ? "Aye" : "No"}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{formatDate(v.date)}</span>
                {againstParty && (
                  <span
                    style={{
                      fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, textTransform: "uppercase",
                      letterSpacing: "0.04em", padding: "2px 7px", borderRadius: 999,
                      background: "#F3E4E2", color: "#9C3B3B",
                    }}
                  >
                    Against party
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {onNavigate ? (
        <button
          onClick={() => withScrollPreserved(() => onNavigate("voting", politician))}
          style={{ display: "block", marginTop: 10, fontSize: 12, color: COLORS.accent, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          See their full voting history →
        </button>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: COLORS.inkSoft }}>
          See the "Voting Records" tab in the sidebar for their full history.
        </div>
      )}
    </CardShell>
  );
}

// "Rebellion rate" — how often an MP voted against the majority of their
// own party, using the same voted_with_party_majority flag fetch-votes.js
// already computes per division. This is a proxy for "went against the
// whip", not the whip's actual instruction (which is never published), so
// the label and copy are careful to say so.
export function RebellionRateBox({ politician }) {
  const hasPartyMajorityConcept = !NO_PARTY_MAJORITY_CONCEPT.includes((politician.party ?? "").toLowerCase());
  const [stats, setStats] = useState(hasPartyMajorityConcept ? undefined : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasPartyMajorityConcept) return;
    async function load() {
      const [{ count: total, error: totalErr }, { count: against, error: againstErr }] = await Promise.all([
        supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", politician.id).not("voted_with_party_majority", "is", null),
        supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", politician.id).eq("voted_with_party_majority", false),
      ]);
      // A genuine zero-votes MP and a failed count query both leave `total`
      // as 0/null here — worth telling apart, since this box otherwise just
      // renders nothing for "no votes", which would silently hide a real
      // rebellion rate behind a network blip instead of showing it.
      setFailed(Boolean(totalErr || againstErr));
      setStats({ total: total ?? 0, against: against ?? 0 });
    }
    load();
  }, [politician.id, hasPartyMajorityConcept]);

  if (stats === undefined) {
    return (
      <CardShell title="Rebellion Rate">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>
      </CardShell>
    );
  }

  if (failed) {
    return (
      <CardShell title="Rebellion Rate">
        <LoadFailedNote item="rebellion rate data" />
      </CardShell>
    );
  }

  if (stats === null || stats.total === 0) {
    return null;
  }

  const pct = Math.round((stats.against / stats.total) * 1000) / 10;

  return (
    <CardShell title="Rebellion Rate">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: pct > 0 ? "#9C3B3B" : COLORS.ink }}>{pct}%</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
          of {stats.total} recorded vote{stats.total === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: COLORS.paper, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, height: "100%", background: "#9C3B3B", borderRadius: 999 }} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
        The share of recorded Commons divisions where this MP voted against the majority of their own party.
        Actual whip instructions are never published, so this is our best available proxy — not a claim about
        what the whip actually told them to do.
      </div>
      <RebelMeaning politician={politician} />
    </CardShell>
  );
}

// Recent debate contributions and written questions — the Commons
// equivalent of the section already shown on each Lords peer's profile,
// pulled from the same Members API endpoints. Written questions carry
// their actual question text (the Members API returns it, we just weren't
// showing it) so a click can take you to this site's own Written Questions
// register, searched to this MP, to read the full exchange. Debate
// contributions can't do the same internally — the Members API's
// contribution summary gives titles, sections and speech/question/
// intervention counts, never the actual words spoken, and this site
// doesn't scrape Hansard's full transcripts — but the same API response
// does carry the debate's own id, which resolves to a real, working
// Hansard URL (verified against several live debates), so a click there
// goes to the actual transcript instead of nowhere.
export function RecentActivityBox({ politician, onNavigate }) {
  const activity = politician.recent_activity;
  const contributions = activity?.contributions ?? [];
  const writtenQuestions = activity?.writtenQuestions ?? [];
  if (contributions.length === 0 && writtenQuestions.length === 0) return null;

  return (
    <CardShell title="Recent Parliamentary Activity">
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
        Their most recent debate contributions and written questions, from Hansard and the official record.
      </div>

      {contributions.length > 0 && (
        <div style={{ marginBottom: writtenQuestions.length > 0 ? 16 : 0 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Debate Contributions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contributions.map((c, i) => {
              const row = (
                <>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.4 }}>
                    {c.title}
                    {c.hansardUrl && <span style={{ color: COLORS.accent }}> ↗</span>}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 3 }}>
                    {formatDate(c.date)} · {c.section}
                    {c.speechCount > 0 ? ` · ${c.speechCount} speech${c.speechCount === 1 ? "" : "es"}` : ""}
                    {c.questionCount > 0 ? ` · ${c.questionCount} question${c.questionCount === 1 ? "" : "s"}` : ""}
                    {c.interventionCount > 0 ? ` · ${c.interventionCount} intervention${c.interventionCount === 1 ? "" : "s"}` : ""}
                  </div>
                </>
              );
              const rowStyle = { display: "block", paddingBottom: 10, borderBottom: i < contributions.length - 1 ? `1px solid ${COLORS.hairline}` : "none" };
              return c.hansardUrl ? (
                <a key={i} href={c.hansardUrl} target="_blank" rel="noreferrer" style={{ ...rowStyle, textDecoration: "none" }}>
                  {row}
                </a>
              ) : (
                <div key={i} style={rowStyle}>{row}</div>
              );
            })}
          </div>
        </div>
      )}

      {writtenQuestions.length > 0 && (
        <div>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Written Questions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {writtenQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => withScrollPreserved(() => onNavigate?.("writtenQuestions", politician))}
                style={{
                  display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: onNavigate ? "pointer" : "default", padding: 0,
                  paddingBottom: 10, borderBottom: i < writtenQuestions.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                }}
              >
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.ink }}>{q.heading}</div>
                {q.questionText && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.ink, opacity: 0.85, lineHeight: 1.5, marginTop: 4 }}>
                    {stripHtml(q.questionText)}
                  </div>
                )}
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft, marginTop: 5, letterSpacing: "0.01em" }}>
                  To {q.department} · tabled {formatDate(q.dateTabled)}
                  {q.dateAnswered ? ` · answered ${formatDate(q.dateAnswered)}` : " · awaiting answer"}
                </div>
              </button>
            ))}
          </div>
          {onNavigate && (
            <button
              onClick={() => withScrollPreserved(() => onNavigate("writtenQuestions", politician))}
              style={{ display: "block", marginTop: 10, fontSize: 12, color: COLORS.accent, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY }}
            >
              See all their written questions →
            </button>
          )}
        </div>
      )}
    </CardShell>
  );
}

export function NewsBox({ politician }) {
  const [articles, setArticles] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("mp_news")
        .select("headline, source, url, published_date")
        .eq("politician_id", politician.id)
        .order("published_date", { ascending: false });
      setFailed(Boolean(error));
      setArticles(data ?? []);
    }
    load();
  }, [politician.id]);

  if (failed) {
    return (
      <CardShell title="In the News">
        <LoadFailedNote item="news coverage" />
      </CardShell>
    );
  }

  return (
    <CardShell title="In the News">
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.8, marginBottom: 10, lineHeight: 1.5 }}>
        Not a verified fact-check — a same-named person or a passing mention can occasionally slip through. See Data
        & Methodology for how this is compiled.
      </div>
      {articles === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
      {articles?.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No recent news coverage found for this MP in the last two weeks.
        </div>
      )}
      {articles && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {articles.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block", textDecoration: "none", paddingBottom: i < articles.length - 1 ? 10 : 0,
                borderBottom: i < articles.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.35 }}>{a.headline}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.accent, marginTop: 3, fontWeight: 600 }}>
                {a.source} · {formatDate(a.published_date)} ↗
              </div>
            </a>
          ))}
        </div>
      )}
    </CardShell>
  );
}

// A failed fetch and a genuinely empty result both leave `data` null/[] if
// the caller only ever checks `data ?? []` — which on a transparency site
// means a network hiccup can render as "no published Committee on
// Standards finding" or "no declared financial interests", stating a
// clean record when the truth is just "we don't know right now". This is
// the distinct message for the failure case, so it never gets silently
// swallowed into the same copy as an actual empty result.
export function LoadFailedNote({ item = "this" }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY, fontSize: 13, color: "#9C3B3B", background: "#9C3B3B14",
        border: "1px solid #9C3B3B33", borderRadius: 8, padding: "10px 13px", lineHeight: 1.5,
      }}
    >
      Couldn't load {item}. This looks like a connection problem, not an empty record. Try refreshing the page.
    </div>
  );
}

export function PlaceholderBox({ title, note }) {
  return (
    <div style={{ paddingTop: 18, borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, marginBottom: 6 }}>
        {sentenceCase(title)}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>{note}</div>
    </div>
  );
}

export { FONT_DISPLAY, FONT_BODY, FONT_MONO, COLORS };
