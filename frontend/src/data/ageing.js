// What the Ageing and pensions page says, with where each figure comes from. Checked on the date below.

export const CHECKED = "16 November 2026";

export const SOURCES = {
  rates: { label: "GOV.UK, Benefit and pension rates 2025 to 2026 (and earlier years)", url: "https://www.gov.uk/government/publications/benefit-and-pension-rates-2025-to-2026/benefit-and-pension-rates-2025-to-2026" },
  onsPrices: { label: "ONS, Consumer price inflation and average weekly earnings", url: "https://www.ons.gov.uk/economy/inflationandpriceindices" },
  newPension: { label: "GOV.UK, New State Pension: what you'll get", url: "https://www.gov.uk/new-state-pension/what-youll-get" },
  spaTimetable: { label: "GOV.UK, State Pension age timetables", url: "https://www.gov.uk/government/publications/state-pension-age-timetable/state-pension-age-timetable" },
  spaCalculator: { label: "GOV.UK, Check your State Pension age", url: "https://www.gov.uk/state-pension-age" },
  obrFrs2026: { label: "Office for Budget Responsibility, Fiscal risks and sustainability (July 2026)", url: "https://obr.uk/frs/" },
  obrFrs2025: { label: "Office for Budget Responsibility, Fiscal risks and sustainability (July 2025)", url: "https://obr.uk/frs/" },
  onsProjections: { label: "ONS, National population projections: 2024-based", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationprojections/bulletins/nationalpopulationprojections/2024based" },
  hbai: { label: "DWP, Households Below Average Income, 2024/25", url: "https://www.gov.uk/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" },
  budget2026: { label: "HM Treasury, Budget 2026 (28 October 2026)", url: "https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html" },
  taxes: { label: "HMRC, Rates and allowances: Income Tax", url: "https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past" },
};

// The full new State Pension each April (GOV.UK, Benefit and pension rates, and the 2016 launch rate), and which of the three triple-lock measures set
// each rise: the 2.5% minimum, price inflation (CPI the September before) or average earnings growth. In 2022 the earnings figure was set aside
// because pay was distorted by the pandemic.
export const PENSION_RATES = [
  { year: 2016, weekly: 155.65, setBy: null },
  { year: 2017, weekly: 159.55, setBy: "minimum" },
  { year: 2018, weekly: 164.35, setBy: "prices" },
  { year: 2019, weekly: 168.6, setBy: "earnings" },
  { year: 2020, weekly: 175.2, setBy: "earnings" },
  { year: 2021, weekly: 179.6, setBy: "minimum" },
  { year: 2022, weekly: 185.15, setBy: "prices" },
  { year: 2023, weekly: 203.85, setBy: "prices" },
  { year: 2024, weekly: 221.2, setBy: "earnings" },
  { year: 2025, weekly: 230.25, setBy: "earnings" },
  { year: 2026, weekly: 241.3, setBy: "earnings" },
];
export const SET_BY = {
  minimum: { label: "The 2.5% minimum", colour: "#6B7280" },
  prices: { label: "Prices", colour: "#C0561F" },
  earnings: { label: "Average earnings", colour: "#1D4ED8" },
};

export const STATE_PENSION = {
  fullNewWeekly: 241.3,
  upratingFloor: 2.5,
  personalAllowance: 12570,
  spending2425Bn: 138,
  spending2425PctGdp: 5,
};

// The OBR's long-run projection of state pension spending (July 2026): about 5% of GDP now, about 9% over the next fifty years if the triple lock stays,
// and about 7% if the pension rose with average earnings instead. The year ranges are the OBR's own.
export const OBR_LONG_RUN = { now: 5, withTripleLock: 9, withEarnings: 7, reportDate: "July 2026" };

// ONS 2024-based national population projections (UK, principal projection, published 28 April 2026), millions of people: children are under 16, working age is 16 up to
// State Pension age, and pensionable age is State Pension age and over, which takes the planned rises in the age into account. The bulletin gives 2024 and 2034 directly and
// gives 2049 as changes since 2024 (children down 2.1 million, working age up 2.2 million, pensionable age 15.3 million), so the 2049 figures are rounded to 0.1 million.
export const LIFE_STAGES = {
  2024: { children: 12.6, working: 44.3, pensionable: 12.4 },
  2034: { children: 11.0, working: 45.8, pensionable: 14.2 },
  2049: { children: 10.5, working: 46.5, pensionable: 15.3 },
};
export const POPULATION = {
  base: 2024,
  mid: 2034,
  end: 2049,
  totalBase: 69.3,
  totalEnd: 72.3,
  dependency: { base: 280, mid: 310, end: 329 },
  over85: { base: 1.75, end: 3.6, shareBase: 2.5, shareEnd: 4.9 },
  children: { base: 12.6, mid: 11.0 },
};

export const PENSION_AGE = [
  { when: "Now to 2026", text: "66 for men and women." },
  { when: "2026 to 2028", text: "Rising to 67 under the Pensions Act 2014." },
  { when: "2044 to 2046", text: "Rising to 68 under the Pensions Act 2007, as the law now stands." },
];
