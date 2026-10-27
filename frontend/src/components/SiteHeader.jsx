import { useEffect, useRef, useState } from "react";
import { preloadView } from "../pageLoaders";
import { useWatchlistChanges } from "../lib/useWatchlistChanges";
import { useDialog } from "../lib/useDialog";
import { solid } from "../theme";
import LogoMark from "./LogoMark";
import GlobalSearch from "./GlobalSearch";
import { IconSearch, IconStar, IconMethodology, IconSettings, IconShield, IconBook, IconHistory, IconClassroom } from "./icons";
import { MENU, menuKeyFor, pathFor } from "../data/siteMenu";
import { hubLead } from "../data/sidebarSections";

// The site's header: the name, five menus that open into a panel of pages, search, the watchlist and the one button most people want (finding their MP).
// On a phone or tablet the menus become a menu button that opens a full-height list. Every page entry is a real link, so it opens in a new tab,
// shows its address on hover and works with a screen reader's list of links.

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);

const ITEM_BY_KEY = new Map(MENU.flatMap((m) => m.groups.flatMap((g) => g.items.map((i) => [i.key, { ...i, accent: g.accent }]))));
const RECENT_KEY = "sp.recentPages";
const readRecent = () => {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((k) => ITEM_BY_KEY.has(k)) : []; } catch { return []; }
};
const writeRecent = (view) => {
  if (!ITEM_BY_KEY.has(view)) return;
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([view, ...readRecent().filter((k) => k !== view)].slice(0, 6))); } catch { /* storage blocked: the list just does not remember */ }
};

const FOOT_TILES = [
  ["watchlist", "My watchlist", IconStar],
  ["methodology", "Where our data comes from", IconMethodology],
  ["settings", "Settings", IconSettings],
  ["privacy", "Privacy", IconShield],
  ["terms", "Terms", IconBook],
  ["teacher", "Teacher mode", IconClassroom],
];

// A link that goes to a page without reloading, unless it is opened in a new tab or window.
export function PageLink({ to, onNavigate, onAfter, children, ...rest }) {
  return (
    <a
      href={pathFor(to)}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onNavigate(to);
        onAfter?.();
      }}
      onMouseEnter={() => preloadView(to)}
      onFocus={() => preloadView(to)}
      onTouchStart={() => preloadView(to)}
      {...rest}
    >
      {children}
    </a>
  );
}

function MegaPanel({ menu, activeView, onNavigate, onClose }) {
  return (
    <div className="site-mega" id={`mega-${menu.key}`} role="region" aria-label={`${menu.label} pages`}>
      <div className="site-mega-inner">
        {menu.groups.map((group) => {
          const Wide = group.items.length > 9;
          const GroupIcon = group.items[0]?.icon;
          return (
            <section key={group.key} className={Wide ? "mega-wide" : undefined} style={{ "--g": group.accent }}>
              <h2 className="mega-title">
                {GroupIcon && <i aria-hidden="true" style={{ background: solid(group.accent) }}><GroupIcon size={17} /></i>}
                {group.label}
              </h2>
              <p className="mega-blurb">{group.blurb}</p>
              <ul className="mega-list">
                {group.items.map((item, n) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.key} style={{ "--n": n }}>
                      <PageLink to={item.key} onNavigate={onNavigate} onAfter={onClose} className="mega-link" aria-current={activeView === item.key ? "page" : undefined}>
                        <span className="ico" aria-hidden="true"><Icon size={16} /></span>
                        <span><b>{item.label}</b>{item.hint && <small>{item.hint}</small>}</span>
                      </PageLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SearchLayer({ onClose, onNavigate, onSelectPolitician }) {
  const panelRef = useRef(null);
  useDialog({ open: true, onClose, panelRef });
  useEffect(() => {
    const input = panelRef.current?.querySelector("input");
    input?.focus();
  }, []);
  return (
    <div className="search-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} className="search-box" role="dialog" aria-modal="true" aria-label="Search the site" tabIndex={-1}>
        <h2>Search</h2>
        <GlobalSearch
          onSelectPolitician={(p) => { onSelectPolitician?.(p); onClose(); }}
          onNavigate={(key) => { onNavigate(key); onClose(); }}
        />
        <p className="search-hint">Find an MP, a constituency, a page, an election or a word you want explained.</p>
      </div>
    </div>
  );
}

function Drawer({ activeView, onNavigate, onClose, onSearch }) {
  const panelRef = useRef(null);
  useDialog({ open: true, onClose, panelRef });
  const groups = MENU.flatMap((m) => m.groups);
  const [openKey, setOpenKey] = useState(() => groups.find((g) => g.items.some((i) => i.key === activeView))?.key ?? null);
  const [recent] = useState(() => readRecent().filter((k) => k !== activeView).slice(0, 4));

  // Drag the menu to the right to put it away: it follows the finger and either closes or springs back.
  const drag = useRef(null);
  const onDown = (e) => { if (e.pointerType === "touch") drag.current = { x: e.clientX, y: e.clientY, dx: 0, on: false }; };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on && dx > 14 && dx > Math.abs(dy) * 1.6) d.on = true;
    if (!d.on) return;
    d.dx = Math.max(0, dx);
    const el = panelRef.current;
    if (el) { el.style.animation = "none"; el.style.transition = "none"; el.style.transform = `translateX(${d.dx}px)`; }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    const el = panelRef.current;
    if (!d?.on || !el) return;
    el.style.transition = "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)";
    if (d.dx > 90) { el.style.transform = "translateX(105%)"; window.setTimeout(onClose, 160); } else el.style.transform = "translateX(0)";
  };

  return (
    <>
      <div className="site-drawer-backdrop" onClick={onClose} />
      <div ref={panelRef} className="site-drawer" role="dialog" aria-modal="true" aria-label="Site menu" tabIndex={-1} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="drawer-head">
          <div className="drawer-top">
            <PageLink to="home" onNavigate={onNavigate} onAfter={onClose} className="site-brand" aria-label="Simple Politics, home">
              <LogoMark width={54} color="#FFFFFF" hole="var(--c-navy)" />
              <span>Simple Politics</span>
            </PageLink>
            <button type="button" className="site-icon-btn drawer-close" aria-label="Close menu" onClick={onClose}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <button type="button" className="drawer-search" onClick={onSearch}>
            <IconSearch size={18} />
            <span>Search MPs, pages and words</span>
          </button>
          <div className="drawer-quick">
            <PageLink to="myMP" onNavigate={onNavigate} onAfter={onClose} className="btn btn-on-navy">Find your MP</PageLink>
            <PageLink to="start" onNavigate={onNavigate} onAfter={onClose} className="btn btn-outline-on-navy">Take the tour</PageLink>
          </div>
        </div>
        {recent.length > 0 && (
          <section className="drawer-recent" aria-label="Pages you looked at recently">
            <h2><IconHistory size={15} />Pick up where you left off</h2>
            <ul>
              {recent.map((k) => {
                const item = ITEM_BY_KEY.get(k);
                const Icon = item.icon;
                return (
                  <li key={k} style={{ "--g": item.accent }}>
                    <PageLink to={k} onNavigate={onNavigate} onAfter={onClose}>
                      <span className="ico" aria-hidden="true"><Icon size={15} /></span>
                      {item.label}
                    </PageLink>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <nav aria-label="Pages" className="drawer-groups">
          {groups.map((group, gi) => {
            const open = openKey === group.key;
            const GroupIcon = group.items[0]?.icon;
            const items = group.items.filter((i) => i.key !== "start");
            return (
              <div key={group.key} className="drawer-group" data-open={open} style={{ "--g": group.accent, "--gi": gi }}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`dg-${group.key}`}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    setOpenKey(open ? null : group.key);
                    if (!open) window.setTimeout(() => btn.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
                  }}
                >
                  <span className="dg-tile" style={{ background: solid(group.accent) }} aria-hidden="true">{GroupIcon && <GroupIcon size={20} />}</span>
                  <span className="dg-text">{group.label}<small>{group.blurb}</small></span>
                  <span className="dg-count" aria-hidden="true">{items.length}</span>
                  <Chevron />
                </button>
                <div className="dg-body" id={`dg-${group.key}`} inert={!open}>
                  <ul className="drawer-list">
                    {items.map((item, n) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.key} style={{ "--n": n }}>
                          <PageLink to={item.key} onNavigate={onNavigate} onAfter={onClose} aria-current={activeView === item.key ? "page" : undefined}>
                            <span className="ico" aria-hidden="true"><Icon size={16} /></span>
                            <span><b>{item.label}</b>{item.hint && <small>{item.hint}</small>}</span>
                          </PageLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>
        <nav className="drawer-foot" aria-label="About the site">
          {FOOT_TILES.map(([key, label, Icon]) => (
            <PageLink key={key} to={key} onNavigate={onNavigate} onAfter={onClose} aria-current={activeView === key ? "page" : undefined}>
              <span className="ico" aria-hidden="true"><Icon size={17} /></span>
              <span>{label}</span>
            </PageLink>
          ))}
        </nav>
      </div>
    </>
  );
}

export default function SiteHeader({ activeView: viewHere, onNavigate, onSelectPolitician }) {
  // A page that is one of a group is shown in the menus as the group's entry.
  const activeView = hubLead(viewHere);
  const [openKey, setOpenKey] = useState(null);
  const [searching, setSearching] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [stuck, setStuck] = useState(false);
  const headerRef = useRef(null);
  const closeTimer = useRef(null);
  const searchButton = useRef(null);
  const menuButton = useRef(null);
  const watch = useWatchlistChanges();
  const here = menuKeyFor(activeView);
  const navRef = useRef(null);

  // Remember the pages visited, for "Pick up where you left off" in the phone menu.
  useEffect(() => { writeRecent(activeView); }, [activeView]);

  // The highlight under the menu headings glides to the heading under the pointer or focus, and rests on the one holding the current page.
  const movePill = (btn) => {
    const nav = navRef.current;
    if (!nav) return;
    if (!btn) { nav.style.setProperty("--pw", "0px"); return; }
    nav.style.setProperty("--px", `${btn.offsetLeft}px`);
    nav.style.setProperty("--pw", `${btn.offsetWidth}px`);
  };
  const restPill = () => movePill(navRef.current?.querySelector('[data-active="true"]'));
  useEffect(() => { movePill(navRef.current?.querySelector('[data-active="true"]')); }, [here]);

  // A soft shadow under the header once the page has scrolled beneath it.
  useEffect(() => {
    const onScroll = () => {
      setStuck(window.scrollY > 4);
      // How far down the page you are, drawn along the foot of the header without re-rendering anything.
      const room = document.documentElement.scrollHeight - window.innerHeight;
      headerRef.current?.style.setProperty("--sp", room > 200 ? String(Math.min(1, window.scrollY / room)) : "0");
      // The seating-plan mark in a page's band drifts a little slower than the page.
      if (window.scrollY < 700) document.querySelector(".page-hero")?.style.setProperty("--sy", String(window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" or Ctrl/Cmd+K opens search from anywhere (unless you are typing in a box).
  useEffect(() => {
    function onKey(e) {
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      const wants = (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k");
      if (!wants) return;
      e.preventDefault();
      setOpenKey(null);
      setSearching(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Escape closes an open menu panel and puts focus back on its heading; clicking outside closes it too.
  useEffect(() => {
    if (!openKey) return undefined;
    function onKey(e) {
      if (e.key !== "Escape") return;
      setOpenKey(null);
      headerRef.current?.querySelector(`[data-menu="${openKey}"]`)?.focus();
    }
    function onDown(e) {
      if (!headerRef.current?.contains(e.target)) setOpenKey(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [openKey]);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const closeSoon = () => { cancelClose(); closeTimer.current = window.setTimeout(() => setOpenKey(null), 180); };
  useEffect(() => cancelClose, []);

  const open = MENU.find((m) => m.key === openKey);

  return (
    <>
      <header
        ref={headerRef}
        className="site-header"
        data-stuck={stuck}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") closeSoon(); }}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") cancelClose(); }}
        onBlur={(e) => { if (!headerRef.current?.contains(e.relatedTarget)) setOpenKey(null); }}
      >
        <div className="site-bar">
          <PageLink to="home" onNavigate={onNavigate} className="site-brand" aria-label="Simple Politics, home">
            <LogoMark width={54} color="var(--c-brand)" hole="var(--c-paper-card)" />
            <span>Simple Politics</span>
          </PageLink>

          <nav ref={navRef} className="site-nav" aria-label="Main" onPointerLeave={restPill}>
            <span className="nav-pill" aria-hidden="true" />
            {MENU.map((m) => (
              <button
                key={m.key}
                type="button"
                className="site-nav-btn"
                data-menu={m.key}
                data-active={here === m.key}
                aria-expanded={openKey === m.key}
                aria-controls={`mega-${m.key}`}
                onClick={() => setOpenKey(openKey === m.key ? null : m.key)}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") { cancelClose(); setOpenKey(m.key); movePill(e.currentTarget); } }}
                onFocus={(e) => movePill(e.currentTarget)}
              >
                {m.label}
                <Chevron />
              </button>
            ))}
          </nav>

          <div className="site-actions">
            <button ref={searchButton} type="button" className="site-search-btn" aria-label="Search the site" onClick={() => { setOpenKey(null); setSearching(true); }}>
              <IconSearch size={16} />
              <span>Search</span>
              <kbd aria-hidden="true">/</kbd>
            </button>
            <PageLink to="watchlist" onNavigate={onNavigate} className="site-icon-btn site-watch" aria-label={watch?.changes > 0 ? `My watchlist, ${watch.changes} new` : "My watchlist"}>
              <IconStar size={20} />
              {watch?.changes > 0 && <span className="site-badge" aria-hidden="true">{watch.changes > 99 ? "99+" : watch.changes}</span>}
            </PageLink>
            <PageLink to="myMP" onNavigate={onNavigate} className="btn btn-primary site-cta">Find your MP</PageLink>
            <button ref={menuButton} type="button" className="site-icon-btn site-burger" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
            </button>
          </div>
        </div>
        <div className="site-progress" aria-hidden="true" />
        {open && (
          <div onPointerEnter={(e) => { if (e.pointerType === "mouse") cancelClose(); }}>
            <MegaPanel menu={open} activeView={activeView} onNavigate={onNavigate} onClose={() => setOpenKey(null)} />
          </div>
        )}
      </header>
      <div className="site-scrim" data-on={Boolean(open)} aria-hidden="true" onClick={() => setOpenKey(null)} />

      {searching && (
        <SearchLayer
          onClose={() => { setSearching(false); searchButton.current?.focus(); }}
          onNavigate={onNavigate}
          onSelectPolitician={onSelectPolitician}
        />
      )}
      {drawer && <Drawer activeView={activeView} onNavigate={onNavigate} onClose={() => { setDrawer(false); menuButton.current?.focus(); }} onSearch={() => { setDrawer(false); setSearching(true); }} />}
    </>
  );
}
