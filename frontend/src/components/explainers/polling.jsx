/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconPoll } from "../newIcons";

const PAGE = {
  icon: IconPoll,
  kicker: "Elections",
  title: "How to read an opinion poll",
  subtitle: "Opinion polls shape the news long before an election. This page does not report the latest poll, because they change weekly. It explains what a poll measures, why a poll of votes is not a forecast of seats, and how the polls did at the last election.",
  tiles: [
    { label: "Labour's share of the vote, 4 July 2024", value: "33.7%", colour: "#FF7A8A", sub: "9.7 million votes" },
    { label: "Labour's share of the seats", value: "63.2%", colour: "#FFB45E", sub: "411 of 650 seats" },
    { label: "Reform UK: share of the vote and of the seats", value: "14.3% and 0.8%", colour: "#6FB1FF", sub: "4.1 million votes, 5 seats" },
  ],
  why: { colour: "#5A7FA6", text: "A poll that says one party is on 30% sounds like a fact. It is an estimate from a few thousand people, adjusted by the pollster, about votes rather than seats. Knowing that makes headlines easier to judge." },
  chapters: [
    {
      title: "What a poll is",
      lede: "A small group of people is asked how they would vote, and their answers are adjusted to stand in for everyone.",
      colour: "#5A7FA6",
      blocks: [
        { steps: [
          { title: "A sample is chosen", text: "Pollsters recruit a sample, often a thousand or two thousand adults, through online panels or by phone. It is not a perfect random draw." },
          { title: "The answers are weighted", text: "If the sample has too few young people, or too many graduates, the pollster counts some answers for more or less so the sample matches the population." },
          { title: "Some are left out", text: "People who say they won't vote, or don't know, are handled in ways that differ between companies. This is a large source of differences between polls." },
          { title: "The result is an estimate", text: "Even for a perfect random sample of 1,000 people, the standard margin of error is about three percentage points either way. Real polls are less tidy than that, so the true uncertainty is larger." },
        ] },
        { pull: "The British Polling Council is an association of polling organisations that publish polls and are committed to promoting transparency in polling. Its members commit to disclosure standards so that readers can judge how reliable a poll is." },
      ],
    },
    {
      title: "Votes are not seats",
      lede: "A poll asks about votes. Seats are decided constituency by constituency, so the two can be very different.",
      colour: "#9C3B3B",
      blocks: [
        { bars: { items: [
          { label: "Labour: share of votes", value: 33.7, text: "33.7%", colour: "#C13A4E" },
          { label: "Labour: share of seats", value: 63.2, text: "63.2%", colour: "#C13A4E" },
          { label: "Reform UK: share of votes", value: 14.3, text: "14.3%", colour: "#2BA6A6" },
          { label: "Reform UK: share of seats", value: 0.8, text: "0.8%", colour: "#2BA6A6" },
          { label: "Liberal Democrat: share of votes", value: 12.2, text: "12.2%", colour: "#E8741A" },
          { label: "Liberal Democrat: share of seats", value: 11.1, text: "11.1%", colour: "#E8741A" },
        ], max: 100, note: "The 4 July 2024 general election result for the UK, from the Parliament results site. Shares of votes are of valid votes cast; shares of seats are of 650." } },
        { text: [<>A national poll cannot say who wins a seat. Some polls are used to build a model of the seats, called MRP: it estimates results for each constituency from a very large sample. Such models are estimates built on assumptions, not counts. See <a href="#/generalElection">general elections</a> for results since 1945.</>] },
      ],
    },
    {
      title: "How the polls did in 2024",
      lede: "The industry's own body says the polls overestimated the size of Labour's lead.",
      colour: "#9C6B30",
      blocks: [
        { pull: "The British Polling Council's page on the 2024 general election says that overall the industry polling overestimated the Labour lead." },
        { text: [
          "The Council's page collects each member's own review of what went wrong and what they are changing, and says it will be updated as more evidence, including the random-probability British Election Study, becomes available.",
          "A lead is the gap between two parties. A small error in each party's share becomes a larger error in the gap, which is one reason a lead can look much more wrong than the shares do.",
        ] },
      ],
    },
    {
      title: "Reading a poll in the news",
      lede: "Five questions to ask before trusting a number.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "Who ran it?", text: "Is the company a member of the British Polling Council, and has it published its tables?" },
          { title: "How many, and when?", text: "Check the sample size and the dates. A poll taken a fortnight ago may be out of date." },
          { title: "What exactly was asked?", text: "\"If there were an election tomorrow\" and \"which party do you prefer\" are different questions." },
          { title: "A trend, not a point", text: "One poll moving by a point or two is usually noise. Look at several polls over weeks." },
          { title: "Votes or seats?", text: "A vote share says little about seats unless it comes from a model that says how it was built." },
        ] },
      ],
    },
  ],
  sources: [
    { label: "UK Parliament: results of the 4 July 2024 general election", url: "https://electionresults.parliament.uk/general-elections/6", note: "Votes and seats by party, used for the shares on this page." },
    { label: "British Polling Council: about the Council", url: "https://www.britishpollingcouncil.org/about/", note: "What the Council is and its disclosure aim." },
    { label: "British Polling Council: the 2024 general election", url: "https://www.britishpollingcouncil.org/the-2024-general-election/", note: "That the industry overestimated the Labour lead, and members' own reviews." },
  ],
  checked: "28 October 2026",
  narrow: true,
};

export default function Polling() {
  return <ExplainerPage {...PAGE} />;
}
