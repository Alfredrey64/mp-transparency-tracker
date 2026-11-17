/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { JusticeScene } from "../story/ServiceArt";
import { JusticeChain, QueueDots, PrisonProjection } from "../story/JusticeArt";
import { IconJustice } from "../newIcons";
import { JUSTICE, fmtN, pctChange } from "../../data/justiceFigures";

const { courts: C, prisons: P, police: PO } = JUSTICE;
const pct = (a, b) => `${pctChange(a, b) > 0 ? "+" : ""}${pctChange(a, b)}%`;
const below = (a, b) => (Math.round(((a - b) / a) * 1000) / 10).toFixed(1);
const grew = (a, b) => (Math.round(((b - a) / a) * 1000) / 10).toFixed(1);

const PAGE = {
  icon: IconJustice,
  kicker: "Britain in numbers",
  title: "Courts, police and prisons",
  subtitle: "The justice system in England and Wales has three parts that each depend on the others: police catch and charge, courts decide, and prisons hold. This page shows where the latest official figures say the pressure is.",
  lead: <JusticeChain />,
  why: { colour: "#5A7FA6", text: "A crime only has a consequence if someone is charged, a court hears the case in a reasonable time and there is a place for the person if they are sentenced. A queue at one stage is felt at the others." },
  chapters: [
    {
      title: "Courts: a record queue",
      lede: "More cases are coming in than the courts are finishing, so the number waiting keeps rising.",
      colour: "#9C3B3B",
      blocks: [
        { duo: { beforeName: C.beforeAsAt, afterName: `${C.asAt[0].toUpperCase()}${C.asAt.slice(1)}`, items: [
          { label: "Crown Court: open cases", before: C.crownBefore, after: C.crown, beforeText: fmtN(C.crownBefore), afterText: fmtN(C.crown) },
          { label: "Magistrates' courts: open cases", before: C.magsBefore, after: C.mags, beforeText: fmtN(C.magsBefore), afterText: fmtN(C.mags) },
        ], max: 400000, note: "Both are the highest since the series began. Open means the case has not yet reached a final outcome." } },
        { facts: [
          { label: "Crown Court cases open for a year or more", value: fmtN(C.crownLong), note: "A series peak, 22% higher than a year earlier." },
          { label: "Rise in the Crown Court queue over the year", value: pct(C.crownBefore, C.crown), note: `From ${fmtN(C.crownBefore)} to ${fmtN(C.crown)} open cases.` },
        ] },
        { node: <QueueDots /> },
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
          { label: `Prisoners on ${P.asAt}`, value: fmtN(P.population), note: "In England and Wales. Down 2% on the same date in 2025." },
          { label: "First prison receptions, January to March 2026", value: fmtN(P.firstReceptions), note: P.receptionsChange },
        ] },
        { node: <PrisonProjection /> },
        { text: [<>The Ministry of Justice also publishes weekly prison population figures, and five-year projections. The <a href="#/crime">crime</a> page covers recorded crime.</>] },
      ],
    },
    {
      title: "Police",
      lede: "The number of officers is slightly below its peak, with more of the workforce in neighbourhood roles.",
      colour: "#3F7D5C",
      blocks: [
        { duo: { beforeName: "Earlier", afterName: PO.asAt, items: [
          { label: "Police officers, against the March 2024 peak", before: PO.peak, after: PO.officers, beforeText: fmtN(PO.peak), afterText: fmtN(PO.officers) },
          { label: "Neighbourhood policing, against the March 2025 baseline", before: PO.neighbourhoodBefore, after: PO.neighbourhood, beforeText: fmtN(PO.neighbourhoodBefore), afterText: fmtN(PO.neighbourhood) },
        ], max: 150000, note: `Full-time equivalents. Officers are ${below(PO.peak, PO.officers)}% below the peak. Neighbourhood policing counts officers and community support officers, and has grown ${grew(PO.neighbourhoodBefore, PO.neighbourhood)}%.` } },
        { facts: [
          { label: "The whole paid workforce", value: fmtN(PO.workforce), note: "Officers, staff, community support officers and designated officers. Down 0.6% on the year." },
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
  return <ExplainerPage {...PAGE} scene={<JusticeScene />} />;
}
