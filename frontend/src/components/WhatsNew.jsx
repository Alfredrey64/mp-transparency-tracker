/** @jsxImportSource react */
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconFeed } from "./icons";
import { PageLink } from "./SiteHeader";
import { UPDATES, dayText } from "../data/siteUpdates";

// What is new on the site, in plain words, with a line on how corrections are handled. Newest first.
const ISSUES = "https://github.com/Alfredrey64/mp-transparency-tracker/issues";

export default function WhatsNew({ onNavigate }) {
  const go = onNavigate ?? ((key) => { window.location.assign(`/${key}`); });
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconFeed} kicker="About this site" title="What's new" subtitle="New pages and changes to the site, newest first, in plain words." />
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
        {UPDATES.map((u) => (
          <li key={u.title + u.date} style={{ ...card, display: "grid", gap: 6 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 800, fontSize: 12.5, padding: "3px 10px", borderRadius: 999, background: u.kind === "New" ? "#1E4FB8" : "#E1E6F0", color: u.kind === "New" ? "#fff" : "#0A1424" }}>{u.kind}</span>
              <time dateTime={u.date} style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>{dayText(u.date)}</time>
            </div>
            <h2 style={{ ...cardTitle, fontSize: 20, margin: 0 }}>{u.title}</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0, maxWidth: 720 }}>{u.text}</p>
            <PageLink to={u.page} onNavigate={go} style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: COLORS.ink }}>{u.cta}</PageLink>
          </li>
        ))}
      </ol>
      <section aria-labelledby="h-wn-fix" style={{ ...card, marginTop: 24 }}>
        <h2 id="h-wn-fix" style={{ fontFamily: FONT_DISPLAY, fontSize: 21, margin: 0, color: COLORS.ink }}>If we get something wrong</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 720 }}>
          Every figure comes from an official source and is dated where it appears. If you think a number, a name or a sentence is wrong, please <a href={`${ISSUES}/new?title=${encodeURIComponent("Correction: ")}`} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 700 }}>tell us on GitHub<span className="sr-only"> (opens in a new tab)</span></a>. When we agree, we correct the page and add a line about it to this list, with the date.
        </p>
      </section>
    </div>
  );
}
