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
  subtitle: "Groups of MPs and peers, called select committees, check up on the government. They investigate a subject, publish a report and say what should change. The government is meant to reply within about two months. This page explains how that works, and shows every report from the last 12 months and whether it has had a reply.",
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
      title: "Who checks the government?",
      lede: "A select committee is a small group of MPs, or of peers, who watch one part of government: a department, or a subject such as health or defence. They ask ministers and experts questions, then write a report. The report says what they found and what the government should do about it.",
      colour: "#2C7DA0",
      blocks: [
        { cards: [
          { title: "They ask questions", text: "Ministers, officials, experts and members of the public give evidence, in writing and in person.", colour: "#2C7DA0" },
          { title: "They write a report", text: "It says what the committee found, and lists recommendations for the government.", colour: "#7B5BD6" },
          { title: "They wait for an answer", text: "The government has agreed to reply in writing, normally within two months.", colour: "#C88A1E" },
        ] },
        { note: "Committees cannot make the government do anything. Their power is to ask in public, report in public, and press for an answer." },
      ],
    },
    {
      title: "What happens after a report comes out?",
      lede: "The report is only the start. The government's reply is what shows whether anything will change.",
      colour: "#7B5BD6",
      blocks: [
        { node: <Flow numbered items={[
          { title: "The committee publishes its report", text: "It sets out what it found and what it recommends.", colour: "#2C7DA0" },
          { title: "The government has about two months to reply", text: "The deadline is shown on each report below.", colour: "#C88A1E" },
          { title: "The reply says yes, no or not yet", text: "For each recommendation, the government says whether it accepts it, turns it down or will think about it.", colour: "#7B5BD6" },
          { title: "The committee can follow up", text: "It can publish the reply and question ministers again if it is not satisfied.", colour: "#3F7D5C" },
        ]} /> },
        { more: { title: "Does the government have to do what a report says?", text: [
          "No. A report is a set of recommendations, not orders. The government can accept them, turn them down, or accept some and not others.",
          "What the government has agreed to do is reply. That is why this page tracks replies: a late or missing reply means the public record of the government's answer is late or missing too.",
        ] } },
      ],
    },
    {
      title: "Do replies arrive on time?",
      lede: `${plural(s.total, "report")} published since ${dateLong(data.from)} have a government reply due. The deadline has passed for ${s.due} of them, and ${s.answered} of those have had a reply.`,
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
    title: "Every report, in plain English",
    lede: "Each card shows who wrote the report and whether the government has replied. Press a card to see what the report is about, who the committee is and the dates, with links to the report and any reply. Use the buttons to see only the ones still waiting, or search for a committee or a subject.",
    colour: "#2C7DA0",
    blocks: [
      { node: <ReportBrowser data={data} /> },
      { note: "The \u201Cwhat it is about\u201D text is the committee's own description of its inquiry, tidied up. This page does not summarise what a report or reply says or whether the government agreed: the full text is on Parliament's website, and each card links straight to it." },
    ],
  });

  chapters.push({
    title: "What you can do",
    lede: "If a report is about something you care about, you can read it, and the reply, in full. You can also tell your MP what you think, or give evidence to a committee when it asks.",
    colour: "#3F7D5C",
    blocks: [{ node: <p className="st-note"><a href="#/committees">See the committees and who sits on them</a> · <a href="#/myMP">Find your MP</a></p> }],
  });

  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#6B4FBF"]}
      why="Committees can only recommend. Whether anything changes depends on the government, and its reply is the public record of what it will do."
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
