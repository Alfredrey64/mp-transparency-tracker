import { PageHeader } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconThinkTank, IconSearch, IconBroadcast, IconQuestion } from "./icons";
import { Board, Why, Chapter, Pull, Cards } from "./story/Kit";
import { Masked, Ladder } from "./story/ThinkArt";

const GRADE_COLOR = {
  A: "#3F7D5C",
  B: "#4C7A6B",
  C: "#9C6B30",
  D: "#B5533C",
  E: "#9C3B3B",
};

// A small, hand-picked sample of prominent UK think tanks with a
// publicly available "Who Funds You?" grade — not an exhaustive or
// systematically balanced survey. See whofundsyou.org for their full,
// independently assessed ratings.
const THINK_TANKS = [
  {
    name: "Institute of Economic Affairs",
    lean: "Free-market / right-leaning",
    grade: "E",
    detail: "Registered as an educational charity, which exempts it from declaring donors. Known long-term funders identified by journalists include BP (every year since 1967) and British American Tobacco; its largest known individual donor, Nigel Vinson, gave £3.7 million in 2023 alone.",
  },
  {
    name: "Adam Smith Institute",
    lean: "Free-market / right-leaning",
    grade: "E",
    detail: "One of only four UK think tanks, out of roughly 200 assessed, that refuse to name a single donor. Rated \"highly opaque\" by the transparency watchdog Transparify.",
  },
  {
    name: "TaxPayers' Alliance",
    lean: "Free-market / right-leaning",
    grade: "E",
    detail: "Files only abbreviated accounts at Companies House, so income and expenditure aren't disclosed in detail. Some individual UK donors have been identified (including Lord Bamford and Lord Edmiston), alongside undisclosed US funding channelled through its American fundraising arm.",
  },
  {
    name: "Centre for Policy Studies",
    lean: "Free-market / right-leaning",
    grade: "D",
    detail: "Rated among the least transparent UK think tanks in 2019, improving slightly to a D grade by 2023, still well below the disclosure standard of the organisations below.",
  },
  {
    name: "Institute for Public Policy Research (IPPR)",
    lean: "Progressive / left-leaning",
    grade: "A",
    detail: "Publishes a breakdown of its funders and states it never accepts money from political parties.",
  },
  {
    name: "Resolution Foundation",
    lean: "Non-partisan (living standards focus)",
    grade: "A",
    detail: "Publishes its funders and describes itself as strictly non-partisan, focused on outcomes for low-to-middle income households regardless of who's in government.",
  },
  {
    name: "Institute for Fiscal Studies (IFS)",
    lean: "Non-partisan (economic analysis)",
    grade: "A",
    detail: "The UK's most-cited independent economic analysts. States it never accepts funding contingent on a research project reaching a particular conclusion.",
  },
];

const SHORT = {"Institute of Economic Affairs": "IEA", "Adam Smith Institute": "Adam Smith Institute", "TaxPayers' Alliance": "TaxPayers' Alliance", "Centre for Policy Studies": "Centre for Policy Studies", "Institute for Public Policy Research (IPPR)": "IPPR", "Resolution Foundation": "Resolution Foundation", "Institute for Fiscal Studies (IFS)": "IFS"};

export default function ThinkTankFunding() {
  const ladder = THINK_TANKS.map((t) => ({ ...t, short: SHORT[t.name] ?? t.name }));
  return (
    <div className="st" style={{ paddingTop: "clamp(20px, 5vw, 40px)" }}>
      <PageHeader
        icon={IconThinkTank}
        kicker="Transparency Gaps"
        title="Who funds the think tanks you hear from?"
        subtitle={
          <>
            <GlossaryTerm term="Think Tank">Think tank</GlossaryTerm> staff appear on the news as independent experts every day, but UK law puts no obligation on any
            of them to say who pays for their research. This page shows what an independent transparency project has actually found when it asked, across the
            political spectrum.
          </>
        }
        maxWidth={900}
      />

      <Board tiles={[
        { label: "UK think tanks rated", value: 200, colour: "#FFB45E", sub: "by the transparency watchdog Transparify" },
        { label: "Refuse to name a single donor", value: 4, colour: "#FF7A8A", sub: "out of those assessed" },
        { label: "The grades they are given", value: "A to E", colour: "#6FB1FF", sub: "A is open, E is undisclosed" },
      ]} />

      <Why icon={IconThinkTank} colour="#9C6B30">
        The "expert" quoted on the news tonight could be paid, indirectly, by exactly the industry their comments defend, and under UK law, neither they nor the
        broadcaster interviewing them has to tell you that.
      </Why>

      <Chapter n={1} title="What a think tank is" colour="#5A7FA6" lede="An organisation that researches policy questions and publishes reports and recommendations aimed at influencing government and public debate.">
        <figure className="st-visual"><Masked /></figure>
        <div className="st-split" data-flip="0">
          <div className="st-prose" style={{ "--tc": "#5A7FA6" }}>
            <p>
              Think tanks research questions such as the economy, health, immigration or climate. Some are independent researchers with no fixed agenda. Others exist
              largely to make a particular industry's or ideology's case sound like neutral expert analysis. That is why who funds one matters: it is one of the few
              clues to which kind you are looking at.
            </p>
          </div>
          <div className="st-prose" style={{ "--tc": "#5A7FA6" }}>
            <p>
              They're not fringe voices. Think tank staff are quoted in newspapers, interviewed on the radio, and invited to brief select committees and ministers on a
              near-daily basis, almost always introduced by their job title alone, with no mention of who pays their salary.
            </p>
          </div>
        </div>
      </Chapter>

      <Chapter n={2} title="Why there's no legal requirement to say" colour="#9C3B3B" lede="A political party has to name a donor who gives more than a few hundred pounds. A think tank has no equivalent duty at all.">
        <Pull colour="#9C3B3B">
          Most register as <strong>educational charities</strong>. Charity law is built around a different question, making sure a charity's money is spent on its stated
          charitable purpose, and was never designed to answer "who is trying to influence government policy through this organisation?" the way election law is.
          Several UK think tanks have used that mismatch to keep every donor's identity confidential, entirely lawfully.
        </Pull>
      </Chapter>

      <Chapter n={3} title="Who Funds You?: an independent scorecard, not ours" colour="#3F7D5C" lede="Rather than judge any organisation's transparency ourselves, every grade here is taken directly from an independent project.">
        <div className="st-prose" style={{ "--tc": "#3F7D5C" }}>
          <p>
            <a href="https://whofundsyou.org/" target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>Who Funds You?</a> has assessed UK think tanks and campaign groups
            on an A (fully transparent) to E (undisclosed) scale since 2011. It ran a comprehensive annual review through 2024; funding constraints mean it now runs
            rolling, risk-based updates rather than reassessing everyone every year, so a rating here may be a couple of years old for some organisations.
          </p>
          <p>
            A poor grade is not proof that a specific claim from that organisation is wrong, but it does mean their independence can't be checked the way a party
            donation or an MP's outside earnings can be, everywhere else on this site.
          </p>
        </div>
      </Chapter>

      <Chapter n={4} title="A sample, across the spectrum" colour="#E8741A" lede="Seven prominent UK think tanks with a published Who Funds You? grade: three free-market organisations rated poorly, one left-leaning and two non-partisan organisations rated highly. A hand-picked sample to illustrate the range, not a comprehensive or systematically balanced survey.">
        <figure className="st-visual"><Ladder tanks={ladder} /></figure>
        <ul className="st-case-grid">
          {THINK_TANKS.map((t) => (
            <li key={t.name} className="st-case" style={{ "--tc": GRADE_COLOR[t.grade] }}>
              <header><span className="st-avatar" aria-hidden="true">{t.grade}</span><div><h3>{t.name}</h3><p>{t.lean}</p></div></header>
              <section><h4>What was found</h4><p>{t.detail}</p></section>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter n={5} title="Why this matters for what you see on the news" colour="#9C6B30" lede="A think tank fellow introduced on air as an 'independent' or 'leading' analyst is giving their institution's view a platform without the audience necessarily knowing who funds it.">
        <Cards items={[
          { icon: IconBroadcast, colour: "#5A7FA6", title: "The same gap as on air", text: "It sits right alongside the questions raised on the Media Literacy page about who's regulated to be impartial and who isn't." },
          { icon: IconQuestion, colour: "#9C6B30", title: "A grade is a prompt, not a verdict", text: "Knowing an organisation's transparency grade doesn't tell you whether a specific argument is right or wrong." },
          { icon: IconSearch, colour: "#3F7D5C", title: "Ask who benefits", text: "It is a reasonable prompt to ask who benefits before taking \"independent\" at face value." },
        ]} />
      </Chapter>
    </div>
  );
}
