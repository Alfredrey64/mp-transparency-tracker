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
        { duo: { beforeName: "2024", afterName: "2025", items: [
          { label: "Spills per storm overflow, on average", before: 31.8, after: 20.5, beforeText: "31.8", afterText: "20.5" },
        ], max: 35, note: "Total spill events fell 35% to 291,492, and total spill time fell 48%." } },
        { facts: [
          { label: "Spill events in 2025", value: "291,492", note: "Down 35% on 2024." },
          { label: "Total spill time", value: "-48%", note: "Compared with 2024. Many companies saw cuts of 40% to 70%." },
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
      lede: "The Environment Agency scores each of the nine water and sewerage companies out of four stars. Thirty-six stars was the most they could win between them.",
      colour: "#9C3B3B",
      blocks: [
        { meter: { rows: [
          { label: "Stars won for 2023", value: 25, of: 36, text: "25 of 36" },
          { label: "Stars won for 2024", value: 19, of: 36, text: "19 of 36" },
        ], note: "The lowest total since the ratings began in 2011. The agency says it has tightened the criteria since then, so this does not mean performance has declined since 2011." } },
        { facts: [
          { label: "Companies with four stars", value: "1", note: "Severn Trent Water. The regulator called the results poor." },
          { label: "Rise in serious pollution incidents", value: "+60%", note: "Incidents causing significant environmental harm, in 2024 alone." },
          { label: "Share caused by three companies", value: "81%", note: "Thames Water, Southern Water and Yorkshire Water." },
        ] },
      ],
    },
    {
      title: "What the law now requires",
      lede: "The Water (Special Measures) Act 2025 became law on 24 February 2025.",
      colour: "#3F7D5C",
      blocks: [
        { timeline: [
          { when: "24 February 2025", text: "The Water (Special Measures) Act 2025 becomes law." },
          { when: "23 October 2025", text: "The Environment Agency publishes the 2024 ratings: 19 stars across the nine companies." },
          { when: "26 March 2026", text: "The 2025 monitoring data shows 291,492 spill events, 35% fewer than in 2024." },
        ] },
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
