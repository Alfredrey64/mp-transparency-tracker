/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconBudget } from "../newIcons";
import { IconCoin, IconChartBars, IconParliament, IconTaxes } from "../icons";
import { Journey } from "../story/StateArt";
import { Hero } from "../story/Vivid";

const PAGE = {
  look: "vivid",
  narrow: true,
  icon: IconBudget,
  kicker: "How Parliament works",
  title: "How the Budget and the Spending Review work",
  subtitle: "Twice a year or so the Chancellor stands up in the Commons and says what the government will tax and spend. This page explains what the Budget is, how it differs from the Spending Review, who checks the numbers, and what the Budget of 28 October 2026 changed for households.",
  lead: <Hero
    colours={["#0F3B33", "#1F6F5C", "#2C7DA0"]}
    why="The Budget decides how much tax you pay, what help you get with bills and how much each part of government has to spend. Knowing who proposes it, who checks it and when it becomes law shows you where to look."
    stops={[
      { icon: IconCoin, title: "The Treasury decides", text: "What to change in tax and spending", colour: "#8FD1A8" },
      { icon: IconChartBars, title: "The OBR forecasts", text: "Independent of ministers", colour: "#8DB7E8" },
      { icon: IconTaxes, title: "The Chancellor announces", text: "A statement to the Commons", colour: "#F0C77A" },
      { icon: IconParliament, title: "Parliament makes it law", text: "Usually in a Finance Bill", colour: "#B9A5F0" },
    ]}
    figures={[
      { value: "28 Oct", label: "Budget 2026 was announced on", sub: "2026, with the independent forecast published the same day" },
      { value: "£133bn", label: "Borrowing forecast for 2026-27", sub: "4.2% of the economy, from the Office for Budget Responsibility" },
      { value: "£15bn", label: "Room against the main rule", sub: "by 2029-30, the margin by which the current budget is forecast to be in surplus" },
    ]}
  />,
  chapters: [
    {
      title: "What the Budget is",
      lede: "The Budget is the Chancellor of the Exchequer's statement to the House of Commons on what the government will do with tax and public spending. It comes with an independent forecast of the economy and the public finances.",
      colour: "#1F6F5C",
      blocks: [
        { route: true, steps: [
          { title: "The Treasury and the Chancellor decide what to change", text: "Tax rates, allowances and reliefs, support for households and businesses, and money for particular schemes." },
          { title: "The Office for Budget Responsibility makes its forecast", text: "It is independent of ministers. It forecasts growth, borrowing and debt, and says whether the government's own fiscal rules are met." },
          { title: "The Chancellor makes the statement", text: "The Budget is presented to the House of Commons, and the Treasury publishes the documents that go with it, including the cost of each decision." },
          { title: "Parliament turns the tax changes into law", text: "Tax changes need legislation, which for a Budget usually comes in a Finance Bill that MPs and peers debate." },
        ] },
      ],
    },
    {
      title: "The Budget and the Spending Review are different",
      lede: "People mix them up. One is mostly about tax and the big picture; the other fixes what each department can spend over several years.",
      colour: "#7B5BD6",
      blocks: [
        { compare: [
          { title: "The Budget", colour: "#1F6F5C", items: [
            "Announces changes to tax, benefits and the rules the government follows.",
            "Comes with the Office for Budget Responsibility's forecast of the economy and public finances.",
            "Can also change spending, as Budget 2026 did for energy support and housing.",
          ] },
          { title: "The Spending Review", colour: "#7B5BD6", items: [
            "Sets budgets for each government department for several years at a time.",
            "The last one, in June 2025, set departmental plans out to 2028-29. See Spending by department.",
            "Budget 2026 says the next cost control framework for energy bills will be set at the 2027 spending review.",
          ] },
        ] },
        { node: <Journey colour="#7B5BD6" items={[
          { when: "June 2025", text: "The Spending Review sets departmental plans out to 2028-29." },
          { when: "28 October 2026", text: "Budget 2026 is delivered, with the independent forecast the same day." },
          { when: "2027", text: "The next spending review is due, and will set the next cost control framework for energy bills." },
        ]} /> },
      ],
    },
    {
      title: "What Budget 2026 changed for households",
      lede: "Budget 2026 was delivered on 28 October 2026. These are the measures that touch household bills and pay, as the Treasury's Budget document states them.",
      colour: "#B45A3C",
      blocks: [
        { cards: [
          { title: "No rise in the headline rates", text: "The document says there is \"no increase to the headline rates of income tax, National Insurance contributions, or VAT\"." },
          { title: "Electricity VAT cut extended", text: "The VAT cut on electricity is extended to July 2027, which the document expects to take around £50 off the Ofgem price cap in April 2027." },
          { title: "A Household Energy Payment", text: "A £100 payment per household from January 2027 for households in England in council tax bands A to D. The document puts the cost at £2.6 billion." },
          { title: "Fuel duty", text: "The 5p fuel duty cut and the freeze are extended to 1 July 2027." },
          { title: "Higher minimum pay", text: "The National Living Wage and National Minimum Wage rise by 3.9%." },
          { title: "Who pays for some of it", text: "The Bank Corporation Tax Surcharge is temporarily raised from 3% to 6% from 1 January 2027 to 31 March 2028, and tax on income from property and savings goes up." },
        ] },
        { note: "This is a selection, not the whole Budget. The Treasury's Budget document and policy costings list every decision and what it is expected to raise or cost." },
      ],
    },
    {
      title: "Who checks the numbers",
      lede: "The Office for Budget Responsibility published its forecast on the same day as the Budget. It is independent, so the government cannot choose its numbers.",
      colour: "#2C7DA0",
      blocks: [
        { facts: [
          { label: "Borrowing, 2026-27", value: "£133bn", note: "4.2% of GDP, against £134 billion (4.4%) in 2025-26." },
          { label: "Debt peak", value: "97%", note: "Public sector net debt is forecast to peak at about 97% of GDP in 2028-29 and ease to 96% by 2031-32." },
          { label: "Growth", value: "1.1%", note: "A year on average over 2026 and 2027, down from 1.3% in the March 2026 forecast." },
        ] },
        { duo: { beforeName: "2025-26", afterName: "2026-27 forecast", items: [{ label: "Borrowing as a share of the economy", before: 4.4, after: 4.2, beforeText: "4.4%", afterText: "4.2%" }] } },
        { duo: { beforeName: "March 2026 forecast", afterName: "October 2026 forecast", items: [{ label: "Growth, a year on average over 2026 and 2027", before: 1.3, after: 1.1, beforeText: "1.3%", afterText: "1.1%" }] } },
        { duo: { beforeName: "Peak, 2028-29", afterName: "By 2031-32", items: [{ label: "Public sector net debt, share of GDP", before: 97, after: 96, beforeText: "about 97%", afterText: "96%" }] } },
        { text: ["The government sets itself fiscal rules. The Office for Budget Responsibility says the current budget is forecast to be in surplus in 2029-30 by a margin of £15 billion, which meets the first rule, and that the second rule is met by a margin of £24 billion. The first rule has a 56% probability of being met, because forecasts are uncertain."] },
        { note: "A margin is not a promise. It is how far the forecast is from missing a rule, and forecasts are revised at each Budget." },
      ],
    },
    {
      title: "After the Budget",
      lede: "The announcement is the start, not the end.",
      colour: "#5A4FCF",
      blocks: [
        { node: <Journey colour="#5A4FCF" items={[
          { when: "28 October 2026", text: "The Chancellor delivers the Budget. The Treasury publishes the Budget document and policy costings, and the Office for Budget Responsibility publishes its forecast." },
          { when: "November 2026", text: "Parliament debates the Budget. Its calendar lists a Lords debate on the Autumn Budget 2026 and a Lords committee taking evidence on the draft Finance Bill 2026-27 on 12 November. The Coming up in Parliament page shows what is listed." },
          { when: "January 2027", text: "The Household Energy Payment is due to be paid from January 2027, and the higher bank surcharge starts on 1 January 2027." },
          { when: "2027", text: "The next spending review is due, according to the Budget document." },
        ]} /> },
        { note: "Dates are as stated in the sources below. Parliament's own calendar is the place to check when a debate or committee session is listed." },
      ],
    },
  ],
  sources: [
    { label: "HM Treasury: Budget 2026", url: "https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html", note: "The Executive summary: the household measures, the bank surcharge and the 2027 spending review. Published 28 October 2026." },
    { label: "Office for Budget Responsibility: Economic and fiscal outlook, October 2026", url: "https://obr.uk/efo/economic-and-fiscal-outlook-october-2026/", note: "The forecasts for growth, borrowing and debt, and the margins against the fiscal rules. Published 28 October 2026." },
    { label: "HM Treasury: Supporting documents for Budget 2026", url: "https://www.gov.uk/government/publications/supporting-documents-for-budget-2026", note: "The policy costings and other documents behind each decision." },
    { label: "HM Treasury: Spending Review 2025", url: "https://www.gov.uk/government/publications/spending-review-2025-document/spending-review-2025-html", note: "The departmental budgets set in June 2025." },
    { label: "UK Parliament: What's On calendar", url: "https://whatson.parliament.uk/", note: "The Budget debate and Finance Bill committee session listed for November 2026." },
  ],
  checked: "2 November 2026",
};

export default function HowBudgetWorks() {
  return <ExplainerPage {...PAGE} />;
}
