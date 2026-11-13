/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import SpendReceipt from "../story/SpendReceipt";
import { Diverge, Journey } from "../story/StateArt";
import DonutShare from "../story/DonutShare";
import SpendCalc from "../story/SpendCalc";
import SpendWindow from "../story/SpendWindow";
import { IconLedger, IconBallot, IconShield, IconGroup } from "../icons";
import { IconElectionSpend } from "../newIcons";
import {
  LARGE_PARTIES, LARGE_CAMPAIGNERS, SMALL_PARTIES, SMALL_CAMPAIGNERS, CANDIDATES, campaignersTotal, largePartiesTotal, partiesTotal,
  PARTY_CATEGORIES, CANDIDATE_UNSOLICITED, ONLINE_SHARE, LIMIT_USED,
} from "../../data/spending2024";

// The limits are from the Acts (Representation of the People Act 1983 section 76; Political Parties, Elections and Referendums Act 2000 Schedule 9), and every 2024 figure is from the
// Electoral Commission's releases of 13 February, 18 March and 17 July 2025, or the House of Commons Library briefings built on its data, all read on 12 November 2026
// (frontend/src/data/spending2024.js). The review of spending limits is from the Commission's statement of 21 September 2026. No office-holder is named.

const m = (n) => `£${(n / 1e6).toFixed(1)}m`;
const gbpFull = (n) => `£${n.toLocaleString("en-GB")}`;
const allSpent = partiesTotal + campaignersTotal + CANDIDATES.spent;

const whoSpent = [
  { key: "big", label: "The seven biggest parties", value: largePartiesTotal, colour: "#9C3B3B", about: "Labour, Conservative, Liberal Democrat, Reform UK, Green, SNP and Co-operative: each reported spending £250,000 or more." },
  { key: "cand", label: "Candidates, in their own seats", value: CANDIDATES.spent, colour: "#3E6E9E", about: "What candidates spent on their local campaigns, as reported on their returns." },
  { key: "npc", label: "Non-party campaigners", value: campaignersTotal, colour: "#C9792B", about: "Unions, pressure groups and companies campaigning without standing candidates: 3 spent £250,000 or more, and 18 others spent less." },
  { key: "small", label: `${SMALL_PARTIES.count} smaller parties`, value: SMALL_PARTIES.spent, colour: "#7B5BD6", about: `Each spent £250,000 or less, and ${SMALL_PARTIES.nil} of them sent in a nil return.` },
];

const whatParties = [
  { key: "unsol", label: "Leaflets and other unsolicited material", value: PARTY_CATEGORIES.unsolicited, colour: "#9C3B3B", about: "Services such as leaflet printing and delivery to voters' homes." },
  { key: "adv", label: "Advertising", value: PARTY_CATEGORIES.advertisingAndUnsolicited - PARTY_CATEGORIES.unsolicited, colour: "#3E6E9E", about: "Worked out from the Library's two figures: advertising and unsolicited material together were 67% of party spending, and unsolicited material alone 38%." },
  { key: "rest", label: "Everything else", value: 100 - PARTY_CATEGORIES.advertisingAndUnsolicited, colour: "#8C95AB", about: "Broadcasts, market research, media, overheads and general administration, manifesto and campaign material, rallies and events, and transport." },
];

const PAGE = {
  look: "vivid",
  icon: IconElectionSpend,
  kicker: "Money & influence",
  title: "What election campaigns can spend",
  subtitle: "Donations are only half of campaign money. The other half is what parties and candidates are allowed to spend, and what they say they did spend. Set the limits yourself below, then see what was spent at the 2024 general election, what it bought, and why the rules may change.",
  lead: <SpendReceipt
    why="Limits are meant to stop elections going to whoever has the most money. They only work if the spending is declared and checked, so who counts what matters as much as the limit."
    figures={[
      { value: m(allSpent), label: "Spent at the 2024 election", sub: "A record, by parties, candidates and campaigners together" },
      { value: "£34.1m", label: "Most a party could spend", sub: "£54,010 for each of the 632 seats in Great Britain" },
      { value: "365 days", label: "Window for a party's limit", sub: "Ending on polling day, 4 July 2024" },
    ]}
  />,
  chapters: [
    {
      title: "Two budgets, one election",
      lede: "A party runs one national campaign, and each of its candidates runs a local one. Each has its own limit in law, and the two are policed differently.",
      colour: "#5A7FA6",
      blocks: [
        { compare: [
          { title: "The party's national campaign", colour: "#9C3B3B", items: [
            "£54,010 for every constituency the party contests.",
            "If a party stands in only a few seats it gets a minimum for each part of Great Britain instead.",
            "Reports spending in nine categories: advertising, campaign broadcasts, market research and canvassing, media, overheads and general administration, manifesto and third-party campaign material, rallies and other events, transport, and unsolicited material to voters.",
            "Where a candidate stands for more than one party at once, the per-seat amount is divided between them.",
          ] },
          { title: "A candidate's local campaign", colour: "#3E6E9E", items: [
            "In a county seat: £11,390 plus 12p for every voter on the register.",
            "In a borough seat: £11,390 plus 8p for every voter.",
            "At a by-election the limit is a flat £180,050.",
            "A candidate's own personal expenses do not count towards it.",
            "A candidate or agent who knew, or should have known, that spending would pass the limit has committed an illegal practice.",
          ] },
        ] },
        { node: <SpendCalc /> },
        { text: ["The limits were raised by 80% in 2023, to account for inflation. That was the first rise since they were set in 2000."] },
        { more: { title: "Why there are two sets of rules", text: [
          "Candidate spending has been limited since the Corrupt and Illegal Practices (Prevention) Act of 1883, and is still governed by the Representation of the People Act 1983. It is handled locally, and the police enforce it.",
          "Party spending was only systematically regulated from the 2001 general election, after the Political Parties, Elections and Referendums Act 2000. That is the job of the Electoral Commission. The House of Commons Library notes that the split is largely historical.",
        ] } },
      ],
    },
    {
      title: "The window when spending counts",
      lede: "The limits do not cover the whole time between elections. They cover a set period before polling day.",
      colour: "#9C3B3B",
      blocks: [
        { node: <SpendWindow /> },
        { text: ["For a party, that is the 365 days up to polling day. For the July 2024 election it ran from 6 July 2023 to 4 July 2024. For a candidate, it begins the day after they officially become a candidate."] },
      ],
    },
    {
      title: "What was spent in 2024",
      lede: "The Electoral Commission published the returns in three stages and put the total at a record.",
      colour: "#C9792B",
      blocks: [
        { node: <DonutShare
          title={`Who spent the ${m(allSpent)}`}
          items={whoSpent}
          format={m}
          centre="Spent at the 2024 general election"
          aria={`Who spent the ${m(allSpent)} at the 2024 general election: ${whoSpent.map((s) => `${s.label} ${m(s.value)}`).join(", ")}`}
          note="The Commission gave the £94.5m total and the figures for each group of parties and campaigners. The candidate total is from the House of Commons Library's analysis of the Commission's data. The slices are added up from those figures."
        /> },
        { bars: { items: LARGE_PARTIES.map((p) => ({ label: p.name, value: p.spent, text: m(p.spent), colour: p.colour })), note: "The seven parties that reported spending £250,000 or more, as published by the Electoral Commission on 17 July 2025. Exact figures are in the Commission's tables." } },
        { text: [
          `Labour reported ${gbpFull(LARGE_PARTIES[0].spent)} and the Conservatives ${gbpFull(LARGE_PARTIES[1].spent)}. The Commission's analysis found that only these two parties spent 70% or more of their limits.`,
          "Labour and the Conservatives are usually the two biggest spenders. The House of Commons Library says 2019 was the only general election since 2001, when the current system began, in which they were not, because the Liberal Democrats reported more than Labour that year.",
        ] },
        { bars: { max: 100, items: LIMIT_USED.map((p) => ({ label: p.name, value: p.pct, text: `${p.pct}% of its limit`, colour: p.name.startsWith("Labour") ? "#C13A4E" : "#2F5FB5" })), note: "How much of its own limit each party spent, from the Commission's analysis as reported by the House of Commons Library. The Library says the higher limits had little effect on the other main parties' spending. It also found no link between how close a seat was and how much of the limit its candidates spent." } },
      ],
    },
    {
      title: "What the money bought",
      lede: "Most of it went on getting a message to people's homes and screens.",
      colour: "#3E6E9E",
      blocks: [
        { node: <DonutShare
          title="What parties spent money on in 2024"
          items={whatParties}
          format={(n) => `${Math.round(n)}%`}
          centre="Share of party spending, 2024"
          aria={`What parties spent money on in 2024: ${whatParties.map((s) => `${s.label} ${s.value} per cent`).join(", ")}`}
          note="From the House of Commons Library's analysis of Commission data. Advertising is worked out by subtracting the Library's two published shares."
        /> },
        { bars: { max: 100, items: ONLINE_SHARE.map((o) => ({ label: o.year, value: o.pct, text: `${o.pct}%`, colour: "#3E6E9E" })), note: "The share of party advertising spending that went to Facebook/Meta and Google (including YouTube) at each general election. The Library found this by searching returns for those suppliers, so it will miss spending through agencies and other intermediaries." } },
        { text: [
          `Candidates spend even more on paper: unsolicited material, mainly leaflets, was ${CANDIDATE_UNSOLICITED}% of what they spent.`,
          "The Electoral Commission has recommended that the Government update the spending categories so voters get more useful detail, for example by showing digital campaigning separately.",
        ] },
      ],
    },
    {
      title: "Campaigners who are not standing",
      lede: "Unions, pressure groups and companies can campaign too. They have their own limits and thresholds.",
      colour: "#C9792B",
      blocks: [
        { facts: [
          { label: "Must register if they plan to spend more than", value: "£10,000", note: "with the Electoral Commission" },
          { label: "Must send a spending return above", value: "£20,000", note: "in England, or £10,000 in Scotland, Wales or Northern Ireland" },
          { label: "Biggest spender in 2024", value: gbpFull(LARGE_CAMPAIGNERS[0].spent), note: LARGE_CAMPAIGNERS[0].name },
        ] },
        { text: [`Three campaigners spent £250,000 or more: ${LARGE_CAMPAIGNERS.map((c) => `${c.name} (${gbpFull(c.spent)})`).join(", ")}. Another ${SMALL_CAMPAIGNERS.count} that reported spending less together spent ${gbpFull(SMALL_CAMPAIGNERS.spent)}.`] },
      ],
    },
    {
      title: "After the vote: who checks, and how long it takes",
      lede: "Every party and candidate has to send in a return, even if they spent nothing. Who receives it, and who enforces it, depends on who spent.",
      colour: "#2F7D6B",
      blocks: [
        { node: <Diverge
          root={{ icon: IconLedger, title: "A spending return", text: "Sent in after the election, even if nothing was spent", colour: "#2F7D6B" }}
          items={[
            { icon: IconGroup, title: "Parties and campaigners", list: ["Return goes to the Electoral Commission", "Up to £250,000: three months from the vote", "Over £250,000: six months, and audited", "The Commission publishes it and checks it"], colour: "#9C3B3B" },
            { icon: IconBallot, title: "Candidates", list: ["Return goes to the local returning officer", "Due within 35 days of the result", "Open to the public on request for two years", "Copies go to the Commission to publish"], colour: "#3E6E9E" },
            { icon: IconShield, title: "If something looks wrong", list: ["The Commission regulates parties and campaigners", "It does not regulate candidate spending", "Concerns about candidates go to the police", "The Commission says it told police where it had concerns"], colour: "#C9792B" },
          ]}
        /> },
        { node: <Journey colour="#2F7D6B" items={[
          { when: "4 July 2024", text: "Polling day: the window for party limits closes" },
          { when: "4 October 2024", text: "Deadline for parties and campaigners spending £250,000 or less" },
          { when: "4 January 2025", text: "Deadline for audited returns from those spending more" },
          { when: "13 February 2025", text: "First figures published: smaller parties and campaigners" },
          { when: "18 March 2025", text: "Headline figures for candidates published" },
          { when: "17 July 2025", text: "Larger parties and campaigners published, and the £94.5m total announced" },
        ]} /> },
        { text: [
          "That is just over a year from the vote to the full picture. For the 2019 election the larger parties' returns were published on 7 October 2020, ten months on, and for 2017 on 19 March 2018, nine months on.",
          "The Committee on Standards in Public Life has called the current timetable incompatible with openness and accountability. It recommended that large parties file within four months and that the Commission publish within two months of receiving a return.",
        ] },
      ],
    },
    {
      title: "What may change",
      lede: "The rules are under review, and the Commission has pointed to gaps in what they show.",
      colour: "#7B5BD6",
      blocks: [
        { pull: "The Government has asked the Electoral Commission to review spending limits for parties, third-party campaigners and, since August 2026, candidates. It has asked for recommendations by July 2027." },
        { cards: [
          { title: "The review", text: "Begun in September 2026, it will look at spending limits, how party and candidate spending interact, and the reporting rules. Changes would be for the Government to make, and the Commission says they must leave campaigners time to adapt." },
          { title: "Spending between elections", text: "The Commission says a significant amount is now spent between election periods, outside the windows the limits cover. A separate review into foreign financial influence recommended that reporting for campaigners and candidates should apply all year round." },
          { title: "What the categories hide", text: "The Commission has recommended updating the spending categories parties report in. Academics cited by the Library argue the current ones give an incomplete picture, particularly of data-driven online campaigning." },
        ] },
        { text: [<>For the money coming in, see <a href="#/partyFinances">who funds the parties</a>, <a href="#/howPartyFundingWorks">how party funding rules work</a> and <a href="#/darkMoney">hidden donations</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "Political Parties, Elections and Referendums Act 2000, Schedule 9: limits on campaign expenditure", url: "https://www.legislation.gov.uk/ukpga/2000/41/schedule/9", note: "£54,010 per constituency, the minimums for England, Scotland and Wales, the 365-day period, and the rule when a candidate stands for several parties." },
    { label: "Representation of the People Act 1983, section 76: limitation of election expenses", url: "https://www.legislation.gov.uk/ukpga/1983/2/section/76", note: "£11,390 plus 12p or 8p per voter, £180,050 at a by-election, personal expenses, and the illegal practice." },
    { label: "Electoral Commission: General election spending hits record high (17 July 2025)", url: "https://www.electoralcommission.org.uk/media-centre/general-election-spending-hits-record-high", note: "The £94.5m total, each of the seven biggest parties, the three biggest campaigners, thresholds and deadlines." },
    { label: "Electoral Commission: First round of general election spending published (13 February 2025)", url: "https://www.electoralcommission.org.uk/media-centre/first-round-general-election-spending-published", note: "The smaller parties and campaigners, the 2024 window and the deadlines." },
    { label: "Electoral Commission: General election candidate spending and donation data published (18 March 2025)", url: "https://www.electoralcommission.org.uk/media-centre/general-election-candidate-spending-and-donation-data-published", note: "Candidate returns, who enforces them, and the 35-day deadline." },
    { label: "Electoral Commission: statement on spending limits review (21 September 2026)", url: "https://www.electoralcommission.org.uk/media-centre/electoral-commission-statement-spending-limits-review", note: "The review the Government has asked for, its scope and its July 2027 deadline." },
    { label: "House of Commons Library: Party spending in the 2024 general election", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-11019/", note: "Share of limits used, spending categories, online advertising, and how long returns take." },
    { label: "House of Commons Library: Candidate spending in the 2024 general election", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-11027/", note: "The £23.3m candidate total, what candidates spent it on, and why the two sets of rules exist." },
  ],
  checked: "12 November 2026",
};

export default function ElectionSpending() {
  return <ExplainerPage {...PAGE} />;
}
