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

// What a statutory instrument is, why ministers are allowed to make them, how Parliament still checks them, how many there are and the newest ones. Built from
// data/statutoryInstruments.json (fetch-statutory-instruments.js, refreshed daily from Parliament's Statutory Instruments API and legislation.gov.uk). The reasons, the four
// procedures, the rule that an instrument cannot be amended and the record of rejections (as of June 2022) are from the Hansard Society's guide to delegated legislation.

const HEAD = {
  kicker: "How Parliament works",
  title: "Laws made by ministers",
  subtitle: "Most people picture a law being passed by a vote in Parliament. A lot of everyday law is made another way: a minister writes it, using a power an earlier Act gave them. This page explains why that is allowed, how Parliament still checks it, and what has been made lately.",
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
      title: "Why can a minister make a law?",
      lede: "Because Parliament said they could. When MPs and peers pass an Act, the Act can include a power: the minister may make rules about this. The rules a minister writes with that power are called a statutory instrument, or SI for short. It is real law, and you have to follow it.",
      colour: "#2C7DA0",
      blocks: [
        { node: <Flow numbered items={[
          { title: "Parliament passes an Act", text: "MPs and peers debate and vote on it. It sets the main rules, and can give a minister a power to fill in the detail.", colour: "#2C7DA0" },
          { title: "The minister uses the power", text: "They write the detail as an SI: a fee, a date, a list, how a process works.", colour: "#7B5BD6" },
          { title: "Parliament checks it", text: "How depends on what the Act says. Parliament either has to approve it, or it can object.", colour: "#3F7D5C" },
        ]} /> },
        { text: ["Here is a real example. The Misuse of Drugs Act 1971 sets up the classes of illegal drugs. When a new drug needs to be controlled, a statutory instrument adds it to the right class. It does not take a whole new Act."] },
      ],
    },
    {
      title: "Why not put it all in the Act?",
      lede: "Parliament does not have the time to write every technical detail into law, and Acts would become longer and harder to follow if it tried. So it sets the framework in the Act and leaves the detail to ministers.",
      colour: "#C88A1E",
      blocks: [
        { cards: [
          { title: "Parliament has limited time", text: "Every fee, date and list written into an Act would use up more of the time MPs and peers have.", colour: "#C88A1E" },
          { title: "Acts stay readable", text: "An Act packed with technical detail is harder for anyone to follow, including the people it affects.", colour: "#2C7DA0" },
          { title: "Detail changes", text: "A list of controlled drugs, a fee or a council's wards can be updated with an SI, without waiting for a new Act.", colour: "#3F7D5C" },
        ] },
        { pull: "Used well, this is how a modern government works. The worry is when big decisions are made this way with little scrutiny." },
        { note: "That is the Hansard Society's view in short: delegated legislation is necessary, and a problem when it is misused." },
      ],
    },
    {
      title: "How does Parliament still check them?",
      lede: "The Act that gives the power also says how Parliament gets its say. There are two routes, and the Act picks one.",
      colour: "#3F7D5C",
      blocks: [
        { compare: [
          { title: "Parliament has to say yes", colour: "#3F7D5C", items: [
            "This is called the affirmative route. Both Houses usually have to approve it, normally after a debate and a vote.",
            "A draft cannot become law until it is approved. One already made as law stops being law unless it is approved within a set time, usually 28 or 40 days.",
            `${pct}% of the instruments laid in the last 12 months were of this kind.`,
          ] },
          { title: "It goes ahead unless someone objects", colour: "#5B6784", items: [
            "This is called the negative route. No vote is needed. If neither House objects within 40 days (not counting recesses), it stands.",
            "Most are already law when Parliament sees them. They are normally laid at least 21 days before they take effect. There is no guarantee of a debate in the Commons.",
            `${100 - pct}% of the instruments laid in the last 12 months were of this kind.`,
          ] },
        ] },
        { text: ["Either way, Parliament cannot change the wording. With very few exceptions it can only accept an instrument or reject it."] },
        { facts: [
          { label: "Rejected since 1950", value: "16", note: "As of June 2022: 11 by the Commons and 5 by the Lords." },
          { label: "Last rejected by the Commons", value: "1979", note: "No instrument has been rejected by the Commons since then, as of June 2022." },
        ] },
        { more: { title: "Who reads them before MPs vote?", text: [
          "Committees of MPs and peers read instruments and report on them. The Joint Committee on Statutory Instruments looks at the technical and legal points, and the Lords Secondary Legislation Scrutiny Committee looks at the policy behind them.",
          "Other committees look at the powers in a Bill before it becomes an Act: the Lords Delegated Powers and Regulatory Reform Committee and the Lords Constitution Committee.",
        ] } },
      ],
    },
    {
      title: "What are people worried about?",
      lede: "Supporters and critics mostly agree on how the system works. They disagree about whether it is checked enough.",
      colour: "#B3262E",
      blocks: [
        { compare: [
          { title: "The case for", colour: "#3F7D5C", items: [
            "Parliament can spend its time on principles and big decisions.",
            "Technical detail can be kept up to date without a new Act each time.",
            "Acts stay shorter and easier to read.",
          ] },
          { title: "The worries", colour: "#B3262E", items: [
            "Parliament can only accept or reject, so a small problem can mean rejecting the whole instrument.",
            "Rejections are very rare, so in practice almost all go through.",
            "On the negative route there is no vote and no guaranteed debate.",
            "Some powers, called Henry VIII powers, let a minister change an Act of Parliament itself. Critics say that challenges Parliament's place as the only law-maker. Some uses are purely technical.",
          ] },
        ] },
        { note: "Whether the checks are enough is a political argument, and people differ. This page sets out how the system works and what has been made." },
      ],
    },
    {
      title: `How many are there? ${n(s.total)} in 12 months`,
      lede: `${n(s.total)} statutory instruments were laid between ${first} and ${lastLabel}. About ${pct} in every 100 had to be approved by Parliament. The rest went ahead unless a House objected.`,
      colour: "#7B5BD6",
      blocks: [
        { node: <Dots title="Out of every 100 instruments" items={[
          { label: "Parliament must approve", value: pct, text: `${pct}%`, colour: "#3F7D5C", note: `${n(s.approve)} instruments` },
          { label: "Goes ahead unless a House objects", value: 100 - pct, text: `${100 - pct}%`, colour: "#5B6784", note: `${n(s.object)} instruments` },
        ]} note="Each dot is one instrument in every hundred." /> },
        { facts: [
          { label: "A typical month", value: n(s.median), note: "instruments laid in the middle month of the twelve." },
          { label: "The busiest month", value: n(s.busiest.count), note: `laid in ${monthName(s.busiest.month)}.` },
        ] },
        { bars: { items: data.months.map((m) => ({ label: monthName(m.month).replace(/ 20(\d\d)$/, " \u2019$1"), value: m.approve + m.object, text: n(m.approve + m.object), colour: "#7B5BD6" })), max: Math.max(...data.months.map((m) => m.approve + m.object)), note: `Instruments laid each month. ${lastLabel} is not over yet, and few are laid while Parliament is in recess.` } },
      ],
    },
    {
      title: "What the four names mean",
      lede: "Every instrument has one of four labels. \u201CDraft\u201D means Parliament sees it before it is law, and \u201Cmade\u201D means it is already law when Parliament sees it. \u201CAffirmative\u201D means Parliament must approve it, and \u201Cnegative\u201D means it can only object.",
      colour: "#C88A1E",
      blocks: [
        { facts: Object.entries(data.kinds).map(([name, k]) => ({ label: name, value: n(p[name] ?? 0), note: k.say })) },
      ],
    },
    {
      title: "What has been made lately",
      lede: "The most recent instruments laid before Parliament. Press any one to see what it does and where to read it in full. Some are put into plainer English by an AI tool, always with the Government's own words kept beside it. Use the buttons to see only those Parliament must approve.",
      colour: "#2C7DA0",
      blocks: [
        { node: <InstrumentBrowser data={data} /> },
        { note: "Whether an instrument was debated, or whether anyone tried to stop it, is not shown here. Parliament's website has its debates and votes." },
      ],
    },
    {
      title: "What you can do",
      lede: "If an instrument affects something you care about, you can read it in full on legislation.gov.uk (every entry above links there) and tell your MP what you think.",
      colour: "#3F7D5C",
      blocks: [{ node: <p className="st-note"><a href="#/myMP">Find your MP</a></p> }],
    },
  ];

  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#6B4FBF"]}
      why="Parliament passes the main rules in Acts and leaves the detail to ministers. That saves time, but those details are checked more lightly than an Act, so it helps to know how it works."
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
        { label: "Hansard Society: delegated legislation, frequently asked questions", url: "https://hansardsociety.org.uk/publications/guides/delegated-legislation-frequently-asked-questions", note: "Why Parliament delegates, the four procedures, that instruments cannot be amended and how rarely they are rejected (figures as of June 2022)." },
        { label: "UK Parliament: Statutory Instruments API", url: "https://statutoryinstruments-api.parliament.uk/index.html", note: "Every instrument laid, how it goes through Parliament and the department that laid it. Refreshed each day." },
        { label: "legislation.gov.uk: Statutory Instruments Act 1946", url: "https://www.legislation.gov.uk/ukpga/Geo6/9-10/36/contents", note: "The rules for laying instruments and for the 40 days in which a House may object." },
        { label: "legislation.gov.uk: statutory instruments", url: "https://www.legislation.gov.uk/uksi", note: "The text of each instrument, and the explanatory note that comes with it." },
      ]}
      checked={dateLong(data.generated)}
    />
  );
}
