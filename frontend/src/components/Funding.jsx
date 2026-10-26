import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconLedger } from "./icons";
import { PageLink } from "./SiteHeader";
import { Reveal } from "./Motion";

// Funding and independence: who pays for the site, and the rules that hold whatever the funding is. A site about who funds politicians should say plainly
// who funds it. The log at the foot is the one place any money is recorded, so a reader can see it change.

const ISSUES = "https://github.com/Alfredrey64/mp-transparency-tracker/issues";
export const FUNDING_REVIEWED = "26 October 2026";

function Section({ title, children }) {
  return (
    <Reveal as="section" style={{ marginBottom: 16, padding: "18px 22px 20px", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: "4px solid var(--page-accent, #2A9D8F)", borderRadius: 14, boxShadow: "var(--shadow-1)" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, margin: "0 0 8px" }}>{title}</h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.7 }}>{children}</div>
    </Reveal>
  );
}

const list = { margin: 0, paddingLeft: 20, display: "grid", gap: 8 };

export default function Funding({ onNavigate }) {
  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconLedger}
        accent="#2A9D8F"
        kicker="About this site"
        title="Funding and independence"
        subtitle="Who pays for this site, who does not, and the rules that keep it fair to every party."
      />
      <div style={{ maxWidth: 760 }}>
        <Section title="Who runs it">
          Simple Politics is an independent project, designed and built by Alfred Reynolds. It is not part of, and is not paid for by, any political party,
          government body, campaign group or company that lobbies Parliament.
        </Section>

        <Section title="Who pays for it today">
          At the moment the site is paid for by the person who runs it. It carries no advertising, no sponsorship and no paid content, and it does not sell or
          share anything about its visitors (see the <PageLink to="privacy" onNavigate={onNavigate} style={{ color: COLORS.ink, fontWeight: 700 }}>privacy policy</PageLink>).
        </Section>

        <Section title="Rules that stay the same, however it is paid for">
          This site is about who funds politics, so it should hold itself to the standard it reports on. If it ever takes money, these rules apply.
          <ul style={{ ...list, marginTop: 10 }}>
            <li>No party, donor, lobbyist or company can pay to change what a page says, to be left out, or to be put in.</li>
            <li>Anyone who pays is named on this page, with what they gave and what it was for.</li>
            <li>Anything paid for is labelled as paid for, where you can see it. It is never made to look like the site's own work.</li>
            <li>No sponsor appears next to a page about their own interests, including the MPs, donors and lobbying pages.</li>
            <li>People who give money do not see a page before it goes up, and cannot ask for a change.</li>
            <li>No visitor information is sold, and none is collected for advertisers.</li>
          </ul>
        </Section>

        <Section title="Where the facts come from">
          Every figure comes from an official or published source, such as Parliament, the Office for National Statistics, the Electoral Commission and
          Companies House, and the page says which. The way each one is gathered and what it leaves out is on the
          {" "}<PageLink to="methodology" onNavigate={onNavigate} style={{ color: COLORS.ink, fontWeight: 700 }}>data and methodology page</PageLink>.
          Parties are described by what they say themselves, in their own manifestos, in the same format for each one.
        </Section>

        <Section title="Spotted a mistake?">
          Please tell us. Mistakes are fixed on the page itself as soon as they are confirmed. You can report one on{" "}
          <a href={ISSUES} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 700 }}>the project's public issue list</a>, which anyone can read.
        </Section>

        <Section title="Funding log">
          <div role="table" aria-label="Money the site has received" style={{ display: "grid", gap: 0 }}>
            <div role="row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 1.4fr)", gap: 12, padding: "8px 0", borderBottom: `1px solid ${COLORS.hairline}`, fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
              <span role="columnheader">From</span><span role="columnheader">Amount</span><span role="columnheader">What it was for</span>
            </div>
            <div role="row" style={{ padding: "12px 0 2px", fontSize: 14.5 }}>
              <span role="cell">Nothing yet.</span>
            </div>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13 }}>Last reviewed on {FUNDING_REVIEWED}.</p>
        </Section>
      </div>
    </div>
  );
}
