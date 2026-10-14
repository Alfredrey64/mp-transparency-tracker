// What the Defence page says that is not in defenceData.json (SIPRI's long run, built by scripts/build-defence-data.mjs): spending as NATO and the
// Ministry of Defence count it, the government's promises, and the armed forces' numbers.

export const CHECKED = "14 October 2026";

export const SOURCES = {
  sipri: { label: "SIPRI Military Expenditure Database, 1949 to 2025", url: "https://www.sipri.org/databases/milex" },
  modBulletin: { label: "Ministry of Defence, Finance and economics annual statistical bulletin: international defence 2025", url: "https://www.gov.uk/government/publications/international-defence-expenditure-2025/finance-and-economics-annual-statistical-bulletin-international-defence-2025" },
  nato: { label: "NATO, Defence expenditure of NATO countries 2014 to 2025", url: "https://www.nato.int/content/dam/nato/webready/documents/finance/def-exp-2025-en.pdf" },
  personnel: { label: "Ministry of Defence, Quarterly service personnel statistics: 1 July 2026", url: "https://www.gov.uk/government/statistics/quarterly-service-personnel-statistics-2026/quarterly-service-personnel-statistics-1-july-2026" },
  investmentPlan: { label: "Ministry of Defence, The Defence Investment Plan (2026)", url: "https://assets.publishing.service.gov.uk/media/6a44e989167a99cf0018da38/The_Defence_Investment_Plan.pdf" },
  commonsLibrary: { label: "House of Commons Library, UK defence spending", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-8175/" },
};

// Defence spending as the NATO alliance counts it, percent of GDP (the Ministry of Defence's bulletin and the Commons Library's account of NATO figures).
export const NATO_COUNT = [
  { year: 2023, value: 2.25, note: "" },
  { year: 2024, value: 2.33, note: "" },
  { year: 2025, value: 2.3, note: "NATO estimate" },
  { year: 2026, value: 2.6, note: "Expected, NATO estimate" },
];

// What the government and NATO have committed to.
export const PROMISES = [
  { when: "2006", text: "NATO members agreed a guideline of spending at least 2% of the economy on defence. The UK has met it every year since." },
  { when: "By 2027", text: "The government committed in February 2025 to spending 2.5% of GDP on defence by 2027, on the NATO count. With extra spending on security and intelligence it counts this as 2.6%." },
  { when: "Next Parliament", text: "The government has also committed to 3% of GDP on defence in the next Parliament." },
  { when: "By 2035", text: "At their 2025 summit NATO allies agreed to spend at least 3.5% of GDP on core defence by 2035, plus up to 1.5% on wider security and resilience such as infrastructure and cyber defence." },
];

// UK Armed Forces, 1 July 2026 (Ministry of Defence).
export const FORCES = {
  date: "1 July 2026",
  total: 182980, totalChange: 2210,
  trained: 127060, trainedChange: 880,
  navy: 28260, army: 70950, airForce: 27850,
  reserves: 28880,
  intake: 14500, outflow: 13050,
};

// Where the UK sits (Ministry of Defence bulletin, 2024).
export const RANKING = {
  year: 2024,
  natoBySpending: "Third",
  natoSpendingBn: 84.2,
  perHeadUsd: 1216,
  poland: 3.79,
  countriesMeetingGuideline: 18,
};
