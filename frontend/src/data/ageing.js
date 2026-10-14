// What the Ageing and pensions page says, with where each figure comes from. Checked on the date below.

export const CHECKED = "14 October 2026";

export const SOURCES = {
  rates: { label: "GOV.UK, Benefit and pension rates 2025 to 2026 (and earlier years)", url: "https://www.gov.uk/government/publications/benefit-and-pension-rates-2025-to-2026/benefit-and-pension-rates-2025-to-2026" },
  onsPrices: { label: "ONS, Consumer price inflation and average weekly earnings", url: "https://www.ons.gov.uk/economy/inflationandpriceindices" },
  newPension: { label: "GOV.UK, New State Pension: what you'll get", url: "https://www.gov.uk/new-state-pension/what-youll-get" },
  spaTimetable: { label: "GOV.UK, State Pension age timetables", url: "https://www.gov.uk/government/publications/state-pension-age-timetable/state-pension-age-timetable" },
  spaCalculator: { label: "GOV.UK, Check your State Pension age", url: "https://www.gov.uk/state-pension-age" },
  obrFrs2026: { label: "Office for Budget Responsibility, Fiscal risks and sustainability (July 2026)", url: "https://obr.uk/frs/" },
  obrFrs2025: { label: "Office for Budget Responsibility, Fiscal risks and sustainability (July 2025)", url: "https://obr.uk/frs/" },
  onsProjections: { label: "ONS, National population projections: 2022-based", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationprojections/bulletins/nationalpopulationprojections/2022based" },
  hbai: { label: "DWP, Households Below Average Income, 2024/25", url: "https://www.gov.uk/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" },
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

// ONS 2022-based national population projections (UK, principal projection), millions of people: children are under 16, working age is 16 up to
// State Pension age, and pensionable age is State Pension age and over, which takes the planned rises in the age into account. The ONS bulletin gives
// the totals for 2022 (67.6) and 2047 (76.6) and says the number of children stays near its 2032 level, so 2047's children are the total less the others.
export const LIFE_STAGES = {
  2022: { children: 12.4, working: 43.2, pensionable: 12.0 },
  2032: { children: 11.6, working: 47.3, pensionable: 13.7 },
  2047: { children: 11.6, working: 49.9, pensionable: 15.1 },
};
export const POPULATION = {
  total2047: 76.6,
  dependency: { y2022: 278, y2032: 289, y2047: 302 },
  over85: { y2022: 1.7, y2047: 3.3, share2022: 2.5, share2047: 4.3 },
  children: { y2022: 12.4, y2032: 11.6 },
};

export const PENSION_AGE = [
  { when: "Now to 2026", text: "66 for men and women." },
  { when: "2026 to 2028", text: "Rising to 67 under the Pensions Act 2014." },
  { when: "2044 to 2046", text: "Rising to 68 under the Pensions Act 2007, as the law now stands." },
];
