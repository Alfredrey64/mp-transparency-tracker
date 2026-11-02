import { COLORS, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconMail } from "./icons";
import { PageLink } from "./SiteHeader";
import Section from "./InfoSection";
import { CONTACT_EMAIL, REPO_URL, mailLink } from "../lib/contact";

// Corrections and contact: the one address, how to report a mistake, what happens to a report, and the public log of changes made because of one. The log at
// the foot is the one place corrections are recorded, so a reader can see it change.

export const CORRECTIONS_REVIEWED = "2 November 2026";

const link = { color: COLORS.ink, fontWeight: 700 };
const list = { margin: "10px 0 0", paddingLeft: 20, display: "grid", gap: 8 };

export default function Corrections({ onNavigate }) {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconMail}
        accent="#B4532A"
        kicker="About this site"
        title="Corrections and contact"
        subtitle="How to tell us about a mistake, and how to reach the person who runs the site."
      />
      <div style={{ maxWidth: 760 }}>
        <Section title="Contact">
          Write to <a href={mailLink("Domesday Live")} style={link}>{CONTACT_EMAIL}</a> for a correction, a question, a press enquiry or anything else. This is a
          one-person project, so replies are not instant. Please do not send passwords or sensitive personal details.
        </Section>

        <Section title="Report a mistake">
          If a number, a name or a sentence looks wrong, please say so. It helps to include:
          <ul style={list}>
            <li>The address of the page, or its name.</li>
            <li>What looks wrong, and what you think it should say.</li>
            <li>A link to the official source that shows the right answer, if you have one.</li>
          </ul>
          <p style={{ margin: "12px 0 0" }}>
            You can <a href={mailLink("Correction: ", "Page:\n\nWhat looks wrong:\n\nWhat it should say, and where to check:\n")} style={link}>send a correction by email</a>, or open a report on{" "}
            <a href={`${REPO_URL}/issues/new?title=${encodeURIComponent("Correction: ")}`} target="_blank" rel="noreferrer" style={link}>the project's public issue list<span className="sr-only"> (opens in a new tab)</span></a>.
            Anyone can read the issue list, so leave out personal details there.
          </p>
        </Section>

        <Section title="What happens next">
          Each report is checked against the official source. If it is confirmed, the page is fixed as soon as possible. If the mistake changed a figure, a name or a
          claim that someone could have relied on, it is also added to the log below, with the date and what changed. If the official source itself is wrong,
          this site shows what the source says, and the fix has to come from the body that publishes it. Its name is on the page.
        </Section>

        <Section title="If you are named on this site">
          MPs and other public figures appear because of their public role, using official registers. If something about you is wrong, or you want to ask how your
          information is used, write to the same address. How the site handles information is on the{" "}
          <PageLink to="privacy" onNavigate={onNavigate} style={link}>privacy page</PageLink>.
        </Section>

        <Section title="Corrections log">
          <div role="table" aria-label="Corrections made to the site" style={{ display: "grid", gap: 0 }}>
            <div role="row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 1.6fr)", gap: 12, padding: "8px 0", borderBottom: `1px solid ${COLORS.hairline}`, fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
              <span role="columnheader">Date</span><span role="columnheader">Page</span><span role="columnheader">What was wrong, and what changed</span>
            </div>
            <div role="row" style={{ padding: "12px 0 2px", fontSize: 14.5 }}>
              <span role="cell">None yet.</span>
            </div>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13 }}>Last reviewed on {CORRECTIONS_REVIEWED}.</p>
        </Section>
      </div>
    </div>
  );
}
