/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconCivilService } from "../newIcons";
import { IconShield, IconBook, IconCompass, IconScales, IconCabinet, IconGroup } from "../icons";
import { Workforce } from "../story/CivilServiceArt";
import { Hero, Dots, Swap } from "../story/Vivid";

const PAGE = {
  look: "vivid",
  icon: IconCivilService,
  kicker: "Understand it",
  title: "The Civil Service",
  subtitle: "Ministers set the direction. The people who run the departments, write the advice and deliver the services are civil servants, and they stay when governments change. This page explains who they are, what they must not do, and how special advisers differ.",
  lead: <Hero
    colours={["#16255F", "#2F7BD6", "#7B3FA0"]}
    why="When a minister announces a policy, civil servants are the ones who make it work, and who tell the minister what will and will not. The rules about their impartiality are what stop a change of government becoming a change of everyone doing the job."
    stops={[
      { icon: IconCabinet, title: "Ministers", text: "Set the direction", colour: "#FF6B6B" },
      { icon: IconCivilService, title: "Civil servants", text: "Run the departments and write the advice", colour: "#5BA8FF" },
      { icon: IconGroup, title: "Public services", text: "Delivered every day, whoever governs", colour: "#4FD6A0" },
    ]}
    figures={[
      { value: "557,825", label: "Civil servants, 31 March 2026", sub: "523,795 in full-time equivalent terms" },
      { value: "67.8%", label: "Work in the five biggest departments", sub: "Justice, Work and Pensions, HMRC, Defence and the Home Office" },
      { value: "£37,820", label: "Median civil service salary", sub: "Up 6.0% on a year earlier" },
    ]}
  />,
  chapters: [
    {
      title: "Who they are",
      lede: "The latest official count, taken at the end of March 2026.",
      colour: "#2F7BD6",
      blocks: [
        { node: <Dots
          title="If the Civil Service were 100 people"
          note="Each dot is about 1 in 100 civil servants. The figures are rounded to the nearest dot."
          items={[
            { label: "Women", text: "54.7%", value: 54.7, colour: "#D6457F", note: "Of all civil servants." },
            { label: "Ethnic minority background", text: "19.2%", value: 19.2, colour: "#E8851F", note: "Up from 18.0% a year earlier." },
            { label: "Work in the five biggest departments", text: "67.8%", value: 67.8, colour: "#2E86C1", note: "Justice, Work and Pensions, HMRC, Defence and the Home Office." },
          ]}
        /> },
        { node: <Workforce /> },
        { text: ["The numbers are published once a year by the Cabinet Office. More than three quarters of civil servants are now at Executive Officer grade or above, against about three in five in 2016."] },
      ],
    },
    {
      title: "Ministers, civil servants and special advisers",
      lede: "Three kinds of people work in a government department. Their jobs, and how they get them, are different.",
      colour: "#8A4FD6",
      blocks: [
        { node: <Swap tiers={[
          { name: "Ministers", colour: "#FF6B6B", before: "Chosen by the Prime Minister", after: "A new set, chosen by the new Prime Minister" },
          { name: "Special advisers", colour: "#FFA53D", before: "Chosen by a minister", after: "A new set, chosen by the new ministers" },
          { name: "Civil servants", colour: "#5BA8FF", before: "Appointed on merit", after: "Still there, serving the new ministers", stays: true },
        ]} /> },
        { compare: [
          { title: "Ministers", colour: "#D6455F", items: [
            "Chosen by the Prime Minister, and answer to Parliament.",
            "Decide what the department does.",
            "Leave when the government changes.",
          ] },
          { title: "Civil servants", colour: "#2F7BD6", items: [
            "Appointed on merit after a fair and open competition. That is set out in law.",
            "Advise ministers and carry out their decisions.",
            "Accountable to ministers, who are accountable to Parliament. They stay when governments change.",
          ] },
          { title: "Special advisers", colour: "#E8741A", items: [
            "Chosen personally by a minister, with the Prime Minister's approval.",
            "Temporary civil servants whose job ends when the minister leaves office, or the day after an election at the latest.",
            "Appointed to assist that minister.",
          ] },
        ] },
      ],
    },
    {
      title: "The four values",
      lede: "The Civil Service Code sets the standard every civil servant is held to.",
      colour: "#12A07A",
      blocks: [
        { cards: [
          { title: "Integrity", icon: IconShield, colour: "#2F7BD6", text: "Putting the obligations of public service above your own personal interests." },
          { title: "Honesty", icon: IconBook, colour: "#12A07A", text: "Being truthful and open." },
          { title: "Objectivity", icon: IconCompass, colour: "#E8801F", text: "Basing your advice and decisions on rigorous analysis of the evidence." },
          { title: "Impartiality", icon: IconScales, colour: "#8A4FD6", text: "Acting solely according to the merits of the case, and serving equally well governments of different political persuasions." },
        ] },
        { text: ["A civil servant who is asked to act against the Code can raise the matter inside the department. If they do not get a reasonable response, they can report it to the Civil Service Commission."] },
      ],
    },
    {
      title: "Where this meets the rest of the site",
      lede: "Civil servants appear in several records here.",
      colour: "#E8801F",
      blocks: [
        { text: [<>When senior officials and ministers leave for jobs in industry, the rules are covered on <a href="#/revolvingDoor">ministers' later jobs</a>. Meetings with ministers are on <a href="#/ministerialMeetings">ministers' meetings</a>. Who holds which ministerial job is on <a href="#/offices">who held which job</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Civil Service statistics 2026 (statistical bulletin)", url: "https://www.gov.uk/government/statistics/civil-service-statistics-2026/statistical-bulletin-civil-service-statistics-2026", note: "Headcount, demographics, salary and the five largest departments, as at 31 March 2026." },
    { label: "GOV.UK: The Civil Service Code", url: "https://www.gov.uk/government/publications/civil-service-code/the-civil-service-code", note: "The four values and what they mean, accountability to ministers, and reporting to the Civil Service Commission." },
    { label: "Constitutional Reform and Governance Act 2010, section 10: selection on merit", url: "https://www.legislation.gov.uk/ukpga/2010/25/section/10" },
    { label: "Constitutional Reform and Governance Act 2010, section 15: special advisers", url: "https://www.legislation.gov.uk/ukpga/2010/25/section/15", note: "Chosen by the minister, approved by the Prime Minister, and when the appointment ends." },
  ],
  checked: "28 October 2026",
};

export default function CivilService() {
  return <ExplainerPage {...PAGE} />;
}
