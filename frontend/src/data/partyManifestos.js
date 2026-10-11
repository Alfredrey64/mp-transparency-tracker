// Objective summaries of each party's most recent UK general election
// manifesto (2024), written independently rather than copied from the
// documents themselves — manifestos are copyrighted, so this app links to
// the official source for the full text instead of reproducing it.
//
// `matchNames` are lower-cased exact matches against the `party` field the
// UK Parliament Members API returns (members-api.parliament.uk), which is
// what `politicians.party` in the database is populated from.
//
// `manifestoUrl` points at the 2024 general election document itself, not the party's home page, because party sites move on to newer
// manifestos (a party's current Scottish, Welsh or later UK one). Where the party no longer hosts the 2024 file at a stable address, the link
// goes to a university archive's copy: Lancaster University (UCREL) for the SNP and Plaid Cymru, and Ulster University (CAIN) for the
// Northern Ireland parties. Check these still work when manifestos are next reviewed.
export const PARTY_MANIFESTOS = [
  {
    key: "labour",
    matchNames: ["labour", "labour (co-op)"],
    shortName: "Labour",
    manifestoTitle: "Change",
    manifestoYear: 2024,
    manifestoUrl: "https://labour.org.uk/change/",
    highlights: [
      "No rises in Income Tax, National Insurance or VAT rates for working people",
      "Set up Great British Energy, a publicly owned clean power company, and aim for zero-carbon electricity by 2030",
      "Build 1.5 million new homes in England by reforming the planning system",
      "40,000 more NHS appointments, scans and operations every week, including evenings and weekends, paid for by closing non-dom tax loopholes",
      "Create a Border Security Command with counter-terrorism style powers to go after smuggling gangs",
    ],
    sections: [
      {
        heading: "Economy & Tax",
        points: [
          "Keep Corporation Tax at its current rate of 25% for the parliament",
          "Hold one major fiscal event (a Budget) a year, so businesses and families get warning of tax changes",
          "Abolish non-dom status and end the use of offshore trusts to avoid inheritance tax",
          "A National Wealth Fund to invest alongside business in the industries of the future",
        ],
      },
      {
        heading: "Work & Pay",
        points: [
          "Bring in the New Deal for Working People in full within 100 days",
          "Ban exploitative zero-hours contracts and end fire and rehire",
          "Basic rights from day one, including sick pay, parental leave and protection from unfair dismissal",
        ],
      },
      {
        heading: "Health & Care",
        points: [
          "Double the number of NHS CT and MRI scanners",
          "8,500 more mental health staff",
          "A Fair Pay Agreement in adult social care, as a step towards a National Care Service",
        ],
      },
      {
        heading: "Immigration & Borders",
        points: [
          "A new Border Security Command with hundreds of new investigators and counter-terrorism style powers",
          "Scrap the Rwanda scheme and use the money for the Command",
          "Hire more caseworkers to clear the asylum backlog and end the use of asylum hotels",
          "Bring net migration down by linking immigration and skills policy, so employers train local workers",
        ],
      },
      {
        heading: "Energy & Environment",
        points: [
          "Great British Energy, a new publicly owned clean energy company",
          "No new licences to explore new oil and gas fields, while keeping existing licences",
          "A Warm Homes Plan with an extra £6.6 billion to upgrade five million homes to cut bills",
        ],
      },
      {
        heading: "Education & Young People",
        points: [
          "End the VAT exemption and business rates relief for private schools, to recruit 6,500 new teachers",
          "Free breakfast clubs in every primary school",
          "A guarantee of training, an apprenticeship or help to find work for all 18 to 21 year olds",
          "A new body, Skills England, to bring together employers and training providers",
        ],
      },
    ],
  },
  {
    key: "conservative",
    matchNames: ["conservative"],
    shortName: "Conservative",
    manifestoTitle: "Clear Plan. Bold Action. Secure Future.",
    manifestoYear: 2024,
    manifestoUrl: "https://public.conservatives.com/publicweb/GE2024/Accessible-Manifesto/Large-Print-Conservative-Manifesto.pdf",
    highlights: [
      "Cut employee National Insurance by another 2p, to 6% by April 2027, and abolish the main rate for the self-employed by the end of the parliament",
      "A binding legal cap on migration, with Parliament voting on the level every year",
      "Mandatory National Service for all 18 year olds, with a choice between a military placement and civic service",
      "A new Triple Lock Plus: the state pension and the pensioner tax-free allowance rise with the highest of inflation, earnings or 2.5%",
      "Keep the Rwanda scheme, and put security first if a foreign court, including the European Court of Human Rights, stands in the way",
    ],
    sections: [
      {
        heading: "Economy & Tax",
        points: [
          "Take another 2p off employee National Insurance",
          "Abolish the main rate of National Insurance for the self-employed by the end of the parliament",
          "Triple Lock Plus, so the state pension is not dragged into Income Tax",
          "Abolish stamp duty for first-time buyers on homes up to £425,000, with a new Help to Buy scheme",
          "Raise at least a further £6 billion a year by tackling tax avoidance and evasion by the end of the parliament",
        ],
      },
      {
        heading: "Health & Care",
        points: [
          "Increase NHS spending above inflation every year",
          "92,000 more nurses and 28,000 more doctors",
          "More Community Diagnostic Centres, Pharmacy First and new and modernised GP surgeries",
          "Go ahead with the planned cap on social care costs",
        ],
      },
      {
        heading: "Immigration & Borders",
        points: [
          "A binding legal cap on migration that falls every year, with an annual vote in Parliament",
          "Regular flights removing illegal migrants to Rwanda until the boats are stopped",
          "Bring the Illegal Migration Act into force, process asylum claims within six months and end the use of hotels",
        ],
      },
      {
        heading: "Justice & Crime",
        points: [
          "Recruit 8,000 more full-time police officers, so every neighbourhood has a dedicated officer",
          "Toughen sentencing for the worst offenders",
          "Build four new prisons, completing 20,000 new prison places by 2030",
        ],
      },
      {
        heading: "Defence",
        points: [
          "Boost defence spending to the new NATO standard of 2.5% of GDP by 2030",
        ],
      },
      {
        heading: "Young People & Skills",
        points: [
          "National Service for 18 year olds: a year in the armed forces or cyber defence, or one weekend a month volunteering for a year",
          "Create 100,000 more apprenticeships a year in England by the end of the parliament",
          "Close university courses with the worst outcomes for students",
        ],
      },
    ],
  },
  {
    key: "liberal-democrat",
    matchNames: ["liberal democrat"],
    shortName: "Liberal Democrats",
    manifestoTitle: "For a Fair Deal",
    manifestoYear: 2024,
    manifestoUrl: "https://www.libdems.org.uk/manifesto",
    highlights: [
      "Free personal care for older and disabled people, based on the model the party introduced in Scotland",
      "A new right to see a GP within seven days, or within 24 hours if it is urgent, with 8,000 more GPs",
      "Proportional representation for electing MPs and English local councillors",
      "Pay for public services partly by reversing Conservative tax cuts for big banks and raising the Digital Services Tax on tech giants",
      "End the sewage scandal by making water companies public benefit companies and replacing Ofwat with a tougher regulator",
    ],
    sections: [
      {
        heading: "Health & Care",
        points: [
          "Free personal care, based on need and not on ability to pay",
          "A right to see a GP within seven days, or 24 hours if urgent",
          "Guaranteed access to an NHS dentist for everyone needing urgent and emergency care",
          "Mental health hubs for young people in every community, and regular mental health check-ups at key points in life",
        ],
      },
      {
        heading: "Democracy & Constitution",
        points: [
          "Proportional representation for electing MPs",
          "Reform the House of Lords so it has a democratic mandate",
          "Votes at 16",
          "Scrap the voter ID scheme and cap donations to political parties",
        ],
      },
      {
        heading: "Economy",
        points: [
          "Restore the Bank Surcharge and Bank Levy to 2016 levels, reversing Conservative tax cuts for big banks",
          "Raise the Digital Services Tax on big tech firms from 2% to 6%",
          "Reform capital gains tax to close loopholes used by the super wealthy",
          "A 4% tax on share buybacks by FTSE 100 companies",
          "Protect the independence of the Bank of England and keep the 2% inflation target",
        ],
      },
      {
        heading: "Environment",
        points: [
          "A ten-year emergency upgrade programme for homes, starting with free insulation and heat pumps for low-income households",
          "Net zero by 2045",
          "Banning bonuses for water bosses until sewage discharges and leaks end",
        ],
      },
      {
        heading: "Housing, Schools & Defence",
        points: [
          "Build 380,000 homes a year, including 150,000 social homes, with new garden cities",
          "More specialist teachers, and a mental health professional in every school",
          "Bring back maintenance grants for disadvantaged students",
          "Increase defence spending every year, aiming for at least 2.5% of GDP, and keep the nuclear deterrent",
        ],
      },
    ],
  },
  {
    key: "reform-uk",
    matchNames: ["reform uk"],
    shortName: "Reform UK",
    manifestoTitle: "Our Contract with You",
    manifestoYear: 2024,
    manifestoUrl: "https://assets.nationbuilder.com/reformuk/pages/253/attachments/original/1718625371/Reform_UK_Our_Contract_with_You.pdf",
    highlights: [
      "Freeze non-essential immigration and leave the European Convention on Human Rights",
      "Scrap net zero targets and the subsidies that go with them",
      "Lift the point at which people start paying Income Tax to £20,000",
      "Fast-track new North Sea oil and gas licences, and take VAT off energy bills",
      "Cut what Reform describes as wasteful government spending and consultancy costs",
    ],
    sections: [
      {
        heading: "Immigration",
        points: [
          "Freeze non-essential immigration, with exceptions for essential skills, mainly in health care",
          "Leave the European Convention on Human Rights",
          "Pick up people crossing the Channel in small boats and take them back to France",
          "Raise the employer National Insurance rate to 20% for foreign workers, with exemptions for essential health and care workers and very small firms",
          "Stop international students bringing dependants",
        ],
      },
      {
        heading: "Economy & Tax",
        points: [
          "Lift the Income Tax start point to £20,000 a year",
          "Cut the main rate of Corporation Tax from 25% to 20%, then to 15% from year three",
          "Free small firms with profits under £100,000 from Corporation Tax, and lift the VAT threshold to £150,000",
          "Abolish IR35 rules for the self-employed, and scrap Section 24 for landlords",
          "Cut stamp duty to zero on homes under £750,000",
          "Stop the Bank of England paying interest to commercial banks on quantitative easing reserves, which Reform says would save about £35 billion a year",
        ],
      },
      {
        heading: "Energy",
        points: [
          "Scrap net zero targets and renewable energy subsidies",
          "Fast-track North Sea oil and gas licences, and allow shale gas on test sites",
          "Take VAT off energy bills",
        ],
      },
      {
        heading: "Health, Crime & Defence",
        points: [
          "No tax on pay at the basic rate for front-line NHS and social care staff for three years",
          "20% tax relief on private healthcare and health insurance",
          "Recruit 40,000 more police officers over a five-year parliament",
          "Raise defence spending to 2.5% of GDP by year three, then 3% within six years",
        ],
      },
    ],
  },
  {
    key: "green",
    matchNames: ["green party"],
    shortName: "Green Party",
    manifestoTitle: "Real Hope, Real Change",
    manifestoYear: 2024,
    manifestoUrl: "https://greenparty.org.uk/manifesto/",
    highlights: [
      "A wealth tax of 1% on assets over £10 million and 2% over £1 billion",
      "Invest £29 billion over five years to insulate homes, as part of a ten-year programme",
      "Bring rail, water and the big five energy retailers back into public ownership",
      "Replace first past the post with a proportional voting system",
      "Free personal social care for older and disabled people",
    ],
    sections: [
      {
        heading: "Tax & Economy",
        points: [
          "A wealth tax on very large fortunes",
          "Tax investment income at the same rates as pay, and remove the upper limit on National Insurance",
          "A carbon tax on fossil fuels, and windfall taxes on oil and gas producers and on banks",
          "Clamp down on tax dodging and strengthen global agreements against corporate tax avoidance",
          "Borrow to invest, and drop the current fiscal rules",
        ],
      },
      {
        heading: "Environment & Energy",
        points: [
          "Insulate homes to a high standard as part of a ten-year national programme",
          "Reach net zero more than a decade ahead of 2050",
          "No new oil and gas licences, and an end to oil and gas subsidies",
          "Wind to provide around 70% of the UK's electricity by 2030",
        ],
      },
      {
        heading: "Public Ownership & Care",
        points: [
          "Bring the railways, the water companies and the big five retail energy companies into public ownership",
          "Free personal social care, with £20 billion a year of investment and better pay for carers",
          "£20 billion for NHS budgets over the parliament, for hospital building and repair",
        ],
      },
      {
        heading: "Work, Housing & Education",
        points: [
          "A minimum wage of £15 an hour for all ages",
          "150,000 new social homes a year, an end to Right to Buy, rent controls and an end to no-fault evictions",
          "End tuition fees and bring back grants for students, and abolish Ofsted",
          "Rejoin the EU when the political situation allows, with the Customs Union as a first step",
        ],
      },
      {
        heading: "Defence",
        points: [
          "Cancel Trident and push for the UK to sign the UN treaty banning nuclear weapons",
        ],
      },
    ],
  },
  {
    key: "snp",
    matchNames: ["scottish national party"],
    shortName: "SNP",
    manifestoTitle: "A Future Made in Scotland",
    manifestoYear: 2024,
    manifestoUrl: "https://ucrel.lancs.ac.uk/wmatrix/ukmanifestos2024/localpdf/SNP.pdf",
    highlights: [
      "If the SNP wins a majority of Scottish seats, begin negotiations on Scottish independence",
      "Scrap the two-child benefit cap across the UK",
      "Press the UK government to boost NHS spending by at least £10 billion extra a year, and back a bill to keep the NHS in public hands",
      "Rejoin the EU and the single market as an independent country",
      "Scrap Trident and spend the money on conventional defence and public services",
    ],
    sections: [
      {
        heading: "Independence & Constitution",
        points: [
          "If the SNP wins a majority of Scottish seats, the Scottish Government would begin immediate negotiations on independence",
          "Rejoin the EU and re-enter the single market as an independent country",
          "Devolve powers over immigration, employment rights, the minimum wage and energy to Scotland",
        ],
      },
      {
        heading: "Cost of Living",
        points: [
          "An essentials guarantee, so everyone can afford basics such as food and utilities",
          "A statutory social tariff for energy, broadband and mobile, and a cut in energy standing charges",
          "An annual rise in Local Housing Allowance, and a simplified Help to Buy ISA for first-time buyers",
          "Scrap the two-child benefit cap and reverse the cut to Pension Credit",
        ],
      },
      {
        heading: "Work & Pensions",
        points: [
          "Keep the triple lock, move towards a wellbeing pension and oppose any further rise in the state pension age",
          "Full, fast and fair compensation for WASPI women",
          "Scrap zero-hours contracts, ban fire and rehire and raise the minimum wage to at least the level of the national living wage",
          "Repeal the Strikes (Minimum Service Levels) Act and protect the right to strike",
        ],
      },
      {
        heading: "Energy & Economy",
        points: [
          "Press the UK government to invest at least £28 billion a year in the green economy, with a public stake in new energy projects",
          "Ask the UK government to match its £500 million Just Transition Fund for the North East and Moray",
          "Rule out new nuclear power stations in Scotland",
        ],
      },
      {
        heading: "Migration, Defence & Education",
        points: [
          "Scrap the Rwanda scheme, give asylum seekers the right to work and run a rural visa pilot for Scotland",
          "Scrap Trident",
          "Defend free university tuition for Scottish students",
        ],
      },
    ],
  },
  {
    key: "plaid-cymru",
    matchNames: ["plaid cymru"],
    shortName: "Plaid Cymru",
    manifestoTitle: "For Fairness, For Ambition, For Wales",
    manifestoYear: 2024,
    manifestoUrl: "https://ucrel.lancs.ac.uk/wmatrix/ukmanifestos2024/localpdf/PlaidCymru.pdf",
    highlights: [
      "A needs-based funding formula for Wales to replace the Barnett formula, and the £4 billion it says Wales is owed from HS2",
      "Raise Child Benefit by £20 a week, which Plaid says would take 60,000 children out of poverty in Wales",
      "Scrap the two-child limit and the benefit cap",
      "A wealth tax, higher windfall taxes on energy companies, and capital gains taxed at the same rates as income",
      "Transfer justice and policing powers to Wales in full, and a long-term goal of an independent Wales within the EU",
    ],
    sections: [
      {
        heading: "Funding & Tax",
        points: [
          "Replace the Barnett formula with a funding formula based on Wales's needs",
          "Equalise capital gains tax with income tax, raising £12 billion to £15 billion",
          "Support a wealth tax, a higher windfall tax on energy companies, and a cap on bankers' bonuses",
          "Crack down on tax evasion and avoidance and abolish loopholes for non-doms",
          "Reform business rates in Wales, with a lower rate for high street retail and hospitality",
          "Devolve the Crown Estate in Wales",
        ],
      },
      {
        heading: "Health & Care",
        points: [
          "Fair funding from Westminster to invest in the NHS workforce and recruit 500 more GPs in Wales",
          "A National Care Service for Wales, with social care free at the point of use",
        ],
      },
      {
        heading: "Cost of Living & Welfare",
        points: [
          "Raise Child Benefit by £20 a week",
          "Scrap the two-child limit on Universal Credit and end the benefit cap",
          "Keep the triple lock on the state pension",
        ],
      },
      {
        heading: "Housing & Energy",
        points: [
          "A legal Right to Adequate Housing, and action on empty homes, second homes and holiday homes",
          "Devolve Ofgem's responsibilities for Wales and set up a Welsh energy systems operator",
          "Increase the windfall tax on energy companies and promote investment in renewable energy",
        ],
      },
      {
        heading: "Justice, Migration & Constitution",
        points: [
          "Transfer justice and policing powers to Wales in full",
          "Oppose the Rwanda scheme, provide safe routes for asylum seekers and make Wales a Nation of Sanctuary",
          "Restore the UK's overseas aid target of 0.7% of national income",
          "Wales as a sovereign independent nation, rejoining the European Union",
        ],
      },
    ],
  },
  {
    key: "dup",
    matchNames: ["democratic unionist party"],
    shortName: "DUP",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/dup/dup_2024-07-04_ge_man.pdf",
    highlights: [
      "Promote the Union and fully restore Northern Ireland's place in the UK, including removing the application of EU law and the Irish Sea border it creates",
      "Fair and equitable long-term funding for Northern Ireland's NHS and other public services",
      "Oppose the freeze on the personal tax allowance and the higher-rate threshold, and seek further National Insurance cuts",
      "Abolish VAT on domestic electricity bills and keep the fuel duty freeze",
      "Protect Northern Ireland in law against illegal immigration, as part of a UK-wide immigration policy",
    ],
    sections: [
      {
        heading: "The Union & Trade",
        points: [
          "Strengthen the case for the Union between Northern Ireland and the rest of the UK",
          "Fully restore Northern Ireland's place in the UK, including removing EU law and the internal Irish Sea border",
        ],
      },
      {
        heading: "Cost of Living",
        points: [
          "Seek further cuts to National Insurance, and explore a single tax on all income to replace Income Tax and National Insurance",
          "Raise benefits in line with inflation, and keep supporting rises in the national living wage",
          "Freeze Vehicle Excise Duty, keep the fuel duty freeze and abolish VAT on domestic electricity",
        ],
      },
      {
        heading: "Public Services & Defence",
        points: [
          "A long-term fair and equitable funding model for Northern Ireland's needs",
          "Greater integration of Northern Ireland into the UK's defence structures, with a larger RAF and Royal Navy presence",
        ],
      },
      {
        heading: "Other Priorities",
        points: [
          "Back farmers and food security",
          "A fairer, not faster, path to net zero",
          "Invest more in national infrastructure",
          "Stand up for victims of crime",
        ],
      },
    ],
  },
  {
    key: "sinn-fein",
    matchNames: ["sinn féin", "sinn fein"],
    shortName: "Sinn Féin",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/sf/sf_2024-07-04_ge_man.pdf",
    highlights: [
      "The Irish and British governments to set a date for a referendum on Irish unity, with a Citizens' Assembly to prepare",
      "Fair funding for the North to end the chronic underfunding of public services, and an end to Tory cuts",
      "Transfer powers over progressive taxation and the minimum wage to the Executive",
      "Affordable childcare, including for children with special educational needs",
      "Oppose the Legacy Act and uphold victims' rights to truth and justice",
    ],
    sections: [
      {
        heading: "Constitution",
        points: [
          "The Irish and British governments to set a date for a referendum on Irish unity",
          "A Citizens' Assembly to discuss the possibilities of constitutional change",
          "Sinn Féin MPs do not take their seats at Westminster",
        ],
      },
      {
        heading: "Public Services & Funding",
        points: [
          "End the chronic underfunding of public services and the undervaluing of public service workers",
          "Multi-annual budgeting for the Executive, so it can plan investment such as cutting hospital waiting lists",
          "Press for the transfer of fiscal powers to the Executive, including progressive taxation and the minimum wage",
        ],
      },
      {
        heading: "Economy & Workers",
        points: [
          "Strong legal protections for workers and the right to join a trade union",
          "Deliver the Executive's projects: Magee University expansion, the A5 and A6 roads, Casement Park, Narrow Water Bridge and the Ulster Canal",
          "A fair and just transition to net zero",
        ],
      },
      {
        heading: "Society & the Past",
        points: [
          "Oppose the Legacy Act and implement the Stormont House mechanisms",
          "An Ending Violence Against Women and Girls strategy",
          "Parity of esteem for Irish culture and language",
          "Call for an immediate ceasefire in Gaza and a free and independent Palestinian state",
        ],
      },
    ],
  },
  {
    key: "sdlp",
    matchNames: ["social democratic and labour party", "social democratic & labour party", "sdlp"],
    shortName: "SDLP",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/sdlp/sdlp_2024-07-04_ge_man.pdf",
    highlights: [
      "Reduce hospital waiting lists with extra investment in health",
      "An improved funding model for Northern Ireland, and a stronger fiscal framework",
      "Repeal the Legacy Act and deliver justice for victims and survivors",
      "Reform the devolved institutions to prevent vetoes on government and decline in public services",
      "Say the only viable route back into the EU is a new and agreed Ireland",
    ],
    sections: [
      {
        heading: "Public Services & Economy",
        points: [
          "Better public services, with additional investment to reduce hospital waiting lists",
          "An improved funding model for Northern Ireland",
          "A fairer economy for all, with oil and gas companies paying higher taxes on their profits",
        ],
      },
      {
        heading: "Politics & the Past",
        points: [
          "Use votes at Westminster to make sure there is no Conservative government",
          "Seek reform of the devolved institutions to prevent the veto of government",
          "Prioritise repealing the Legacy Act",
        ],
      },
      {
        heading: "Constitution & Europe",
        points: [
          "Aspire to a different constitutional future, with a new conversation on the future of the island in Europe",
          "Say the only viable route back into the EU is a new and agreed Ireland",
        ],
      },
      {
        heading: "International & Environment",
        points: [
          "Recognise the State of Palestine and end arms exports to Israel",
          "Restore nature and support a just transition",
        ],
      },
    ],
  },
  {
    key: "alliance",
    matchNames: ["alliance"],
    shortName: "Alliance",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/apni/apni_2024-07-04_ge_man.pdf",
    highlights: [
      "Reform the Assembly and Executive so no one party can hold the others to ransom",
      "An improved financial settlement for Northern Ireland that reflects its relative need",
      "A Green New Deal to decarbonise the economy, protect workers, tackle fuel poverty and create jobs",
      "Repair the UK-EU relationship, including a comprehensive veterinary agreement",
      "Scrap first past the post and the anti-protest laws, and introduce votes at 16",
    ],
    sections: [
      {
        heading: "Institutions & Funding",
        points: [
          "Abolish the system of designations in the Assembly, and form the Executive through a voluntary coalition",
          "Limit the petition of concern to key issues",
          "Revise fiscal rules to count the costs of environmental inaction and allow investment in climate action",
        ],
      },
      {
        heading: "Economy & Climate",
        points: [
          "A Green New Deal to decarbonise the economy, protect workers, tackle fuel poverty and create thousands of jobs",
        ],
      },
      {
        heading: "Europe & Migration",
        points: [
          "Negotiate a comprehensive veterinary agreement and promote dual market access under the Windsor Framework",
          "A fair, welcoming and effective immigration system that upholds human rights",
        ],
      },
      {
        heading: "Children, Families & Democracy",
        points: [
          "Dedicated funding for integrated education, early years and early intervention, as a successor to Fresh Start",
          "Support for families with childcare costs, through more generous tax relief and a new childcare strategy",
          "Scrap first past the post and the anti-protest laws, and introduce votes at 16",
        ],
      },
    ],
  },
];

const NOT_A_PARTY = new Set(["independent", "speaker"]);

export function isTrackedParty(partyName) {
  if (!partyName) return false;
  return !NOT_A_PARTY.has(partyName.trim().toLowerCase());
}

export function findManifesto(partyName) {
  if (!partyName) return null;
  const normalised = partyName.trim().toLowerCase();
  return PARTY_MANIFESTOS.find((p) => p.matchNames.includes(normalised)) ?? null;
}
