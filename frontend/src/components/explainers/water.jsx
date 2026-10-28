/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconWater } from "../newIcons";

const PAGE = {
  icon: IconWater,
  kicker: "Britain in numbers",
  title: "Water and sewage",
  subtitle: "Water companies in England are private businesses that are allowed to release sewage from storm overflows when it rains. This page shows how often it happened in 2025, how the companies were rated for 2024, and what the law now requires of them.",
  tiles: [
    { label: "Storm overflow spills in England, 2025", value: "291,492", colour: "#6FB1FF", sub: "35% fewer than in 2024" },
    { label: "Total spill time against 2024", value: "-48%", colour: "#3F7D5C", sub: "the Environment Agency says much of this is a drier year" },
    { label: "Stars won by all nine companies for 2024", value: "19", colour: "#FF7A8A", sub: "down from 25 in 2023, and the lowest since 2011" },
  ],
  why: { colour: "#5A7FA6", text: "Most households pay a water company a bill every month and cannot switch. The rules on spills, bonuses and monitoring are the way the public finds out what that money delivers." },
  chapters: [
    {
      title: "What the 2025 data shows",
      lede: "From the Environment Agency's annual monitoring data, published on 26 March 2026.",
      colour: "#5A7FA6",
      blocks: [
        { facts: [
          { label: "Spill events", value: "291,492", note: "Down 35% on 2024." },
          { label: "Average spills per overflow", value: "20.5", note: "Against 31.8 in 2024." },
          { label: "Companies' cuts in spill time", value: "40% to 70%", note: "Many water companies saw reductions in this range." },
        ] },
        { pull: "The Environment Agency's chair said the numbers are heavily influenced by rainfall. 2025 was unusually dry after a particularly wet 2024, so the fall is not simply a sign the system was fixed." },
        { text: [
          "Every storm overflow in England now has an event duration monitor fitted. The government says the monitoring data has already supported £10.2 billion of investment in overflow upgrades, as part of £104 billion planned on water infrastructure over five years.",
          "The Minister said that, even so, there is still an unacceptable amount of sewage entering waterways.",
        ] },
      ],
    },
    {
      title: "How the companies were rated for 2024",
      lede: "The Environment Agency scores each company out of four stars on its environmental performance.",
      colour: "#9C3B3B",
      blocks: [
        { bars: { items: [
          { label: "Stars won in 2023", value: 25, text: "25", colour: "#5A7FA6" },
          { label: "Stars won in 2024", value: 19, text: "19", colour: "#9C3B3B" },
        ], note: "Total stars across the nine water and sewerage companies in England. The most possible is 36." } },
        { cards: [
          { title: "Only one company got four stars", text: "Severn Trent Water. The regulator called the results poor." },
          { title: "Serious pollution incidents rose 60%", text: "Incidents causing significant environmental harm increased by 60% in 2024 alone." },
          { title: "Three companies, most of the serious incidents", text: "Thames Water, Southern Water and Yorkshire Water were responsible for 81% of them." },
        ] },
        { note: "The agency says it has tightened the criteria since 2011, so the 2024 result does not mean performance has declined since then." },
      ],
    },
    {
      title: "What the law now requires",
      lede: "The Water (Special Measures) Act 2025 became law on 24 February 2025.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "Bonuses can be banned", text: "Ofwat has the power to set rules banning executive bonuses where a company fails to meet high standards on the environment, customers and finances." },
          { title: "Prison for obstruction", text: "Water executives who obstruct investigations could face tougher penalties, including imprisonment." },
          { title: "Automatic penalties", text: "Regulators can issue penalties for a range of offences more quickly, without a long investigation." },
          { title: "Real-time data", text: "Independent monitoring of every sewage outlet, with real-time data published for all emergency overflows, reported within an hour of the spill." },
        ] },
        { text: ["The government has also said it plans a new, single regulator in place of the present arrangement. At the time of checking this page, that was a stated intention, so look at the Department for Environment, Food and Rural Affairs for its progress."] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Fewer and shorter storm overflow spills in 2025, new monitoring data shows (26 March 2026)", url: "https://www.gov.uk/government/news/fewer-and-shorter-storm-overflow-spills-in-2025-new-monitoring-data-shows", note: "The spill figures, the effect of the weather and the monitors." },
    { label: "GOV.UK: Water and sewerage companies in England: environmental performance report 2024", url: "https://www.gov.uk/government/publications/water-and-sewerage-companies-in-england-environmental-performance-report-2024/water-and-sewerage-companies-in-england-environmental-performance-report-for-2024", note: "Published 23 October 2025: the 19 stars and the rise in serious pollution incidents." },
    { label: "GOV.UK: New law to ban bonuses for polluting water bosses (24 February 2025)", url: "https://www.gov.uk/government/news/new-law-to-ban-bonuses-for-polluting-water-bosses", note: "What the Water (Special Measures) Act 2025 does." },
    { label: "Environment Agency event duration monitoring data", url: "https://www.data.gov.uk/dataset/event-duration-monitoring-storm-overflows-annual-returns", note: "The data behind the spill figures, overflow by overflow." },
  ],
  checked: "28 October 2026",
};

export default function Water() {
  return <ExplainerPage {...PAGE} />;
}
