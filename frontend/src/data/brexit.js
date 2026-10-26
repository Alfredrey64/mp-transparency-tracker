// What the Brexit page says, with where each figure comes from. Every number here was read from the named source; the page says when it was
// last checked, and the figures that are expert estimates say who made them and how, because they differ.

export const CHECKED = "14 October 2026";

export const SOURCES = {
  obr: { label: "Office for Budget Responsibility, Brexit analysis (March 2026 forecast)", url: "https://obr.uk/forecasts-in-depth/the-economy-forecast/brexit-analysis/" },
  nber: { label: "Bloom, Bunn, Mizen, Smietanka, Thwaites and Abrahams, The Economic Impact of Brexit (NBER working paper 34459)", url: "https://www.nber.org/papers/w34459" },
  ukiceTenYears: { label: "UK in a Changing Europe, Ten years on: What next for UK-EU relations? (June 2026)", url: "https://ukandeu.ac.uk/reports/ten-years-on-what-next-for-uk-eu-relations/" },
  ukiceEconomy: { label: "UK in a Changing Europe, Brexit ten years on: the economy (Jonathan Portes, June 2026)", url: "https://ukandeu.ac.uk/brexit-ten-years-on-the-economy/" },
  iea: { label: "Institute of Economic Affairs, Has Brexit really harmed UK trade? (Catherine McBride, 2023)", url: "https://iea.org.uk/publications/has-brexit-really-harmed-uk-trade-countering-the-office-of-budgetary-responsibilitys-claims/" },
  cepMinford: { label: "Centre for Economic Performance, Economists for Brexit: a critique (Sampson and others)", url: "https://cep.lse.ac.uk/pubs/download/brexit06.pdf" },
  onsTrade: { label: "ONS, UK trade: December 2025", url: "https://www.ons.gov.uk/economy/nationalaccounts/balanceofpayments/bulletins/uktrade/december2025" },
  eurostat: { label: "Eurostat, EU trade in goods with the United Kingdom in 2015 to 2025", url: "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260622-1" },
  onsMigration: { label: "ONS, Long-term international migration, provisional: year ending December 2025", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/bulletins/longterminternationalmigrationprovisional/yearendingdecember2025" },
  yougov: { label: "YouGov, What do Britons think of Brexit, 10 years since the referendum?", url: "https://yougov.com/en-gb/articles/54925-what-do-britons-think-of-brexit-10-years-since-the-referendum" },
  yougovTracker: { label: "YouGov, Brexit tracker (24 to 25 September 2026)", url: "https://ygo-assets-websites-editorial-emea.yougov.net/documents/Internal_BrexitTracker_260925.pdf" },
  oecdGdp: { label: "OECD, Quarterly National Accounts: GDP per capita (US dollars, constant prices and PPPs)", url: "https://data-explorer.oecd.org/" },
  onsTradeSeries: { label: "ONS, UK trade (quarterly goods trade with the EU and non-EU countries)", url: "https://www.ons.gov.uk/economy/nationalaccounts/balanceofpayments/bulletins/uktrade/latest" },
  hmrcRegional: { label: "HMRC, UK regional trade in goods statistics, fourth quarter 2025", url: "https://www.gov.uk/government/statistics/uk-regional-trade-in-goods-statistics-fourth-quarter-october-to-december-2025" },
  onsPopulation: { label: "ONS, Population estimates for the UK, England, Wales, Scotland and Northern Ireland: mid-2025 (table MYE3)", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/annualmidyearpopulationestimates/mid2025" },
  commonUnderstanding: { label: "GOV.UK, UK-EU summit: Common Understanding (19 May 2025)", url: "https://www.gov.uk/government/publications/ukeu-summit-key-documentation/uk-eu-summit-common-understanding-html" },
  windsor: { label: "GOV.UK, Windsor Framework unveiled (27 February 2023)", url: "https://www.gov.uk/government/news/windsor-framework-unveiled-to-fix-problems-of-the-northern-ireland-protocol" },
  ifgRegulation: { label: "Institute for Government, Brexit at 10: Regulation", url: "https://www.instituteforgovernment.org.uk/comment/brexit-10-regulation" },
  referendum: { label: "Electoral Commission, Results and turnout at the EU referendum", url: "https://www.electoralcommission.org.uk/research-reports-and-data/our-reports-and-data-past-elections-and-referendums/results-and-turnout-eu-referendum" },
  indiaDeal: { label: "GOV.UK, Impact assessment of the free trade agreement between the UK and India", url: "https://assets.publishing.service.gov.uk/media/6880fd0a6a7ea0e1ce1d3597/impact-assessment-of-the-free-trade-agreement-between-the-uk-and-india_a.pdf" },
  cptpp: { label: "GOV.UK, Impact assessment of the UK's accession to the CPTPP", url: "https://gov.uk/government/publications/cptpp-impact-assessment/impact-assessment-of-the-uks-accession-to-the-cptpp-executive-summary-web-version" },
  foodPrices: { label: "Bakker, Datta, Davies and De Lyon, The effect of Brexit on UK food prices (Warwick working paper 1461, 2023)", url: "https://warwick.ac.uk/fac/soc/economics/research/workingpapers/2023/twerp_1461_-_datta.pdf" },
};

// The main dates, oldest first.
export const TIMELINE = [
  { date: "23 June 2016", title: "The referendum", text: "52% of those who voted chose to leave the European Union and 48% to remain, on a turnout of 72%." },
  { date: "29 March 2017", title: "Article 50", text: "The government told the EU the UK would leave, which started a two-year countdown that was later extended." },
  { date: "31 January 2020", title: "The UK leaves", text: "The UK left the EU under the withdrawal agreement, and a transition period began in which the rules stayed much as before." },
  { date: "1 January 2021", title: "The new trade deal begins", text: "The transition ended and the Trade and Cooperation Agreement took effect. It means no tariffs or quotas on goods that meet its rules of origin, but customs checks and paperwork returned, and the UK left the single market and customs union." },
  { date: "27 February 2023", title: "The Windsor Framework", text: "The UK and EU replaced the Northern Ireland Protocol with the Windsor Framework, with a green lane for goods staying in Northern Ireland and a Stormont brake on new EU goods laws." },
  { date: "1 January 2024", title: "Back into Horizon Europe", text: "The UK became an associated country in the EU's research programme, Horizon Europe, after being outside it since 2021." },
  { date: "19 May 2025", title: "The first UK-EU summit", text: "The two sides agreed a 'reset': to work towards a food and farming (SPS) agreement, linking carbon markets, a youth experience scheme and Erasmus+, with fishing access for both sides extended to 30 June 2038, and a security and defence partnership." },
  { date: "December 2025", title: "Erasmus+", text: "The UK and the European Commission agreed that the UK will take part in Erasmus+ from 2027, at a cost of about £570 million in 2027." },
  { date: "October 2026", title: "Where things stand", text: "Talks on the food and farming agreement, linked carbon markets and the youth experience scheme were still going on. In January 2026 the government said the UK would not rejoin the EU." },
];

export const REFERENDUM = {
  leave: 17410742,
  remain: 16141241,
  leavePct: 51.9,
  remainPct: 48.1,
  turnoutPct: 72.2,
  // Share voting Leave in each part of the UK.
  byNation: [
    { name: "England", leave: 53.4 },
    { name: "Wales", leave: 52.5 },
    { name: "Scotland", leave: 38.0 },
    { name: "Northern Ireland", leave: 44.2 },
  ],
};

// The referendum result in each region and nation: votes for Leave and Remain (Electoral Commission). They add up to the UK totals above; the South West
// includes Gibraltar, as the Commission counted it.
export const VOTE_BY_REGION = {
  ne: { leave: 778103, remain: 562595 }, nw: { leave: 1966925, remain: 1699020 }, yh: { leave: 1580937, remain: 1158298 }, em: { leave: 1475479, remain: 1033036 },
  wm: { leave: 1755687, remain: 1207175 }, east: { leave: 1880367, remain: 1448616 }, london: { leave: 1513232, remain: 2263519 }, se: { leave: 2567965, remain: 2391718 },
  sw: { leave: 1669711, remain: 1503019 }, wales: { leave: 854572, remain: 772347 }, scotland: { leave: 1018322, remain: 1661191 }, ni: { leave: 349442, remain: 440707 },
};

// Public opinion: "In hindsight, do you think Britain was right or wrong to vote to leave the European Union?" YouGov, 24 to 25 September 2026.
export const OPINION = { wrong: 57, right: 30, fieldwork: "24 to 25 September 2026", leaveVotersStandBy: 64, leaveVotersNowWrong: 23, leaveVotersDate: "June 2026" };

// Estimates of the effect on the size of the economy. Percent of GDP, a loss (negative) or a gain (positive) compared with how big the economy would
// have been without Brexit. The kinds differ and the page says so: some measure what has happened, one is a model of what could happen.
export const GDP_ESTIMATES = [
  { id: "ukice", label: "Summary of the research", who: "UK in a Changing Europe, June 2026", low: -6, high: -2, kind: "Review of studies", note: "A broad consensus that the economy is 2% to 6% smaller than it would have been", source: "ukiceTenYears" },
  { id: "nber", label: "Bloom and colleagues", who: "NBER working paper, revised June 2026", low: -8, high: -6, kind: "Measured from firm surveys and data, by the end of 2025", note: "Uses the Bank of England's Decision Maker Panel survey of firms", source: "nber" },
  { id: "minford", label: "Economists for Free Trade modelling", who: "Patrick Minford and colleagues (the Cardiff model)", low: 4, high: 8, kind: "A model of a possible future, not a measurement", note: "Assumes the UK removes tariffs on food and manufactures unilaterally. A Centre for Economic Performance critique put the gain from removing tariffs at about 0.3 percentage points", source: "cepMinford" },
];

// The OBR's assumptions, which the Treasury and Parliament use for forecasts. They are not measurements of what has happened.
export const OBR = { productivity: 4, trade: 15, alreadyHappened: "about two-fifths", lastTradeCheck: "March 2024", lastTradeVerdict: "appeared to be broadly on track" };

// Effects found by Bloom and colleagues, by the end of 2025 (ranges, percent lower than without Brexit).
export const NBER_EFFECTS = [
  { label: "Business investment", low: 12, high: 13 },
  { label: "Employment", low: 3, high: 4 },
  { label: "Productivity", low: 3, high: 4 },
];

// UK goods trade with the EU, the last quarter of 2025, £ billion, excluding precious metals (ONS).
export const TRADE_Q4_2025 = { exportsEu: 44.1, exportsNonEu: 47.4, importsEu: 79.8, importsNonEu: 69.7, period: "October to December 2025" };

// The UK's share of the EU's trade in goods (Eurostat).
export const EU_SHARES = {
  uk: { exports: { from: 16.9, to: 13.1 }, imports: { from: 11.2, to: 6.3 } },
  years: [2015, 2025],
};

// Long-term international migration (ONS, provisional, year ending December 2025). Numbers of people.
export const MIGRATION = {
  period: "year ending December 2025",
  net: 171000, netPeak: 944000, netPeakPeriod: "year ending March 2023",
  immigration: 813000, immigrationPeak: 1469000,
  euNet: -42000, nonEuNet: 350000, britishNet: -136000,
};

// What the government's own assessments say the main new trade deals will add, in the long run.
export const TRADE_DEALS = [
  { name: "UK-India agreement", value: "£4.8bn a year", note: "0.13% of GDP by 2040, the government's estimate", source: "indiaDeal" },
  { name: "UK joining the CPTPP (the Pacific trade group)", value: "£2bn a year", note: "Less than 0.1% of GDP in the long run, the government's estimate", source: "cptpp" },
];

export const FOOD_PRICES = { riseWithBrexit: 25, withoutBrexit: 17, period: "December 2019 to March 2023", perHousehold: 250 };

// Where leaving the EU could go from here: the options set out by UK in a Changing Europe, each closer to the EU than the last.
export const OPTIONS = [
  { name: "The current deal, with small changes", text: "The Trade and Cooperation Agreement and the 2025 reset. No customs union or single market." },
  { name: "A customs union", text: "No customs checks on goods between the UK and EU, but the UK would follow the EU's trade policy with other countries." },
  { name: "A Swiss-style deal", text: "Access to parts of the single market through many separate agreements, following EU rules in those areas." },
  { name: "The European Economic Area", text: "Membership of the single market, with free movement of people and EU rules, but outside the EU's political bodies." },
  { name: "Rejoining the EU", text: "Full membership. In January 2026 the government said the UK would not rejoin." },
];
