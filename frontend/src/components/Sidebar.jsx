import { useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { EyebrowLabel, ParliamentSilhouette } from "./shared";
import GlobalSearch from "./GlobalSearch";
import {
  IconHome, IconFlow, IconCoin, IconVote, IconGroup, IconInfluence, IconManifesto, IconTracker,
  IconMethodology, IconSettings, IconGlossary, IconHistory, IconDevolved, IconFormerMP, IconBudget, IconCabinet, IconTimeline,
  IconPartyFinance, IconByElection, IconLords, IconPetition, IconCompass, IconCommittee, IconCompare, IconMeeting,
  IconQuestion, IconGavel, IconPin, IconRankings, IconDarkMoney, IconThinkTank, IconDoor, IconRegister,
  IconSearch, IconStar, IconBook,
} from "./icons";

const HOME_NAV_ITEMS = [
  { key: "home", label: "Overview", icon: IconHome },
  { key: "myMP", label: "My MP", icon: IconPin },
  { key: "watchlist", label: "My Watchlist", icon: IconStar },
];

// One accent hue per section, used for its label dot, its card tint, its
// active-item highlight, and its active item's icon colour — the fastest
// way to tell at a glance which group you're in, independent of reading
// the (smaller, uppercase) section label itself. Turned up to real,
// saturated colour rather than the muted institutional tones this used to
// be — the whole point is that sections read as visually distinct, which a
// set of near-identical desaturated browns and greens never quite managed.
// Each section renders as its own faintly tinted card so the groups stay
// visually distinct even with every item on screen at once.
const SECTIONS = [
  {
    key: "learn",
    label: "Learn",
    accent: "#2F80ED",
    items: [
      { key: "howitworks", label: "How Parliament Works", icon: IconFlow },
      { key: "devolved", label: "Devolved Administrations", icon: IconDevolved },
      { key: "parties", label: "Party Policies", icon: IconManifesto },
      { key: "glossary", label: "Glossary", icon: IconGlossary },
      { key: "mediaLiteracy", label: "Media Literacy", icon: IconBook },
    ],
  },
  {
    // Interactive, participatory tools — as distinct from Learn's static
    // reference material above. Find Your Party lived under Learn before,
    // but it's a personalised tool, not something to read; Petitions used
    // to sit under The Government, but a petition is something a citizen
    // does, not a government institution.
    key: "involved",
    label: "Get Involved",
    accent: "#E0367A",
    items: [
      { key: "partymatch", label: "Find Your Party", icon: IconCompass },
      { key: "petitions", label: "Petitions", icon: IconPetition },
    ],
  },
  {
    key: "government",
    label: "The Government",
    accent: "#D9A62A",
    items: [
      { key: "cabinet", label: "Cabinet", icon: IconCabinet },
      { key: "lords", label: "House of Lords", icon: IconLords },
      { key: "committees", label: "Select Committees", icon: IconCommittee },
      { key: "budget", label: "Government Budget", icon: IconBudget },
      { key: "tracker", label: "Promises Tracker", icon: IconTracker },
      { key: "byElections", label: "Elections", icon: IconByElection },
    ],
  },
  {
    // Where the money is — declared interests, who funds MPs individually,
    // and who funds parties directly. "Financial Interests" lives here
    // (not under MP Accountability below) because it's the app's core
    // follow-the-money page, not a record of an MP's personal conduct.
    // Kept to the four *declared-register* pages — somewhere to look up a
    // real name and a real figure — so it doesn't blur into the explainer
    // pages just below, which are about what the registers can't show you.
    key: "money",
    label: "Money in Politics",
    accent: "#F2622A",
    items: [
      { key: "followTheMoney", label: "Follow the Money", icon: IconSearch },
      { key: "list", label: "Financial Interests", icon: IconCoin },
      { key: "donors", label: "Donors & Lobbying", icon: IconInfluence },
      { key: "partyFinances", label: "Party Finances", icon: IconPartyFinance },
      { key: "ministerialMeetings", label: "Ministerial Meetings", icon: IconMeeting },
    ],
  },
  {
    // The other side of "Money in Politics": not a register of names and
    // figures, but an explanation of where those registers run out — a
    // legal gap, an expired rule, an undisclosed funder. Split out from
    // "Money in Politics" itself once it grew to four pages of its own,
    // so neither section reads as a long, undifferentiated list.
    key: "gaps",
    label: "Transparency Gaps",
    accent: "#E63946",
    items: [
      { key: "darkMoney", label: "Dark Money", icon: IconDarkMoney },
      { key: "revolvingDoor", label: "Revolving Door", icon: IconDoor },
      { key: "lobbyingRegister", label: "Consultant Lobbyists", icon: IconRegister },
      { key: "thinkTanks", label: "Think Tank Funding", icon: IconThinkTank },
    ],
  },
  {
    // What MPs actually do in Parliament, as distinct from money — how
    // they vote and which cross-party groups they join.
    key: "accountability",
    label: "MP Accountability",
    accent: "#9B4FE0",
    items: [
      { key: "voting", label: "Voting Records & Bills", icon: IconVote },
      { key: "writtenQuestions", label: "Written Questions", icon: IconQuestion },
      { key: "standards", label: "Standards & Sanctions", icon: IconGavel },
      { key: "appg", label: "APPG Memberships", icon: IconGroup },
      { key: "compare", label: "Compare MPs", icon: IconCompare },
      { key: "rankings", label: "Rankings", icon: IconRankings },
    ],
  },
  {
    key: "history",
    label: "History",
    accent: "#1FA97C",
    items: [
      { key: "history", label: "Political History", icon: IconHistory },
      { key: "timeline", label: "Timeline", icon: IconTimeline },
      { key: "formerMps", label: "Former MPs", icon: IconFormerMP },
    ],
  },
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

function SidebarSection({ label, accent, items, activeView, onNavigate }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "9px 7px",
        borderRadius: 11,
        background: `linear-gradient(160deg, ${accent}17, ${accent}05 75%)`,
        border: `1px solid ${accent}2a`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 3px 7px" }}>
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
        {SECTIONS.map((section) => (
          <SidebarSection
            key={section.key}
            label={section.label}
            accent={section.accent}
            items={section.items}
            activeView={activeView}
            onNavigate={onNavigate}
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
