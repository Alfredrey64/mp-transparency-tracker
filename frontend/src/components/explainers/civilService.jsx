/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconCivilService } from "../newIcons";

const PAGE = {
  icon: IconCivilService,
  kicker: "Understand it",
  title: "The Civil Service",
  subtitle: "Ministers set the direction. The people who run the departments, write the advice and deliver the services are civil servants, and they stay when governments change. This page explains who they are, what they must not do, and how special advisers differ.",
  tiles: [
    { label: "Civil servants, 31 March 2026", value: "557,825", colour: "#6FB1FF", sub: "523,795 in full-time equivalent terms" },
    { label: "Share of the workforce in the five biggest departments", value: "67.8%", colour: "#FFB45E", sub: "Justice, Work and Pensions, HMRC, Defence and the Home Office" },
    { label: "Median civil service salary", value: "£37,820", colour: "#3F7D5C", sub: "up 6.0% on a year earlier" },
  ],
  why: { colour: "#5A7FA6", text: "When a minister announces a policy, civil servants are the ones who make it work, and who tell the minister what will and will not. The rules about their impartiality are what stop a change of government becoming a change of everyone doing the job." },
  chapters: [
    {
      title: "Who they are",
      lede: "The latest official count, taken at the end of March 2026.",
      colour: "#5A7FA6",
      blocks: [
        { facts: [
          { label: "Women", value: "54.7%", note: "Of all civil servants." },
          { label: "Ethnic minority background", value: "19.2%", note: "Up from 18.0% a year earlier." },
          { label: "Median age", value: "43", note: "One year younger than in 2025." },
          { label: "Joined in 2025 to 2026", value: "42,855", note: "Against 37,945 who left." },
        ] },
        { text: ["The numbers are published once a year by the Cabinet Office. More than three quarters of civil servants are now at Executive Officer grade or above, against about three in five in 2016."] },
      ],
    },
    {
      title: "Ministers, civil servants and special advisers",
      lede: "Three kinds of people work in a government department. Their jobs, and how they get them, are different.",
      colour: "#6E4B6E",
      blocks: [
        { compare: [
          { title: "Ministers", colour: "#9C3B3B", items: [
            "Chosen by the Prime Minister, and answer to Parliament.",
            "Decide what the department does.",
            "Leave when the government changes.",
          ] },
          { title: "Civil servants", colour: "#5A7FA6", items: [
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
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "Integrity", text: "Putting the obligations of public service above your own personal interests." },
          { title: "Honesty", text: "Being truthful and open." },
          { title: "Objectivity", text: "Basing your advice and decisions on rigorous analysis of the evidence." },
          { title: "Impartiality", text: "Acting solely according to the merits of the case, and serving equally well governments of different political persuasions." },
        ] },
        { text: ["A civil servant who is asked to act against the Code can raise the matter inside the department. If they do not get a reasonable response, they can report it to the Civil Service Commission."] },
      ],
    },
    {
      title: "Where this meets the rest of the site",
      lede: "Civil servants appear in several records here.",
      colour: "#9C6B30",
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
