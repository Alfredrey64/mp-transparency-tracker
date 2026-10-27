import { PageHeader } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconDoor, IconShield, IconGavel, IconCompare } from "./icons";
import { Board, Why, Chapter, Split, Pull, Cards } from "./story/Kit";
import { Door, Ticks, Cutoff, Replaced } from "./story/DoorArt";

// The revolving door between government and industry, as a story: the idea, what the rules are for, what replaced the old committee, why the old system
// struggled, and four cases that shaped the debate.
const CASES = [
  {
    name: "George Osborne", initials: "GO", role: "Chancellor of the Exchequer, 2010 to 2016", colour: "#9C6B30",
    what: "Sought ACOBA's advice before joining BlackRock as an adviser in January 2017, as the rules required. Two months later, he accepted the editorship of the Evening Standard without clearing it with ACOBA first.",
    outcome: "A committee of MPs accused him of showing \"disrespect\" for the rules. He went on to take at least ten private-sector roles within five years of leaving the Treasury: none of which ACOBA had any power to block.",
  },
  {
    name: "David Cameron", initials: "DC", role: "Prime Minister, 2010 to 2016", colour: "#5B4E8A",
    what: "Became an adviser to Greensill Capital and, when the firm ran into trouble, personally lobbied the Chancellor to grant it access to a state-backed Covid loan scheme.",
    outcome: "None of it broke any rule, because it happened more than two years after he'd left office, ACOBA's jurisdiction over him had already expired entirely. The case became the clearest illustration of the old system's built-in expiry date.",
  },
  {
    name: "Boris Johnson", initials: "BJ", role: "Prime Minister, 2019 to 2022", colour: "#9C3B3B",
    what: "Broke ACOBA's rules on three separate occasions after leaving government, both during and after his premiership, including taking up paid roles before the committee had signed off on them.",
    outcome: "ACOBA has no statutory power to fine or block a breach, only to publicly say so, which is what it did each time.",
  },
  {
    name: "George Freeman MP", initials: "GF", role: "Minister for Science, Research and Innovation until November 2023", colour: "#3F7D5C",
    what: "Became a paid adviser to the satellite-data firm GHGSat in April 2024. ACOBA's advice was explicit: he should not lobby government on the company's behalf. In 2025, leaked emails reported by The Times appeared to show him discussing what to ask ministers with GHGSat's director before tabling written questions on space data and emissions tracking.",
    outcome: "Freeman self-referred and was investigated by the Registrar of Consultant Lobbyists over whether this amounted to unregistered lobbying. See the Consultant Lobbyists page. The Registrar cleared him on that specific question in October 2025; the rules, he noted, don't stop an MP asking questions on a topic where they have a financial interest, as long as it's properly declared.",
  },
];

export default function RevolvingDoor() {
  return (
    <div className="st" style={{ paddingTop: "clamp(20px, 5vw, 40px)" }}>
      <PageHeader
        icon={IconDoor}
        kicker="Transparency Gaps"
        title="The revolving door between government and industry"
        subtitle="When a minister or senior official leaves office, their knowledge and contacts go with them. UK rules on where they can go next have long been criticised as advisory only. This page explains how the system worked, why it has recently changed, and four cases that shaped the debate."
        maxWidth={900}
      />

      <Board tiles={[
        { label: "An advisory committee checked moves", value: 50, format: (n) => `${Math.round(n)} years`, colour: "#B79CFF", sub: "ACOBA could ask, not stop" },
        { label: "Applications in its last four years", value: 817, colour: "#FF7A8A", sub: "every one of them dealt with" },
        { label: "Refused", value: 0, colour: "#FFB45E", sub: "not a single one" },
        { label: "Cases explained below", value: CASES.length, colour: "#6FB1FF", sub: "from a missed form to a lobbying inquiry" },
      ]} />

      <Why icon={IconDoor} colour="#6E4B6E">
        A minister who could profit from a private-sector job right after leaving office has a reason to make decisions with that job in mind, even without ever
        consciously meaning to. For fifty years, the only thing standing in the way was a committee that could ask them nicely, not stop them.
      </Why>

      <Chapter n={1} title="Why this is called a 'revolving door'" colour="#5A7FA6" lede="People moving freely back and forth between government and the industries government regulates, funds, or buys from.">
        <figure className="st-visual"><Door /></figure>
        <div className="st-split" data-flip="0">
          <div className="st-prose" style={{ "--tc": "#5A7FA6" }}>
            <p>
              Imagine a defence minister who spends years deciding which companies win government contracts, then, within months of leaving office, takes a highly
              paid advisory role at one of those same companies. Nothing about that is automatically illegal. But it raises an obvious question: was that job offered
              because of genuine expertise, or as a reward for decisions made in office?
            </p>
          </div>
          <div className="st-prose" style={{ "--tc": "#5A7FA6" }}>
            <p>
              Nobody can read a minister's mind, which is exactly why this is hard to regulate. You can't prove a decision was influenced by a future job that didn't
              exist yet. The rules try to manage the appearance and opportunity for this, even though they can't police the intentions behind it.
            </p>
          </div>
        </div>
      </Chapter>

      <Chapter n={2} title="What the business appointment rules are for" colour="#6E4B6E" lede="Getting advice has always been a requirement. Following it has not.">
        <Pull colour="#6E4B6E">
          Ministers, senior civil servants and special advisers all have access to confidential information, and make decisions that affect specific companies and
          industries. Before taking a job connected to their old role, they have to seek advice on whether it risks looking like their government position was used
          to set up a private payday, or that the new employer is buying access to people still inside government.
        </Pull>
      </Chapter>

      <Chapter n={3} title="ACOBA has gone. Here is what replaced it" colour="#9C6B30" lede="The Advisory Committee on Business Appointments gave this advice for exactly 50 years, and was abolished on 13 October 2025.">
        <figure className="st-visual"><Replaced /></figure>
        <div className="st-prose" style={{ "--tc": "#9C6B30" }}>
          <p>
            Applications from <strong>former ministers</strong> now go to the Prime Minister's own Independent Adviser on Ministerial Standards, while{" "}
            <strong>former <GlossaryTerm term="Civil Service">civil servants</GlossaryTerm> and special advisers</strong> go through the Civil Service Commission. Former
            ACOBA staff moved across to keep the process running.
          </p>
          <p>
            The new Independent Adviser handled 61 former-ministers' applications in its first reporting year (2025 to 26). The system works, but it is new and has no
            long track record. Whether folding this into a role with a much broader remit strengthens or dilutes scrutiny is too early to judge.
          </p>
        </div>
      </Chapter>

      <Chapter n={4} title="Why the old system struggled" colour="#9C3B3B" lede="Three weaknesses, built into the design.">
        <Cards items={[
          { icon: IconShield, colour: "#5A7FA6", title: "Advisory, not enforceable", text: "ACOBA could recommend a waiting period or a lobbying ban, but had no legal power to block an appointment or penalise someone who ignored its advice." },
          { icon: IconCompare, colour: "#9C6B30", title: "A hard two-year cutoff", text: "Its jurisdiction over anyone expired two years after they left office, regardless of how directly relevant their new job was." },
          { icon: IconGavel, colour: "#9C3B3B", title: "Never once said no", text: "ACOBA has not refused a single application since 2010, whatever the appointment." },
        ]} />
        <Split visual={<Cutoff />}><p>The cutoff is easiest to see on a line of time. Anything that happens in the red part is outside the rules.</p></Split>
        <Split visual={<Ticks />} flip><p>In its last four years the committee dealt with <strong>817 applications</strong>. Each dot is one. None was refused.</p></Split>
      </Chapter>

      <Chapter n={5} title="Four real cases" colour="#E8741A" lede="Chosen to show the range, from a technical process failure, to a case that fell entirely outside the rules' reach, to one still being tested under the new system.">
        <ul className="st-case-grid">
          {CASES.map((c) => (
            <li key={c.name} className="st-case" style={{ "--tc": c.colour }}>
              <header><span className="st-avatar" aria-hidden="true">{c.initials}</span><div><h3>{c.name}</h3><p>{c.role}</p></div></header>
              <section><h4>What happened</h4><p>{c.what}</p></section>
              <section><h4>What followed</h4><p>{c.outcome}</p></section>
            </li>
          ))}
        </ul>
      </Chapter>
    </div>
  );
}
