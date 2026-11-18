/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconAudit } from "../newIcons";
import { IconLedger, IconCommittee, IconBook, IconMethodology } from "../icons";
import { Hero } from "../story/Vivid";
import AuditBrowser from "../story/AuditBrowser";
import { useDataFile } from "../../lib/useDataFile";
import { auditReports, committeeReports } from "../../lib/dataFiles";
import { dateLong } from "../../lib/upcoming";

// The National Audit Office checks whether public money was spent well, and the Public Accounts Committee questions the government about what it finds. This page lists the
// Office's reports from the last 12 months (data/auditReports.json, fetch-audit-reports.js, refreshed daily from the Office's website) and the Committee's own reports with the
// government's replies (data/committeeReports.json). The page does not judge any department: it reports what the Office published, in the Office's own words.

const HEAD = {
  kicker: "How MPs behave",
  title: "The spending watchdog",
  subtitle: "Before Parliament can hold the government to account for how it spends public money, someone has to check. The National Audit Office does, and publishes what it finds. This page lists its reports, and what happens after.",
  icon: IconMethodology,
  look: "vivid",
};

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");
const PAC = /^Public Accounts Committee$/i;

function PacList({ reports, generated }) {
  if (!reports.length) return <p className="ac-empty">No Public Accounts Committee reports with a government reply due are listed for the last year.</p>;
  return (
    <ul className="ac-list">
      {reports.map((r) => {
        const reply = r.replies[0];
        const overdue = !reply && r.due < generated;
        return (
          <li key={r.id} className="ac-item" style={{ "--ac": reply ? "#3F7D5C" : overdue ? "#B3262E" : "#5B6784" }}>
            <h3><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></h3>
            <div className="ac-meta">
              <span>Report published <b>{dateLong(r.date)}</b></span>
              <span>Reply due <b>{dateLong(r.due)}</b></span>
              <span className="ac-chip">{reply ? `Government replied ${dateLong(reply.date)}` : overdue ? "No reply listed, deadline passed" : "Reply not yet due"}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function build(nao, committees) {
  const vfm = nao.byType.find((t) => t.name === "Value for money")?.count ?? 0;
  const accounts = nao.byType.find((t) => t.name === "Accounts audit")?.count ?? 0;
  const departments = [...new Set(nao.reports.flatMap((r) => r.departments))].sort((a, b) => a.localeCompare(b));
  const topDept = nao.byDepartment.filter((d) => d.name !== "Cross-government");
  const pac = committees ? committees.reports.filter((r) => PAC.test(r.committee)) : [];
  const pacReplied = pac.filter((r) => r.replies.length).length;
  const pacOverdue = committees ? pac.filter((r) => !r.replies.length && r.due < committees.generated).length : 0;

  const chapters = [
    {
      title: "Who checks the money?",
      lede: "Two bodies work as a pair. The first looks at the evidence; the second asks ministers and civil servants to explain it in public.",
      colour: "#2C7DA0",
      blocks: [
        { cards: [
          { title: "The National Audit Office", text: "An independent body that reports to Parliament. It audits government accounts and examines whether departments got value for money from what they spent.", colour: "#2C7DA0" },
          { title: "The Public Accounts Committee", text: "A committee of MPs that takes the Office's reports, questions the senior officials responsible in public, and writes recommendations.", colour: "#7B5BD6" },
          { title: "The government's reply", text: "The government replies to the Committee's recommendations in writing, and the reply is published. Whether anything changes depends on the government.", colour: "#C88A1E" },
        ] },
        { note: "The Office does not decide policy and cannot tell the government what to do. Its job is to say what happened to the money, and whether the result was worth it." },
      ],
    },
    {
      title: "What the Office published this year",
      lede: `${n(nao.total)} reports since ${dateLong(nao.from)}: ${n(vfm)} examining value for money, and ${n(accounts)} that audit accounts. The newest came out on ${dateLong(nao.reports[0].date)}.`,
      colour: "#7B5BD6",
      blocks: [
        { facts: [
          { label: "Reports in the last year", value: n(nao.total), note: "Everything the Office listed as a report." },
          { label: "Value for money studies", value: n(vfm), note: "Each looks at one programme or service and asks what it achieved for what it cost." },
          { label: "Account audits", value: n(accounts), note: "The Office's reports on the audit of a body's accounts." },
        ] },
        { bars: { items: topDept.slice(0, 8).map((d) => ({ label: d.name, value: d.count, text: n(d.count), colour: "#2C7DA0" })), max: Math.max(...topDept.map((d) => d.count)), note: `Reports by the department they are mainly about. A further ${n((nao.byDepartment.find((d) => d.name === "Cross-government") ?? { count: 0 }).count)} cover the whole of government.` } },
        { bars: { items: nao.byTopic.map((t) => ({ label: t.name, value: t.count, text: n(t.count), colour: "#C88A1E" })), max: Math.max(...nao.byTopic.map((t) => t.count)), note: "Reports by their main topic." } },
        { note: "A department with more reports is not necessarily doing worse. The Office chooses where to look, and larger budgets and bigger programmes get more attention." },
      ],
    },
    {
      title: "Every report, in the Office's words",
      lede: "Each card gives the Office's own one-sentence summary and a link to the full report. Search by a word, or pick a department.",
      colour: "#2C7DA0",
      blocks: [{ node: <AuditBrowser reports={nao.reports} departments={departments} /> }],
    },
  ];

  if (committees) {
    chapters.push({
      title: "What the Public Accounts Committee did with them",
      lede: pac.length
        ? `${n(pac.length)} of the Committee's reports in the last year had a government reply due. ${n(pacReplied)} have been answered${pacOverdue ? ` and ${n(pacOverdue)} are past their deadline with no reply listed` : ""}.`
        : "The Committee's own reports, with the date the government's reply was due.",
      colour: "#7B5BD6",
      blocks: [
        { node: <PacList reports={pac} generated={committees.generated} /> },
        { note: "A reply may arrive in a form that Parliament's list does not link to the report. A report shown without a reply may have been answered in a way this page cannot see. The full set of committee reports is on the committee reports page." },
        { node: <p className="st-note"><a href="#/committeeReports">All committee reports and replies</a> · <a href="#/departments">Spending by department</a> · <a href="#/govContracts">Government contracts</a></p> },
      ],
    });
  }

  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#B08A2E"]}
      why="Public money is only as well spent as it is checked. These reports are the evidence MPs use when they question ministers about spending."
      stops={[
        { icon: IconLedger, title: "Money is spent", text: "On services, projects and contracts", colour: "#8FD1A8" },
        { icon: IconAudit, title: "The Office checks", text: "Accounts, and value for money", colour: "#8DB7E8" },
        { icon: IconCommittee, title: "MPs question", text: "The Public Accounts Committee", colour: "#B9A5F0" },
        { icon: IconBook, title: "The government replies", text: "Public, in writing", colour: "#F0C77A" },
      ]}
      figures={[
        { value: n(nao.total), label: "Reports in the last year", sub: `Newest ${dateLong(nao.reports[0].date)}` },
        { value: n(vfm), label: "Value for money studies", sub: "what a programme achieved for its cost" },
        { value: pac.length ? `${n(pacReplied)} of ${n(pac.length)}` : "-", label: "Committee reports answered", sub: "of those with a reply due" },
      ]}
    />,
    chapters,
  };
}

export default function AuditWatch() {
  const nao = useDataFile(auditReports);
  const committees = useDataFile(committeeReports);
  if (!nao.data) return <ExplainerPage {...HEAD} chapters={[]} lead={nao.failed ? <LoadFailedNote item="the audit reports" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      {...build(nao.data, committees.data)}
      sources={[
        { label: "National Audit Office: reports", url: "https://www.nao.org.uk/reports/", note: "Every report, with its summary. Read from the Office's own website each day." },
        { label: "UK Parliament: Committees API", url: "https://committees-api.parliament.uk/index.html", note: "The Public Accounts Committee's reports and the government's replies." },
        { label: "UK Parliament: Public Accounts Committee", url: "https://committees.parliament.uk/committee/127/public-accounts-committee/", note: "The Committee's membership and inquiries." },
      ]}
      checked={dateLong(nao.data.generated)}
    />
  );
}
