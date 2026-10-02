import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { EyebrowLabel, ParliamentSilhouette } from "./shared";
import GlobalSearch from "./GlobalSearch";
import { IconHome, IconMethodology, IconSettings, IconPin, IconStar, IconRoute } from "./icons";
import { SECTIONS } from "../data/sidebarSections";
import { readSectionChoices, writeSectionChoices, isSectionOpen } from "../lib/sidebarState";

const HOME_NAV_ITEMS = [
  { key: "start", label: "Start Here", icon: IconRoute },
  { key: "home", label: "Overview", icon: IconHome },
  { key: "myMP", label: "My MP", icon: IconPin },
  { key: "watchlist", label: "My Watchlist", icon: IconStar },
];

const BOTTOM_NAV_ITEMS = [
  { key: "methodology", label: "Data & Methodology", icon: IconMethodology },
  { key: "settings", label: "Settings", icon: IconSettings },
];

const ACCENT_DEFAULT = "#8A9694";

function NavItem({ item, active, accent, onNavigate }) {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;

  return (
    <button
      onClick={() => !item.soon && onNavigate(item.key)}
      disabled={item.soon}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "7px 10px",
        borderRadius: 8,
        border: "none",
        background: active ? `linear-gradient(90deg, ${accent}26, ${accent}05 70%)` : hover ? "rgba(255,255,255,0.045)" : "transparent",
        color: item.soon ? "rgba(199,206,224,0.4)" : active ? "#fff" : COLORS.sidebarText,
        fontFamily: FONT_BODY,
        fontSize: 13.5,
        fontWeight: active ? 600 : 400,
        whiteSpace: "nowrap",
        cursor: item.soon ? "default" : "pointer",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-bar"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          style={{ position: "absolute", left: 0, top: 3, bottom: 3, width: 3, borderRadius: 3, background: accent }}
        />
      )}
      <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            width: 21, height: 21, borderRadius: 6,
            color: active ? accent : "inherit",
            background: active ? `${accent}1e` : "transparent",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          <Icon size={14} />
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
      </span>
      {item.soon && (
        <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Soon
        </span>
      )}
    </button>
  );
}

function NavList({ items, activeView, onNavigate, accent = ACCENT_DEFAULT }) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((item) => (
        <NavItem key={item.key} item={item} active={activeView === item.key} accent={accent} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

// A section that folds away. The header shows how many pages are inside and,
// while it's closed, which of them you're on, so collapsing never loses your
// place.
function SidebarSection({ label, accent, items, activeView, onNavigate, open, onToggle }) {
  const activeItem = items.find((i) => i.key === activeView);
  return (
    <div
      style={{
        marginTop: 8,
        borderRadius: 11,
        background: open ? `linear-gradient(160deg, ${accent}17, ${accent}05 75%)` : "transparent",
        border: `1px solid ${open ? `${accent}2a` : "rgba(255,255,255,0.05)"}`,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "9px 10px", textAlign: "left" }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0, boxShadow: `0 0 0 3px ${accent}2e` }} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.92)", flexShrink: 0 }}>{label}</span>
        {!open && activeItem && (
          <span style={{ minWidth: 0, flex: 1, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            · {activeItem.label}
          </span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: "rgba(199,206,224,0.45)" }}>{items.length}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(199,206,224,0.6)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 7px 8px" }}>
              <NavList items={items} activeView={activeView} onNavigate={onNavigate} accent={accent} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarInner({ activeView, onNavigate, onSelectPolitician }) {
  // Sections the visitor has opened or closed themselves; the rest follow
  // the page they're on. "Start Here" lives in the top group, not under Learn.
  const [choices, setChoices] = useState(() => readSectionChoices());
  const sections = SECTIONS.map((section) => ({ ...section, items: section.items.filter((i) => i.key !== "start") }));
  const states = sections.map((section) => isSectionOpen(choices, section.key, section.items.some((i) => i.key === activeView)));
  const allOpen = states.every(Boolean);

  function toggle(key, currentlyOpen) {
    const next = { ...choices, [key]: !currentlyOpen };
    setChoices(next);
    writeSectionChoices(next);
  }

  function setAll(open) {
    const next = Object.fromEntries(sections.map((s) => [s.key, open]));
    setChoices(next);
    writeSectionChoices(next);
  }

  return (
    <>
      <div style={{ marginBottom: 4, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
          <ParliamentSilhouette width={46} color={COLORS.accentOnDark} opacity={0.95} />
        </div>
        {/* EyebrowLabel renders its own rule+text as a flex row, which a
            plain text-align:center on this wrapper can't centre (that
            only centres inline content, not a flex child's box) — wrapped
            here so the label actually sits centred above the title below
            it, instead of drifting left of it. No rule here (showRule is
            for the left-aligned masthead usage next to a headline) — a
            leading dash in front of one centred, standalone word just
            reads as a stray mark rather than a section marker. */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <EyebrowLabel color={COLORS.accentOnDark} showRule={false}>Public Record</EyebrowLabel>
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18, color: "#fff", lineHeight: 1.2, marginTop: 6 }}>
          UK Parliament Tracker
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <span style={{ width: 140, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <GlobalSearch onSelectPolitician={onSelectPolitician} onNavigate={onNavigate} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ marginTop: 10 }}>
          <NavList items={HOME_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setAll(!allOpen)}
            style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: "rgba(199,206,224,0.55)" }}
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
        {sections.map((section, i) => (
          <SidebarSection
            key={section.key}
            label={section.label}
            accent={section.accent}
            items={section.items}
            activeView={activeView}
            onNavigate={onNavigate}
            open={states[i]}
            onToggle={() => toggle(section.key, states[i])}
          />
        ))}
      </div>

      <div style={{ paddingTop: 10, marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <NavList items={BOTTOM_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
      </div>
    </>
  );
}

export default function Sidebar({ activeView, onNavigate, onSelectPolitician }) {
  const [open, setOpen] = useState(false);

  function handleNav(key) {
    onNavigate(key);
    setOpen(false);
  }

  function handleSelectPolitician(p) {
    onSelectPolitician?.(p);
    setOpen(false);
  }

  return (
    <>
      <div
        className="mp-mobile-topbar"
        style={{ alignItems: "center", justifyContent: "space-between", background: COLORS.sidebarBg, padding: "14px 18px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ParliamentSilhouette width={26} color={COLORS.accentOnDark} />
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: "#fff" }}>UK Parliament Tracker</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 6 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className={`mp-sidebar-backdrop${open ? " mp-sidebar-open" : ""}`} onClick={() => setOpen(false)} />

      <div
        className={`mp-sidebar${open ? " mp-sidebar-open" : ""}`}
        style={{
          width: 272,
          flexShrink: 0,
          background: `linear-gradient(160deg, ${COLORS.sidebarBg}, ${COLORS.sidebarBgDeep})`,
          minHeight: "100vh",
          maxHeight: "100vh",
          overflowY: "auto",
          alignSelf: "flex-start",
          padding: "20px 16px 16px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <SidebarInner activeView={activeView} onNavigate={handleNav} onSelectPolitician={handleSelectPolitician} />
      </div>
    </>
  );
}
