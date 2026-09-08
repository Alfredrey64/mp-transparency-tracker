// Plain-language summaries of each party's most recent UK general election
// manifesto (2024), written independently rather than copied from the
// documents themselves — manifestos are copyrighted, so this app links to
// the official source for the full text instead of reproducing it.
//
// `matchNames` are lower-cased exact matches against the `party` field the
// UK Parliament Members API returns (members-api.parliament.uk), which is
// what `politicians.party` in the database is populated from.
export const PARTY_MANIFESTOS = [
  {
    key: "labour",
    matchNames: ["labour", "labour (co-op)"],
    shortName: "Labour",
    manifestoTitle: "Change",
    manifestoYear: 2024,
    manifestoUrl: "https://labour.org.uk/change/",
    highlights: [
      "No rises to Income Tax, National Insurance, or VAT for working people",
      "Set up Great British Energy, a publicly-owned clean power company, aiming for zero-carbon electricity by 2030",
      "Build 1.5 million new homes in England and reform the planning system",
      "Recruit thousands more NHS staff and add evening/weekend appointments to cut waiting lists",
      "Create a Border Security Command with counter-terror-style powers against smuggling gangs",
    ],
    sections: [
      {
        heading: "Economy & Tax",
        points: [
          "Cap Corporation Tax at 25% for the parliament",
          "One major fiscal event (Budget) per year for business certainty",
          "A new National Wealth Fund pairing public and private investment in green industry",
        ],
      },
      {
        heading: "Health & Care",
        points: [
          "Extra evening and weekend appointments funded by closing non-dom tax loopholes",
          "Double the number of medical scanners",
          "A National Care Service, with a fair pay agreement for care workers",
        ],
      },
      {
        heading: "Immigration & Borders",
        points: [
          "New Border Security Command with counter-terror-style powers",
          "Clear the asylum decision backlog",
          "Link visa sponsorship to employers' training of domestic workers",
        ],
      },
      {
        heading: "Energy & Environment",
        points: [
          "Great British Energy, a new publicly-owned clean energy company",
          "No new North Sea oil and gas exploration licences",
          "A Warm Homes Plan to insulate homes and cut bills",
        ],
      },
      {
        heading: "Education",
        points: [
          "Add VAT to private school fees to fund 6,500 new state school teachers",
          "Breakfast clubs in every primary school",
          "A new body, Skills England, to coordinate training provision",
        ],
      },
    ],
  },
  {
    key: "conservative",
    matchNames: ["conservative"],
    shortName: "Conservative",
    manifestoTitle: "Conservative Party Manifesto",
    manifestoYear: 2024,
    manifestoUrl: "https://www.conservatives.com/our-plan",
    highlights: [
      "Cut employee National Insurance further, and abolish it for the self-employed over time",
      "A binding annual parliamentary vote on a legal cap on migration numbers",
      "Introduce a form of National Service for 18-year-olds",
      "A 'triple lock plus' guaranteeing the state pension stays tax-free",
      "Leave the European Convention on Human Rights if it blocks removals under the Rwanda scheme",
    ],
    sections: [
      {
        heading: "Economy & Tax",
        points: [
          "Further cuts to employee National Insurance",
          "Abolish National Insurance for the self-employed over time",
          "Triple lock plus: state pension income stays free of Income Tax",
        ],
      },
      {
        heading: "Health & Care",
        points: [
          "Above-inflation NHS funding increases every year",
          "New diagnostic and surgical hubs",
          "A lifetime cap on personal care costs so people don't have to sell their home",
        ],
      },
      {
        heading: "Immigration & Borders",
        points: [
          "An annual parliamentary vote on a binding legal migration cap",
          "Continue the Rwanda removals scheme for people arriving via small boats",
          "Leave the ECHR if it stands in the way of removals",
        ],
      },
      {
        heading: "Justice & Crime",
        points: [
          "Recruit more police officers",
          "Tougher, longer sentences for serious and repeat offenders",
          "Expand prison capacity",
        ],
      },
      {
        heading: "National Service",
        points: [
          "A choice of a full-time military placement or a civic/volunteering programme for 18-year-olds",
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
      "Free personal care for older and disabled people",
      "Guarantee a same-day GP appointment for anyone who needs one",
      "Introduce proportional representation for Westminster elections",
      "Reverse Conservative-era capital gains tax cuts to fund public services",
      "Tougher regulation of water companies over sewage discharges",
    ],
    sections: [
      {
        heading: "Health & Care",
        points: [
          "Free personal care for older and disabled people",
          "Guaranteed same-day GP access for urgent need",
          "Regular mental health check-ups for young people",
        ],
      },
      {
        heading: "Democracy & Constitution",
        points: [
          "Proportional representation for electing MPs",
          "Reform of the House of Lords",
          "Votes at 16",
        ],
      },
      {
        heading: "Economy & Environment",
        points: [
          "Reverse recent capital gains tax cuts for the highest earners",
          "A nationwide home insulation programme",
          "Tougher fines and regulation for water companies over sewage discharges",
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
    manifestoUrl: "https://www.reformparty.uk/policies",
    highlights: [
      "Freeze non-essential immigration and leave the European Convention on Human Rights",
      "Scrap net zero targets and related subsidies",
      "Raise the Income Tax personal allowance and the higher-rate threshold",
      "Fast-track new North Sea oil and gas licences",
      "Cut what they describe as wasteful public-sector and consultancy spending",
    ],
    sections: [
      {
        heading: "Immigration",
        points: [
          "Freeze non-essential immigration",
          "Leave the ECHR and repeal the Human Rights Act",
          "Offshore processing of asylum claims",
        ],
      },
      {
        heading: "Economy & Tax",
        points: [
          "Raise the Income Tax personal allowance",
          "Raise the higher-rate Income Tax threshold",
          "Abolish IR35 rules for the self-employed",
        ],
      },
      {
        heading: "Energy",
        points: [
          "Scrap net zero targets and related green levies",
          "Fast-track new North Sea oil and gas licences",
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
      "A wealth tax on the top 1% of earners",
      "Insulate 19 million homes over 10 years",
      "Bring rail, energy, water, and mail back into public ownership",
      "Introduce proportional representation",
      "Free personal social care for older and disabled people",
    ],
    sections: [
      {
        heading: "Tax & Economy",
        points: [
          "A wealth tax on the highest earners",
          "Higher Corporation Tax on large businesses",
          "Close existing tax loopholes",
        ],
      },
      {
        heading: "Environment",
        points: [
          "A 10-year national home insulation programme",
          "Bring forward the UK's net zero target date",
          "Oppose new oil and gas licences",
        ],
      },
      {
        heading: "Public Ownership & Care",
        points: [
          "Renationalise rail, energy, and water",
          "Free personal social care, funded through wealth taxes",
        ],
      },
    ],
  },
  {
    key: "snp",
    matchNames: ["scottish national party"],
    shortName: "SNP",
    manifestoTitle: "Stronger for Scotland",
    manifestoYear: 2024,
    manifestoUrl: "https://www.snp.org/manifesto/",
    highlights: [
      "A mandate for a new independence referendum",
      "Scrap the two-child benefit cap UK-wide",
      "Increase NHS funding and cut waiting times in Scotland",
      "Seek Scottish EU membership as an independent country",
      "A new fund from oil and gas revenue for public services and net zero investment",
    ],
    sections: [
      {
        heading: "Independence & Constitution",
        points: [
          "A mandate to negotiate independence if pro-independence parties win a majority of Scottish seats or votes",
          "Ambition to rejoin the EU as an independent state",
        ],
      },
      {
        heading: "Social Security",
        points: [
          "Scrap the two-child benefit cap across the UK",
          "Increase the Scottish Child Payment",
        ],
      },
      {
        heading: "Economy",
        points: [
          "Direct oil and gas revenue into a new fund for public services and renewables",
          "Invest in Scottish renewable energy jobs",
        ],
      },
    ],
  },
  {
    key: "plaid-cymru",
    matchNames: ["plaid cymru"],
    shortName: "Plaid Cymru",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://www.partyof.wales/manifesto",
    highlights: [
      "A fairer UK funding settlement for Wales, reforming the Barnett formula",
      "Further devolution of policing and justice to Wales",
      "Increased investment in the Welsh NHS",
      "Support for Welsh renewable energy projects",
      "Long-term goal of Welsh independence",
    ],
  },
  {
    key: "dup",
    matchNames: ["democratic unionist party"],
    shortName: "DUP",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://www.mydup.com/",
    highlights: [
      "Defend Northern Ireland's place within the United Kingdom",
      "Remove remaining Irish Sea trade barriers under the Windsor Framework",
      "Support for Northern Ireland's farming and rural economy",
      "Restore and stabilise power-sharing government at Stormont",
    ],
  },
  {
    key: "sinn-fein",
    matchNames: ["sinn féin", "sinn fein"],
    shortName: "Sinn Féin",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://www.sinnfein.ie/manifestos",
    highlights: [
      "Campaign for a border poll on Irish unity",
      "Sinn Féin MPs follow an abstentionist policy and do not take their seats at Westminster",
      "Oppose Westminster spending cuts affecting Northern Ireland",
      "Support all-island cooperation on health and the economy",
    ],
  },
  {
    key: "sdlp",
    matchNames: ["social democratic and labour party", "social democratic & labour party", "sdlp"],
    shortName: "SDLP",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://www.sdlp.ie/",
    highlights: [
      "Support Irish unity by consent, achieved through peaceful and democratic means",
      "Pro-EU, seeking closer UK–EU relations for Northern Ireland",
      "Stable, functioning power-sharing government at Stormont",
      "Increased investment in Northern Ireland's public services",
    ],
  },
  {
    key: "alliance",
    matchNames: ["alliance"],
    shortName: "Alliance",
    manifestoTitle: "Manifesto 2024",
    manifestoYear: 2024,
    manifestoUrl: "https://www.allianceparty.org/manifesto",
    highlights: [
      "Cross-community, non-sectarian politics in Northern Ireland",
      "Reform the Assembly's mandatory community-designation system",
      "Pro-EU and closer UK–EU relations",
      "Expand integrated education and shared housing",
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
