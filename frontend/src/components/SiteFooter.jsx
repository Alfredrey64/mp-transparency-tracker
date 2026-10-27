import LogoMark from "./LogoMark";
import { PageLink } from "./SiteHeader";
import LanguageSwitch from "./LanguageSwitch";
import { FOOTER_COLUMNS } from "../data/siteMenu";
import { useLang, useT } from "../lib/useLang";
import { problemLink, citeAddress } from "../lib/cite";

// The foot of every page: who this is, where to go next, and a plain statement of where the figures come from.

export default function SiteFooter({ onNavigate }) {
  const t = useT();
  const [lang] = useLang();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">
          <div className="footer-brandcol">
            <PageLink to="home" onNavigate={onNavigate} className="footer-brand" aria-label={t("Simple Politics, home")}>
              <LogoMark width={56} color="#FFFFFF" hole="var(--c-navy)" />
              <span>Simple Politics</span>
            </PageLink>
            <p className="footer-about">{t("An independent guide to UK politics. It explains who represents you, who pays them and what the official numbers say, in plain English and without spin.")}</p>
            <LanguageSwitch className="footer-lang" />
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} className="footer-col" aria-label={t(col.title)}>
              <h3>{t(col.title)}</h3>
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
          {lang === "cy" && <p lang="cy">{t("The Welsh version is a first draft that a fluent Welsh speaker has not yet checked, and most pages are not translated yet. If you spot a mistake, please tell us.")} <a href={problemLink("the Welsh translation", citeAddress(window.location))} target="_blank" rel="noreferrer">{t("Report a mistake")}<span className="sr-only"> {t("(opens GitHub in a new tab)")}</span></a></p>}
        </div>
      </div>
    </footer>
  );
}
