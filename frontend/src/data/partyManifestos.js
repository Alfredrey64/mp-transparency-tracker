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
    manifestoTitle: "Clear Plan. Bold Action. Secure Future.",
    manifestoYear: 2024,
    manifestoUrl: "https://public.conservatives.com/publicweb/GE2024/Accessible-Manifesto/Large-Print-Conservative-Manifesto.pdf",
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
      "A right to see a GP within seven days, or within 24 hours if it is urgent",
      "Introduce proportional representation for Westminster elections",
      "Reverse Conservative-era capital gains tax cuts to fund public services",
      "Tougher regulation of water companies over sewage discharges",
    ],
    sections: [
      {
        heading: "Health & Care",
        points: [
          "Free personal care for older and disabled people",
          "A right to see a GP within seven days, or within 24 hours if urgent",
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
    manifestoUrl: "https://assets.nationbuilder.com/reformuk/pages/253/attachments/original/1718625371/Reform_UK_Our_Contract_with_You.pdf",
    highlights: [
      "Freeze non-essential immigration and leave the European Convention on Human Rights",
      "Scrap net zero targets and related subsidies",
      "Raise the point at which people start paying Income Tax to £20,000",
      "Fast-track new North Sea oil and gas licences",
      "Cut what they describe as wasteful public-sector and consultancy spending",
    ],
    sections: [
      {
        heading: "Immigration",
        points: [
          "Freeze non-essential immigration",
          "Leave the European Convention on Human Rights",
          "Return people who cross the Channel in small boats to France",
          "Higher employer National Insurance for hiring foreign workers",
        ],
      },
      {
        heading: "Economy & Tax",
        points: [
          "Raise the Income Tax personal allowance",
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
      "A wealth tax of 1% on assets over £10 million and 2% over £1 billion",
      "Invest £29 billion over five years to insulate homes, as part of a ten-year programme",
      "Bring rail, water and the big five energy retailers back into public ownership",
      "Introduce proportional representation",
      "Free personal social care for older and disabled people",
    ],
    sections: [
      {
        heading: "Tax & Economy",
        points: [
          "A wealth tax on very large fortunes",
          "Tax investment income at the same rates as pay, and remove the upper limit on National Insurance",
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
    manifestoTitle: "A Future Made in Scotland",
    manifestoYear: 2024,
    manifestoUrl: "https://ucrel.lancs.ac.uk/wmatrix/ukmanifestos2024/localpdf/SNP.pdf",
    highlights: [
      "A mandate to negotiate independence if the SNP wins a majority of Scottish seats",
      "Scrap the two-child benefit cap UK-wide",
      "Increase NHS funding and cut waiting times in Scotland",
      "Seek Scottish EU membership as an independent country",
      "Ask the UK government to match its £500 million Just Transition Fund for the North East and Moray",
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
          "Press the UK government to invest at least £28 billion a year in the green economy, with a public stake in new energy projects",
          "Invest in Scottish renewable energy jobs",
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
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/dup/dup_2024-07-04_ge_man.pdf",
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
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/sf/sf_2024-07-04_ge_man.pdf",
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
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/sdlp/sdlp_2024-07-04_ge_man.pdf",
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
    manifestoUrl: "https://cain.ulster.ac.uk/issues/politics/docs/apni/apni_2024-07-04_ge_man.pdf",
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
