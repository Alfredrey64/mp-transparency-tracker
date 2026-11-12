/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconCoin, IconLedger, IconScales, IconSearch, IconRegister, IconGroup, IconVote } from "../icons";
import { Flow } from "../story/StateArt";
import { Hero } from "../story/Vivid";

// Facts here come only from the Electoral Commission's guidance for registered treasurers of parties in Great Britain ("Political party donations and loans in Great Britain" and
// "Party spending and pre-poll donations and loans: UK Parliamentary general election"), read on 12 November 2026, and its sensitivity analysis of donation caps. The guidance in turn
// rests on the Political Parties, Elections and Referendums Act 2000. Northern Ireland has its own rules, which this page leaves out. The proposed cap on overseas voters is a
// Government proposal that, according to the Commission's guidance, had not yet become law when this page was checked, so it is described as a proposal.

const PAGE = {
  look: "vivid",
  icon: IconCoin,
  kicker: "Money and influence",
  title: "How political funding rules work",
  subtitle: "Parties can accept money and gifts, but only from certain sources, and above a small amount they have to check who is giving and tell the Electoral Commission. This page explains what counts as a donation, who is allowed to give, what has to be reported and when, and what happens to gifts that are not allowed.",
  lead: <Hero
    colours={["#1B2A3A", "#8A5A1F", "#2F6B52"]}
    why="Parties pay for campaigns with donations and loans. The rules say who may give, make parties check who is giving, and make them publish who gave what above a set amount, so that voters can see it."
    stops={[
      { icon: IconSearch, title: "Check", text: "Who is giving, and are they allowed to?", colour: "#E2BE7A" },
      { icon: IconScales, title: "Accept or return", text: "Allowed gifts are accepted, other gifts go back", colour: "#8DB7E8" },
      { icon: IconLedger, title: "Report", text: "Larger gifts are published by the Electoral Commission", colour: "#9ED4B6" },
    ]}
    figures={[
      { value: "£500", label: "Below this, the rules do not apply", sub: "A donation is anything over £500 given free or on non-commercial terms" },
      { value: "£11,180", label: "The amount that has to be reported", sub: "Total from one source in a year, to the central party" },
      { value: "30 days", label: "To decide whether to accept or to return a gift", sub: "From the day it is received" },
    ]}
  />,
  chapters: [
    {
      title: "What counts as a donation",
      lede: "A donation is more than money. It is money, goods or services given to a party without charge or on non-commercial terms, with a value of over £500.",
      colour: "#1B2A3A",
      blocks: [
        { cards: [
          { title: "A gift of money or property", icon: IconCoin, colour: "#2C5F9E", text: "The plainest kind: cash or an asset handed to the party." },
          { title: "Sponsorship", icon: IconRegister, colour: "#A9701F", text: "Paying for an event or a publication. The Commission has separate guidance on sponsorship." },
          { title: "Subscription and affiliation payments", icon: IconGroup, colour: "#5E4B8B", text: "Payments made to belong to or be linked with a party." },
          { title: "Free or cheap use of an office", icon: IconLedger, colour: "#1F7A6E", text: "Services and goods count too, if they are free or specially discounted." },
        ] },
        { text: ["Loans are covered as well, when they are worth more than £500: loans of money, credit facilities such as credit cards and overdrafts, and securities or guarantees for a party's obligations to someone else."] },
        { text: ["Donations of £500 or less are outside the law and do not need to be recorded or reported. But it is an offence to try to get round the controls. The Commission's example is a number of £400 donations from the same source in similar circumstances, made to avoid the checks on who can give."] },
      ],
    },
    {
      title: "Who is allowed to give",
      lede: "Parties can only accept donations and loans from a list of permissible sources, which are mainly based in the UK.",
      colour: "#2F6B52",
      blocks: [
        { cards: [
          { title: "Individuals on a UK electoral register", icon: IconVote, colour: "#2C5F9E", text: "This includes overseas electors and people leaving a bequest." },
          { title: "UK companies that do business here", icon: IconLedger, colour: "#A9701F", text: "A company registered in the UK that carries on business in the UK." },
          { title: "Trade unions and building societies", icon: IconGroup, colour: "#5E4B8B", text: "UK-registered trade unions and building societies, and friendly or industrial and provident societies." },
          { title: "Partnerships, parties and associations", icon: IconRegister, colour: "#1F7A6E", text: "UK-registered limited liability partnerships that do business here, parties registered in Great Britain, and UK-based unincorporated associations." },
        ] },
        { text: ["Parties can also accept donations, but not loans, from certain types of trust, from certain public funds, and from anyone who is paying the reasonable costs of a visit outside the UK."] },
        { text: ["Charities are not allowed to make political donations under charity law, even if they fall into one of the permissible categories."] },
        { text: ["Anyone or anything not on this list is an impermissible source. Overseas electors are included only because they are on a UK electoral register."] },
      ],
    },
    {
      title: "What a party must do when it gets a gift",
      lede: "For any donation over £500, the party has to find out who really gave it and whether they are allowed to.",
      colour: "#8A5A1F",
      blocks: [
        { node: <Flow down numbered items={[
          { title: "The gift arrives", text: "The party receives a donation worth more than £500.", colour: "#2C5F9E" },
          { title: "Check who it is from", text: "The party must take all reasonable steps to know the true identity of the donor and to check that the donor is a permissible source.", colour: "#5E4B8B" },
          { title: "Decide within 30 days", text: "It has 30 days to decide whether it can accept the donation, and the check has to be made each time, even for a donor who gave before.", colour: "#A9701F" },
          { title: "Accept it, or return it", text: "Permissible gifts can be accepted. Anything else must be returned within the 30 days.", colour: "#9A3F55" },
          { title: "Report it, if it is large enough", text: "Reports go to the Electoral Commission, which publishes them in a register.", colour: "#1F7A6E" },
        ]} /> },
        { text: ["The party's registered treasurer is responsible for making sure all this happens, and for keeping records that show how the checks were done."] },
      ],
    },
    {
      title: "When a gift is not allowed",
      lede: "A donation from an impermissible or unidentifiable source has to go back, and the party has to say so.",
      colour: "#9A3F55",
      blocks: [
        { steps: [
          { title: "If the donor is known", text: "Return it to them within 30 days of receiving it." },
          { title: "If the donor is unknown", text: "Return it within 30 days to the person who transferred it, or to the financial institution that was used." },
          { title: "If neither can be found", text: "Send it to the Electoral Commission, which pays it into the Consolidated Fund, managed by HM Treasury." },
        ] },
        { text: ["If the party keeps the gift beyond the 30 days it is treated as having accepted it. The party may then face civil sanctions, and the party and its treasurer may also have committed criminal offences. Impermissible donations over £500 that were returned or forfeited must be included in the party's quarterly report."] },
        { text: [<>The donations that parties have reported are on <a href="#/partyFinances">who funds the parties</a>.</>] },
      ],
    },
    {
      title: "What has to be reported, and when",
      lede: "Parties tell the Electoral Commission about larger gifts every three months, and more often before a general election.",
      colour: "#2C5F9E",
      blocks: [
        { facts: [
          { label: "First report threshold", value: "£11,180", note: "The first time the total accepted from one source in a calendar year goes over this amount, whether in one gift or several, the central party must report it." },
          { label: "After that, the lower threshold", value: "£2,230", note: "Once a source has gone over £11,180 in a year, each further total from that source over £2,230 is reported too. The same lower figure applies to a party's local accounting units." },
        ] },
        { text: ["Donations and loans from the same source are added together, in the order they were accepted, and can be grouped in any mixture. A party reports the group in the quarter in which the total went over the threshold, and each gift in it is recorded individually."] },
        { text: ["An example from the Commission: an LLP gives £12,000 in March and £3,000 in July. The £12,000 is over £11,180, so it is reported, and the lower £2,230 threshold then applies, so the £3,000 is reported as well."] },
        { timeline: [
          { when: "1 January to 31 March", text: "Report due by 30 April" },
          { when: "1 April to 30 June", text: "Report due by 30 July" },
          { when: "1 July to 30 September", text: "Report due by 30 October" },
          { when: "1 October to 31 December", text: "Report due by 30 January" },
        ] },
        { text: ["A party with nothing to report still has to send a nil report. A party that sends four nil reports in a row does not have to report again until it receives a reportable donation, enters into a new loan or changes an existing one."] },
        { text: ["Local branches that manage their own money are called accounting units. Their treasurers do not report to the Commission themselves: the central party treasurer is legally responsible for reporting what they receive."] },
        { text: ["The Commission publishes the amounts and the names of donors and lenders in a register on its website. It does not publish the addresses of individuals."] },
      ],
    },
    {
      title: "Before a general election",
      lede: "In the weeks before polling day, reports come weekly, and spending is capped.",
      colour: "#5E4B8B",
      blocks: [
        { text: ["From the day Parliament is dissolved to polling day, parties standing candidates have to report weekly any donation or loan to the central party over £11,180, or send a nil return. This is on top of the quarterly reports. Each weekly report is due within seven days of the end of the week."] },
        { facts: [
          { label: "Spending limit per seat contested", value: "£54,010", note: "A party's limit in each part of the UK is based on the number of seats it contests there. In Great Britain it is the greater of this figure times the seats, or a fixed amount: £1,458,440 for England, £216,060 for Scotland and £108,030 for Wales." },
          { label: "The regulated period", value: "A year", note: "For the 2024 election, spending counted from 6 July 2023, well before the election was announced, until polling day on 4 July 2024." },
        ] },
        { text: [<>What counts as spending, and what parties and candidates said they spent, is on <a href="#/electionSpending">election spending</a>.</>] },
      ],
    },
    {
      title: "Rules that may change",
      lede: "At the time this page was checked, the Government had announced a cap on one kind of donor, and the Commission had published an analysis of what caps could do.",
      colour: "#1B2A3A",
      blocks: [
        { text: ["The Government has announced that it plans a £100,000 annual cap on donations and loans from overseas voters, to apply to anything received or entered into from 25 March 2026 onwards. It would be part of the Government's Representation of the People Bill. The cap would cover everything an overseas voter gives, not just to one recipient: no more than £100,000 in total in a calendar year across parties, campaigners, candidates and others."] },
        { text: ["The Commission's guidance says no changes had yet been made to the law, and that its guidance reflects the law as it stands. Recipients would have 30 days after the change to return anything over the cap."] },
        { text: ["Separately, the Commission has published an analysis of what caps of £100,000, £50,000 or £10,000 on donations to parties could have done if they had applied between 2020 and 2025. It found they would have had the biggest effect in 2023 and 2024, in the lead-up to the 2024 general election. Parties that received a lot of smaller donations would have been least affected, and parties with standalone large donations the most. It stresses these are estimates, and that donors might have behaved differently."] },
      ],
    },
  ],
  sources: [
    { label: "Electoral Commission: Political party donations and loans in Great Britain", url: "https://www.electoralcommission.org.uk/political-party-donations-and-loans-great-britain", note: "What counts as a donation, who can give, checks, impermissible gifts, reporting and thresholds." },
    { label: "Electoral Commission: Who can you accept donations and loans from?", url: "https://www.electoralcommission.org.uk/political-party-donations-and-loans-great-britain/who-can-you-accept-donations-and-loans", note: "The list of permissible sources and the proposed cap on overseas voters." },
    { label: "Electoral Commission: Which donations and loans do you need to report?", url: "https://www.electoralcommission.org.uk/political-party-donations-and-loans-great-britain/which-donations-and-loans-do-you-need-report", note: "The £11,180 and £2,230 thresholds, grouping and accounting units." },
    { label: "Electoral Commission: Party spending and pre-poll donations and loans, UK Parliamentary general election", url: "https://www.electoralcommission.org.uk/party-spending-and-pre-poll-donations-and-loans-uk-parliamentary-general-election", note: "The regulated period, spending limits and weekly pre-poll reporting." },
    { label: "Electoral Commission: How different levels of donation caps could affect political parties", url: "https://www.electoralcommission.org.uk/research-reports-and-data/how-different-levels-donation-caps-could-affect-political-parties-sensitivity-analysis", note: "The sensitivity analysis of caps of £100,000, £50,000 and £10,000." },
  ],
  checked: "12 November 2026",
};

export default function HowPartyFundingWorks() {
  return <ExplainerPage {...PAGE} />;
}
