import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default function PrivacyPolicy({ onNavigate }) {
  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader title="Privacy Policy" subtitle="Last updated 7 September 2026." maxWidth={760} />

      <div style={{ maxWidth: 760 }}>
        <Section title="The short version">
          This site does not have user accounts, does not ask you to log in, and does not collect names, emails, or
          payment details from visitors. It's a read-only tool for browsing public UK Parliament data. The "personal
          data" you'll see on this site is about Members of Parliament — public figures acting in their public role,
          published under the UK Parliament's own official registers.
        </Section>

        <Section title="What we don't do">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>No analytics, advertising, or tracking scripts.</li>
            <li style={{ marginBottom: 8 }}>No cookies used for tracking or advertising.</li>
            <li style={{ marginBottom: 8 }}>No account creation, sign-in, or password storage.</li>
            <li>No sale or sharing of visitor data — there isn't any to sell.</li>
          </ul>
        </Section>

        <Section title="What is stored, and where">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: COLORS.ink }}>Your device only:</strong> a single preference (light or dark
              display mode) is saved in your browser's local storage. It never leaves your device and isn't visible to us.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: COLORS.ink }}>Standard web infrastructure:</strong> like any website, the
              hosting provider and font provider (Google Fonts) may log basic technical request data (such as IP
              address) as part of normal web delivery — this site doesn't request or process that data itself.
            </li>
          </ul>
        </Section>

        <Section title="Where the MP data comes from">
          All MP, financial interest, voting, and bill data is pulled from official public sources: the UK
          Parliament Members API, the Register of Members' Financial Interests, and the Commons Votes API. Donor
          industry tags are additionally cross-referenced against public UK Companies House records. Nothing here is
          submitted by site visitors.
        </Section>

        <Section title="Third-party links">
          This site links out to official sources (parliament.uk, Companies House, news outlets, and similar) for
          verification. Once you follow a link, that site's own privacy policy applies — we have no control over
          external sites.
        </Section>

        <Section title="Changes to this policy">
          If this site's data practices change (for example, if analytics or a comment feature is ever added), this
          page will be updated and the "last updated" date above will change accordingly.
        </Section>

        <Section title="Questions or corrections">
          If you believe information about you (or anyone) is displayed inaccurately, see the{" "}
          <button
            onClick={() => onNavigate("terms")}
            style={{ background: "none", border: "none", padding: 0, font: "inherit", color: COLORS.brass, fontWeight: 600, cursor: "pointer" }}
          >
            Terms & Conditions
          </button>{" "}
          page for how source data and corrections are handled.
        </Section>
      </div>
    </div>
  );
}
