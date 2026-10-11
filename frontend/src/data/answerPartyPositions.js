// "What each party said it would do": for the questions where a party can offer a plan, a short summary of the clearest commitments in
// each party's 2024 general election manifesto, written in our own words (the manifestos are copyrighted, so we link to them).
//
// A party appears under a question only where it made a clear commitment we are confident about. A missing party does not mean it has no
// view, so the page says so. Manifestos are from before the election, and parties change their policies, so every list is dated and the
// page sends readers to each party's own site for the latest. Keys match PARTY_MANIFESTOS in data/partyManifestos.js.
//
// Each entry is: { about, parties: { <party key>: "what it said" } }.

export const POSITIONS_AS_OF = "the 2024 general election manifestos";
export const POSITION_PARTY_ORDER = ["labour", "conservative", "liberal-democrat", "reform-uk", "green", "snp", "plaid-cymru"];

// These two parties only stand in one nation, which the page says wherever they appear.
export const ONE_NATION_PARTIES = { snp: "Scotland", "plaid-cymru": "Wales" };

const NHS = {
  about: "on the NHS",
  parties: {
    labour: "40,000 more appointments, scans and operations every week, doubling the number of cancer scanners and recruiting 8,500 more mental health staff, paid for by closing tax loopholes such as non-dom status.",
    conservative: "Increase NHS spending above inflation every year and recruit 92,000 more nurses and 28,000 more doctors, with new diagnostic and surgical hubs.",
    "liberal-democrat": "The right to see a GP within seven days, or within 24 hours if it is urgent, with 8,000 more GPs, plus free personal care for older and disabled people and better pay for care workers.",
    "reform-uk": "Tax cuts for front-line NHS and social care staff, and tax relief on private health insurance to take pressure off the NHS.",
    green: "Invest £20 billion in NHS budgets over the parliament for hospital building and repair, and bring in free personal social care for older and disabled people.",
    snp: "A bill to protect the NHS from privatisation, and a call on the UK government to put £10 billion more into health.",
    "plaid-cymru": "More funding for the NHS and a National Care Service.",
  },
};

const IMMIGRATION = {
  about: "on immigration",
  parties: {
    labour: "Bring net migration down by linking visas to training for British workers, and by ending what it called reliance on overseas recruitment.",
    conservative: "A legal cap on migration numbers, set by a binding vote in Parliament every year.",
    "liberal-democrat": "A fair, effective immigration system, with a right to work for asylum seekers after three months.",
    "reform-uk": "Freeze non-essential immigration, with exceptions for essential skills such as health care, and charge employers extra National Insurance for foreign workers.",
    green: "Rejoin the EU customs union and restore freedom of movement with Europe.",
    snp: "Devolve immigration powers to Scotland, with a rural visa pilot to ease labour shortages.",
    "plaid-cymru": "Oppose restrictions on visas for care workers and their dependants, and make Wales a Nation of Sanctuary for refugees.",
  },
};

const BOATS = {
  about: "on small boat crossings",
  parties: {
    labour: "Scrap the Rwanda scheme and set up a Border Security Command with counter-terrorism style powers to go after smuggling gangs, with more returns of people with no right to stay.",
    conservative: "Keep the Rwanda scheme, with regular flights, and leave the European Convention on Human Rights if it blocks removals.",
    "liberal-democrat": "Scrap the Rwanda scheme, work with France and other countries on crossings, and open more safe and legal routes.",
    "reform-uk": "Return people who cross the Channel in small boats to France, freeze non-essential immigration and leave the European Convention on Human Rights.",
    green: "Create safe routes to sanctuary for people fleeing danger, persecution and war, and end the hostile environment.",
    snp: "Scrap the Rwanda scheme and give asylum seekers the right to work.",
    "plaid-cymru": "Oppose the Rwanda scheme, provide safe routes and process claims quickly, including in a third country such as France or at British embassies abroad.",
  },
};

const ENERGY = {
  about: "on energy and net zero",
  parties: {
    labour: "Set up Great British Energy, a publicly owned clean power company, aim for clean electricity by 2030, run a Warm Homes Plan to insulate homes and grant no new North Sea oil and gas licences.",
    conservative: "Hold annual licensing rounds for new North Sea oil and gas, build more nuclear power and keep the 2050 net zero target.",
    "liberal-democrat": "A nationwide home insulation programme to cut bills, with net zero reached by 2045.",
    "reform-uk": "Scrap net zero targets and green levies, take VAT off energy bills and fast-track new North Sea oil and gas licences.",
    green: "Invest £29 billion over five years to insulate homes, bring the big five energy retailers into public ownership, stop new oil and gas licences and reach net zero well before 2050.",
    snp: "Press for a cut in standing charges and a social tariff for energy, and for the UK government to invest at least £28 billion a year in the green economy, with a public stake in new energy projects.",
    "plaid-cymru": "Raise the windfall tax on energy companies and close the loopholes they use, while promoting investment in renewable energy.",
  },
};

export const ANSWER_POSITIONS = {
  "why-housing-expensive": {
    about: "on building homes",
    parties: {
      labour: "Build 1.5 million homes in England over the parliament by reforming planning rules, including releasing lower-quality \"grey belt\" land, and extend the Mortgage Guarantee Scheme.",
      conservative: "Build 1.6 million homes in England, abolish stamp duty for first-time buyers on homes up to £425,000 and bring in a new Help to Buy scheme.",
      "liberal-democrat": "Build 380,000 homes a year, including 150,000 social homes, with new garden cities.",
      green: "Build 150,000 social homes a year, new or by refurbishing older housing.",
      "reform-uk": "Cut stamp duty to zero on homes under £750,000 and fast-track new housing on brownfield sites.",
      snp: "Bring back a simplified Help to Buy ISA to help first-time buyers.",
      "plaid-cymru": "Bring in a legal Right to Adequate Housing and act on empty homes, second homes and holiday homes.",
    },
  },
  "why-rents-rising": {
    about: "on renting",
    parties: {
      labour: "End \"no fault\" evictions straight away and bring in Awaab's Law, so landlords have to fix damp and mould quickly.",
      conservative: "Bring in the Renters Reform Bill to end \"no fault\" evictions once the courts can cope.",
      "liberal-democrat": "End \"no fault\" evictions straight away, make three-year tenancies the standard and set up a register of licensed landlords.",
      green: "Bring in rent controls and end \"no fault\" evictions.",
      "reform-uk": "Scrap Section 24, so landlords can again deduct mortgage interest from their rental income tax, and abolish the Renters' Reform Bill.",
      snp: "Push for an annual rise in Local Housing Allowance, which helps renters with their housing costs.",
    },
  },
  "why-prices-rising": {
    about: "on the cost of living",
    parties: {
      labour: "No rises in income tax, National Insurance or VAT rates for working people, plus a Warm Homes Plan and a ban on exploitative zero-hours contracts.",
      conservative: "Cut employee National Insurance by a further 2p, to 6% by April 2027, and protect pensioners with a \"triple lock plus\".",
      "liberal-democrat": "A nationwide home insulation programme to bring energy bills down.",
      "reform-uk": "Raise the income tax threshold to £20,000 and take VAT off energy bills.",
      green: "Invest £29 billion over five years to insulate homes, paid for partly by a wealth tax on very large fortunes.",
      snp: "Demand an essentials guarantee so everyone can afford basics such as food and utilities, with a social tariff for energy and a cut in standing charges.",
      "plaid-cymru": "Raise Child Benefit by £20 a week to help families with the cost of living.",
    },
  },
  "why-energy-bills-high": ENERGY,
  "is-uk-on-track-net-zero": ENERGY,
  "why-nhs-waiting-list": NHS,
  "why-ambulances-slow": NHS,
  "where-does-tax-go": {
    about: "on tax",
    parties: {
      labour: "No rises in income tax, National Insurance or VAT rates, corporation tax capped at 25%, and VAT on private school fees.",
      conservative: "Cut employee National Insurance by a further 2p, to 6% by April 2027, and scrap the main rate for the self-employed within five years.",
      "liberal-democrat": "Reverse recent cuts to capital gains tax for the highest earners, to pay for public services.",
      "reform-uk": "Raise the income tax threshold to £20,000, scrap IR35 rules for the self-employed and cut stamp duty.",
      green: "A wealth tax of 1% on assets over £10 million and 2% over £1 billion, tax on investment income at the same rates as pay, and no upper limit on National Insurance, which it estimates could raise £50 to £70 billion a year.",
      "plaid-cymru": "A wealth tax, a higher windfall tax on energy firms, VAT on private school fees and capital gains taxed at the same rates as income.",
    },
  },
  "is-debt-too-high": {
    about: "on public spending and debt",
    parties: {
      labour: "Strict fiscal rules: pay for day-to-day spending from taxes, get debt falling as a share of the economy, and hold one Budget a year checked by the OBR.",
      conservative: "Keep debt falling as a share of the economy, with slower growth in welfare spending and a crackdown on tax avoidance.",
      "reform-uk": "Pay for tax cuts by cutting what it calls wasteful public spending and consultancy costs.",
      green: "Borrow to invest rather than follow the current fiscal rules, and raise money with a wealth tax and a carbon tax.",
      "liberal-democrat": "Get national debt falling as a share of the economy, and make sure day-to-day spending does not exceed what is raised in tax.",
    },
  },
  "what-is-immigration-level": IMMIGRATION,
  "why-population-growing": IMMIGRATION,
  "why-small-boats": BOATS,
  "why-asylum-hotels": {
    about: "on asylum claims and hotels",
    parties: {
      labour: "Clear the backlog of asylum claims by hiring more decision-makers, and set up a new returns and enforcement unit.",
      conservative: "Remove people who arrive by small boat to Rwanda, as a deterrent.",
      "liberal-democrat": "Let asylum seekers work after three months and clear the backlog of claims.",
      snp: "Give asylum seekers the right to work, and house them in accommodation that is safe, suitable and dignified.",
    },
  },
  "why-economy-slow": {
    about: "on growth",
    parties: {
      labour: "Make growth its first mission, aiming for the highest sustained growth in the G7, with planning reform, a National Wealth Fund and an industrial strategy.",
      conservative: "Cut National Insurance, keep the \"full expensing\" tax break for business investment and cut red tape.",
      "liberal-democrat": "Closer trade ties with the EU, with a long-term aim of rejoining the single market.",
      "reform-uk": "Cut taxes and regulation and scrap the costs of net zero.",
      green: "An average of £40 billion a year of green investment over the parliament, paid for partly by taxes on wealth.",
      snp: "Rejoin the EU and the single market, which it says would repair damage done by Brexit.",
      "plaid-cymru": "An Economic Fairness Bill to narrow the gap in performance between the UK's nations and regions, with fair funding for Wales.",
    },
  },
  "why-wages-stagnant": {
    about: "on pay and work",
    parties: {
      labour: "Ban exploitative zero-hours contracts, end \"fire and rehire\" and make the minimum wage a genuine living wage.",
      conservative: "Cut National Insurance so employees keep more of their pay.",
      "reform-uk": "Raise the income tax threshold to £20,000 so lower earners keep more of their pay.",
      green: "Raise the minimum wage to £15 an hour for all ages and give every worker the same rights from their first day.",
      snp: "Devolve employment rights and the minimum wage, scrap zero-hours contracts and raise the minimum wage to at least the level of the national living wage.",
    },
  },
  "why-not-working": {
    about: "on people out of work through illness",
    parties: {
      labour: "Reform the Jobcentre system into a service that helps people into work, with more mental health support.",
      conservative: "Overhaul the fit note and the work capability assessment so GPs are no longer the main route to a sick note, and save £12 billion a year in welfare spending.",
      "reform-uk": "Withdraw benefits from job seekers who do not take a job within four months or after two offers, with face-to-face and independent medical assessments for disability benefits.",
    },
  },
  "is-crime-rising": {
    about: "on crime and policing",
    parties: {
      labour: "Recruit 13,000 more neighbourhood police officers, community support officers and special constables, with new Respect Orders to tackle anti-social behaviour.",
      conservative: "Recruit 8,000 more police officers over three years, with tougher sentences for serious and repeat offenders and more prison places.",
      "reform-uk": "Recruit 40,000 more police officers over five years, with zero tolerance policing.",
      "plaid-cymru": "Hand full powers over justice and policing to Wales.",
      "liberal-democrat": "Restore community policing and make sure every burglary is properly investigated.",
    },
  },
  "north-south-divide": {
    about: "on regional inequality",
    parties: {
      labour: "Give more powers to mayors and councils in England and set up a National Wealth Fund to invest across the regions.",
      "plaid-cymru": "Reform how Wales is funded, and secure the £4 billion it says it is owed from the HS2 rail project.",
    },
  },
};

ANSWER_POSITIONS["what-is-national-insurance"] = ANSWER_POSITIONS["where-does-tax-go"];
ANSWER_POSITIONS["are-young-people-struggling-for-jobs"] = {
  about: "on jobs for young people",
  parties: {
    labour: "A youth guarantee: access to training, an apprenticeship or help to find work for every 18 to 21 year old.",
    conservative: "Bring in mandatory National Service for all 18 year olds, with a choice between a competitive military placement or civic service.",
    "liberal-democrat": "Invest in more apprenticeships and bring in Lifelong Skills Grants for adults to spend on training.",
  },
};
ANSWER_POSITIONS["why-are-there-strikes"] = {
  about: "on strikes and union law",
  parties: {
    labour: "Bring in its New Deal for Working People in full within 100 days, strengthening the collective voice of workers and their unions. The plan includes repealing the Trade Union Act 2016 and the minimum service levels law.",
    green: "Repeal the anti-union laws and bring in a Charter of Workers' Rights, with the right to strike at its heart.",
    conservative: "Keep implementing the law on minimum service levels, to balance the right to strike against the rights of the public.",
    snp: "Repeal the Strikes (Minimum Service Levels) Act and protect the right to strike.",
  },
};
ANSWER_POSITIONS["benefits-and-pensions-spending"] = {
  about: "on benefits",
  parties: {
    conservative: "Save £12 billion a year in welfare spending by overhauling the fit note and the work capability assessment, and using more sanctions for people who refuse work.",
    snp: "Scrap the two-child benefit cap and bring in an \"essentials guarantee\", so everyone can afford basics such as food and energy.",
    "reform-uk": "Withdraw benefits from job seekers who do not take a job within four months or after two offers, with face-to-face and independent medical assessments for disability benefits.",
    "plaid-cymru": "Scrap the two-child limit and the benefit cap, and raise Child Benefit by £20 a week.",
  },
};
ANSWER_POSITIONS["is-the-nhs-short-of-staff"] = NHS;
ANSWER_POSITIONS["what-is-the-triple-lock"] = {
  about: "on the state pension",
  parties: {
    labour: "Keep the triple lock for the whole parliament.",
    conservative: "Keep the triple lock and add a \"triple lock plus\", so the tax-free allowance for pensioners rises as fast as the state pension.",
    "liberal-democrat": "Keep the triple lock on the state pension.",
    snp: "Keep the triple lock and move towards a wellbeing pension.",
    "plaid-cymru": "Keep the triple lock, so the state pension keeps pace with prices and the cost of living.",
  },
};

ANSWER_POSITIONS["how-much-does-uk-spend-on-defence"] = {
  about: "on defence spending",
  parties: {
    labour: "Spend 2.5% of national income on defence and publish a path to reach it, without setting a date.",
    conservative: "Reach 2.5% of national income on defence by 2030.",
    "liberal-democrat": "Increase defence spending every year, treating 2.5% of national income as an ambition.",
    "reform-uk": "Reach 2.5% of national income on defence within three years and 3% within six.",
  },
};
ANSWER_POSITIONS["why-uk-has-nuclear-weapons"] = {
  about: "on the nuclear deterrent",
  parties: {
    labour: "Keep the nuclear deterrent, including the new Dreadnought submarines.",
    conservative: "Keep the Trident nuclear deterrent and the submarines that carry it.",
    "liberal-democrat": "Keep the nuclear deterrent with four submarines providing continuous cover at sea, while pursuing multilateral disarmament.",
    green: "Cancel Trident and press the UK to sign the United Nations treaty banning nuclear weapons.",
    "plaid-cymru": "Oppose renewing Trident and scrap it.",
    snp: "Scrap Trident and spend the money on conventional defence and public services.",
  },
};
ANSWER_POSITIONS["is-university-worth-it"] = {
  about: "on university fees and funding",
  parties: {
    conservative: "Close university courses in England with the worst outcomes for students, and use the savings to create 100,000 more apprenticeships a year.",
    "liberal-democrat": "Bring back maintenance grants for the most disadvantaged students.",
    green: "Abolish tuition fees and bring back maintenance grants.",
    snp: "Defend free university tuition for Scottish students.",
  },
};
ANSWER_POSITIONS["why-schools-short-of-teachers"] = {
  about: "on schools and teachers",
  parties: {
    labour: "Recruit 6,500 more teachers in key subjects, paid for by ending tax breaks for private schools.",
    "liberal-democrat": "A teacher workforce strategy so every secondary school child is taught by a specialist in their subject, and an independent pay review body with fully funded pay rises.",
    green: "Reduce pressure in schools by ending high-stakes formal testing at primary and secondary level and abolishing Ofsted.",
  },
};
ANSWER_POSITIONS["why-private-schools-charge-vat"] = {
  about: "on private school fees",
  parties: {
    labour: "Add VAT to private school fees and end their business rates relief, to pay for 6,500 more state school teachers.",
    green: "Remove the charitable status and the VAT exemption from private schools.",
    "plaid-cymru": "Bring in VAT on private school fees.",
    "reform-uk": "Take VAT off private school fees and give 20% tax relief on independent school fees.",
  },
};

ANSWER_POSITIONS["debt-or-deficit"] = ANSWER_POSITIONS["is-debt-too-high"];
ANSWER_POSITIONS["why-state-pension-age-rising"] = {
  about: "on the state pension age",
  parties: {
    snp: "Oppose any further rise in the state pension age, and any speeding up of the changes already planned.",
  },
};
ANSWER_POSITIONS["how-much-tax-goes-unpaid"] = {
  about: "on tax avoidance and evasion",
  parties: {
    labour: "Abolish non-dom status, end the use of offshore trusts to avoid inheritance tax, and modernise HMRC and strengthen its powers, with a focus on large businesses and the wealthy.",
    conservative: "Raise at least a further £6 billion a year by tackling tax avoidance and evasion by the end of the parliament.",
    "liberal-democrat": "Give HMRC the resources to tackle avoidance and evasion, and push for a global minimum rate of corporation tax of 21%.",
    green: "Clamp down on tax dodging, strengthen global agreements against corporate avoidance and make sure HMRC has the resources to narrow the gap between tax due and tax paid.",
    snp: "With full tax powers, crack down on avoidance and evasion and make international companies more open about the tax they pay.",
    "plaid-cymru": "Crack down on tax evasion and avoidance and abolish loopholes for non-doms.",
  },
};
ANSWER_POSITIONS["why-high-streets-struggling"] = {
  about: "on high streets and business rates",
  parties: {
    labour: "Replace business rates in England with a new system that raises the same money but levels the playing field between the high street and online giants.",
    conservative: "Keep easing business rates for high street, leisure and hospitality firms, by raising over time the rate paid on warehouses that serve online shopping.",
    "liberal-democrat": "Abolish business rates and replace them with a Commercial Landowner Levy to help high streets.",
    "reform-uk": "Abolish business rates for small firms on the high street, paid for by a 4% Online Delivery Tax on large multinational companies.",
    green: "Let councils exempt socially and economically essential local businesses from business rates.",
    "plaid-cymru": "Reform business rates in Wales with a lower rate for high street retail and hospitality, and invest in high streets to keep shops open.",
  },
};
ANSWER_POSITIONS["why-council-tax-rising"] = {
  about: "on council tax",
  parties: {
    conservative: "Promise no new council tax bands, no revaluation and no cuts to discounts, and give local people the final say on council tax rises.",
    "liberal-democrat": "Let councils increase council tax by up to 500% where homes are bought as second homes.",
    green: "Revalue council tax bands to reflect changes in house values since the 1990s.",
  },
};
ANSWER_POSITIONS["why-food-prices-rising"] = {
  about: "on food prices",
  parties: {
    labour: "Reduce food prices by removing barriers to businesses trading.",
    "liberal-democrat": "Tackle rising food prices with a National Food Strategy.",
    "reform-uk": "Give the Competition and Markets Authority the power to stop supermarket price fixing and make sure prices are fair.",
  },
};
ANSWER_POSITIONS["what-does-boe-do"] = {
  about: "on the Bank of England",
  parties: {
    labour: "Keep a strong, independent Bank of England with its 2% inflation target.",
    "liberal-democrat": "Protect the Bank of England's independence and keep the 2% inflation target.",
    "reform-uk": "Stop the Bank of England paying interest to commercial banks on its quantitative easing reserves, which Reform says would save about £35 billion a year.",
    green: "Change the Bank's mandate so that funding the shift to a sustainable economy becomes a central goal alongside stable prices.",
  },
};
ANSWER_POSITIONS["why-mortgage-rates-high"] = {
  about: "on mortgage rates",
  parties: {
    labour: "Keep mortgage rates as low as possible, with strict fiscal rules and a strong, independent Bank of England.",
    "liberal-democrat": "Get mortgage rates under control through careful management of the economy.",
  },
};

export function positionsFor(answerId) {
  const entry = ANSWER_POSITIONS[answerId];
  if (!entry) return null;
  const parties = POSITION_PARTY_ORDER.filter((k) => entry.parties[k]).map((k) => ({ key: k, text: entry.parties[k] }));
  return parties.length ? { about: entry.about, parties } : null;
}
