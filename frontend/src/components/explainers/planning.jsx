/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconPlanning } from "../newIcons";

const PAGE = {
  icon: IconPlanning,
  kicker: "Your area & your say",
  title: "Planning: who decides what gets built",
  subtitle: "Almost anything built in England needs permission from a local council. This page explains who decides, how often the answer is yes, and what a new law passed in December 2025 changes.",
  tiles: [
    { label: "Planning applications received, April to June 2026", value: "78,700", colour: "#6FB1FF", sub: "by councils at district level in England" },
    { label: "Decisions that were a yes", value: "88%", colour: "#3F7D5C", sub: "65,200 granted out of 74,500 decided" },
    { label: "Big developments decided within 13 weeks", value: "19%", colour: "#FFB45E", sub: "91% were decided in that time or an agreed longer one" },
  ],
  why: { colour: "#5A7FA6", text: "Planning is where housing targets, local objections and national policy meet. Most people only find out how it works when something is proposed next door." },
  chapters: [
    {
      title: "Who decides",
      lede: "In England the first decision is almost always made by your local council.",
      colour: "#5A7FA6",
      blocks: [
        { steps: [
          { title: "An application goes to the council", text: "The local planning authority, which is a district or unitary council, checks it against its own local plan and national policy." },
          { title: "Neighbours and others are consulted", text: "People can comment on an application, and the council has to take those comments into account." },
          { title: "It is decided by councillors or by officers", text: "Some applications go to a planning committee of councillors. Most are decided by planning officers under powers the council has delegated to them." },
          { title: "An applicant can appeal", text: "If permission is refused, the applicant can appeal to the Planning Inspectorate. Neighbours have no equivalent right to appeal a permission." },
        ] },
        { text: [<>The decision-makers are the same councillors you can look up on <a href="#/councillors">your councillors</a>, and the planning limits come from national government. Housing figures are on the <a href="#/housing">housing</a> page.</>] },
      ],
    },
    {
      title: "What the latest figures show",
      lede: "From the official statistics published on 24 September 2026, covering April to June 2026.",
      colour: "#3F7D5C",
      blocks: [
        { facts: [
          { label: "Decided in the quarter", value: "74,500", note: "Down 8% on the same quarter a year earlier." },
          { label: "Householder applications", value: "51%", note: "37,700 of the decisions: extensions, loft conversions and similar. This is the single largest group." },
          { label: "Homes: applications granted", value: "6,900", note: "Residential applications granted in the quarter, down 2% on a year earlier." },
          { label: "Shops and offices", value: "1,400", note: "Commercial applications granted, down 6%." },
        ] },
        { text: ["Over the year to June 2026 district-level councils granted about 254,100 applications of all kinds. A grant means permission was given. It does not tell you how many homes will be built, because permissions are not all built, and one application can cover many homes."] },
        { note: "Figures are for district-level planning authorities in England and cover applications for planning permission." },
      ],
    },
    {
      title: "What the 2025 Act changes",
      lede: "The Planning and Infrastructure Act 2025 became law in December 2025. Its provisions are being brought into force in stages.",
      colour: "#E8741A",
      blocks: [
        { cards: [
          { title: "Big infrastructure projects", text: "Part 1 changes how nationally significant infrastructure projects, such as large power lines and transport schemes, are examined, and how electricity connections are managed." },
          { title: "Planning decisions", text: "Part 2 covers planning decisions, a surcharge on planning fees, training for local planning authorities and strategic plans covering wider areas." },
          { title: "Nature", text: "Part 3 covers development and nature recovery, including a nature restoration levy that developers can pay." },
          { title: "Development corporations and compulsory purchase", text: "Parts 4 and 5 deal with development corporations, which can lead big new developments, and with how land can be bought compulsorily." },
        ] },
        { text: [<>The English devolution law of 2026 also gives some regional mayors a say on large planning applications once that part comes into force. See <a href="#/mayors">mayors and regional authorities</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Planning applications in England, April to June 2026 (statistical release, 24 September 2026)", url: "https://www.gov.uk/government/statistics/planning-applications-in-england-april-to-june-2026/planning-applications-in-england-april-to-june-2026-statistical-release", note: "Every figure in the second chapter." },
    { label: "Planning and Infrastructure Act 2025 (c. 34)", url: "https://www.legislation.gov.uk/ukpga/2025/34/contents", note: "The parts of the Act and what each covers." },
    { label: "English Devolution and Community Empowerment Act 2026, section 33", url: "https://www.legislation.gov.uk/ukpga/2026/23/section/33", note: "Mayors and planning applications of potential strategic importance." },
  ],
  checked: "28 October 2026",
};

export default function Planning() {
  return <ExplainerPage {...PAGE} />;
}
