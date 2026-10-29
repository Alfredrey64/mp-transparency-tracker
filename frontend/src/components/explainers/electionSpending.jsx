/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconElectionSpend } from "../newIcons";

const PAGE = {
  look: "poster",
  icon: IconElectionSpend,
  kicker: "Money & influence",
  title: "What election campaigns can spend",
  subtitle: "Donations are only half of campaign money. The other half is what parties and candidates are allowed to spend, and what they say they did spend. This page sets out the limits in law and the totals reported for the 2024 general election.",
  tiles: [
    { label: "A party's limit, per seat it contests", value: "£54,010", colour: "#6FB1FF", sub: "so about £34.1 million for all 632 seats in Great Britain" },
    { label: "A candidate's limit in a county seat", value: "£11,390 + 12p", colour: "#FFB45E", sub: "plus 12p for every voter on the register. In a borough seat it is 8p" },
    { label: "Reported party spending, 2024", value: "about £94m", colour: "#FF7A8A", sub: "reported as the most on record for a general election" },
  ],
  why: { colour: "#5A7FA6", text: "Limits are meant to stop elections going to whoever has the most money. They only work if the spending is declared and checked, so who counts what matters as much as the limit." },
  chapters: [
    {
      title: "Two budgets, two sets of rules",
      lede: "A party runs one national campaign, and each of its candidates runs a local one. Each has its own limit in law.",
      colour: "#5A7FA6",
      blocks: [
        { compare: [
          { title: "The party's national campaign", colour: "#5A7FA6", items: [
            "£54,010 for every constituency the party contests in Great Britain, or in Northern Ireland.",
            "In Great Britain a party has a minimum limit if that is higher: £1,458,440 in England, £216,060 in Scotland and £108,030 in Wales.",
            "Covers things such as party political broadcasts, advertising, leaflets sent to voters, market research, press events, transport and rallies.",
          ] },
          { title: "A candidate's local campaign", colour: "#E8741A", items: [
            "In a county seat: £11,390 plus 12p for every voter on the register.",
            "In a borough seat: £11,390 plus 8p for every voter.",
            "At a by-election the limit is much higher: £180,050.",
            "Spending above the limit is an illegal practice.",
          ] },
        ] },
        { note: "These are the amounts written into the Political Parties, Elections and Referendums Act 2000 and the Representation of the People Act 1983 as they stand now, after uprating." },
      ],
    },
    {
      title: "What was reported for 2024",
      lede: "Spending returns for the July 2024 election were published by the Electoral Commission in stages through 2025.",
      colour: "#9C3B3B",
      blocks: [
        { bars: { items: [
          { label: "Labour", value: 30.1, text: "£30.1m", colour: "#C13A4E" },
          { label: "Conservatives", value: 23.9, text: "£23.9m", colour: "#1E4FB8" },
          { label: "Reform UK", value: 5.5, text: "about £5.5m", colour: "#2BA6A6" },
        ], note: "National campaign spending by party, as reported in the press from Electoral Commission data. Check the Commission's own register for exact figures." } },
        { text: [
          "The total reported for all parties was about £94 million, against about £72.6 million in 2019. The same reports say only Labour came close to its limit, which for a party contesting every seat in Great Britain works out at just over £34 million.",
          "Local campaigns were reported separately. One analysis of the candidate returns put Labour's local spending at £7.2 million, the Conservatives' at £7 million and Reform UK's at £1.3 million.",
        ] },
      ],
    },
    {
      title: "Where the rules end",
      lede: "The limits apply only to a set period before the vote, and only to money that counts as campaign spending.",
      colour: "#9C6B30",
      blocks: [
        { cards: [
          { title: "Third parties have limits too", text: "Campaigners who are not parties or candidates, such as unions and pressure groups, must register once they spend over a set amount and are capped in what they can spend." },
          { title: "Donations are a separate record", text: "A party can only accept money from a permissible donor, such as a person on the UK electoral register or a registered UK company. Spending and donations are published in different places." },
          { title: "Checks come later", text: "Candidates and parties send returns after the election. The Electoral Commission reviews them and can refer concerns to the police." },
        ] },
        { text: [<>For the money coming in, see <a href="#/partyFinances">who funds the parties</a> and <a href="#/darkMoney">hidden donations</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "Political Parties, Elections and Referendums Act 2000, Schedule 9: limits on party campaign expenditure", url: "https://www.legislation.gov.uk/ukpga/2000/41/schedule/9", note: "£54,010 per constituency, and the minimum limits for England, Scotland and Wales." },
    { label: "Representation of the People Act 1983, section 76: candidates' limits", url: "https://www.legislation.gov.uk/ukpga/1983/2/section/76", note: "£11,390 plus 12p or 8p per elector, and £180,050 at a by-election." },
    { label: "Political Parties, Elections and Referendums Act 2000, section 54: permissible donors", url: "https://www.legislation.gov.uk/ukpga/2000/41/section/54" },
    { label: "Electoral Commission: party and candidate spending and donations", url: "https://www.electoralcommission.org.uk/", note: "The official register. The 2024 totals above were reported in the press from its data and should be checked against it." },
    { label: "Press report: Labour hugely outspent Conservatives in 2024 general election, figures show", url: "https://www.inkl.com/news/labour-hugely-outspent-conservatives-in-2024-general-election-figures-show" },
  ],
  checked: "28 October 2026",
};

export default function ElectionSpending() {
  return <ExplainerPage {...PAGE} />;
}
