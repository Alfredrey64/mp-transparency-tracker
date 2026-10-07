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
const d = (id, derive, rest) => ({ id, derive, ...rest });
// A UK House Price Index series (HM Land Registry, with the ONS and the other statistical bodies).
const h = (id, region, field, rest) => ({ id, hpi: { region, field }, source: HPI_SOURCE, ...rest });
// A line from a table in an ONS crime spreadsheet. `match` finds the row by its label.
const t = (id, table, match, rest) => ({ id, table: { ...table, match }, source: table.source, yearEnding: true, verb: "were", ...rest });

const HPI_SOURCE = { name: "UK House Price Index (HM Land Registry, ONS and others)", url: "https://www.gov.uk/government/collections/uk-house-price-index-reports" };
const CRIME_URL = "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/datasets/crimeinenglandandwalesappendixtables";
const CSEW = { sheet: "Table A1a", labelCol: 0, source: { name: "Crime Survey for England and Wales (ONS), appendix table A1a", url: CRIME_URL } };
const POLICE = { sheet: "Table A5a", labelCol: 1, source: { name: "Police recorded crime (Home Office, published by the ONS), appendix table A5a", url: CRIME_URL } };

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
        label: "Prices of services", sentenceName: "Services inflation", format: "pct", kind: "rate",
        explain: "The change in prices of things like haircuts, restaurant meals, insurance and fares.",
        why: "Service prices are driven mostly by wages, so persistent services inflation is a sign that pay growth is feeding into prices.",
      }),
      s("goods-inflation", "D7NM", "mm23", PRICES, {
        label: "Prices of goods", sentenceName: "Goods inflation", format: "pct", kind: "rate",
        explain: "The change in prices of physical things such as food, clothes, furniture and fuel.",
        why: "Goods prices swing with world commodity prices and exchange rates, so they often cause sudden jumps and falls in headline inflation.",
      }),
      s("food", "D7G8", "mm23", PRICES, {
        label: "Food and non-alcoholic drinks", sentenceName: "Food and drink inflation", headline: true, format: "pct", kind: "rate",
        explain: "How much the price of food and soft drinks has changed over the past year.",
        why: "Food takes a bigger share of the budget of lower-income households, so food price rises hit them hardest.",
      }),
      s("energy", "D7GT", "mm23", PRICES, {
        label: "Electricity, gas and other fuels", sentenceName: "Home energy inflation", headline: true, format: "pct", kind: "rate",
        explain: "The change in what households pay for electricity, gas and heating fuel.",
        why: "Energy bills were the main driver of the 2022 inflation spike and are heavily shaped by government policy and world markets.",
      }),
      s("rents", "D7GQ", "mm23", PRICES, {
        label: "Rents", sentenceName: "Rent inflation", format: "pct", kind: "rate",
        explain: "The change in what private tenants pay to rent a home, compared with a year earlier.",
        why: "About one in five households rents privately, so rents are a major part of the cost of living for younger people.",
      }),
      s("transport", "D7GE", "mm23", PRICES, {
        label: "Transport", sentenceName: "Transport inflation", format: "pct", kind: "rate",
        explain: "Fuel, fares and the cost of buying and running a vehicle.",
        why: "Fuel duty, rail fares and car costs are all affected by government decisions as well as world prices.",
      }),
      s("eating-out", "D7GI", "mm23", PRICES, {
        label: "Restaurants and hotels", sentenceName: "Restaurant and hotel inflation", format: "pct", kind: "rate",
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
    hint: "NHS staff, sickness and deaths",
    subtitle: "A few official measures of the nation's health: how many people work for the NHS, how many are kept out of work by long-term illness, and how many deaths are registered each week.",
    story: "The NHS is the largest public service, and ill health is one of the biggest reasons people are out of work. These measures show the strain on both.",
    accent: "#D9453B",
    weeklyDeaths: true,
    series: [
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
        label: "Rents, change on a year earlier", sentenceName: "Rent inflation", headline: true, format: "pct", kind: "rate",
        explain: "How much more private tenants pay to rent a home than a year earlier.",
        why: "Rent rises hit younger and lower-income households hardest, and feed into debates about rent controls and housebuilding.",
      }),
      s("rents-index", "KYHJ", "mm23", PRICES, {
        label: "Private rents index", sentenceName: "The private rents index", headline: true, format: "index", kind: "level", verb: "stood at",
        explain: "Rents measured against a starting point of 100 in 2015. A reading of 141 means rents are about 41% higher than in 2015.",
        why: "It shows the cumulative rise in rents over years, which single-year percentages hide.",
      }),
      s("home-energy", "D7GT", "mm23", PRICES, {
        label: "Electricity, gas and other fuels", sentenceName: "Home energy inflation", format: "pct", kind: "rate",
        explain: "The change in what households pay for electricity, gas and heating fuel.",
        why: "Heating a home is a large and unavoidable cost, and a major reason for fuel poverty debates.",
      }),
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
for (const sector of SECTORS) sector.places = PLACES[sector.key] ?? [];

// Every series a page needs the figures for: its cards, plus anything only the place charts use.
export const sectorSeries = (sector) => [...sector.series, ...sector.places.flatMap((g) => g.extra)];

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
