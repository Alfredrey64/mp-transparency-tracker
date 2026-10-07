// The "Britain in numbers" pages: which Office for National Statistics series
// each page shows, and how to describe them in plain English.
//
// Shared by the daily pipeline (fetch-ons.js, which downloads each series) and
// the pages themselves, so a series can't be shown without being fetched. Every
// downloaded series is an ONS "time series": a code (cdid), the dataset it sits
// in, and the topic path it is filed under. A series with a `derive` is worked
// out in the browser from others (see lib/onsDerive.js). Contains public sector
// information licensed under the Open Government Licence v3.0.
//
// kind "rate": already a percentage, so changes are in percentage points.
// kind "level": an amount, so changes are in per cent.
// format: how the raw ONS value is written (see lib/onsFormat.js).
// explain: what the number measures. why: why anyone should care.

const PRICES = "/economy/inflationandpriceindices";
const GDP = "/economy/grossdomesticproductgdp";
const OUTPUT = "/economy/economicoutputandproductivity/output";
const PEOPLE_IN_WORK = "/employmentandlabourmarket/peopleinwork";
const EMPLOYMENT = `${PEOPLE_IN_WORK}/employmentandemployeetypes`;
const EARNINGS = `${PEOPLE_IN_WORK}/earningsandworkinghours`;
const NOT_IN_WORK = "/employmentandlabourmarket/peoplenotinwork";
const PUBLIC_FINANCE = "/economy/governmentpublicsectorandtaxes/publicsectorfinance";
const PUBLIC_WORKERS = "/employmentandlabourmarket/peopleinwork/publicsectorpersonnel";
const POPULATION = "/peoplepopulationandcommunity/populationandmigration/populationestimates";
const TRADE = "/economy/nationalaccounts/balanceofpayments";

const s = (id, cdid, dataset, path, rest) => ({ id, cdid, dataset, path, ...rest });
// A series read from a published spreadsheet (see fetch-tables.js for each `feed`).
const f = (id, feed, source, rest) => ({ id, feed, source, ...rest });
// A Bank of England database series. mode "month": the series is already monthly; "last": the
// last daily figure of each month; "mean": the average of the daily figures in each month.
const b = (id, code, mode, rest) => ({ id, boe: { code, mode }, source: BOE_SOURCE, ...rest });
const d = (id, derive, rest) => ({ id, derive, ...rest });
// A UK House Price Index series (HM Land Registry, with the ONS and the other statistical bodies).
const h = (id, region, field, rest) => ({ id, hpi: { region, field }, source: HPI_SOURCE, ...rest });
// A line from a table in an ONS crime spreadsheet. `match` finds the row by its label.
const t = (id, table, match, rest) => ({ id, table: { ...table, match }, source: table.source, yearEnding: true, verb: "were", ...rest });

// Gross annual pay for employees by where they live: the Annual Survey of Hours and Earnings, from Nomis.
const NOMIS_SOURCE = { name: "Annual Survey of Hours and Earnings, resident analysis (ONS, via Nomis)", url: "https://www.nomisweb.co.uk/datasets/asher" };
const n = (id, stat, place, rest) => ({ id, nomis: { stat, place }, source: NOMIS_SOURCE, ...rest });
// stat: Nomis item code. 2 = the median, 6 = the 10th percentile, 15 = the 90th percentile.
const PAY_STATS = [
  ["pay", 2, "Median pay", "typical pay", "The pay of the person in the middle: half of employees living in the area earn more, half less."],
  ["pay-low", 6, "Pay of lower earners", "pay at the low end", "The pay of someone who earns more than only one in ten employees living in the area."],
  ["pay-high", 15, "Pay of higher earners", "pay at the high end", "The pay of someone who earns more than nine in ten employees living in the area."],
];

const NHS_SOURCE = { name: "NHS England statistics", url: "https://www.england.nhs.uk/statistics/" };
const HOME_OFFICE_SOURCE = { name: "Home Office immigration system statistics", url: "https://www.gov.uk/government/collections/migration-statistics" };
const BOATS_SOURCE = { name: "Home Office: migrants detected crossing the English Channel in small boats", url: "https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats" };
const ONS_MIGRATION_SOURCE = { name: "ONS: long-term international migration, provisional", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/bulletins/longterminternationalmigrationprovisional/latest" };
const HOUSING_SUPPLY_SOURCE = { name: "Ministry of Housing, Communities and Local Government: housing supply statistics", url: "https://www.gov.uk/government/collections/housing-supply-indicators-of-new-supply-england" };
const BOE_SOURCE = { name: "Bank of England Database", url: "https://www.bankofengland.co.uk/boeapps/database/" };
const HPI_SOURCE = { name: "UK House Price Index (HM Land Registry, ONS and others)", url: "https://www.gov.uk/government/collections/uk-house-price-index-reports" };
const CRIME_URL = "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/datasets/crimeinenglandandwalesappendixtables";
const CSEW = { sheet: "Table A1a", labelCol: 0, source: { name: "Crime Survey for England and Wales (ONS), appendix table A1a", url: CRIME_URL } };
const POLICE = { sheet: "Table A5a", labelCol: 1, source: { name: "Police recorded crime (Home Office, published by the ONS), appendix table A5a", url: CRIME_URL } };

// The 12 regions and nations the Regions page compares, with the series each one uses.
export const REGION_ROWS = [
  { key: "ne", name: "North East", ashe: "North East", emp: "LF3P", inact: "LF59", hpi: "north-east" },
  { key: "nw", name: "North West", ashe: "North West", emp: "LF3Q", inact: "LF5A", hpi: "north-west" },
  { key: "yh", name: "Yorkshire and the Humber", ashe: "Yorkshire and The Humber", emp: "LF3R", inact: "LF5B", hpi: "yorkshire-and-the-humber" },
  { key: "em", name: "East Midlands", ashe: "East Midlands", emp: "LF3S", inact: "LF5C", hpi: "east-midlands" },
  { key: "wm", name: "West Midlands", ashe: "West Midlands", emp: "LF3T", inact: "LF5D", hpi: "west-midlands" },
  { key: "east", name: "East of England", ashe: "East", emp: "LF3U", inact: "LF5E", hpi: "east-of-england" },
  { key: "london", name: "London", ashe: "London", emp: "LF3V", inact: "LF5F", hpi: "london" },
  { key: "se", name: "South East", ashe: "South East", emp: "LF3W", inact: "LF5G", hpi: "south-east" },
  { key: "sw", name: "South West", ashe: "South West", emp: "LF3X", inact: "LF5H", hpi: "south-west" },
  { key: "wales", name: "Wales", ashe: "Wales", emp: "LF3Z", inact: "LF5J", hpi: "wales" },
  { key: "scotland", name: "Scotland", ashe: "Scotland", emp: "LF42", inact: "LF5K", hpi: "scotland" },
  { key: "ni", name: "Northern Ireland", ashe: "Northern Ireland", emp: "LF5Z", inact: null, activity: "LF5Y", hpi: "northern-ireland" },
];

export const SECTORS = [
  {
    key: "economy",
    label: "The economy",
    title: "How the economy is doing",
    hint: "Growth, output and productivity",
    subtitle: "Is the UK economy growing, and are people getting more out of each hour they work? The latest official figures, with the history behind them.",
    story: "The economy is the pot that pays for everything else: wages, taxes, public services. When it grows, there is more to share out. When it shrinks, every budget gets tighter.",
    accent: "#0E9AA7",
    series: [
      s("gdp-quarter", "IHYQ", "qna", GDP, {
        label: "Growth in the economy, each quarter", sentenceName: "Economic growth", headline: true, format: "pct", kind: "rate",
        explain: "How much the UK's total output (GDP) grew, or shrank, compared with the previous three months.",
        why: "Two quarters in a row below zero is the usual definition of a recession, which tends to mean job losses and weaker public finances.",
      }),
      s("gdp-year", "IHYP", "qna", GDP, {
        label: "Growth in the economy, each year", sentenceName: "Economic growth over the year", headline: true, format: "pct", kind: "rate",
        explain: "The same measure over a full calendar year, which smooths out the ups and downs of single quarters.",
        why: "It is the number most often quoted when governments are judged on the economy, and it shows the long swings, like the 2008 financial crisis and the 2020 pandemic.",
      }),
      s("gdp-head", "N3Y7", "qna", GDP, {
        label: "Growth per person, each quarter", sentenceName: "Growth per person", format: "pct", kind: "rate",
        explain: "Total growth divided by the number of people. If the economy grows but the population grows faster, this goes negative.",
        why: "It is a better guide to whether the average person is getting better off than total growth, which can rise just because there are more people.",
      }),
      s("gdp-level", "ABMI", "qna", GDP, {
        label: "Size of the economy, each quarter", sentenceName: "The economy's output", headline: true, format: "gbpbn0", kind: "level",
        explain: "Everything the UK produced in a quarter, with the effect of rising prices removed so that different years can be compared fairly.",
        why: "It lets you compare today with decades ago in real terms, and see how long it took to recover from each downturn.",
      }),
      s("income-head", "CRXX", "ukea", GDP, {
        label: "Household income per person, after inflation", sentenceName: "Household income per person", headline: true, format: "gbp", kind: "level",
        explain: "What households have to spend and save each quarter after tax and benefits, divided by the number of people, with rising prices taken out.",
        why: "It is the closest single measure of living standards. If it is flat for years, most households feel no better off, whatever headline growth says.",
      }),
      s("productivity", "LZVD", "prdy", "/employmentandlabourmarket/peopleinwork/labourproductivity", {
        label: "Output per hour worked, change on a year earlier", sentenceName: "Growth in output per hour worked", headline: true, format: "pct", kind: "rate",
        explain: "How much more (or less) is produced in each hour worked than a year ago.",
        why: "Over the long run, pay and living standards can only rise sustainably if output per hour rises. Slow productivity growth is a central UK worry.",
      }),
      s("production", "K222", "diop", OUTPUT, {
        label: "Factory, energy and mining output", sentenceName: "The production index", format: "index", kind: "level", verb: "stood at",
        explain: "An index of what factories, power stations, mines and quarries produce, adjusted for prices and the time of year. The latest reference year is 100.",
        why: "Industry is a smaller part of the economy than it was, but it is a guide to exports, energy and the health of manufacturing towns.",
      }),
      s("services", "S2KU", "ios1", OUTPUT, {
        label: "Services output", sentenceName: "The services index", format: "index", kind: "level", verb: "stood at",
        explain: "An index of output from services, such as shops, banks, schools, hospitals and restaurants. About four-fifths of the economy is services.",
        why: "Because services are so large, this index moves the whole economy. It is a quick read on how healthy the economy is.",
      }),
      s("retail", "J5EK", "drsi", "/businessindustryandtrade/retailindustry", {
        label: "Shop sales (volume)", sentenceName: "Shop sales", format: "index", kind: "level", verb: "stood at",
        explain: "How much is being bought in shops and online, with price rises removed so it reflects what people are actually buying. The latest reference year is 100.",
        why: "Consumer spending is about 60% of the economy. Weak shop sales often mean people are cutting back.",
      }),
      s("saving", "DGD8", "ukea", GDP, {
        label: "Share of income that households save", sentenceName: "The household saving ratio", format: "pct", kind: "rate",
        explain: "The part of household income left over after spending.",
        why: "People tend to save more when they are worried about the future, and less when they feel secure or are squeezed by bills.",
      }),
      s("investment-business", "NPEL", "cxnv", GDP, {
        label: "Business investment", sentenceName: "Business investment", headline: true, format: "gbpbn", kind: "level",
        explain: "What firms spent in a quarter on things that last, such as machinery, vehicles, software and buildings, with the effect of rising prices removed.",
        why: "Firms invest when they expect demand to grow. Low investment holds back productivity, and with it pay and living standards.",
      }),
      d("investment-business-growth", { op: "yoy", from: "investment-business" }, {
        label: "Business investment, change on a year earlier", sentenceName: "Business investment growth", verb: "was", format: "pct", kind: "rate",
        explain: "How much more (or less) firms invested than in the same quarter a year before, after removing price rises.",
        why: "It is a quick read on business confidence. It swings sharply in recessions and when big uncertainties such as new trade rules arrive.",
      }),
      d("investment-share", { op: "percentOf", from: "investment-business-cp", of: "gdp-cp" }, {
        label: "Business investment as a share of the economy", sentenceName: "Business investment, as a share of the economy,", headline: true, format: "pct", kind: "rate",
        explain: "Business investment, at the prices of the time, divided by the size of the economy (GDP) in the same quarter.",
        why: "The UK has long invested a smaller share of its income than most rich countries, which is one explanation put forward for its weak productivity growth.",
      }),
    ],
    inputs: [
      s("investment-business-cp", "NPEK", "ukea", GDP, {
        label: "Business investment at current prices", sentenceName: "Business investment", format: "gbpbn", kind: "level",
        explain: "Business investment in each quarter's own prices. Used to work out business investment as a share of GDP.", why: "A building block for the investment share.",
      }),
      s("gdp-cp", "YBHA", "ukea", GDP, {
        label: "Size of the economy at current prices", sentenceName: "GDP", format: "gbpbn", kind: "level",
        explain: "GDP in each quarter's own prices. Used to work out business investment as a share of GDP.", why: "A building block for the investment share.",
      }),
    ],
  },
  {
    key: "prices",
    label: "Prices and bills",
    title: "Prices and the cost of living",
    hint: "Inflation, food, energy and rents",
    subtitle: "How fast prices are rising, and which things are getting dearer. Each chart shows the change in prices compared with a year earlier.",
    story: "Inflation is how fast your money loses its buying power. It is why a pay rise can still feel like a pay cut, and why the Bank of England sets interest rates the way it does.",
    accent: "#E07A1F",
    series: [
      s("cpi", "D7G7", "mm23", PRICES, {
        label: "Inflation (CPI)", sentenceName: "Inflation (CPI)", headline: true, format: "pct", kind: "rate",
        explain: "How much more a typical basket of goods and services costs than a year ago.",
        why: "The Bank of England aims to keep it at 2%. When it is well above target, interest rates tend to rise, which affects mortgages and savings.",
      }),
      s("cpih", "L55O", "mm23", PRICES, {
        label: "Inflation including housing costs (CPIH)", sentenceName: "Inflation including housing costs (CPIH)", headline: true, format: "pct", kind: "rate",
        explain: "The same as CPI, but it also counts the cost of owning and running a home. It is the ONS's preferred measure.",
        why: "Housing is the biggest cost for most households, so this can paint a different picture from CPI when rents and mortgages are moving.",
      }),
      s("core", "DKO8", "mm23", PRICES, {
        label: "Underlying inflation", sentenceName: "Underlying inflation", headline: true, format: "pct", kind: "rate",
        explain: "Inflation with the most volatile items taken out: energy, food, alcohol and tobacco.",
        why: "It shows whether price rises are spreading through the economy, which is what central banks watch most closely.",
      }),
      s("services-inflation", "D7NN", "mm23", PRICES, {
        realMode: "relative", label: "Prices of services", sentenceName: "Services inflation", format: "pct", kind: "rate",
        explain: "The change in prices of things like haircuts, restaurant meals, insurance and fares.",
        why: "Service prices are driven mostly by wages, so persistent services inflation is a sign that pay growth is feeding into prices.",
      }),
      s("goods-inflation", "D7NM", "mm23", PRICES, {
        realMode: "relative", label: "Prices of goods", sentenceName: "Goods inflation", format: "pct", kind: "rate",
        explain: "The change in prices of physical things such as food, clothes, furniture and fuel.",
        why: "Goods prices swing with world commodity prices and exchange rates, so they often cause sudden jumps and falls in headline inflation.",
      }),
      s("food", "D7G8", "mm23", PRICES, {
        realMode: "relative", label: "Food and non-alcoholic drinks", sentenceName: "Food and drink inflation", headline: true, format: "pct", kind: "rate",
        explain: "How much the price of food and soft drinks has changed over the past year.",
        why: "Food takes a bigger share of the budget of lower-income households, so food price rises hit them hardest.",
      }),
      s("energy", "D7GT", "mm23", PRICES, {
        realMode: "relative", label: "Electricity, gas and other fuels", sentenceName: "Home energy inflation", headline: true, format: "pct", kind: "rate",
        explain: "The change in what households pay for electricity, gas and heating fuel.",
        why: "Energy bills were the main driver of the 2022 inflation spike and are heavily shaped by government policy and world markets.",
      }),
      s("rents", "D7GQ", "mm23", PRICES, {
        realMode: "relative", label: "Rents", sentenceName: "Rent inflation", format: "pct", kind: "rate",
        explain: "The change in what private tenants pay to rent a home, compared with a year earlier.",
        why: "About one in five households rents privately, so rents are a major part of the cost of living for younger people.",
      }),
      s("transport", "D7GE", "mm23", PRICES, {
        realMode: "relative", label: "Transport", sentenceName: "Transport inflation", format: "pct", kind: "rate",
        explain: "Fuel, fares and the cost of buying and running a vehicle.",
        why: "Fuel duty, rail fares and car costs are all affected by government decisions as well as world prices.",
      }),
      s("eating-out", "D7GI", "mm23", PRICES, {
        realMode: "relative", label: "Restaurants and hotels", sentenceName: "Restaurant and hotel inflation", format: "pct", kind: "rate",
        explain: "What people pay for meals out, coffee, pubs and hotel stays.",
        why: "It reflects wage and rent costs for hospitality businesses, which employ a large share of young workers.",
      }),
    ],
  },
  {
    key: "jobs",
    label: "Jobs and pay",
    title: "Jobs and pay",
    hint: "Unemployment, wages and vacancies",
    subtitle: "How many people have work, how much they earn, and whether pay is keeping up with prices.",
    story: "Work is where most people's income comes from. These figures show whether jobs are easy or hard to find, and whether a pay packet goes as far as it used to.",
    accent: "#3E7CD9",
    series: [
      s("unemployment", "MGSX", "lms", `${NOT_IN_WORK}/unemployment`, {
        label: "Unemployment rate", sentenceName: "The unemployment rate", headline: true, format: "pct", kind: "rate",
        explain: "The share of people who want a job, are looking for one and could start, out of everyone who is working or looking. Adults aged 16 and over.",
        why: "It is the most-watched sign of how hard it is to find work. Rising unemployment also means less tax coming in and more benefit claims.",
      }),
      s("youth-unemployment", "YCWD", "lms", EMPLOYMENT, {
        label: "Unemployment among 16 to 24 year olds", sentenceName: "Youth unemployment", format: "pct", kind: "rate",
        explain: "The unemployment rate for 16 to 24 year olds, including students who are looking for work. It is not seasonally adjusted, so it jumps around through the year.",
        why: "Young people are usually hit first and hardest in a downturn, and a bad start in work can hold back earnings for years.",
      }),
      s("employment", "LF24", "lms", EMPLOYMENT, {
        label: "Employment rate", sentenceName: "The employment rate", headline: true, format: "pct", kind: "rate",
        explain: "The share of people aged 16 to 64 who are in paid work.",
        why: "A higher rate means more people are earning and paying tax. Governments often set targets for it.",
      }),
      s("employed", "MGRZ", "lms", EMPLOYMENT, {
        label: "Number of people in work", sentenceName: "The number of people in work", format: "thousands", kind: "level",
        explain: "How many people aged 16 and over have a paid job, including self-employed people.",
        why: "It shows the real scale of the workforce, which grows with population and with the number of older people who keep working.",
      }),
      s("unemployed", "MGSC", "lms", `${NOT_IN_WORK}/unemployment`, {
        label: "Number of unemployed people", sentenceName: "The number of unemployed people", format: "thousands", kind: "level",
        explain: "How many people aged 16 and over are out of work, looking for a job and able to start.",
        why: "The count puts the unemployment rate in human terms: every point of the rate is roughly 350,000 people.",
      }),
      s("inactivity", "LF2S", "lms", `${NOT_IN_WORK}/economicinactivity`, {
        label: "Economic inactivity rate", sentenceName: "The economic inactivity rate", format: "pct", kind: "rate",
        explain: "The share of people aged 16 to 64 who are neither working nor looking for work, for example students, carers, people retired early or people who are long-term sick.",
        why: "Unemployment can fall because people give up looking. Inactivity shows how many are outside the labour market altogether.",
      }),
      s("redundancy", "BEIR", "lms", `${NOT_IN_WORK}/redundancies`, {
        label: "Redundancy rate", sentenceName: "The redundancy rate", format: "pct", kind: "rate", verb: "stood at",
        explain: "The number of people made redundant, out of every thousand employees, in the latest three months.",
        why: "It is an early warning. Redundancies tend to rise before unemployment does.",
      }),
      s("vacancies", "AP2Y", "lms", EMPLOYMENT, {
        label: "Job vacancies", sentenceName: "Job vacancies", verb: "were", headline: true, format: "thousands", kind: "level",
        explain: "How many job vacancies employers had open.",
        why: "Fewer vacancies can mean employers are hiring less. When vacancies are high, workers have more bargaining power.",
      }),
      s("hours", "YBUY", "lms", EARNINGS, {
        label: "Weekly hours of full-time workers", sentenceName: "Full-time workers' average weekly hours", format: "hours", kind: "level", verb: "were",
        explain: "The average number of hours full-time employees actually worked in a week, including paid and unpaid overtime.",
        why: "Pay per hour matters as much as pay per week. A fall in hours can mean a lower weekly income even if the hourly rate rises.",
      }),
      s("pay-level", "KAB9", "lms", EARNINGS, {
        nominal: true, label: "Average weekly pay", sentenceName: "Average weekly pay", headline: true, format: "gbp", kind: "level",
        explain: "Average weekly earnings across the whole economy, before tax, excluding one-off back payments. It is an average, so very high earners pull it up.",
        why: "It shows how much workers actually earn, before inflation is taken into account.",
      }),
      s("pay-growth", "KAC3", "lms", EARNINGS, {
        label: "Pay growth on a year earlier", sentenceName: "Pay growth", format: "pct", kind: "rate",
        explain: "How much average pay has risen compared with a year earlier, before taking prices into account.",
        why: "Compare it with inflation. If pay grows faster than prices, people are getting better off.",
      }),
      s("pay-real", "A3WW", "lms", EARNINGS, {
        label: "Pay growth after inflation", sentenceName: "Pay growth after inflation", headline: true, format: "pct", kind: "rate",
        explain: "Pay growth once rising prices are taken off. If it is above zero, wages are buying more than they did a year ago.",
        why: "A long run below zero is what people mean by a living standards squeeze.",
      }),
    ],
  },
  {
    key: "publicFinances",
    label: "Public finances",
    title: "Public finances",
    hint: "Borrowing, debt and public sector jobs",
    subtitle: "How much the government borrows each month, how big the national debt is, and how many people work for the public sector.",
    story: "Governments rarely collect exactly what they spend. The gap is borrowed, and the total owed is the national debt. These figures set the limits on what any government can promise.",
    accent: "#7B5BD6",
    series: [
      s("debt", "HF6X", "pusf", PUBLIC_FINANCE, {
        label: "National debt compared with the size of the economy", sentenceName: "Public sector net debt, as a share of the economy,", headline: true, format: "pct", kind: "rate",
        explain: "What the public sector owes, after taking off what it owns in cash and similar assets, as a share of a year's economic output. It excludes public sector banks.",
        why: "It is the main yardstick of how heavy the debt burden is. Governments set fiscal rules around it, and it affects what it costs to borrow.",
      }),
      s("debt-level", "HF6W", "pusf", PUBLIC_FINANCE, {
        nominal: true, label: "National debt in pounds", sentenceName: "Public sector net debt", headline: true, format: "gbpbnx", kind: "level",
        explain: "The total owed by the public sector, in billions of pounds, excluding public sector banks.",
        why: "A number this big is easier to grasp divided by about 28 million households. It keeps rising whenever the government borrows more than it repays.",
      }),
      s("borrowing", "DZLS", "pusf", PUBLIC_FINANCE, {
        nominal: true, label: "Government borrowing each month", sentenceName: "Public sector borrowing", format: "gbpbn", kind: "level",
        explain: "How much more the public sector spent than it collected in taxes and other income during the month. Months with big tax payments can show a surplus.",
        why: "Monthly figures are noisy, so look at the 12-month total below for the real trend.",
      }),
      d("borrowing-12m", { op: "sum", n: 12, from: "borrowing" }, {
        nominal: true, label: "Government borrowing over the past 12 months", sentenceName: "Borrowing over the past year", headline: true, format: "gbpbn", kind: "level",
        explain: "The last twelve months of borrowing added together, which removes the seasonal ups and downs.",
        why: "It is the closest thing to a deficit figure for the year. Each year's deficit is added to the national debt.",
      }),
      s("deficit", "DZLT", "pusf", PUBLIC_FINANCE, {
        nominal: true, label: "Gap in day-to-day spending each month", sentenceName: "The day-to-day spending gap", format: "gbpbn", kind: "level",
        explain: "Borrowing to pay for running costs such as wages, benefits and bills, leaving out spending on roads, buildings and other lasting investment.",
        why: "Many fiscal rules aim to balance day-to-day spending, while allowing borrowing for investment.",
      }),
      s("investment", "DZLW", "pusf", PUBLIC_FINANCE, {
        nominal: true, label: "Government investment each month", sentenceName: "Public sector net investment", format: "gbpbn", kind: "level",
        explain: "Spending on things that last, such as roads, railways, hospitals and schools, after allowing for wear and tear.",
        why: "Investment is often the first thing cut when budgets are tight, but it shapes what the economy can do for decades.",
      }),
      s("public-workers", "C9KP", "pse", PUBLIC_WORKERS, {
        label: "People working in the public sector", sentenceName: "Public sector employment (full-time equivalent)", headline: true, format: "thousands", kind: "level",
        explain: "Everyone employed by government, local councils, the NHS, schools and other public bodies, counted as full-time equivalents.",
        why: "Public sector pay is one of the biggest items of government spending, and a large share of voters work in it.",
      }),
    ],
  },
  {
    key: "population",
    label: "Population",
    title: "Population",
    hint: "How many of us there are",
    subtitle: "How the UK's population has grown, and how that differs across England, Scotland, Wales and Northern Ireland.",
    story: "Every public service is planned around how many people there are, and where. Population change drives demand for homes, schools, hospitals and transport.",
    accent: "#D4577A",
    series: [
      s("uk", "UKPOP", "pop", POPULATION, {
        label: "UK population", sentenceName: "The UK population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "The best estimate of how many people live in the UK, taken at the middle of each year. Later years are revised once more data comes in.",
        why: "It is the denominator for almost everything else: spending per person, jobs per person and homes per person.",
      }),
      d("uk-growth", { op: "yoy", from: "uk" }, {
        label: "How fast the UK population is growing", sentenceName: "UK population growth", headline: true, format: "pct", kind: "rate", labelPrefix: "mid-",
        explain: "The change in the UK's population compared with the year before, as a percentage. It combines births, deaths and people moving in and out.",
        why: "Fast growth increases demand for housing and services. Slow growth means an ageing population with fewer workers per pensioner.",
      }),
      s("england", "ENPOP", "pop", POPULATION, {
        label: "England", sentenceName: "England's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in England, about 85% of the UK.",
        why: "England's size is why UK-wide votes are dominated by English seats, and why devolved nations argue about their share of funding.",
      }),
      s("scotland", "SCPOP", "pop", POPULATION, {
        label: "Scotland", sentenceName: "Scotland's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in Scotland.",
        why: "Population is used to divide up funding between the UK's nations.",
      }),
      s("wales", "WAPOP", "pop", POPULATION, {
        label: "Wales", sentenceName: "Wales's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in Wales.",
        why: "Population is used to divide up funding between the UK's nations.",
      }),
      s("ni", "NIPOP", "pop", POPULATION, {
        label: "Northern Ireland", sentenceName: "Northern Ireland's population", headline: true, format: "people", kind: "level", labelPrefix: "mid-",
        explain: "People living in Northern Ireland.",
        why: "Population is used to divide up funding between the UK's nations.",
      }),
    ],
  },
  {
    key: "health",
    label: "Health",
    title: "Health",
    hint: "Waiting times, A&E, cancer and staff",
    subtitle: "How long patients wait for hospital treatment, A&E, cancer care and an ambulance, set against the NHS's standards and the government's goals, plus staffing, sickness and deaths.",
    story: "Waiting times are how most people feel the state of the NHS. A long wait for an operation, a trolley in A&E or an ambulance that is slow to arrive each show up in these figures, and each is a target the government has promised to hit.",
    accent: "#D9453B",
    weeklyDeaths: true,
    series: [
      f("rtt-waiting", "rtt-waiting", NHS_SOURCE, {
        label: "People waiting for hospital treatment", sentenceName: "The NHS waiting list in England", headline: true, format: "count", kind: "level", timeWord: "in",
        explain: "The size of the NHS waiting list in England: the number of waits (called 'pathways') that have started and not yet ended in treatment or a decision that none is needed. One person can be waiting for more than one thing.",
        why: "It is the most-quoted measure of NHS pressure. A list this long means millions of people living with pain or worry while they wait.",
      }),
      f("rtt-within-18", "rtt-within-18", NHS_SOURCE, {
        label: "Waiting list: share seen within 18 weeks", sentenceName: "The share of people on the waiting list who had waited under 18 weeks", headline: true, format: "pct", kind: "rate",
        explain: "Of everyone waiting for hospital treatment in England, the share who have been waiting for less than 18 weeks. The NHS standard is that 92% should.",
        why: "The standard has not been met since 2016. The government has promised to meet it, so this is the number to watch for whether that promise is being kept.",
        targets: [{ value: 92, label: "NHS standard: 92%" }, { value: 65, label: "March 2026 goal: 65%" }],
      }),
      f("rtt-over-52", "rtt-over-52", NHS_SOURCE, {
        label: "People waiting over a year", sentenceName: "The number of patients waiting more than a year", headline: true, format: "count", kind: "level",
        explain: "The number of waits that have lasted more than 52 weeks, on the waiting list for hospital treatment in England.",
        why: "A year-long wait is the clearest sign a patient is not getting care when they need it. The NHS aims for almost nobody to wait this long.",
      }),
      f("rtt-median", "rtt-median", NHS_SOURCE, {
        label: "Typical wait for treatment", sentenceName: "The median wait of people on the waiting list", format: "weeks", kind: "level",
        explain: "The wait of the person in the middle of the list: half have waited less, half more. It is for those still waiting, not those who have been treated.",
        why: "The headline waiting list can hide how long people really wait. The median shows what a typical patient faces, though it is lower than the longest waits.",
      }),
      f("ae-4-hour", "ae-4-hour", NHS_SOURCE, {
        label: "A&E: share seen within 4 hours", sentenceName: "The share of A&E attendances dealt with within four hours", headline: true, format: "pct", kind: "rate",
        explain: "The share of everyone attending an A&E department or urgent care centre in England who was admitted, transferred or sent home within four hours of arriving.",
        why: "A&E is where emergencies and the pressures of the rest of the NHS meet. The standard is 95%, last met in 2015.",
        targets: [{ value: 95, label: "NHS standard: 95%" }, { value: 78, label: "March 2026 goal: 78%" }],
      }),
      f("ae-4-hour-major", "ae-4-hour-major", NHS_SOURCE, {
        label: "Major A&E departments: share seen within 4 hours", sentenceName: "The share of attendances at major A&E departments dealt with within four hours", format: "pct", kind: "rate",
        explain: "The same four-hour measure, for the full 24-hour hospital A&E departments only (not minor injury units or walk-in centres, which are quicker).",
        why: "The sickest patients go to these departments, so this is the harder test, and usually the lower number.",
      }),
      f("cancer-62-day", "cancer-62-day", NHS_SOURCE, {
        label: "Cancer: treated within 62 days of an urgent referral", sentenceName: "The share of cancer patients who started treatment within 62 days of an urgent referral", headline: true, format: "pct", kind: "rate",
        explain: "Of people urgently referred by a GP with suspected cancer (or after a screening), the share who began their first treatment within two months in England.",
        why: "Cancer is more likely to be treated successfully when it is caught and treated early, so delays here can cost lives.",
        targets: [{ value: 85, label: "NHS standard: 85%" }, { value: 75, label: "March 2026 goal: 75%" }],
      }),
      f("cancer-28-day", "cancer-28-day", NHS_SOURCE, {
        label: "Cancer: told within 28 days of an urgent referral", sentenceName: "The share of urgently referred patients told within 28 days whether they have cancer", format: "pct", kind: "rate",
        explain: "Of people urgently referred with suspected cancer, the share who were told within four weeks that they have cancer or that it has been ruled out (the Faster Diagnosis Standard).",
        why: "The wait for an answer is often the hardest part. This is the earliest warning of delays further along the cancer pathway.",
        targets: [{ value: 80, label: "Standard from April 2026: 80%" }],
      }),
      f("cancer-31-day", "cancer-31-day", NHS_SOURCE, {
        label: "Cancer: first treatment within 31 days of a decision", sentenceName: "The share of cancer patients who began treatment within 31 days of the decision to treat", format: "pct", kind: "rate",
        explain: "Of people with cancer who have agreed a treatment plan, the share who began treatment within a month.",
        why: "Once a plan is agreed, delays are hard to justify. The standard is met more often than the other cancer targets.",
        targets: [{ value: 96, label: "NHS standard: 96%" }],
      }),
      f("ambulance-c2", "ambulance-c2", NHS_SOURCE, {
        label: "Ambulances: average response to emergencies", sentenceName: "The average ambulance response time to emergencies such as strokes and heart attacks", verb: "was", headline: true, format: "minutes", kind: "level",
        explain: "The average time from a 999 call being answered to an ambulance arriving, for Category 2 calls: emergencies such as strokes, chest pain and serious burns, in England.",
        why: "For a stroke or heart attack, minutes matter. The standard is 18 minutes on average. The government's goal is 30 minutes.",
        targets: [{ value: 30, label: "2025/26 goal: 30 minutes" }, { value: 18, label: "NHS standard: 18 minutes" }],
      }),
      f("ambulance-c1", "ambulance-c1", NHS_SOURCE, {
        label: "Ambulances: average response to life-threatening calls", sentenceName: "The average ambulance response time to life-threatening calls", verb: "was", format: "minutes", kind: "level",
        explain: "The average time from a 999 call being answered to an ambulance arriving, for Category 1 calls: cardiac arrests and other immediately life-threatening emergencies, in England.",
        why: "These are the most urgent calls. The standard is an average of 7 minutes.",
        targets: [{ value: 7, label: "NHS standard: 7 minutes" }],
      }),
      s("nhs-staff", "G7GL", "pse", PUBLIC_WORKERS, {
        label: "NHS staff", sentenceName: "NHS employment (full-time equivalent)", headline: true, format: "thousands", kind: "level",
        explain: "People working for the NHS across the UK, counted as full-time equivalents, so two half-time jobs count as one.",
        why: "Staffing is the single biggest factor in how many patients the NHS can treat.",
      }),
      s("sick-count", "LF69", "lms", `${NOT_IN_WORK}/economicinactivity`, {
        label: "People out of work with long-term sickness", sentenceName: "People out of work because of long-term sickness", headline: true, format: "thousands", kind: "level",
        explain: "How many working-age people (16 to 64) are neither in work nor looking for it because of long-term sickness or disability.",
        why: "It is one of the clearest signs of how ill health affects the economy, and has risen sharply since the pandemic.",
      }),
      s("long-term-sick", "LF75", "lms", `${NOT_IN_WORK}/economicinactivity`, {
        label: "Long-term sick, as a share of those not working or looking for work", sentenceName: "The share of economically inactive 16 to 64 year olds who are long-term sick", format: "pct", kind: "rate",
        explain: "Of the working-age people who are neither in work nor looking for it, the share who say long-term sickness or disability is the reason.",
        why: "It shows how much of the gap between those in and out of the labour market is down to health, rather than study, caring or retirement.",
      }),
    ],
  },
  {
    key: "housing",
    label: "Housing",
    title: "Housing, house prices and rents",
    hint: "House prices, rents and bills",
    subtitle: "What homes cost to buy and to rent, how that differs across the UK, and what it costs to heat them.",
    story: "Housing is the biggest bill most households face. It shapes where people can afford to live, when they can start a family, and how much of every pay packet is left over.",
    accent: "#2F9E6E",
    series: [
      h("hpi-uk", "united-kingdom", "averagePrice", {
        label: "Average UK house price", sentenceName: "The average UK house price", headline: true, format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a home in the UK, worked out from every sale registered with the Land Registry. It is not adjusted for inflation.",
        why: "It is the number behind most debates on affordability. Compare it with average earnings to see how many years of pay a home costs.",
      }),
      h("hpi-change", "united-kingdom", "percentageAnnualChange", {
        label: "House price change on a year earlier", sentenceName: "Annual UK house price growth", headline: true, format: "pct", kind: "rate",
        explain: "How much average UK house prices have changed compared with a year earlier.",
        why: "Rising prices help people who already own and make it harder for first-time buyers. Falling prices can hit homeowners who have borrowed a lot.",
      }),
      h("hpi-england", "england", "averagePrice", {
        label: "England", sentenceName: "The average house price in England", headline: true, format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a home in England.",
        why: "England has about 85% of the UK's homes, so it sets the national picture.",
      }),
      h("hpi-wales", "wales", "averagePrice", {
        label: "Wales", sentenceName: "The average house price in Wales", format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a home in Wales.",
        why: "Housing is a devolved matter, so Wales sets its own policy on housebuilding, renting and support for buyers.",
      }),
      h("hpi-scotland", "scotland", "averagePrice", {
        label: "Scotland", sentenceName: "The average house price in Scotland", format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a home in Scotland.",
        why: "Scotland has its own housing and tax rules, including its own tax on house purchases.",
      }),
      h("hpi-ni", "northern-ireland", "averagePrice", {
        label: "Northern Ireland", sentenceName: "The average house price in Northern Ireland", format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a home in Northern Ireland.",
        why: "Northern Ireland has historically had the lowest prices in the UK, though they have been catching up.",
      }),
      h("hpi-london", "london", "averagePrice", {
        label: "London", sentenceName: "The average house price in London", headline: true, format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a home in London.",
        why: "London prices are far above the rest of the country, which is a big part of the case for building more homes where people want to live.",
      }),
      h("hpi-north-east", "north-east", "averagePrice", {
        label: "North East of England", sentenceName: "The average house price in the North East", format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a home in the North East of England, usually the cheapest English region.",
        why: "The gap between London and the North East is one way to see how unevenly prosperity is spread.",
      }),
      h("hpi-detached", "united-kingdom", "averagePriceDetached", {
        label: "Detached houses", sentenceName: "The average price of a detached house", format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a detached house in the UK.",
        why: "Detached houses are the top of the market, so they show how far prices have risen for larger family homes.",
      }),
      h("hpi-flat", "united-kingdom", "averagePriceFlatMaisonette", {
        label: "Flats and maisonettes", sentenceName: "The average price of a flat or maisonette", format: "gbp", kind: "level", nominal: true,
        explain: "The average price paid for a flat or maisonette in the UK.",
        why: "Flats are the usual first rung for younger buyers, especially in cities.",
      }),
      s("rents-rate", "D7GQ", "mm23", PRICES, {
        realMode: "relative", label: "Rents, change on a year earlier", sentenceName: "Rent inflation", headline: true, format: "pct", kind: "rate",
        explain: "How much more private tenants pay to rent a home than a year earlier.",
        why: "Rent rises hit younger and lower-income households hardest, and feed into debates about rent controls and housebuilding.",
      }),
      s("rents-index", "KYHJ", "mm23", PRICES, {
        label: "Private rents index", sentenceName: "The private rents index", headline: true, format: "index", kind: "level", verb: "stood at",
        explain: "Rents measured against a starting point of 100 in 2015. A reading of 141 means rents are about 41% higher than in 2015.",
        why: "It shows the cumulative rise in rents over years, which single-year percentages hide.",
      }),
      s("home-energy", "D7GT", "mm23", PRICES, {
        realMode: "relative", label: "Electricity, gas and other fuels", sentenceName: "Home energy inflation", format: "pct", kind: "rate",
        explain: "The change in what households pay for electricity, gas and heating fuel.",
        why: "Heating a home is a large and unavoidable cost, and a major reason for fuel poverty debates.",
      }),
      f("homes-net", "homes-net", HOUSING_SUPPLY_SOURCE, {
        yearEnding: true, label: "New homes added in England each year", sentenceName: "Net additional dwellings in England", verb: "were", headline: true, format: "count", kind: "level",
        explain: "The net increase in the number of homes in England over a financial year (April to March): new builds, plus homes created by converting other buildings, minus those demolished or merged.",
        why: "It is the official measure of how fast the country is building homes. The government has promised 1.5 million over the parliament, which needs about 300,000 a year.",
        targets: [{ value: 300000, label: "Needed for 1.5 million in five years: 300,000" }],
      }),
      d("homes-completed-12m", { op: "sum", n: 4, from: "homes-completed-q" }, {
        yearEnding: true, label: "New homes finished in England over 12 months", sentenceName: "New homes completed in England", verb: "were", headline: true, format: "count", kind: "level",
        explain: "The number of new homes completed in England over the last four quarters, counting newly built homes only (not conversions), from building control records.",
        why: "It is the quickest read on whether building is speeding up, because it is published quarterly, ahead of the annual figure.",
      }),
      d("homes-started-12m", { op: "sum", n: 4, from: "homes-started-q" }, {
        yearEnding: true, label: "New homes started in England over 12 months", sentenceName: "New homes started in England", verb: "were", format: "count", kind: "level",
        explain: "The number of new homes where building work began in England over the last four quarters.",
        why: "Homes started now are homes finished in a year or two, so this is the best early sign of whether the building target can be met.",
      }),
    ],
    inputs: [
      f("homes-completed-q", "homes-completed", HOUSING_SUPPLY_SOURCE, { label: "New homes completed each quarter", sentenceName: "New homes completed", format: "count", kind: "level", explain: "New homes completed in England each quarter.", why: "A building block for the 12-month total." }),
      f("homes-started-q", "homes-started", HOUSING_SUPPLY_SOURCE, { label: "New homes started each quarter", sentenceName: "New homes started", format: "count", kind: "level", explain: "New homes started in England each quarter.", why: "A building block for the 12-month total." }),
    ],
  },
  {
    key: "crime",
    label: "Crime",
    title: "Crime in England and Wales",
    hint: "What the survey and police figures show",
    subtitle: "Two ways of counting crime, side by side: a survey that asks people what happened to them, and the crimes police record. They often tell different stories, so both are here.",
    story: "No single number captures crime. The Crime Survey asks people about their own experience, so it catches crimes that never reach the police. Police figures count what is reported and recorded, so they also reflect how readily people report and how forces record.",
    accent: "#B04A4A",
    series: [
      t("csew-all", CSEW, /^ALL CSEW HEADLINE CRIME EXCLUDING FRAUD/i, {
        label: "All crime in the Crime Survey (excluding fraud)", sentenceName: "Crime Survey incidents (excluding fraud)", headline: true, format: "thousands", kind: "level",
        explain: "The number of crimes people say they experienced in the 12 months before they were interviewed, from the Crime Survey for England and Wales. It leaves out fraud and computer misuse, which are counted separately. The survey changed to telephone interviews from 2020, so comparisons across that point need care.",
        why: "Because it asks people directly, it is the most reliable guide to long-run trends, even for crimes that are not reported to the police.",
      }),
      t("csew-violence", CSEW, /^VIOLENCE$/i, {
        label: "Violence in the Crime Survey", sentenceName: "Violent incidents in the Crime Survey", format: "thousands", kind: "level",
        explain: "Incidents of violence, with or without injury, that people say happened to them. It does not include homicide.",
        why: "Violence is the crime people worry about most, and the survey shows it has fallen a long way since the 1990s.",
      }),
      t("csew-theft", CSEW, /^THEFT OFFENCES/i, {
        label: "Theft in the Crime Survey", sentenceName: "Theft incidents in the Crime Survey", format: "thousands", kind: "level",
        explain: "Burglary, vehicle theft, theft from the person and other thefts that people say happened to them or their household.",
        why: "Theft is the largest category and has fallen sharply since the mid-1990s, partly because cars and homes are better protected.",
      }),
      t("csew-fraud", CSEW, /^Fraud/i, {
        label: "Fraud in the Crime Survey", sentenceName: "Fraud incidents in the Crime Survey", format: "thousands", kind: "level",
        explain: "Incidents of fraud, such as bank and credit card fraud and online shopping scams. It has only been counted since 2017.",
        why: "Fraud is now the most common crime people experience, though it is often not reported, and it is harder for police to investigate.",
      }),
      t("prc-all", POLICE, /^TOTAL RECORDED CRIME - ALL OFFENCES EXCLUDING FRAUD/i, {
        label: "All crime recorded by the police (excluding fraud)", sentenceName: "Crimes recorded by the police (excluding fraud)", headline: true, format: "count", kind: "level",
        explain: "Every crime that police forces in England and Wales recorded in the year to March, excluding fraud, which is recorded separately.",
        why: "It is the figure usually quoted in the news. It can rise either because there is more crime or because more is being reported and recorded.",
      }),
      t("prc-violence", POLICE, /^TOTAL VIOLENCE AGAINST THE PERSON/i, {
        label: "Violence against the person (police recorded)", sentenceName: "Violent crimes recorded by the police", headline: true, format: "count", kind: "level",
        explain: "Violent crimes recorded by police, from common assault to murder. Changes in how police record violence have raised the total since 2014.",
        why: "It is the largest group of recorded crime, and is closely watched because of its human cost.",
      }),
      t("prc-homicide", POLICE, /^Homicide/i, {
        label: "Homicides (police recorded)", sentenceName: "Homicides recorded by the police", headline: true, format: "count", kind: "level",
        explain: "Murder, manslaughter and infanticide recorded by the police.",
        why: "Homicide is the most reliably recorded crime because almost every case is discovered, so it is the best check on police figures.",
      }),
      t("prc-knife", POLICE, /^Possession of article with blade or point/i, {
        label: "Possession of a knife or blade (police recorded)", sentenceName: "Knife and blade possession offences recorded by the police", headline: true, format: "count", kind: "level",
        explain: "Offences of carrying a knife or blade in public without good reason. More police activity, such as stop and search, increases this number.",
        why: "Knife crime is a major public concern. This counts carrying offences, not attacks.",
      }),
      t("prc-sexual", POLICE, /^TOTAL SEXUAL OFFENCES/i, {
        label: "Sexual offences (police recorded)", sentenceName: "Sexual offences recorded by the police", format: "count", kind: "level",
        explain: "Rape, sexual assault and other sexual offences recorded by the police.",
        why: "Many of these crimes are never reported, so a rise can partly reflect more victims coming forward.",
      }),
      t("prc-robbery", POLICE, /^TOTAL ROBBERY/i, {
        label: "Robbery (police recorded)", sentenceName: "Robberies recorded by the police", format: "count", kind: "level",
        explain: "Theft where force or the threat of force is used, such as mugging.",
        why: "Robbery is rarer than other thefts but more frightening, and it is often a signal of wider street crime.",
      }),
      t("prc-burglary", POLICE, /^Burglary$/i, {
        label: "Burglary (police recorded)", sentenceName: "Burglaries recorded by the police", format: "count", kind: "level",
        explain: "Break-ins to homes and other buildings recorded by the police.",
        why: "Burglary has fallen steadily for decades, helped by better locks, alarms and cameras.",
      }),
      t("prc-theft", POLICE, /^TOTAL THEFT OFFENCES/i, {
        label: "Theft (police recorded)", sentenceName: "Thefts recorded by the police", format: "count", kind: "level",
        explain: "All thefts recorded by the police, from shoplifting to vehicle theft.",
        why: "Theft is the biggest category of recorded crime, and its fall explains most of the long decline in the total.",
      }),
      t("prc-shoplifting", POLICE, /^Shoplifting/i, {
        label: "Shoplifting (police recorded)", sentenceName: "Shoplifting offences recorded by the police", format: "count", kind: "level",
        explain: "Thefts from shops recorded by the police.",
        why: "Shoplifting has risen sharply recently, and retailers say much of it is never reported.",
      }),
      t("prc-damage", POLICE, /^TOTAL CRIMINAL DAMAGE AND ARSON/i, {
        label: "Criminal damage and arson (police recorded)", sentenceName: "Criminal damage and arson offences recorded by the police", format: "count", kind: "level",
        explain: "Damage to property, such as vandalism, and deliberate fires.",
        why: "It is an everyday sign of antisocial behaviour in a neighbourhood.",
      }),
      t("prc-drugs", POLICE, /^TOTAL DRUG OFFENCES/i, {
        label: "Drug offences (police recorded)", sentenceName: "Drug offences recorded by the police", format: "count", kind: "level",
        explain: "Possession and supply of controlled drugs recorded by the police.",
        why: "Unlike most crimes, these are found by police activity, so the total reflects policing priorities as much as drug use.",
      }),
    ],
  },
  {
    key: "trade",
    label: "Trade",
    title: "Trade with the world",
    hint: "What we sell abroad and buy in",
    subtitle: "How much the UK sells to the rest of the world, how much it buys, and the gap between the two.",
    story: "The UK sells goods and services abroad and buys them in. When we buy more than we sell, the difference has to be paid for by borrowing from, or selling assets to, the rest of the world.",
    accent: "#C28A1E",
    series: [
      s("exports", "KTMW", "ukea", TRADE, {
        nominal: true, label: "Exports of goods and services", sentenceName: "UK exports", verb: "were", headline: true, format: "gbpbn", kind: "level",
        explain: "The value of what the UK sold to other countries in a quarter, in current prices.",
        why: "Exports earn income from abroad and support jobs. Trade deals are meant to increase them.",
      }),
      s("imports", "KTMX", "ukea", TRADE, {
        nominal: true, label: "Imports of goods and services", sentenceName: "UK imports", verb: "were", headline: true, format: "gbpbn", kind: "level",
        explain: "The value of what the UK bought from other countries in a quarter, in current prices.",
        why: "The UK relies on imports for food, fuel and many goods, so they show how exposed households are to world prices.",
      }),
      s("trade-balance", "KTMY", "ukea", TRADE, {
        nominal: true, label: "Trade balance", sentenceName: "The trade balance", headline: true, format: "gbpbn", kind: "level",
        explain: "Exports minus imports. A negative number means the UK bought more than it sold.",
        why: "The UK has run a trade deficit for most of the last forty years, which is normal for an economy with a large services sector and strong overseas investment.",
      }),
      s("current-account", "AA6H", "ukea", TRADE, {
        label: "Current account, as a share of the economy", sentenceName: "The current account balance", headline: true, format: "pct", kind: "rate",
        explain: "The widest measure of money flowing in and out of the country, including trade, investment income and transfers, as a percentage of GDP.",
        why: "A large deficit means the UK is relying on foreign money to pay its way, which can put pressure on the pound.",
      }),
    ],
  },
  {
    key: "environment",
    label: "Energy and environment",
    title: "Energy and the environment",
    hint: "Emissions and energy use",
    subtitle: "How much greenhouse gas the UK produces, and how much energy it uses. These figures come out more slowly than the others, about two years after the year they describe.",
    story: "The UK has a legal target of reaching net zero emissions by 2050. These figures show how far emissions and energy use have moved since 1990.",
    accent: "#3F9B3F",
    series: [
      s("ghg", "K8B5", "bb", GDP, {
        label: "Greenhouse gas emissions", sentenceName: "UK greenhouse gas emissions", verb: "were", headline: true, format: "ktonnes", kind: "level",
        explain: "All greenhouse gases produced by UK residents and businesses, in carbon dioxide equivalents. It includes emissions abroad from UK residents' flights and shipping.",
        why: "Climate targets are set on emissions, and the UK's long-run fall is among the largest of any major economy.",
      }),
      s("co2", "K83W", "bb", GDP, {
        label: "Carbon dioxide emissions", sentenceName: "UK carbon dioxide emissions", verb: "were", format: "ktonnes", kind: "level",
        explain: "Carbon dioxide on its own, the biggest greenhouse gas, from burning fossil fuels.",
        why: "Most of the long fall in emissions has come from replacing coal with gas, wind and solar in electricity generation.",
      }),
      s("energy-use", "K7ZA", "bb", GDP, {
        label: "Energy used", sentenceName: "UK energy use", headline: true, format: "mtoe", kind: "level",
        explain: "All the energy used by UK residents and businesses, in millions of tonnes of oil equivalent.",
        why: "Using less energy for the same output is the cheapest way to cut emissions and bills.",
      }),
      s("non-fossil", "K7Z9", "bb", GDP, {
        label: "Energy from non-fossil sources", sentenceName: "Energy from non-fossil sources", format: "mtoe", kind: "level",
        explain: "Energy from nuclear, wind, solar, hydro and biomass, in millions of tonnes of oil equivalent.",
        why: "It tracks the shift away from fossil fuels.",
      }),
      d("non-fossil-share", { op: "percentOf", from: "non-fossil", of: "energy-use" }, {
        label: "Share of energy from non-fossil sources", sentenceName: "The share of energy from non-fossil sources", headline: true, format: "pct", kind: "rate",
        explain: "Non-fossil energy as a percentage of all the energy used.",
        why: "It is a simple measure of how far the energy mix has changed.",
      }),
    ],
  },
  {
    key: "tax",
    label: "Taxes and spending",
    title: "Taxes and public spending",
    hint: "Where the money comes from and goes",
    subtitle: "How much the government collects in each main tax, what it spends on benefits and on interest, and how each £1 is shared out. Every figure is the total for the last 12 months.",
    story: "Every government is a collector and a spender. Taxes pay for the NHS, schools, pensions and the interest on past borrowing, and a shift of a few pence in the pound is what Budgets are fought over.",
    accent: "#8A9A2B",
    series: [
      d("receipts-12m", { op: "sum", n: 12, from: "receipts-m" }, {
        yearEnding: true, nominal: true, label: "Everything the government collects", sentenceName: "Public sector receipts", verb: "were", headline: true, format: "gbpbn", kind: "level",
        explain: "Taxes, National Insurance and other income received by the public sector over the last 12 months, excluding public sector banks.",
        why: "It is the pot that pays for everything else. How fast it grows decides how much room there is for tax cuts or spending rises.",
      }),
      d("paye-12m", { op: "sum", n: 12, from: "paye-m" }, {
        yearEnding: true, nominal: true, label: "Income tax taken from pay (PAYE)", sentenceName: "Income tax taken from pay", headline: true, format: "gbpbn", kind: "level",
        explain: "Income tax that employers take from pay packets and pay to HMRC, over the last 12 months.",
        why: "The biggest single tax. It rises when more people work, pay rises, or tax thresholds stay frozen and people are pulled into higher rates.",
      }),
      d("sa-12m", { op: "sum", n: 12, from: "sa-m" }, {
        yearEnding: true, nominal: true, label: "Income tax from self-assessment", sentenceName: "Self-assessed income tax", format: "gbpbn", kind: "level",
        explain: "Income tax paid by people who fill in a tax return, such as the self-employed and landlords, over the last 12 months.",
        why: "It is paid mostly in January and July, which is why the government's borrowing swings so much between months.",
      }),
      d("nics-12m", { op: "sum", n: 12, from: "nics-m" }, {
        yearEnding: true, nominal: true, label: "National Insurance", sentenceName: "National Insurance", headline: true, format: "gbpbn", kind: "level",
        explain: "Compulsory social contributions paid by employees, employers and the self-employed, over the last 12 months.",
        why: "It is a tax on jobs. Changes to its rates and thresholds affect take-home pay and what it costs to hire people.",
      }),
      d("vat-4q", { op: "sum", n: 4, from: "vat-q" }, {
        yearEnding: true, nominal: true, label: "VAT", sentenceName: "VAT", headline: true, format: "gbpbn", kind: "level",
        explain: "Value Added Tax collected on what people and businesses buy, over the last four quarters.",
        why: "It rises and falls with how much people spend, and it is hard to avoid, which is why governments rely on it.",
      }),
      d("corp-4q", { op: "sum", n: 4, from: "corp-q" }, {
        yearEnding: true, nominal: true, label: "Corporation tax", sentenceName: "Corporation tax", format: "gbpbn", kind: "level",
        explain: "Tax on company profits, over the last four quarters.",
        why: "Its rate affects where firms choose to invest. The yield swings with company profits and with changes to what firms can deduct.",
      }),
      d("fuel-12m", { op: "sum", n: 12, from: "fuel-m" }, {
        yearEnding: true, nominal: true, label: "Fuel duty", sentenceName: "Fuel duty", format: "gbpbn", kind: "level",
        explain: "The tax on petrol and diesel, over the last 12 months.",
        why: "The rate has been frozen or cut for years. As more people switch to electric cars, this tax will bring in less.",
      }),
      s("council-tax", "NMHM", "bb", PUBLIC_FINANCE, {
        nominal: true, label: "Council tax", sentenceName: "Council tax", format: "gbpbn", kind: "level",
        explain: "Council tax collected by local councils each calendar year. It is published once a year, so it runs behind the other taxes here.",
        why: "It pays for local services such as bin collections and social care, and is the main tax local councils control.",
      }),
      d("spending-12m", { op: "sum", n: 12, from: "spending-m" }, {
        yearEnding: true, nominal: true, label: "Everything the government spends", sentenceName: "Public sector spending", headline: true, format: "gbpbn", kind: "level",
        explain: "Total managed expenditure: day-to-day spending plus investment, by the public sector excluding public sector banks, over the last 12 months.",
        why: "It is the number behind every argument about the size of the state. When it is bigger than receipts, the gap is borrowed.",
      }),
      d("benefits-12m", { op: "sum", n: 12, from: "benefits-m" }, {
        yearEnding: true, nominal: true, label: "Benefits and pensions", sentenceName: "Spending on benefits and pensions", headline: true, format: "gbpbn", kind: "level",
        explain: "Net social benefits paid out, including the State Pension and benefits for people of working age, over the last 12 months.",
        why: "It is the largest part of spending. It rises as the population ages and when benefits are increased in line with prices or pay.",
      }),
      d("interest-12m", { op: "sum", n: 12, from: "interest-m" }, {
        yearEnding: true, nominal: true, label: "Interest on the national debt", sentenceName: "Debt interest", headline: true, format: "gbpbn", kind: "level",
        explain: "Interest and dividends paid to those the public sector owes money to, over the last 12 months.",
        why: "Every pound spent on interest is a pound not spent on services. It climbs when debt grows or when interest rates rise.",
      }),
      d("income-tax-share", { op: "percentOf", from: "paye-12m", of: "receipts-12m" }, {
        yearEnding: true, label: "Share of receipts from income tax on pay", sentenceName: "The share of government income that comes from PAYE income tax", headline: true, format: "pct", kind: "rate",
        explain: "Income tax taken from pay, as a share of everything the government collects over the last 12 months.",
        why: "A rising share means the government leans more heavily on working people's earnings, for example when tax thresholds are frozen.",
      }),
      d("interest-share", { op: "percentOf", from: "interest-12m", of: "receipts-12m" }, {
        yearEnding: true, label: "Debt interest as a share of everything collected", sentenceName: "Debt interest as a share of government income", headline: true, format: "pct", kind: "rate",
        explain: "Interest paid on the national debt, divided by everything the government collects, over the last 12 months.",
        why: "It shows how much of each pound of tax is already spoken for by past borrowing before any new spending decision is made.",
      }),
      d("benefits-share", { op: "percentOf", from: "benefits-12m", of: "spending-12m" }, {
        yearEnding: true, label: "Benefits and pensions as a share of spending", sentenceName: "Benefits and pensions as a share of public spending", format: "pct", kind: "rate",
        explain: "Spending on benefits and pensions as a share of all public spending over the last 12 months.",
        why: "It shows how much of the budget is committed to support people, and how fast that grows as the population ages.",
      }),
    ],
    inputs: [
      s("receipts-m", "JW2O", "pusf", PUBLIC_FINANCE, { label: "Public sector receipts each month", sentenceName: "Public sector receipts", format: "gbpbn", kind: "level", explain: "Total current receipts each month, excluding public sector banks. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
      s("paye-m", "MS6W", "pusf", PUBLIC_FINANCE, { label: "PAYE income tax each month", sentenceName: "PAYE income tax", format: "gbpbn", kind: "level", explain: "Income tax taken from pay each month. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
      s("sa-m", "LISB", "pusf", PUBLIC_FINANCE, { label: "Self-assessed income tax each month", sentenceName: "Self-assessed income tax", format: "gbpbn", kind: "level", explain: "Income tax from tax returns each month. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
      s("nics-m", "AIIH", "pusf", PUBLIC_FINANCE, { label: "National Insurance each month", sentenceName: "National Insurance", format: "gbpbn", kind: "level", explain: "Compulsory social contributions each month. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
      s("fuel-m", "CUDG", "pusf", PUBLIC_FINANCE, { label: "Fuel duty each month", sentenceName: "Fuel duty", format: "gbpbn", kind: "level", explain: "Fuel duty each month. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
      s("vat-q", "NZGF", "ukea", PUBLIC_FINANCE, { label: "VAT each quarter", sentenceName: "VAT", format: "gbpbn", kind: "level", explain: "VAT receivable by central government each quarter. Not adjusted for the time of year.", why: "A building block for the 12-month total." }),
      s("corp-q", "ACCD", "qna", PUBLIC_FINANCE, { label: "Corporation tax each quarter", sentenceName: "Corporation tax", format: "gbpbn", kind: "level", explain: "Corporation tax each quarter. Not adjusted for the time of year.", why: "A building block for the 12-month total." }),
      s("spending-m", "KX5Q", "pusf", PUBLIC_FINANCE, { label: "Public sector spending each month", sentenceName: "Public sector spending", format: "gbpbn", kind: "level", explain: "Total managed expenditure each month, excluding public sector banks. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
      s("benefits-m", "CWNZ", "pusf", PUBLIC_FINANCE, { label: "Benefits and pensions each month", sentenceName: "Benefits and pensions", format: "gbpbn", kind: "level", explain: "Net social benefits paid each month, excluding public sector banks. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
      s("interest-m", "JW2P", "pusf", PUBLIC_FINANCE, { label: "Debt interest each month", sentenceName: "Debt interest", format: "gbpbn", kind: "level", explain: "Interest and dividends paid to the private sector and the rest of the world each month, excluding public sector banks. Not adjusted for the time of year.", why: "A building block for the 12-month totals." }),
    ],
  },
  {
    key: "rates",
    label: "Interest rates",
    title: "Interest rates, mortgages and the pound",
    hint: "Mortgages, savings and the pound",
    subtitle: "The Bank of England's interest rate, what lenders charge and savers earn, how many mortgages are being approved, and what a pound buys in dollars and euros.",
    story: "Interest rates are the price of money. When the Bank of England raises its rate, mortgages and loans get dearer and saving pays more. When it cuts, the reverse. It is its main weapon against inflation.",
    accent: "#3D5AFE",
    series: [
      b("bank-rate", "IUDBEDR", "last", {
        realMode: "rate", label: "Bank Rate", sentenceName: "Bank Rate", headline: true, format: "pct2", kind: "rate",
        explain: "The interest rate set by the Bank of England's Monetary Policy Committee. The figure shown is the rate on the last day of each month.",
        why: "It is the starting point for almost every other interest rate, so a change feeds through to mortgages, loans and savings accounts.",
      }),
      b("mortgage-2y", "IUMBV34", "month", {
        realMode: "rate", label: "Two-year fixed mortgage rate", sentenceName: "The average two-year fixed mortgage rate (for a 75% loan against the home's value)", headline: true, format: "pct2", kind: "rate",
        explain: "The average interest rate on new two-year fixed-rate mortgages where the borrower has a 25% deposit (a 75% loan-to-value), across UK lenders.",
        why: "It is what many homebuyers and remortgagers actually pay. A one-point rise adds roughly £60 a month to the repayments on every £100,000 borrowed.",
      }),
      b("mortgage-5y", "IUMBV42", "month", {
        realMode: "rate", label: "Five-year fixed mortgage rate", sentenceName: "The average five-year fixed mortgage rate (for a 75% loan against the home's value)", format: "pct2", kind: "rate",
        explain: "The average interest rate on new five-year fixed-rate mortgages with a 25% deposit, across UK lenders.",
        why: "Five-year deals give certainty for longer. They follow what lenders expect rates to do, so they can move before the Bank does.",
      }),
      b("mortgage-2y-90", "IUMB482", "month", {
        realMode: "rate", label: "Two-year fixed mortgage rate for small deposits", sentenceName: "The average two-year fixed mortgage rate for a 90% loan against the home's value", format: "pct2", kind: "rate",
        explain: "The average interest rate on new two-year fixed-rate mortgages where the borrower has only a 10% deposit (a 90% loan-to-value).",
        why: "Buyers with small deposits pay more. The gap between this and the main rate shows how much extra risk lenders are charging for.",
      }),
      b("credit-card", "IUMCCTL", "month", {
        realMode: "rate", label: "Credit card interest rate", sentenceName: "The average credit card interest rate", format: "pct2", kind: "rate",
        explain: "The average interest rate that UK lenders charge on credit card borrowing for households.",
        why: "Credit card debt is one of the dearest ways to borrow, so people who carry a balance feel interest rates quickly.",
      }),
      b("savings-bond", "IUMWTFA", "month", {
        realMode: "rate", label: "One-year fixed savings bond rate", sentenceName: "The average one-year fixed savings bond rate", format: "pct2", kind: "rate",
        explain: "The average interest rate paid to households on one-year fixed-rate savings bonds, including unconditional bonuses.",
        why: "It shows what savers can earn. When it is below inflation, savings lose buying power even as they grow.",
      }),
      b("gilt-10y", "IUMAMNPY", "month", {
        realMode: "rate", label: "UK government 10-year borrowing rate", sentenceName: "The UK government's 10-year borrowing rate", headline: true, format: "pct2", kind: "rate",
        explain: "The yield on 10-year UK government bonds (gilts): what investors require each year for lending to the government for ten years. Monthly average.",
        why: "It is the cost of government borrowing and sets the tone for mortgage and business loan rates. A sharp rise can force a government to rethink its plans.",
      }),
      b("usd", "XUMAUSS", "month", {
        label: "The pound in US dollars", sentenceName: "The pound's value in US dollars", headline: true, format: "usd", kind: "level",
        explain: "How many US dollars one pound buys. Monthly average.",
        why: "A weaker pound makes imports, holidays abroad and fuel dearer, but helps exporters. A stronger pound does the reverse.",
      }),
      b("eur", "XUMAERS", "month", {
        label: "The pound in euros", sentenceName: "The pound's value in euros", format: "eur", kind: "level",
        explain: "How many euros one pound buys. Monthly average.",
        why: "The EU is the UK's largest trading partner, so the pound's value against the euro matters for prices and for firms that trade there.",
      }),
      b("sterling-index", "XUDLBK67", "mean", {
        label: "The pound against a basket of currencies", sentenceName: "The sterling exchange rate index", format: "index", kind: "level",
        explain: "An index of the pound's value against the currencies of the UK's main trading partners, weighted by trade, set to 100 in January 2005. Monthly average.",
        why: "A single currency pair can mislead. This shows whether the pound has gained or lost value overall.",
      }),
      b("mortgage-approvals", "LPMVTVX", "month", {
        label: "Mortgages approved to buy a home", sentenceName: "Mortgage approvals for house purchase", verb: "were", headline: true, format: "count", kind: "level",
        explain: "The number of new mortgages approved each month to people buying a home. An approval is not yet a completed purchase. Seasonally adjusted.",
        why: "It is an early sign of where the housing market is heading, because approvals come weeks before sales are registered.",
      }),
      b("remortgage-approvals", "LPMB4B3", "month", {
        label: "Mortgages approved to switch lender", sentenceName: "Remortgaging approvals", verb: "were", format: "count", kind: "level",
        explain: "The number of new mortgages approved each month to people who already own their home and are switching to a new deal. Seasonally adjusted.",
        why: "When fixed deals end into higher rates, many people remortgage at once, which is how rate rises reach household budgets.",
      }),
    ],
  },

  {
    key: "immigration",
    label: "Immigration",
    title: "Immigration and asylum",
    hint: "Net migration, small boats and asylum",
    subtitle: "How many people come to live in the UK and leave it, how many cross the Channel in small boats, how many claim asylum and how long they wait, and how many visas are granted.",
    story: "Immigration is one of the most debated subjects in politics, and the numbers behind it are often misquoted. These figures keep legal migration, asylum and small boat crossings apart, since they are different things with different causes.",
    accent: "#2C7DA0",
    series: [
      f("migration-net", "migration-net", ONS_MIGRATION_SOURCE, {
        yearEnding: true, label: "Net migration", sentenceName: "Net migration", verb: "was", headline: true, format: "count", kind: "level",
        explain: "The number of people moving to live in the UK for a year or more, minus the number leaving, over the year. A positive number means the population grows through migration.",
        why: "It is the figure most quoted in the immigration debate. The government has promised to reduce it, and it fell sharply from its 2023 peak.",
      }),
      f("migration-in", "migration-in", ONS_MIGRATION_SOURCE, {
        yearEnding: true, label: "People arriving to live in the UK", sentenceName: "Long-term immigration", verb: "was", headline: true, format: "count", kind: "level",
        explain: "The number of people arriving to live in the UK for a year or more, over the year, whatever their nationality, including British citizens returning.",
        why: "Net migration is the gap between arrivals and departures, so the two halves tell different stories. Arrivals show demand to come, mostly for work and study.",
      }),
      f("migration-out", "migration-out", ONS_MIGRATION_SOURCE, {
        yearEnding: true, label: "People leaving the UK", sentenceName: "Long-term emigration", verb: "was", format: "count", kind: "level",
        explain: "The number of people leaving the UK to live abroad for a year or more, over the year.",
        why: "Departures have risen as many who came on study and work visas leave when they end, which pulls net migration down.",
      }),
      f("migration-non-eu", "migration-non-eu", ONS_MIGRATION_SOURCE, {
        yearEnding: true, label: "Arrivals from outside Europe", sentenceName: "Immigration of non-EU+ nationals", verb: "was", format: "count", kind: "level",
        explain: "People arriving to live in the UK for a year or more who are not British, or from the EU, Norway, Iceland, Liechtenstein or Switzerland. Most come on work, study or family visas.",
        why: "Since Brexit most arrivals are from outside Europe, and this group responds to changes in visa rules.",
      }),
      f("small-boats-month", "boats-month", BOATS_SOURCE, {
        label: "Small boat arrivals each month", sentenceName: "The number of people who arrived in the UK in small boats", verb: "was", format: "count", kind: "level",
        explain: "The number of people detected crossing the English Channel in small boats and arriving in the UK in the month. Figures are provisional operational data.",
        why: "Crossings are highest in calm summer weather, so compare the same month in different years rather than neighbouring months.",
      }),
      d("small-boats-12m", { op: "sum", n: 12, from: "small-boats-month" }, {
        yearEnding: true, label: "Small boat arrivals over 12 months", sentenceName: "The number of people who arrived in the UK in small boats", verb: "was", headline: true, format: "count", kind: "level",
        explain: "The number of people who arrived by small boat over the last 12 months, which smooths out the weather.",
        why: "Small boat crossings are a small share of total migration but a large share of the political argument, and the government has promised to break the smuggling gangs behind them.",
      }),
      f("asylum-claims", "asylum-claims", HOME_OFFICE_SOURCE, {
        yearEnding: true, label: "People claiming asylum", sentenceName: "The number of people who claimed asylum in the UK", verb: "was", headline: true, format: "count", kind: "level",
        explain: "The number of people who made an asylum claim in the UK in the year, counting main applicants and their dependants, whether they arrived by small boat, plane or lorry.",
        why: "Asylum claims are different from migration for work or study: a person fleeing persecution can ask for protection regardless of how they arrived.",
      }),
      f("asylum-awaiting", "asylum-awaiting", HOME_OFFICE_SOURCE, {
        timeWord: "as at", label: "People awaiting an asylum decision", sentenceName: "The number of people awaiting an initial decision on their asylum claim", verb: "was", headline: true, format: "count", kind: "level",
        explain: "The number of people who have claimed asylum and are still waiting for the Home Office's first decision, counted on the last day of the period.",
        why: "A long backlog means people wait in limbo, often in taxpayer-funded accommodation. Clearing it is central to the government's plans.",
      }),
      f("asylum-hotels", "asylum-hotels", HOME_OFFICE_SOURCE, {
        timeWord: "as at", label: "Asylum seekers in hotels", sentenceName: "The number of asylum seekers accommodated in hotels", verb: "was", headline: true, format: "count", kind: "level",
        explain: "The number of people waiting for an asylum decision who were housed in hotels, counted on the last day of the period.",
        why: "Hotels are the most expensive and the most controversial way to house asylum seekers. The government promised to end their use.",
        targets: [{ value: 0, label: "Pledge: end hotel use" }],
      }),
      f("asylum-support", "asylum-support", HOME_OFFICE_SOURCE, {
        timeWord: "as at", label: "Asylum seekers receiving support", sentenceName: "The number of asylum seekers in receipt of Home Office support", verb: "was", format: "count", kind: "level",
        explain: "The number of people who have claimed asylum and receive accommodation or money from the Home Office because they would otherwise be destitute, counted on the last day of the period.",
        why: "People seeking asylum are not allowed to work in most cases, so those without savings depend on this support, which is a major part of the cost.",
      }),
      f("asylum-grant-rate", "asylum-grant-rate", HOME_OFFICE_SOURCE, {
        yearEnding: true, label: "Share of asylum claims granted", sentenceName: "The share of asylum claims granted protection or other leave at first decision", format: "pct", kind: "rate",
        explain: "Of the asylum decisions made in the year, the share granting protection or other permission to stay. Decisions made in the year are not the same people as claims made in the year.",
        why: "It varies a lot between nationalities and years, as conflicts change who is claiming. It is the figure used to argue that most claims are, or are not, genuine.",
      }),
      f("returns-enforced", "returns-enforced", HOME_OFFICE_SOURCE, {
        yearEnding: true, label: "Enforced returns", sentenceName: "Enforced returns from the UK", verb: "were", format: "count", kind: "level",
        explain: "The number of people the Home Office removed from the UK against their wishes, such as people who had no right to stay or foreign national offenders, over the year.",
        why: "Returns are the other side of the system. The government has promised to speed them up, and has added staff to do so.",
      }),
      f("returns-voluntary", "returns-voluntary", HOME_OFFICE_SOURCE, {
        yearEnding: true, label: "Voluntary returns", sentenceName: "Voluntary returns from the UK", verb: "were", format: "count", kind: "level",
        explain: "The number of people who left after being told they had no right to stay, and did so without being forced, often with help from the Home Office, over the year.",
        why: "Voluntary returns are cheaper than forced ones and now far outnumber them.",
      }),
      f("visas-work", "visas-work", HOME_OFFICE_SOURCE, {
        yearEnding: true, label: "Work visas granted", sentenceName: "Work visas granted", verb: "were", format: "count", kind: "level",
        explain: "The number of visas granted to people coming to work, including skilled workers, health and care workers and temporary workers, but not their dependants, over the year.",
        why: "Work visa rules are the most direct lever on legal migration, and they were tightened in 2024 after a record peak.",
      }),
      f("visas-study", "visas-study", HOME_OFFICE_SOURCE, {
        yearEnding: true, label: "Study visas granted", sentenceName: "Study visas granted", verb: "were", format: "count", kind: "level",
        explain: "The number of visas granted to people coming to study, mainly at universities, over the year.",
        why: "International students pay higher fees that help fund universities. Most leave when their course ends, and some stay on other visas.",
      }),
      f("visas-family", "visas-family", HOME_OFFICE_SOURCE, {
        yearEnding: true, label: "Family visas granted", sentenceName: "Family visas granted", verb: "were", format: "count", kind: "level",
        explain: "The number of visas granted to partners, children and other relatives of people already living in the UK, over the year.",
        why: "Family visas are shaped by income requirements, which have been raised.",
      }),
    ],
    inputs: [],
  },
  {
    // The Regions page draws its own interactive map. These are the extra figures it needs by region;
    // house prices and unemployment come from the Housing and Jobs pages' files.
    key: "regions",
    label: "Regions and nations",
    title: "Regions and nations",
    hint: "Maps of prices, jobs and more",
    subtitle: "How the 12 regions and nations of the UK compare, on an interactive map you can play through time.",
    story: "The UK is one of the most regionally unequal rich countries. Where you live shapes what your home costs, how likely you are to have a job, and what you earn.",
    accent: "#B5651D",
    custom: true,
    series: [],
    inputs: [
      ...[...REGION_ROWS, { key: "uk", name: "the UK", ashe: "United Kingdom" }].flatMap((r) => PAY_STATS.map(([prefix, stat, label, short, what]) => n(`${prefix}-${r.key}`, stat, r.ashe, {
        label: `${r.name}: ${label.toLowerCase()}`, place: r.name, sentenceName: `${label} in ${r.name}`, format: "gbp", kind: "level", nominal: true,
        explain: `${what} Gross pay over a year before tax, for employees living in ${r.name}, from a survey of employers each April.`, why: `Pay is the main way people share in the economy, and ${short} differs a lot between places.`,
      }))),
      ...REGION_ROWS.flatMap((r) => [
        s(`emp-${r.key}`, r.emp, "lms", EMPLOYMENT, { label: `${r.name}: employment rate`, place: r.name, sentenceName: `The employment rate in ${r.name}`, format: "pct", kind: "rate", explain: `The share of people aged 16 to 64 in ${r.name} who are in paid work.`, why: "A high employment rate means most working-age people have a job." }),
        r.inact
          ? s(`inact-${r.key}`, r.inact, "lms", `${NOT_IN_WORK}/economicinactivity`, { label: `${r.name}: economic inactivity rate`, place: r.name, sentenceName: `Economic inactivity in ${r.name}`, format: "pct", kind: "rate", explain: `The share of people aged 16 to 64 in ${r.name} who are neither working nor looking for work.`, why: "Inactivity includes students, carers and people who are long-term sick." })
          : null,
        r.activity
          ? s(`activity-${r.key}`, r.activity, "lms", EMPLOYMENT, { label: `${r.name}: economic activity rate`, place: r.name, sentenceName: `Economic activity in ${r.name}`, format: "pct", kind: "rate", explain: `The share of people aged 16 to 64 in ${r.name} who are working or looking for work.`, why: "Used to work out the inactivity rate." })
          : null,
        r.activity
          ? d(`inact-${r.key}`, { op: "complement", from: `activity-${r.key}` }, { label: `${r.name}: economic inactivity rate`, place: r.name, sentenceName: `Economic inactivity in ${r.name}`, format: "pct", kind: "rate", explain: `The share of people aged 16 to 64 in ${r.name} who are neither working nor looking for work, worked out as 100% minus the activity rate.`, why: "Inactivity includes students, carers and people who are long-term sick." })
          : null,
        h(`hpichg-${r.key}`, r.hpi, "percentageAnnualChange", { label: `${r.name}: house price change on a year earlier`, place: r.name, sentenceName: `Annual house price growth in ${r.name}`, format: "pct", kind: "rate", explain: `How much average house prices in ${r.name} have changed compared with a year earlier.`, why: "Rising prices help owners and make it harder for first-time buyers." }),
      ]).filter(Boolean),
    ],
  },
];

// --- "Compare places": one chart with several places side by side ---
//
// Each group lists the series to draw (`members`, ids from the page's own
// series, or from `extra`) and any extra series that only appear here, not as
// cards of their own. `place` is the short name shown on the chart.

const hpiPlace = (id, region, place, why) => h(id, region, "averagePrice", {
  label: `${place}: average house price`, place, sentenceName: `The average house price in ${place}`, format: "gbp", kind: "level", nominal: true,
  explain: `The average price paid for a home in ${place}.`, why,
});
const unemploymentPlace = (id, cdid, place) => s(id, cdid, "lms", `${NOT_IN_WORK}/unemployment`, {
  label: `${place}: unemployment rate`, place, sentenceName: `Unemployment in ${place}`, format: "pct", kind: "rate",
  explain: `The unemployment rate for people aged 16 and over in ${place}, seasonally adjusted.`,
  why: "Local job markets differ a lot, and regional gaps are at the heart of debates about levelling up.",
});

const PLACES = {
  housing: [
    {
      id: "house-prices-places",
      title: "House prices across the UK",
      blurb: "Pick up to six places to see how the average price paid for a home has moved in each. The bars show every place, highest first.",
      format: "gbp",
      members: ["hpi-uk", "hpi-england", "hpi-wales", "hpi-scotland", "hpi-ni", "hpi-london", "hpi-north-east", "hpi-north-west", "hpi-yorkshire", "hpi-east-midlands", "hpi-west-midlands", "hpi-east", "hpi-south-east", "hpi-south-west"],
      defaultOn: ["hpi-london", "hpi-north-east", "hpi-wales", "hpi-scotland"],
      showAs: "levels",
      names: { "hpi-uk": "UK", "hpi-north-east": "North East" },
      extra: [
        hpiPlace("hpi-north-west", "north-west", "North West", "The North West has some of the UK's biggest cities outside London, with prices well below the national average."),
        hpiPlace("hpi-yorkshire", "yorkshire-and-the-humber", "Yorkshire and the Humber", "Prices here sit below the UK average, so homes are more affordable than in the south."),
        hpiPlace("hpi-east-midlands", "east-midlands", "East Midlands", "Prices in the East Midlands sit close to the middle of the English regions."),
        hpiPlace("hpi-west-midlands", "west-midlands", "West Midlands", "Prices in the West Midlands sit close to the middle of the English regions."),
        hpiPlace("hpi-east", "east-of-england", "East of England", "The East of England has high prices, partly because many people commute from there to London."),
        hpiPlace("hpi-south-east", "south-east", "South East", "The South East is the most expensive region outside London, helped by commuters and high local wages."),
        hpiPlace("hpi-south-west", "south-west", "South West", "The South West has high prices relative to local wages, partly because of second homes and retirement moves."),
      ],
    },
  ],
  jobs: [
    {
      id: "unemployment-places",
      title: "Unemployment across the UK",
      blurb: "Pick up to six places to compare their unemployment rates over time. The bars show every place, highest first.",
      format: "pct",
      members: ["unemployment", "unemployment-north-east", "unemployment-north-west", "unemployment-yorkshire", "unemployment-east-midlands", "unemployment-west-midlands", "unemployment-east", "unemployment-london", "unemployment-south-east", "unemployment-south-west", "unemployment-wales", "unemployment-scotland", "unemployment-ni"],
      defaultOn: ["unemployment", "unemployment-north-east", "unemployment-london", "unemployment-scotland"],
      showAs: "levels",
      names: { unemployment: "UK" },
      extra: [
        unemploymentPlace("unemployment-north-east", "YCNC", "North East"),
        unemploymentPlace("unemployment-north-west", "YCND", "North West"),
        unemploymentPlace("unemployment-yorkshire", "YCNE", "Yorkshire and the Humber"),
        unemploymentPlace("unemployment-east-midlands", "YCNF", "East Midlands"),
        unemploymentPlace("unemployment-west-midlands", "YCNG", "West Midlands"),
        unemploymentPlace("unemployment-east", "YCNH", "East of England"),
        unemploymentPlace("unemployment-london", "YCNI", "London"),
        unemploymentPlace("unemployment-south-east", "YCNJ", "South East"),
        unemploymentPlace("unemployment-south-west", "YCNK", "South West"),
        unemploymentPlace("unemployment-wales", "YCNM", "Wales"),
        unemploymentPlace("unemployment-scotland", "YCNN", "Scotland"),
        unemploymentPlace("unemployment-ni", "ZSFB", "Northern Ireland"),
      ],
    },
  ],
  population: [
    {
      id: "population-nations",
      title: "The four nations compared",
      blurb: "England is far bigger than the other nations, so the chart starts with growth since the start of the period, with every place set to 100. Switch to actual numbers to see the sizes.",
      format: "people",
      members: ["uk", "england", "scotland", "wales", "ni"],
      defaultOn: ["england", "scotland", "wales", "ni"],
      showAs: "index",
      names: { uk: "UK" },
      extra: [],
    },
  ],
};
// --- More series, added to the pages above ---
//
// Written as tables of rows so each is one line to add: the series, then how to say it.

const sectorOf = (key) => SECTORS.find((x) => x.key === key);
const addSeries = (key, ...defs) => sectorOf(key).series.push(...defs);
const addInputs = (key, ...defs) => (sectorOf(key).inputs ??= []).push(...defs);

// Prices: the other main groups of the Consumer Prices Index, and two other measures of inflation.
// [id, cdid, name, what it covers, why it matters]
const CPI_GROUPS = [
  ["alcohol-tobacco", "D7G9", "Alcohol and tobacco", "beer, wine, spirits, cigarettes and tobacco", "Tax is a big part of the price, so changes in duty show up here as well as changes in the cost of making and selling them."],
  ["clothing", "D7GA", "Clothing and shoes", "clothes and footwear", "Clothing is mostly imported, so its prices follow the pound and global costs, and sales and discounting make it swing."],
  ["housing-fuels", "D7GB", "Housing, water and fuels", "rents, repairs, water and energy bills (not the cost of owning a home)", "It is the largest group for most households, and it includes the energy bills that drove the 2022 surge."],
  ["household-goods", "D7GC", "Furniture and household goods", "furniture, appliances, carpets and household repairs", "These are big, occasional purchases, so people notice when they rise even though they take a small share of spending."],
  ["health-prices", "D7GD", "Health", "medicines, dental care, glasses and medical equipment", "Most NHS care is free, so this covers only what people pay for directly."],
  ["communication", "D7GF", "Phones and communication", "mobile and landline contracts, broadband and post", "Many contracts rise by a set amount each year, so this can differ from the rest of the economy."],
  ["recreation", "D7GG", "Recreation and culture", "package holidays, books, games, TV, pets and gardening", "Holidays and leisure are the first things people cut back on when money is tight, so demand and prices shift quickly."],
  ["education-prices", "D7GH", "Education", "tuition fees and other education costs paid by households", "Fees for universities are set by the government, so this follows policy more than the market."],
  ["misc-prices", "D7GJ", "Insurance and other services", "insurance, financial services, personal care and social protection costs", "Insurance premiums, especially for cars and homes, can rise sharply and are hard to avoid."],
];
addSeries("prices",
  ...CPI_GROUPS.map(([id, cdid, name, covers, why]) => s(id, cdid, "mm23", PRICES, {
    realMode: "relative", label: name, sentenceName: `Inflation for ${name.toLowerCase()}`, format: "pct", kind: "rate",
    explain: `How much the prices of ${covers} have changed compared with a year earlier.`, why,
  })),
  s("rpi", "CZBH", "mm23", PRICES, {
    label: "Inflation (RPI)", sentenceName: "Inflation measured by the Retail Prices Index", format: "pct", kind: "rate",
    explain: "The older measure of inflation, the Retail Prices Index. It tends to run higher than CPI. It is no longer an official statistic, but it is still used for some things, such as index-linked government bonds and rail fares.",
    why: "Many contracts, pensions and bonds are tied to RPI, so the gap between RPI and CPI matters to savers, pensioners and the government.",
  }),
  d("ppi-output", { op: "yoy", from: "ppi-output-index" }, {
    label: "Prices at the factory gate", sentenceName: "Price inflation at the factory gate", format: "pct", kind: "rate",
    explain: "How much more factories in the UK are charging for what they make than a year ago, before it reaches the shops.",
    why: "It is an early warning for shop prices, because what factories charge today shows up on shelves in the months that follow.",
  }),
);
addInputs("prices", s("ppi-output-index", "GB7S", "ppi", PRICES, {
  label: "Factory gate price index", sentenceName: "Factory gate prices", format: "index", kind: "level",
  explain: "The price index for goods made in the UK and sold here, with 2015 as 100.", why: "A building block for factory gate inflation.",
}));

// Jobs: more of how people work, pay in each sector, strikes.
addSeries("jobs",
  s("part-time", "YCCU", "lms", EMPLOYMENT, {
    label: "People working part-time", sentenceName: "The number of people working part-time", verb: "was", format: "thousands", kind: "level",
    explain: "How many people in work do fewer hours than a full-time job, by their own description.",
    why: "Part-time work suits some people and traps others who want more hours, and it affects pay, pensions and how many hours the economy really supplies.",
  }),
  s("self-employed", "MGRQ", "lms", EMPLOYMENT, {
    label: "Self-employed people", sentenceName: "The number of self-employed people", verb: "was", format: "thousands", kind: "level",
    explain: "People who work for themselves rather than for an employer, including contractors and sole traders.",
    why: "Self-employed people have no sick pay, paid holiday or employer pension, so a rise can mean more flexibility or more insecurity.",
  }),
  s("temp-share", "YCCC", "lms", EMPLOYMENT, {
    label: "Employees on temporary contracts", sentenceName: "The share of employees on temporary contracts", format: "pct", kind: "rate",
    explain: "The share of employees whose job has an end date, such as fixed-term or agency work.",
    why: "A high share can mean employers are cautious about hiring, and workers have less security.",
  }),
  s("long-term-unemployed", "YBWH", "lms", `${NOT_IN_WORK}/unemployment`, {
    label: "People unemployed for over a year", sentenceName: "The number of people unemployed for over a year", verb: "was", format: "thousands", kind: "level",
    explain: "How many people have been out of work, looking for a job and available to start for more than 12 months.",
    why: "The longer someone is out of work, the harder it is to get back in, so this is the part of unemployment that does the most lasting harm.",
  }),
  s("youth-employment", "AIWI", "lms", EMPLOYMENT, {
    label: "Young people in work (not in full-time education)", sentenceName: "The employment rate of 16 to 24 year olds who are not in full-time education", format: "pct", kind: "rate",
    explain: "Of 16 to 24 year olds who are not students, the share who have a job.",
    why: "It shows whether young people who have left education are finding work, which sets their pay and prospects for years.",
  }),
  s("pay-public", "KAJ5", "lms", EARNINGS, {
    nominal: true, label: "Average weekly pay in the public sector", sentenceName: "Average weekly regular pay in the public sector", format: "gbp", kind: "level",
    explain: "Average weekly pay before tax for people working for government, the NHS, schools and other public bodies, leaving out bonuses and back pay.",
    why: "Public sector pay is set by government decisions on pay awards, and the gap with the private sector is a recurring cause of strikes.",
  }),
  s("pay-private", "KAJ2", "lms", EARNINGS, {
    nominal: true, label: "Average weekly pay in the private sector", sentenceName: "Average weekly regular pay in the private sector", format: "gbp", kind: "level",
    explain: "Average weekly pay before tax for people working for private firms, leaving out bonuses and back pay.",
    why: "Private pay follows what firms can afford and how hard it is to hire, so it moves faster than public pay in both directions.",
  }),
  d("strikes-12m", { op: "sum", n: 12, from: "strikes-month" }, {
    yearEnding: true, label: "Working days lost to strikes over 12 months", sentenceName: "Working days lost to strikes", verb: "were", format: "thousands", kind: "level",
    explain: "The number of working days that people lost to strikes over the last 12 months. A day lost is one person on strike for one day.",
    why: "Strikes rose sharply in 2022 and 2023, mostly in the public sector, over pay that had fallen behind prices.",
  }),
);
addInputs("jobs", s("strikes-month", "BBFW", "lms", EMPLOYMENT, {
  label: "Working days lost to strikes each month", sentenceName: "Working days lost to strikes", format: "thousands", kind: "level",
  explain: "Working days lost to strike action in the UK each month.", why: "A building block for the 12-month total.",
}));

// Economy: where spending and investment growth comes from.
addSeries("economy",
  d("government-spending-growth", { op: "yoy", from: "government-consumption" }, {
    label: "Government spending on services, change on a year earlier", sentenceName: "Annual growth in government spending on services", format: "pct", kind: "rate",
    explain: "How much more (or less) the government spent on running public services than in the same quarter a year before, after removing price rises.",
    why: "Government spending is about a fifth of the economy, so it can make up for weak spending elsewhere, or hold the economy back when it is cut.",
  }),
  d("investment-total-growth", { op: "yoy", from: "investment-total" }, {
    label: "All investment, change on a year earlier", sentenceName: "Annual growth in total investment", format: "pct", kind: "rate",
    explain: "How much more (or less) was invested in machinery, buildings, housing and infrastructure by businesses, households and the government than a year before, after removing price rises.",
    why: "Investment builds the future capacity of the economy. It swings more than anything else in a downturn.",
  }),
);
addInputs("economy",
  s("government-consumption", "NMRY", "ukea", GDP, { label: "Government spending on services", sentenceName: "Government spending on services", format: "gbpbn", kind: "level", explain: "General government final consumption expenditure, after removing price rises.", why: "A building block for its growth rate." }),
  s("investment-total", "NPQT", "cxnv", GDP, { label: "All investment", sentenceName: "Total investment", format: "gbpbn", kind: "level", explain: "Total gross fixed capital formation, after removing price rises.", why: "A building block for its growth rate." }),
);

// Trade: goods and services, and who we trade with.
const trade = (id, cdid, label, sentenceName, explain, why, rest = {}) => s(id, cdid, "ukea", TRADE, { nominal: true, label, sentenceName, verb: "were", format: "gbpbn", kind: "level", explain, why, ...rest });
addSeries("trade",
  trade("goods-exports", "BOKG", "Exports of goods", "UK exports of goods", "What the UK sold abroad in physical goods such as cars, machinery, medicines and fuel, in a quarter.", "Goods are what most people picture as trade, but the UK is better known for selling services."),
  trade("goods-imports", "BOKH", "Imports of goods", "UK imports of goods", "What the UK bought from abroad in physical goods such as food, cars, electronics and fuel, in a quarter.", "The UK imports far more goods than it sells, which is why the trade balance is negative."),
  trade("goods-balance", "BOKI", "Trade balance in goods", "The UK's trade balance in goods", "Goods exports minus goods imports. A negative number means the UK bought more goods than it sold.", "The goods gap is large and has been for decades.", { verb: "was" }),
  trade("services-exports", "IKBB", "Exports of services", "UK exports of services", "What the UK sold abroad in services such as finance, insurance, law, consulting, education and travel, in a quarter.", "The UK is one of the world's biggest services exporters, and it is where most of its trade strength lies."),
  trade("services-imports", "IKBC", "Imports of services", "UK imports of services", "What the UK bought from abroad in services such as travel, transport and online services, in a quarter.", "Holidays abroad and online services bought from overseas firms are a big part of it."),
  trade("services-balance", "IKBD", "Trade balance in services", "The UK's trade balance in services", "Services exports minus services imports. A positive number means the UK sold more services than it bought.", "The surplus in services offsets part of the gap in goods.", { verb: "was" }),
  d("eu-balance", { op: "minus", from: "eu-exports", of: "eu-imports" }, {
    nominal: true, label: "Trade balance in goods with the EU", sentenceName: "The UK's trade balance in goods with the EU", verb: "was", format: "gbpbn", kind: "level",
    explain: "Goods sold to EU countries minus goods bought from them. A negative number means the UK bought more than it sold.",
    why: "The EU is the UK's largest trading partner. Trade with it was reshaped by Brexit.",
  }),
  d("noneu-balance", { op: "minus", from: "noneu-exports", of: "noneu-imports" }, {
    nominal: true, label: "Trade balance in goods with the rest of the world", sentenceName: "The UK's trade balance in goods with countries outside the EU", verb: "was", format: "gbpbn", kind: "level",
    explain: "Goods sold to countries outside the EU minus goods bought from them.",
    why: "Trade deals aim to widen this part of trade, which includes the US, China and the Commonwealth.",
  }),
  d("eu-export-share", { op: "percentOf", from: "eu-exports", of: "goods-exports" }, {
    label: "Share of goods exports that go to the EU", sentenceName: "The share of UK goods exports that go to the EU", format: "pct", kind: "rate",
    explain: "Of everything the UK sells abroad in goods, the share that goes to EU countries.",
    why: "It shows how dependent the UK still is on the EU as a market, and how fast trade is shifting elsewhere.",
  }),
);
addInputs("trade",
  trade("eu-exports", "L87S", "Goods exports to the EU", "Goods exports to the EU", "Goods sold to EU countries in a quarter.", "A building block for the EU balance and share."),
  trade("eu-imports", "L87U", "Goods imports from the EU", "Goods imports from the EU", "Goods bought from EU countries in a quarter.", "A building block for the EU balance."),
  trade("noneu-exports", "L87M", "Goods exports to non-EU countries", "Goods exports to non-EU countries", "Goods sold to countries outside the EU in a quarter.", "A building block for the non-EU balance."),
  trade("noneu-imports", "L87O", "Goods imports from non-EU countries", "Goods imports from non-EU countries", "Goods bought from countries outside the EU in a quarter.", "A building block for the non-EU balance."),
);

// Housing: types of home, new build against existing, and how many homes are being sold.
addSeries("housing",
  h("hpi-semi", "united-kingdom", "averagePriceSemiDetached", {
    nominal: true, label: "Semi-detached houses", sentenceName: "The average price of a semi-detached house", format: "gbp", kind: "level",
    explain: "The average price paid for a semi-detached house in the UK.", why: "Semi-detached houses are the most common home in England, so their price is close to what a typical family home costs.",
  }),
  h("hpi-terraced", "united-kingdom", "averagePriceTerraced", {
    nominal: true, label: "Terraced houses", sentenceName: "The average price of a terraced house", format: "gbp", kind: "level",
    explain: "The average price paid for a terraced house in the UK.", why: "Terraced houses are the most common first home, so their price shows what first-time buyers face.",
  }),
  h("hpi-new-build", "united-kingdom", "averagePriceNewBuild", {
    nominal: true, label: "New-build homes", sentenceName: "The average price of a new-build home", format: "gbp", kind: "level",
    explain: "The average price paid for a home that has just been built, in the UK. These figures arrive about two months later than the others.", why: "New-build homes cost more than existing ones, and the gap shows whether building is adding the kind of homes people can afford.",
  }),
  h("hpi-existing", "united-kingdom", "averagePriceExistingProperty", {
    nominal: true, label: "Existing homes", sentenceName: "The average price of an existing home", format: "gbp", kind: "level",
    explain: "The average price paid for a home that has been lived in before, in the UK. These figures arrive about two months later than the others.", why: "Most sales are of existing homes, so this is the price most buyers face.",
  }),
  h("hpi-sales", "united-kingdom", "salesVolume", {
    label: "Homes sold each month", sentenceName: "The number of homes sold", verb: "was", format: "count", kind: "level",
    explain: "The number of home sales registered in the UK in the month. These figures arrive about two months later than the prices.", why: "Prices can look stable while few homes change hands. Sales show whether the market is active or frozen.",
  }),
);

// Crime: more of what the survey and the police count. [id, row, name, what it counts, why it matters]
const CSEW_ROWS = [
  ["csew-injury", /^Violence with injury$/i, "Violence with injury in the Crime Survey", "Violence with injury", "violent incidents where the victim was hurt, from bruises to serious wounds", "Violence that causes injury is the part of violence that does the most harm, and the survey shows how much of it is never reported."],
  ["csew-burglary", /^Domestic burglary$/i, "Burglary in the Crime Survey", "Domestic burglary", "break-ins and attempted break-ins at people's homes", "Burglary has fallen steeply since the 1990s, helped by better locks and alarms, and is one of the crimes people fear most."],
  ["csew-vehicle", /^Vehicle-related theft$/i, "Vehicle theft in the Crime Survey", "Vehicle-related theft", "theft of vehicles, theft from vehicles and attempts", "Vehicle theft fell sharply as cars became harder to steal, and it is rising again in some places as thieves use keyless-entry tricks."],
  ["csew-damage", /^CRIMINAL DAMAGE$/i, "Criminal damage in the Crime Survey", "Criminal damage", "damage to vehicles and property, including arson", "Vandalism is a common crime that is often not reported, so the survey is the best guide to the trend."],
  ["csew-person-theft", /^Theft from the person$/i, "Theft from the person in the Crime Survey", "Theft from the person", "snatches and pickpocketing of phones, wallets and bags", "Phone theft has become a major part of this, especially in big cities."],
];
const PRC_ROWS = [
  ["prc-injury", /^Violence with injury/i, "Violence with injury (police recorded)", "Violence with injury", "violent crimes recorded by police where the victim was injured", "Recorded violence with injury is rising partly because police record it more carefully than they used to."],
  ["prc-stalking", /^Stalking and harassment/i, "Stalking and harassment (police recorded)", "Stalking and harassment", "stalking and harassment offences recorded by the police", "These offences became separate crimes in recent years, and recorded cases have risen sharply as more people report them."],
  ["prc-rape", /^Rape$/i, "Rape (police recorded)", "Rape", "rapes recorded by the police, of adults and children", "Most rapes are never reported, so changes reflect the willingness to come forward and how the police record them, as well as how many happen."],
  ["prc-vehicle", /^Vehicle offences/i, "Vehicle offences (police recorded)", "Vehicle offences", "thefts of and from vehicles recorded by the police", "Vehicle crime is the largest part of recorded theft and is highly sensitive to new thieving methods."],
  ["prc-person-theft", /^Theft from the person/i, "Theft from the person (police recorded)", "Theft from the person", "snatches and pickpocketing recorded by the police", "Phone snatching in big cities is behind much of the rise."],
  ["prc-bicycle", /^Bicycle theft/i, "Bicycle theft (police recorded)", "Bicycle theft", "bikes reported stolen to the police", "Bike theft is rarely solved, so many people no longer report it."],
  ["prc-public-order", /^TOTAL PUBLIC ORDER OFFENCES/i, "Public order offences (police recorded)", "Public order offences", "threats, abuse and disorder recorded by the police, such as causing fear or alarm", "These are mostly decided by police activity and decisions to charge."],
  ["prc-weapons", /^TOTAL POSSESSION OF WEAPONS OFFENCES/i, "Possession of weapons (police recorded)", "Possession of weapons", "offences of having a weapon, including knives, firearms and others, recorded by the police", "This is found by police action, so it rises with stop and search as well as with carrying."],
];
const crimeSeries = (rows, base, noun) => rows.map(([id, re, label, , covers, why]) => t(id, base, re, {
  label, sentenceName: noun === "survey" ? label.replace(/ in the Crime Survey$/, "") + " as experienced by people in England and Wales" : `${label.replace(/ \(police recorded\)$/, "")} recorded by the police`, verb: "stood at", format: noun === "survey" ? "thousands" : "count", kind: "level",
  explain: `The number of ${covers}${noun === "survey" ? ", as reported to the Crime Survey for England and Wales (an estimate)" : ""}, over the year.`, why,
}));
addSeries("crime", ...crimeSeries(CSEW_ROWS, CSEW, "survey"), ...crimeSeries(PRC_ROWS, POLICE, "police"));

// Energy and environment: where emissions come from.
const GHG_SOURCES = [
  ["ghg-households", "K8B4", "Emissions from households", "Greenhouse gases produced by households", "heating homes with gas and running cars", "Heating and driving are the biggest single source, and the hardest to change because every household has to switch."],
  ["ghg-power", "FS9R", "Emissions from power stations and the gas network", "Greenhouse gases from electricity and gas supply", "electricity, gas, steam and air conditioning supply", "This is where most of the fall has come from, as coal was replaced by gas, wind and solar."],
  ["ghg-manufacturing", "K8AS", "Emissions from manufacturing", "Greenhouse gases from manufacturing", "factories and industrial processes, such as steel, chemicals and cement", "Industry has fewer ways to cut emissions than power does, and moving production abroad can simply shift the emissions elsewhere."],
  ["ghg-agriculture", "K8AQ", "Emissions from farming", "Greenhouse gases from agriculture, forestry and fishing", "methane from livestock, nitrous oxide from fertiliser, and farm fuel", "Farming emissions have barely changed, and are expected to become a larger share as other sectors fall."],
  ["ghg-transport", "FS9T", "Emissions from transport businesses", "Greenhouse gases from transport and storage businesses", "freight, buses, trains, shipping and aviation run by businesses, not private cars", "Cars driven by households are counted under households. Electric vehicles and cleaner fuels are the main route to cutting this."],
];
addSeries("environment", ...GHG_SOURCES.map(([id, cdid, label, name, covers, why]) => s(id, cdid, "bb", GDP, {
  yearEnding: false, label, sentenceName: name, verb: "were", format: "ktonnes", kind: "level",
  explain: `Greenhouse gases, in carbon dioxide equivalents, produced by ${covers}, measured on the UK residents and businesses basis.`, why,
})));

// A new page: business and industry. The index series are inputs, and each card is that industry's growth.
const INDUSTRIES = [
  ["manufacturing", "ECY6", "Manufacturing", "factories making cars, food, machinery, medicines and everything else", "Manufacturing is about a tenth of the economy but a big part of exports and of jobs in many towns.", true],
  ["construction", "ECY9", "Construction", "building homes, offices, roads and repairs", "Construction is an early sign of confidence and decides whether the homes and infrastructure the country needs get built.", true],
  ["retail-trade", "ECYD", "Shops and wholesale", "retail, wholesale and car sales and repairs", "It reflects what people are spending, and is where the shift to online shopping is felt.", false],
  ["hospitality", "ECYH", "Hotels, pubs and restaurants", "hotels, restaurants, pubs, cafes and catering", "Hospitality employs millions of people, often young and part-time, and is hit first when household budgets are squeezed.", false],
  ["finance", "ECYJ", "Finance and insurance", "banks, insurers, fund managers and related services", "Finance is a large part of UK tax receipts and exports, and is concentrated in London and a few other cities.", false],
  ["tech-comms", "ECYI", "Technology and communications", "software, telecoms, computing and media", "It has been one of the fastest-growing parts of the economy and is central to productivity.", false],
  ["health-social", "ECYS", "Health and social care", "hospitals, GPs, care homes and social work", "It is the largest employer in the country, and its output depends mainly on public spending.", false],
  ["transport-storage", "ECYG", "Transport and storage", "freight, haulage, warehousing, buses, trains, flights and shipping", "It moves goods and people, so it follows trade and shopping, and is sensitive to fuel costs.", false],
  ["agriculture", "ECY3", "Farming, forestry and fishing", "farming, forestry and fishing", "Output swings with the weather and harvests more than any other industry.", false],
];
SECTORS.push({
  key: "business",
  label: "Business and industry",
  title: "Business and industry",
  hint: "Output by industry, online shopping, factory prices",
  subtitle: "How each major part of the economy is doing: factories, building, shops, hotels and pubs, finance, technology and health, plus how much we buy online.",
  story: "The economy is not one thing. Some industries boom while others shrink, and which is which decides where the jobs and the tax revenue are. These figures show how each part is doing compared with a year ago.",
  accent: "#A66BBE",
  series: [
    ...INDUSTRIES.map(([id, , name, covers, why, headline]) => d(`${id}-growth`, { op: "yoy", from: `${id}-index` }, {
      headline, label: `${name}: output`, sentenceName: `Annual output growth in ${name.toLowerCase()}`, format: "pct", kind: "rate",
      explain: `How much more (or less) was produced in ${covers} than a year earlier, after removing price rises. Monthly, seasonally adjusted.`, why,
    })),
    s("online-share", "J4MC", "drsi", "/businessindustryandtrade/retailindustry", {
      headline: true, label: "Share of shopping done online", sentenceName: "The share of all retail sales made online", format: "pct", kind: "rate",
      explain: "Of everything spent in shops and online, the share spent through websites and apps. It excludes services such as travel.",
      why: "It spiked in the pandemic and has stayed high. It is a major reason high streets are changing and why many shops have closed.",
    }),
    s("online-sales", "JE2J", "drsi", "/businessindustryandtrade/retailindustry", {
      nominal: true, label: "Spending online each week", sentenceName: "Online retail sales", verb: "were", format: "gbpbn", kind: "level",
      explain: "What people spend on retail goods online, in an average week in the month shown.",
      why: "It shows how large online retail has become, and how fast it grows compared with the shops.",
    }),
  ],
  inputs: INDUSTRIES.map(([id, cdid, name]) => s(`${id}-index`, cdid, "mgdp", GDP, {
    label: `${name}: output index`, sentenceName: `Output in ${name.toLowerCase()}`, format: "index", kind: "level",
    explain: `An index of the volume of output in ${name.toLowerCase()}, with 2022 as 100. Monthly, seasonally adjusted.`, why: "A building block for the growth rate.",
  })),
});

// --- Extra pieces some pages have ---
//
// breakdowns: a total split into parts, shown as "out of every £1". Each part is a series id on the same page.
// mortgage: the series a page uses for its "what a mortgage costs" calculator.
const BREAKDOWNS = {
  tax: [
    {
      id: "where-money-comes-from",
      title: "Where each £1 of tax and income comes from",
      blurb: "Out of every £1 the government collects, this is how many pence come from each source. Each square is 1p.",
      total: "receipts-12m",
      parts: [
        { id: "paye-12m", label: "Income tax from pay" },
        { id: "nics-12m", label: "National Insurance" },
        { id: "vat-4q", label: "VAT" },
        { id: "sa-12m", label: "Self-assessed income tax" },
        { id: "corp-4q", label: "Corporation tax" },
        { id: "fuel-12m", label: "Fuel duty" },
      ],
      otherLabel: "Everything else, such as council tax, business rates, other taxes and income",
      verb: "collected",
    },
    {
      id: "where-money-goes",
      title: "Where each £1 of public spending goes",
      blurb: "Out of every £1 the government spends, this is how many pence go on benefits and pensions, and how many on interest. Each square is 1p.",
      total: "spending-12m",
      parts: [
        { id: "benefits-12m", label: "Benefits and pensions" },
        { id: "interest-12m", label: "Interest on the national debt" },
      ],
      otherLabel: "Everything else: the NHS, schools, defence, police, local services, transport and investment",
      verb: "spent",
    },
  ],
};
BREAKDOWNS.environment = [
  {
    id: "where-emissions-come-from",
    title: "Where the UK's greenhouse gases come from",
    blurb: "Out of every 100 units of greenhouse gas the UK produces, this is how many come from each source. Each square is 1%.",
    total: "ghg",
    parts: [
      { id: "ghg-households", label: "Households (heating and driving)" },
      { id: "ghg-power", label: "Power stations and the gas network" },
      { id: "ghg-manufacturing", label: "Manufacturing" },
      { id: "ghg-agriculture", label: "Farming" },
      { id: "ghg-transport", label: "Transport businesses" },
    ],
    otherLabel: "Everything else: construction, services, mining and the rest of the economy",
    format: "ktonnes",
    unit: "%",
    verb: "produced",
    annual: true,
  },
];
const MORTGAGE = { rates: "mortgage-2y" };
for (const sector of SECTORS) {
  sector.places = PLACES[sector.key] ?? [];
  sector.inputs = sector.inputs ?? [];
  sector.breakdowns = BREAKDOWNS[sector.key] ?? [];
  sector.mortgage = MORTGAGE[sector.key] ?? null;
}

// Every series a page needs the figures for: its cards, the raw figures that cards are worked out from, plus anything only the place charts use.
export const sectorSeries = (sector) => [...sector.series, ...sector.inputs, ...sector.places.flatMap((g) => g.extra)];

export const SECTOR_KEYS = SECTORS.map((x) => x.key);
export const sectorByKey = (key) => SECTORS.find((x) => x.key === key);

// Every series across all the pages, with the page it belongs to, for the
// compare-over-time page.
export const ALL_SERIES = SECTORS.flatMap((sector) => sector.series.map((def) => ({ ...def, sector: sector.key, sectorLabel: sector.label })));
export const seriesByRef = (sectorKey, id) => ALL_SERIES.find((x) => x.sector === sectorKey && x.id === id);

// The same series can appear on more than one page (for example home energy
// inflation), so the compare page refers to each by "<sector>.<id>".
export const refOf = (def) => `${def.sector}.${def.id}`;

// Weekly deaths come from the ONS dataset API rather than a time series.
export const WEEKLY_DEATHS = {
  dataset: "weekly-deaths-region",
  edition: "time-series",
  geographies: ["E92000001", "W92000004"], // England and Wales
  cause: "all-causes",
};

export const ONS_SERIES_PAGE = (def) => `https://www.ons.gov.uk${def.path}/timeseries/${def.cdid.toLowerCase()}/${def.dataset}`;
