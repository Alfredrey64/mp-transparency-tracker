import { PageHeader } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconDarkMoney, IconShield, IconSearch, IconGroup, IconPartyFinance } from "./icons";
import { Board, Why, Chapter, Split, Pull, Steps, Cards } from "./story/Kit";
import { MoneyTrail, Thresholds, SpendBar, Secrecy } from "./story/DarkMoneyArt";

// Dark money: how money can reach a party with no donor's name on it. Laid out as a story: the headline figures, the idea of a public register, the one
// mechanism (the unincorporated association), the three thresholds, a real case, why that case can never be settled, and what none of it means.
const pounds = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

export default function DarkMoney() {
  return (
    <div className="st" style={{ paddingTop: "clamp(20px, 5vw, 40px)" }}>
      <PageHeader
        icon={IconDarkMoney}
        kicker="Transparency Gaps"
        title="Dark money: donations with no named donor"
        subtitle="Every other page here traces a donation to a named person or company in the official register. This page covers the narrow set of cases where UK law does not require that, with a well-documented example of how much can move through them."
        maxWidth={900}
      />

      <Board variant="lead" tiles={[
        { label: "The DUP's referendum donation", value: 435000, format: pounds, colour: "#FF7A8A", sub: "its original source has never been named" },
        { label: "Gifts below this are not counted", value: 500, format: pounds, colour: "#FFB45E", w: "30%", sub: "by an association" },
        { label: "From one source in a year", value: 7500, format: pounds, colour: "#B79CFF", w: "62%", sub: "above this an association must tell the Electoral Commission" },
        { label: "Total donations before any duty", value: 37270, format: pounds, colour: "#6FB1FF", w: "100%", sub: "below it, there is no registration at all" },
      ]} />

      <Why icon={IconDarkMoney} colour="#9C3B3B">
        If you can't see who really paid for a party's campaign, you can't judge whether their policies end up serving that donor or serving you. Dark
        money is the one kind of political spending no page on this site, however carefully sourced, can ever actually show you.
      </Why>

      <Chapter n={1} title="Why donations are made public at all" colour="#5A7FA6" lede="The basic idea behind political donation rules is simple: if someone gives a party enough money that it might buy influence, voters have a right to know who that is.">
        <Split visual={<RegisterMock />}>
          <p>
            That's why, above a set amount, UK law requires a donation to be published with the donor's name attached. You can look one up yourself on the{" "}
            <strong>Party Finances</strong> page right now. Most donations work exactly like this, start to finish, with nothing hidden.
          </p>
          <p>This page is about the exception: legal ways for money to reach a party's bank account without a donor's name ever being attached to it.</p>
        </Split>
      </Chapter>

      <Chapter n={2} title="What 'dark money' means here" colour="#9C3B3B" lede="It isn't a technical legal term. It's the name given to political money whose original source the public can't trace, even though it moved entirely within the rules.">
        <div className="st-prose" style={{ "--tc": "#9C3B3B" }}>
          <p>
            UK law requires donations to political parties to come from a <strong>"permissible donor"</strong>, in practice, almost always a person registered to
            vote in the UK, or a company that does real business here, and, above a threshold, to be publicly declared with that donor's name. Dark money
            exploits the gap between those two requirements: a donation can be perfectly legal and still arrive at a party having passed through an
            intermediary whose own backers are never named.
          </p>
          <p>
            The most-used route for this in UK politics is a type of donor called an <strong>unincorporated association</strong>, and it's worth understanding
            exactly how, because it's the one mechanism that shows up again and again in the real cases below.
          </p>
        </div>
        <figure className="st-visual"><MoneyTrail /></figure>
        <Pull colour="#9C3B3B">
          The unincorporated association in the middle is the only link in this chain the law doesn't require anyone to name, which is exactly how a real
          £435,000 donation reached the DUP in 2016 with its original source never disclosed.
        </Pull>
      </Chapter>

      <Chapter n={3} title="How the unincorporated association loophole works" colour="#9C6B30" lede="An unincorporated association is simply a group of people acting together without forming a company or charity: a members' club, a campaign group, a loose committee. They're a perfectly legal donor category. The transparency gap is in what happens one step further back.">
        <Steps steps={[
          { title: "Individuals give to the association, with no public trace", colour: "#9C3B3B", text: "Anyone can give money to an unincorporated association. Unlike giving directly to a party, the association itself isn't required to check that its own backers are \"permissible\" UK donors. They could, in principle, be based anywhere in the world." },
          { title: "The association becomes the donor of record", colour: "#9C6B30", text: "When the association then donates to a party, it is the association's name, not any individual behind it. That appears in the Electoral Commission's public register. The money's actual origin is never part of the public record." },
          { title: "Three thresholds decide what gets reported at all", colour: "#8A6D1F", text: "Gifts under £500 don't even have to be counted internally. Once an association receives more than £7,500 from a single source in a year, it must tell the Electoral Commission, but that requirement only applies once the association's total accepted donations pass £37,270 in a year in the first place. Stay under that, and there's no registration duty at all." },
        ]} />
        <figure className="st-visual"><Thresholds /></figure>
        <p className="st-note">The independent Committee on Standards in Public Life has separately flagged unincorporated associations as a plausible route for foreign money to reach UK parties, precisely because of step 1.</p>
      </Chapter>

      <Chapter n={4} title="A real case: the DUP's £435,000 referendum campaign" colour="#6E4B6E" lede="The largest single political donation in UK history at the time, and its true source is still unknown.">
        <>
        <figure className="st-visual"><SpendBar /></figure>
        <div className="st-prose" style={{ "--tc": "#6E4B6E" }}>
          <p>
            In the run-up to the 2016 EU <GlossaryTerm term="Referendum">referendum</GlossaryTerm>, a previously unknown group called the{" "}
            <strong>Constitutional Research Council</strong>, chaired by Richard Cook, a former vice-chair of the Scottish Conservatives, donated £435,000 to the
            Democratic Unionist Party. Around £425,000 of it was spent on Vote Leave campaigning in England, including a £282,000 four-page "Take Back Control"
            wraparound advert in the Metro and roughly £100,000 of campaign merchandise: none of it in Northern Ireland, where the DUP actually stands for election.
          </p>
          <p>
            Cook has confirmed he administered the donation but says he never personally profited from it, and has consistently refused to name where the CRC's own
            money came from. Both the CRC and the DUP have declined to disclose the original source. The Electoral Commission fined the CRC £6,000 for failing to
            cooperate with its inquiries, but had no power to compel disclosure of the underlying donor, and the true source of the UK's largest-ever single
            political donation at the time remains unknown to this day.
          </p>
        </div>
        </>
      </Chapter>

      <Chapter n={5} title="Why this specific case can never be resolved" colour="#3F7D5C" lede="Unlike every other case on this page, this isn't a gap that better reporting could ever close: the law itself guarantees this particular donor will never be named.">
        <figure className="st-visual"><Secrecy /></figure>
        <div className="st-prose" style={{ "--tc": "#3F7D5C" }}>
          <p>
            Northern Ireland parties used to be entirely exempt from donor-disclosure rules, for a genuine historical reason: a security-driven carve-out dating back
            to the Troubles, meant to protect donors from intimidation. That secrecy was lifted from 1 July 2017 onwards, but only from that date forward.
          </p>
          <p>
            The government considered backdating the change to January 2014, when the legal groundwork for it was first put in place, and chose not to. The DUP's
            donation was made in early 2016, squarely inside the window that was deliberately left permanently secret.
          </p>
        </div>
      </Chapter>

      <Chapter n={6} title="What this doesn't mean" colour="#9C6B30" lede="Three things worth holding on to, so the gap is read for what it is.">
        <Cards items={[
          { icon: IconShield, colour: "#5A7FA6", title: "It isn't evidence of wrongdoing", text: "It isn't evidence any particular donation was improper: most unincorporated associations are exactly what they appear to be: pooled giving from ordinary members, with nothing to hide." },
          { icon: IconGroup, colour: "#9C6B30", title: "It isn't one party's problem", text: "It isn't unique to one party or side of politics: the loophole is structural, available to any party any donor chooses to route money through." },
          { icon: IconSearch, colour: "#3F7D5C", title: "Most donations are traceable", text: "It doesn't mean donations are untraceable everywhere on this site: every donation shown on the Party Finances and Financial Interests pages comes from the official register precisely because it was disclosed under these same rules working as intended." },
        ]} />
      </Chapter>
    </div>
  );
}

// A made-up register entry, to show what "published with the donor's name attached" looks like.
function RegisterMock() {
  return (
    <div className="dm-mock" aria-hidden="true">
      <div className="dm-mock-head"><IconPartyFinance size={18} /> Electoral Commission register</div>
      {[["Donor", "A named person or company"], ["Amount", "Above the reporting limit"], ["Given to", "A political party"], ["Date", "Recorded and public"]].map(([k, v], i) => (
        <div key={k} className="dm-mock-row" style={{ "--i": i }}><span>{k}</span><b>{v}</b></div>
      ))}
      <div className="dm-mock-stamp">Named</div>
    </div>
  );
}
