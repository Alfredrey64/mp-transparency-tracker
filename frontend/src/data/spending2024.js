// Spending at the 2024 UK general election, typed in from the Electoral Commission's own releases and the House of Commons Library briefings built on its data, all read on
// 12 November 2026. Every figure is as published; the only arithmetic is adding them up, and spending2024.test.js checks the parts agree with the Commission's total.
//
//   Commission, "First round of general election spending published", 13 February 2025: parties and campaigners that spent £250,000 or less.
//   Commission, "General election spending hits record high", 17 July 2025: those that spent £250,000 or more, and the total.
//   Commons Library CBP-11027 (candidates, from Commission data) and CBP-11019 (parties, from Commission data).

// The seven parties that reported spending £250,000 or more.
export const LARGE_PARTIES = [
  { name: "Labour Party", spent: 30084081, colour: "#C13A4E" },
  { name: "Conservative and Unionist Party", spent: 23874892, colour: "#2F5FB5" },
  { name: "Liberal Democrats", spent: 5623336, colour: "#D98A1E" },
  { name: "Reform UK", spent: 5459027, colour: "#2BA6A6" },
  { name: "Green Party", spent: 1727639, colour: "#4C9A4A" },
  { name: "Scottish National Party (SNP)", spent: 799175, colour: "#B8A02E" },
  { name: "Co-operative Party", spent: 298304, colour: "#7B5BD6" },
];
// The three non-party campaigners that reported spending £250,000 or more.
export const LARGE_CAMPAIGNERS = [
  { name: "National Education Union", spent: 617730 },
  { name: "Best for Britain Limited", spent: 423997 },
  { name: "UNISON: The Public Service Union", spent: 394392 },
];
export const SMALL_PARTIES = { count: 92, nil: 39, spent: 733575 };
export const SMALL_CAMPAIGNERS = { count: 18, spent: 1141630 };
export const CANDIDATES = { spent: 23300000 }; // "£23.3 million", Commons Library CBP-11027
export const REPORTED_TOTAL = 94500000; // "a record high of £94.5m", Commission, 17 July 2025
export const LARGE_TOTAL = 69300000; // "larger political parties and campaigners ... £69.3m", Commission, 17 July 2025

export const sum = (rows) => rows.reduce((n, r) => n + r.spent, 0);
export const largePartiesTotal = sum(LARGE_PARTIES);
export const largeCampaignersTotal = sum(LARGE_CAMPAIGNERS);
export const campaignersTotal = largeCampaignersTotal + SMALL_CAMPAIGNERS.spent;
export const partiesTotal = largePartiesTotal + SMALL_PARTIES.spent;

// What parties and candidates spent money on (Commons Library, from Commission data), as shares of their own totals.
export const PARTY_CATEGORIES = { unsolicited: 38, advertisingAndUnsolicited: 67 };
export const CANDIDATE_UNSOLICITED = 64;
// The share of party advertising spending that went to Facebook/Meta and Google (including YouTube), by general election.
export const ONLINE_SHARE = [
  { year: "2015", pct: 25 },
  { year: "2017", pct: 42 },
  { year: "2019", pct: 52 },
  { year: "2024", pct: 54 },
];
// The share of its own limit that a party spent, according to the Commission's analysis (only these two reached 70%).
export const LIMIT_USED = [
  { name: "Labour Party", pct: 89 },
  { name: "Conservative and Unionist Party", pct: 70 },
];
