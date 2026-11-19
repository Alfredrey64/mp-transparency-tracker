/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconConsultation } from "../newIcons";
import { IconBook, IconCouncil, IconSearch, IconGavel } from "../icons";
import { Hero } from "../story/Vivid";
import ConsultationBrowser from "../story/ConsultationBrowser";
import { useDataFile } from "../../lib/useDataFile";
import { consultations } from "../../lib/dataFiles";
import { closingCounts } from "../../lib/consultationView";
import { dateLong } from "../../lib/upcoming";

// Before a government changes a rule it often asks the public what they think. This page lists the consultations that are open now on GOV.UK (data/consultations.json,
// fetch-consultations.js, refreshed daily), each with its closing day, and says how to take part. It reports what GOV.UK lists and does not judge any proposal.

const HEAD = {
  kicker: "Get things done",
  title: "Have your say on new rules",
  subtitle: "Before changing a rule, a government department will often ask the public what it thinks. Anyone can reply. This page lists every consultation open now, soonest to close first, so you can find one that affects you before the day passes.",
  icon: IconConsultation,
  look: "vivid",
  narrow: true,
};

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");

function build(data) {
  const { items, byDepartment, generated, total } = data;
  const c = closingCounts(items, generated);
  const departments = byDepartment.map((d) => d.name).sort((a, b) => a.localeCompare(b));
  const chapters = [
    {
      title: "What is a consultation?",
      lede: "A consultation is a published question from the government: here is what we are thinking of doing, what do you think?",
      colour: "#2C7DA0",
      blocks: [
        { cards: [
          { title: "A department proposes", text: "A department sets out a change it is considering, such as a new rule, a change to a service or a change to how money is spent, and publishes it with a closing day.", colour: "#2C7DA0" },
          { title: "Anyone can reply", text: "Replies are usually open to everyone, not only experts or organisations. Each consultation page says how to send yours, often through an online form.", colour: "#7B5BD6" },
          { title: "The department publishes what it heard", text: "After the closing day the department usually publishes a summary of the replies and what it will do. Replying does not oblige it to change its plan.", colour: "#C88A1E" },
        ] },
        { text: ["Parliament does not run these. Each one is run by the department or body that wants to make the change, so the questions and the way to reply differ from one consultation to the next."] },
      ],
    },
    {
      title: "Open now",
      lede: `${n(total)} consultations are open on GOV.UK as of ${dateLong(generated)}.${c.fortnight ? ` ${n(c.fortnight)} close within two weeks.` : ""}`,
      colour: "#7B5BD6",
      blocks: [
        { facts: [
          { label: "Open now", value: n(total), note: "Consultations GOV.UK lists as open and not yet past their closing day." },
          { label: "Closing within a week", value: n(c.week), note: "Soonest to close are listed first below." },
          { label: "Closing within a month", value: n(c.month), note: "Including those closing this week." },
        ] },
        { bars: { items: byDepartment.slice(0, 8).map((d) => ({ label: d.name, value: d.count, text: n(d.count), colour: "#2C7DA0" })), max: Math.max(...byDepartment.map((d) => d.count)), note: "Open consultations by the department running them." } },
        { text: ["A department running more consultations is not doing more or less than another. How often it consults depends on how much it is changing at the time."] },
      ],
    },
    {
      title: "Every open consultation",
      lede: "Each card gives the department's own one-sentence description and the closing day, and links to the full consultation on GOV.UK. Search by a word, or pick a department.",
      colour: "#2C7DA0",
      blocks: [{ node: <ConsultationBrowser items={items} departments={departments} today={generated} /> }],
    },
    {
      title: "How to make your reply count",
      lede: "A few habits make a reply easier for officials to use.",
      colour: "#C88A1E",
      blocks: [
        { cards: [
          { title: "Answer the questions asked", text: "Most consultations list numbered questions. Reply to those you have something to say about and say which question you are answering.", colour: "#2C7DA0" },
          { title: "Say who you are and why you care", text: "A line on how the proposal affects you, your work or your area is more useful than a general view.", colour: "#7B5BD6" },
          { title: "Give a reason and, if you can, an example", text: "A reason or a real case helps more than a position on its own.", colour: "#C88A1E" },
        ] },
        { node: <p className="st-note"><a href="#/getThingsDone">How to get something done</a> · <a href="#/petitions">Petitions</a> · <a href="#/myArea">Your area</a></p> },
      ],
    },
  ];
  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#B08A2E"]}
      why="A consultation is one of the few times the public is asked, in writing, before a rule changes. It only works if people see it before the closing day."
      stops={[
        { icon: IconBook, title: "A proposal", text: "Published by a department", colour: "#8FD1A8" },
        { icon: IconSearch, title: "You find it", text: "Open on GOV.UK", colour: "#8DB7E8" },
        { icon: IconCouncil, title: "You reply", text: "Before the closing day", colour: "#B9A5F0" },
        { icon: IconGavel, title: "The department decides", text: "And says what it heard", colour: "#F0C77A" },
      ]}
      figures={[
        { value: n(total), label: "Open now", sub: `As of ${dateLong(generated)}` },
        { value: n(c.week), label: "Close within a week", sub: "the soonest first below" },
        { value: n(byDepartment.length), label: "Departments consulting", sub: "each runs its own" },
      ]}
    />,
    chapters,
  };
}

export default function Consultations() {
  const file = useDataFile(consultations);
  if (!file.data) return <ExplainerPage {...HEAD} chapters={[]} lead={file.failed ? <LoadFailedNote item="the consultations" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      {...build(file.data)}
      sources={[
        { label: "GOV.UK: open consultations", url: "https://www.gov.uk/search/policy-papers-and-consultations?content_store_document_type%5B%5D=open_consultations", note: "Every open consultation, with how to reply. Read from GOV.UK's search each day." },
        { label: "GOV.UK: consultation principles", url: "https://www.gov.uk/government/publications/consultation-principles-guidance", note: "The government's own guidance to departments on how to consult." },
      ]}
      checked={dateLong(file.data.generated)}
    />
  );
}
