// What the Social care and childcare page says that is not in careData.json (built by scripts/build-care-data.mjs): where each figure comes from, and the
// facts the department publishes as text. Each is as the named body published it, with its date.

export const CHECKED = "15 October 2026";

export const SOURCES = {
  finance: { label: "DHSC and NHS England, Adult social care finance report, England: 2024 to 2025", url: "https://www.gov.uk/government/statistics/adult-social-care-finance-report-england-2024-to-2025" },
  activity: { label: "NHS England, Adult social care activity report, England: 2024 to 2025", url: "https://www.gov.uk/government/statistics/adult-social-care-activity-report-england-2024-to-2025" },
  carers: { label: "NHS England, Survey of adult carers in England: 2025 to 2026 (24 September 2026)", url: "https://www.gov.uk/government/statistics/survey-of-adult-carers-in-england-2025-to-2026-report" },
  census: { label: "ONS, Unpaid care, England and Wales: Census 2021", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/bulletins/unpaidcareenglandandwales/census2021" },
  workforce: { label: "Skills for Care, The state of the adult social care sector and workforce in England (14 October 2026, data for 2025 to 2026)", url: "https://www.skillsforcare.org.uk/Adult-Social-Care-Workforce-Data/Workforce-intelligence/publications/national-information/The-state-of-the-adult-social-care-sector-and-workforce-in-England.aspx" },
  funded: { label: "Department for Education, Funded early education and childcare (2 July 2026)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/funded-early-education-and-childcare" },
  parents: { label: "Department for Education, Childcare and early years survey of parents: 2025 (9 July 2026)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/childcare-and-early-years-survey-of-parents/2025" },
  workingParents: { label: "GOV.UK, Free childcare for working parents", url: "https://www.gov.uk/30-hours-free-childcare" },
};

// The Childcare and early years survey of parents, 2025: Ipsos interviews with a nationally representative sample of 4,953 parents of children aged 0 to 14 in
// England, between April and December 2025. The department publishes these as text, so they are written here as published. Changes are against 2024.
export const PARENTS = {
  sample: 4953,
  formalUseAge04: 67, formalUseAge04Before: 64,
  formalUseAge1: 45, formalUseAge1Before: 38, formalUseAge1Earlier: 34, formalUseAge1EarlierYear: "2010 to 2011",
  hoursAge04: 26.7, hoursAge04Before: 24.0, hoursAge2: 21.8, hoursAge2Before: 18.0,
  weeklyPaidAge02: 75, weeklyPaidAge02Before: 108,
  affordabilityGood: 48, affordabilityGoodBefore: 43,
  easyToMeetCost: 50, easyToMeetCostBefore: 41,
  difficultToMeetCost: 24, difficultToMeetCostBefore: 31,
  extrasAware: 84, extrasStoppedApply: 12,
  fewerHoursWithoutUnder2: 40, fewerHoursWithoutAge2: 35, fewerHoursWithoutAge2Before: 23,
  qualityGood: 71, qualityGoodBefore: 72,
  flexibility2Offer: 74, flexibility2OfferBefore: 59,
};

export const UNPAID = { people: 5.0, share: 9.0, shareBefore: 11.4, hours50: 1.5, hours50Share: 2.8 };

// The working parents' entitlement as GOV.UK describes it in October 2026.
export const ENTITLEMENT = { hours: 30, weeks: 38, from: "9 months", to: "4 years", maxIncome: 100000 };
