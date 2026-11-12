/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconBallot, IconVote, IconScales, IconRegister, IconGroup, IconSearch } from "../icons";
import { Flow } from "../story/StateArt";
import { Hero } from "../story/Vivid";
import VoteSeatGap from "../story/VoteSeatGap";
import { GE2024 } from "../../data/generalElection2024";

// Facts here come only from sources read on 12 November 2026: the UK Parliament website (voting systems), the Commons Library (what happens when the polls close, lost
// deposits, the 2024 results), the Electoral Commission's guidance for returning officers (recounts, equality of votes), GOV.UK (the general election page) and the site's own
// copy of the 2024 result from Parliament's results site. The Electoral Commission's own 2024 report would not load, so the rate of rejected ballots is worked out from the
// Parliament results instead. The Senedd's voting system is left out because Parliament's page on voting systems may not yet reflect the 2026 changes.

const total = GE2024.validVotes + GE2024.invalidVotes;
const rejectedPct = (GE2024.invalidVotes / total) * 100;
const share = (name) => { const row = GE2024.parties.find(([n]) => n === name); return { votes: (row[1] / GE2024.validVotes) * 100, seats: (row[2] / 650) * 100 }; };
const one = (n) => Math.round(n * 10) / 10;
const gap = (name, colour) => { const s = share(name); return { name, colour, votes: one(s.votes), seats: one(s.seats) }; };

const PAGE = {
  look: "vivid",
  icon: IconBallot,
  kicker: "Elections",
  title: "How elections work",
  subtitle: "Every general election is 650 separate contests. This page follows one vote from the ballot box to the declaration: who wins a seat, why that can leave a party with far fewer seats than votes, what makes a ballot paper count or not, and what happens when a result is close or exactly level.",
  lead: <Hero
    colours={["#14233B", "#2C5F9E", "#9A3F55"]}
    why="A general election is not one national vote. It is 650 local contests, each won by whoever gets the most votes in that seat. That is why a party can win a majority of seats without a majority of votes, and why a close result can come down to a recount, or even a draw."
    stops={[
      { icon: IconVote, title: "You vote once", text: "For one candidate in your own constituency", colour: "#E2BE7A" },
      { icon: IconGroup, title: "Most votes wins the seat", text: "No need for more than half", colour: "#8DB7E8" },
      { icon: IconSearch, title: "The count checks it", text: "Ballots sorted, doubtful ones decided, close results recounted", colour: "#E59AA6" },
    ]}
    figures={[
      { value: "650", label: "Constituencies, one winner in each", sub: "Elections usually take place every 5 years" },
      { value: `${rejectedPct.toFixed(1)}%`, label: "Of ballots rejected in 2024", sub: `${GE2024.invalidVotes.toLocaleString("en-GB")} of ${(total / 1e6).toFixed(1)} million` },
      { value: "£500", label: "Deposit every candidate pays", sub: "Returned if they reach 5% of the votes" },
    ]}
  />,
  chapters: [
    {
      title: "One seat, one winner",
      lede: "At a general election you vote once, for a candidate in your constituency. The candidate with the most votes becomes your MP.",
      colour: "#2C5F9E",
      blocks: [
        { node: <Flow down numbered items={[
          { title: "You choose one candidate", text: "You vote once, for a candidate in your own constituency. There are 650 constituencies, and so 650 MPs.", colour: "#2C5F9E" },
          { title: "The votes are counted in each seat", text: "Each seat is counted on its own, by its own returning officer.", colour: "#5E4B8B" },
          { title: "The most votes wins", text: "The winner does not need more than half of the votes, only more than anyone else. This is called first past the post.", colour: "#A9701F" },
          { title: "The winners make the Commons", text: "The 650 winners together are the House of Commons.", colour: "#1F7A6E" },
        ]} /> },
        { text: [<>You can see every result since 1945 on the <a href="#/generalElection">general elections</a> page, and how to register and vote on <a href="#/howtovote">how to vote</a>.</>] },
      ],
    },
    {
      title: "Why votes and seats differ",
      lede: "Because every seat is a separate contest, a party's share of the seats does not have to match its share of the votes.",
      colour: "#9A3F55",
      blocks: [
        { node: <VoteSeatGap
          rows={[gap("Labour", "#D6224A"), gap("Reform UK", "#0E97B0"), gap("Liberal Democrat", "#E58A00"), gap("Green Party", "#4C9A2A")]}
          note="The 4 July 2024 general election result for the UK, from the Parliament results site. Shares of votes are of valid votes cast; shares of seats are of 650."
        /> },
        { text: ["In 2024 Labour won 63.2% of the seats on 33.7% of the votes, while Reform UK won 0.8% of the seats on 14.3%. First past the post only asks who comes first in each seat. Votes for a candidate who comes second count for nothing in the seat tally, and so do votes beyond the number a winner needed, so the seat share can end up a long way from the vote share."] },
        { text: [<>For how polls fit in, see <a href="#/polling">how to read an opinion poll</a>.</>] },
      ],
    },
    {
      title: "Other voting systems in the UK",
      lede: "First past the post is not the only way to count votes. Different bodies in the UK use different systems.",
      colour: "#5E4B8B",
      blocks: [
        { cards: [
          { title: "First past the post", icon: IconVote, colour: "#2C5F9E", text: "Voters pick one candidate and the one with the most votes wins. Used for the House of Commons, mayors in England, Police and Crime Commissioners and councils in England and Wales." },
          { title: "Additional Member System", icon: IconScales, colour: "#9A3F55", text: "Two votes: one for a local member, counted first-past-the-post, and one for a party list in a region. The list seats are added to make the result more proportional. Used for the Scottish Parliament and the London Assembly." },
          { title: "Single Transferable Vote", icon: IconGroup, colour: "#1F7A6E", text: "Voters rank candidates 1, 2, 3 in seats that elect more than one person. Candidates need a quota, and spare or wasted votes pass to second choices. Used in the Northern Ireland Assembly, in local elections in Scotland and Northern Ireland, and for Deputy Speakers." },
          { title: "Alternative Vote", icon: IconRegister, colour: "#A9701F", text: "Voters rank candidates. If nobody has over half the first choices, the lowest is dropped and their votes pass on, until someone has more than all the rest together. Used for most House of Commons committee chairs, the Lord Speaker and by-elections for hereditary peers." },
        ] },
      ],
    },
    {
      title: "What happens at the count",
      lede: "When polling stations close, the sealed ballot boxes go to a count venue, often a town hall or a sports centre, run by a returning officer whose job is to make sure the law is followed.",
      colour: "#1F7A6E",
      blocks: [
        { steps: [
          { title: "Check the numbers", text: "Each box is opened and its papers counted, to check the number matches what was sent from the polling station. This is called verification." },
          { title: "Mix the papers", text: "Papers from one box are mixed with those from at least one other, including postal votes, so nobody can tell how a particular area voted." },
          { title: "Sort into bundles", text: "Papers are sorted by candidate, kept face up so anyone watching can see what is going on, and each bundle is checked by more than one counting assistant. Rejected papers are set aside." },
          { title: "Share the provisional result", text: "Once the totals add up, the returning officer tells the candidates and their agents. This is the moment to ask for a recount." },
          { title: "Declare the winner", text: "The returning officer announces the winner in public and gives notice of the votes for each candidate and the number of rejected ballots." },
        ] },
        { text: ["Candidates, their agents and observers can be at the count, along with journalists. There is no official body that totals the votes on election night: the Electoral Commission publishes a report with the national figures some months afterwards."] },
      ],
    },
    {
      title: "Spoiled and rejected ballots",
      lede: "A ballot paper only counts if it is clear who the voter chose and that the paper is genuine.",
      colour: "#A9701F",
      blocks: [
        { compare: [
          { title: "Rejected", colour: "#9A3F55", items: [
            "The voter has voted for more than one person.",
            "The voter has identified themselves on the paper.",
            "It is not clear who has been voted for.",
            "The paper does not have the official mark showing it is genuine.",
          ] },
          { title: "Can still count", colour: "#1F7A6E", items: [
            "It is clear who the voter meant, but they used a tick or something other than an X.",
            "It is clear who the voter meant, but the mark is not in the proper box.",
            "In these cases the returning officer can decide whether the vote counts.",
          ] },
        ] },
        { facts: [
          { label: "Rejected ballots in 2024", value: GE2024.invalidVotes.toLocaleString("en-GB"), note: `About ${rejectedPct.toFixed(1)}% of the ${(total / 1e6).toFixed(1)} million ballot papers cast across the UK, according to the Parliament results site.` },
        ] },
      ],
    },
    {
      title: "Recounts and ties",
      lede: "When a result is close, any candidate or election agent can ask for the votes to be counted again.",
      colour: "#9A3F55",
      blocks: [
        { node: <Flow items={[
          { title: "A provisional result", text: "The returning officer tells candidates and agents, and makes clear they may ask for a recount.", colour: "#2C5F9E", icon: IconSearch },
          { title: "A candidate asks", text: "Usually because the result is close, or a candidate is close to losing their deposit.", colour: "#A9701F", icon: IconVote },
          { title: "The officer decides", text: "The returning officer must consider the request but can refuse if it seems unreasonable. There can be more than one recount.", colour: "#5E4B8B", icon: IconScales },
          { title: "A revised result", text: "Candidates and agents are told the new provisional figures in the same way before the declaration.", colour: "#1F7A6E", icon: IconRegister },
        ]} /> },
        { text: ["The returning officer may also offer candidates and agents the chance to look through the bundles of papers to reassure them the result is right, and can reconsider which papers should be rejected during a recount."] },
        { pull: "If two candidates have exactly the same number of votes, the returning officer decides between them by drawing lots.", colour: "#9A3F55" },
        { text: ["The method of drawing lots is up to the returning officer. One example is to put a folded ballot paper for each tied candidate in an empty ballot box, with an assistant raising it out of sight, then draw one out. The candidate drawn is treated as having received an extra vote and is declared elected. A note recording this is added to the result sheet. The officer announces the method first, and candidates, agents and observers can watch."] },
      ],
    },
    {
      title: "Deposits",
      lede: "Every candidate for Parliament pays a deposit, to discourage people with little chance of winning from standing.",
      colour: "#14233B",
      blocks: [
        { facts: [
          { label: "The deposit", value: "£500", note: "Returned if the candidate gets at least 5% of the votes. Since 1 October 1985, when it replaced a £150 deposit that needed 12.5%." },
          { label: "Lost in 2017", value: "47.5%", note: "1,568 candidates lost their deposit at the 2017 general election, a record proportion, and £784,000 went to the Consolidated Fund." },
        ] },
      ],
    },
  ],
  sources: [
    { label: "UK Parliament: Voting systems in the UK", url: "https://www.parliament.uk/about/how/elections-and-voting/voting-systems/", note: "First past the post, AMS, STV, AV and which bodies use them." },
    { label: "GOV.UK: General election", url: "https://www.gov.uk/elections-in-the-uk/general-election", note: "650 MPs, first past the post, elections every 5 years." },
    { label: "House of Commons Library: 2024 general election, what happens when the polls close", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-11099/", note: "The count, rejected ballots, recounts and declaring the result." },
    { label: "House of Commons Library: General election 2024 results", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-10009/", note: "Seats won by each party in 2024." },
    { label: "UK Parliament election results: 4 July 2024", url: "https://electionresults.parliament.uk/general-elections/6", note: "Votes, valid and rejected ballots by party, as copied into this site's data." },
    { label: "Electoral Commission: Provisional results and recounts", url: "https://www.electoralcommission.org.uk/guidance-acting-returning-officers-administering-a-uk-parliamentary-election-great-britain/verification-and-count/count/provisional-results-and-recounts", note: "Guidance for returning officers on recounts (Representation of the People Act 1983, Schedule 1 rule 46)." },
    { label: "Electoral Commission: Equality of votes", url: "https://www.electoralcommission.org.uk/guidance-acting-returning-officers-administering-a-uk-parliamentary-election-great-britain/verification-and-count/count/equality-votes", note: "Drawing lots when candidates tie (rule 49)." },
    { label: "House of Commons Library: Lost deposits in the 2017 general election", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-11842/", note: "The £500 deposit, the 5% threshold, its history and the 2017 figures." },
  ],
  checked: "12 November 2026",
};

export default function HowElectionsWork() {
  return <ExplainerPage {...PAGE} />;
}
