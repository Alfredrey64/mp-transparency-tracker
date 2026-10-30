/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import FloodAirCheck from "../FloodAirCheck";
import { IconFlood } from "../newIcons";

const PAGE = {
  look: "water",
  icon: IconFlood,
  kicker: "Where you live",
  title: "Flooding and air quality",
  subtitle: "Two risks that depend on where you live. This page sets out how many homes in England are at risk of flooding, what is being spent on flood defences, and how the UK did against its air quality limits in 2025, with a check for your own postcode.",
  tiles: [
    { label: "Properties in England at risk of flooding", value: "6.3m", colour: "#6FB1FF", sub: "from rivers, the sea or surface water, the Environment Agency's December 2024 assessment" },
    { label: "For flood defences over ten years", value: "£7.9bn", colour: "#FFB45E", sub: "of capital spending in England, announced in June 2025" },
    { label: "Air quality areas meeting the nitrogen dioxide limit", value: "40 of 43", colour: "#FF7A8A", sub: "in 2025, the government's assessment" },
  ],
  why: { colour: "#2C7DA0", text: "Whether your home floods or your street has dirty air depends on the postcode, and both are decided partly by public money and public rules. The official figures say how big the problem is and how it is changing." },
  chapters: [
    {
      title: "Flooding: how many homes are at risk",
      lede: "The Environment Agency's national assessment, published on 17 December 2024, counts properties in areas at risk of flooding in England.",
      colour: "#2C7DA0",
      blocks: [
        { bars: { items: [
          { label: "From any source", value: 6.3, text: "6.3 million", colour: "#2C7DA0" },
          { label: "From surface water", value: 4.6, text: "4.6 million", colour: "#5A7FA6" },
          { label: "From rivers and the sea", value: 2.4, text: "2.4 million", colour: "#3F7D5C" },
          { label: "By the middle of the century", value: 8, text: "about 8 million", colour: "#B45A3C" },
        ], max: 8.5, note: "Properties in England in areas at risk. Some are at risk from more than one source, so the parts add up to more than the total. The 2050 figure is a projection with climate change: about one property in four." } },
        { cards: [
          { title: "Why the number looks bigger", text: "The assessment says the rise in surface water risk, 43% on the previous assessment, is almost entirely because the Agency's data and modelling improved. It says the overall river and sea total is not increasing." },
          { title: "What \"at risk\" means", text: "A property is counted if it sits in an area that the Environment Agency's flood maps show as having some chance of flooding. It does not mean the property will flood, or has flooded." },
        ] },
      ],
    },
    {
      title: "What is being spent on defences",
      lede: "Flood defence in England is funded by the government.",
      colour: "#B07A2A",
      blocks: [
        { timeline: [
          { when: "2024-25 to 2025-26", text: "£2.65 billion, which the government expected to benefit 52,000 properties by March 2026." },
          { when: "16 June 2025", text: "The government announces £7.9 billion of capital spending on flood defences over ten years, which it calls the largest programme in history." },
          { when: "2026-27 to 2028-29", text: "£4.2 billion over the first three years, which includes the cost of repairing and maintaining existing defences." },
        ] },
        { note: "The £7.9 billion leaves out routine maintenance and incident response, so total spending is higher. Flooding policy is devolved, so Scotland, Wales and Northern Ireland have their own." },
      ],
    },
    {
      title: "Check your own postcode",
      lede: "Live warnings for England, and the official checkers for long-term risk and air quality.",
      colour: "#2C7DA0",
      blocks: [{ node: <FloodAirCheck /> }],
    },
    {
      title: "Air quality: the 2025 results",
      lede: "Each year the government checks the air in 43 zones across the UK against legal limits. The 2025 results were published on 9 October 2026.",
      colour: "#7B5BD6",
      blocks: [
        { facts: [
          { label: "Zones assessed", value: "43", note: "Areas covering the whole UK." },
          { label: "Met the nitrogen dioxide limit", value: "40 of 43", note: "Nitrogen dioxide is a gas. The full assessment gives the detail for the three that exceeded the annual limit." },
          { label: "Met the limits for fine particles", value: "all 43", note: "Both PM2.5 (particles under 2.5 micrometres across) and PM10." },
          { label: "Ozone alerts", value: "21", note: "Public pollution alerts issued in 2025 after short bursts above the ozone information threshold. One zone also exceeded the human health target value for ozone." },
        ] },
        { facts: [
          { label: "Average PM2.5 in city air", value: "8.0 µg/m³", note: "The 2025 average at urban background sites. In England, the legal target is 10 µg/m³ or less by 2040, and a 35% cut in people's exposure compared with 2018." },
        ] },
        { note: "The World Health Organization publishes guideline levels that are lower than the UK's legal limits and targets. Whether UK law should match them is a policy choice. The 2030 interim targets are in the government's Environmental Improvement Plan 2025." },
      ],
    },
    {
      title: "Check a headline: \"40,000 deaths a year\"",
      lede: "A number often quoted about air pollution, and how it was made.",
      colour: "#B45A3C",
      blocks: [
        { cards: [
          { title: "Where it comes from", text: "A 2016 report by the Royal College of Physicians took an estimate of about 29,000 deaths linked to fine particles and one of about 23,500 for nitrogen dioxide, and judged the two together at around 40,000. The government's advisers had warned that simply adding them would overstate it." },
          { title: "What it is, and is not", text: "It is a modelled statistic of deaths \"attributable\" to long-term exposure. No death certificate names air pollution. The advisers suggest saying the harm is equivalent to that many deaths, because pollution mostly makes existing illness worse." },
          { title: "How uncertain it is", text: "The Winton Centre at Cambridge points out that the range is very wide. It also notes that fine particles and nitrogen oxides have fallen to about a quarter of their 1970 levels, and that action is still worthwhile." },
        ] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Environment Agency publishes major update to national flood and coastal erosion risk assessment", url: "https://www.gov.uk/government/news/environment-agency-publishes-major-update-to-national-flood-and-coastal-erosion-risk-assessment", note: "6.3 million, the breakdown, the 2050 projection and why the numbers changed. Published 17 December 2024." },
    { label: "GOV.UK: Largest flood defence investment programme in history", url: "https://www.gov.uk/government/news/hundreds-of-thousands-of-homes-and-businesses-to-benefit-from-largest-flood-defence-investment-programme-in-history", note: "£7.9bn over ten years, £4.2bn for the first three years and £2.65bn for 2024-25 to 2025-26. Published 16 June 2025." },
    { label: "Environment Agency: flood-monitoring service", url: "https://environment.data.gov.uk/flood-monitoring/doc/reference", note: "The live warnings used by the postcode check. England only. Open Government Licence." },
    { label: "GOV.UK: Air pollution in the UK 2025", url: "https://www.gov.uk/government/publications/air-pollution-in-the-uk-2025", note: "The 2025 results: zones, nitrogen dioxide, fine particles and ozone alerts. Published 9 October 2026." },
    { label: "GOV.UK: Particulate matter as PM2.5, compliance assessment 2025", url: "https://www.gov.uk/government/publications/air-pollution-in-the-uk-2025/particulate-matter-as-pm25-compliance-assessment-2025", note: "The 8.0 µg/m³ urban figure and the 2040 targets." },
    { label: "World Health Organization: What are the WHO Air Quality Guidelines?", url: "https://www.who.int/news-room/feature-stories/detail/what-are-the-who-air-quality-guidelines", note: "The guideline levels, which are lower than the UK's legal limits." },
    { label: "Winton Centre: Does air pollution kill 40,000 people each year in the UK?", url: "https://wintoncentre.maths.cam.ac.uk/news/does-air-pollution-kill-40000-people-each-year-uk", note: "How the figure was built and how uncertain it is." },
  ],
  checked: "30 October 2026",
};

export default function Flooding() {
  return <ExplainerPage {...PAGE} />;
}
