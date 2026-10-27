import { HUB_BY_PAGE, SECTIONS } from "../data/sidebarSections";
import { PageLink } from "./SiteHeader";
import "../hubtabs.css";

// On a page that is one of a group, a strip across the top with the group's name and a tab for each page in it. The group is one entry in the
// menus, so this is how you move between its pages.
export default function HubTabs({ view, onNavigate }) {
  const hub = HUB_BY_PAGE.get(view);
  if (!hub) return null;
  const section = SECTIONS.find((s) => s.items.some((i) => i.key === view));
  return (
    <nav className="hubtabs" aria-label={hub.label} style={{ "--hc": section?.accent ?? "#1E4FB8" }}>
      <span className="hubtabs-name">{hub.label}</span>
      <ul>
        {hub.pages.map(([key, label]) => (
          <li key={key}>
            <PageLink to={key} onNavigate={onNavigate} className="hubtabs-tab" aria-current={key === view ? "page" : undefined}>{label}</PageLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
