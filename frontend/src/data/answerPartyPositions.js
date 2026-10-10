// "What each party said it would do": for the questions where a party can offer a plan, a short summary of the clearest commitments in
// each party's 2024 general election manifesto, written in our own words (the manifestos are copyrighted, so we link to them).
//
// A party appears under a question only where it made a clear commitment we are confident about. A missing party does not mean it has no
// view, so the page says so. Manifestos are from before the election, and parties change their policies, so every list is dated and the
// page sends readers to each party's own site for the latest. Keys match PARTY_MANIFESTOS in data/partyManifestos.js.
//
// Each entry is: { about, parties: { <party key>: "what it said" } }.

export const POSITIONS_AS_OF = "the 2024 general election manifestos";
export const POSITION_PARTY_ORDER = ["labour", "conservative", "liberal-democrat", "reform-uk", "green"];

const NHS = {
  about: "on the NHS",
  parties: {
    labour: "40,000 more appointments, scans and operations every week, doubling the number of cancer scanners and recruiting 8,500 more mental health staff, paid for by closing tax loopholes such as non-dom status.",
    conservative: "Increase NHS spending above inflation every year and recruit 92,000 more nurses and 28,000 more doctors, with new diagnostic and surgical hubs.",
    "liberal-democrat": "A guaranteed GP appointment for anyone who needs one, free personal care for older and disabled people, and more pay for care workers.",
    "reform-uk": "Tax cuts for front-line NHS and social care staff, and tax relief on private health insurance to take pressure off the NHS.",
    green: "An extra £20 billion for NHS budgets over the parliament, and free personal social care for older and disabled people.",
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
  },
};

const BOATS = {
  about: "on small boat crossings",
  parties: {
    labour: "Scrap the Rwanda scheme and set up a Border Security Command with counter-terrorism style powers to go after smuggling gangs, with more returns of people with no right to stay.",
    conservative: "Keep the Rwanda scheme, with regular flights, and leave the European Convention on Human Rights if it blocks removals.",
    "liberal-democrat": "Scrap the Rwanda scheme, work with France and other countries on crossings, and open more safe and legal routes.",
    "reform-uk": "Leave the European Convention on Human Rights, repeal the Human Rights Act and process asylum claims offshore.",
    green: "Scrap the Rwanda scheme and replace it with safe and legal routes for asylum seekers.",
  },
};

const ENERGY = {
  about: "on energy and net zero",
  parties: {
    labour: "Set up Great British Energy, a publicly owned clean power company, aim for clean electricity by 2030, run a Warm Homes Plan to insulate homes and grant no new North Sea oil and gas licences.",
    conservative: "Hold annual licensing rounds for new North Sea oil and gas, build more nuclear power and keep the 2050 net zero target.",
    "liberal-democrat": "A nationwide home insulation programme to cut bills, with net zero reached by 2045.",
    "reform-uk": "Scrap net zero targets and green levies, take VAT off energy bills and fast-track new North Sea oil and gas licences.",
    green: "Insulate 19 million homes over ten years, bring energy back into public ownership, oppose new oil and gas licences and reach net zero sooner.",
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
    },
  },
  "why-rents-rising": {
    about: "on renting",
    parties: {
      labour: "End \"no fault\" evictions straight away and bring in Awaab's Law, so landlords have to fix damp and mould quickly.",
      conservative: "Bring in the Renters Reform Bill to end \"no fault\" evictions once the courts can cope.",
      "liberal-democrat": "End \"no fault\" evictions and give renters more security.",
      green: "Bring in rent controls and end \"no fault\" evictions.",
    },
  },
  "why-prices-rising": {
    about: "on the cost of living",
    parties: {
      labour: "No rises in income tax, National Insurance or VAT rates for working people, plus a Warm Homes Plan and a ban on exploitative zero-hours contracts.",
      conservative: "Cut employee National Insurance by a further 2p, towards halving it by 2027, and protect pensioners with a \"triple lock plus\".",
      "liberal-democrat": "A nationwide home insulation programme to bring energy bills down.",
      "reform-uk": "Raise the income tax threshold to £20,000 and take VAT off energy bills.",
      green: "Insulate 19 million homes over ten years and raise money from a wealth tax on the richest.",
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
      conservative: "Cut employee National Insurance by a further 2p, abolish the main rate for the self-employed over time and keep pensions income tax free.",
      "liberal-democrat": "Reverse recent cuts to capital gains tax for the highest earners, to pay for public services.",
      "reform-uk": "Raise the income tax threshold to £20,000 and the higher-rate threshold, and scrap IR35 rules for the self-employed.",
      green: "A wealth tax on the richest 1% and higher corporation tax on large firms, raising about £150 billion a year by the end of the parliament.",
    },
  },
  "is-debt-too-high": {
    about: "on public spending and debt",
    parties: {
      labour: "Strict fiscal rules: pay for day-to-day spending from taxes, get debt falling as a share of the economy, and hold one Budget a year checked by the OBR.",
      conservative: "Keep debt falling as a share of the economy, with slower growth in welfare spending and a crackdown on tax avoidance.",
      "reform-uk": "Pay for tax cuts by cutting what it calls wasteful public spending and consultancy costs.",
      green: "Higher public investment, paid for by new taxes on wealth and large companies.",
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
      "reform-uk": "Process asylum claims offshore and leave the European Convention on Human Rights.",
    },
  },
  "why-economy-slow": {
    about: "on growth",
    parties: {
      labour: "Make growth its first mission, aiming for the highest sustained growth in the G7, with planning reform, a National Wealth Fund and an industrial strategy.",
      conservative: "Cut National Insurance, keep the \"full expensing\" tax break for business investment and cut red tape.",
      "liberal-democrat": "Closer trade ties with the EU, with a long-term aim of rejoining the single market.",
      "reform-uk": "Cut taxes and regulation and scrap the costs of net zero.",
      green: "A large public investment programme in green infrastructure, paid for by taxes on wealth.",
    },
  },
  "why-wages-stagnant": {
    about: "on pay and work",
    parties: {
      labour: "Ban exploitative zero-hours contracts, end \"fire and rehire\" and make the minimum wage a genuine living wage.",
      conservative: "Cut National Insurance so employees keep more of their pay.",
      "reform-uk": "Raise the income tax threshold to £20,000 so lower earners keep more of their pay.",
    },
  },
  "why-not-working": {
    about: "on people out of work through illness",
    parties: {
      labour: "Reform the Jobcentre system into a service that helps people into work, with more mental health support.",
      conservative: "Reform fit notes so GPs are no longer the main route to sick notes, and tighten the rules on benefits for those able to work.",
    },
  },
  "is-crime-rising": {
    about: "on crime and policing",
    parties: {
      labour: "Recruit 13,000 more neighbourhood police officers, community support officers and special constables, with new Respect Orders to tackle anti-social behaviour.",
      conservative: "Recruit 8,000 more police officers, with tougher sentences for serious and repeat offenders and more prison places.",
    },
  },
  "north-south-divide": {
    about: "on regional inequality",
    parties: {
      labour: "Give more powers to mayors and councils in England and set up a National Wealth Fund to invest across the regions.",
    },
  },
};

export function positionsFor(answerId) {
  const entry = ANSWER_POSITIONS[answerId];
  if (!entry) return null;
  const parties = POSITION_PARTY_ORDER.filter((k) => entry.parties[k]).map((k) => ({ key: k, text: entry.parties[k] }));
  return parties.length ? { about: entry.about, parties } : null;
}
