// Maps a donor's industry (from lib/donorSectors.js, tagged via Companies
// House) onto the closest matching bill-category label (from lib/bills.js,
// tagged via the bill's sponsoring department) — the bridge that lets the
// app show "this MP took money from sector X, and voted on bills in the
// matching policy area", without pretending to know which came first.
//
// One sector maps to at most one category — a best-fit, not an exhaustive
// list of every plausible connection. Sectors with no sensible policy-area
// match (e.g. "Other / Uncategorised") are left out on purpose rather than
// forced into a category that would overstate the link.
const SECTOR_TO_BILL_CATEGORY = {
  "Energy & Oil/Gas": "Environment & Energy",
  "Mining & Extractives": "Environment & Energy",
  "Agriculture & Food": "Environment & Energy",
  "Tobacco": "Health",
  "Alcohol & Gambling": "Health",
  "Pharma & Healthcare": "Health",
  "Construction & Property": "Housing & Communities",
  "Retail & Consumer": "Economy & Finance",
  "Transport & Logistics": "Transport",
  "Media & Publishing": "Culture & Media",
  "Tech & Telecoms": "Science & Tech",
  "Finance & Banking": "Economy & Finance",
  "Legal & Professional Services": "Justice & Home Affairs",
  "Chemicals & Manufacturing": "Economy & Finance",
  "Defence & Arms": "Defence",
  "Trade Unions": "Work & Pensions",
};

export function sectorToBillCategory(sector) {
  return SECTOR_TO_BILL_CATEGORY[sector] ?? null;
}
