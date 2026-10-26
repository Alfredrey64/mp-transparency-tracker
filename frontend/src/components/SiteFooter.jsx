import LogoMark from "./LogoMark";
import { PageLink } from "./SiteHeader";

// The foot of every page: who this is, where to go next, and a plain statement of where the figures come from.
const COLUMNS = [
  {
    title: "Start here",
    links: [
      ["start", "Take the guided tour"],
      ["answers", "Ask a question"],
      ["howitworks", "How Parliament works"],
      ["glossary", "Jargon buster"],
      ["numbers", "Parliament in numbers"],
    ],
  },
  {
    title: "Your area",
    links: [
      ["myMP", "Find your MP"],
      ["constituency", "Your constituency"],
      ["councils", "Your council"],
      ["generalElection", "General elections"],
      ["howtovote", "How to vote"],
    ],
  },
  {
    title: "About",
    links: [
      ["methodology", "Where our data comes from"],
      ["settings", "Settings"],
      ["privacy", "Privacy"],
      ["terms", "Terms"],
      ["teacher", "Teacher mode"],
    ],
  },
];

export default function SiteFooter({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">
          <div className="footer-brandcol">
            <PageLink to="home" onNavigate={onNavigate} className="footer-brand" aria-label="Simple Politics, home">
              <LogoMark width={56} color="#FFFFFF" hole="var(--c-navy)" />
              <span>Simple Politics</span>
            </PageLink>
            <p className="footer-about">An independent guide to UK politics. It explains who represents you, who pays them and what the official numbers say, in plain English and without spin.</p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} className="footer-col" aria-label={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map(([key, label]) => (
                  <li key={key}><PageLink to={key} onNavigate={onNavigate}>{label}</PageLink></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <p>Independent and unofficial. Not affiliated with Parliament, the government or any political party. Every figure comes from an official source and is dated where it appears.</p>
        </div>
      </div>
    </footer>
  );
}
