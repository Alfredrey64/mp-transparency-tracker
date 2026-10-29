/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconWater } from "../newIcons";

// The small pictures inside the three figures at the top. Each is drawn from numbers stated on this page.
const Bars = ({ a, b, max }) => (
  <div className="wt-bars">
    <span><em>2024</em><i style={{ "--w": `${(a.v / max) * 100}%` }} /><b>{a.t}</b></span>
    <span><em>2025</em><i style={{ "--w": `${(b.v / max) * 100}%` }} /><b>{b.t}</b></span>
  </div>
);
const Stars = () => (
  <>
    <div className="wt-marks" role="img" aria-label="19 of 36 stars won for 2024, 6 fewer than the 25 won for 2023">
      {Array.from({ length: 36 }, (_, n) => <i key={n} className={n < 19 ? "on" : n < 25 ? "lost" : ""} />)}
    </div>
    <p className="wt-key">19 won. The 6 dashed are the stars lost since 2023.</p>
  </>
);

const PAGE = {
  look: "water",
  icon: IconWater,
  kicker: "Britain in numbers",
  title: "Water and sewage",
  subtitle: "Water companies in England are private businesses that are allowed to release sewage from storm overflows when it rains. This page shows how often it happened in 2025, how the companies were rated for 2024, and what the law now requires of them.",
  tiles: [
    { label: "Storm overflow spills in England, 2025", value: "291,492", colour: "#6FB1FF", sub: "35% fewer than in 2024", visual: <Bars a={{ v: 31.8, t: "31.8" }} b={{ v: 20.5, t: "20.5" }} max={31.8} /> },
    { label: "Total spill time against 2024", value: "-48%", colour: "#3F7D5C", sub: "the Environment Agency says much of this is a drier year", visual: <Bars a={{ v: 100, t: "100" }} b={{ v: 52, t: "52" }} max={100} /> },
    { label: "Stars won by all nine companies for 2024", value: "19", colour: "#FF7A8A", sub: "down from 25 in 2023, and the lowest since 2011", visual: <Stars /> },
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
          { label: "Spill events a day, on average", value: "about 800", note: "291,492 spills over 365 days, worked out for this page. A spill can last minutes or many hours." },
          { label: "Cuts in spill time at many companies", value: "40% to 70%", note: "Compared with 2024, against a fall of 48% across England." },
          { label: "Overflows with a monitor", value: "All", note: "Every storm overflow in England now has an event duration monitor fitted." },
        ] },
        { compare: [
          { title: "What may explain the fall", colour: "#3F9BD8", items: [
            "The Environment Agency's chair said the numbers are heavily influenced by rainfall.",
            "2025 was unusually dry after a particularly wet 2024.",
            "The government says the monitoring data has already supported £10.2 billion of investment in overflow upgrades, as part of £104 billion planned on water infrastructure over five years.",
          ] },
          { title: "What the fall does not show", colour: "#9C3B3B", items: [
            "It is not simply a sign that the system was fixed.",
            "The Minister said that, even so, there is still an unacceptable amount of sewage entering waterways.",
            "Spill time fell by 48% while the number of spills fell by 35%.",
          ] },
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
    {
      title: "How to check for yourself",
      lede: "The data is public, down to each overflow.",
      colour: "#1B6FA8",
      blocks: [
        { steps: [
          { title: "Find your water company", text: "Your sewage is handled by the company on your sewerage bill. In some areas a different company supplies your water, so you may receive two bills." },
          { title: "Look up the overflow data", text: "The Environment Agency publishes every storm overflow's spill count and hours each year, overflow by overflow. The link is in the list of sources below." },
          { title: "Read the company's rating", text: "The Environment Agency's performance report gives each company its star rating and the reasons, in the same list of sources." },
          { title: "Ask the people who can act", text: "Your MP and your councillors can raise it. You can find them on Your area." },
        ] },
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
