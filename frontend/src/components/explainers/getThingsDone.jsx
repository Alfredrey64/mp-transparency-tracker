/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconSignpost } from "../newIcons";
import { IconDoor, IconScales, IconCalendar } from "../icons";
import { Hero } from "../story/Vivid";

const PAGE = {
  look: "vivid",
  narrow: true,
  icon: IconSignpost,
  kicker: "Rules and rights",
  title: "How to get something done",
  subtitle: "A practical guide to who to contact when something is wrong: a council service, the NHS, a government department, the police. It also explains how to ask a public body for information, and what to do when the first answer is no.",
  lead: <Hero
    colours={["#0F3B33", "#1F6F5C", "#2C7DA0"]}
    why="Most problems with public services are settled by the body that caused them, if you go to the right place in the right order. Almost every route has a time limit, and skipping a step can mean being sent back to the start."
    stops={[
      { icon: IconDoor, title: "Go to the body first", text: "The service that runs it gets the first chance", colour: "#8FD1A8" },
      { icon: IconScales, title: "Then the ombudsman or regulator", text: "Free, and independent of the body", colour: "#8DB7E8" },
      { icon: IconCalendar, title: "Watch the time limits", text: "Skipping a step can send you back", colour: "#F0C77A" },
    ]}
    figures={[
      { value: "12 months", label: "To complain to the council ombudsman", sub: "the usual time limit from when you first knew about the problem" },
      { value: "20 days", label: "A public body should answer an information request in", sub: "working days, usually" },
      { value: "6 weeks", label: "To complain to the ICO after a refusal", sub: "from the response or your last contact with the body" },
    ]}
  />,
  chapters: [
    {
      title: "Start with the right person",
      lede: "Who can help depends on who is responsible. A rule of thumb: the body that runs the service is the first place to complain.",
      colour: "#1F6F5C",
      blocks: [
        { compare: [
          { title: "Your council", colour: "#1F6F5C", items: [
            "County councils run education, transport, planning, social care, libraries, waste management and trading standards.",
            "District, borough and city councils handle rubbish collection, recycling, Council Tax, housing and planning applications.",
            "Unitary authorities, London boroughs and metropolitan boroughs provide all of these in one council.",
            "Parish, community and town councils look after allotments, bus shelters, community centres and play areas.",
          ] },
          { title: "Your MP", colour: "#7B5BD6", items: [
            "For a complaint about a UK government department, the Parliamentary Ombudsman needs an MP to refer it.",
            "For the NHS in England you can go to the Ombudsman directly or ask your MP to pass it on.",
            "Use Find your MP on this site to see who yours is.",
          ] },
          { title: "The police", colour: "#2C7DA0", items: [
            "Contact the police force you want to complain about, or call 101.",
            "The Independent Office for Police Conduct only independently investigates the most serious and sensitive matters, such as deaths and serious injuries.",
          ] },
        ] },
      ],
    },
    {
      title: "Complain about a council",
      lede: "The Local Government and Social Care Ombudsman looks at complaints about councils in England once the council has had its chance to put things right.",
      colour: "#B45A3C",
      blocks: [
        { route: true, steps: [
          { title: "Complain to the council service", text: "Tell the service that did the thing. Say what happened and what you want." },
          { title: "Then the complaints officer", text: "If you are still unhappy, go to the council's complaints officer." },
          { title: "Then the Ombudsman", text: "You can ask the Local Government and Social Care Ombudsman to look at it. It is free." },
        ] },
        { facts: [
          { label: "Time limit", value: "12 months", note: "The Ombudsman cannot normally look at a complaint if more than 12 months have passed since you first knew about the problem." },
          { label: "If the council is slow", value: "16 weeks", note: "The Ombudsman also takes a complaint if the council has not replied in a reasonable time, which in most cases it thinks should be up to 16 weeks. Some complaints, such as in children's services, take longer." },
        ] },
        { note: "Council housing complaints go to the Housing Ombudsman instead. If you live in Scotland, Wales or Northern Ireland, a different ombudsman applies." },
      ],
    },
    {
      title: "Complain about the NHS or a government department",
      lede: "The Parliamentary and Health Service Ombudsman looks at complaints about the NHS in England and about UK government departments. It expects you to go to the organisation first.",
      colour: "#2C7DA0",
      blocks: [
        { route: true, steps: [
          { title: "Complain to the organisation", text: "The hospital, GP practice or department should get the chance to look into your concerns first." },
          { title: "For the NHS, go to the Ombudsman or your MP", text: "You can complain to the Ombudsman directly, or ask your MP to pass the complaint on." },
          { title: "For a government department, ask your MP", text: "An MP has to refer the complaint. You can fill in the Ombudsman's form and ask your MP or their office to sign it." },
        ] },
        { note: "The Ombudsman generally looks at cases brought within a year of when you first knew you wanted to complain. Its site lists current waiting times, which can be several months." },
      ],
    },
    {
      title: "Complain about the police",
      lede: "A complaint about the police usually starts with the force itself.",
      colour: "#5A4FCF",
      blocks: [
        { cards: [
          { title: "Where to complain", text: "To the force directly, by phone on 101, at a police station, or through the Independent Office for Police Conduct, which passes it to the force." },
          { title: "Ask for it to be recorded", text: "You can ask for your complaint to be formally recorded, which gives it formal status under the Police Reform Act 2002." },
          { title: "Reviews and appeals", text: "The force should tell you in writing whether you have the right to ask for a review and by when. Check the deadline it gives you." },
          { title: "Compensation", text: "The police complaints body does not deal with compensation. For that you contact the force concerned directly." },
        ] },
      ],
    },
    {
      title: "Ask for information",
      lede: "You have the right to ask a public body for recorded information it holds, under the Freedom of Information Act. You do not have to say which law you are using.",
      colour: "#C88A1E",
      blocks: [
        { route: "down", steps: [
          { title: "Check it is not already public", text: "Look at the body's website, its disclosure log and WhatDoTheyKnow first." },
          { title: "Write a clear, simple request", text: "Ask for specific recorded information. Numbered points help. If the body asks you to clarify, the clock does not start until you do." },
          { title: "Wait up to 20 working days", text: "Public bodies usually need to reply within 20 working days. They can extend to weigh the public interest, but must tell you within the first 20 days." },
          { title: "If you are unhappy, ask for an internal review", text: "Write to the body and explain why you disagree. It should usually reply within another 20 working days. Act promptly: it could refuse if you wait more than 40 working days." },
          { title: "Then complain to the Information Commissioner", text: "Within six weeks of the review outcome or your last substantive contact. The ICO assesses independently, does not act as your representative and does not award compensation." },
          { title: "Last, a tribunal", text: "If you still disagree after the ICO's decision, you can appeal to the First-tier Tribunal (Information Rights)." },
        ] },
        { facts: [
          { label: "Cost limit, central government", value: "£600", note: "A body can refuse a request that would cost more than this to answer. It also covers Parliament and the armed forces." },
          { label: "Cost limit, other bodies", value: "£450", note: "For other public authorities." },
        ] },
        { note: "A body can also refuse a request that is vexatious or repeated, or say it does not hold the information. Information about the environment is handled under separate regulations, with up to 40 working days for complex requests, and information a body holds about you is requested under data protection law." },
      ],
    },
    {
      title: "More help on this site",
      lede: "These pages help you find the right person or understand the body you are dealing with.",
      colour: "#3F7D5C",
      blocks: [
        { node: (
          <ul className="st-sources">
            <li><a href="#/myMP">Find your MP</a><span>Who represents you, and how to contact them.</span></li>
            <li><a href="#/councillors">Your councillors</a><span>The people to ask about council services.</span></li>
            <li><a href="#/watchdogs">Watchdogs</a><span>The bodies that regulate and check public services.</span></li>
            <li><a href="#/committeeReports">Committee reports and government replies</a><span>How committees press the government to act.</span></li>
          </ul>
        ) },
      ],
    },
  ],
  sources: [
    { label: "Local Government and Social Care Ombudsman: how to complain", url: "https://www.lgo.org.uk/how-to-complain", note: "The steps, the 12 month limit and when it will look at a complaint." },
    { label: "GOV.UK: Understand how your council works", url: "https://www.gov.uk/understand-how-your-council-works/services-your-council-provides", note: "What each kind of council provides." },
    { label: "Parliamentary and Health Service Ombudsman: complaints about the NHS", url: "https://www.ombudsman.org.uk/complaints-about-nhs-getting-started", note: "Complain to the organisation first; direct or through an MP." },
    { label: "Parliamentary and Health Service Ombudsman: complaints about UK government departments", url: "https://www.ombudsman.org.uk/complaints-about-uk-government-departments-getting-started", note: "An MP must refer the complaint." },
    { label: "Independent Office for Police Conduct: guide to the complaints process", url: "https://www.policeconduct.gov.uk/complaints/guide-to-complaints-process", note: "Where to complain and what the IOPC investigates." },
    { label: "Information Commissioner's Office: what to expect after making an information request", url: "https://ico.org.uk/for-the-public/official-information/what-to-expect-after-making-an-information-request/", note: "The 20 working day limit, fees and reasons for refusal." },
    { label: "Information Commissioner's Office: what to do if you are dissatisfied with the response", url: "https://ico.org.uk/for-the-public/official-information/what-to-do-if-you-are-dissatisfied-with-the-response/", note: "Internal review, the complaint to the ICO and the tribunal." },
  ],
  checked: "2 November 2026",
};

export default function GetThingsDone() {
  return <ExplainerPage {...PAGE} />;
}
