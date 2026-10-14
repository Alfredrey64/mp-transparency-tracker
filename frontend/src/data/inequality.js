// Figures on the Inequality page that are published in a statistical bulletin or release rather than in the spreadsheets read by
// scripts/build-inequality-data.mjs (those are in inequalityData.json). Each says where it comes from; check them against the source when a new
// release is out.

export const SOURCES = {
  hdii: { label: "ONS, The effects of taxes and benefits on household income, financial year ending 2025", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/householddisposableincomeandinequality" },
  incomeBulletin: { label: "ONS, Average household income, UK: financial year ending 2025", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/bulletins/householddisposableincomeandinequality/financialyearending2025" },
  hbai: { label: "DWP, Households Below Average Income, 2024/25", url: "https://www.gov.uk/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" },
  wealthBulletin: { label: "ONS, Household total wealth in Great Britain: April 2020 to March 2022", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/bulletins/totalwealthingreatbritain/april2020tomarch2022" },
  wealthTables: { label: "ONS, Total wealth: Wealth in Great Britain (tables)", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/totalwealthwealthingreatbritain" },
  gdhi: { label: "ONS, Regional gross disposable household income, UK: 1997 to 2024", url: "https://www.ons.gov.uk/economy/regionalaccounts/grossdisposablehouseholdincome/bulletins/regionalgrossdisposablehouseholdincomegdhi/1997to2024" },
  genderPay: { label: "ONS, Gender pay gap in the UK: 2025", url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/genderpaygapintheuk/2025" },
  disabilityPay: { label: "ONS, Disability pay gaps in the UK: 2014 to 2023", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/disability/articles/disabilitypaygapsintheuk/2014to2023" },
  ethnicityLowIncome: { label: "GOV.UK, Ethnicity facts and figures: persistent low income (DWP, Income Dynamics 2010 to 2023)", url: "https://www.ethnicity-facts-figures.service.gov.uk/work-pay-and-benefits/pay-and-income/low-income/latest" },
  twoChild: { label: "GOV.UK, Removing the two-child limit on Universal Credit: impact on low income poverty levels", url: "https://www.gov.uk/government/publications/poverty-impacts-of-social-security-changes-at-budget-2025/removing-the-two-child-limit-on-universal-credit-impact-on-low-income-poverty-levels-in-the-united-kingdom" },
  hbaiPlace: { label: "DWP, Households Below Average Income 2024/25, detailed tables (population, children, working-age and pensioner time series by region)", url: "https://www.gov.uk/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" },
  imd: { label: "Ministry of Housing, Communities and Local Government, English Indices of Deprivation 2025 (income domain), matched to Westminster constituencies", url: "https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025" },
  oecd: { label: "OECD, Income Distribution Database", url: "https://www.oecd.org/en/data/datasets/oecd-income-distribution-database.html" },
  deaton: { label: "Institute for Fiscal Studies, The IFS Deaton Review of Inequalities", url: "https://ifs.org.uk/inequality" },
};

// ONS, Average household income, FYE 2025: the typical (median) household, and the typical household in the poorest and richest fifth.
export const INCOME_HEADLINES = {
  medianDisposable: 39200,
  poorestFifthMedian: 18300,
  richestFifthMedian: 77000,
  medianGrowthPct: 3.5,
};

// ONS, Household total wealth in Great Britain, April 2020 to March 2022: the lines that divide households, and the typical household by age.
export const WEALTH_HEADLINES = {
  median: 293700,
  topTenthFrom: 1200500,
  bottomTenthUpTo: 16500,
  topOnePercentFrom: 3121500,
  topOnePercentShare: 10,
  medianAge: [
    { band: "Aged 16 to 24", value: 15200 },
    { band: "Aged 65 to 74", value: 502500 },
  ],
};

// ONS, Regional GDHI 1997 to 2024: the highest and lowest local areas (the ONS's third level of area, "ITL3"), per person in 2024.
export const LOCAL_AREAS = {
  year: 2024,
  highest: { name: "Westminster and City of London", value: 84292 },
  lowest: { name: "Leicester", value: 16786 },
};

// ONS, Gender pay gap in the UK: 2025 (April 2025, provisional). Median hourly pay without overtime.
export const GENDER_PAY_GAP = {
  year: 2025,
  fullTime: { gap: 6.9, last: 7.1, men: 20.27, women: 18.87 },
  allEmployees: { gap: 12.8, last: 13.1 },
  partTime: { gap: -2.9 },
  byAge: [
    { band: "Aged 22 to 29", gap: 0.9 },
    { band: "Aged 30 to 39", gap: 3.9 },
    { band: "Aged 40 to 49", gap: 9.1 },
    { band: "Aged 50 to 59", gap: 12.5 },
    { band: "Aged 60 and over", gap: 12.6 },
  ],
  byNation: [
    { name: "Northern Ireland", gap: 1.1 },
    { name: "Wales", gap: 1.9 },
    { name: "Scotland", gap: 3.5 },
  ],
  changeSince1997: 10.5,
};

// ONS, Disability pay gaps in the UK: 2014 to 2023 (published 17 October 2024): median hourly pay.
export const DISABILITY_PAY_GAP = { year: 2023, gap: 12.7, disabled: 13.69, nonDisabled: 15.69, men: 15.5, women: 9.6 };

// DWP, Income Dynamics 2010 to 2023: the share of people in persistent low income after housing costs (below 60% of the median in at least three of
// the four years), January 2019 to December 2023. The smaller groups rest on small samples.
export const PERSISTENT_LOW_INCOME_BY_ETHNICITY = {
  period: "2019 to 2023",
  rows: [
    { group: "Other ethnic group", value: 38 },
    { group: "Asian", value: 26 },
    { group: "Black", value: 22 },
    { group: "Mixed", value: 15 },
    { group: "White", value: 12 },
    { group: "White British", value: 12 },
    { group: "White Other", value: 10 },
  ],
  all: 12,
  // The Black group's rate before housing costs, for the widest gap between before and after of any group.
  blackBeforeHousing: 9,
};

// What the government expects the removal of the two-child limit on Universal Credit (from 6 April 2026) to do: fewer children in relative low
// income after housing costs in 2029/30 than if the limit had stayed. It is an estimate, and campaigners give other figures.
export const TWO_CHILD_LIMIT = { fewerChildren: 450000, year: "2029/30", from: "6 April 2026" };
