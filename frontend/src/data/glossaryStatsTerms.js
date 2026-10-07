// The statistical and economic vocabulary used on the Britain in numbers pages
// (and in news about the economy), kept apart from the political terms so the
// Jargon buster can show it as its own group. Same shape as the other glossary
// files; plain everyday words are flagged auto:false so they are not underlined
// everywhere they happen to appear.

export const STATISTICS_TERMS = [
  // The economy
  { term: "GDP (Gross Domestic Product)", def: "The total value of everything produced in the UK over a period, the usual measure of the size of the economy. When people say the economy grew by 0.5% they mean GDP did.", aliases: ["gross domestic product"] },
  { term: "Economic Growth", def: "How much the economy's output (GDP) has increased compared with an earlier period. Negative growth means the economy shrank.", example: "Growth of 0.5% in a quarter means output was half a per cent higher than in the three months before.", auto: false },
  { term: "Recession", def: "Usually defined as two or more quarters in a row in which GDP falls. It tends to bring job losses and weaker tax receipts.", auto: false },
  { term: "Productivity", def: "How much is produced for each hour worked (or each worker). It is the main long-run source of higher pay and living standards.", auto: false },
  { term: "Per Head", def: "A figure divided by the number of people, so that a growing population doesn't make a total look better than it feels. Also called per capita.", aliases: ["per capita"], auto: false },
  { term: "Real Terms", def: "A figure with the effect of rising prices removed, so that amounts from different years can be compared fairly. 'Nominal' means the amount as it was at the time.", example: "£100 in 1990 is worth far more than £100 today, so comparing them directly without adjusting for inflation is misleading.", aliases: ["real-terms", "adjusted for inflation"] },
  { term: "Nominal Terms", def: "A figure as it was actually recorded at the time, without adjusting for inflation. Nominal amounts usually look bigger in later years because prices have risen.", aliases: ["current prices", "cash terms"] },
  { term: "Chained Volume Measures", def: "The ONS method for working out how much the economy really grew, by valuing output at the prices of an earlier year so that price rises are not mistaken for extra production.", aliases: ["chained volume"] },
  { term: "Seasonal Adjustment", def: "A statistical correction that removes regular yearly patterns, such as Christmas shopping or summer jobs, so that a figure can be compared month to month. 'Seasonally adjusted' figures are the ones normally quoted.", aliases: ["seasonally adjusted", "not seasonally adjusted"] },
  { term: "Index (Base Year)", def: "A series shown relative to a starting point set at 100. A reading of 120 means 20% above the starting point. It makes it easy to compare things measured in different units.", aliases: ["index number", "base year", "indexed"] },
  { term: "Percentage Point", def: "The difference between two percentages. If unemployment goes from 4% to 5%, it has risen by one percentage point, which is a 25% increase.", aliases: ["percentage points", "pts"], example: "A rate rising from 2% to 3% is up 1 percentage point, but it is a 50% rise." },
  { term: "Revision", def: "Official statistics are published as early estimates and then updated when more complete information arrives. Recent figures can be revised, sometimes by enough to change the story.", aliases: ["revised", "revisions"], auto: false },

  // Prices and money
  { term: "Inflation", def: "How fast prices are rising. At 3% inflation, what cost £100 a year ago now costs £103. It is why a pay rise can still feel like a pay cut.", auto: false },
  { term: "CPI (Consumer Prices Index)", def: "The main measure of UK inflation: how much a typical basket of goods and services costs compared with a year earlier. The Bank of England's target is 2%.", aliases: ["consumer prices index", "consumer price index"] },
  { term: "CPIH", def: "A version of CPI that also counts the cost of owning and running a home. It is the ONS's preferred measure of inflation, though the Bank of England's target uses CPI." },
  { term: "Core Inflation", def: "Inflation with the most volatile items, energy, food, alcohol and tobacco, taken out, to show the underlying trend. The Bank of England watches it when deciding interest rates.", aliases: ["underlying inflation"] },
  { term: "Basket of Goods", def: "The list of around 700 everyday items whose prices the ONS tracks to measure inflation, weighted by how much households spend on each.", aliases: ["basket of goods and services", "price basket"] },
  { term: "Deflation", def: "A fall in the general level of prices. It sounds good but can be harmful, because people delay spending and debts become harder to repay. It is different from disinflation, where prices rise more slowly.", auto: false },
  { term: "Bank Rate", def: "The interest rate set by the Bank of England's Monetary Policy Committee. It sets the cost of borrowing across the economy and is the main tool for keeping inflation near target.", aliases: ["base rate", "interest rate", "interest rates"] },
  { term: "Monetary Policy Committee (MPC)", def: "The nine-person group at the Bank of England that votes on interest rates around eight times a year, aiming to keep inflation at 2%." },
  { term: "Average Weekly Earnings", def: "The ONS's main measure of pay: total pay before tax, per employee per week, from a monthly survey of employers. It is an average, so very high earners pull it up.", aliases: ["average earnings", "pay growth"] },
  { term: "National Living Wage", def: "The legal minimum hourly pay for workers aged 21 and over, set by the government each year on the advice of the Low Pay Commission. Younger workers have lower minimum rates." },

  // Jobs
  { term: "Unemployment Rate", def: "The share of people who are out of work, have looked for a job in the last four weeks and could start soon, as a share of everyone working or looking. It is not the same as the number claiming benefits." },
  { term: "Employment Rate", def: "The share of people aged 16 to 64 who are in paid work, including self-employed people.", auto: false },
  { term: "Economic Inactivity", def: "Being neither in work nor looking for it, for example because of study, caring, early retirement or long-term illness. Inactive people are not counted as unemployed.", aliases: ["economically inactive", "inactivity rate"] },
  { term: "Labour Force Survey (LFS)", def: "The ONS's main household survey of work, asking tens of thousands of people about their jobs each quarter. Unemployment, employment and inactivity figures come from it. Falling response rates have made it less reliable recently.", aliases: ["labour force survey"] },
  { term: "Claimant Count", def: "The number of people claiming unemployment-related benefits (mainly Universal Credit). A different measure from the survey-based unemployment rate, and usually a little different in size." },
  { term: "Vacancy", def: "A job that an employer is actively trying to fill. The ONS counts them with a monthly survey of businesses.", aliases: ["vacancies", "job vacancies"], auto: false },

  // Public finances
  { term: "Public Sector Net Borrowing", def: "How much more the public sector spent than it received in taxes and other income over a period. Borrowing adds to the national debt. It is often just called 'the deficit'.", aliases: ["government borrowing", "borrowing"], auto: false },
  { term: "Deficit", def: "The gap when spending is higher than income. The 'budget deficit' is the gap over a year; the 'current budget deficit' leaves out spending on investment.", aliases: ["budget deficit"], auto: false },
  { term: "Surplus", def: "When a government collects more than it spends in a period, leaving money to pay down debt. The UK has rarely run one in recent decades.", auto: false },
  { term: "National Debt", def: "The total the public sector owes, built up from years of borrowing. It is usually measured after taking off the cash and similar assets the government holds. Not the same as the deficit, which is the gap in one year.", aliases: ["public sector net debt", "government debt"] },
  { term: "Debt-to-GDP Ratio", def: "National debt as a share of one year's economic output. It shows how heavy the debt is relative to the economy's size, which is why governments often aim to keep it steady or falling.", aliases: ["debt to gdp", "debt-to-gdp", "debt as a share of gdp"] },
  { term: "Gilts", def: "Bonds issued by the UK government to borrow money from investors, promising to repay with interest. Most of the national debt is in gilts.", aliases: ["gilt", "government bonds"] },
  { term: "Debt Interest", def: "What the government pays each year to those it owes money to. Rising interest rates push it up, leaving less to spend on other things.", aliases: ["interest on debt", "debt interest payments"], auto: false },
  { term: "Public Sector Net Investment", def: "Government spending on things that last, such as roads, railways and hospitals, minus the wear and tear on what already exists." },
  { term: "Full-Time Equivalent (FTE)", def: "A way of counting staff in which two half-time workers count as one full-time worker, so totals reflect the work done rather than the number of people.", aliases: ["full-time equivalents", "FTEs"] },

  // Population
  { term: "Mid-Year Population Estimate", def: "The ONS's official estimate of how many people live in each part of the UK on 30 June each year, built from the Census with births, deaths and migration added.", aliases: ["population estimate", "population estimates", "mid-year estimate"] },
  { term: "Net Migration", def: "The number of people moving to live in the UK minus the number moving away, over a year. A positive number means the population is growing from migration.", aliases: ["net international migration"] },
  { term: "Census", def: "A survey of every household, held every ten years, that gives the most complete picture of who lives where. The latest in England and Wales was in 2021.", auto: false },
  { term: "Fertility Rate", def: "The average number of children a woman would have in her lifetime at current birth rates. About 2.1 is needed for a population to stay stable without migration.", aliases: ["total fertility rate", "birth rate"] },

  // Trade
  { term: "Trade Balance", def: "Exports minus imports. A negative balance (a trade deficit) means the UK bought more from abroad than it sold. The UK usually runs a deficit in goods and a surplus in services.", aliases: ["trade deficit", "trade surplus"] },
  { term: "Current Account", def: "The widest measure of money flowing in and out of the country: trade, investment income and transfers. A deficit has to be financed by foreign investment or borrowing." },

  // Housing
  { term: "UK House Price Index (UK HPI)", def: "The official measure of house prices, produced from HM Land Registry sales records by the ONS and others. It adjusts for the mix of homes sold so it tracks price changes, not the types of home sold.", aliases: ["house price index", "HPI"] },
  { term: "Average Price (Mean and Median)", def: "The mean adds up all values and divides by how many there are, so a few very large values pull it up. The median is the middle value when sorted, so it is less affected by extremes. House prices and pay are often shown as means.", aliases: ["average"], auto: false },
  { term: "Private Rents Index", def: "The ONS's measure of how rents paid by private tenants change over time, set to 100 in 2015, for comparable homes." },

  // Crime
  { term: "Crime Survey for England and Wales (CSEW)", def: "A large annual survey asking people about crimes they have experienced, whether or not they reported them. It is considered the most reliable guide to long-run trends, but it only covers households and adults, and it is an estimate.", aliases: ["crime survey", "CSEW"] },
  { term: "Police Recorded Crime", def: "Crimes that were reported to, or found by, the police and logged. It depends on how willing people are to report crime and how carefully forces record it, so a rise does not always mean more crime.", aliases: ["recorded crime", "police recorded"] },
  { term: "Homicide", def: "Murder, manslaughter and infanticide: unlawful killings. The most reliably counted crime, because deaths rarely go unnoticed.", auto: false },
  { term: "Margin of Error", def: "How far a survey estimate might be from the true figure because only a sample was asked. Small changes between surveys can fall inside the margin of error and mean nothing.", aliases: ["confidence interval", "confidence intervals", "sampling error"] },

  // Environment and general statistics
  { term: "Greenhouse Gases", def: "Gases such as carbon dioxide and methane that trap heat in the atmosphere and cause global warming. UK figures count them together in 'carbon dioxide equivalents'.", aliases: ["greenhouse gas", "greenhouse gas emissions", "GHG"] },
  { term: "Carbon Dioxide Equivalent (CO2e)", def: "A way of adding different greenhouse gases together by converting each into the amount of carbon dioxide that would warm the planet by the same amount.", aliases: ["CO2e", "carbon dioxide equivalents"] },
  { term: "Net Zero", def: "Balancing the greenhouse gases the UK emits with the amount taken out of the atmosphere, so the net total is zero. The UK has a legal target of reaching it by 2050." },
  { term: "Tonnes of Oil Equivalent (toe)", def: "A unit for measuring energy from any source, such as gas, coal or wind, on the same scale. One tonne of oil equivalent is the energy in about a tonne of crude oil.", aliases: ["Mtoe", "million tonnes of oil equivalent"] },
  { term: "Official Statistics", def: "Figures produced by government bodies such as the ONS to a code of practice that requires them to be accurate, impartial and published to a timetable. 'National Statistics' is the highest standard of these.", aliases: ["national statistics", "ONS"] },
  { term: "Percentile", def: "A way of showing where a value sits in a range. Higher than 80% of readings means it is in the top fifth, and only 20% of past readings were higher.", aliases: ["percentiles"], auto: false },
];
