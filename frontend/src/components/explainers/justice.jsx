/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconJustice } from "../newIcons";

const PAGE = {
  icon: IconJustice,
  kicker: "Britain in numbers",
  title: "Courts, police and prisons",
  subtitle: "The justice system in England and Wales has three parts that each depend on the others: police catch and charge, courts decide, and prisons hold. This page shows where the latest official figures say the pressure is.",
  tiles: [
    { label: "Open cases in the Crown Court, end of June 2026", value: "80,829", colour: "#FF7A8A", sub: "the highest in the series, up 3% on a year earlier" },
    { label: "Prisoners in England and Wales, 30 June 2026", value: "85,858", colour: "#6FB1FF", sub: "2% fewer than a year earlier" },
    { label: "Police officers, 31 March 2026", value: "145,886", colour: "#FFB45E", sub: "full-time equivalent, England and Wales" },
  ],
  why: { colour: "#5A7FA6", text: "A crime only has a consequence if someone is charged, a court hears the case in a reasonable time and there is a place for the person if they are sentenced. A queue at one stage is felt at the others." },
  chapters: [
    {
      title: "Courts: a record queue",
      lede: "More cases are coming in than the courts are finishing, so the number waiting keeps rising.",
      colour: "#9C3B3B",
      blocks: [
        { facts: [
          { label: "Crown Court: open cases", value: "80,829", note: "A series peak at the end of June 2026, up from 78,226 a year earlier." },
          { label: "Open for a year or more", value: "23,706", note: "A series peak, 22% higher than a year earlier." },
          { label: "Magistrates' courts: open cases", value: "380,230", note: "A series peak, up 9% on a year earlier." },
        ] },
        { text: [
          "The Ministry of Justice says receipts into the criminal courts remained above the number of cases the courts finished, which made open caseloads rise. The Crown Court has had a continued rise in receipts for sexual offence and rape cases, with rape receipts at a series peak.",
          "\"Open\" means the case has not yet reached a final outcome. A long wait is a delay for victims, witnesses and defendants alike.",
        ] },
      ],
    },
    {
      title: "Prisons",
      lede: "The count of prisoners at the end of June 2026 was lower than a year before.",
      colour: "#6E4B6E",
      blocks: [
        { facts: [
          { label: "Prisoners on 30 June 2026", value: "85,858", note: "In England and Wales. Down 2% on the same date in 2025." },
          { label: "First prison receptions, January to March 2026", value: "17,945", note: "A 5% fall on the same period in 2025." },
        ] },
        { text: [<>The Ministry of Justice also publishes weekly prison population figures, and five-year projections. See the projections for how the population is expected to move. The <a href="#/crime">crime</a> page covers recorded crime.</>] },
      ],
    },
    {
      title: "Police",
      lede: "The police workforce was slightly smaller than a year earlier, with more of it in neighbourhood roles.",
      colour: "#3F7D5C",
      blocks: [
        { bars: { items: [
          { label: "Peak, March 2024", value: 147745, text: "147,745", colour: "#3F7D5C" },
          { label: "March 2026", value: 145886, text: "145,886", colour: "#5A7FA6" },
        ], note: "Police officers in England and Wales, full-time equivalent. The March 2026 figure is 1,859 (1.3%) below the March 2024 peak." } },
        { cards: [
          { title: "The whole paid workforce", text: "234,441 full-time equivalents including officers, staff, community support officers and designated officers, down 0.6% on the year." },
          { title: "Neighbourhood policing", text: "20,989 full-time equivalent officers and community support officers, up 22.2% (3,814) on the March 2025 baseline." },
          { title: "Who is accountable", text: <>Police and crime commissioners are due to be replaced. See <a href="#/policeCommissioners">police and crime commissioners</a>.</> },
        ] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Criminal court statistics quarterly, April to June 2026", url: "https://www.gov.uk/government/statistics/criminal-court-statistics-quarterly-april-to-june-2026", note: "Open caseloads in the Crown Court and magistrates' courts, published 24 September 2026." },
    { label: "GOV.UK: Offender management statistics quarterly, January to March 2026", url: "https://www.gov.uk/government/statistics/offender-management-statistics-quarterly-january-to-march-2026", note: "Prison population on 30 June 2026 and first receptions." },
    { label: "GOV.UK: Police workforce, England and Wales: 31 March 2026", url: "https://www.gov.uk/government/statistics/police-workforce-england-and-wales-31-march-2026", note: "Officer numbers, the March 2024 peak and neighbourhood policing." },
    { label: "GOV.UK: Prison population projections 2025 to 2030", url: "https://www.gov.uk/government/statistics/prison-population-projections-2025-to-2030" },
  ],
  checked: "28 October 2026",
};

export default function Justice() {
  return <ExplainerPage {...PAGE} />;
}
