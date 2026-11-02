import { COLORS, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconAbout } from "./icons";
import { PageLink } from "./SiteHeader";
import Section from "./InfoSection";
import { CONTACT_EMAIL, REPO_URL } from "../lib/contact";

// About the site: what it is, who is behind it, how it is paid for and where to take a question. The same facts as the funding page, said once and briefly, so a
// first-time visitor can see who they are dealing with.

const link = { color: COLORS.ink, fontWeight: 700 };

export default function About({ onNavigate }) {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconAbout}
        accent="#2F6DB5"
        kicker="About this site"
        title="About Domesday Live"
        subtitle="What this site is, who runs it and how it is paid for."
      />
      <div style={{ maxWidth: 760 }}>
        <Section title="What it is">
          Domesday Live is an independent guide to UK politics. It shows who represents you, who pays them, how they vote and what the official numbers say, in
          plain English and without spin. You do not need an account to use it.
        </Section>

        <Section title="Who runs it">
          Domesday Live is designed, built and run by Alfred Reynolds. It is an independent project. It is not part of, and is not paid for by, any political
          party, government body, campaign group or company that lobbies Parliament.
        </Section>

        <Section title="How it is paid for">
          Alfred Reynolds pays for the site personally. There is no advertising, no sponsorship, no paid content and no outside money. If that ever changes, it
          will be written on the <PageLink to="funding" onNavigate={onNavigate} style={link}>funding and independence page</PageLink> first, with who gave what
          and the rules that would apply.
        </Section>

        <Section title="Where the figures come from">
          Every figure comes from an official or published source, such as Parliament, the Office for National Statistics, the Electoral Commission and
          Companies House, and the page says which. How each one is gathered, and what it leaves out, is on the{" "}
          <PageLink to="methodology" onNavigate={onNavigate} style={link}>data and methodology page</PageLink>. The site's code is public on{" "}
          <a href={REPO_URL} target="_blank" rel="noreferrer" style={link}>GitHub<span className="sr-only"> (opens in a new tab)</span></a>, so anyone can see how the
          figures are put together.
        </Section>

        <Section title="Get in touch">
          Found a mistake, have a question, or want to ask about something on the site? Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>. There is more on{" "}
          <PageLink to="corrections" onNavigate={onNavigate} style={link}>corrections and contact</PageLink>, including what to put in a report and what
          happens next.
        </Section>
      </div>
    </div>
  );
}
