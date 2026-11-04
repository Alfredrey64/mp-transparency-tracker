/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconGavel, IconBook, IconRegister, IconVote } from "../icons";
import { Flow } from "../story/StateArt";
import { Hero, Dots } from "../story/Vivid";
import InstrumentBrowser from "../story/InstrumentBrowser";
import { useDataFile } from "../../lib/useDataFile";
import { statutoryInstruments } from "../../lib/dataFiles";
import { summary, monthName } from "../../lib/instrumentsView";
import { dateLong } from "../../lib/upcoming";

// How many statutory instruments (rules made by ministers under an Act) were laid before Parliament in the last 12 months, how each kind gets through Parliament, and the
// newest ones. Built from data/statutoryInstruments.json (fetch-statutory-instruments.js, refreshed daily from Parliament's Statutory Instruments API).

const HEAD = {
  kicker: "How Parliament works",
  title: "Laws made by ministers",
  subtitle: "Many Acts of Parliament let a minister fill in the detail by making rules called statutory instruments. This page shows how many were laid before Parliament in the last 12 months, how each kind gets through, and the newest ones.",
  icon: IconGavel,
  look: "vivid",
};

const n = (x) => x.toLocaleString("en-GB");

function build(data) {
  const s = summary(data);
  const pct = Math.round(s.shareApprove * 100);
  const p = data.procedures;
  const first = monthName(data.months[0].month);
  const lastLabel = monthName(data.months.at(-1).month);

  const chapters = [
    {
      title: "What a statutory instrument is",
      lede: "An Act of Parliament often sets the main rule and lets a minister decide the details later: a fee, a date, a list of things it covers. Those details are made as statutory instruments, which are laws too.",
      colour: "#2C7DA0",
      blocks: [
        { node: <Flow numbered items={[
          { title: "An Act gives a minister a power", text: "The Act says what the minister may decide, and how Parliament gets to check it.", colour: "#2C7DA0" },
          { title: "The minister writes the rules", text: "The rules are published as a statutory instrument, with a title and a number.", colour: "#7B5BD6" },
          { title: "It is laid before Parliament", text: "Laying means formally putting it before the Commons, the Lords or both.", colour: "#C88A1E" },
          { title: "Parliament approves it, or can object", text: "Which of the two depends on the Act that gave the power.", colour: "#3F7D5C" },
        ]} /> },
        { note: "The rule that an objection must come within 40 days comes from the Statutory Instruments Act 1946. Days when Parliament is dissolved, prorogued or adjourned by both Houses for more than four days do not count. Some Acts set a different period." },
      ],
    },
    {
      title: `${n(s.total)} in 12 months`,
      lede: `${n(s.total)} statutory instruments were laid between ${first} and ${lastLabel}. About ${pct} in every 100 had to be approved by Parliament; the rest went ahead unless a House objected.`,
      colour: "#7B5BD6",
      blocks: [
        { node: <Dots title="Out of every 100 instruments" items={[
          { label: "Parliament must approve", value: pct, text: `${pct}%`, colour: "#3F7D5C", note: `${n(s.approve)} instruments` },
          { label: "Goes ahead unless a House objects", value: 100 - pct, text: `${100 - pct}%`, colour: "#5B6784", note: `${n(s.object)} instruments` },
        ]} note="Each dot is one instrument in every hundred. Instruments that must be approved are the ones marked affirmative; the others are marked negative." /> },
        { facts: [
          { label: "A typical month", value: n(s.median), note: "instruments laid in the middle month of the twelve." },
          { label: "The busiest month", value: n(s.busiest.count), note: `laid in ${monthName(s.busiest.month)}.` },
        ] },
        { bars: { items: data.months.map((m) => ({ label: monthName(m.month).replace(/ 20(\d\d)$/, " ’$1"), value: m.approve + m.object, text: n(m.approve + m.object), colour: "#7B5BD6" })), max: Math.max(...data.months.map((m) => m.approve + m.object)), note: `Instruments laid each month. ${lastLabel} is not over yet, and few are laid while Parliament is in recess.` } },
      ],
    },
    {
      title: "The four kinds",
      lede: "The name tells you two things: whether it is a draft that Parliament sees before it takes effect or is already made, and whether Parliament must approve it (affirmative) or can only object (negative).",
      colour: "#C88A1E",
      blocks: [
        { facts: Object.entries(data.kinds).map(([name, k]) => ({ label: name, value: n(p[name] ?? 0), note: k.say })) },
        { note: "Whether an instrument was debated, or whether anyone tried to stop it, is not shown here. Each card links to the instrument on legislation.gov.uk, and Parliament's website has its debates and votes." },
      ],
    },
    {
      title: "The newest instruments",
      lede: "The most recent ones laid before Parliament, with the department that laid each. Use the buttons to see only those Parliament must approve, or search by title or department.",
      colour: "#2C7DA0",
      blocks: [{ node: <InstrumentBrowser data={data} /> }],
    },
  ];

  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#6B4FBF"]}
      why="A great deal of detailed law is made this way, so how Parliament checks it matters. Some kinds need Parliament's approval and some go ahead unless someone objects."
      stops={[
        { icon: IconBook, title: "An Act gives a power", text: "A minister may fill in the detail", colour: "#8DB7E8" },
        { icon: IconRegister, title: "The minister makes rules", text: "Published as a statutory instrument", colour: "#B9A5F0" },
        { icon: IconGavel, title: "It is laid before Parliament", text: "Put before the Commons, the Lords or both", colour: "#F0C77A" },
        { icon: IconVote, title: "Approved, or open to objection", text: "Depending on the Act", colour: "#8FD1A8" },
      ]}
      figures={[
        { value: n(s.total), label: "Laid in 12 months", sub: `${first} to ${lastLabel}` },
        { value: `${pct}%`, label: "Had to be approved", sub: `${n(s.approve)} instruments` },
        { value: n(s.median), label: "In a typical month", sub: "the middle month of the twelve" },
      ]}
    />,
    chapters,
  };
}

export default function StatutoryInstruments() {
  const { data, failed } = useDataFile(statutoryInstruments);
  if (!data) return <ExplainerPage {...HEAD} chapters={[]} lead={failed ? <LoadFailedNote item="the statutory instruments" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      {...build(data)}
      sources={[
        { label: "UK Parliament: Statutory Instruments API", url: "https://statutoryinstruments-api.parliament.uk/index.html", note: "Every instrument laid, how it goes through Parliament and the department that laid it. Refreshed each day." },
        { label: "legislation.gov.uk: Statutory Instruments Act 1946", url: "https://www.legislation.gov.uk/ukpga/Geo6/9-10/36/contents", note: "The rules for laying instruments and for the 40 days in which a House may object." },
        { label: "legislation.gov.uk: statutory instruments", url: "https://www.legislation.gov.uk/uksi", note: "The text of each instrument." },
      ]}
      checked={dateLong(data.generated)}
    />
  );
}
