// The taxes on the Tax rates through time page: what each one is, which rates we follow, and where the figures come from.
//
// The figures themselves are in taxSeries.json, one entry per rate, as [date, value, options] steps (a rate holds until the next step). Rates were
// taken from HMRC's published historic tables wherever there is one (income tax and allowances from 1990, surtax, National Insurance, corporation
// tax, inheritance tax, alcohol, tobacco, fuel, insurance premium tax, air passenger duty, landfill, climate change levy, aggregates levy, capital
// gains tax from 2008, stamp duty and the council tax tables from MHCLG). The rest come from Hansard, the Budget documents on gov.uk and other
// sources named under each tax. Where we could not find a reliable record we left the tax or the years out and say so.
//
// Panels group lines that share a unit so they can sit on one chart. `kind: "allowance"` marks a line where a higher figure means less tax
// (an allowance or a threshold), so a rise counts as a tax cut. `intro: true` marks a line whose first step is the tax or band being brought in;
// `introEffect` ("more", "less" or "none") says what that did to the tax people pay, where the default (more tax) would be wrong.

export const GROUPS = [
  { key: "pay", label: "Earnings and savings", blurb: "Income tax, National Insurance and tax on dividends", accent: "#2F80ED" },
  { key: "shop", label: "Shopping and bills", blurb: "VAT and insurance", accent: "#E0367A" },
  { key: "sin", label: "Drink, tobacco, gambling and vaping", blurb: "Taxes that aim to change behaviour as well as raise money", accent: "#7A5AF0" },
  { key: "travel", label: "Driving, flying and the environment", blurb: "Fuel, flights and taxes on pollution", accent: "#0E9AA7" },
  { key: "business", label: "Business", blurb: "Profits, premises and windfalls", accent: "#D9A62A" },
  { key: "property", label: "Property and wealth", blurb: "Buying homes, selling assets and leaving money behind", accent: "#1FA97C" },
];

const HMRC = "https://www.gov.uk/government/statistics";

export const TAXES = [
  // ---------- earnings and savings ----------
  {
    id: "income-tax", group: "pay", name: "Income tax", headline: "incomeTax.basic",
    summary: "The tax on pay, pensions and most other income.",
    about: "Income tax is charged on wages, pensions, the profits of the self-employed and most other income. These are the rates and bands for England, Wales and Northern Ireland. Scotland has set its own rates and bands since 2017, and Wales can vary the rates too.",
    panels: [
      { title: "Rates", unit: "pct", lines: [
        { key: "incomeTax.basic", label: "Basic rate" },
        { key: "incomeTax.top", label: "Top rate" },
        { key: "incomeTax.starting", intro: true, introEffect: "less", label: "Starting or lower rate" },
      ] },
      { title: "Where the tax starts, in pounds a year", real: true, unit: "gbp0", lines: [
        { key: "incomeTax.allowance", label: "Tax-free personal allowance", kind: "allowance" },
        { key: "incomeTax.higherStarts", label: "Higher rate starts at", kind: "allowance" },
        { key: "incomeTax.topStarts", intro: true, introEffect: "more", label: "Top rate starts at", kind: "allowance" },
      ] },
    ],
    notes: [
      "Before 1973 the basic rate was called the standard rate. The top rate before 1973 is the standard rate plus the highest band of surtax, a separate tax on high incomes that was folded into income tax in 1973. HMRC's table shows a surtax scale about a tenth higher for 1965 to 66 and 1972 to 73, and we show the main scale.",
      "From 1973 to 1984 an investment income surcharge of up to 15 points sat on top, so the top rate on investment income was 90% in 1973 and 98% from 1974. It was abolished in 1985.",
      "The 1979 changes were made in the June Budget and counted for the whole 1979 to 80 tax year.",
      "The higher rate start is the pay level at which the higher rate begins: the personal allowance plus the basic rate band. Since 2010 the personal allowance is withdrawn by £1 for every £2 of income above £100,000.",
      "Thresholds have been frozen since April 2021, and the freeze is set to run until April 2031.",
      "In September 2022 the government announced a cut in the basic rate to 19% and the end of the 45% rate. Both were cancelled within weeks, so neither appears here.",
      "Coming up: from April 2027 the tax on savings income and on property income goes up by two points, to 22%, 42% and 47%. Both were set at the Autumn Budget 2025.",
    ],
    sources: [
      ["HMRC: Rates of Income Tax, 1990 to 91 onwards", `${HMRC}/rates-of-income-statistics`],
      ["HMRC: Income Tax personal allowances and reliefs", `${HMRC}/income-tax-personal-allowances-and-reliefs`],
      ["HMRC: Rates of Surtax, 1948 to 49 to 1972 to 73", `${HMRC}/rates-of-surtax-1948-to-1973`],
      ["Hansard, written answer on income tax, 18 November 1977 (standard and basic rate, 1945 to 1978)", "https://api.parliament.uk/historic-hansard/written-answers/1977/nov/18/income-tax"],
      ["Finance Act 1972, section on the basic rate for 1973 to 74", "https://www.legislation.gov.uk/ukpga/1972/41/part/IV/enacted"],
      ["Wikipedia: Income tax in the United Kingdom, for the top rate from 1973 to 1988 and the basic rate from 1978 to 1990", "https://en.wikipedia.org/wiki/Income_tax_in_the_United_Kingdom"],
    ],
  },
  {
    id: "scottish-income-tax", group: "pay", name: "Income tax in Scotland", headline: "scotIncomeTax.higher", setBy: "scottish",
    summary: "Scotland sets its own income tax rates and bands on pay.",
    about: "Since April 2017 the Scottish Parliament has set the rates and bands of income tax on most pay and pensions in Scotland. The personal allowance, and tax on savings and dividends, are still set by the UK government. These changes are decided by the Scottish Government in its own Budget, so they are not credited to a UK government or Chancellor.",
    panels: [
      { title: "Rates", unit: "pct", lines: [
        { key: "scotIncomeTax.starter", intro: true, introEffect: "less", label: "Starter rate" },
        { key: "scotIncomeTax.basic", label: "Basic rate" },
        { key: "scotIncomeTax.intermediate", intro: true, introEffect: "more", label: "Intermediate rate" },
        { key: "scotIncomeTax.higher", label: "Higher rate" },
        { key: "scotIncomeTax.advanced", intro: true, introEffect: "more", label: "Advanced rate" },
        { key: "scotIncomeTax.top", label: "Top rate" },
      ] },
    ],
    notes: [
      "In 2017 to 18 the only difference from the rest of the UK was where the higher rate began. In April 2018 Scotland brought in a 19% starter band and a 21% intermediate band, and raised the higher and top rates by a point.",
      "The higher and top rates rose by a point in April 2023. In April 2024 a new 45% advanced band began on income from £75,000 to £125,140, and the top rate rose to 48%.",
      "The bands for 2026 to 27, on income above the personal allowance of £12,570, are: starter 19% up to £16,537, basic 20% to £29,526, intermediate 21% to £43,662, higher 42% to £75,000, advanced 45% to £125,140 and top 48% above that.",
      "The rates for England, Wales and Northern Ireland are under Income tax. Wales has the power to vary its rates but has so far kept them the same as England's.",
    ],
    sources: [
      ["GOV.UK: Income Tax in Scotland", "https://www.gov.uk/scottish-income-tax"],
      ["Scottish Government: Scottish Income Tax, rates and bands", "https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/"],
      ["Wikipedia: Income tax in Scotland", "https://en.wikipedia.org/wiki/Income_tax_in_Scotland"],
    ],
  },
  {
    id: "dividends", group: "pay", name: "Tax on dividends", headline: "dividends.basic",
    summary: "The tax on payouts from company shares held outside an ISA or pension.",
    about: "Dividends are payments a company makes to its shareholders. They are taxed at their own rates, which are lower than the rates on pay. Since April 2016 the first slice of dividends each year is tax free, under the dividend allowance. Before 2016 dividends came with a notional tax credit, so the rates are not comparable and the chart starts there.",
    panels: [
      { title: "Rates", unit: "pct", lines: [
        { key: "dividends.basic", intro: true, introEffect: "none", label: "Basic rate taxpayers" },
        { key: "dividends.higher", intro: true, introEffect: "none", label: "Higher rate taxpayers" },
        { key: "dividends.additional", intro: true, introEffect: "none", label: "Top rate taxpayers" },
      ] },
      { title: "Tax-free allowance, in pounds a year", real: true, unit: "gbp0", lines: [{ key: "dividends.allowance", intro: true, introEffect: "none", label: "Dividend allowance", kind: "allowance" }] },
    ],
    notes: ["From April 2026 the basic and higher dividend rates rose by two points, to 10.75% and 35.75%. The top rate stayed at 39.35%."],
    sources: [
      ["HMRC: Rates of Income Tax and personal allowances (the footnotes give the dividend rates and allowance)", `${HMRC}/income-tax-personal-allowances-and-reliefs`],
      ["Autumn Budget 2025 summaries (Rathbones, CMS) for the April 2026 change", "https://www.rathbones.com/en-gb/wealth-management/knowledge-and-insight/every-tax-measure-of-autumn-budget-2025-explained"],
    ],
  },
  {
    id: "national-insurance", group: "pay", name: "National Insurance", headline: "ni.employee",
    summary: "A tax on pay that workers and employers both pay.",
    about: "National Insurance is paid on earnings by employees, employers and the self-employed. It is counted as a contribution towards the State Pension and some benefits, but in practice it works like a tax on jobs. The rates shown are the main rate for each group.",
    panels: [
      { title: "Rates", unit: "pct", lines: [
        { key: "ni.employee", label: "Employees, main rate" },
        { key: "ni.employeeAbove", intro: true, label: "Employees, on pay above the upper limit" },
        { key: "ni.employer", label: "Employers" },
        { key: "ni.selfEmployed", label: "Self-employed (Class 4)" },
      ] },
      { title: "Pay level at which employers start paying, in pounds a year", real: true, unit: "gbp0", lines: [{ key: "ni.employerThreshold", label: "Employer threshold", kind: "allowance" }] },
    ],
    notes: [
      "Before 1999 employers paid different rates on different slices of pay, and from 1985 to 1989 employees did too. We show the rate on the highest slice for employers and the rate most employees paid.",
      "An extra National Insurance surcharge on employers ran from 1977 to 1984 and is not shown.",
      "In April 2022 both rates went up by 1.25 points to fund the Health and Social Care Levy. The increase was reversed in November 2022.",
      "The employee rate was cut from 12% to 10% in January 2024 and to 8% in April 2024. Class 4 for the self-employed fell to 6% in April 2024.",
      "In April 2025 the employer rate rose to 15% and the pay level at which employers start paying fell from £9,100 to £5,000 a year.",
    ],
    sources: [
      ["HMRC: National Insurance contributions, main features, 1999 to 2000 onwards", `${HMRC}/main-features-of-national-insurance-contributions`],
      ["HMRC: Main features of National Insurance contributions, 1985 to 1999", `${HMRC}/main-features-of-national-insurance-contributions-1985-to-1999`],
      ["HMRC: Main features of National Insurance contributions, 1975 to 1985", `${HMRC}/main-features-of-national-insurance-contributions-1975-to-1985`],
    ],
  },

  // ---------- shopping and bills ----------
  {
    id: "vat", group: "shop", name: "VAT", headline: "vat.standard",
    summary: "The tax added to most things people buy.",
    about: "Value Added Tax started on 1 April 1973 and replaced Purchase Tax, which had rates of 13%, 22%, 36% and 55% at the start of 1973. Most food, children's clothes and books have been zero-rated since VAT began. Some things, such as home energy, have a reduced rate.",
    panels: [
      { title: "Rates", unit: "pct", lines: [
        { key: "vat.standard", intro: true, label: "Standard rate" },
        { key: "vat.higher", intro: true, label: "Higher rate (1974 to 1979)" },
        { key: "vat.gas", intro: true, label: "Home gas and heating" },
        { key: "vat.electricity", intro: true, label: "Home electricity" },
        { key: "vat.hospitality", intro: true, introEffect: "less", label: "Hospitality and holidays" },
      ] },
    ],
    notes: [
      "The 15% rate in December 2008 was a temporary cut during the financial crisis, and the 17.5% rate came back in January 2010.",
      "VAT on home fuel started at 8% in April 1994 and was cut to 5% in September 1997. A plan to raise it to 17.5% in 1995 was dropped after the government lost a vote in the Commons in December 1994.",
      "From 1 October 2026 VAT on household electricity in Great Britain is 0%. The measure is set to run to 31 March 2027. Gas stays at 5%.",
      "Hospitality and holiday accommodation had a temporary cut to 5% from July 2020, then 12.5% from October 2021, before the standard rate returned in April 2022.",
      "Private school fees became subject to VAT on 1 January 2025.",
    ],
    sources: [
      ["Wikipedia: Value-added tax in the United Kingdom", "https://en.wikipedia.org/wiki/Value-added_tax_in_the_United_Kingdom"],
      ["GOV.UK: VAT rates on different goods and services", "https://www.gov.uk/guidance/vat-rates-on-different-goods-and-services"],
      ["ICAEW: VAT cut on domestic electricity bills confirmed, September 2026", "https://www.icaew.com/insights/tax-news/2026/sep-2026/vat-cut-on-domestic-electricity-bills-confirmed"],
    ],
  },
  {
    id: "ipt", group: "shop", name: "Insurance premium tax", headline: "ipt.standard",
    summary: "A tax on most general insurance, such as home, car and pet cover.",
    about: "Insurance premium tax is added to the cost of most general insurance in the UK. A higher rate applies to travel insurance and some others.",
    panels: [{ title: "Rates", unit: "pct", lines: [
      { key: "ipt.standard", intro: true, label: "Standard rate" },
      { key: "ipt.higher", intro: true, label: "Higher rate" },
    ] }],
    notes: [],
    sources: [["HMRC: Historical Insurance Premium Tax rates", `${HMRC}/insurance-premium-tax-ipt-bulletin/historical-insurance-premium-tax-rates--2`]],
  },

  // ---------- drink, tobacco, gambling, vaping ----------
  {
    id: "alcohol", group: "sin", name: "Alcohol duty", headline: "alcohol.beer",
    summary: "The tax built into the price of beer, cider, wine and spirits.",
    about: "Alcohol duty is charged by the strength and amount of drink, not by its price. The chart turns HMRC's rates into the duty in a typical serving, so the figures are easy to picture. VAT is charged on top of the drink and its duty.",
    panels: [
      { title: "Duty in a pint, in pence", real: true, unit: "gbpp", lines: [
        { key: "alcohol.beer", label: "Pint of draught beer, 4%" },
        { key: "alcohol.cider", label: "Pint of draught cider, 4.5%" },
      ] },
      { title: "Duty in a bottle, in pounds", real: true, unit: "gbp2", lines: [
        { key: "alcohol.wine", label: "Bottle of wine, 75cl at 12.5%" },
        { key: "alcohol.spirits", label: "Bottle of spirits, 70cl at 40%" },
      ] },
    ],
    notes: [
      "Since 1 August 2023 duty is charged on the litres of pure alcohol in a drink, at one scale for every type. Draught products in pubs get a lower rate than the same drink in a bottle or can. Before then beer, wine, cider and spirits each had their own system.",
      "Duty on wine is only recorded by HMRC from 1995, on beer from 1993, on cider from 1992 and on spirits from 1982.",
      "The pint and bottle sizes and strengths are our own picture of a typical drink. Real drinks vary.",
    ],
    sources: [["HMRC: Historic Alcohol Duty rates", `${HMRC}/alcohol-bulletin/alcohol-bulletin-historic-duty-rates`]],
  },
  {
    id: "tobacco", group: "sin", name: "Tobacco duty", headline: "tobacco.specific",
    summary: "The tax on cigarettes and rolling tobacco.",
    about: "Cigarette duty has two parts: a fixed amount for every 20 cigarettes and a share of the shop price. A minimum amount per pack applies too. In recent years duty has gone up every year by inflation plus 2 points.",
    panels: [
      { title: "Fixed duty, in pounds", real: true, unit: "gbp2", lines: [
        { key: "tobacco.specific", label: "Per 20 cigarettes" },
        { key: "tobacco.met", intro: true, label: "Minimum tax per 20 cigarettes (from 2017)" },
        { key: "tobacco.hrt", label: "Per 30g pouch of rolling tobacco" },
      ] },
      { title: "Share of the shop price on cigarettes", unit: "pct", lines: [{ key: "tobacco.advalorem", label: "Share of the retail price" }] },
    ],
    notes: [
      "From November 1993 to November 1999 the government committed to raising tobacco duty above inflation every year.",
      "The 1 October 2026 step includes a one-off rise, first announced by Jeremy Hunt at the Spring Budget 2024 and set by Rachel Reeves at the Autumn Budget 2024, to sit alongside the new vaping duty.",
      "The cigarette figure is the fixed part only. Add the share of the price, and VAT on top of the lot.",
    ],
    sources: [["HMRC: Historical Tobacco Duty rates", `${HMRC}/tobacco-bulletin/historical-tobacco-duty-rates`]],
  },
  {
    id: "vaping", group: "sin", name: "Vaping products duty", headline: "vaping.duty",
    summary: "A new tax on vaping liquid, started on 1 October 2026.",
    about: "Vaping products duty is a flat charge on every 10ml of vaping liquid, whatever its nicotine strength. It is paid by manufacturers and importers. Whether the cost is passed on to shoppers is up to the seller. It was first announced by Jeremy Hunt at the Spring Budget 2024, at £2 per 10ml, and the rate was set at £2.20 by Rachel Reeves at the Autumn Budget 2024.",
    panels: [{ title: "Duty per 10ml of liquid, in pounds", real: true, unit: "gbp2", lines: [{ key: "vaping.duty", intro: true, label: "Vaping products duty" }] }],
    notes: ["A duty stamp scheme runs alongside it, with a grace period for existing stock."],
    sources: [["GOV.UK: New Vaping Products Duty comes into effect", "https://www.gov.uk/government/news/new-vaping-products-duty-comes-into-effect"]],
  },
  {
    id: "gambling", group: "sin", name: "Gambling duties", headline: "gambling.rgd",
    summary: "The taxes on the profits of betting and gaming firms.",
    about: "Gambling duties are paid by the firms, not the player, and are charged on the firm's profit from the game or bet. Online casino games, betting and betting shops each have their own duty.",
    panels: [{ title: "Rates", unit: "pct", lines: [
      { key: "gambling.rgd", intro: true, label: "Online casino games (remote gaming duty)" },
      { key: "gambling.remoteBetting", intro: true, label: "Online sports betting" },
      { key: "gambling.gbd", intro: true, introEffect: "none", label: "General betting duty" },
    ] }],
    notes: [
      "Bingo duty was abolished on 1 April 2026.",
      "Machine games duty and the duty on betting shops and casinos did not change at the Autumn Budget 2025.",
      "General betting duty was charged on stakes before October 2001, so it is not comparable with the profits-based tax that followed.",
    ],
    sources: [
      ["GOV.UK: General Betting Duty, Pool Betting Duty and Remote Gaming Duty", "https://www.gov.uk/guidance/general-betting-duty-pool-betting-duty-and-remote-gaming-duty"],
      ["Autumn Budget 2025 summaries (CMS, Rathbones)", "https://cms.law/en/gbr/legal-updates/autumn-budget-2025-key-tax-announcements"],
    ],
  },
  {
    id: "sugar", group: "sin", name: "Sugar levy", headline: "sugar.lower",
    summary: "A charge on soft drinks with a lot of added sugar.",
    about: "The Soft Drinks Industry Levy began in April 2018. It is paid by the makers and importers of drinks with 5g or more of sugar in every 100ml, at a lower rate up to 8g and a higher rate above that. Many firms cut the sugar in their drinks to avoid it.",
    panels: [{ title: "Charge per litre, in pence", real: true, unit: "pence", lines: [
      { key: "sugar.lower", intro: true, label: "5g to 8g of sugar per 100ml" },
      { key: "sugar.higher", intro: true, label: "8g or more per 100ml" },
    ] }],
    notes: [
      "The rates were frozen from 2018 to 2025. Since April 2025 they rise each year with inflation, with a catch-up for the years they were frozen.",
      "From 1 January 2028 the lower threshold falls to 4.5g and milk-based drinks with added sugar are included.",
    ],
    sources: [
      ["GOV.UK: Soft Drinks Industry Levy uprating", "https://www.gov.uk/government/publications/increasing-the-rates-of-the-soft-drinks-industry-levy/soft-drinks-industry-levy-uprating"],
      ["GOV.UK: Changes to the Soft Drinks Industry Levy", "https://www.gov.uk/government/publications/changes-to-the-soft-drinks-industry-levy/changes-to-the-soft-drinks-industry-levy-policy-paper"],
    ],
  },

  // ---------- driving, flying, environment ----------
  {
    id: "fuel", group: "travel", name: "Fuel duty", headline: "fuel.petrol",
    summary: "The tax on a litre of petrol or diesel.",
    about: "Fuel duty is a fixed amount for every litre, whatever the price at the pump. VAT is then charged on the fuel and the duty together. In recent years petrol and diesel have been taxed at the same rate.",
    panels: [{ title: "Duty per litre, in pence", real: true, unit: "pence", lines: [
      { key: "fuel.petrol", label: "Unleaded petrol" },
      { key: "fuel.diesel", label: "Diesel" },
    ] }],
    notes: [
      "A fuel price escalator raised the duty above inflation every year from 1993 until it was dropped after the fuel protests of September 2000.",
      "The 5p cut in March 2022 has been extended every year since. At the Autumn Budget 2025 it was extended to the end of August 2026, then reversed in steps: 1p on 1 September 2026, 2p on 1 December 2026 and 2p on 1 March 2027. The planned rise in line with inflation was also cancelled.",
      "For diesel the chart uses ultra low sulphur diesel from August 1997 and for petrol the lowest of the unleaded grades, which are the fuels sold at most pumps.",
      "HMRC's table starts in 1989, so earlier years are not shown.",
    ],
    sources: [
      ["HMRC: Historical hydrocarbon oils duty rates", `${HMRC}/hydrocarbon-oils-bulletin/historical-hydrocarbon-oils-duty-rates--2`],
      ["GOV.UK: Fuel duty rates 2026 to 2027", "https://www.gov.uk/government/publications/fuel-duty-rates-for-2026-to-2027/fuel-duty-rates-2026-to-2027"],
    ],
  },
  {
    id: "apd", group: "travel", name: "Air passenger duty", headline: "apd.short_econ",
    summary: "A tax on every passenger flying out of a UK airport.",
    about: "Air passenger duty is charged per passenger on flights leaving the UK. The rate depends on how far the flight goes and whether the ticket is in the lowest class of travel or a higher one. Short-haul means the nearest countries, such as Europe, and long-haul means the next band, such as the United States.",
    panels: [{ title: "Duty per passenger, in pounds", real: true, unit: "gbp0", lines: [
      { key: "apd.short_econ", intro: true, label: "Short-haul, lowest class" },
      { key: "apd.short_std", intro: true, label: "Short-haul, other classes" },
      { key: "apd.long_econ", intro: true, label: "Long-haul, lowest class" },
      { key: "apd.long_std", intro: true, label: "Long-haul, other classes" },
    ] }],
    notes: [
      "From 1994 to 2001 one rate covered all classes. The rate for the lowest class was added in April 2001.",
      "The distance bands changed over the years, so long-haul means the first band beyond Europe. Children under 16 in the lowest class have not paid since March 2016.",
      "Domestic flights and private jets have their own rates, which are not shown.",
    ],
    sources: [["HMRC: Air Passenger Duty historical rates", `${HMRC}/air-passenger-duty-bulletin/air-passenger-duty-rates`]],
  },
  {
    id: "landfill", group: "travel", name: "Landfill tax", headline: "landfill.standard",
    summary: "A charge for every tonne of rubbish buried in landfill.",
    about: "Landfill tax started in October 1996 to push councils and businesses towards recycling. Ordinary waste pays the standard rate, and inert waste such as soil and rubble pays the lower rate. Scotland and Wales run their own landfill taxes, so these are the rates for England and Northern Ireland.",
    panels: [{ title: "Charge per tonne, in pounds", real: true, unit: "gbp2", lines: [
      { key: "landfill.standard", intro: true, label: "Standard rate" },
      { key: "landfill.lower", intro: true, label: "Lower rate" },
    ] }],
    notes: [],
    sources: [["HMRC: Environmental Taxes Bulletin historical rates", `${HMRC}/environmental-taxes-bulletin/environmental-taxes-bulletin-historical-rates`]],
  },
  {
    id: "ccl", group: "travel", name: "Climate change levy", headline: "ccl.electricity",
    summary: "A charge on the energy used by businesses and public bodies.",
    about: "The climate change levy has been charged on the electricity and gas that firms and public services use since April 2001. Homes do not pay it. Energy-intensive industries pay reduced rates.",
    panels: [{ title: "Main rates, in pence per kilowatt hour", real: true, unit: "pence3", lines: [
      { key: "ccl.electricity", intro: true, label: "Electricity" },
      { key: "ccl.gas", intro: true, label: "Gas" },
    ] }],
    notes: ["Gas was charged at a much lower rate than electricity until April 2019, when the gap began to close. The electricity rate was cut in 2020 and 2021, and the two rates have been level since April 2024."],
    sources: [["HMRC: Environmental Taxes Bulletin historical rates", `${HMRC}/environmental-taxes-bulletin/environmental-taxes-bulletin-historical-rates`]],
  },
  {
    id: "aggregates", group: "travel", name: "Aggregates levy", headline: "aggregates.standard",
    summary: "A charge on sand, gravel and crushed rock dug from the ground.",
    about: "The aggregates levy started in April 2002. It is charged on each tonne of rock, sand and gravel taken from the ground in the UK, to push builders towards recycled materials.",
    panels: [{ title: "Charge per tonne, in pounds", real: true, unit: "gbp2", lines: [{ key: "aggregates.standard", intro: true, label: "Standard rate" }] }],
    notes: [],
    sources: [["HMRC: Environmental Taxes Bulletin historical rates", `${HMRC}/environmental-taxes-bulletin/environmental-taxes-bulletin-historical-rates`]],
  },

  // ---------- business ----------
  {
    id: "corporation-tax", group: "business", name: "Corporation tax", headline: "corp.main",
    summary: "The tax on company profits.",
    about: "Corporation tax is charged on the profits of companies. From 1973 to 2014 smaller companies paid a lower rate on part of their profits. Between 2015 and 2022 one rate applied to everyone. From April 2023 the 25% rate applies to profits above £250,000, the 19% small profits rate to profits under £50,000, and a sliding scale in between.",
    panels: [{ title: "Rates", unit: "pct", lines: [
      { key: "corp.main", label: "Main rate" },
      { key: "corp.small", label: "Small companies rate" },
    ] }],
    notes: [
      "HMRC's table starts in 1971. Corporation tax began in 1965, when it replaced income tax and profits tax on companies.",
      "Years are financial years that start on 1 April.",
      "Oil and gas companies pay extra: see the Energy Profits Levy.",
    ],
    sources: [
      ["HMRC: Table A6, Rates of Corporation Tax, 1971 to 2017", `${HMRC}/rates-of-corporation-tax`],
      ["GOV.UK: Corporation Tax rates and allowances", "https://www.gov.uk/government/publications/rates-and-allowances-corporation-tax/rates-and-allowances-corporation-tax"],
    ],
  },
  {
    id: "business-rates", group: "business", name: "Business rates", headline: "rates.standard",
    summary: "The yearly tax on shops, offices, factories and other business premises in England.",
    about: "Business rates are charged on the rental value of business premises. The charge is the rateable value multiplied by the multiplier, which is set by the government and shown here as pence in the pound. These are the English multipliers. Scotland, Wales and Northern Ireland set their own.",
    panels: [{ title: "Multiplier, in pence in the pound", unit: "pence1", lines: [
      { key: "rates.standard", intro: true, label: "Standard multiplier" },
      { key: "rates.small", intro: true, label: "Small business multiplier" },
      { key: "rates.rhlStandard", intro: true, introEffect: "less", label: "Retail, hospitality and leisure, standard (from 2026)" },
      { key: "rates.rhlSmall", intro: true, introEffect: "less", label: "Retail, hospitality and leisure, small (from 2026)" },
      { key: "rates.highValue", intro: true, introEffect: "more", label: "High-value premises (from 2026)" },
    ] }],
    notes: [
      "The uniform business rate began in 1990. The multiplier normally rises with inflation each April and drops at a revaluation, which resets rateable values so that the total bill stays about the same.",
      "A second, lower multiplier for small businesses started in 2005.",
      "In April 2026 England moved to five multipliers. Retail, hospitality and leisure premises under £500,000 get lower multipliers, paid for by a higher multiplier on premises of £500,000 or more. A temporary 40% relief for these firms ended in March 2026.",
      "Coming up: a 20% cut in business rates for pubs, clubs and live music venues from April 2027, announced on 23 July 2026.",
    ],
    sources: [
      ["Wikipedia: Business rates in England (multipliers by year), checked against published council tables for selected years", "https://en.wikipedia.org/wiki/Business_rates_in_England"],
      ["Local council business rates pages for the April 2026 multipliers, e.g. Cambridge City Council", "https://cambridge.gov.uk/business-rates-changes-from-april-2026"],
    ],
  },
  {
    id: "energy-profits-levy", group: "business", name: "Energy profits levy", headline: "epl.rate",
    summary: "An extra tax on the profits of oil and gas producers.",
    about: "The energy profits levy is a temporary extra tax on the profits oil and gas firms make in the UK and its waters. It was introduced in May 2022 when energy prices surged. It sits on top of the normal 30% ring fence corporation tax and a 10% supplementary charge, so the combined headline rate is now 78%.",
    panels: [{ title: "Rate", unit: "pct", lines: [{ key: "epl.rate", intro: true, label: "Energy profits levy" }] }],
    notes: ["At the Autumn Budget 2024 the levy was set to run until 31 March 2030, and its investment allowance was removed."],
    sources: [
      ["GOV.UK: Energy Profits Levy reforms 2024", "https://www.gov.uk/government/publications/energy-profits-levy-reforms-2024/energy-profits-levy-reforms-2024"],
      ["Full Fact: The Conservatives, not Labour, extended the Energy Profits Levy to 2028", "https://fullfact.org/economy/kemi-badenoch-energy-profits-levy/"],
    ],
  },
  {
    id: "other-levies", group: "business", name: "Other business levies", headline: "levies.apprenticeship",
    summary: "Smaller taxes on big employers, big banks and big tech firms.",
    about: "Three smaller charges: the apprenticeship levy on the pay bills of the largest employers, the digital services tax on the UK revenue of the biggest online platforms, and a surcharge on bank profits that sits on top of corporation tax.",
    panels: [{ title: "Rates", unit: "pct", lines: [
      { key: "levies.apprenticeship", intro: true, label: "Apprenticeship levy, on pay bills over £3m" },
      { key: "levies.dst", intro: true, label: "Digital services tax, on UK revenue" },
      { key: "levies.bank", intro: true, label: "Surcharge on bank profits" },
    ] }],
    notes: ["The bank surcharge was cut from 8% to 3% in April 2023 when the main corporation tax rate went up, so banks pay 28% in total on their profits above a threshold."],
    sources: [
      ["GOV.UK: Apprenticeship Levy", "https://www.gov.uk/guidance/pay-apprenticeship-levy"],
      ["GOV.UK: Bank corporation tax surcharge", "https://www.gov.uk/government/publications/changes-to-the-bank-corporation-tax-surcharge"],
    ],
  },

  // ---------- property and wealth ----------
  {
    id: "stamp-duty", group: "property", name: "Stamp duty on homes", headline: "sdlt.threshold",
    summary: "The tax paid when buying a home in England and Northern Ireland.",
    about: "Stamp duty land tax is paid by the buyer. Before December 2014 the rate for a price band applied to the whole price, so a small rise in price could cause a big jump in tax. Now each band's rate applies only to the slice of the price inside it. The lines show the main rates for homes bought to live in. Scotland and Wales have their own taxes.",
    panels: [
      { title: "Price below which there is no tax, in pounds", real: true, unit: "gbp0", lines: [
        { key: "sdlt.threshold", label: "Anyone buying a home", kind: "allowance" },
        { key: "sdlt.firstTime", intro: true, label: "First-time buyers", kind: "allowance" },
      ] },
      { title: "Rates", unit: "pct", lines: [
        { key: "sdlt.top", label: "Top rate" },
        { key: "sdlt.extra", intro: true, label: "Extra on second homes and buy to let" },
      ] },
    ],
    notes: [
      "Stamp duty land tax replaced the old stamp duty on land in December 2003. Before then the figures are from HMRC's table of stamp duty on land and buildings.",
      "The temporary holidays in 1991, 2008 and 2020 raised the threshold for a few months. In England the threshold fell back from £250,000 to £125,000 on 1 April 2025.",
      "Buyers who do not live in the UK have paid a 2% surcharge since April 2021.",
    ],
    sources: [
      ["HMRC: Table TA.9, Rates of Stamp Duty on land and buildings (1958 to 2011)", "https://assets.publishing.service.gov.uk/media/5a75ae0540f0b67f59fcec4b/Stamp1.pdf"],
      ["GOV.UK: Stamp Duty Land Tax rates, 2003 to 2025", "https://www.gov.uk/government/publications/rates-and-allowances-stamp-duty-land-tax"],
    ],
  },
  {
    id: "cgt", group: "property", name: "Capital gains tax", headline: "cgt.higher",
    summary: "The tax on the profit made when selling shares, a second home or other assets.",
    about: "Capital gains tax is charged on the profit when an asset is sold for more than it cost. The first slice of gains each year is tax free. It was introduced in 1965. The rates for basic rate and higher rate taxpayers are shown separately.",
    panels: [
      { title: "Rates", unit: "pct", lines: [
        { key: "cgt.higher", intro: true, label: "Higher rate taxpayers" },
        { key: "cgt.basic", intro: true, label: "Basic rate taxpayers" },
        { key: "cgt.property", intro: true, introEffect: "none", label: "Higher rate, residential property (2016 to 2024)" },
        { key: "cgt.badr", intro: true, introEffect: "less", label: "Business asset disposal relief" },
      ] },
      { title: "Tax-free gains each year, in pounds", real: true, unit: "gbp0", lines: [{ key: "cgt.aea", label: "Annual exempt amount", kind: "allowance" }] },
    ],
    notes: [
      "From 1965 to 1988 gains were taxed at a flat 30%. From 1988 they were taxed at income tax rates, with taper relief from 1998 that cut the bill on assets held for longer. Taper relief ended in 2008, when a flat 18% began.",
      "The business asset disposal relief line is the effective rate on qualifying business sales. It was called entrepreneurs' relief until 2020.",
      "On 30 October 2024 the main rates rose to 18% and 24%, matching the rates already charged on residential property.",
      "The annual exempt amount was £1,000 when it began in 1977. HMRC's table starts in 2008.",
    ],
    sources: [
      ["HMRC: Capital Gains Tax statistics, Table A1 (rates and annual exempt amounts from 2008)", `${HMRC}/capital-gains-tax-statistics`],
      ["GOV.UK: Capital Gains Tax rates and allowances", "https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances"],
      ["Wikipedia: Capital gains tax in the United Kingdom", "https://en.wikipedia.org/wiki/Capital_gains_tax_in_the_United_Kingdom"],
    ],
  },
  {
    id: "inheritance-tax", group: "property", name: "Inheritance tax", headline: "iht.nrb",
    summary: "The tax on what is left when someone dies.",
    about: "Inheritance tax is charged on the part of an estate above the nil-rate band. The rate is 40% on the part above it, or 36% if enough is left to charity. Gifts to a spouse are exempt. Since 2017 a second allowance applies when a home is passed to children or grandchildren. Before 1975 the tax was called estate duty, and from 1975 to 1986 capital transfer tax.",
    panels: [
      { title: "Tax-free amount, in pounds", real: true, unit: "gbp0", lines: [
        { key: "iht.nrb", label: "Nil-rate band", kind: "allowance" },
        { key: "iht.rnrb", intro: true, label: "Extra allowance for a home passed to children", kind: "allowance" },
      ] },
      { title: "Top rate", unit: "pct", lines: [{ key: "iht.top", intro: true, label: "Top rate (capital transfer tax, then inheritance tax)" }] },
    ],
    notes: [
      "The nil-rate band has been £325,000 since 2009 and is frozen until April 2031.",
      "From April 2026 the 100% relief on farms and businesses is capped at £2.5 million of qualifying assets, with 50% relief above that. From April 2027 unused pension pots count towards the estate.",
      "Estate duty had steeper rates, up to 80% on the largest estates, which are not shown. The table of thresholds goes back to 1914.",
    ],
    sources: [
      ["GOV.UK: Inheritance Tax thresholds and interest rates", "https://www.gov.uk/government/publications/rates-and-allowances-inheritance-tax-thresholds-and-interest-rates/inheritance-tax-thresholds-and-interest-rates"],
      ["HMRC: Table A8, Capital Transfer Tax and Inheritance Tax thresholds and rates", `${HMRC}/inheritance-tax-and-capital-transfer-tax-thresholds-and-rates`],
    ],
  },
  {
    id: "council-tax", group: "property", name: "Council tax", headline: "councilTax.bandD",
    summary: "The yearly bill that pays for local services in England.",
    about: "Council tax is set by each council, within limits set by the government. It replaced the community charge, known as the poll tax, in April 1993. The average Band D bill is the usual measure of how high it is, though most homes in England are in a lower band.",
    panels: [{ title: "Average Band D bill in England, in pounds a year", real: true, unit: "gbp0", lines: [{ key: "councilTax.bandD", intro: true, label: "Average Band D council tax" }] }],
    notes: [
      "The community charge, a flat charge per adult, replaced domestic rates in Scotland in 1989 and in England and Wales in 1990. It was replaced by council tax in 1993.",
      "Councils must hold a local vote to raise the bill by more than a limit set by the government, and have been allowed an extra amount for adult social care since 2016.",
      "Council tax is a local tax, so the bills rise and fall through councils' choices as well as the government's limits. Scotland and Wales have their own systems.",
      "A high value council tax surcharge on English homes worth over £2 million is proposed for April 2028.",
    ],
    sources: [["MHCLG: Live tables on Council Tax, Band D council tax from 1993", "https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax"]],
  },
];

export const NOT_COVERED = [
  ["Vehicle excise duty (car tax)", "The rate depends on engine size or emissions and on when the car was registered, so there is no single rate to follow over the years, and we could not find a verified year-by-year record. The standard rate for most cars after the first year is £200 in 2026 to 2027, up from £195."],
  ["Fuel, alcohol and tobacco before the records begin", "HMRC's tables start in 1989 for fuel, 1982 for spirits and 1978 for tobacco. Earlier rates are in old Budget reports that we could not check against an official table."],
  ["Estate duty rates before 1975", "We show the tax-free band back to 1914 but not the rates, which were steeper and changed often."],
  ["Tax rates before the tables begin", "HMRC and other official tables begin at different times, from 1914 for inheritance tax thresholds to 2026 for vaping duty. Where a table starts late, the chart starts there."],
  ["Other taxes set by Scotland, Wales and Northern Ireland", "Scotland's income tax rates are included. Its land and buildings transaction tax and landfill tax are not, and neither are Wales's land transaction tax and landfill disposals tax or Northern Ireland's domestic rates."],
  ["Tax reliefs and credits", "Pension tax relief, ISAs, tax credits and similar reliefs change what people pay but are not a rate, so they are not tracked here."],
  ["Customs duties and the TV licence", "Customs duties depend on the goods and the country. The TV licence is a fee set by the government, not a tax."],
];
