import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconMethodology } from "./icons";

const REPO_URL = "https://github.com/Alfredrey64/mp-transparency-tracker";

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginBottom: 10 }}>{title}</h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function SourceRow({ name, use, url, auth }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: `1px solid ${COLORS.hairline}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: COLORS.ink }}>
          {name} ↗
        </a>
        {auth && (
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: COLORS.inkSoft, background: COLORS.paper, padding: "2px 9px", borderRadius: 999 }}>
            {auth}
          </span>
        )}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.55 }}>{use}</div>
    </div>
  );
}

function CaveatItem({ children }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
      <span style={{ marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: "#C1622E", flexShrink: 0 }} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{children}</span>
    </li>
  );
}

export default function Methodology({ onNavigate }) {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconMethodology}
        kicker="Public Record · Data & Methodology"
        title="Where this data comes from, and its limits"
        subtitle="Every figure on this site traces back to an official or independent public source. This page is the one place that lays out exactly which sources, how they're combined, how often they update, and — just as importantly — where the automated matching can get things wrong."
      />

      <div style={{ marginTop: 28 }}>
        <Section title="What this site is">
          <p style={{ marginTop: 0 }}>
            UK Parliament Tracker is an independent, unofficial project. It is not affiliated with, endorsed by, or
            connected to the UK Parliament, the Houses of Commons or Lords, HM Government, Companies House, or any
            political party. It doesn't editorialise, rank MPs, or recommend how to vote — it pulls together public
            records that already exist and presents them in one place.
          </p>
          <p style={{ marginBottom: 0 }}>
            No accounts, no tracking, no analytics. The only thing stored in your browser is a light/dark mode
            preference — see the{" "}
            {onNavigate ? (
              <button
                onClick={() => onNavigate("privacy")}
                style={{ color: COLORS.ink, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
              >
                Privacy Policy
              </button>
            ) : (
              "Privacy Policy"
            )}{" "}
            for the full detail.
          </p>
        </Section>

        <Section title="Primary data sources">
          <div>
            <SourceRow
              name="UK Parliament Members API"
              url="https://members-api.parliament.uk/"
              auth="No key required"
              use="Current MPs, party, constituency, photo, cabinet role, and biography — the base record every other page joins against."
            />
            <SourceRow
              name="UK Parliament Interests API"
              url="https://interests-api.parliament.uk/"
              auth="No key required"
              use="The Register of Members' Financial Interests — every declared donation, gift, hospitality, shareholding, and outside job, per MP."
            />
            <SourceRow
              name="UK Parliament Commons Votes API"
              url="https://commonsvotes-api.parliament.uk/"
              auth="No key required"
              use="Commons divisions (recorded votes) — how each MP voted, and the official Aye/No totals for each division."
            />
            <SourceRow
              name="UK Parliament Bills API"
              url="https://bills-api.parliament.uk/"
              auth="No key required"
              use="Every bill currently going through Parliament — summary, sponsor, stage, and department."
            />
            <SourceRow
              name="UK Companies House API"
              url="https://developer.company-information.service.gov.uk/"
              auth="Free API key"
              use="Matches declared donor names to registered UK companies, to tag donations by industry sector and link to the official company record."
            />
            <SourceRow
              name="Full Fact — Government Tracker"
              url="https://fullfact.org/government-tracker/"
              auth="Manually reviewed"
              use="An independent, non-partisan fact-checking charity's verdicts on whether the current government has delivered its manifesto pledges — used as-is on the Government Tracker page, never re-judged by us."
            />
            <SourceRow
              name="Google News (public RSS)"
              url="https://news.google.com/"
              auth="No key required"
              use="A daily per-MP headline search, for the 'In the News' section on each MP's page."
            />
          </div>
        </Section>

        <Section title="How often it updates">
          <p style={{ marginTop: 0, marginBottom: 0 }}>
            A scheduled job runs once a day, pulling fresh data from every API above and writing it straight to the
            live database — there's no manual step and no deploy needed for MPs, interests, votes, bills, donor-sector
            tags, or news to refresh. The exceptions are content we've written and curated by hand, which only change
            when we deliberately update them: the Party Policies manifesto summaries, and the Government Tracker's
            selected pledges (though their status still reflects Full Fact's current published verdict).
          </p>
        </Section>

        <Section title="Where the automated matching can go wrong">
          <p style={{ marginTop: 0 }}>
            Two features on this site work by matching records from separate data sources that don't share a common
            ID — that matching is genuinely useful, but it's inference, not certainty. We'd rather tell you exactly
            where the soft spots are than let the confident presentation imply more precision than the data supports.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            <CaveatItem>
              <strong>Donor industry tagging (Donors & Lobbying, Companies House):</strong> a declared donor's name is
              matched against Companies House by name similarity. Names with a personal title (Mr, Dr, Lord…) are
              excluded outright as individuals; everything else only counts as a match if the company is currently
              active and the name overlaps closely enough — loose matches are rejected rather than guessed at, and a
              second automated pass re-checks every match for anything that still looks like a person. Only the
              largest donors by value have been processed so far, and a company's registered industry code can be a
              poor proxy for what a specific donation was actually for.
            </CaveatItem>
            <CaveatItem>
              <strong>Bill-to-vote matching (Voting Records & Bills):</strong> bills and Commons divisions come from
              two separate APIs with no shared key, so we match a division to a bill by checking whether the
              division's title starts with the bill's short title. This is usually reliable, but it can miss a
              genuine vote on a bill, or occasionally attach an unrelated division with a similar name.
            </CaveatItem>
            <CaveatItem>
              <strong>"Did not vote":</strong> when we show an MP as not voting in a division, that's every current MP
              minus everyone recorded as voting Aye or No. Official Commons records don't distinguish between being
              absent, paired, or deliberately abstaining — so neither can we.
            </CaveatItem>
            <CaveatItem>
              <strong>"In the News":</strong> a daily headline search for an MP's name, filtered to require their
              surname appear in the headline. It's a skim, not a verified fact-check — a same-named person, or a
              passing mention, can occasionally slip through.
            </CaveatItem>
            <CaveatItem>
              <strong>Party Policies & Government Tracker:</strong> the manifesto summaries are written independently
              in our own words, not copied from the source documents (which are copyrighted) — always follow the
              linked source for the exact original text. Pledge statuses on the Government Tracker are Full Fact's
              own published judgement, not ours, and can change as circumstances develop.
            </CaveatItem>
          </ul>
        </Section>

        <Section title="Something look wrong?">
          <p style={{ marginTop: 0, marginBottom: 0 }}>
            This is a solo, open-source project, and the matching logic above is exactly that — logic, not manual
            review of every row. If you spot something that looks wrong, the most useful thing you can do is{" "}
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              open an issue on GitHub ↗
            </a>{" "}
            with the MP, bill, or donor name in question — every report helps tighten the safeguards described above.
          </p>
        </Section>
      </div>
    </div>
  );
}
