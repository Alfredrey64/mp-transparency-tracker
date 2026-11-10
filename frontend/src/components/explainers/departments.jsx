/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconDepartments } from "../newIcons";
import { IconCoin, IconBriefcase, IconChartBars, IconHouse } from "../icons";
import { Hero } from "../story/Vivid";
import DonutShare from "../story/DonutShare";
import ChangeBars from "../story/ChangeBars";
import { DEPARTMENT_ROWS, DEPARTMENT_TOTAL } from "../../data/departmentSpending";

const ROWS = DEPARTMENT_ROWS;
const TOTAL = DEPARTMENT_TOTAL;
const bn = (n) => `£${n.toFixed(1)}bn`;
const byLater = [...ROWS].sort((a, b) => b.later - a.later);
const biggest = byLater.slice(0, 10);
const grid = (d) => ((d.later - d.now) / d.now) * 100;
const changed = [...ROWS].filter((d) => d.now >= 5).sort((a, b) => grid(b) - grid(a));
const growers = changed.slice(0, 5);
const shrinkers = changed.filter((d) => grid(d) < 0).slice(-5).reverse();
const GRAND = TOTAL.r[1] + TOTAL.c[1];
const SHARE_COLOURS = ["#2C5F9E", "#7B5BD6", "#B45A3C", "#3F7D5C", "#C88A1E", "#2C7DA0"];
const top6 = byLater.slice(0, 6);
const shift = (d) => {
  const g = grid(d);
  return `${bn(d.now)} in 2025-26, ${bn(d.later)} in 2028-29: ${g >= 0 ? "up" : "down"} ${Math.abs(g).toFixed(1)}%. Day-to-day ${bn(d.r[1])} and investment ${bn(d.c[1])} in 2028-29.`;
};
const otherRows = byLater.slice(6);
const otherLater = GRAND - top6.reduce((n, d) => n + d.later, 0);
const shareItems = [
  ...top6.map((d, i) => ({ key: d.short ?? d.name, label: d.short ?? d.name, value: d.later, colour: SHARE_COLOURS[i], about: shift(d) })),
  { key: "other", label: "All other departments", value: otherLater, colour: "#8A93A6", about: `The other ${otherRows.length} departments listed here together: ${otherRows.map((d) => d.short ?? d.name).join(", ")}.` },
];

const PAGE = {
  look: "vivid",
  icon: IconDepartments,
  kicker: "Where the money goes",
  title: "Spending by department",
  subtitle: "The Treasury sets a budget for each government department. This page shows the plans set at the Spending Review in June 2025: who gets the most, who is growing and who is being squeezed between 2025-26 and 2028-29, and what these budgets leave out.",
  lead: <Hero
    colours={["#14305A", "#2C5F9E", "#6B4FBF"]}
    why="A department's budget is the most direct measure of what the government is choosing to put first. Comparing them shows where the money is growing and where it is not, whatever the announcements say."
    stops={[
      { icon: IconBriefcase, title: "The Treasury sets a limit", text: "For each department, for several years", colour: "#8DB7E8" },
      { icon: IconCoin, title: "Day-to-day spending", text: "Pay, running costs and services", colour: "#8FD1A8" },
      { icon: IconHouse, title: "Investment", text: "Buildings, equipment and infrastructure", colour: "#F0C77A" },
      { icon: IconChartBars, title: "Plans to 2028-29", text: "Set at the Spending Review in June 2025", colour: "#B9A5F0" },
    ]}
    figures={[
      { value: `£${Math.round(TOTAL.r[0] + TOTAL.c[0])}bn`, label: "Planned departmental spending, 2025-26", sub: `${bn(TOTAL.r[0])} day-to-day and ${bn(TOTAL.c[0])} investment` },
      { value: `£${Math.round(GRAND)}bn`, label: "Planned departmental spending, 2028-29", sub: `${bn(TOTAL.r[1])} day-to-day and ${bn(TOTAL.c[1])} investment` },
      { value: `£${Math.round(byLater[0].later)}bn`, label: "The biggest budget in 2028-29", sub: `${byLater[0].name}` },
    ]}
  />,
  chapters: [
    {
      title: "What these budgets are",
      lede: "The Treasury sets each department a limit for the next few years, called a Departmental Expenditure Limit. It has two parts.",
      colour: "#2C5F9E",
      blocks: [
        { compare: [
          { title: "Day-to-day spending", colour: "#2C5F9E", items: ["Pay, running costs, and the services a department delivers each year.", `In total, ${bn(TOTAL.r[0])} in 2025-26 and ${bn(TOTAL.r[1])} in 2028-29.`] },
          { title: "Investment", colour: "#B45A3C", items: ["Buildings, equipment, roads, railways, defence kit and other things that last.", `In total, ${bn(TOTAL.c[0])} in 2025-26 and ${bn(TOTAL.c[1])} in 2028-29.`] },
        ] },
        { note: "These limits leave out spending that moves with demand, such as most benefits and the State Pension, and the cost of debt interest, which the Treasury counts separately. Work and Pensions looks small here because the benefits it pays are outside its limit. The Scottish, Welsh and Northern Ireland budgets are the money for the devolved governments, which they spend on their own priorities." },
      ],
    },
    {
      title: "The biggest budgets in 2028-29",
      lede: "Health is by far the largest, followed by Education and Defence. These are the ten biggest departments once day-to-day spending and investment are added together.",
      colour: "#7B5BD6",
      blocks: [
        { node: <DonutShare title="Share of planned departmental spending in 2028-29" items={shareItems} format={bn} centre="Planned departmental spending, 2028-29" aria={`Share of planned departmental spending in 2028-29, ${bn(GRAND)} in all: ${shareItems.map((s) => `${s.label} ${bn(s.value)}`).join(", ")}`} note="Day-to-day spending and investment added together. The percentages are each department's share of the planned total." /> },
        { bars: { items: biggest.map((d, i) => ({ label: d.name, value: d.later, text: bn(d.later), colour: i === 0 ? "#2C5F9E" : "#7B5BD6" })), max: biggest[0].later, note: "Planned day-to-day plus investment spending in 2028-29, £ billion at current prices." } },
      ],
    },
    {
      title: "Who is growing and who is squeezed",
      lede: "Between 2025-26 and 2028-29 the plans add £68.5 billion to the totals. The change is very uneven.",
      colour: "#B45A3C",
      blocks: [
        { node: <ChangeBars beforeName="2025-26" afterName="2028-29" items={[...growers, ...shrinkers].map((d) => ({ label: d.name, pct: grid(d), beforeText: bn(d.now), afterText: bn(d.later) }))} note="The five departments with the largest percentage rise, and the one that falls, among those planning to spend more than £5 billion. Current prices, so some of every rise is inflation." /> },
        { text: ["Defence has the largest percentage rise, mostly in investment, which goes from £23.2 billion to £31.5 billion. Foreign, Commonwealth and Development Office budgets fall, which fits the planned cut in overseas aid."] },
      ],
    },
    {
      title: "The whole picture",
      lede: "Across all departments, the Spending Review said budgets grow by an average of 2.3% a year in real terms from 2023-24 to 2028-29. Day-to-day spending grows by an average of 1.7% a year in real terms over the review period.",
      colour: "#3F7D5C",
      blocks: [
        { facts: [
          { label: "Day-to-day, 2028-29", value: bn(TOTAL.r[1]), note: `Up from ${bn(TOTAL.r[0])} in 2025-26.` },
          { label: "Investment, 2028-29", value: bn(TOTAL.c[1]), note: `Up from ${bn(TOTAL.c[0])} in 2025-26.` },
          { label: "Added by the plans", value: bn(TOTAL.r[1] + TOTAL.c[1] - TOTAL.r[0] - TOTAL.c[0]), note: "Between 2025-26 and 2028-29, in current prices." },
        ] },
        { note: "These are the plans set in June 2025. Budget 2026 on 28 October 2026 says day-to-day departmental spending will be £40 billion higher each year by 2028-29 than the previous government's plans. Later announcements can change a department's allocation, so check the Treasury's latest tables." },
      ],
    },
    {
      title: "Follow the money further",
      lede: "A budget is a plan. These pages show where money goes after that.",
      colour: "#5A4FCF",
      blocks: [
        { node: (
          <ul className="st-sources">
            <li><a href="#/govContracts">Government contracts</a><span>What departments have bought, and from whom.</span></li>
            <li><a href="#/publicFinances">Public finances</a><span>Borrowing, debt and the cost of interest.</span></li>
            <li><a href="#/taxRates">Taxes</a><span>What is collected to pay for it all.</span></li>
            <li><a href="#/howBudgetWorks">How the Budget works</a><span>Where these budgets are set and changed.</span></li>
          </ul>
        ) },
      ],
    },
  ],
  sources: [
    { label: "HM Treasury: Spending Review 2025", url: "https://www.gov.uk/government/publications/spending-review-2025-document/spending-review-2025-html", note: "Table 5.3 (Resource DEL excluding depreciation) and Table 5.4 (Capital DEL), plans for 2025-26 and 2028-29, and the growth rates. Published June 2025. Totals for a department add its lines together." },
    { label: "HM Treasury: Budget 2026", url: "https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html", note: "The statement that day-to-day departmental spending will be £40 billion higher each year by 2028-29. Published 28 October 2026." },
    { label: "Office for Budget Responsibility: Departmental expenditure limits", url: "https://obr.uk/forecasts-in-depth/tax-by-tax-spend-by-spend/departmental-expenditure-limits/", note: "What the limits cover." },
  ],
  checked: "2 November 2026",
};

export default function Departments() {
  return <ExplainerPage {...PAGE} />;
}
