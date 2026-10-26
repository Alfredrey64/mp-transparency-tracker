import { useContext, useLayoutEffect } from "react";
import PageGuide from "./PageGuide";
import { GuideKeyContext } from "../lib/viewContext";
import ShareButton from "./ShareButton";
import { pageShareSpec } from "../lib/shareSpecs";
import { motion } from "motion/react";
import { COLORS, FONT_DISPLAY, FONT_BODY, readable, onFill } from "../theme";
import { SECTION_ACCENT_BY_ICON, SECTION_LABEL_BY_KEY } from "../data/sidebarSections";
// An annotated passage, not a dashboard tile: a left margin rule in the
// page's own accent colour and a soft tint of that same colour, open on
// every other edge — no bounding box, no radius, no drop shadow, nothing
// to make several of these in a row read as identical stacked cards.
// Closer to how a printed report marks up a marginal note than to a SaaS
// card kit. The icon is optional and sits inline with the heading rather
// than in its own circular badge.
export function InfoCard({ title, color, children, maxWidth = "none", icon: Icon, wide = false }) {
  // Sits in the page's two-column layout on a wide screen (see .editorial-body); `wide` spans both columns.
  // A plain box: nothing fades or slides in as the page scrolls.
  return (
    <div
      className={wide ? undefined : "ed-half"}
      style={{
        borderLeft: `3px solid ${color}`, background: `${color}0a`, maxWidth,
        padding: "18px 22px 20px", marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 9 }}>
        {Icon && (
          <span style={{ flexShrink: 0, color: readable(color), display: "inline-flex", position: "relative", top: 2 }}>
            <Icon size={18} />
          </span>
        )}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.7 }}>{children}</div>
    </div>
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
      className="ed-half"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35 }}
      style={{
        display: "flex", alignItems: "center", gap: 14, marginBottom: 28,
        background: `color-mix(in srgb, ${color} 7%, ${COLORS.paperCard})`, border: `1px solid ${color}33`,
        borderRadius: 14, padding: "16px 20px",
      }}
    >
      <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: onFill(color) }}>
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
          background: broken ? "transparent" : `${color}1c`, color: readable(color),
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

// share: a function returning what goes on the page's share card (see lib/shareSpecs.js); leave it out for a plain card of the
// title and subtitle, or pass false on a page that has its own Share button.
// Tells the rest of the page which colour it belongs to (its menu group's), so the soft wash under the band and the thin line on top of each card
// can pick it up. Set on the page shell and removed again when the page changes.
function usePageAccent(accent) {
  useLayoutEffect(() => {
    const shell = document.querySelector(".mp-app-shell");
    shell?.style.setProperty("--page-accent", accent);
    return () => shell?.style.removeProperty("--page-accent");
  }, [accent]);
}

export function PageHeader({ kicker = "UK Parliament", title, subtitle, align = "left", size = "lg", icon: Icon, share }) {
  const isHero = size === "xl";
  // The page's "What you're looking at" box sits under every header.
  const guideKey = useContext(GuideKeyContext);
  // Every page passes its own distinct icon here already: reusing it as the lookup key gives each page its menu group's colour (see
  // data/sidebarSections.js) with nothing passed down through the 60-odd page files. Pages outside any group keep the plain site accent.
  const accent = SECTION_ACCENT_BY_ICON.get(Icon) ?? COLORS.accent;
  const kickerText = SECTION_LABEL_BY_KEY.get(guideKey) ?? kicker;
  usePageAccent(accent);
  return (
    <>
      <div className="page-hero" data-align={align} style={{ "--hero-accent": accent }}>
        <div className="page-hero-inner">
          <nav aria-label="Breadcrumb" className="crumbs">
            <a href="#/">Home</a>
            <span aria-hidden="true">/</span>
            <span>{kickerText}</span>
          </nav>
          <h1 className="page-hero-title">
            {Icon && <span className="page-hero-icon"><Icon size={isHero ? 34 : 28} /></span>}
            <span>{title}</span>
          </h1>
          {subtitle && <p className="page-hero-sub">{subtitle}</p>}
          {!isHero && share !== false && (
            <div className="ons-noprint" style={{ marginTop: 18 }}>
              <ShareButton
                filename={String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
                getSpec={share ?? (() => pageShareSpec({ kicker: kickerText, title, subtitle, accent, link: window.location.href }))}
                style={{ color: "#fff", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, minHeight: 40, padding: "0 16px" }}
              />
            </div>
          )}
        </div>
      </div>
      {!isHero && <PageGuide viewKey={guideKey} />}
    </>
  );
}

// The navy band at the top of a page, for pages that build their own heading (a council search, a constituency, an MP's profile).
// `crumbs` is the trail after "Home"; the children sit under the title.
export function HeroBand({ crumbs, accent, children, wide = false, maxWidth }) {
  usePageAccent(accent ?? COLORS.accent);
  return (
    <div className="page-hero" style={{ "--hero-accent": accent ?? COLORS.accent }}>
      <div className={`page-hero-inner${wide ? " wide" : ""}`} style={maxWidth ? { maxWidth, margin: "0 auto" } : undefined}>
        <nav aria-label="Breadcrumb" className="crumbs">
          <a href="#/">Home</a>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "contents" }}>
              <span aria-hidden="true">/</span>
              {c}
            </span>
          ))}
        </nav>
        {children}
      </div>
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
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 14.5, letterSpacing: "0.01em", color: readable(color) }}>
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
