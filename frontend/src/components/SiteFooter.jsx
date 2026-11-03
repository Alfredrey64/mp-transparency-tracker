import LogoMark from "./LogoMark";
import { PageLink } from "./SiteHeader";
import { FOOTER_COLUMNS } from "../data/siteMenu";
import { useT } from "../lib/useLang";

// The foot of every page: who this is, where to go next, and a plain statement of where the figures come from.

export default function SiteFooter({ onNavigate }) {
  const t = useT();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">
          <div className="footer-brandcol">
            <PageLink to="home" onNavigate={onNavigate} className="footer-brand">
              <LogoMark width={56} color="#FFFFFF" hole="var(--c-navy)" />
              <span>Domesday Live</span><span className="sr-only">, home</span>
            </PageLink>
            <p className="footer-about">{t("An independent guide to UK politics. It explains who represents you, who pays them and what the official numbers say, in plain English and without spin.")}</p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} className="footer-col" aria-label={t(col.title)}>
              <h2>{t(col.title)}</h2>
              <ul>
                {col.links.map(([key, label]) => (
                  <li key={key}><PageLink to={key} onNavigate={onNavigate}>{t(label)}</PageLink></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <p>{t("Independent and unofficial. Not affiliated with Parliament, the government or any political party. Every figure comes from an official source and is dated where it appears.")}</p>
        </div>
      </div>
    </footer>
  );
}
