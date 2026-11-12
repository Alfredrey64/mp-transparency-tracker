/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconBook, IconGavel, IconScales, IconVote, IconSearch, IconRegister } from "../icons";
import { Flow } from "../story/StateArt";
import { Hero } from "../story/Vivid";
import LAW from "../../data/lawExample.json";

// The explanations of each stage are Parliament's own, from the "How does a bill become a law?" guide on parliament.uk, read on 12 November 2026. The journey is a real Act:
// frontend/src/data/lawExample.json is rebuilt every day by fetch-bill-stages.js, which picks a recent Act with a full journey from Parliament's Bills API, so the dates and the
// number of stages below come from the data and the page keeps working when the Act changes. Nothing here says what the Act does beyond its own long title.

const fmt = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const days = (a, b) => Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000);

const stages = LAW.stages;
const firstDay = stages[0].dates[0];
const span = days(firstDay, LAW.royalAssent);
const pingPong = stages.filter((s) => /^Consideration of/i.test(s.stage)).length;
const startedIn = LAW.bill.originatingHouse || "Commons";
const longTitle = LAW.bill.longTitle ? LAW.bill.longTitle.replace(/^A Bill to /, "An Act to ") : null;

const when = (s) => (s.dates.length > 1 ? `${fmt(s.dates[0])} to ${fmt(s.dates[s.dates.length - 1])}` : s.dates[0] ? fmt(s.dates[0]) : "");
const house = (s) => (s.house === "Unassigned" ? "Both Houses" : s.house);
const title = (s) => (/^Consideration of .*amendments/i.test(s.stage) ? `${house(s)}: ${s.stage.replace(/ and \/ or reasons/, " or reasons")}` : s.stage === "Royal Assent" ? "Royal Assent" : `${house(s)}: ${s.stage}`);
const journey = stages.filter((s) => s.dates.length).map((s) => ({ when: when(s), text: title(s) }));

const PAGE = {
  look: "vivid",
  icon: IconBook,
  kicker: "How laws are made",
  title: "How a law is made, step by step",
  subtitle: "A new law starts as a bill, and a bill has to get through every stage in both Houses of Parliament before it becomes an Act. This page explains each stage in Parliament's own words, then follows one real Act from its first reading to Royal Assent, with the dates.",
  lead: <Hero
    colours={["#1C2A44", "#8A5A1F", "#2F6B52"]}
    why="Nobody can make a law alone. A bill has to be debated and voted on in the Commons and in the Lords, in the same form, and then receive Royal Assent. Following a real one shows how many separate steps that is."
    stops={[
      { icon: IconRegister, title: "Introduced", text: "The bill is read out and printed", colour: "#E2BE7A" },
      { icon: IconScales, title: "Examined twice over", text: "Debated, studied line by line and amended in both Houses", colour: "#8DB7E8" },
      { icon: IconGavel, title: "Agreed and signed", text: "Both Houses agree the exact wording, then the King gives Royal Assent", colour: "#9ED4B6" },
    ]}
    figures={[
      { value: "2", label: "Houses that must agree", sub: "The Commons and the Lords, in the same form" },
      { value: String(journey.length), label: "Stages in the Act followed here", sub: LAW.bill.shortTitle },
      { value: `${span} days`, label: "From first reading to Royal Assent", sub: `${fmt(firstDay)} to ${fmt(LAW.royalAssent)}` },
    ]}
  />,
  chapters: [
    {
      title: "What a bill is",
      lede: "A bill is a proposal for a new law, or a change to an existing one, presented for debate before Parliament.",
      colour: "#1C2A44",
      blocks: [
        { text: ["A bill can start in the Commons or in the Lords and must be approved in the same form by both Houses before it becomes an Act, which is the law itself."] },
        { node: <Flow down numbered items={[
          { title: "First reading", text: "The bill is formally introduced, with no debate.", colour: "#2C5F9E" },
          { title: "Second reading", text: "The first chance to debate its main principles.", colour: "#5E4B8B" },
          { title: "Committee stage", text: "Examined clause by clause, with amendments.", colour: "#A9701F" },
          { title: "Report stage and third reading", text: "A further chance to amend, then a final debate.", colour: "#9A3F55" },
          { title: "The other House", text: "The same stages again in the second House.", colour: "#1F7A6E" },
          { title: "Agreement and Royal Assent", text: "Both Houses agree the exact wording, and the bill becomes an Act.", colour: "#1C2A44" },
        ]} /> },
        { text: [<>For the bigger picture of how Parliament works, see <a href="#/howitworks">how Parliament works</a>. Laws can also be made by ministers without a vote on a bill: see <a href="#/statutoryInstruments">laws made by ministers</a>.</>] },
      ],
    },
    {
      title: `One real Act: ${LAW.bill.shortTitle}`,
      lede: `It started in the ${startedIn} and received Royal Assent on ${fmt(LAW.royalAssent)}. These are the days each stage took place, from Parliament's bills database.`,
      colour: "#8A5A1F",
      blocks: [
        ...(longTitle ? [{ text: [`In its own words, it is ${longTitle.charAt(0).toLowerCase()}${longTitle.slice(1)}`.replace(/\.?$/, ".")] }] : []),
        { timeline: journey },
        { text: [<>The full record, with the text of every version of the bill, is on <a href={LAW.bill.url} target="_blank" rel="noopener noreferrer">Parliament's page for this bill</a>.</>] },
      ],
    },
    {
      title: "In the House of Commons",
      lede: "Most bills go through these five stages in the Commons. Here is what Parliament says happens at each one. Bills that are fast-tracked get less consideration, and a Consolidated Fund Bill has no committee stage at all.",
      colour: "#2C5F9E",
      blocks: [
        { cards: [
          { title: "First reading", icon: IconRegister, colour: "#2C5F9E", text: "A formality, with no debate. The short title of the bill is read out, and the bill is ordered to be printed. It can take place at any time in a parliamentary session." },
          { title: "Second reading", icon: IconVote, colour: "#5E4B8B", text: "The first chance for MPs to debate the main principles of the bill. A minister or the MP responsible opens, and the official Opposition responds. At the end the Commons votes on whether the bill goes on." },
          { title: "Committee stage", icon: IconSearch, colour: "#A9701F", text: "Detailed examination, line by line. Most bills go to a Public Bill Committee, which can take evidence from experts and outside groups if the bill started in the Commons. Only committee members vote on amendments. A minority of bills are dealt with by the whole House." },
          { title: "Report stage", icon: IconScales, colour: "#9A3F55", text: "A chance for the whole House to consider further amendments to a bill that has been examined in committee. All MPs may speak, vote and suggest amendments or new clauses." },
          { title: "Third reading", icon: IconGavel, colour: "#1F7A6E", text: "The final chance for the Commons to debate the bill. It usually follows report stage on the same day, the debate is usually short, and the Commons cannot make amendments at this stage." },
        ] },
      ],
    },
    {
      title: "In the House of Lords",
      lede: "The Lords go through the bill again in the same order, but some of the rules are different.",
      colour: "#9A3F55",
      blocks: [
        { cards: [
          { title: "First reading", icon: IconRegister, colour: "#2C5F9E", text: "Another formality with no debate. The long title, which says what the bill is for, is read out by the member in charge of it." },
          { title: "Second reading", icon: IconVote, colour: "#5E4B8B", text: "The first chance for members of the Lords to debate its key principles and main purpose. Any member can speak, and the debate usually lasts a few hours, but can stretch over a couple of days." },
          { title: "Committee stage", icon: IconSearch, colour: "#A9701F", text: "Line-by-line examination of every part of the bill. Every member of the Lords can take part. The government cannot restrict the subjects discussed or impose a time limit, which is a key difference from the Commons." },
          { title: "Report stage", icon: IconScales, colour: "#9A3F55", text: "A further chance for all members to examine and amend the bill, usually starting 14 days after committee stage ends." },
          { title: "Third reading", icon: IconGavel, colour: "#1F7A6E", text: "A chance to tidy up the bill so that the law works and has no loopholes. Unlike in the Commons, amendments can be made here, as long as the issue was not fully considered and voted on earlier." },
        ] },
      ],
    },
    {
      title: "Ping pong",
      lede: "If the second House changes the bill, the first House has to consider those changes.",
      colour: "#1F7A6E",
      blocks: [
        { text: ["The Commons and the Lords may disagree with each other's amendments or suggest alternatives. A bill may go back and forth between the Houses until both agree the exact wording. This is known as ping pong."] },
        { pull: pingPong
          ? `In this Act the two Houses considered each other's changes ${pingPong} times, starting on ${fmt(stages.find((s) => /^Consideration of/i.test(s.stage)).dates[0])}, before Royal Assent on ${fmt(LAW.royalAssent)}.`
          : "This Act needed no ping pong: the second House made no changes the first had to consider.",
        colour: "#1F7A6E" },
        { text: ["In exceptional cases, when the two Houses do not reach agreement, the bill falls. If certain conditions are met, the Commons can use the Parliament Acts to pass the bill without the Lords' consent in the following session."] },
        { text: [<>The Parliament Acts, and the Speaker's part in them, are explained on <a href="#/speakerWhipsClerks">the Speaker, whips and clerks</a>.</>] },
      ],
    },
    {
      title: "Royal Assent",
      lede: "When a bill has completed every stage in both Houses, the King formally agrees to make it an Act of Parliament.",
      colour: "#1C2A44",
      blocks: [
        { text: ["There is no set time between the end of ping pong and Royal Assent. When it is given, the Lord Speaker announces it in the Lords and the Speaker in the Commons."] },
        { facts: [
          { label: "Royal Assent given", value: fmt(LAW.royalAssent), note: LAW.bill.shortTitle },
        ] },
        { text: ["Being an Act does not always mean the law applies at once. It may come into effect immediately, after a set period, or only when a minister makes a commencement order. If there is no commencement order, an Act comes into force from midnight at the start of the day it received Royal Assent."] },
      ],
    },
  ],
  sources: [
    { label: "UK Parliament: How does a bill become a law?", url: "https://www.parliament.uk/about/how/laws/passage-bill/", note: "Every stage in the Commons and the Lords, ping pong and Royal Assent." },
    { label: `UK Parliament Bills: ${LAW.bill.shortTitle}`, url: LAW.bill.url, note: "The dates of each stage for the Act followed here, from Parliament's Bills API." },
  ],
  checked: "12 November 2026",
};

export default function HowLawMade() {
  return <ExplainerPage {...PAGE} />;
}
