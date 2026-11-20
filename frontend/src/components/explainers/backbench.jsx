/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconBills, IconGroup, IconVote, IconQuestion } from "../icons";
import { Hero } from "../story/Vivid";
import { BillOutcomes, BallotList, MotionBoard } from "../story/BackbenchLists";
import { useDataFile } from "../../lib/useDataFile";
import { backbench } from "../../lib/dataFiles";
import { dateLong } from "../../lib/upcoming";

// What MPs who are not ministers can do to put a subject on Parliament's table: bills of their own (private members' bills) and early day motions. Built from
// data/backbench.json (fetch-backbench.js, refreshed daily from Parliament's Bills and Early Day Motions APIs). The words about each kind of bill follow Parliament's own
// descriptions of them in the Bills API.

const HEAD = {
  kicker: "How MPs behave",
  title: "Backbench bills and motions",
  subtitle: "Most laws are the government's. An MP who is not a minister can still try to make one, or put a point on the record and ask colleagues to sign it. This page shows how far those efforts get.",
  icon: IconBills,
  look: "vivid",
};

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");
const share = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function build(d) {
  const cur = d.bills.current, prev = d.bills.previous, pt = d.bills.previousTotal, ct = d.bills.currentTotal;
  const m = d.motions.current;
  const lastEnded = d.sessions.previous.to ? dateLong(d.sessions.previous.to) : "";
  const since = dateLong(d.sessions.current.from);
  const lawKinds = ["ballot", "tenMinute", "presentation", "lords"].filter((k) => prev[k].law > 0);

  const chapters = [
    {
      title: "Four ways an MP or peer can try to make a law",
      lede: "Ministers bring most bills. Everyone else gets a few routes, and they are not equal. The wording below follows how Parliament describes each one.",
      colour: "#2C7DA0",
      blocks: [
        { cards: [
          { title: "The ballot", text: `Names are drawn by lottery at the start of each session. Ballot bills get priority for the limited debating time, so they have the best chance of becoming law. ${n(cur.ballot.total)} are listed this session.`, colour: "#2F6F4E" },
          { title: "Ten Minute Rule", text: `The MP makes a speech of up to ten minutes and another MP may oppose it in a similar speech. Parliament says these are often a chance to voice an opinion, not a serious attempt to pass a bill. ${n(cur.tenMinute.total)} so far this session.`, colour: "#C88A1E" },
          { title: "Presentation", text: `Any MP who has given notice can introduce a bill by reading out its title, with no speech. Parliament says they rarely become law. ${n(cur.presentation.total)} so far this session.`, colour: "#7B5BD6" },
          { title: "Starting in the Lords", text: `Peers have their own ballot, held after the State Opening of a new session. Their bills still have to pass the Commons. ${n(cur.lords.total)} so far this session.`, colour: "#B3262E" },
        ] },
        { note: "A private member's bill is a public bill brought by someone who is not a minister. Private bills, which affect one person or place, are a separate thing." },
      ],
    },
    {
      title: "How far do they get?",
      lede: lastEnded
        ? `In the last session, which ended on ${lastEnded}, ${n(pt.total)} of these bills were presented. ${n(pt.law)} became law. The rest fell when the session ended, or never moved past the early stages.`
        : `${n(pt.total)} of these bills were presented in the last session, and ${n(pt.law)} became law.`,
      colour: "#7B5BD6",
      blocks: [
        { node: <BillOutcomes counts={prev} label="How far each kind of private member's bill got in the last session" /> },
        { facts: [
          { label: "Ballot bills that became law", value: `${prev.ballot.law} of ${prev.ballot.total}`, note: `${share(prev.ballot.law, prev.ballot.total)}% of those that won a place in the ballot, last session.` },
          { label: "All the other kinds", value: `${pt.law - prev.ballot.law} of ${pt.total - prev.ballot.total}`, note: lawKinds.filter((k) => k !== "ballot").length ? `Became law: ${lawKinds.filter((k) => k !== "ballot").map((k) => `${prev[k].law} ${k === "presentation" ? "presentation" : k === "tenMinute" ? "Ten Minute Rule" : "Lords"} bill${prev[k].law === 1 ? "" : "s"}`).join(", ")}.` : "None of them became law." },
        ] },
        { note: "“Listed at second reading” is where Parliament's list puts a bill that is waiting for its main debate. It does not say whether the debate was held, and a bill listed there usually goes no further. Where a bill is withdrawn, its sponsor has given it up." },
        { more: { title: "Why so few?", text: [
          "Parliament sets aside only a limited amount of debating time for private members' bills, which is why ballot bills, with their priority, have the best chance.",
          "Many are not meant to pass. Parliament describes Ten Minute Rule bills as often a way to voice an opinion on a subject, and presentation bills as rarely becoming law.",
        ] } },
      ],
    },
    {
      title: "This session's ballot bills",
      lede: `The ${n(d.ballot.length)} bills that won a place in this session's ballot, with the MP who brought each one. The session began on ${since}. ${n(ct.law)} private member's bills have become law so far this session.`,
      colour: "#2F6F4E",
      blocks: [
        { node: <BallotList ballot={d.ballot} /> },
        { note: "Dates are the next sittings Parliament lists for each bill. They can move, and a bill that is not reached on its day goes to the back of the queue." },
      ],
    },
    {
      title: "Early day motions: what MPs put their names to",
      lede: `An early day motion is a statement an MP tables in the hope other MPs will sign it. It is not a bill, it is not voted on, and it is rarely debated. Its use is as a measure of support. ${n(m.total)} have been tabled since ${since}.`,
      colour: "#C88A1E",
      blocks: [
        { facts: [
          { label: "Motions tabled this session", value: n(m.total), note: `Since ${since}.` },
          { label: "Typical signatures", value: n(m.median), note: `Half the motions have ${n(m.median)} or fewer signatures, counting the MP who tabled it.${d.motions.previous ? ` Last session's typical motion had ${n(d.motions.previous.median)}.` : ""}` },
          { label: "Signed by 50 or more MPs", value: n(m.fiftyPlus), note: `${share(m.fiftyPlus, m.total)}% of the motions.` },
          { label: "Signed by nobody else", value: n(m.oneSignature), note: "Motions with only the signature of the MP who tabled them." },
        ] },
        { bars: { items: m.buckets.map((b) => ({ label: `${b.label} signatures`, value: b.count, text: n(b.count), colour: "#C88A1E" })), max: Math.max(...m.buckets.map((b) => b.count)), note: "How many motions fall in each range of signatures. Most draw very few." } },
        { node: <h3 className="st-subhead" style={{ margin: "18px 0 10px" }}>The most signed this session</h3> },
        { node: <MotionBoard motions={m} /> },
        { note: "Signature counts are the number of MPs who had signed when the data was last fetched, and can still change. A motion shows what some MPs say, not what Parliament has decided." },
      ],
    },
    {
      title: "Who tables the most?",
      lede: "A big number of motions can mean a party is organised about using them, or that a few MPs table a lot. Neither says anything about how well those MPs do their jobs, so use these figures as a map of activity only.",
      colour: "#B3262E",
      blocks: [
        { bars: { items: m.parties.map((p) => ({ label: p.party, value: p.count, text: n(p.count), colour: "#B3262E" })), max: Math.max(...m.parties.map((p) => p.count)), note: "Motions tabled this session, by the party of the MP who tabled each one." } },
        { bars: { items: m.tablers.map((t) => ({ label: `${t.name}${t.party ? ` (${t.party})` : ""}`, value: t.count, text: n(t.count), colour: "#7B5BD6" })), max: Math.max(...m.tablers.map((t) => t.count)), note: "The MPs who have tabled the most motions this session." } },
      ],
    },
    {
      title: "What you can do",
      lede: "If an issue matters to you, you can ask your MP whether they have signed a motion on it, or whether they would bring a bill. You can also see how they vote on bills once they reach a vote.",
      colour: "#3F7D5C",
      blocks: [{ node: <p className="st-note"><a href="#/myMP">Find your MP</a> · <a href="#/voting">How MPs voted</a> · <a href="#/petitions">Petitions</a></p> }],
    },
  ];

  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#2F6F4E"]}
      why="Backbench routes are how an issue the government has not chosen can still reach Parliament. Few succeed, so the odds are part of the story."
      stops={[
        { icon: IconQuestion, title: "An MP has an idea", text: "Not a minister, so no government team behind it", colour: "#8DB7E8" },
        { icon: IconBills, title: "A bill or a motion", text: "A route into the Commons or Lords", colour: "#8FD1A8" },
        { icon: IconGroup, title: "Other MPs sign or debate", text: "Support is the test", colour: "#F0C77A" },
        { icon: IconVote, title: "Law, or a record", text: "Few bills pass; a motion never does", colour: "#B9A5F0" },
      ]}
      figures={[
        { value: `${pt.law} of ${n(pt.total)}`, label: "Became law last session", sub: "private members' bills" },
        { value: `${prev.ballot.law} of ${prev.ballot.total}`, label: "Ballot bills that passed", sub: "the best-placed route" },
        { value: n(m.total), label: "Early day motions this session", sub: `${n(m.fiftyPlus)} with 50 or more signatures` },
      ]}
    />,
    chapters,
  };
}

export default function Backbench() {
  const { data, failed } = useDataFile(backbench);
  if (!data) return <ExplainerPage {...HEAD} chapters={[]} lead={failed ? <LoadFailedNote item="the backbench figures" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      {...build(data)}
      sources={[
        { label: "UK Parliament: Bills API", url: "https://bills-api.parliament.uk/index.html", note: "Every private member's bill, where it stands and who brought it. Refreshed each day." },
        { label: "UK Parliament: Early Day Motions API", url: "https://oralquestionsandmotions-api.parliament.uk/swagger/ui/index", note: "Every early day motion and the number of signatures." },
        { label: "UK Parliament: Private members' bills", url: "https://bills.parliament.uk/", note: "The full text and history of each bill." },
      ]}
      checked={dateLong(data.generated)}
    />
  );
}
