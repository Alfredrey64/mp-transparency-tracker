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

export default function TermsConditions() {
  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader title="Terms & Conditions" subtitle="Last updated 7 September 2026." maxWidth={760} />

      <div style={{ maxWidth: 760 }}>
        <Section title="What this site is">
          UK Parliament Tracker is an independent, non-commercial project that aggregates publicly available UK
          Parliament data — declared financial interests, voting records, bills, and All-Party Parliamentary Group
          information — into one place. It is not affiliated with, endorsed by, or operated by the UK Parliament,
          the Houses of Commons or Lords, any political party, or Companies House.
        </Section>

        <Section title="Accuracy and data sources">
          <p>
            Data is pulled automatically from official public APIs and registers and, in the case of donor industry
            tags, cross-referenced against Companies House records using automated name-matching. Automated matching
            can be wrong. Specifically:
          </p>
          <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Source registers are updated on their own schedule — this site may lag behind the live official record.</li>
            <li style={{ marginBottom: 8 }}>Donor "sector" tags reflect a company's registered industry classification, not a statement about that donor's or MP's views, intentions, or conduct.</li>
            <li style={{ marginBottom: 8 }}>Where a donor is not confidently identified, no sector is shown — that is not the same as confirming they have no industry ties.</li>
            <li>Always check the linked official source before relying on any figure for a decision.</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            This site is provided "as is," without warranty of any kind, express or implied, including accuracy,
            completeness, or fitness for a particular purpose.
          </p>
        </Section>

        <Section title="Not legal, financial, or professional advice">
          Nothing on this site constitutes legal, financial, journalistic, or professional advice. Aggregated
          correlations shown between donations and voting records are descriptive, not evidence of intent or
          wrongdoing — correlation is not causation.
        </Section>

        <Section title="Acceptable use">
          You may browse and reference this site for personal, educational, or journalistic purposes. You may not
          use it to harass, defame, or make unfounded accusations against any individual named on it. Automated
          scraping that materially burdens the underlying official APIs is discouraged — please use those sources
          directly for bulk data needs.
        </Section>

        <Section title="Limitation of liability">
          To the fullest extent permitted by law, this site's operator is not liable for any loss or damage arising
          from reliance on information presented here, including inaccuracies inherited from source data or
          introduced by automated processing.
        </Section>

        <Section title="Corrections">
          If you identify an inaccuracy — including a misapplied donor sector tag — it can be corrected at the data
          level and republished. This is a best-effort independent project, not a newsroom with a formal complaints
          process, but errors are taken seriously.
        </Section>

        <Section title="Changes to these terms">
          These terms may be updated as the site's features change. Continued use after an update means you accept
          the revised terms.
        </Section>
      </div>
    </div>
  );
}
