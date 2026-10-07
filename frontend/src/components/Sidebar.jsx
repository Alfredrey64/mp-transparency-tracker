import { preloadView } from "../pageLoaders";
import { useWatchlistChanges } from "../lib/useWatchlistChanges";
import { useEffect, useRef, useState } from "react";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { EyebrowLabel, ParliamentSilhouette } from "./shared";
import GlobalSearch from "./GlobalSearch";
import { IconHome, IconMethodology, IconSettings, IconPin, IconStar, IconRoute } from "./icons";
import { SECTIONS } from "../data/sidebarSections";
import { readSectionChoices, writeSectionChoices, readSidebarMode, writeSidebarMode, sectionsForMode, sectionStartsOpen } from "../lib/sidebarState";

// The menu, written for someone who has never used the site: plain page
// names, a few words under each saying what it is, pages grouped by what you
// might want to do, and a "Simple" view that shows only the dozen pages most
// people need. "All pages" shows everything.

const HOME_NAV_ITEMS = [
  { key: "home", label: "Overview", icon: IconHome, hint: "The big picture" },
  { key: "myMP", label: "My MP", icon: IconPin, hint: "Who represents you" },
  { key: "watchlist", label: "My watchlist", icon: IconStar, hint: "MPs you follow" },
];

const BOTTOM_NAV_ITEMS = [
  { key: "methodology", label: "Where our data comes from", icon: IconMethodology },
  { key: "settings", label: "Settings", icon: IconSettings },
];

const ACCENT_DEFAULT = "#8A9694";
const TOTAL_PAGES = SECTIONS.reduce((n, s) => n + s.items.filter((i) => i.key !== "start").length, 0);

function NavItem({ item, active, accent, onNavigate }) {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;

  return (
    <button
      type="button"
      className="side-item"
      aria-current={active ? "page" : undefined}
      onClick={() => !item.soon && onNavigate(item.key)}
      disabled={item.soon}
      onMouseEnter={() => {
        setHover(true);
        preloadView(item.key);
      }}
      onFocus={() => preloadView(item.key)}
      onTouchStart={() => preloadView(item.key)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        width: "100%",
        padding: "8px 10px",
        borderRadius: 10,
        border: "none",
        background: active ? `linear-gradient(90deg, ${accent}30, ${accent}08 78%)` : hover ? "rgba(255,255,255,0.055)" : "transparent",
        color: item.soon ? "rgba(199,206,224,0.4)" : active ? "#fff" : COLORS.sidebarText,
        fontFamily: FONT_BODY,
        cursor: item.soon ? "default" : "pointer",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      {active && <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: 3, background: accent }} />}
      <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <span
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            width: 28, height: 28, borderRadius: 8,
            color: active ? accent : "rgba(220,226,240,0.78)",
            background: active ? `${accent}24` : "rgba(255,255,255,0.045)",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          <Icon size={15} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14.5, fontWeight: active ? 700 : 500, lineHeight: 1.25, whiteSpace: "normal" }}>{item.label}</span>
          {item.hint && <span style={{ display: "block", fontSize: 12, lineHeight: 1.3, marginTop: 1, color: active ? "rgba(255,255,255,0.72)" : "rgba(199,206,224,0.58)" }}>{item.hint}</span>}
        </span>
      </span>
      {item.badge > 0 && (
        <span
          title={`${item.badge} new for the MPs you follow`}
          style={{ flexShrink: 0, minWidth: 20, height: 20, padding: "0 6px", boxSizing: "border-box", borderRadius: 999, background: "#F2622A", color: "#fff", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </button>
  );
}

function NavList({ items, activeView, onNavigate, accent = ACCENT_DEFAULT }) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {items.map((item) => (
        <NavItem key={item.key} item={item} active={activeView === item.key} accent={accent} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

// A group of pages with a plain title and a line saying what it is for. It
// folds away; while closed, the header names the page you are on so you
// never lose your place.
function SidebarSection({ label, blurb, accent, items, activeView, onNavigate, open, onToggle, animate }) {
  const activeItem = items.find((i) => i.key === activeView);
  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 14,
        background: open ? `linear-gradient(160deg, ${accent}1a, ${accent}06 75%)` : "rgba(255,255,255,0.02)",
        border: `1px solid ${open ? `${accent}30` : "rgba(255,255,255,0.06)"}`,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "11px 12px", textAlign: "left" }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent, flexShrink: 0, boxShadow: `0 0 0 4px ${accent}2a` }} />
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{label}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: !open && activeItem ? accent : "rgba(199,206,224,0.6)", marginTop: 2, lineHeight: 1.3, fontWeight: !open && activeItem ? 600 : 400 }}>
            {!open && activeItem ? `You're on: ${activeItem.label}` : blurb}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "rgba(199,206,224,0.5)" }}>{items.length}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(199,206,224,0.7)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {/* Folds with a grid-row transition, but only once the visitor has opened or closed
          something themselves. A section that opens on its own (the one holding the page you
          are on, or when the page first loads) opens at once, so it can never be left half
          open. Closed content is inert so it can't be tabbed to. */}
      <div className={animate ? "fold fold-anim" : "fold"} data-open={open} inert={!open}>
        <div className="fold-inner">
          <div style={{ padding: "0 8px 9px" }}>
            <NavList items={items} activeView={activeView} onNavigate={onNavigate} accent={accent} />
          </div>
        </div>
      </div>
    </div>
  );
}

// "Simple | All pages": the two views of the menu.
function ModeSwitch({ mode, onChange }) {
  const option = (key, label) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={mode === key}
      onClick={() => onChange(key)}
      style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, padding: "7px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: mode === key ? "rgba(255,255,255,0.16)" : "transparent", color: mode === key ? "#fff" : "rgba(199,206,224,0.7)", transition: "background 0.15s, color 0.15s" }}
    >
      {label}
    </button>
  );
  return (
    <div role="radiogroup" aria-label="How much of the menu to show" style={{ display: "flex", gap: 2, padding: 3, borderRadius: 999, background: "rgba(255,255,255,0.06)", marginTop: 14 }}>
      {option("simple", "Simple")}
      {option("all", `All ${TOTAL_PAGES} pages`)}
    </div>
  );
}

function SidebarInner({ activeView, onNavigate, onSelectPolitician }) {
  // A count beside "My watchlist" when the MPs you follow have something new.
  const watch = useWatchlistChanges();
  const homeItems = HOME_NAV_ITEMS.map((i) => (i.key === "watchlist" && watch?.changes > 0 ? { ...i, badge: watch.changes } : i));
  const [mode, setMode] = useState(() => readSidebarMode());
  // Sections the visitor has opened or closed themselves; the rest follow the mode.
  const [choices, setChoices] = useState(() => readSectionChoices());
  const sections = sectionsForMode(SECTIONS, mode, activeView);
  const states = sections.map((section) => sectionStartsOpen(choices, section.key, mode, section.items.some((i) => i.key === activeView)));
  const allOpen = states.every(Boolean);

  // Whether the visitor has folded or unfolded anything yet.
  const [touched, setTouched] = useState(false);
  const scroller = useRef(null);

  // Keep the page you are on whole in the menu: scroll the menu (not the page) just enough to show it.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const box = scroller.current?.closest(".mp-sidebar");
      const item = box?.querySelector('[aria-current="page"]');
      if (!box || !item) return;
      const b = box.getBoundingClientRect();
      const r = item.getBoundingClientRect();
      if (r.bottom > b.bottom - 12) box.scrollTop += r.bottom - b.bottom + 24;
      else if (r.top < b.top + 12) box.scrollTop -= b.top - r.top + 24;
    });
    return () => cancelAnimationFrame(frame);
  }, [activeView, mode]);

  function toggle(key, currentlyOpen) {
    setTouched(true);
    const next = { ...choices, [key]: !currentlyOpen };
    setChoices(next);
    writeSectionChoices(next);
  }

  function setAll(open) {
    setTouched(true);
    const next = Object.fromEntries(sections.map((s) => [s.key, open]));
    setChoices({ ...choices, ...next });
    writeSectionChoices({ ...choices, ...next });
  }

  function changeMode(next) {
    setMode(next);
    writeSidebarMode(next);
  }

  return (
    <>
      <div style={{ marginBottom: 4, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
          <ParliamentSilhouette width={46} color={COLORS.accentOnDark} opacity={0.95} />
        </div>
        {/* No rule here (showRule is for the left-aligned masthead usage next
            to a headline): a leading dash in front of one centred word just
            reads as a stray mark. */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <EyebrowLabel color={COLORS.accentOnDark} showRule={false}>Independent and unofficial</EyebrowLabel>
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, color: "#fff", lineHeight: 1.2, marginTop: 6 }}>
          UK Parliament Tracker
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <span style={{ width: 140, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <GlobalSearch onSelectPolitician={onSelectPolitician} onNavigate={onNavigate} />
      </div>

      <div ref={scroller} style={{ flex: 1 }}>
        {/* The first thing a newcomer should see. */}
        <button
          type="button"
          onClick={() => onNavigate("start")}
          aria-current={activeView === "start" ? "page" : undefined}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", marginTop: 14, padding: "11px 12px", borderRadius: 14, cursor: "pointer", border: "1px solid #1FA97C66", background: activeView === "start" ? "linear-gradient(135deg, #1FA97C55, #1FA97C22)" : "linear-gradient(135deg, #1FA97C33, #1FA97C0f)" }}
        >
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#1FA97C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconRoute size={17} />
          </span>
          <span>
            <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: "#fff" }}>New? Take the tour</span>
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 1 }}>5 minutes, no jargon needed</span>
          </span>
        </button>

        <div style={{ marginTop: 12 }}>
          <NavList items={homeItems} activeView={activeView} onNavigate={onNavigate} />
        </div>

        <ModeSwitch mode={mode} onChange={changeMode} />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setAll(!allOpen)}
            style={{ background: "none", border: "none", padding: "3px 4px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: "rgba(199,206,224,0.7)" }}
          >
            {allOpen ? "Fold all groups" : "Open all groups"}
          </button>
        </div>
        {sections.map((section, i) => (
          <SidebarSection
            key={section.key}
            label={section.label}
            blurb={section.blurb}
            accent={section.accent}
            items={section.items}
            activeView={activeView}
            onNavigate={onNavigate}
            open={states[i]}
            animate={touched}
            onToggle={() => toggle(section.key, states[i])}
          />
        ))}
        {mode === "simple" && (
          <button
            type="button"
            onClick={() => changeMode("all")}
            style={{ display: "block", width: "100%", marginTop: 12, padding: "10px 12px", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.18)", background: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: "rgba(220,226,240,0.85)", textAlign: "center" }}
          >
            Looking for something else? Show all {TOTAL_PAGES} pages
          </button>
        )}
      </div>

      <div style={{ paddingTop: 10, marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
          width: 300,
          flexShrink: 0,
          background: `linear-gradient(160deg, ${COLORS.sidebarBg}, ${COLORS.sidebarBgDeep})`,
          overflowY: "auto",
          alignSelf: "flex-start",
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
