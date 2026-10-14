// What the Ageing and pensions page says, with where each figure comes from. Checked on the date below.

export const CHECKED = "14 October 2026";

export const SOURCES = {
  newPension: { label: "GOV.UK, New State Pension: what you'll get", url: "https://www.gov.uk/new-state-pension/what-youll-get" },
  spaTimetable: { label: "GOV.UK, State Pension age timetables", url: "https://www.gov.uk/government/publications/state-pension-age-timetable/state-pension-age-timetable" },
  obrFrs2026: { label: "Office for Budget Responsibility, Fiscal risks and sustainability (July 2026)", url: "https://obr.uk/frs/" },
  obrFrs2025: { label: "Office for Budget Responsibility, Fiscal risks and sustainability (July 2025)", url: "https://obr.uk/frs/" },
  onsProjections: { label: "ONS, National population projections: 2022-based", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationprojections/bulletins/nationalpopulationprojections/2022based" },
  hbai: { label: "DWP, Households Below Average Income, 2024/25", url: "https://www.gov.uk/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" },
  taxes: { label: "HMRC, Rates and allowances: Income Tax", url: "https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past" },
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

// ONS 2022-based national population projections (UK, principal projection).
export const POPULATION = {
  dependency: { y2022: 278, y2032: 289, y2047: 302 },
  over85: { y2022: 1.7, y2047: 3.3 },
  children: { y2022: 12.4, y2032: 11.6 },
};

export const PENSION_AGE = [
  { when: "Now to 2026", text: "66 for men and women." },
  { when: "2026 to 2028", text: "Rising to 67 under the Pensions Act 2014." },
  { when: "2044 to 2046", text: "Rising to 68 under the Pensions Act 2007, as the law now stands." },
];
