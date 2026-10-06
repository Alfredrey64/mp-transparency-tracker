// The "Britain in numbers" pages: which Office for National Statistics series
// each page shows, and how to describe them in plain English.
//
// Shared by the daily pipeline (fetch-ons.js, which downloads each series) and
// the pages themselves, so a series can't be shown without being fetched. Every
// series is an ONS "time series": a code (cdid), the dataset it sits in, and the
// topic path it is filed under. Contains public sector information licensed
// under the Open Government Licence v3.0.
//
// kind "rate": already a percentage, so changes are in percentage points.
// kind "level": an amount, so changes are in per cent.
// format: how the raw ONS value is written (see lib/onsFormat.js).

const PRICES = "/economy/inflationandpriceindices";
const GDP = "/economy/grossdomesticproductgdp";
const PEOPLE_IN_WORK = "/employmentandlabourmarket/peopleinwork";
const NOT_IN_WORK = "/employmentandlabourmarket/peoplenotinwork";
const PUBLIC_FINANCE = "/economy/governmentpublicsectorandtaxes/publicsectorfinance";
const POPULATION = "/peoplepopulationandcommunity/populationandmigration/populationestimates";

const s = (id, cdid, dataset, path, rest) => ({ id, cdid, dataset, path, ...rest });

export const SECTORS = [
  {
    key: "economy",
    label: "The economy",
    title: "How the economy is doing",
    hint: "Growth, output and productivity",
    subtitle: "Is the UK economy growing, and are people getting more out of each hour they work? The latest official figures, in charts.",
    accent: "#0E9AA7",
    series: [
      s("gdp-quarter", "IHYQ", "qna", GDP, {
        label: "Growth in the economy, each quarter", sentenceName: "Economic growth", headline: true, format: "pct", kind: "rate",
        explain: "How much the UK's total output (GDP) grew, or shrank, compared with the previous three months. Two quarters in a row below zero is the usual definition of a recession.",
      }),
      s("gdp-year", "IHYP", "qna", GDP, {
        label: "Growth in the economy, each year", sentenceName: "Economic growth over the year", headline: true, format: "pct", kind: "rate",
        explain: "The same measure over a full calendar year, which smooths out the ups and downs of single quarters.",
      }),
      s("gdp-head", "N3Y7", "qna", GDP, {
        label: "Growth per person, each quarter", sentenceName: "Growth per person", format: "pct", kind: "rate",
        explain: "Total growth divided by the number of people. If the economy grows but the population grows faster, this goes negative.",
      }),
      s("gdp-level", "ABMI", "qna", GDP, {
        label: "Size of the economy, each quarter", sentenceName: "The economy's output", format: "gbpbn0", kind: "level", timeWord: "in",
        explain: "Everything the UK produced in a quarter, with the effect of rising prices removed so that different years can be compared fairly.",
      }),
      s("productivity", "LZVD", "prdy", "/employmentandlabourmarket/peopleinwork/labourproductivity", {
        label: "Output per hour worked, change on a year earlier", sentenceName: "Growth in output per hour worked", headline: true, format: "pct", kind: "rate",
        explain: "How much more (or less) is produced in each hour worked than a year ago. It is the main way living standards improve over the long run.",
      }),
      s("saving", "DGD8", "ukea", GDP, {
        label: "Share of income that households save", sentenceName: "The household saving ratio", format: "pct", kind: "rate",
        explain: "The part of household income left over after spending. A higher figure means people are putting more aside, often when they are worried about the future.",
      }),
    ],
  },
  {
    key: "prices",
    label: "Prices and bills",
    title: "Prices and the cost of living",
    hint: "Inflation, food, energy and rents",
    subtitle: "How fast prices are rising, and which things are getting dearer. Each chart shows the change in prices compared with a year earlier.",
    accent: "#E07A1F",
    series: [
      s("cpi", "D7G7", "mm23", PRICES, {
        label: "Inflation (CPI)", sentenceName: "Inflation (CPI)", headline: true, format: "pct", kind: "rate",
        explain: "How much more a typical basket of goods and services costs than a year ago. The Bank of England aims to keep it at 2%.",
      }),
      s("cpih", "L55O", "mm23", PRICES, {
        label: "Inflation including housing costs (CPIH)", sentenceName: "Inflation including housing costs (CPIH)", headline: true, format: "pct", kind: "rate",
        explain: "The same as CPI, but it also counts the cost of owning and running a home. It is the ONS's preferred measure.",
      }),
      s("food", "D7G8", "mm23", PRICES, {
        label: "Food and non-alcoholic drinks", sentenceName: "Food and drink inflation", headline: true, format: "pct", kind: "rate",
        explain: "How much the price of food and soft drinks has changed over the past year.",
      }),
      s("energy", "D7GT", "mm23", PRICES, {
        label: "Electricity, gas and other fuels", sentenceName: "Home energy inflation", headline: true, format: "pct", kind: "rate",
        explain: "The change in what households pay for electricity, gas and heating fuel.",
      }),
      s("rents", "D7GQ", "mm23", PRICES, {
        label: "Rents", sentenceName: "Rent inflation", format: "pct", kind: "rate",
        explain: "The change in what private tenants pay to rent a home, compared with a year earlier.",
      }),
      s("transport", "D7GE", "mm23", PRICES, {
        label: "Transport", sentenceName: "Transport inflation", format: "pct", kind: "rate",
        explain: "Fuel, fares and the cost of buying and running a vehicle.",
      }),
      s("eating-out", "D7GI", "mm23", PRICES, {
        label: "Restaurants and hotels", sentenceName: "Restaurant and hotel inflation", format: "pct", kind: "rate",
        explain: "What people pay for meals out, coffee, pubs and hotel stays.",
      }),
    ],
  },
  {
    key: "jobs",
    label: "Jobs and pay",
    title: "Jobs and pay",
    hint: "Unemployment, wages and vacancies",
    subtitle: "How many people have work, how much they earn, and whether pay is keeping up with prices.",
    accent: "#3E7CD9",
    series: [
      s("unemployment", "MGSX", "lms", `${NOT_IN_WORK}/unemployment`, {
        label: "Unemployment rate", sentenceName: "The unemployment rate", headline: true, format: "pct", kind: "rate",
        explain: "The share of people who want a job, are looking for one and could start, out of everyone who is working or looking. Adults aged 16 and over.",
      }),
      s("employment", "LF24", "lms", `${PEOPLE_IN_WORK}/employmentandemployeetypes`, {
        label: "Employment rate", sentenceName: "The employment rate", headline: true, format: "pct", kind: "rate",
        explain: "The share of people aged 16 to 64 who are in paid work.",
      }),
      s("inactivity", "LF2S", "lms", `${NOT_IN_WORK}/economicinactivity`, {
        label: "Economic inactivity rate", sentenceName: "The economic inactivity rate", format: "pct", kind: "rate",
        explain: "The share of people aged 16 to 64 who are neither working nor looking for work, for example students, carers, people who are retired early or people who are long-term sick.",
      }),
      s("vacancies", "AP2Y", "lms", `${PEOPLE_IN_WORK}/employmentandemployeetypes`, {
        label: "Job vacancies", sentenceName: "Job vacancies", verb: "were", headline: true, format: "thousands", kind: "level", 
        explain: "How many job vacancies employers had open. Fewer vacancies can mean employers are hiring less.",
      }),
      s("pay-level", "KAB9", "lms", `${PEOPLE_IN_WORK}/earningsandworkinghours`, {
        label: "Average weekly pay", sentenceName: "Average weekly pay", headline: true, format: "gbp", kind: "level",
        explain: "Average weekly earnings across the whole economy, before tax, excluding one-off back payments. It is an average, so very high earners pull it up.",
      }),
      s("pay-growth", "KAC3", "lms", `${PEOPLE_IN_WORK}/earningsandworkinghours`, {
        label: "Pay growth on a year earlier", sentenceName: "Pay growth", format: "pct", kind: "rate",
        explain: "How much average pay has risen compared with a year earlier, before taking prices into account.",
      }),
      s("pay-real", "A3WW", "lms", `${PEOPLE_IN_WORK}/earningsandworkinghours`, {
        label: "Pay growth after inflation", sentenceName: "Pay growth after inflation", headline: true, format: "pct", kind: "rate",
        explain: "Pay growth once rising prices are taken off. If it is above zero, wages are buying more than they did a year ago.",
      }),
    ],
  },
  {
    key: "publicFinances",
    label: "Public finances",
    title: "Public finances",
    hint: "Borrowing, debt and public sector jobs",
    subtitle: "How much the government borrows each month, how big the national debt is compared with the economy, and how many people work for the public sector.",
    accent: "#7B5BD6",
    series: [
      s("debt", "HF6X", "pusf", PUBLIC_FINANCE, {
        label: "National debt compared with the size of the economy", sentenceName: "Public sector net debt, as a share of the economy,", headline: true, format: "pct", kind: "rate",
        explain: "What the public sector owes, after taking off what it owns in cash and similar assets, as a share of a year's economic output. It excludes public sector banks.",
      }),
      s("borrowing", "DZLS", "pusf", PUBLIC_FINANCE, {
        label: "Government borrowing each month", sentenceName: "Public sector borrowing", headline: true, format: "gbpbn", kind: "level", timeWord: "in",
        explain: "How much more the public sector spent than it collected in taxes and other income during the month. Months with big tax payments can show a surplus.",
      }),
      s("deficit", "DZLT", "pusf", PUBLIC_FINANCE, {
        label: "Gap in day-to-day spending each month", sentenceName: "The day-to-day spending gap", format: "gbpbn", kind: "level", timeWord: "in",
        explain: "Borrowing to pay for running costs such as wages, benefits and bills, leaving out spending on roads, buildings and other lasting investment.",
      }),
      s("public-workers", "C9KP", "pse", "/employmentandlabourmarket/peopleinwork/publicsectorpersonnel", {
        label: "People working in the public sector", sentenceName: "Public sector employment (full-time equivalent)", headline: true, format: "thousands", kind: "level", 
        explain: "Everyone employed by government, local councils, the NHS, schools and other public bodies, counted as full-time equivalents.",
      }),
    ],
  },
  {
    key: "population",
    label: "Population",
    title: "Population",
    hint: "How many of us there are",
    subtitle: "How the UK's population has grown, and how that differs across England, Scotland, Wales and Northern Ireland.",
    accent: "#D4577A",
    series: [
      s("uk", "UKPOP", "pop", POPULATION, {
        label: "UK population", sentenceName: "The UK population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "The best estimate of how many people live in the UK, taken at the middle of each year. Later years are revised once more data comes in.",
      }),
      s("england", "ENPOP", "pop", POPULATION, {
        label: "England", sentenceName: "England's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in England.",
      }),
      s("scotland", "SCPOP", "pop", POPULATION, {
        label: "Scotland", sentenceName: "Scotland's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in Scotland.",
      }),
      s("wales", "WAPOP", "pop", POPULATION, {
        label: "Wales", sentenceName: "Wales's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in Wales.",
      }),
      s("ni", "NIPOP", "pop", POPULATION, {
        label: "Northern Ireland", sentenceName: "Northern Ireland's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in Northern Ireland.",
      }),
    ],
  },
  {
    key: "health",
    label: "Health",
    title: "Health",
    hint: "NHS staff, sickness and deaths",
    subtitle: "A few official measures of the nation's health: how many people work for the NHS, how many are kept out of work by long-term illness, and how many deaths are registered each week.",
    accent: "#D9453B",
    weeklyDeaths: true,
    series: [
      s("nhs-staff", "G7GL", "pse", "/employmentandlabourmarket/peopleinwork/publicsectorpersonnel", {
        label: "NHS staff", sentenceName: "NHS employment (full-time equivalent)", headline: true, format: "thousands", kind: "level", 
        explain: "People working for the NHS across the UK, counted as full-time equivalents, so two half-time jobs count as one.",
      }),
      s("long-term-sick", "LF75", "lms", `${NOT_IN_WORK}/economicinactivity`, {
        label: "Long-term sick, as a share of those not working or looking for work", sentenceName: "The share of economically inactive 16 to 64 year olds who are long-term sick", headline: true, format: "pct", kind: "rate",
        explain: "Of the working-age people who are neither in work nor looking for it, the share who say long-term sickness or disability is the reason.",
      }),
    ],
  },
  {
    key: "housing",
    label: "Housing and rents",
    title: "Housing and rents",
    hint: "What it costs to keep a roof overhead",
    subtitle: "What renters are paying, how fast housing costs are rising, and the cost of heating a home.",
    accent: "#2F9E6E",
    series: [
      s("rents-rate", "D7GQ", "mm23", PRICES, {
        label: "Rents, change on a year earlier", sentenceName: "Rent inflation", headline: true, format: "pct", kind: "rate",
        explain: "How much more private tenants pay to rent a home than a year earlier.",
      }),
      s("rents-index", "KYHJ", "mm23", PRICES, {
        label: "Private rents index", sentenceName: "The private rents index", headline: true, format: "index", kind: "level", timeWord: "in",
        explain: "Rents measured against a starting point of 100 in 2015. A reading of 141 means rents are about 41% higher than in 2015.",
      }),
      s("cpih-housing", "L55O", "mm23", PRICES, {
        label: "Inflation including housing costs (CPIH)", sentenceName: "Inflation including housing costs (CPIH)", format: "pct", kind: "rate",
        explain: "Overall inflation including the cost of owning and running a home, such as the rent homeowners would pay themselves.",
      }),
      s("home-energy", "D7GT", "mm23", PRICES, {
        label: "Electricity, gas and other fuels", sentenceName: "Home energy inflation", headline: true, format: "pct", kind: "rate",
        explain: "The change in what households pay for electricity, gas and heating fuel.",
      }),
    ],
  },
];

export const SECTOR_KEYS = SECTORS.map((x) => x.key);
export const sectorByKey = (key) => SECTORS.find((x) => x.key === key);

// Weekly deaths come from the ONS dataset API rather than a time series.
export const WEEKLY_DEATHS = {
  dataset: "weekly-deaths-region",
  edition: "time-series",
  geographies: ["E92000001", "W92000004"], // England and Wales
  cause: "all-causes",
};

export const ONS_SERIES_PAGE = (def) => `https://www.ons.gov.uk${def.path}/timeseries/${def.cdid.toLowerCase()}/${def.dataset}`;
