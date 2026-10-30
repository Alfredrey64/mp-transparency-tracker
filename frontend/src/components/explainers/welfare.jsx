/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconCoin } from "../icons";

const PAGE = {
  look: "ledger",
  icon: IconCoin,
  kicker: "Money and the state",
  title: "Welfare and benefits",
  subtitle: "About one pound in every five the government spends goes on benefits and pensions. This page sets out how much, who gets it, what each main benefit pays this year, how the rates are set, and what the official watchdog says about fraud and error.",
  tiles: [
    { label: "Spent on welfare in 2025-26", value: "£333bn", colour: "#6FB1FF", sub: "the Office for Budget Responsibility's forecast, including Northern Ireland" },
    { label: "People on Universal Credit", value: "8.3m", colour: "#FFB45E", sub: "claimants in March 2026, the DWP's figure" },
    { label: "People getting the State Pension", value: "13.3m", colour: "#FF7A8A", sub: "in March 2026" },
  ],
  why: { colour: "#8A6A2F", text: "Benefits and pensions are the biggest single thing the government pays for, and most people will claim at some point, as a child, a parent, a carer, a worker who falls ill, or a pensioner. Rates and rules are set by Parliament, so they change." },
  chapters: [
    {
      title: "Where the money goes",
      lede: "The Department for Work and Pensions forecasts £309bn of benefit spending in Great Britain in 2025-26. Just over half of it is for pensioners.",
      colour: "#8A6A2F",
      blocks: [
        { bars: { items: [
          { label: "Pensioners", value: 177.7, text: "£178bn", colour: "#5A7FA6" },
          { label: "Working age", value: 126.1, text: "£126bn", colour: "#B07A2A" },
          { label: "Children", value: 5.3, text: "£5bn", colour: "#7A5AF0" },
        ], max: 180, note: "Forecast benefit spending in 2025-26, Great Britain, DWP's grouping. The State Pension is the biggest part of the pensioner figure. Figures are rounded and may not add up." } },
        { duo: { beforeName: "2010-11", afterName: "2025-26 (forecast)", items: [
          { label: "Pensioners", before: 6.14, after: 5.82, beforeText: "6.1% of GDP", afterText: "5.8% of GDP" },
          { label: "Working age", before: 3.14, after: 4.13, beforeText: "3.1% of GDP", afterText: "4.1% of GDP" },
          { label: "All benefits", before: 9.4, after: 10.12, beforeText: "9.4% of GDP", afterText: "10.1% of GDP" },
        ], max: 10.5, note: "Benefit spending as a share of the whole economy. The DWP forecasts it at 10.5% of GDP by 2030-31, about £381bn in cash terms." } },
        { text: ["Benefits are 22.6% of everything the government spends (what the Treasury calls total managed expenditure) in 2025-26. The OBR counts a wider set, including Northern Ireland and some benefits paid by HMRC, and puts the total at £332.9bn, up from £314.8bn in 2024-25."] },
      ],
    },
    {
      title: "What the main benefits pay in 2026-27",
      lede: "Rates were raised on 6 April 2026. The table of rates is published by the DWP.",
      colour: "#3F7D5C",
      blocks: [
        { facts: [
          { label: "New State Pension, full rate, a week", value: "£241.30", note: "Up 4.8% from £230.25. For people who reached State Pension age after 5 April 2016." },
          { label: "Pension Credit minimum guarantee, single, a week", value: "£238.00", note: "Up 4.8% from £227.10. The income that Pension Credit tops a pensioner up to." },
          { label: "Universal Credit, single, aged 25 or over, a month", value: "£424.90", note: "Up 6.2% from £400.14. The standard allowance, before any extra for housing, children, disability or caring." },
          { label: "PIP daily living, enhanced rate, a week", value: "£114.60", note: "Up 3.8% from £110.40. The standard rate is £76.70. PIP is for the extra costs of a long-term health condition or disability." },
          { label: "Carer's Allowance, a week", value: "£86.45", note: "Up 3.8% from £83.30. For people who care for someone for at least 35 hours a week." },
          { label: "Jobseeker's Allowance, aged 25 or over, a week", value: "£95.55", note: "Up 3.8% from £92.05. The old unemployment benefit, still paid to some people." },
        ] },
        { note: "The percentage rises are worked out from the DWP's own 2025-26 and 2026-27 columns. Universal Credit is paid monthly; most of the others weekly." },
      ],
    },
    {
      title: "How many people get each one",
      lede: "The DWP counts the people claiming each benefit. Many claim more than one, so the numbers do not add up to a single total.",
      colour: "#B45A3C",
      blocks: [
        { bars: { items: [
          { label: "State Pension", value: 13.308, text: "13.3 million", colour: "#5A7FA6" },
          { label: "Universal Credit", value: 8.289, text: "8.3 million", colour: "#B07A2A" },
          { label: "Personal Independence Payment", value: 3.98, text: "4.0 million", colour: "#3F7D5C" },
          { label: "Attendance Allowance", value: 1.803, text: "1.8 million", colour: "#7A5AF0" },
          { label: "Carer's Allowance", value: 1.408, text: "1.4 million", colour: "#B45A3C" },
          { label: "Disability Living Allowance", value: 1.404, text: "1.4 million", colour: "#8A6A2F" },
          { label: "Pension Credit", value: 1.382, text: "1.4 million", colour: "#5B6784" },
        ], max: 14, note: "People claiming in March 2026. PIP, Attendance Allowance, Carer's Allowance and DLA exclude Scotland, which runs its own versions through Social Security Scotland. In all, 25 million people claimed at least one DWP benefit." } },
      ],
    },
    {
      title: "How the rates are set",
      lede: "Parliament does not set each rate afresh. A rule decides how much each one rises, and the government can change the rule.",
      colour: "#5A7FA6",
      blocks: [
        { cards: [
          { title: "Most benefits follow prices", text: "Most working-age benefits rise each April by the inflation rate (the consumer prices index) of the previous September. That was 3.8%, and it is the rise in PIP, Carer's Allowance and Jobseeker's Allowance this year." },
          { title: "The State Pension has a floor", text: "Under the triple lock, the State Pension rises by the highest of average earnings growth, prices or 2.5%. This year earnings were the highest, at 4.8%." },
          { title: "Universal Credit rose faster", text: "The Universal Credit standard allowance rose by 6.2% this year, faster than prices. Other parts of Universal Credit, such as the child element, rose by 3.8%." },
        ] },
        { note: "Whether the triple lock and the other rules are the right ones is a political argument, not a matter of fact. See the page on ageing and pensions for the pension side." },
      ],
    },
    {
      title: "What changed recently",
      lede: "Two things people ask about: the two-child limit and fraud and error.",
      colour: "#7B5BD6",
      blocks: [
        { timeline: [
          { when: "April 2017", text: "The two-child limit begins: Universal Credit and child tax credit stop adding an amount for a third and later child born from this date." },
          { when: "6 April 2026", text: "The limit ends. The government expected fewer children to be in relative low income as a result." },
          { when: "23 June 2026", text: "The OBR's welfare report finds that fraud and error had fallen back to close to pre-pandemic levels by 2025-26, and expects it to keep falling, though it says this is uncertain." },
        ] },
        { facts: [
          { label: "Fraud and error rate", value: "3.2%", note: "Of benefit spending, down from a peak of 4.3% in 2020-21 and 2021-22." },
          { label: "Overpaid in 2025-26", value: "£10.3bn", note: "The OBR's forecast of overpayments across the welfare system. Overpayments are money paid out in error or by fraud, not all of which is recovered." },
          { label: "Universal Credit's share of spending", value: "over 25%", note: "Up from under 10% in 2019-20, as the old benefits were replaced. It also accounts for over 70% of fraud and error." },
        ] },
      ],
    },
    {
      title: "Check a headline",
      lede: "Questions that help when a story quotes a welfare figure.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "Which benefits are counted?", text: "\"The welfare bill\" can mean the DWP's benefits only, or the OBR's wider total, which adds Northern Ireland, tax credits and Child Benefit. The OBR's figure is £333bn; the DWP's is £309bn." },
          { title: "Is it cash or real terms?", text: "A cash rise can still be a cut once prices are taken into account. The DWP's tables give both." },
          { title: "People or claims?", text: "Someone can claim several benefits, and a couple can count as one claim. Compare people with people." },
          { title: "Which nation?", text: "Many disability and carer benefits are run by Social Security Scotland, so UK headlines can leave Scotland out." },
        ] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Benefit and pension rates 2026 to 2027", url: "https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027", note: "Every weekly and monthly rate, with the 2025-26 rate beside it. The percentage rises on this page are worked out from it." },
    { label: "DWP: Benefit expenditure and caseload tables 2026", url: "https://www.gov.uk/government/publications/benefit-expenditure-and-caseload-tables-2026", note: "Spending by group in 2025-26, shares of GDP and total managed expenditure, the forecast to 2030-31, and the OBR-basis total of £332.9bn." },
    { label: "DWP: Annual DWP Benefits Statistics Compendium 2026", url: "https://www.gov.uk/government/statistics/annual-dwp-benefits-statistics-compendium-2026/annual-dwp-benefits-statistics-compendium-2026", note: "The number of people claiming each benefit in March 2026, and the 25 million who claimed at least one." },
    { label: "OBR: Welfare trends report, June 2026", url: "https://obr.uk/wtr/welfare-trends-report-june-2026/", note: "The fraud and error rate, the £10.3bn forecast overpayment and Universal Credit's share of spending." },
    { label: "GOV.UK: Poverty impacts of social security changes at Budget 2025", url: "https://www.gov.uk/government/publications/poverty-impacts-of-social-security-changes-at-budget-2025", note: "The end of the two-child limit." },
    { label: "Social Security Scotland", url: "https://www.socialsecurity.gov.scot/", note: "The benefits Scotland runs itself." },
  ],
  checked: "30 October 2026",
};

export default function Welfare() {
  return <ExplainerPage {...PAGE} />;
}
