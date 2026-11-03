/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconInquiry } from "../newIcons";
import { IconGavel, IconGroup, IconRegister, IconBook } from "../icons";
import { Hero } from "../story/Vivid";
import InquiryList from "../story/InquiryList";

const PAGE = {
  look: "vivid",
  icon: IconInquiry,
  kicker: "Watchdogs",
  title: "Public inquiries",
  subtitle: "When something goes badly wrong, ministers can set up a public inquiry to find out what happened and why. This page lists eight well-known inquiries, says why each began and what it led to, and explains how inquiries are set up, how long they take, what they cost and what happens to what they recommend.",
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
      title: "Eight inquiries and what came of them",
      lede: "For each inquiry: why it started, what it found, and what followed. They are a selection of well-known ones, not the full list, and each card links to the source it was written from.",
      colour: "#B3262E",
      blocks: [
        { node: <InquiryList /> },
        { note: "Some of these are still reporting, so what followed is still unfolding. The Institute for Government keeps a list of every inquiry ongoing or announced, linked under Sources at the foot of this page. Where the sources checked did not say something, such as a government reply, this page leaves it out rather than guess." },
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
        { text: ["The eight inquiries above show how different the answers can be. The Grenfell recommendations were all accepted and are tracked in public, with 21 of 61 complete in May 2026. The child sexual abuse inquiry's recommendations were accepted bar one, with some set to be consulted on first. After Southport, the government set out changes already under way and promised a response to the recommendations for national government. The Post Office inquiry's urgent recommendations asked for a reply by a set date."] },
      ],
    },
    {
      title: "How to follow an inquiry",
      lede: "Reports are only the start. These are the places to look for what happens next.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "The inquiry's own website", text: "Every inquiry that is running has one, with hearing dates, evidence and reports. Some publish the recommendations as a separate document." },
          { title: "The government's reply", text: "After a report, look for the government's published response and for any later progress report. For Grenfell, the government publishes progress reports regularly." },
          { title: "Parliament", text: "Select committees can ask ministers what they have done. See Committee reports and government replies." },
        ] },
        { node: (
          <ul className="st-sources">
            <li><a href="#/committeeReports">Committee reports and government replies</a><span>How the government answers the committees that scrutinise it.</span></li>
            <li><a href="#/watchdogs">Watchdogs</a><span>The permanent bodies that check the government.</span></li>
          </ul>
        ) },
      ],
    },
  ],
  sources: [
    { label: "Institute for Government: Public inquiries", url: "https://www.instituteforgovernment.org.uk/explainer/public-inquiries", note: "How inquiries are set up, their powers, duration, cost, number and recommendations, and a list of those ongoing and announced. First published 13 February 2025, last updated 15 September 2026." },
    { label: "House of Commons Library: how much do public inquiries cost and how long do they last?", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-10981/", note: "Costs and timings of each statutory inquiry." },
    { label: "GOV.UK: The Southport Inquiry Phase 1 report", url: "https://www.gov.uk/government/speeches/the-southport-inquiry-phase-1-report", note: "Why it was set up, the findings and the government's response." },
    { label: "Post Office Horizon IT Inquiry", url: "https://www.postofficehorizoninquiry.org.uk/about-inquiry", note: "Why it was set up, when it became statutory and the Volume 1 announcement of 8 July 2025." },
    { label: "GOV.UK: UK Covid-19 Inquiry Modules 2, 2A, 2B and 2C report", url: "https://www.gov.uk/government/publications/uk-covid-19-inquiry-core-decision-making-and-political-governance-modules-2-2a-2b-2c-report", note: "What the inquiry is and when its second report came out." },
    { label: "GOV.UK: Thirlwall Inquiry report", url: "https://www.gov.uk/government/publications/thirlwall-inquiry-report", note: "Why it was set up, when it sat and when it reported." },
    { label: "GOV.UK: Government response to the Infected Blood Inquiry", url: "https://www.gov.uk/government/publications/government-response-to-the-infected-blood-inquiry/government-response-to-the-infected-blood-inquiry-html", note: "The findings, the recommendations and what the government has done." },
    { label: "GOV.UK: Grenfell Tower Inquiry Phase 2 annual report, February 2026", url: "https://www.gov.uk/government/publications/grenfell-tower-inquiry-government-annual-report-february-2026/grenfell-tower-inquiry-phase-2-annual-report-february-2026", note: "The recommendations and the progress on cladding removal." },
    { label: "GOV.UK: Grenfell Tower Inquiry progress report, May 2026", url: "https://www.gov.uk/government/publications/grenfell-tower-inquiry-government-progress-report-may-2026/progress-report-may-2026-summary-update", note: "How many recommendations are complete or in progress." },
    { label: "GOV.UK: Government response to the final report of the Independent Inquiry into Child Sexual Abuse", url: "https://www.gov.uk/government/publications/response-to-the-final-report-of-the-independent-inquiry-into-child-sexual-abuse/government-response-to-the-final-report-of-the-independent-inquiry-into-child-sexual-abuse", note: "The recommendations and what the government accepted, May 2023." },
    { label: "GOV.UK: statement on the Iraq Inquiry, 6 July 2016", url: "https://www.gov.uk/government/speeches/pm-statement-on-the-iraq-inquiry-6-july-2016", note: "The report's size, findings and the changes the government cited." },
  ],
  checked: "3 November 2026",
};

export default function Inquiries() {
  return <ExplainerPage {...PAGE} />;
}
