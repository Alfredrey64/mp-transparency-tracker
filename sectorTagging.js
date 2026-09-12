// sectorTagging.js
//
// Shared Companies House lookup/matching logic used by both
// fetch-donor-sectors.js (MP-declared donors) and
// fetch-party-donor-sectors.js (donations made directly to parties).
// Kept in one place so the matching rules — and any future fix to them —
// apply identically to both.

import fetch from "node-fetch";

const CH_KEY = process.env.COMPANIES_HOUSE_API_KEY;
const CH_AUTH = "Basic " + Buffer.from(`${CH_KEY}:`).toString("base64");

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- Skip donor names that are clearly individuals, not organisations ----
const INDIVIDUAL_PREFIX = /^(mr|mrs|ms|miss|dr|sir|lord|lady|baroness|baron|rt hon|the rt hon|prof|professor|dame)\b/i;

const ORG_HINT = /\b(ltd|limited|plc|llp|group|union|association|trust|foundation|company|corp|inc|society|federation|council|committee|campaign|party|club|university|college|charity|bank|insurance|holdings|international|institute|league|alliance|network|partners|centre|center)\b/i;

export function looksLikeIndividual(name) {
  const trimmed = name.trim();
  if (INDIVIDUAL_PREFIX.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return false;
  if (/^[A-Z]{2,6}$/.test(trimmed)) return false;
  if (/^the\s/i.test(trimmed)) return false;
  if (ORG_HINT.test(trimmed)) return false;
  return words.length <= 4 && !/\d/.test(trimmed);
}

// ---- Known UK trade unions — checked before Companies House ----
const KNOWN_UNIONS = [
  "unite", "unison", "gmb", "usdaw", "aslef", "cwu", "nasuwt", "neu",
  "national education union", "rmt", "fbu", "community union", "tssa",
  "prospect", "bfawu", "poa", "napo", "pcs", "fda", "eis", "naht",
  "musicians union", "nautilus", "police federation",
  "public and commercial services", "university and college union", "ucu",
  "national union of journalists", "unite the union",
];

export function matchesKnownUnion(name) {
  const lower = name.toLowerCase();
  return KNOWN_UNIONS.some((u) => lower.includes(u));
}

// ---- Manually verified overrides ----
// For well-known donors where a Companies House free-text search is prone to
// landing on the wrong entity (a foreign subsidiary, a dissolved shell with a
// coincidentally similar name, etc). Checked before any API call.
const MANUAL_OVERRIDES = [
  { match: /^the financial times$/i, sector: "Media & Publishing" },
];

export function matchesManualOverride(name) {
  return MANUAL_OVERRIDES.find((o) => o.match.test(name.trim())) ?? null;
}

// ---- UK SIC 2007 code -> our broad sector taxonomy ----
export function sicToSector(sic) {
  if (!sic) return null;
  const code = sic.trim();
  const div = parseInt(code.slice(0, 2), 10);

  if (code === "25400" || code === "30400") return "Defence & Arms";
  if (code === "94200") return "Trade Unions";
  if (div === 12) return "Tobacco";
  if (div === 11 || div === 92) return "Alcohol & Gambling";
  if (div === 5 || div === 6 || div === 19 || div === 35) return "Energy & Oil/Gas";
  if (div === 7 || div === 8 || div === 9) return "Mining & Extractives";
  if ((div >= 1 && div <= 3) || div === 10) return "Agriculture & Food";
  if (div === 21 || div === 86 || div === 87) return "Pharma & Healthcare";
  if (div >= 41 && div <= 43) return "Construction & Property";
  if (div === 68) return "Construction & Property";
  if (div >= 45 && div <= 47) return "Retail & Consumer";
  if (div >= 49 && div <= 53) return "Transport & Logistics";
  if (div >= 58 && div <= 60) return "Media & Publishing";
  if (div >= 61 && div <= 63) return "Tech & Telecoms";
  if (div >= 64 && div <= 66) return "Finance & Banking";
  if (div >= 69 && div <= 75) return "Legal & Professional Services";
  if (div >= 13 && div <= 33) return "Chemicals & Manufacturing";
  return "Other / Uncategorised";
}

// ---- Companies House lookup ----
function normalise(name) {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|plc|llp|the|company|co)\b/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Returns a 0-1 score (length-ratio of the shorter to the longer normalised
// name) when one contains the other, or 0 if they don't match at all. A
// higher score means a closer, more literal match — "The Financial Times" to
// "FINANCIAL TIMES LIMITED" scores much higher than to "THE FINANCIAL TIMES
// (BULGARIA) LIMITED", so among several candidates we can prefer the tightest
// match instead of just the first one over the confidence bar.
function matchScore(donorName, companyTitle) {
  const a = normalise(donorName);
  const b = normalise(companyTitle);
  if (!a || !b) return 0;
  if (a.length < 5 || b.length < 5) return 0;
  if (!a.includes(b) && !b.includes(a)) return 0;
  const shorter = Math.min(a.length, b.length);
  const longer = Math.max(a.length, b.length);
  return shorter / longer;
}

export const MIN_MATCH_SCORE = 0.55;

export async function searchCompany(name) {
  const url = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(name)}&items_per_page=5`;
  const res = await fetch(url, { headers: { Authorization: CH_AUTH } });
  if (!res.ok) return null;
  const data = await res.json();
  const scored = (data.items ?? [])
    .map((item) => ({ item, score: matchScore(name, item.title) }))
    .filter((s) => s.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.item ?? null;
}

export async function getCompanyProfile(companyNumber) {
  const url = `https://api.company-information.service.gov.uk/company/${companyNumber}`;
  const res = await fetch(url, { headers: { Authorization: CH_AUTH } });
  if (!res.ok) return null;
  return res.json();
}
