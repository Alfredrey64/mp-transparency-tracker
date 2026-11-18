/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconBroadcast, IconCouncil, IconDoor, IconSearch, IconCalendar } from "../icons";
import { Hero } from "../story/Vivid";
import ComplaintsLookup, { NationalSplit } from "../story/ComplaintsLookup";
import { useDataFile } from "../../lib/useDataFile";
import { councilComplaints } from "../../lib/dataFiles";
import { mostUpheld, slowestToComply, investigated } from "../../lib/complaintsView";

// How councils in England fared when complaints about them reached the Local Government and Social Care Ombudsman. Built from data/councilComplaints.json, which
// scripts/build-council-complaints.mjs makes from the Ombudsman's yearly datasheets for every authority. The page reports the Ombudsman's figures and its own warnings about
// how to read them; it does not judge any council.

const HEAD = {
  kicker: "Get things done",
  title: "How councils handle complaints",
  subtitle: "When a council cannot settle a complaint, you can take it to the Ombudsman. Every year it publishes what happened for each council in England. This page shows those figures, and how to read them fairly.",
  icon: IconBroadcast,
  look: "vivid",
};

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");

function build(d) {
  const nat = d.national;
  const inv = investigated(nat);
  const upheldShare = inv ? Math.round((nat.upheld / inv) * 100) : 0;
  const most = mostUpheld(d, 10);
  const slow = slowestToComply(d, 10);
  const year = d.year.replace("-", " to 20");

  const chapters = [
    {
      title: "What the Ombudsman does",
      lede: "The Local Government and Social Care Ombudsman is independent of councils, and its service is free. It looks at complaints that a council has had the chance to put right and has not.",
      colour: "#2C7DA0",
      blocks: [
        { cards: [
          { title: "Council first", text: "You normally complain to the council and give it the chance to answer before the Ombudsman will look.", colour: "#2C7DA0" },
          { title: "Then the Ombudsman", text: "It can investigate. If it finds fault that caused harm, it can recommend that the council puts things right.", colour: "#7B5BD6" },
          { title: "Time limits apply", text: "The usual limit is 12 months from when you first knew about the problem.", colour: "#C88A1E" },
        ] },
        { node: <p className="st-note">The step-by-step guide, with the other bodies to go to for the NHS, the police and government departments, is on <a href="#/getThingsDone">How to get something done</a>.</p> },
      ],
    },
    {
      title: `What happened to complaints in ${year}`,
      lede: `The Ombudsman decided ${n(nat.decided)} complaints and enquiries about ${n(nat.authorities)} authorities in England. Most were closed before a full investigation. ${n(inv)} were investigated in full, and ${n(nat.upheld)} of those were upheld: ${upheldShare} in every 100.`,
      colour: "#B3262E",
      blocks: [
        { node: <NationalSplit national={nat} /> },
        { facts: [
          { label: "Decided in the year", value: n(nat.decided), note: "Complaints and enquiries about every authority the Ombudsman covers." },
          { label: "Investigated in full", value: n(inv), note: "The rest were not valid, were sent back to the council, or were closed after first enquiries." },
          { label: "Upheld", value: `${upheldShare}%`, note: `${n(nat.upheld)} of the ${n(inv)} investigated: the Ombudsman found fault, or found the council had already offered a suitable remedy.` },
        ] },
        { note: "Only a small share of complaints reach a full investigation, so the share upheld describes the cases the Ombudsman chose to examine closely. It is not the share of all complaints to councils that were justified." },
      ],
    },
    {
      title: "Look up your council",
      lede: "Each council's figures from the Ombudsman, with the average for similar councils beside them. \u201CSimilar\u201D is the Ombudsman's own grouping of comparable authorities.",
      colour: "#7B5BD6",
      blocks: [{ node: <ComplaintsLookup data={d} /> }],
    },
    {
      title: "How to read the figures fairly",
      lede: "A single number cannot say whether a council is good or bad at handling complaints. The Ombudsman gives its own warnings, and they apply to everything on this page.",
      colour: "#C88A1E",
      blocks: [
        { cards: [
          { title: "Bigger places have more", text: "The Ombudsman says a council serving a large population is likely to see more complaints reach it, and that the make-up of the community shapes the kind. That is why the page also shows figures per 100,000 residents.", colour: "#C88A1E" },
          { title: "A high number can be a good sign", text: "The Ombudsman says many complaints can mean a council that is good at telling people they can ask for an independent investigation, and that fewer complaints may reflect lower expectations rather than better services.", colour: "#2C7DA0" },
          { title: "Small numbers jump", text: "For a small council a handful of cases changes the percentage a lot. The lists below leave out councils with very few cases. Where the Ombudsman investigated none, there is no uphold rate at all.", colour: "#B3262E" },
        ] },
        { node: <p className="st-note">The Ombudsman's own guide: <a href={d.sources.page.replace("local-government-complaint-reviews", "interpreting-local-authority-statistics")} target="_blank" rel="noreferrer">interpreting our complaints data</a>.</p> },
      ],
    },
    {
      title: "Where the most complaints were upheld",
      lede: "Councils with the most upheld complaints for every 100,000 of their residents, with the average for similar councils for comparison. Councils with fewer than three upheld complaints are left out.",
      colour: "#B3262E",
      blocks: [
        { bars: { items: most.map((r) => ({ label: r.name, value: r.value, text: `${r.value} per 100,000 (similar: ${r.similar ?? "n/a"})`, colour: "#B3262E" })), max: Math.max(...most.map((r) => r.value)), note: "Upheld decisions per 100,000 residents. This is a measure of how often the Ombudsman found fault, not a ranking of councils." } },
      ],
    },
    {
      title: "Slowest to do what the Ombudsman recommended",
      lede: "When the Ombudsman upholds a complaint it recommends a remedy, such as an apology or a payment, with a deadline. These are the councils that most often missed those deadlines, among those with at least five outcomes recorded in the year.",
      colour: "#C88A1E",
      blocks: [
        { bars: { items: slow.map((r) => ({ label: r.name, value: r.value, text: `${r.value}% on time (${r.outcomes} cases)`, colour: "#C88A1E" })), max: 100, note: "Share of recommendations carried out by the Ombudsman's deadline. Every bar is out of 100." } },
        { note: "Missing a deadline is not the same as refusing to act: the Ombudsman separately records whether the council did, in the end, put things right." },
      ],
    },
  ];

  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#B3262E"]}
      why="Councils run services most people use every day. When they get something wrong, the Ombudsman's figures are the nearest thing to a public record of how often, and of what they did next."
      stops={[
        { icon: IconCouncil, title: "A council gets it wrong", text: "A service, a decision, a delay", colour: "#8DB7E8" },
        { icon: IconDoor, title: "You complain to the council", text: "It gets the first chance", colour: "#8FD1A8" },
        { icon: IconSearch, title: "The Ombudsman investigates", text: "Free, and independent", colour: "#B9A5F0" },
        { icon: IconCalendar, title: "The council must act", text: "And the figures are published", colour: "#F0C77A" },
      ]}
      figures={[
        { value: n(nat.decided), label: "Decided in the year", sub: `${year}, every authority in England` },
        { value: `${upheldShare}%`, label: "Upheld, once investigated", sub: `${n(nat.upheld)} of ${n(inv)} cases` },
        { value: n(Object.keys(d.councils).length), label: "Councils you can look up", sub: "type your postcode below" },
      ]}
    />,
    chapters,
  };
}

export default function CouncilComplaints() {
  const { data, failed } = useDataFile(councilComplaints);
  if (!data) return <ExplainerPage {...HEAD} chapters={[]} lead={failed ? <LoadFailedNote item="the complaints figures" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      {...build(data)}
      sources={[
        { label: "Local Government and Social Care Ombudsman: annual review of local government complaints", url: data.sources.page, note: `The ${data.year} datasheets: complaints decided, and remedy and compliance outcomes, for every authority.` },
        { label: "Ombudsman: interpreting our complaints data", url: data.sources.page.replace("local-government-complaint-reviews", "interpreting-local-authority-statistics"), note: "How the Ombudsman says its figures should and should not be used." },
      ]}
      checked={`Figures for ${data.year}, read on ${new Date(`${data.fetchedAt}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`}
    />
  );
}
