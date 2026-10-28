/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconCouncilBudget } from "../newIcons";

const PAGE = {
  icon: IconCouncilBudget,
  kicker: "Your area & your say",
  title: "Where council money goes",
  subtitle: "English councils plan to spend about £149 billion on services in 2026 to 2027. This page shows the largest items, why social care dominates, and what happens when a council cannot balance its books.",
  tiles: [
    { label: "Planned spending on services, 2026 to 2027", value: "£148.8bn", colour: "#6FB1FF", sub: "net, across councils in England" },
    { label: "Adult and children's social care together", value: "£45.7bn", colour: "#FF7A8A", sub: "about 31% of that. Adults £28.7bn, children £17.0bn" },
    { label: "Councils that gave their figures", value: "406 of 415", colour: "#FFB45E", sub: "so the national totals are estimates" },
  ],
  why: { colour: "#5A7FA6", text: "Council tax is only part of the money, and two services take much of it. Knowing the split explains why councils talk about cutting libraries while their total budget grows." },
  chapters: [
    {
      title: "The big items",
      lede: "Budgeted net spending on services by English councils in 2026 to 2027, as reported to the Ministry of Housing, Communities and Local Government.",
      colour: "#5A7FA6",
      blocks: [
        { bars: { items: [
          { label: "Education", value: 49.1, text: "£49.1bn", colour: "#5A7FA6" },
          { label: "Adult social care", value: 28.7, text: "£28.7bn", colour: "#9C3B3B" },
          { label: "Children's social care", value: 17.0, text: "£17.0bn", colour: "#E8741A" },
          { label: "Housing services", value: 3.7, text: "£3.7bn", colour: "#3F7D5C" },
          { label: "Cultural services", value: 2.6, text: "£2.6bn", colour: "#6E4B6E" },
        ], note: "Net current expenditure. Not every service is shown: roads, planning, waste and others make up the rest of the £148.8 billion." } },
        { text: [
          "Much of the education figure is money passed on to schools and to early years and special needs places. Social care is different: councils themselves are responsible for arranging it.",
          "The department says education spending is £2.4 billion higher in real terms than the year before, mostly early years and special schools. Children's social care is £1.2 billion higher (7.4%), and spending on homelessness rose by £302 million.",
        ] },
        { facts: [
          { label: "All revenue spending", value: "£151.3bn", note: "The broader measure, and 4.7% higher in real terms than the year before." },
          { label: "Cultural services", value: "-2.3%", note: "The only service the department reports as budgeted to fall: £61 million less." },
        ] },
      ],
    },
    {
      title: "When a council cannot balance its books",
      lede: "A council cannot lawfully plan to spend more than it has.",
      colour: "#9C3B3B",
      blocks: [
        { text: [
          "The law gives each council a chief finance officer, who must make a formal report (a section 114 notice) if the council is, or is about to be, spending more than it has. The council must then meet to consider it, and new spending commitments are restricted in the meantime.",
          "A notice is not the council closing. It is a legal signal that the money has run out.",
        ] },
        { note: "This site does not list councils currently under a section 114 notice, as the position changes quickly. Check your own council's website for its latest budget papers." },
      ],
    },
    {
      title: "Check your own council",
      lede: "Every English council publishes its budget and its spending.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "The council tax bill", text: "See the Band D charge for your area and how it has changed on the Compare councils page." },
          { title: "Your council's own budget", text: "Councils publish a budget report each spring. It shows planned spending by service." },
          { title: "Who decides", text: "Elected councillors vote the budget through. Find yours on the Your councillors page." },
        ] },
        { text: [<>Related pages: <a href="#/councils">your council</a>, <a href="#/compareCouncils">compare councils</a> and <a href="#/councillors">your councillors</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Local authority revenue expenditure and financing, England, 2026 to 2027 budget", url: "https://www.gov.uk/government/statistics/local-authority-revenue-expenditure-and-financing-england-2026-to-2027-budget", note: "Every figure on this page, published 11 June 2026. Based on returns from 406 of 415 authorities; totals for the rest are estimated." },
    { label: "Local Government Finance Act 1988, section 114", url: "https://www.legislation.gov.uk/ukpga/1988/41/section/114", note: "The duty of the chief finance officer to report when a council cannot balance its budget." },
  ],
  checked: "28 October 2026",
  narrow: true,
};

export default function CouncilSpending() {
  return <ExplainerPage {...PAGE} />;
}
