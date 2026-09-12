import { useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { EyebrowLabel, ParliamentSilhouette } from "./shared";
import GlobalSearch from "./GlobalSearch";
import {
  IconHome, IconFlow, IconCoin, IconVote, IconGroup, IconInfluence, IconManifesto, IconTracker,
  IconMethodology, IconSettings, IconGlossary, IconHistory, IconDevolved, IconFormerMP, IconBudget, IconCabinet, IconTimeline,
  IconPartyFinance, IconByElection,
} from "./icons";

const HOME_NAV_ITEMS = [{ key: "home", label: "Overview", icon: IconHome }];

const LEARN_NAV_ITEMS = [
  { key: "howitworks", label: "How Parliament Works", icon: IconFlow },
  { key: "devolved", label: "Devolved Administrations", icon: IconDevolved },
  { key: "parties", label: "Party Policies", icon: IconManifesto },
  { key: "glossary", label: "Glossary", icon: IconGlossary },
];

const GOVERNMENT_NAV_ITEMS = [
  { key: "cabinet", label: "Cabinet", icon: IconCabinet },
  { key: "budget", label: "Government Budget", icon: IconBudget },
  { key: "tracker", label: "Government Tracker", icon: IconTracker },
  { key: "byElections", label: "Elections", icon: IconByElection },
];

// Where the money is — who funds MPs individually vs. who funds parties
// directly. Split out from MP Accountability below since Party Finances
// isn't about any one MP's own conduct, and grouping it with Donors &
// Lobbying makes the "follow the money" pages easy to find together.
const MONEY_NAV_ITEMS = [
  { key: "donors", label: "Donors & Lobbying", icon: IconInfluence },
  { key: "partyFinances", label: "Party Finances", icon: IconPartyFinance },
];

const ACCOUNTABILITY_NAV_ITEMS = [
  { key: "list", label: "Financial Interests", icon: IconCoin },
  { key: "voting", label: "Voting Records & Bills", icon: IconVote },
  { key: "appg", label: "APPG Memberships", icon: IconGroup },
];

const HISTORY_NAV_ITEMS = [
  { key: "history", label: "Political History", icon: IconHistory },
  { key: "timeline", label: "Timeline", icon: IconTimeline },
  { key: "formerMps", label: "Former MPs", icon: IconFormerMP },
];

const BOTTOM_NAV_ITEMS = [
  { key: "methodology", label: "Data & Methodology", icon: IconMethodology },
  { key: "settings", label: "Settings", icon: IconSettings },
];

// One accent hue per section, used for its label dot, its active-item
// highlight, and now the active item's icon colour — the fastest way to
// tell at a glance which group you're in, independent of reading the
// (smaller, uppercase) section label itself. Chosen to be distinct from
// every other colour already in use elsewhere in the app (party colours,
// budget categories, the brass/teal accent).
const ACCENT_LEARN = "#5A7FA6";
const ACCENT_GOVERNMENT = "#9C6B30";
const ACCENT_MONEY = "#B5533C";
const ACCENT_DATA = "#6E4B6E";
const ACCENT_HISTORY = "#3F7D5C";
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

function SidebarSection({ label, accent, items, activeView, onNavigate }) {
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 10px 6px" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0, boxShadow: `0 0 0 3px ${accent}2e` }} />
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.92)",
          }}
        >
          {label}
        </span>
      </div>
      <NavList items={items} activeView={activeView} onNavigate={onNavigate} accent={accent} />
    </div>
  );
}

function SidebarInner({ activeView, onNavigate, onSelectPolitician }) {
  return (
    <>
      <div style={{ marginBottom: 4, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
          <ParliamentSilhouette width={46} color={COLORS.brass} opacity={0.95} />
        </div>
        <EyebrowLabel>Public Record</EyebrowLabel>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: "#fff", lineHeight: 1.2, marginTop: 4 }}>
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
        <SidebarSection label="Learn" accent={ACCENT_LEARN} items={LEARN_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
        <SidebarSection label="The Government" accent={ACCENT_GOVERNMENT} items={GOVERNMENT_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
        <SidebarSection label="Money in Politics" accent={ACCENT_MONEY} items={MONEY_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
        <SidebarSection label="MP Accountability" accent={ACCENT_DATA} items={ACCOUNTABILITY_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
        <SidebarSection label="History" accent={ACCENT_HISTORY} items={HISTORY_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
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
          <ParliamentSilhouette width={26} color={COLORS.brass} />
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
