/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconCommittee } from "../icons";
import { useDataFile } from "../../lib/useDataFile";
import { committeeReports } from "../../lib/dataFiles";
import { summary, byCommittee, overdue, recentReplies } from "../../lib/reportsView";
import { dateLong } from "../../lib/upcoming";

// Which select committee reports from the last 12 months have had a government reply, how long replies take and which are still waiting. Built from
// data/committeeReports.json (fetch-committee-reports.js, refreshed daily from Parliament's Committees API).

const HEAD = {
  kicker: "How Parliament works",
  title: "Committee reports and government replies",
  subtitle: "Select committees investigate a subject and publish a report with recommendations. The government has undertaken to reply, usually within two months. This page shows which reports from the last 12 months have had a reply, how long replies take, and which are still waiting.",
  icon: IconCommittee,
  look: "field",
};

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;

function build(data) {
  const s = summary(data);
  const waiting = overdue(data);
  const committees = byCommittee(data).filter((c) => c.overdue > 0).slice(0, 8);
  const recent = recentReplies(data, 8);

  const chapters = [
    {
      title: "What happens to a report",
      lede: "A committee of MPs or peers can ask for evidence, publish what it finds and recommend changes. A report is only the start: it is the government's reply that shows what it will do about it.",
      colour: "#2C7DA0",
      blocks: [
        { steps: [
          { title: "A committee investigates", text: "It takes written and spoken evidence from ministers, officials, experts and the public." },
          { title: "It publishes a report", text: "The report sets out what it found and recommends what the government should do." },
          { title: "The government replies", text: "It has undertaken to respond to most reports within two months, though there are exceptions." },
          { title: "The committee publishes the reply", text: "The reply says which recommendations are accepted, and the committee can follow up." },
        ] },
      ],
    },
    {
      title: "The last 12 months of reports",
      lede: `${plural(s.total, "report")} published since ${dateLong(data.from)} have a government reply due. ${plural(s.due, "deadline")} ${s.due === 1 ? "has" : "have"} passed.`,
      colour: "#7B5BD6",
      blocks: [
        { bars: { items: [
          { label: "Reply by the deadline", value: s.ontime, text: String(s.ontime), colour: "#3F7D5C" },
          { label: "Reply after the deadline", value: s.late, text: String(s.late), colour: "#C88A1E" },
          { label: "No reply yet, deadline passed", value: s.overdue, text: String(s.overdue), colour: "#B3262E" },
          { label: "Not yet due", value: s.waiting, text: String(s.waiting), colour: "#8A93A8" },
        ], max: s.total, note: "Number of reports in each group. A report counts as answered once Parliament lists a government response against it." } },
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
      blocks: [{ bars: { items: committees.map((c) => ({ label: c.committee, value: c.overdue, text: `${c.overdue} of ${c.reports}`, colour: "#B3262E" })), max: Math.max(...committees.map((c) => c.overdue)), note: "Reports with no reply listed, out of the committee's reports whose deadline has passed." } }],
    });
  }

  if (waiting.length) {
    chapters.push({
      title: "Reports still waiting for a reply",
      lede: `${plural(waiting.length, "report")} ${waiting.length === 1 ? "is" : "are"} past ${waiting.length === 1 ? "its" : "their"} deadline with no reply listed. The ${Math.min(12, waiting.length)} that have waited longest:`,
      colour: "#C88A1E",
      blocks: [{ timeline: waiting.slice(0, 12).map((r) => ({
        when: `Due ${dateLong(r.due)}`,
        text: <><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a><small className="up-stage">{r.committee}. {r.daysOver} days past the deadline.</small></>,
      })) }],
    });
  }

  if (recent.length) {
    chapters.push({
      title: "The latest replies",
      lede: "The most recent government replies listed, and how long each took.",
      colour: "#3F7D5C",
      blocks: [{ timeline: recent.map((r) => ({
        when: dateLong(r.replied),
        text: <><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a><small className="up-stage">{r.committee}. Reply came {r.took} days after the report.</small></>,
      })) }],
    });
  }

  return {
    tiles: [
      { label: "Reports answered so far", value: `${Math.round(s.share * 100)}%`, colour: "#3F7D5C", sub: `${s.answered} of ${s.due} with a deadline that has passed` },
      { label: "Typical wait for a reply", value: `${s.medianWait} days`, colour: "#7B5BD6", sub: "from the report to the first reply" },
      { label: "Past deadline, no reply", value: String(s.overdue), colour: "#B3262E", sub: "reports still waiting" },
    ],
    why: { colour: "#2C7DA0", text: "Committees can only recommend. Whether anything changes depends on the government accepting the recommendations, and its reply is the public record of that." },
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
