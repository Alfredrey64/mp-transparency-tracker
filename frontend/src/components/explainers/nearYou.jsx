/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconPin, IconMortarboard, IconHeartbeat, IconSearch, IconCouncil } from "../icons";
import { Hero } from "../story/Vivid";
import NearYouTool from "../story/NearYouTool";
import { useDataFile } from "../../lib/useDataFile";
import { aeNearYou } from "../../lib/dataFiles";
import meta from "../../data/schoolsMeta.json";

// Schools and A&E departments near a postcode. Schools come from Ofsted's monthly inspections data and the Department for Education's schools register (public/data/schools,
// built by scripts/build-schools-near-you.mjs); A&E figures come from NHS England's monthly file (data/aeNearYou.json, fetch-ae-performance.js). The page reports each
// body's own figures and says what they do and do not show; it ranks nothing.

const HEAD = {
  kicker: "Your area & your say",
  title: "Schools and A&E near you",
  subtitle: "Give a postcode and see what Ofsted last found at the schools within three miles, and how the nearest hospital trusts are doing against the four-hour A&E measure.",
  icon: IconPin,
  look: "vivid",
};

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");

function build(ae) {
  const nat = ae.national;
  const chapters = [
    {
      title: "Find what is near you",
      lede: "Schools are shown nearest first with what their latest Ofsted inspection said. The A&E trusts are the three nearest to your postcode with the latest month's figures.",
      colour: "#2C7DA0",
      blocks: [{ node: <NearYouTool /> }],
    },
    {
      title: "How to read a school's inspection",
      lede: "Ofsted changed how it reports in November 2025, so a school's entry may show an older overall grade, a newer report card, or both. They are not the same thing and should not be compared like for like.",
      colour: "#7B5BD6",
      blocks: [
        { cards: [
          { title: "Report cards, from November 2025", text: "There is no single overall grade. A school is judged on each of several areas, such as inclusion, achievement and leadership, on a five-point scale: exceptional, strong standard, expected standard, needs attention, urgent improvement. Safeguarding is either met or not met.", colour: "#2C7DA0" },
          { title: "Older grades", text: "Before that, a school got one overall grade: outstanding, good, requires improvement or inadequate. A school that has not been inspected in the new way still shows its last overall grade, with the date.", colour: "#7B5BD6" },
          { title: "Short inspections", text: "Ofsted also visits some schools more briefly to check whether they still match their last grade. The result, such as “School remains Good”, is shown with its date.", colour: "#8DA2C0" },
        ] },
        { note: "Ofsted describes expected standard as the level where a school does what it should; strong standard and exceptional are higher. Needs attention is not the same as the old “requires improvement”." },
        { more: { title: "What this does not show", text: [
          "These are inspection results, which are a snapshot from the day or days Ofsted visited. They do not show exam results, how a school is led today, or whether it suits a particular child.",
          `The data covers state-funded schools in England, as at ${meta.asAt}. Independent (private) schools are not inspected by Ofsted in the same way and are not included. Open each school's link to read its full report.`,
        ] } },
      ],
    },
    {
      title: "How to read the A&E figures",
      lede: `NHS England counts how many patients who come to A&E are seen, treated and then admitted, transferred or discharged within four hours. In ${ae.month} that was ${nat.allWithin4}% across England, from ${n(nat.allAttendances)} attendances.`,
      colour: "#B3262E",
      blocks: [
        { facts: [
          { label: "Within four hours, England", value: `${nat.allWithin4}%`, note: `All types of A&E and booked appointments, ${ae.month}.` },
          { label: "At major A&E departments", value: `${nat.within4}%`, note: "Type 1 departments only: the major hospital emergency departments." },
          { label: "Waited 12 hours or more", value: n(nat.waited12), note: "Patients who waited that long from the decision to admit them to being admitted." },
        ] },
        { cards: [
          { title: "The standard", text: "NHS England says the standard for 95% of patients to be seen within four hours has not been delivered for over a decade. Its medium-term aim is for 85% of patients to wait no more than four hours.", colour: "#B3262E" },
          { title: "Trust, not hospital", text: "The figures are for each NHS trust. A trust can run several hospitals, and a hospital in your area may belong to a trust whose main address is elsewhere.", colour: "#C88A1E" },
          { title: "Major A&E is harder", text: `The all-types figure also counts walk-in and urgent treatment centres. This month it is ${nat.allWithin4}% across all types and ${nat.within4}% at major A&E, so the two are worth reading side by side.`, colour: "#2C7DA0" },
        ] },
      ],
    },
    {
      title: "What you can do",
      lede: "If a service near you worries you, you can read the full report, speak to your MP or councillors, and use the right route to complain.",
      colour: "#3F7D5C",
      blocks: [{ node: <p className="st-note"><a href="#/myMP">Find your MP</a> · <a href="#/councillors">Your councillors</a> · <a href="#/councilComplaints">How councils handle complaints</a> · <a href="#/getThingsDone">How to get something done</a> · <a href="#/education">Education in numbers</a> · <a href="#/nhs">The NHS in numbers</a></p> }],
    },
  ];
  return {
    lead: <Hero
      colours={["#10324A", "#2C7DA0", "#B3262E"]}
      why="Two of the services people use most are a school and an emergency department. Both publish results, but they are hard to find for your own street."
      stops={[
        { icon: IconSearch, title: "Enter a postcode", text: "Looked up once, kept in your browser", colour: "#8DB7E8" },
        { icon: IconMortarboard, title: "Schools within three miles", text: "Nearest first, with Ofsted's latest result", colour: "#B9A5F0" },
        { icon: IconHeartbeat, title: "The three nearest A&E trusts", text: "Four-hour performance last month", colour: "#F0A0A8" },
        { icon: IconCouncil, title: "Then take it up", text: "MP, councillors, the right complaint route", colour: "#8FD1A8" },
      ]}
      figures={[
        { value: n(meta.schools), label: "Schools you can look up", sub: `Ofsted data as at ${meta.asAt}` },
        { value: n(ae.trusts.length), label: "A&E trusts you can look up", sub: `${ae.month} figures` },
        { value: `${nat.allWithin4}%`, label: "Seen within four hours, England", sub: ae.month },
      ]}
    />,
    chapters,
  };
}

export default function NearYou() {
  const { data, failed } = useDataFile(aeNearYou);
  if (!data) return <ExplainerPage {...HEAD} chapters={[]} lead={failed ? <LoadFailedNote item="the A&E figures" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      {...build(data)}
      sources={[
        { label: "Ofsted: state-funded school inspections and outcomes, management information", url: "https://www.gov.uk/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes", note: `Each school's latest inspection result, as at ${meta.asAt}.` },
        { label: "Department for Education: Get Information About Schools", url: "https://get-information-schools.service.gov.uk/", note: "Where each open school stands." },
        { label: "Ofsted: education inspection framework from November 2025", url: "https://www.gov.uk/government/publications/education-inspection-framework/education-inspection-framework-for-use-from-november-2025", note: "How report cards work." },
        { label: "NHS England: A&E attendances and emergency admissions", url: data.page, note: `The monthly file by NHS trust, ${data.month}.` },
        { label: "NHS England: Medium term planning framework 2026/27 to 2028/29", url: "https://www.england.nhs.uk/long-read/medium-term-planning-framework-delivering-change-together-2026-27-to-2028-29/", note: "The four-hour standard and the 85% aim." },
        { label: "postcodes.io", url: "https://postcodes.io/", note: "Turns a postcode into a position. Open data from the Office for National Statistics and Ordnance Survey." },
      ]}
      checked={`A&E figures for ${data.month}, read on ${new Date(`${data.fetchedAt}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`}
    />
  );
}
