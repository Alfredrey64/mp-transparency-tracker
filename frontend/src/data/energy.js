// What the Net zero and energy bills page says that is not in energyData.json (built by scripts/build-energy-data.mjs): where each figure comes from,
// the legal limits and targets, the latest price cap, and the facts the arguments rest on. Each is as the named body published it.

export const CHECKED = "15 October 2026";

export const SOURCES = {
  ghg: { label: "DESNZ, Final UK greenhouse gas emissions statistics: 1990 to 2024", url: "https://www.gov.uk/government/statistics/final-uk-greenhouse-gas-emissions-statistics-1990-to-2024" },
  ghgProv: { label: "DESNZ, Provisional UK greenhouse gas emissions statistics 2025", url: "https://www.gov.uk/government/statistics/provisional-uk-greenhouse-gas-emissions-statistics-2025" },
  ghgLocal: { label: "DESNZ, UK local authority and regional greenhouse gas emissions statistics, 2005 to 2024", url: "https://www.gov.uk/government/statistics/uk-local-authority-and-regional-greenhouse-gas-emissions-statistics-2005-to-2024" },
  electricity: { label: "DESNZ, Energy Trends: UK electricity (table 5.1)", url: "https://www.gov.uk/government/statistics/electricity-section-5-energy-trends" },
  bills: { label: "DESNZ, Annual domestic energy bills (Quarterly Energy Prices tables 2.2 and 2.3)", url: "https://www.gov.uk/government/statistical-data-sets/annual-domestic-energy-price-statistics" },
  euPrices: { label: "DESNZ, International domestic energy prices (Eurostat, table 5.6.1)", url: "https://www.gov.uk/government/statistical-data-sets/international-domestic-energy-prices" },
  cap: { label: "Ofgem, Energy price cap: default tariff levels (model, historical level tables)", url: "https://www.ofgem.gov.uk/energy-regulation/domestic-and-non-domestic/energy-pricing-rules/energy-price-cap/energy-price-cap-default-tariff-levels" },
  capNews: { label: "Ofgem, Energy price cap will rise by 4% from October 2026 (26 August 2026)", url: "https://ofgem.gov.uk/press-release/energy-price-cap-will-rise-4-october-2026" },
  fuelPoverty: { label: "DESNZ, Fuel poverty trends 2026 (England)", url: "https://www.gov.uk/government/statistics/fuel-poverty-trends-2026" },
  cpi: { label: "ONS, Consumer price inflation (CPI index, all items, annual average)", url: "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23" },
  cpiEnergy: { label: "ONS, Consumer price inflation: electricity, gas and other fuels", url: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/latest" },
  worldBank: { label: "World Bank, World Development Indicators (greenhouse gas emissions per head, fossil fuel share of electricity, energy use per head)", url: "https://databank.worldbank.org/source/world-development-indicators" },
  ccc7: { label: "Climate Change Committee, The Seventh Carbon Budget (26 February 2025)", url: "https://www.theccc.org.uk/publication/the-seventh-carbon-budget/" },
  cb6: { label: "legislation.gov.uk, The Carbon Budget Order 2021", url: "https://www.legislation.gov.uk/uksi/2021/750/made" },
  cb5: { label: "legislation.gov.uk, The Carbon Budget Order 2016", url: "https://www.legislation.gov.uk/uksi/2016/785/made" },
  cleanPower: { label: "DESNZ, Clean Power 2030 Action Plan: a new era of clean electricity (13 December 2024)", url: "https://www.gov.uk/government/publications/clean-power-2030-action-plan/clean-power-2030-action-plan-a-new-era-of-clean-electricity-main-report" },
  budget2025: { label: "HM Treasury, Budget 2025 (26 November 2025)", url: "https://www.gov.uk/government/publications/budget-2025-document" },
  cb7News: { label: "CIBSE Journal, MPs approve new target to cut carbon by 87% by 2042", url: "https://www.cibsejournal.com/?p=46518" },
  grantham: { label: "LSE Grantham Research Institute, Kemi Badenoch vows to repeal Climate Change Act", url: "https://www.lse.ac.uk/granthaminstitute/news/kemi-badenoch-vows-to-repeal-climate-change-act/" },
  reform: { label: "BusinessGreen, Reform manifesto vows to 'scrap net zero' and issue new fracking licences", url: "https://businessgreen.com/news/4323691/reform-manifesto-vows-scrap-net-zero-issue-fracking-licenses" },
};

// Carbon budgets fixed in law, in million tonnes of carbon dioxide equivalent (MtCO2e). The first four are in the DESNZ emissions tables (energyData.json);
// the fifth and sixth are set by orders under the Climate Change Act 2008 and the seventh is the Committee's advice, approved by the Commons.
export const LATER_BUDGETS = [
  { id: "CB5", years: [2028, 2032], target: 1725, note: "Set in law in 2016.", source: SOURCES.cb5 },
  { id: "CB6", years: [2033, 2037], target: 965, note: "Set in law in 2021, and includes the UK's share of international aviation and shipping.", source: SOURCES.cb6 },
  { id: "CB7", years: [2038, 2042], target: 535, note: "Approved by the House of Commons on 24 June 2026. It includes international aviation and shipping, and means emissions 87% below 1990 by 2040.", source: SOURCES.cb7News },
];

// Targets the UK has set itself. Percentages are cuts from the 1990 base year (1995 for the F-gases).
export const TARGETS = {
  ndc2030: { year: 2030, cut: 68, label: "2030", note: "The UK's first Paris Agreement pledge (its Nationally Determined Contribution): at least a 68% cut." },
  ndc2035: { year: 2035, cut: 81, label: "2035", note: "The UK's second Paris Agreement pledge: at least an 81% cut." },
  netZero: { year: 2050, cut: 100, label: "2050", note: "Net zero: the Climate Change Act requires emissions to be at least 100% below 1990, which means any emissions left must be balanced by taking carbon out of the air." },
};

// The latest price cap, from Ofgem's announcement.
export const CAP_NOW = { from: "1 October 2026", to: "31 December 2026", value: 1723, previous: 1663, announced: "26 August 2026", pct: 4 };

export const FACTS = {
  ccc7NetCost: "The Climate Change Committee estimates that the net cost of reaching net zero is around £4 billion a year on average between 2025 and 2050, about 0.2% of GDP, with the cost front-loaded and net savings during the Seventh Carbon Budget period, 2038 to 2042.",
  cleanPower: "The government's Clean Power 2030 plan aims for clean sources to produce at least 95% of Great Britain's electricity in a typical weather year by 2030, with unabated gas no more than 5% of generation.",
  billCuts: "At the November 2025 Budget the government said it would scrap the Energy Company Obligation and move 75% of the domestic cost of the Renewables Obligation from bills to taxpayers, from April 2026, to take about £150 a year off the average bill.",
  vatRelief: "The government has removed VAT from domestic electricity bills from October 2026 to March 2027, which Ofgem says holds electricity bills broadly steady in its October announcement.",
};
