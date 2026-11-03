/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconInquiry } from "../newIcons";
import { IconGavel, IconGroup, IconRegister, IconBook } from "../icons";
import { Hero } from "../story/Vivid";
import ShareBar from "../story/ShareBar";

const PAGE = {
  look: "vivid",
  icon: IconInquiry,
  kicker: "Watchdogs",
  title: "Public inquiries",
  subtitle: "When something goes badly wrong, ministers can set up a public inquiry to find out what happened and why. This page explains how an inquiry is set up, what powers it has, how long and how much they usually take, and what happens to what they recommend.",
  lead: <Hero
    colours={["#3A1F4A", "#7A4A8C", "#2C7DA0"]}
    why="Public inquiries are how the state investigates its own failures, from disasters to scandals. They can force witnesses to speak and publish what they find. They also cost a great deal and often take years, so it matters what happens afterwards."
    stops={[
      { icon: IconGavel, title: "A minister announces it", text: "After a disaster, a scandal or public pressure", colour: "#B9A5F0" },
      { icon: IconGroup, title: "A chair is chosen", text: "Run independently of the government", colour: "#8DB7E8" },
      { icon: IconRegister, title: "Terms of reference", text: "The questions it must answer", colour: "#F0C77A" },
      { icon: IconBook, title: "Evidence and a report", text: "Often with recommendations", colour: "#8FD1A8" },
    ]}
    figures={[
      { value: "27", label: "Inquiries ongoing or announced", sub: "in January 2026, according to the Institute for Government" },
      { value: "3 years", label: "Typical time to report", sub: "just over, for completed inquiries since 1990" },
      { value: "£1.5bn+", label: "Spent on completed inquiries", sub: "at least, between 1990 and 2024, in 2024 prices" },
    ]}
  />,
  chapters: [
    {
      title: "What a public inquiry is",
      lede: "A public inquiry is an official investigation into events of public concern. A government minister sets it up, but it is run independently of the government.",
      colour: "#7A4A8C",
      blocks: [
        { route: true, steps: [
          { title: "A minister announces it", text: "The UK government or a devolved government sets up an inquiry, usually after a disaster, a scandal or public pressure." },
          { title: "A chair is chosen", text: "The minister who sets the inquiry up picks the chair. The inquiry cannot start its real work without one." },
          { title: "Terms of reference set the questions", text: "They say what the inquiry must look at, what information it wants, and often when it should report." },
          { title: "It gathers evidence and reports", text: "It hears witnesses, collects documents and publishes a report, which may include recommendations." },
        ] },
        { more: { title: "Statutory and non-statutory inquiries", text: [
          "Most inquiries are statutory, set up under the Inquiries Act 2005. That gives them powers to compel witnesses to give evidence and to make people hand over documents.",
          "A non-statutory inquiry has no such powers and cannot take evidence under oath. Statutory inquiries have taken about twice as long as non-statutory ones on average.",
        ] } },
        { note: "Ministers can remove a chair or end an inquiry, but the Institute for Government says no minister has ever used that power." },
      ],
    },
    {
      title: "How long they take and what they cost",
      lede: "Inquiries vary hugely. Some report in weeks, others take more than a decade.",
      colour: "#2C7DA0",
      blocks: [
        { bars: { items: [
          { label: "The shortest: the Hammond Inquiry", value: 45, text: "45 days", colour: "#3F7D5C" },
          { label: "The average, for completed inquiries since 1990", value: 1095, text: "just over 3 years", colour: "#2C7DA0" },
          { label: "The longest: hyponatraemia-related deaths", value: 4836, text: "13 years and 3 months", colour: "#7A4A8C" },
        ], max: 4836, note: "Bars are drawn to the same scale, in days." } },
        { facts: [
          { label: "Spent since 1990", value: "£1.5bn+", note: "At least this much on completed inquiries by the UK and devolved governments between 1990 and 2024, in 2024 prices." },
          { label: "The Bloody Sunday Inquiry", value: "£272.5m", note: "Given as an example of a very expensive inquiry, in 2024 prices." }
        ] },
        { node: <ShareBar title="How an inquiry's costs split" items={[
          { label: "Legal staff", value: 36, text: "36%", colour: "#7A4A8C" },
          { label: "Everything else", value: 64, text: "64%", colour: "#8A93A6" },
        ]} note="An average over the National Audit Office sample, as a share of total costs." /> },
        { note: "Totals like these only cover inquiries that have finished. Inquiries still running, such as the UK Covid-19 Inquiry, publish their costs to date on their own websites." },
      ],
    },
    {
      title: "What happens to the recommendations",
      lede: "An inquiry exists to find out what happened. What changes afterwards depends on what it recommends and whether anyone acts.",
      colour: "#B45A3C",
      blocks: [
        { facts: [
          { label: "Inquiries making recommendations", value: "54", note: "Between 1990 and 2024." },
          { label: "Recommendations made", value: "3,175", note: "By those 54 inquiries." },
        ] },
        { text: ["Not every inquiry has to make recommendations: it depends on its terms of reference. The Institute for Government's explainer does not say whether governments must act on what is recommended, and no single list shows how many recommendations have been carried out."] },
        { cards: [
          { title: "Ask what happened next", text: "After a report, look for the government's published response and for any later progress report from the inquiry or the department." },
          { title: "Parliament can follow up", text: "Select committees can ask ministers what they have done. See Committee reports and replies." },
        ] },
      ],
    },
    {
      title: "How to follow an inquiry",
      lede: "Every inquiry that is running has its own website with hearing dates, evidence and reports.",
      colour: "#3F7D5C",
      blocks: [
        { node: (
          <ul className="st-sources">
            <li><a href="https://www.instituteforgovernment.org.uk/explainer/public-inquiries" target="_blank" rel="noreferrer">Institute for Government: Public inquiries</a><span>The explainer this page draws on, with a list of inquiries ongoing and announced.</span></li>
            <li><a href="https://commonslibrary.parliament.uk/research-briefings/cbp-10981/" target="_blank" rel="noreferrer">House of Commons Library: how much do public inquiries cost and how long do they last?</a><span>Costs and timings of each statutory inquiry.</span></li>
            <li><a href="#/committeeReports">Committee reports and government replies</a><span>How the government answers the committees that scrutinise it.</span></li>
            <li><a href="#/watchdogs">Watchdogs</a><span>The permanent bodies that check the government.</span></li>
          </ul>
        ) },
      ],
    },
  ],
  sources: [
    { label: "Institute for Government: Public inquiries", url: "https://www.instituteforgovernment.org.uk/explainer/public-inquiries", note: "How inquiries are set up, their powers, duration, cost, number and recommendations. First published 13 February 2025, last updated 15 September 2026." },
  ],
  checked: "2 November 2026",
};

export default function Inquiries() {
  return <ExplainerPage {...PAGE} />;
}
