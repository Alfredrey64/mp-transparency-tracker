import { FONT_DISPLAY, FONT_BODY, PAGE_PADDING, COLORS } from "../theme";
import { PageHeader, InfoCard, WhyItMattersBand, FlowNode, FlowArrow } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconDarkMoney, IconShield, IconHistory, IconGlobe, IconSearch, IconGroup, IconQuestion, IconPartyFinance } from "./icons";

// The core mechanism of the whole page, drawn rather than listed: money
// starts with named individuals, but the law only requires the *middle*
// link — the association — to be named, not who actually filled it.
function MoneyTrailDiagram() {
  return (
    <div
      style={{
        padding: "30px 20px 24px", marginBottom: 30, maxWidth: "none", textAlign: "center",
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
        <FlowNode icon={IconGroup} label="Individual donors" color="#5A7FA6" />
        <FlowArrow />
        <FlowNode icon={IconQuestion} label="An unincorporated association" color="#9C3B3B" broken />
        <FlowArrow />
        <FlowNode icon={IconPartyFinance} label="The political party" color="#3F7D5C" />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "18px auto 0", maxWidth: 480 }}>
        The unincorporated association in the middle is the only link in this chain the law doesn't require anyone
        to name — which is exactly how a real <strong style={{ color: COLORS.ink }}>£435,000</strong> donation
        reached the DUP in 2016 with its original source never disclosed.
      </div>
    </div>
  );
}

function ThresholdStep({ number, title, children, color }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
      <div
        style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}1c`, color, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600,
        }}
      >
        {number}
      </div>
      <div>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: COLORS.ink, marginBottom: 3 }}>{title}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

export default function DarkMoney() {
  return (
    <div className="editorial" style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconDarkMoney}
        kicker="Transparency Gaps"
        title="Dark money: donations with no named donor"
        subtitle="Every other page here traces a donation to a named person or company in the official register. This page covers the narrow set of cases where UK law does not require that, with a well-documented example of how much can move through them."
        maxWidth={900}
      />

      <div className="editorial-body">

      <WhyItMattersBand icon={IconDarkMoney} color="#9C3B3B">
        if you can't see who really paid for a party's campaign, you can't judge whether their policies end up
        serving that donor or serving you — dark money is the one kind of political spending no page on this site,
        however carefully sourced, can ever actually show you.
      </WhyItMattersBand>

      <MoneyTrailDiagram />

      <InfoCard title="Why donations are made public at all" color="#5A7FA6" icon={IconShield} index={0}>
        <p style={{ marginTop: 0 }}>
          The basic idea behind political donation rules is simple: if someone gives a political party enough money
          that it might buy them influence, voters have a right to know who that is. That's why, above a set amount,
          UK law requires a donation to be published with the donor's name attached — you can look one up yourself
          on the <strong style={{ color: COLORS.ink }}>Party Finances</strong> page right now. Most donations work
          exactly like this, start to finish, with nothing hidden.
        </p>
        <p style={{ marginBottom: 0 }}>
          This page is about the exception: legal ways for money to reach a party's bank account without a donor's
          name ever being attached to it.
        </p>
      </InfoCard>

      <InfoCard title="What 'dark money' means here" color="#9C3B3B" icon={IconDarkMoney} index={1}>
        <p style={{ marginTop: 0 }}>
          It isn't a technical legal term — it's the name given to political money whose original source the public
          can't trace, even though it moved entirely within the rules. UK law requires donations to political
          parties to come from a{" "}
          <strong style={{ color: COLORS.ink }}>"permissible donor"</strong> — in practice, almost always a person
          registered to vote in the UK, or a company that does real business here — and, above a threshold, to be
          publicly declared with that donor's name. Dark money exploits the gap between those two requirements: a
          donation can be perfectly legal and still arrive at a party having passed through an intermediary whose
          own backers are never named.
        </p>
        <p style={{ marginBottom: 0 }}>
          The most-used route for this in UK politics is a type of donor called an{" "}
          <strong style={{ color: COLORS.ink }}>unincorporated association</strong> — and it's worth understanding
          exactly how, because it's the one mechanism that shows up again and again in the real cases below.
        </p>
      </InfoCard>

      <div style={{ marginBottom: 32, maxWidth: "none" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          How the unincorporated association loophole works
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20 }}>
          An unincorporated association is simply a group of people acting together without forming a company or
          charity — a members' club, a campaign group, a loose committee. They're a perfectly legal donor category.
          The transparency gap is in what happens one step further back.
        </p>
        <ThresholdStep number={1} title="Individuals give to the association — with no public trace" color="#9C3B3B">
          Anyone can give money to an unincorporated association. Unlike giving directly to a party, the association
          itself isn't required to check that its own backers are "permissible" UK donors — they could, in
          principle, be based anywhere in the world.
        </ThresholdStep>
        <ThresholdStep number={2} title="The association becomes the donor of record" color="#9C6B30">
          When the association then donates to a party, it is the association's name — not any individual behind
          it — that appears in the Electoral Commission's public register. The money's actual origin is never
          part of the public record.
        </ThresholdStep>
        <ThresholdStep number={3} title="Three thresholds decide what gets reported at all" color="#8A6D1F">
          Gifts under £500 don't even have to be counted internally. Once an association receives more than
          £7,500 from a single source in a year, it must tell the Electoral Commission — but that requirement
          only applies once the association's total accepted donations pass £37,270 in a year in the first place.
          Stay under that, and there's no registration duty at all.
        </ThresholdStep>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, fontStyle: "italic", marginTop: 4 }}>
          The independent Committee on Standards in Public Life has separately flagged unincorporated associations
          as a plausible route for foreign money to reach UK parties, precisely because of step 1.
        </div>
      </div>

      <InfoCard title={<>A real case: the DUP's £435,000 <GlossaryTerm term="Brexit">Brexit</GlossaryTerm> referendum campaign</>} color="#6E4B6E" icon={IconHistory} index={2}>
        <p style={{ marginTop: 0 }}>
          In the run-up to the 2016 EU <GlossaryTerm term="Referendum">referendum</GlossaryTerm>, a previously unknown group called the{" "}
          <strong style={{ color: COLORS.ink }}>Constitutional Research Council</strong> — chaired by Richard Cook,
          a former vice-chair of the Scottish Conservatives — donated £435,000 to the Democratic Unionist Party.
          Around £425,000 of it was spent on Vote Leave campaigning in England, including a £282,000 four-page
          "Take Back Control" wraparound advert in the Metro and roughly £100,000 of campaign merchandise — none of
          it in Northern Ireland, where the DUP actually stands for election.
        </p>
        <p style={{ marginBottom: 0 }}>
          Cook has confirmed he administered the donation but says he never personally profited from it, and has
          consistently refused to name where the CRC's own money came from. Both the CRC and the DUP have declined
          to disclose the original source. The Electoral Commission fined the CRC £6,000 for failing to cooperate
          with its inquiries — but had no power to compel disclosure of the underlying donor, and the true source
          of the UK's largest-ever single political donation at the time remains unknown to this day.
        </p>
      </InfoCard>

      <InfoCard title="Why this specific case can never be resolved" color="#3F7D5C" icon={IconGlobe} index={3}>
        <p style={{ marginTop: 0 }}>
          Northern Ireland parties used to be entirely exempt from donor-disclosure rules, for a genuine historical
          reason: a security-driven carve-out dating back to the Troubles, meant to protect donors from
          intimidation. That secrecy was lifted from 1 July 2017 onwards — but only from that date forward.
        </p>
        <p style={{ marginBottom: 0 }}>
          The government considered backdating the change to January 2014, when the legal groundwork for it was
          first put in place, and chose not to. The DUP's donation was made in early 2016 — squarely inside the
          window that was deliberately left permanently secret. Unlike every other case on this page, this isn't a
          gap that better reporting could ever close: the law itself guarantees this particular donor will never
          be named.
        </p>
      </InfoCard>

      <InfoCard title="What this doesn't mean" color="#9C6B30" icon={IconSearch} index={4}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>
            It isn't evidence any particular donation was improper — most unincorporated associations are exactly
            what they appear to be: pooled giving from ordinary members, with nothing to hide.
          </li>
          <li style={{ marginBottom: 8 }}>
            It isn't unique to one party or side of politics — the loophole is structural, available to any party
            any donor chooses to route money through.
          </li>
          <li>
            It doesn't mean donations are untraceable everywhere on this site — every donation shown on the{" "}
            <strong style={{ color: COLORS.ink }}>Party Finances</strong> and{" "}
            <strong style={{ color: COLORS.ink }}>Financial Interests</strong> pages comes from the official
            register precisely because it was disclosed under these same rules working as intended.
          </li>
        </ul>
      </InfoCard>
      </div>
    </div>
  );
}
