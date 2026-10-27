import { SECTIONS, collapseItems, hubLead } from "../data/sidebarSections";
import { PageLink } from "./SiteHeader";
import { useT } from "../lib/useLang";
import "../sectionnav.css";

// Under every page that belongs to a menu group: where to go next. The page before and after in the group, then the pages nearest to it, each in its
// group's colour, so moving about a section never needs the menu. Pages that are not in a group (the tour, the legal pages) show nothing.
const SHOWN = 8;

export default function SectionNav({ view, onNavigate }) {
  const t = useT();
  const found = (() => {
    for (const section of SECTIONS) {
      const items = collapseItems(section.items.filter((i) => i.key !== "start" && !i.standalone));
      const at = items.findIndex((i) => i.key === hubLead(view));
      if (at >= 0) return { section, items, at };
    }
    return null;
  })();
  if (!found || found.items.length < 2) return null;
  const { section, items, at } = found;
  const prev = items[(at - 1 + items.length) % items.length];
  const next = items[(at + 1) % items.length];
  // The pages nearest this one, alternating after and before it.
  const near = [];
  for (let d = 1; near.length < Math.min(SHOWN, items.length - 1); d++) {
    const a = items[(at + d) % items.length];
    if (!near.includes(a) && a.key !== items[at].key) near.push(a);
    const b = items[(at - d + items.length * 4) % items.length];
    if (!near.includes(b) && b.key !== items[at].key && near.length < Math.min(SHOWN, items.length - 1)) near.push(b);
    if (d > items.length) break;
  }
  const card = (i, extra) => {
    const Icon = i.icon;
    return (
      <PageLink key={i.key} to={i.key} onNavigate={onNavigate} className="sn-card" style={{ "--sc": section.accent }} {...extra}>
        <span className="sn-icon" aria-hidden="true">{Icon && <Icon size={20} />}</span>
        <span className="sn-text"><b>{t(i.label)}</b>{i.hint && <small>{t(i.hint)}</small>}</span>
      </PageLink>
    );
  };
  return (
    <nav className="sn" aria-label={t("More in {name}", { name: t(section.label) })} style={{ "--sc": section.accent }}>
      <div className="sn-head">
        <span className="sn-dot" aria-hidden="true" />
        <h2>{t("More in {name}", { name: t(section.label) })}</h2>
        {section.blurb && <p>{t(section.blurb)}</p>}
      </div>
      {/* With only one other page, "previous" and "next" would be the same link twice, so the one page is shown below instead. */}
      {items.length > 2 && <div className="sn-pn">
        <PageLink to={prev.key} onNavigate={onNavigate} className="sn-step" rel="prev"><small>{t("Previous")}</small><b>{t(prev.label)}</b></PageLink>
        <PageLink to={next.key} onNavigate={onNavigate} className="sn-step sn-next" rel="next"><small>{t("Next")}</small><b>{t(next.label)}</b></PageLink>
      </div>}
      <div className="sn-grid">{near.map((i) => card(i))}</div>
    </nav>
  );
}
