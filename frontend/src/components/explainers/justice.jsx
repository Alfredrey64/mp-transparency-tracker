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
      title: "One chain, three links",
      lede: "A crime only has a consequence if the police act, a court hears the case in time, and there is somewhere to hold the person if they are sentenced.",
      colour: "#5A7FA6",
      blocks: [
        { pipeline: [
          { label: "Police", value: "145,886", note: "full-time officers in England and Wales at 31 March 2026. They investigate and charge.", colour: "#3F7D5C" },
          { label: "Courts", value: "80,829", note: "cases waiting in the Crown Court at the end of June 2026. Judges and juries decide.", colour: "#9C3B3B" },
          { label: "Prisons", value: "85,858", note: "people held on 30 June 2026. This is where a custodial sentence is served.", colour: "#6E4B6E" },
        ] },
      ],
    },
    {
      title: "Courts: a record queue",
      lede: "More cases are coming in than the courts are finishing, so the number waiting keeps rising.",
      colour: "#9C3B3B",
      blocks: [
        { duo: { beforeName: "End of June 2025", afterName: "End of June 2026", items: [
          { label: "Crown Court: open cases", before: 78226, after: 80829, beforeText: "78,226", afterText: "80,829" },
          { label: "Magistrates' courts: open cases", before: 347365, after: 380230, beforeText: "347,365", afterText: "380,230" },
        ], max: 400000, note: "Both are the highest since the series began. Open means the case has not yet reached a final outcome." } },
        { facts: [
          { label: "Crown Court cases open for a year or more", value: "23,706", note: "A series peak, 22% higher than a year earlier." },
          { label: "Rise in the Crown Court queue over the year", value: "+3%", note: "From 78,226 to 80,829 open cases." },
        ] },
        { text: [
          "The Ministry of Justice says receipts into the criminal courts remained above the number of cases the courts finished, which made open caseloads rise. The Crown Court has had a continued rise in receipts for sexual offence and rape cases, with rape receipts at a series peak.",
          "A long wait is a delay for victims, witnesses and defendants alike.",
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
        { text: [<>The Ministry of Justice also publishes weekly prison population figures, and five-year projections. The <a href="#/crime">crime</a> page covers recorded crime.</>] },
      ],
    },
    {
      title: "Police",
      lede: "The number of officers is slightly below its peak, with more of the workforce in neighbourhood roles.",
      colour: "#3F7D5C",
      blocks: [
        { duo: { beforeName: "Earlier", afterName: "31 March 2026", items: [
          { label: "Police officers, against the March 2024 peak", before: 147745, after: 145886, beforeText: "147,745", afterText: "145,886" },
          { label: "Neighbourhood policing, against the March 2025 baseline", before: 17175, after: 20989, beforeText: "17,175", afterText: "20,989" },
        ], max: 150000, note: "Full-time equivalents. Officers are 1.3% below the peak. Neighbourhood policing counts officers and community support officers, and has grown 22.2%." } },
        { facts: [
          { label: "The whole paid workforce", value: "234,441", note: "Officers, staff, community support officers and designated officers. Down 0.6% on the year." },
        ] },
        { text: [<>Police and crime commissioners are due to be replaced. See <a href="#/policeCommissioners">police and crime commissioners</a>.</>] },
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
