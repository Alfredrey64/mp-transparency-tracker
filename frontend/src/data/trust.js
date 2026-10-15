// What the Trust in politics page says that is not in trustData.json (built by scripts/build-trust-data.mjs): where each figure comes from, and the
// survey results from the British Social Attitudes survey, each with the date NatCen published it. They are as published; none is recalculated.

export const CHECKED = "15 October 2026";

export const SOURCES = {
  oecd: { label: "OECD, Government at a Glance 2025: Trust Survey (2021 and 2023)", url: "https://sdmx.oecd.org/public/rest/dataflow/OECD.GOV.GIP/DSD_GOV_INT@DF_GOV_TDG_2025/1.1" },
  ons: { label: "ONS, Trust in government, UK: 2023", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/wellbeing/bulletins/trustingovernmentuk/2023" },
  bsa41: { label: "NatCen, Trust and confidence in Britain's system of government at record low (British Social Attitudes, 12 June 2024)", url: "https://natcen.ac.uk/news/trust-and-confidence-britains-system-government-record-low" },
  bsa42: { label: "Research Live, Public trust in government sees further decline (British Social Attitudes, 25 June 2025)", url: "https://www.research-live.com/article/news/public-trust-in-government-sees-further-decline/id/5140263" },
  results: { label: "UK Parliament, Election results for the 4 July 2024 general election", url: "https://electionresults.parliament.uk/general-elections/6" },
  history: { label: "UK Parliament, UK general election results 1832 to 2019; House of Commons Library, 1945 totals", url: "https://electionresults.parliament.uk/" },
};

// British Social Attitudes: the share who say they "almost never" trust governments of any party to put the nation's needs above the party's, and
// related questions, as reported by NatCen on 12 June 2024 (the 41st report). Percentages of all adults.
export const BSA = {
  almostNeverGovernment: 45,
  almostNeverGovernmentRise: 22,
  almostNeverTruth: 58,
  systemNeedsImproving: 79,
  favourChangingVotingSystem: 53,
  keepVotingSystem: 40,
  strugglingNeverTruth: 72,
  comfortableNeverTruth: 49,
  dissatisfiedNhsNeverGovernment: 52,
  satisfiedNhsNeverGovernment: 32,
  interestWhenDistrust: 31,
  interestWhenTrust: 47,
};
// The share who trust governments of any party to put the country's interest before the party's "just about always" or "most of the time": 14% in
// the 2023 survey, a record low then, and 12% in the 2024 survey, published on 25 June 2025.
export const BSA_TRUST = { y2023: 14, y2024: 12 };
