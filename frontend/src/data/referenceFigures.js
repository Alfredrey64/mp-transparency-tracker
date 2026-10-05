// The few everyday yardsticks the site compares money against. Each is a
// published figure with its source and date, kept in one place so it is easy
// to update when new ones come out. Rounded in the text: these are for a sense
// of scale, not for precise arithmetic.

export const MEDIAN_SALARY = {
  value: 39039,
  label: "typical full-time salary",
  source: "ONS, Annual Survey of Hours and Earnings, April 2025: median gross annual pay for full-time employees",
  url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/2025",
};

export const MP_SALARY = {
  value: 98599,
  label: "an MP's salary",
  source: "IPSA: MPs' basic salary from 1 April 2026",
  url: "https://www.theipsa.org.uk/news/press-releases/ipsa-confirms-decision-on-mps-pay-for-2026-27",
};

// Women's share of the UK population, for the women-in-Parliament charts.
export const WOMEN_POPULATION_SHARE = {
  value: 51,
  source: "ONS, Census 2021 (England and Wales): about 51% of people are women",
  url: "https://www.ons.gov.uk/peoplepopulationandcommunity/culturalidentity/sex/bulletins/sexandgenderidentity/2021",
};
