// What the winning party promised at each general election since 1997, set beside what happened. Manifestos are only used from 1997: earlier ones
// are not a reliable record of what a party promised in the same way, so earlier governments are described by what they did, not what they said.
//
// Every pledge was checked against the text of the manifesto (the wording below is a paraphrase, not a quotation), and every outcome against an
// official statistic, an Act of Parliament or an independent check named in `source`. The Coalition of 2010 published a joint programme for
// government rather than a manifesto, so that is what it is measured against. Status: "delivered", "partly", "not" (not delivered or not kept) and
// "under-way" (still running) and "behind" (still running but behind the pace needed). Checked 12 October 2026. A pledge that was only partly in a government's hands, or that depended on a vote, is
// marked by what happened, not by whose fault it was.

export const STATUS = {
  delivered: { label: "Delivered", colour: "#2F6F4E", mark: "✓" },
  partly: { label: "Partly delivered", colour: "#9C6B30", mark: "~" },
  not: { label: "Not delivered", colour: "#9C3B3B", mark: "✗" },
  "under-way": { label: "Under way", colour: "#4C6FA6", mark: "…" },
  behind: { label: "Behind the pace", colour: "#B5521B", mark: "!" },
};

export const MANIFESTOS = [
  {
    id: "lab1997", election: "1997", party: "Labour", title: "New Labour because Britain deserves better",
    url: "https://www.ukpol.co.uk/general-election-manifestos-1997-labour-party/",
    pledges: [
      { text: "Cut class sizes to 30 or under for five, six and seven-year-olds.", status: "delivered", note: "A limit of 30 for infant classes came into force in September 2001. A few children were still in larger classes under the exemptions.", source: "Channel 4 FactCheck" },
      { text: "Get 250,000 under-25s off benefit and into work, paid for by a one-off tax on the privatised utilities.", status: "delivered", note: "More than 250,000 young people went through the New Deal. Some would have found work anyway: one estimate is about 17,000 extra jobs a year.", source: "Channel 4 FactCheck" },
      { text: "No increase in the basic or top rates of income tax.", rates: ["incomeTax.basic", "incomeTax.top"], status: "delivered", note: "Neither rate was raised in that Parliament.", source: "HM Revenue and Customs rates history" },
      { text: "Introduce a national minimum wage.", status: "delivered", note: "It began in April 1999 at £3.60 an hour for adults.", source: "National Minimum Wage Act 1998" },
      { text: "Set up a Scottish Parliament and a Welsh Assembly, once voters agreed in referendums.", status: "delivered", note: "Both referendums were held in September 1997 and both bodies opened in 1999.", source: "Scotland Act 1998; Government of Wales Act 1998" },
      { text: "End the hereditary principle in the House of Lords.", status: "partly", note: "The House of Lords Act 1999 removed all but 92 hereditary peers. The last of them lost their seats in April 2026.", source: "House of Lords Act 1999; House of Lords (Hereditary Peers) Act 2026" },
      { text: "Hold a referendum on the voting system for the House of Commons.", status: "not", note: "A commission reported in 1998 but no referendum was held under Labour. The 2011 referendum, under the coalition, was on a different system.", source: "Jenkins Commission report, 1998" },
    ],
  },
  {
    id: "lab2001", election: "2001", party: "Labour", title: "Ambitions for Britain", url: null,
    pledges: [
      { text: "Not raise the basic or top rate of income tax.", rates: ["incomeTax.basic", "incomeTax.top"], status: "delivered", note: "Neither rate rose in that Parliament. National Insurance, which is a separate charge, went up by a point for employees, employers and the self-employed in April 2003.", source: "HM Revenue and Customs rates history" },
      { text: "Not introduce university top-up fees, and legislate to prevent them.", status: "not", note: "The Higher Education Act 2004 let universities in England charge variable fees of up to £3,000 a year, from 2006. The bill passed its second reading by five votes.", source: "Higher Education Act 2004" },
      { text: "20,000 more nurses and 10,000 more doctors.", status: "delivered", note: "Between 2001 and 2005 the NHS added about 53,000 nurses and 22,000 doctors.", source: "Channel 4 FactCheck" },
      { text: "6,000 more police recruits, taking numbers to a record.", status: "delivered", note: "Police numbers in England and Wales reached 142,972, an all-time high at the time.", source: "Channel 4 FactCheck" },
      { text: "10,000 more teachers.", status: "delivered", note: "There were 24,700 more teachers than in 2001.", source: "Channel 4 FactCheck" },
      { text: "Raise the minimum wage to £4.20.", status: "delivered", note: "The adult rate reached £4.20 in October 2002.", source: "Low Pay Commission rates" },
    ],
  },
  {
    id: "lab2005", election: "2005", party: "Labour", title: "Britain forward not back", url: "https://ucrel.lancs.ac.uk/wmatrix/tutorial6/labour%20manifesto%202005.pdf",
    pledges: [
      { text: "Hold a referendum on the EU constitutional treaty.", status: "not", note: "France and the Netherlands voted against the treaty in 2005 and the UK dropped its plans. The replacement, the Lisbon Treaty, was approved by Parliament in 2008 without a referendum.", source: "European Union (Amendment) Act 2008" },
      { text: "Not raise the basic or top rates of income tax in the next Parliament.", rates: ["incomeTax.basic", "incomeTax.top"], status: "not", note: "A new 50p rate on income over £150,000 began on 6 April 2010, announced in the 2009 Budget. The basic rate was not raised.", source: "Finance Act 2009" },
      { text: "By the end of 2008, nobody waits more than 18 weeks from referral to treatment.", status: "partly", note: "In practice the target became a standard: 90% of patients having an operation, and 95% of others, to wait under 18 weeks. NHS England's statistics show the 95% standard met from July 2008 and national performance steady from January 2009.", source: "NHS England referral to treatment statistics" },
      { text: "3,500 Sure Start Children's Centres by 2010.", status: "delivered", note: "The government said the target was met in March 2010, and counted 3,631 designated centres at the end of April.", source: "Department for Education" },
      { text: "Introduce identity cards, including fingerprints, backed by a national register.", status: "partly", note: "The Identity Cards Act 2006 passed and cards were issued to foreign nationals from 2008 and volunteers from 2009. The scheme was scrapped in 2010.", source: "Identity Cards Act 2006; Identity Documents Act 2010" },
      { text: "Ban smoking in pubs that serve food and in enclosed workplaces, with other pubs and clubs able to choose.", status: "delivered", note: "The Health Act 2006 went further than the manifesto: from July 2007 smoking was banned in almost all enclosed public places in England, with no exemption for pubs.", source: "Health Act 2006" },
      { text: "Complete the reform of the House of Lords.", status: "not", note: "In March 2007 the Commons voted for a fully elected House, but no law followed. Hereditary peers stayed until 2026.", source: "Votes of 7 March 2007" },
    ],
  },
  {
    id: "coalition2010", election: "2010", party: "Conservative and Liberal Democrat coalition", title: "The Coalition: our programme for government", url: "https://www.gov.uk/government/collections/coaltion-programme-for-government",
    note: "The two parties agreed one programme after the election, so this is the document used, not either manifesto.",
    pledges: [
      { text: "Hold a referendum on the alternative vote for the House of Commons.", status: "delivered", note: "It was held on 5 May 2011. 68% voted No, on a turnout of 42%, so the voting system did not change.", source: "Parliamentary Voting System and Constituencies Act 2011" },
      { text: "Introduce fixed five-year terms for Parliament.", status: "delivered", note: "The Fixed-term Parliaments Act 2011 did this. It was repealed in 2022.", source: "Fixed-term Parliaments Act 2011; Dissolution and Calling of Parliament Act 2022" },
      { text: "Raise the income tax personal allowance towards £10,000.", rates: ["incomeTax.allowance"], status: "delivered", note: "It was £6,475 in 2010-11 and reached £10,000 in April 2014.", source: "HM Revenue and Customs" },
      { text: "A pupil premium to give schools extra money for disadvantaged pupils.", status: "delivered", note: "It was introduced in April 2011.", source: "Department for Education" },
      { text: "Scrap the identity card scheme.", status: "delivered", note: "The Identity Documents Act 2010 cancelled the cards and the national register.", source: "Identity Documents Act 2010" },
      { text: "Set up a committee to bring forward proposals for a wholly or mainly elected House of Lords.", status: "partly", note: "A draft bill was published in 2011 and a bill introduced in June 2012, but it was abandoned in August 2012 after 91 Conservative MPs voted against it at second reading. The Lords was not changed.", source: "House of Lords Reform Bill 2012" },
      { text: "Speed up the reduction of the deficit over the course of the Parliament.", status: "partly", note: "Government borrowing fell from £142 billion in 2010-11 to £98 billion in 2014-15, about a third, but the deficit was not eliminated.", source: "Office for National Statistics" },
    ],
  },
  {
    id: "con2015", election: "2015", party: "Conservative", title: "Strong leadership, a clear economic plan, a brighter, more secure future", url: "https://s3-eu-west-1.amazonaws.com/manifesto2015/ConservativeManifesto2015.pdf",
    pledges: [
      { text: "Hold an in-out referendum on EU membership before the end of 2017.", status: "delivered", note: "It was held on 23 June 2016. Leave won with 51.9% on a turnout of 72%.", source: "Electoral Commission" },
      { text: "No rises in VAT, National Insurance or income tax rates.", rates: ["vat.standard", "ni.employee", "incomeTax.basic"], status: "delivered", note: "The rates of all three were unchanged until after the 2017 election.", source: "HM Revenue and Customs rates history" },
      { text: "Eliminate the deficit and start to run a surplus.", status: "not", note: "Government borrowing was £44 billion in 2018-19 and £59 billion in 2019-20, before the pandemic. Day-to-day spending was covered by taxes in 2018-19.", source: "Office for National Statistics" },
      { text: "Keep the ambition of net migration in the tens of thousands.", status: "not", note: "Net migration was 303,000 in the year to December 2015 and stayed above 180,000 in every year to December 2019.", source: "Office for National Statistics" },
      { text: "30 hours a week of free childcare for working parents of three and four-year-olds.", status: "delivered", note: "It began in England in September 2017.", source: "Childcare Act 2016" },
      { text: "Raise the personal allowance to £12,500 and the higher-rate threshold to £50,000.", status: "delivered", note: "Both were reached in April 2019.", source: "HM Revenue and Customs" },
      { text: "Build 200,000 Starter Homes for first-time buyers under 40.", status: "not", note: "The National Audit Office found in November 2019 that none had been built. The scheme was dropped in 2020 and replaced by First Homes.", source: "National Audit Office, 2019" },
      { text: "Scrap the Human Rights Act and introduce a British Bill of Rights.", status: "not", note: "A Bill of Rights Bill was introduced in 2022 and withdrawn in 2023. The Human Rights Act is still law.", source: "Bill of Rights Bill 2022-23" },
    ],
  },
  {
    id: "con2017", election: "2017", party: "Conservative", title: "Forward, together: our plan for a stronger Britain and a prosperous future", url: "https://spectator.com/article/2017-conservative-manifesto-full-text/",
    pledges: [
      { text: "Leave the single market and the customs union, and seek a deep partnership with a free trade agreement.", status: "delivered", note: "The UK left both on 31 December 2020. The Trade and Cooperation Agreement, signed on 30 December 2020, removed tariffs and quotas on goods that meet its rules of origin.", source: "EU-UK Trade and Cooperation Agreement" },
      { text: "Bring net migration down to the tens of thousands.", status: "not", note: "It was 200,000 in the year to June 2017 and stayed above 180,000 in every year to December 2019.", source: "Office for National Statistics" },
      { text: "A safeguard cap on energy prices.", status: "delivered", note: "A cap on default tariffs began on 1 January 2019.", source: "Domestic Gas and Electricity (Tariff Cap) Act 2018" },
      { text: "Replace technical qualifications with new T-levels.", status: "delivered", note: "The first T-levels were taught from September 2020.", source: "Department for Education" },
      { text: "A new law to protect victims of domestic abuse.", status: "delivered", note: "The Domestic Abuse Act 2021 received Royal Assent on 29 April 2021.", source: "Domestic Abuse Act 2021" },
      { text: "A free vote in Parliament on the future of the Hunting Act.", status: "not", note: "No vote was held.", source: "House of Commons records" },
      { text: "A plan to pay for and provide social care.", status: "not", note: "The funding proposal was changed within days of the manifesto. A green paper was promised in 2017 and its publication was put back at least five times. It had not appeared when Theresa May left office in 2019.", source: "Department of Health and Social Care" },
    ],
  },
  {
    id: "con2019", election: "2019", party: "Conservative", title: "Get Brexit done: unleash Britain's potential", url: "https://assets-global.website-files.com/5da42e2cae7ebd3f8bde353c/5dda924905da587992a064ba_Conservative%202019%20Manifesto.pdf",
    pledges: [
      { text: "Get Brexit done in January.", status: "delivered", note: "The UK left the EU on 31 January 2020.", source: "European Union (Withdrawal Agreement) Act 2020" },
      { text: "20,000 more police officers.", status: "delivered", note: "The Home Office counted 20,951 more officers in England and Wales by March 2023.", source: "Home Office police uplift statistics" },
      { text: "50,000 more nurses.", status: "delivered", note: "NHS England counted 51,245 more nurses in September 2023 than in 2019, six months ahead of the target. The Royal College of Nursing noted there were also 42,000 vacancies.", source: "NHS England; Royal College of Nursing" },
      { text: "Have begun work on 40 new hospitals by the end of the Parliament.", status: "not", note: "The manifesto said work would have begun on 40 by the end of the Parliament. In May 2024 the government counted six hospitals open and 18 more in construction. Full Fact found that only one of the 40 counted schemes, the Dyson Cancer Centre in Bath, had been finished. The National Audit Office said in 2023 that the 2030 target would not be met.", source: "Health and Social Care Secretary's statement, May 2024; Full Fact; National Audit Office, 2023" },
      { text: "Not raise the rate of income tax, VAT or National Insurance.", rates: ["incomeTax.basic", "vat.standard", "ni.employee"], status: "not", note: "The rate of National Insurance rose by 1.25 points in April 2022 and was reversed in November 2022. Income tax and VAT rates were unchanged.", source: "HM Revenue and Customs rates history" },
      { text: "An Australian-style points-based immigration system.", status: "delivered", note: "It began on 1 January 2021.", source: "Home Office" },
      { text: "Build 300,000 homes a year in England by the mid-2020s.", status: "not", note: "Net additions to the housing stock did not reach 300,000 in any year.", source: "Department for Levelling Up, Housing and Communities" },
      { text: "Keep the triple lock on the state pension.", status: "partly", note: "The earnings part was suspended for 2022-23, when pensions rose 3.1% while earnings had risen 8.3%. It applied in full in the other years.", source: "Social Security (Up-rating) legislation" },
    ],
  },
  {
    id: "lab2024", election: "2024", party: "Labour", title: "Change", url: "https://labour.org.uk/wp-content/uploads/2024/06/Labour-Party-manifesto-2024.pdf",
    pledges: [
      { text: "Set up Great British Energy, a publicly owned clean power company.", status: "delivered", note: "The Great British Energy Act 2025 received Royal Assent on 15 May 2025.", source: "Great British Energy Act 2025" },
      { text: "Bring the railways into public ownership as operator contracts end.", status: "under-way", note: "Train operators have been moving into public ownership in stages since 2025. Full Fact rates it as appearing on track.", source: "Passenger Railway Services (Public Ownership) Act 2024; Full Fact Government Tracker" },
      { text: "Abolish Section 21 'no fault' evictions.", status: "delivered", note: "The Renters' Rights Act 2025 received Royal Assent on 27 October 2025. No-fault evictions ended in England on 1 May 2026.", source: "Renters' Rights Act 2025" },
      { text: "Ban exploitative zero-hours contracts, end fire and rehire, and give basic rights from day one.", status: "partly", note: "The Employment Rights Act 2025 received Royal Assent in December 2025 and is being brought in during 2026 and 2027. Protection from unfair dismissal starts after six months, not on day one.", source: "Employment Rights Act 2025" },
      { text: "Remove the right of hereditary peers to sit and vote in the House of Lords.", status: "delivered", note: "The House of Lords (Hereditary Peers) Act 2026 ended it on 29 April 2026.", source: "House of Lords (Hereditary Peers) Act 2026" },
      { text: "1.5 million new homes in England over the Parliament.", status: "behind", note: "A five-year target running to 2029. It needs about 300,000 a year, and housebuilding has been running behind that pace. Full Fact rates it as appearing off track.", source: "Full Fact Government Tracker; ONS" },
      { text: "Not increase National Insurance, the basic, higher or additional rates of income tax, or VAT.", rates: ["incomeTax.basic", "incomeTax.top", "ni.employee", "ni.employer", "vat.standard"], status: "not", note: "Employers' National Insurance was raised in the October 2024 Budget and income tax thresholds were frozen for longer, to 2031. The rates of income tax and employees' National Insurance, and VAT, were not raised. Full Fact rates the National Insurance pledge as not kept and the income tax one as unclear or disputed.", source: "Full Fact Government Tracker; Autumn Budget 2025" },
    ],
  },
];

// The manifesto blocks that belong with a government: those for the elections that put it in power, and the one a successor inherited.
const INHERITED = { brown: ["2005"], may: ["2015"], sunak: ["2019"], truss: ["2019"], burnham: ["2024"] };

export function manifestosFor(gov) {
  const ids = new Set([...(gov.elections ?? []), ...(INHERITED[gov.id] ?? [])]);
  return MANIFESTOS.filter((m) => ids.has(m.election));
}
