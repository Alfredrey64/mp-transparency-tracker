import { useLayoutEffect, useRef } from "react";
import { HUB_BY_PAGE, SECTIONS } from "../data/sidebarSections";
import { PageLink } from "./SiteHeader";
import { useT } from "../lib/useLang";
import "../hubtabs.css";

// On a page that is one of a group, a strip across the top with the group's name and a tab for each page in it. The group is one entry in the
// menus, so this is how you move between its pages.
export default function HubTabs({ view, onNavigate }) {
  const t = useT();
  const hub = HUB_BY_PAGE.get(view);
  const list = useRef(null);
  // On a phone the row scrolls sideways, so open it with this page's own tab in view. Only the row moves, never the page.
  useLayoutEffect(() => {
    const ul = list.current;
    const here = ul?.querySelector('[aria-current="page"]');
    if (!ul || !here || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollLeft = Math.max(0, here.offsetLeft - (ul.clientWidth - here.offsetWidth) / 2);
  }, [view]);
  if (!hub) return null;
  const section = SECTIONS.find((s) => s.items.some((i) => i.key === view));
  return (
    <nav className="hubtabs" aria-label={t(hub.label)} style={{ "--hc": section?.accent ?? "#1E4FB8" }}>
      <span className="hubtabs-name">{t(hub.label)}</span>
      <ul ref={list}>
        {hub.pages.map(([key, label]) => (
          <li key={key}>
            <PageLink to={key} onNavigate={onNavigate} className="hubtabs-tab" aria-current={key === view ? "page" : undefined}>{t(label)}</PageLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
