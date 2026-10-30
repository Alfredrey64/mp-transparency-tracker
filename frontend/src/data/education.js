// What the Education page says, with where each figure comes from. All figures are for England and are the Department for Education's own,
// read from its releases on Explore Education Statistics or from GOV.UK. Checked on the date below.

export const CHECKED = "14 October 2026";

const EES = "https://explore-education-statistics.service.gov.uk/find-statistics";
export const SOURCES = {
  pupils: { label: "DfE, Schools, pupils and their characteristics (June 2026)", url: `${EES}/school-pupils-and-their-characteristics` },
  workforce: { label: "DfE, School workforce in England (June 2026)", url: `${EES}/school-workforce-in-england` },
  ks4: { label: "DfE, Key stage 4 performance, 2024/25 (April 2026)", url: `${EES}/key-stage-4-performance` },
  sen: { label: "DfE, Special educational needs in England (June 2026)", url: `${EES}/special-educational-needs-in-england` },
  ehc: { label: "DfE, Education, health and care plans (June 2026)", url: `${EES}/education-health-and-care-plans` },
  loans: { label: "Student Loans Company and DfE, Student loans in England: financial year 2025-26", url: "https://www.gov.uk/government/statistics/student-loans-in-england-2025-to-2026/student-loans-in-england-financial-year-2025-26" },
  declining: { label: "House of Commons Library, Declining pupil numbers in England", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-8151/" },
  absence: { label: "DfE, Pupil absence in schools in England", url: `${EES}/pupil-absence-in-schools-in-england` },
  ks2: { label: "DfE, Key stage 2 attainment: national headlines", url: `${EES}/key-stage-2-attainment-national-headlines` },
  freeMeals: { label: "DfE, Free school meals guidance for schools and local authorities", url: "https://www.gov.uk/government/publications/free-school-meals-guidance-for-schools-and-local-authorities" },
  feeHistory: { label: "House of Commons Library, Tuition fees in England: history, debates and international comparisons", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-10155/" },
  cpi: { label: "ONS, Consumer price inflation (CPI index, 2015 = 100)", url: "https://www.ons.gov.uk/economy/inflationandpriceindices" },
  fees: { label: "GOV.UK, Student finance for new full-time students", url: "https://www.gov.uk/student-finance/new-fulltime-students" },
  repay: { label: "GOV.UK, Repaying your student loan: what you pay", url: "https://www.gov.uk/repaying-your-student-loan/what-you-pay" },
};

export const SCHOOLS = {
  year: "January 2026",
  pupils: 8.9, pupilsChange: -112200,
  independent: 560300, independentPct: 6.3, independentChangePct: -3.8,
  freeMeals: 26.5,
  englishExtra: 21.6,
  teachers: 466372, teachersChange: -1900,
  vacancies: 1600, vacanciesPer1000: 4,
  leavers: 38632,
  ratio: 17.9,
};

export const ATTAINMENT = {
  year: "2025/26",
  attainment8Gap: 15.1, attainment8GapLast: 15.5, attainment8Gap201819: 13.6,
  englishMathsGap: 26.8,
  disadvantagedShare: 29.8,
  gapIndex: 3.82,
};

export const SEND = {
  year: "January 2026",
  withSen: 1.8, withSenShare: 20.8,
  ehcInSchools: 538547, ehcShare: 6.0,
  support: 1319780, supportShare: 14.8,
  plans: 718838, plansChangePct: 12.5, newPlans2025: 110708, newPlansChangePct: 13.3,
  within20Weeks: 46.1,
};

export const UNIVERSITY = {
  fee2526: 9535, fee2627: 9790,
  balanceBn: 294.6, issuedBn: 21.3, repaidBn: 5.3,
  paying: 3.1, averageOnEntry: 47730,
  thresholds: [
    { plan: "Plan 1", value: 26900 },
    { plan: "Plan 2", value: 29385 },
    { plan: "Plan 4", value: 33795 },
    { plan: "Plan 5", value: 25000 },
    { plan: "Postgraduate loan", value: 21000, rate: 6 },
  ],
  rate: 9,
};

// The most a university in England could charge a full-time undergraduate for each academic year (the year it starts): £9,000 from 2012/13, £9,250
// from 2017/18, held there until 2024/25, then raised with inflation (House of Commons Library, and GOV.UK for 2025/26 and 2026/27).
export const FEE_HISTORY = [
  [2012, 9000], [2013, 9000], [2014, 9000], [2015, 9000], [2016, 9000],
  [2017, 9250], [2018, 9250], [2019, 9250], [2020, 9250], [2021, 9250], [2022, 9250], [2023, 9250], [2024, 9250],
  [2025, 9535], [2026, 9790],
].map(([year, fee]) => ({ year, fee }));
