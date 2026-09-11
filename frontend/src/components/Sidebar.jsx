import { useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { EyebrowLabel, ParliamentSilhouette } from "./shared";
import { IconHome, IconFlow, IconCoin, IconVote, IconGroup, IconInfluence, IconManifesto, IconTracker, IconBriefcase, IconMethodology, IconSettings } from "./icons";

const TOP_NAV_ITEMS = [
  { key: "home", label: "Overview", icon: IconHome },
  { key: "howitworks", label: "How Parliament Works", icon: IconFlow },
  { key: "parties", label: "Party Policies", icon: IconManifesto },
  { key: "tracker", label: "Government Tracker", icon: IconTracker },
];

const DATA_NAV_ITEMS = [
  { key: "list", label: "Financial Interests", icon: IconCoin },
  { key: "voting", label: "Voting Records & Bills", icon: IconVote },
  { key: "appg", label: "APPG Memberships", icon: IconGroup },
  { key: "donors", label: "Donors & Lobbying", icon: IconInfluence },
  { key: "companies", label: "Companies House", icon: IconBriefcase },
];

const BOTTOM_NAV_ITEMS = [
  { key: "methodology", label: "Data & Methodology", icon: IconMethodology },
  { key: "settings", label: "Settings", icon: IconSettings },
];

function SectionLabel({ children }) {
  return (
    <div style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "rgba(226,232,232,0.8)",
          padding: "0 14px 12px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function NavList({ items, activeView, onNavigate, withDividers }) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {items.map((item, i) => {
        const active = activeView === item.key;
        const Icon = item.icon;
        return (
          <div key={item.key}>
            {withDividers && i > 0 && <div style={{ height: 1, margin: "2px 14px", background: "rgba(255,255,255,0.08)" }} />}
            <button
              onClick={() => !item.soon && onNavigate(item.key)}
              disabled={item.soon}
              style={{
                position: "relative",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: item.soon ? "rgba(199,206,224,0.4)" : active ? "#fff" : COLORS.sidebarText,
                fontFamily: FONT_BODY,
                fontSize: 14.25,
                fontWeight: active ? 600 : 400,
                whiteSpace: "nowrap",
                cursor: item.soon ? "default" : "pointer",
                transition: "color 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => { if (!item.soon && !active) e.currentTarget.style.transform = "translateX(3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.09)", borderRadius: 8, zIndex: 0 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <Icon />
                <span>{item.label}</span>
              </span>
              {item.soon && (
                <span style={{ position: "relative", zIndex: 1, fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Soon
                </span>
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarInner({ activeView, onNavigate }) {
  return (
    <>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <ParliamentSilhouette width={72} color={COLORS.brass} opacity={0.9} />
        </div>
        <EyebrowLabel>Public Record</EyebrowLabel>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: "#fff", lineHeight: 1.25, marginTop: 6 }}>
          UK Parliament Tracker
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
          <span style={{ width: 36, height: 1, background: "rgba(255,255,255,0.15)" }} />
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <NavList items={TOP_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} withDividers />
        <SectionLabel>MP Accountability</SectionLabel>
        <NavList items={DATA_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} withDividers />
      </div>

      <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <NavList items={BOTTOM_NAV_ITEMS} activeView={activeView} onNavigate={onNavigate} />
      </div>
    </>
  );
}

export default function Sidebar({ activeView, onNavigate }) {
  const [open, setOpen] = useState(false);

  function handleNav(key) {
    onNavigate(key);
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
          width: 278,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${COLORS.sidebarBg}, ${COLORS.sidebarBgDeep})`,
          minHeight: "100vh",
          maxHeight: "100vh",
          overflowY: "auto",
          alignSelf: "flex-start",
          padding: "28px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SidebarInner activeView={activeView} onNavigate={handleNav} />
      </div>
    </>
  );
}
