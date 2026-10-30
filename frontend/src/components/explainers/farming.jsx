/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconWheat } from "../newIcons";

const PAGE = {
  look: "field",
  icon: IconWheat,
  kicker: "Money and the state",
  title: "Farming and food",
  subtitle: "Farms use more than two thirds of the UK's land but employ only 1.3% of its workers. This page sets out what farming produces, how much of the food we eat is grown here, how English farmers are paid, what has changed for farm inheritance tax, and what has happened to food prices.",
  tiles: [
    { label: "Farm holdings in the UK", value: "212,000", colour: "#6FB1FF", sub: "in 2025, using 17 million hectares" },
    { label: "Of the UK's land used for farming", value: "69%", colour: "#FFB45E", sub: "in 2025, Defra's figure" },
    { label: "Of the food we eat is produced here", value: "60%", colour: "#FF7A8A", sub: "in 2025, 72% for the kinds of food that can grow here" },
  ],
  why: { colour: "#4C7A3A", text: "Farmers manage most of the country's land, and the choices on subsidy, tax and trade decide what is grown, what the countryside looks like and what lands on the shelf. Farming policy is also devolved, so it differs between the four nations." },
  chapters: [
    {
      title: "What UK farming is worth",
      lede: "Farming is a large user of land and a small part of the economy.",
      colour: "#4C7A3A",
      blocks: [
        { facts: [
          { label: "Contribution to the economy", value: "£15.9bn", note: "Agriculture's gross value added in 2025, or 0.58% of the UK total. The figure is preliminary." },
          { label: "People employed", value: "446,200", note: "In 2025, or 1.3% of the UK workforce. 279,500 of those jobs were in England." },
          { label: "The wider food sector", value: "£162.3bn", note: "The whole agri-food sector (farming, food and drink making, wholesale, shops and catering) in 2024: 6.2% of the economy." },
        ] },
        { bars: { items: [
          { label: "Dairy", value: 7.0, text: "£7.0bn", colour: "#5A7FA6" },
          { label: "Beef", value: 5.1, text: "£5.1bn", colour: "#B45A3C" },
          { label: "Vegetables and flowers", value: 3.7, text: "£3.7bn", colour: "#3F7D5C" },
          { label: "Cereals", value: 3.3, text: "£3.3bn", colour: "#B07A2A" },
        ], max: 7.5, note: "The four biggest sectors by value of UK output in 2025. Livestock as a whole is worth £22.2bn, or 66% of the value of UK farm output." } },
      ],
    },
    {
      title: "How much of our food is grown here",
      lede: "The government measures it as the value of food produced in the UK against the value of food supplied to the UK market.",
      colour: "#B07A2A",
      blocks: [
        { bars: { items: [
          { label: "All food", value: 60, text: "60%", colour: "#B07A2A" },
          { label: "Food that can be grown here", value: 72, text: "72%", colour: "#3F7D5C" },
          { label: "Milk", value: 105, text: "105%", colour: "#5A7FA6" },
          { label: "Fresh fruit", value: 14, text: "14%", colour: "#B45A3C" },
        ], max: 110, note: "Food production against supply, 2025. Over 100% means more is produced than is eaten, with the rest exported." } },
        { note: "The 72% leaves out food that cannot be grown here, such as bananas and coffee. The figure was 62% for all food when Defra last published a full food security report, in December 2024, which used 2023 data." },
      ],
    },
    {
      title: "How English farmers are paid",
      lede: "Farming policy is devolved. This chapter is about England, where the government has been moving away from paying farmers by the area they farm.",
      colour: "#5A7FA6",
      blocks: [
        { text: ["Direct payments, which pay a farm for the land it has, have been phased out since 2021. They are being replaced by schemes that pay for particular actions, such as protecting soil or managing hedgerows. The main one is the Sustainable Farming Incentive."] },
        { timeline: [
          { when: "24 June 2026", text: "Defra publishes the Farming Roadmap 2050, a long-term plan for English farming, with a 73-page report, an evidence annex and a timeline of key dates to 2030." },
          { when: "30 June 2026", text: "The first 2026 round of the Sustainable Farming Incentive opens, for small farms and farms without an existing environmental agreement. £60 million is available." },
          { when: "September 2026", text: "The second round opens to all farmers and land managers. The government's total budget for the 2026 offer is £240 million." },
        ] },
        { bars: { items: [
          { label: "Poultry", value: 166300, text: "£166,300", colour: "#5A7FA6" },
          { label: "Dairy", value: 162100, text: "£162,100", colour: "#5A7FA6" },
          { label: "All farm types", value: 75100, text: "£75,100", colour: "#B07A2A" },
          { label: "Grazing, lowland", value: 32400, text: "£32,400", colour: "#B45A3C" },
          { label: "Grazing, upland", value: 33800, text: "£33,800", colour: "#B45A3C" },
        ], max: 170000, note: "Average farm business income in England, 2022-23 to 2024-25. A quarter of the average farm's income comes from direct payments, against 42% on upland grazing farms." } },
      ],
    },
    {
      title: "Inheritance tax on farms",
      lede: "The rule that has caused the most argument in farming, and the most changes.",
      colour: "#7B5BD6",
      blocks: [
        { timeline: [
          { when: "Before 6 April 2026", text: "Farm and business property had 100% inheritance tax relief, with no limit on its value." },
          { when: "23 December 2025", text: "The government announces that the limit on full relief will be £2.5 million per estate, up from the £1 million it had planned. Above it, relief is 50%." },
          { when: "From 6 April 2026", text: "Full relief applies only up to the limit." },
        ] },
        { facts: [
          { label: "Full relief up to", value: "£2.5m", note: "Per estate. A surviving spouse or civil partner can use the unused part, so a couple can pass on up to £5m of qualifying assets tax-free, on top of the usual allowances." },
          { label: "Above the limit", value: "50% relief", note: "So the part above the limit is taxed at an effective 20% rather than 40%, which is 40% on half its value. This is our arithmetic, not a figure from the announcement." },
          { label: "Estates paying more", value: "up to 1,100", note: "The government's estimate for 2026-27 across the UK. It says about 85% of estates claiming agricultural relief that year will pay no more tax than before, and that the number of estates facing the reform falls from 375 to 185 because the limit was raised." },
        ] },
        { note: "How many family farms this affects, and whether the limit is high enough, are matters on which farmers' groups and the government disagree. The figures here are the government's own estimates." },
      ],
    },
    {
      title: "Food prices",
      lede: "What shoppers pay, from the ONS.",
      colour: "#B45A3C",
      blocks: [
        { facts: [
          { label: "Food price rise, year to September 2026", value: "1.3%", note: "The annual rate for food and non-alcoholic drinks. Prices of all goods and services rose 3.5% over the same year." },
          { label: "Peak food price rise", value: "19.1%", note: "In March 2023, in the ONS's series. It is the highest since 1989, where this series starts." },
        ] },
        { note: "Food prices and farm incomes are different things. What a farmer is paid for milk or wheat is only part of what a shopper pays for the finished product, and the shares between farmers, processors and shops vary by product." },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Farming evidence key statistics (2025)", url: "https://www.gov.uk/government/publications/farming-evidence-pack-a-high-level-overview-of-the-uk-agricultural-industry/farming-evidence-key-statistics-accessible-version", note: "Holdings, land use, output, economic contribution, employment, self-sufficiency and farm business income." },
    { label: "GOV.UK: United Kingdom Food Security Report 2024", url: "https://www.gov.uk/government/statistics/united-kingdom-food-security-report-2024", note: "The 62% figure for 2023." },
    { label: "GOV.UK: Farming Roadmap 2050", url: "https://www.gov.uk/government/publications/farming-roadmap-2050", note: "Published 24 June 2026, for England." },
    { label: "Defra Farming blog: SFI26 window 1 is now open", url: "https://defrafarming.blog.gov.uk/2026/06/30/sfi26-window-1-now-open/", note: "Who could apply, the £60 million for the first round and the £240 million total." },
    { label: "GOV.UK: Inheritance tax reliefs threshold to rise to £2.5m for farmers and businesses", url: "https://www.gov.uk/government/news/inheritance-tax-reliefs-threshold-to-rise-to-25m-for-farmers-and-businesses", note: "The new limit, the 50% rate above it and the government's estimates." },
    { label: "ONS: Consumer price inflation", url: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/latest", note: "The food and all-items annual rates, from the series on the prices page." },
  ],
  checked: "30 October 2026",
};

export default function Farming() {
  return <ExplainerPage {...PAGE} />;
}
