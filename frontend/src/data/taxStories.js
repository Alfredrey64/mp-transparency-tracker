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
];

export const storiesFor = (taxId) => TAX_STORIES.filter((s) => s.taxes.includes(taxId)).sort((a, b) => (a.date < b.date ? -1 : 1));
