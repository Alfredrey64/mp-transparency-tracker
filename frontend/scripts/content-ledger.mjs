// Things on the site that are true only until a known day. The weekly content check (audit-content.mjs) lists a row from `lead` days before its date until three weeks after
// it, and the check opens an issue while a row is listed. To retire a row, make the page right (or confirm it is still right) and either change the date or delete the row.
//
// Add a row whenever a page states something with a built-in end date: a rate that holds "until", a scheme that "runs to", a report "due in". Dates below were read
// from the sources named; a row's `where` says which files to look at.

export const DUE = [
  { date: "2026-11-26", lead: 4, what: "Ofgem announces the next energy price cap (for 1 January to 31 March 2027)", where: "CAP_NOW in src/data/energy.js, the price-cap lines on the Energy page, and the capNews source" },
  { date: "2027-02-01", lead: 14, what: "Alcohol duty rises on 1 February 2027", where: "src/data/taxSeries.json (alcohol.*), which already holds the new rates, and the Alcohol duty page of src/data/taxCatalogue.js" },
  { date: "2027-02-28", lead: 21, what: "The Pensions Commission's final report is due in February 2027", where: "src/components/Ageing.jsx (the 'What the Autumn Budget 2026 decided' panel)" },
  { date: "2027-03-31", lead: 30, what: "The Spring forecast / next fiscal event, and the end of the 2026-27 tax year", where: "NEXT_BUDGET in src/data/taxEvents.js, the 'Budget' explainers (howBudgetWorks.jsx), and any rate that changes on 6 April 2027" },
  { date: "2027-04-01", lead: 21, what: "New tax-year rates start (business rates, landfill, sugar levy, air passenger duty, National Living Wage)", where: "src/data/taxSeries.json (already holds the Budget 2026 rates), src/data/taxCatalogue.js notes, and the pay and minimum wage wording" },
  { date: "2027-06-30", lead: 30, what: "The 5p fuel duty cut, the freeze and the 0% VAT on household electricity are due to end on 1 July 2027", where: "src/data/taxSeries.json (fuel.*, vat.electricity), src/data/taxCatalogue.js (fuel and VAT notes), src/data/energy.js (vatRelief), src/data/glossaryStatsTerms.js (Fuel Duty), src/data/taxStories.js (fuel-escalator)" },
  { date: "2027-01-01", lead: 21, what: "The UK joins Erasmus+ for 2027 (the pages say 'will take part')", where: "src/data/brexit.js (the December 2025 entry) and src/components/BrexitSociety.jsx" },
  { date: "2027-04-01", lead: 30, what: "Dated 'by 2027' or 'from 2027 to 2028' promises fall due: defence at 2.5% of GDP, aid cut to 0.3%, the proposed Sovereign Grant of £99.9m", where: "src/data/defence.js, src/components/Defence.jsx, src/data/answers.js, src/components/explainers/foreignPolicy.jsx, src/components/explainers/monarchy.jsx" },
  { date: "2027-05-31", lead: 45, what: "The under-16 social media protections were expected 'in spring 2027'", where: "src/components/explainers/digital.jsx" },
  { date: "2027-07-31", lead: 45, what: "The review of election spending limits is due to report by July 2027", where: "src/components/explainers/electionSpending.jsx, src/data/spendLimits.js and the election spending page" },
];
