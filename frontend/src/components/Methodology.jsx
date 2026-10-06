import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconMethodology } from "./icons";
import pipelineStatus from "../data/pipelineStatus.json";

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

// Every fetch step in the daily workflow is set to continue past its own
// failure so one flaky upstream API doesn't stop the other 18 from
// running — which also means the workflow itself can show green in
// GitHub even when several sources silently failed. This turns that back
// into something a visitor (not just someone reading the Actions log) can
// actually see, generated fresh by the workflow's own last step.
function PipelineStatus() {
  const { generatedAt, succeededCount, totalCount, sources } = pipelineStatus;

  if (!generatedAt) {
    return (
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "12px 16px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
        Pipeline status reporting starts with the next scheduled run.
      </div>
    );
  }

  const allSucceeded = succeededCount === totalCount;
  const failed = sources.filter((s) => !s.succeeded);
  const runTime = new Date(generatedAt).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: allSucceeded ? "#2F6F4E" : "#B5533C" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: allSucceeded ? "#2F6F4E" : "#B5533C", flexShrink: 0 }} />
        {succeededCount}/{totalCount} sources updated successfully on the last run
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>
        Last run: {runTime}
      </div>
      {failed.length > 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 8, lineHeight: 1.6 }}>
          Didn't update this time: {failed.map((s) => s.label).join(", ")}. Everything else on this page's source
          list was unaffected — each source is independent, so this is usually a transient issue with that one
          upstream source, not a fault with the site.
        </div>
      )}
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
        kicker="Data & Methodology"
        title="Where our data comes from"
        subtitle="Every figure on this site traces back to an official or independent public source. This page sets out which sources we use, how they are combined, how often they update, and where the automated matching can get things wrong."
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
              name="Open Council Data UK"
              url="https://opencouncildata.co.uk/"
              auth="Free CSV downloads, CC BY-SA 4.0"
              use="Every UK councillor with their ward, party and next election date, and each council's party make-up since 2016. The Your Council page is built from it; the two files derived from it are shared on the same licence."
            />
            <SourceRow
              name="Office for National Statistics"
              url="https://www.ons.gov.uk/"
              auth="No key required, Open Government Licence v3.0"
              use="Time series on the economy, prices, jobs and pay, public finances, population, NHS staffing, trade, energy and emissions, plus weekly deaths, with their full history. The Britain in numbers pages are built from them. They are refreshed daily and only change when the ONS publishes. Shading by prime minister uses public records of when each took office."
            />
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
              name="IPSA (Independent Parliamentary Standards Authority)"
              url="https://www.theipsa.org.uk/"
              auth="No key required"
              use="Every current MP's itemised business cost claims (staffing, travel, accommodation, office running costs), for the Claims tab on their profile and the Business Expenses ranking. Not a documented public API — IPSA publishes this on their own site, which this project reads from directly rather than assuming a stable format, so it's more fragile than the official Parliament APIs above if IPSA's site changes significantly."
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
            <SourceRow
              name="UK Parliament Committees API"
              url="https://committees-api.parliament.uk/"
              auth="No key required"
              use="Current select committees, their membership and chair, and their open inquiries, for the Select Committees page (scoped to Commons departmental committees, Lords investigative committees, and the two cross-cutting Joint Committees — procedural and administrative committees are left out). Also used for the Standards & Sanctions page, to find every report the Committee on Standards has published about a named MP's individual conduct."
            />
            <SourceRow
              name="UK Parliament Written Questions API"
              url="https://writtenquestions-api.parliament.uk/"
              auth="No key required"
              use="Every written question tabled in either House over a rolling 30 days, and the government's answer once given, for the Written Questions page."
            />
            <SourceRow
              name="Register of All-Party Parliamentary Groups"
              url="https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/registers-of-interests/register-of-all-party-party-parliamentary-groups/"
              auth="Entered by hand"
              use="A curated sample of APPGs' registered financial benefits (secretariat funding, hospitality) on the APPG Memberships page. Published as a PDF roughly every 6 weeks with no API to draw from, so refreshed periodically by hand rather than daily."
            />
            <SourceRow
              name="OBR — Public Finances Databank"
              url="https://obr.uk/data/"
              auth="Entered by hand"
              use="Headline government spending totals by department, for the Government Budget page. There's no API for a full breakdown at this level of detail, and the official figures themselves are only published a few times a year, so these are updated manually rather than daily like the rest of the site."
            />
            <SourceRow
              name="Departmental ministerial transparency returns"
              url="https://www.gov.uk/government/collections/ministers-transparency-publications"
              auth="Entered by hand"
              use="A curated sample of ministers' declared meetings with outside organisations, for the Ministerial Meetings page. Around twenty departments each publish this separately, on their own schedule, in their own format — there's no single source to automate against, so this is refreshed periodically by hand rather than daily."
            />
            <SourceRow
              name="Electoral Commission — donation rules & published cases"
              url="https://www.electoralcommission.org.uk/political-party-donations-and-loans-northern-ireland/who-can-you-accept-donations-and-loans/uk-unincorporated-associations"
              auth="Publicly documented"
              use="The registration thresholds and the Constitutional Research Council/DUP case described on the Dark Money page — a fixed explainer of a legal mechanism and one well-documented real case, not a live feed, so it's only updated if the underlying rules change."
            />
            <SourceRow
              name="Independent Adviser on Ministerial Standards / gov.uk business appointment rules"
              url="https://www.gov.uk/government/collections/business-appointment-rules"
              auth="Entered by hand"
              use="The explanation of the business appointment rules and the four real cases on the Revolving Door page. ACOBA, the body that ran this process for 50 years, was abolished in October 2025; its successor arrangements are new enough that this page is a snapshot to be revisited as the new system builds a track record, not a daily feed."
            />
            <SourceRow
              name="Who Funds You?"
              url="https://whofundsyou.org/"
              auth="Independent ratings, entered by hand"
              use="Every transparency grade on the Think Tank Funding page is this project's own published assessment, not our judgement — see that page for how their A–E scale works. Chosen by hand as a small, illustrative sample, not the full set of UK think tanks they've rated."
            />
            <SourceRow
              name="Office of the Registrar of Consultant Lobbyists"
              url="https://registrarofconsultantlobbyists.org.uk/"
              auth="Register downloaded by hand"
              use="The total count of registered firms and the real recent investigations on the Consultant Lobbyists page. The register only covers paid lobbying-for-hire, not the larger volume of in-house lobbying — explained on that page — and per-firm client lists change every quarter, so this is refreshed periodically by hand rather than automatically."
            />
          </div>
        </Section>

        <Section title="How often it updates">
          <p style={{ marginTop: 0, marginBottom: 0 }}>
            A scheduled job runs once a day, pulling fresh data from every API above and writing it straight to the
            live database — there's no manual step and no deploy needed for MPs, interests, votes, bills, committees,
            written questions, standards reports, donor-sector tags, or news to refresh. Compare MPs, the "What's
            Changed" panel on the Overview page, and My MP don't have their own data source at all — they're just
            different views over everything else here, so they're exactly as current as the rest of the site. The exceptions are content
            we've written and curated by hand, which only change when we deliberately update them: the Party Policies
            manifesto summaries, the Government Tracker's selected pledges (though their status still reflects Full
            Fact's current published verdict), the Government Budget figures, the Ministerial Meetings sample, the
            APPG registered financial benefits sample, the Dark Money and Revolving Door explainers, the Think Tank
            Funding sample, and the Consultant Lobbyists register snapshot.
          </p>
          <div style={{ marginTop: 16 }}>
            <PipelineStatus />
          </div>
        </Section>

        <Section title="Where the automated matching can go wrong">
          <p style={{ marginTop: 0 }}>
            Two features on this site work by matching records from separate data sources that don't share a common
            ID. That matching is useful, but it is inference, not certainty. We would rather tell you where the weak
            spots are than let a confident presentation suggest more precision than the data supports.
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
              <strong>Standards & Sanctions:</strong> the Committee on Standards publishes both individual MP conduct
              reports and general reports reviewing the rules themselves under one list, with no field distinguishing
              the two — a report is kept only if its title, once the "Nth Report -" prefix is stripped, reads like a
              short person's name rather than a policy topic. That's a good filter in practice, but a report about a
              topic that looks like a name could in principle slip through, or a very unusually worded personal report
              could be missed. The "what happened" and "the outcome" summaries shown on that page are written by
              hand from each report's own findings — for the most significant, widely reported cases only; where we
              haven't summarised a report yet, the page links straight to the Committee's original document instead
              of guessing.
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

      {/* Not decorative: an authorship mark for anyone who inspects the
          page or reads it with a screen reader, present even in a copy
          that's had the visible byline stripped out. */}
      <span
        aria-hidden="false"
        style={{ position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
      >
        UK Parliament Tracker was designed and built by Alfred Reynolds. This page and its methodology are original
        work, first published in 2026.
      </span>
    </div>
  );
}
