/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconCommittee, IconBook, IconQuestion, IconRegister } from "../icons";
import { Flow } from "../story/StateArt";
import { Hero, Dots } from "../story/Vivid";
import ReportBrowser from "../story/ReportBrowser";
import { useDataFile } from "../../lib/useDataFile";
import { committeeReports } from "../../lib/dataFiles";
import { summary, byCommittee } from "../../lib/reportsView";
import { dateLong } from "../../lib/upcoming";

// Which select committee reports from the last 12 months have had a government reply, how long replies take and which are still waiting. Built from
// data/committeeReports.json (fetch-committee-reports.js, refreshed daily from Parliament's Committees API).

const HEAD = {
  kicker: "How Parliament works",
  title: "Committee reports and government replies",
  subtitle: "Select committees investigate a subject and publish a report with recommendations. The government has undertaken to reply, usually within two months. This page shows which reports from the last 12 months have had a reply, how long replies take, and which are still waiting.",
  icon: IconCommittee,
  look: "vivid",
};

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;

function build(data) {
  const s = summary(data);
  const committees = byCommittee(data).filter((c) => c.overdue > 0).slice(0, 8);
  const pct = (n) => Math.round((n / Math.max(1, s.total)) * 100);

  const chapters = [
    {
      title: "What happens to a report",
      lede: "A committee of MPs or peers can ask for evidence, publish what it finds and recommend changes. A report is only the start: it is the government's reply that shows what it will do about it.",
      colour: "#2C7DA0",
      blocks: [
        { node: <Flow numbered items={[
          { title: "A committee investigates", text: "It takes written and spoken evidence from ministers, officials, experts and the public.", colour: "#2C7DA0" },
          { title: "It publishes a report", text: "The report sets out what it found and recommends what the government should do.", colour: "#7B5BD6" },
          { title: "The government replies", text: "It has undertaken to respond to most reports within two months, though there are exceptions.", colour: "#C88A1E" },
          { title: "The committee publishes the reply", text: "The reply says which recommendations are accepted, and the committee can follow up.", colour: "#3F7D5C" },
        ]} /> },
      ],
    },
    {
      title: "The last 12 months of reports",
      lede: `${plural(s.total, "report")} published since ${dateLong(data.from)} have a government reply due. ${plural(s.due, "deadline")} ${s.due === 1 ? "has" : "have"} passed.`,
      colour: "#7B5BD6",
      blocks: [
        { node: <Dots title="Out of every 100 reports" items={[
          { label: "Replied by the deadline", value: pct(s.ontime), text: `${pct(s.ontime)}%`, colour: "#3F7D5C", note: `${s.ontime} reports` },
          { label: "Replied after the deadline", value: pct(s.late), text: `${pct(s.late)}%`, colour: "#C88A1E", note: `${s.late} reports` },
          { label: "No reply, deadline passed", value: pct(s.overdue), text: `${pct(s.overdue)}%`, colour: "#B3262E", note: `${s.overdue} reports` },
          { label: "Not yet due", value: pct(s.waiting), text: `${pct(s.waiting)}%`, colour: "#5B6784", note: `${s.waiting} reports` },
        ]} note="Each dot is one report in every hundred. A report counts as answered once Parliament lists a government response against it." /> },
        { facts: [
          { label: "Replies that came late", value: `${Math.round((s.late / Math.max(1, s.answered)) * 100)}%`, note: `${plural(s.late, "reply", "replies")} of the ${s.answered} so far came after the deadline.` },
          ...(s.late ? [{ label: "Typical lateness", value: `${s.medianLate} days`, note: "For replies that came after the deadline, how long after it the middle one came." }] : []),
        ] },
        { note: "Deadlines can be extended, and some replies come as letters or in a later paper that may not be linked to the report. A report shown as waiting may have been answered in a way this count does not see." },
      ],
    },
  ];

  if (committees.length) {
    chapters.push({
      title: "Which committees are waiting longest",
      lede: "The committees with the most reports that are past their deadline with no reply listed.",
      colour: "#B3262E",
      blocks: [{ bars: { items: committees.map((c) => ({ label: c.committee, value: c.overdue, text: `${c.overdue} of ${c.reports}`, colour: "#B3262E" })), max: Math.max(...committees.map((c) => c.overdue)), note: "Reports with no reply listed, out of all the committee's reports whose deadline has passed." } }],
    });
  }

  chapters.push({
    title: "Every report, and where it stands",
    lede: "Each card says who published the report, what it looked into, whether the government has replied and how long that took. Use the buttons to see only the ones still waiting, or search for a committee or a subject.",
    colour: "#2C7DA0",
    blocks: [
      { node: <ReportBrowser data={data} /> },
      { note: "This page shows when each report came out and when the government replied. It does not summarise what a report or reply says: the full text is on Parliament's website, and each card links straight to it." },
    ],
  });

  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#6B4FBF"]}
      why="Committees can only recommend. Whether anything changes depends on the government accepting the recommendations, and its reply is the public record of that."
      stops={[
        { icon: IconCommittee, title: "A committee investigates", text: "Evidence from ministers, experts and the public", colour: "#8DB7E8" },
        { icon: IconBook, title: "It publishes a report", text: "What it found, and what to change", colour: "#B9A5F0" },
        { icon: IconQuestion, title: "The government replies", text: "Usually within two months", colour: "#F0C77A" },
        { icon: IconRegister, title: "The reply is published", text: "Which recommendations are accepted", colour: "#8FD1A8" },
      ]}
      figures={[
        { value: `${Math.round(s.share * 100)}%`, label: "Reports answered so far", sub: `${s.answered} of ${s.due} with a deadline that has passed` },
        { value: `${s.medianWait} days`, label: "Typical wait for a reply", sub: "from the report to the first reply" },
        { value: String(s.overdue), label: "Past deadline, no reply", sub: "reports still waiting" },
      ]}
    />,
    chapters,
  };
}

export default function CommitteeReports() {
  const { data, failed } = useDataFile(committeeReports);
  if (!data) return <ExplainerPage {...HEAD} chapters={[]} lead={failed ? <LoadFailedNote item="the committee reports" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      {...build(data)}
      sources={[
        { label: "UK Parliament: Committees API, publications", url: "https://committees-api.parliament.uk/index.html", note: "Every report, its reply deadline and the government replies listed against it. Refreshed each day." },
        { label: "UK Parliament: Committees", url: "https://committees.parliament.uk/", note: "The full text of each report and reply." },
      ]}
      checked={dateLong(data.generated)}
    />
  );
}
