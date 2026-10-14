// Short stories behind the biggest tax moments, shown under the taxes they touch. Each states what happened and who decided it, using the same figures
// as the charts (taxSeries.json), and does not say whether the change was a good idea. `taxes` are tax ids from taxCatalogue.js.

export const TAX_STORIES = [
  {
    id: "1979-shift", date: "1979-06-12", taxes: ["income-tax", "vat"], title: "June 1979: lower tax on earnings, higher tax on spending",
    text: "Geoffrey Howe's first Budget, under Margaret Thatcher, cut the top rate of income tax from 83% to 60% and the basic rate from 33% to 30%. The same Budget raised VAT from 8% to 15% and ended the separate higher VAT rate on petrol and luxuries.",
  },
  {
    id: "1988-budget", date: "1988-03-15", taxes: ["income-tax", "cgt", "inheritance-tax"], title: "March 1988: the Lawson Budget",
    text: "Nigel Lawson cut the top rate of income tax from 60% to 40% and the basic rate from 27% to 25%. Capital gains, which had been taxed at a flat 30%, were taxed at income tax rates from April 1988, and inheritance tax moved to a single rate of 40%.",
  },
  {
    id: "poll-tax", date: "1993-04-01", taxes: ["council-tax", "vat"], title: "The poll tax, and the council tax that replaced it",
    text: "The community charge, known as the poll tax, replaced domestic rates in Scotland in 1989 and in England and Wales in 1990. It was replaced by council tax in April 1993, when the average Band D bill in England was £568. In 2026 it is £2,392. VAT went up from 15% to 17.5% on 1 April 1991, in Norman Lamont's Budget, in the middle of this change.",
  },
  {
    id: "fuel-escalator", date: "2000-09-01", taxes: ["fuel"], title: "The fuel price escalator and the 2000 protests",
    text: "From 1993 the government raised fuel duty above inflation every year, taking the duty on unleaded petrol from 17.72p a litre in March 1989 to 48.82p in March 2000. After the fuel protests of September 2000 the escalator was dropped. Duty settled at 57.95p in March 2011 and stayed there for eleven years until the 5p cut of March 2022, which is being reversed in steps from September 2026.",
  },
  {
    id: "vat-crisis", date: "2008-12-01", taxes: ["vat"], title: "The VAT cut in the financial crisis",
    text: "Alistair Darling cut VAT from 17.5% to 15% on 1 December 2008 to boost spending, and it went back to 17.5% on 1 January 2010. In the Emergency Budget of June 2010 George Osborne announced a rise to 20%, which began on 4 January 2011.",
  },
  {
    id: "coalition", date: "2010-06-22", taxes: ["income-tax", "corporation-tax", "cgt"], title: "2010 to 2015: the coalition's tax changes",
    text: "The 50% top rate of income tax began in April 2010 under Labour and was cut to 45% in April 2013 under the coalition. The personal allowance rose from £6,475 in 2010 to £10,600 in 2015. The main rate of corporation tax fell from 28% to 20%, and capital gains tax for higher earners went up to 28% in June 2010.",
  },
  {
    id: "2022", date: "2022-09-23", taxes: ["national-insurance", "income-tax", "stamp-duty"], title: "2022: the levy and the mini-budget",
    text: "National Insurance went up by 1.25 points in April 2022 to pay for health and social care, a decision announced in September 2021 by Boris Johnson's government. Kwasi Kwarteng's mini-budget of 23 September 2022, under Liz Truss, reversed the rise from November and doubled the stamp duty threshold to £250,000. It also announced a cut in the basic rate to 19% and the end of the 45% rate, both cancelled within weeks.",
  },
  {
    id: "ni-2024", date: "2024-10-30", taxes: ["national-insurance"], title: "National Insurance: cuts for workers, a rise for employers",
    text: "Jeremy Hunt cut the employee rate from 12% to 10% in January 2024 and then to 8% in April 2024, and cut Class 4 for the self-employed to 6%. Rachel Reeves's Autumn Budget in October 2024 then raised the employer rate from 13.8% to 15% and lowered the pay level at which employers start paying from £9,100 to £5,000 a year, from April 2025.",
  },
  {
    id: "corp-tax", date: "2023-04-01", taxes: ["corporation-tax"], title: "Corporation tax: down for a decade, then up",
    text: "The main rate fell from 30% in 2007 to 19% in 2017 and stayed there. Rishi Sunak announced in March 2021 that it would rise to 25% for larger profits, which began in April 2023, with a 19% rate kept for small profits.",
  },
  {
    id: "tobacco-2011", date: "2011-03-23", taxes: ["tobacco"], title: "March 2011: a new way of taxing cigarettes",
    text: "In the 2011 Budget the share of the shop price charged on cigarettes was cut from 24% to 16.5%, while the fixed duty on every 20 rose from £2.38 to £3.10. A fixed amount rises with each Budget, whatever the price, so it is the part the government sets directly.",
  },
  {
    id: "cgt-history", date: "2024-10-30", taxes: ["cgt"], title: "Capital gains tax: from 30% to 18% and 24%",
    text: "Capital gains were taxed at 30% from 1965, at income tax rates from 1988, and at a flat 18% from 2008. Higher earners went to 28% in June 2010, and both rates were cut to 20% and 10% in 2016. On 30 October 2024 the main rates rose to 24% and 18%.",
  },
  {
    id: "sdlt-holidays", date: "2025-04-01", taxes: ["stamp-duty"], title: "The stamp duty holidays",
    text: "The threshold below which buyers pay nothing has been raised for a few months at a time: to £250,000 in December 1991, £175,000 in September 2008, £500,000 in July 2020 and £250,000 in September 2022. Each was temporary, and on 1 April 2025 it returned to £125,000.",
  },
  {
    id: "freeze", date: "2021-04-06", taxes: ["income-tax", "national-insurance"], title: "The threshold freeze",
    text: "The personal allowance has been £12,570 since April 2021 and the higher rate has started at £50,270. Freezing them while pay rises pulls more people into tax without a change in any rate, which is known as fiscal drag. The freeze is set to run to April 2031. Switch the charts to today's money to see what it does to their value.",
  },
  {
    id: "beer-escalator", date: "2013-03-20", taxes: ["alcohol"], title: "The beer duty escalator, 2008 to 2013",
    text: "From 2008 Labour raised alcohol duties by 2% above inflation every year, known as the duty escalator. In the March 2013 Budget George Osborne scrapped it for beer and cut beer duty by 1p a pint, saying pubs were closing. On our chart the duty in a pint of beer peaked at 44p in 2012 and was 42p by 2015.",
  },
  {
    id: "alcohol-2023", date: "2023-08-01", taxes: ["alcohol"], title: "August 2023: one scale for every drink",
    text: "Until 1 August 2023 beer, wine, cider and spirits each had their own system. Now duty is charged on the litres of pure alcohol in a drink, at one scale for every type, with a lower rate for draught drinks in pubs. On our chart the duty in a typical serving of wine rose by about a fifth, spirits by about a tenth, and cider fell by about 2%.",
  },
  {
    id: "gambling-duties", date: "2026-04-01", taxes: ["gambling"], title: "Gambling duties: charged on UK customers, then raised",
    text: "A 15% duty on remote gambling began in December 2014, announced in the March 2013 Budget and charged on bets from UK customers whichever country the firm is in. The rate on online casino games rose to 21% in April 2019, announced in the October 2018 Budget, and to 40% in April 2026, announced by Rachel Reeves at the Autumn Budget 2025. Remote sports betting is due to rise to 25% in April 2027, and bingo duty was abolished in April 2026.",
  },
  {
    id: "sugar-levy", date: "2018-04-06", taxes: ["sugar"], title: "The sugar levy, from announcement to uprating",
    text: "George Osborne announced the soft drinks levy at the March 2016 Budget and it began in April 2018, at 18p a litre for drinks with 5g to 8g of sugar per 100ml and 24p above that. Many firms cut the sugar in their drinks to avoid it. The rates were frozen until 2025 and now rise each year with inflation. From January 2028 the lower threshold falls to 4.5g and milk-based drinks with added sugar are included.",
  },
  {
    id: "apd-2007", date: "2007-02-01", taxes: ["apd"], title: "Air passenger duty: doubled in 2007",
    text: "A lower rate for the lowest class of travel was added in April 2001. In December 2006 Gordon Brown announced that the rates would be doubled from 1 February 2007, so the lowest-class rate for Europe went from £5 to £10 and for the next band from £20 to £40. The rates have risen since, and in April 2026 the lowest-class long-haul rate rose from £90 to £102 and the standard-class one from £216 to £244.",
  },
  {
    id: "business-rates-2026", date: "2026-04-01", taxes: ["business-rates"], title: "Business rates: one national rate, then five",
    text: "The uniform business rate began in 1990, with one multiplier set by the government for the whole of England. The multiplier normally rises with inflation each April and falls at a revaluation: in 2000 it dropped from 48.9p to 41.6p in the pound. A lower one for small businesses started in 2005. In April 2026 England moved to five multipliers, with lower ones for retail, hospitality and leisure premises under £500,000, paid for by a higher one on premises of £500,000 or more.",
  },
  {
    id: "ipt-rises", date: "2017-06-01", taxes: ["ipt"], title: "Insurance premium tax: from 2.5% to 12%",
    text: "Insurance premium tax began in October 1994 at 2.5%. It went to 4% in April 1997, 5% in July 1999, 6% in January 2011, 9.5% in November 2015, 10% in October 2016 and 12% in June 2017. The last three rises were announced by George Osborne at the Summer Budget and Autumn Statement 2015. The higher rate on travel insurance and some other products has been 20% since 2011.",
  },
  {
    id: "epl", date: "2022-05-26", taxes: ["energy-profits-levy"], title: "The energy profits levy, a temporary tax that grew",
    text: "Rishi Sunak introduced the energy profits levy in May 2022, at 25%, when energy prices surged. Jeremy Hunt raised it to 35% from January 2023, at the Autumn Statement 2022, and Rachel Reeves raised it to 38% from November 2024 and set it to run until 31 March 2030. With the 30% ring fence corporation tax and the 10% supplementary charge, the combined headline rate is 78%.",
  },
  {
    id: "vaping-duty", date: "2026-10-01", taxes: ["vaping", "tobacco"], title: "Vaping products duty",
    text: "Jeremy Hunt announced a duty on vaping liquid at the Spring Budget 2024, at £2 for every 10ml, and Rachel Reeves set the rate at £2.20 at the Autumn Budget 2024. It starts on 1 October 2026, on manufacturers and importers, whatever the nicotine strength. On the same day tobacco duty rises by a one-off extra amount, first announced by Jeremy Hunt in March 2024, to sit alongside the new vaping duty.",
  },
  {
    id: "landfill-escalator", date: "2014-04-01", taxes: ["landfill"], title: "Landfill tax: a rising price to bury rubbish",
    text: "Landfill tax began in October 1996 at £7 a tonne for ordinary waste, to push councils and businesses towards recycling. The rate was raised by £8 a tonne every April from 2008 to 2014, from £24 to £80, and in the June 2010 Budget the government set a floor of £80 from April 2014. It has risen with inflation since, and in April 2025 the standard rate went to £126.15 a tonne and the lower rate for inert waste such as soil to £4.05. In April 2026 they went to £130.75 and £8.65.",
  },
  {
    id: "ccl-2019", date: "2019-04-01", taxes: ["ccl"], title: "The climate change levy: gas catches up with electricity",
    text: "The levy began in April 2001. In April 2019 the rate on electricity rose by 45%, to 0.847p per kilowatt hour, and on gas by 67%, to 0.339p, to replace the money from the Carbon Reduction Commitment energy scheme, which closed. The electricity rate was then cut and the gas rate raised each year to narrow the gap, and since April 2024 the two have been the same.",
  },
  {
    id: "dividends-2016", date: "2016-04-06", taxes: ["dividends"], title: "Tax on dividends: a new system in 2016",
    text: "In April 2016 the old tax credit on dividends was replaced by a tax-free allowance of £5,000 a year and new rates, announced by George Osborne at the Summer Budget 2015. The allowance was cut to £2,000 in 2018, then to £1,000 in 2023 and £500 in 2024, the last two announced by Jeremy Hunt at the Autumn Statement 2022. The basic and higher rates rose by 1.25 points in 2022 to pay for health and social care, and by two points in April 2026, to 10.75% and 35.75%.",
  },
  {
    id: "scottish-bands", date: "2018-04-06", taxes: ["scottish-income-tax", "income-tax"], title: "Scotland sets its own income tax bands",
    text: "Since April 2017 the Scottish Parliament has set the rates and bands of income tax on pay, pensions and property income for people living in Scotland, while the personal allowance and tax on savings and dividends stay with the UK government. From 2018 there were five bands instead of three. The higher rate has been 42% since 2023, there is an advanced rate of 45% from 2024, and the top rate has risen from 45% to 48%, while the UK rates stayed at 40% and 45%.",
  },
];

export const storiesFor = (taxId) => TAX_STORIES.filter((s) => s.taxes.includes(taxId)).sort((a, b) => (a.date < b.date ? -1 : 1));
