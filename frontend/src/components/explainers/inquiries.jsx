/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconInquiry } from "../newIcons";

const PAGE = {
  look: "field",
  icon: IconInquiry,
  kicker: "Watchdogs",
  title: "Public inquiries",
  subtitle: "When something goes badly wrong, ministers can set up a public inquiry to find out what happened and why. This page explains how an inquiry is set up, what powers it has, how long and how much they usually take, and what happens to what they recommend.",
  tiles: [
    { label: "Inquiries ongoing or announced", value: "27", colour: "#6FB1FF", sub: "in January 2026, according to the Institute for Government" },
    { label: "Typical time to report", value: "3 years", colour: "#FFB45E", sub: "just over, for completed inquiries since 1990" },
    { label: "Spent on completed inquiries", value: "£1.5bn+", colour: "#FF7A8A", sub: "at least, between 1990 and 2024, in 2024 prices" },
  ],
  why: { colour: "#7A4A8C", text: "Public inquiries are how the state investigates its own failures, from disasters to scandals. They can force witnesses to speak and publish what they find. They also cost a great deal and often take years, so it matters what they achieve." },
  chapters: [
    {
      title: "What a public inquiry is",
      lede: "A public inquiry is an official investigation into events of public concern. A government minister sets it up, but it is run independently of the government.",
      colour: "#7A4A8C",
      blocks: [
        { steps: [
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
        { facts: [
          { label: "Average time to report", value: "3 years", note: "Just over three years for completed inquiries since 1990." },
          { label: "The shortest", value: "45 days", note: "The Hammond Inquiry." },
          { label: "The longest", value: "13 years", note: "The inquiry into hyponatraemia-related deaths took 13 years and three months." },
        ] },
        { facts: [
          { label: "Spent since 1990", value: "£1.5bn+", note: "At least this much on completed inquiries by the UK and devolved governments between 1990 and 2024, in 2024 prices." },
          { label: "The Bloody Sunday Inquiry", value: "£272.5m", note: "Given as an example of a very expensive inquiry, in 2024 prices." },
          { label: "Lawyers' share", value: "36%", note: "Legal staff accounted for an average of 36% of total costs in a National Audit Office sample." },
        ] },
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
