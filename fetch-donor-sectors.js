// fetch-donor-sectors.js
//
// What this does, in plain terms:
// 1. Pulls every declared donor from financial_interests, aggregates total
//    declared value per donor, and focuses on the top donors by value —
//    that's where almost all the £ (and the influence signal) actually is.
// 2. Skips anything that looks like a named individual (Mr/Mrs/Dr/Lord/...)
//    rather than risk mismatching a person to an unrelated company —
//    e.g. "David Sainsbury" is not "Sainsbury's".
// 3. Checks a small manual list of well-known UK trade unions first, since
//    they're major donors and worth tagging reliably.
// 4. For everything else, looks the name up in Companies House, and if a
//    confident match is found, maps its SIC (industry) code to a broad,
//    human-readable sector.
// 5. Writes the result to frontend/src/data/donorSectors.json — a static,
//    checked-in file the app reads directly. Nothing is written back to
//    Supabase; this is reference data, not live data.
//
// Anything not confidently matched is simply left out of the file — the
// app treats that as "Uncategorised" rather than guessing.
//
// Run it with: node fetch-donor-sectors.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import fs from "fs";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const CH_KEY = process.env.COMPANIES_HOUSE_API_KEY;
const CH_AUTH = "Basic " + Buffer.from(`${CH_KEY}:`).toString("base64");

const OUTPUT_PATH = "frontend/src/data/donorSectors.json";
const META_PATH = "frontend/src/data/donorSectorsMeta.json";
const TOP_N_DONORS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- Skip donor names that are clearly individuals, not organisations ----
const INDIVIDUAL_PREFIX = /^(mr|mrs|ms|miss|dr|sir|lord|lady|baroness|baron|rt hon|the rt hon|prof|professor|dame)\b/i;
const JUNK_NAME = /^(agreement( starting.*)?|payment received.*|undisclosed|n\/a)$/i;

// A titled/honorific name is a reliable "this is a person" signal.
// A single word ("Duolingo"), an ALL-CAPS acronym ("LTA"), or a name starting
// with "The" ("The Financial Times") are reliable "this is an organisation"
// signals — no person's declared donor name is recorded that way.
// Everything else — a short, plain, title-case name with no institutional
// marker — defaults to "individual" and is excluded. That default matters:
// a wrong guess here means falsely tagging a specific named person (e.g.
// "David Sainsbury" briefly matched an unrelated "DAVID SAINSBURY LTD" car
// garage before this rule existed), which is a worse failure than leaving a
// real company briefly uncategorised.
const ORG_HINT = /\b(ltd|limited|plc|llp|group|union|association|trust|foundation|company|corp|inc|society|federation|council|committee|campaign|party|club|university|college|charity|bank|insurance|holdings|international|institute|league|alliance|network|partners|centre|center)\b/i;

function looksLikeIndividual(name) {
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

function matchesKnownUnion(name) {
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

function matchesManualOverride(name) {
  return MANUAL_OVERRIDES.find((o) => o.match.test(name.trim())) ?? null;
}

// ---- UK SIC 2007 code -> our broad sector taxonomy ----
function sicToSector(sic) {
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

const MIN_MATCH_SCORE = 0.55;

async function searchCompany(name) {
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

async function getCompanyProfile(companyNumber) {
  const url = `https://api.company-information.service.gov.uk/company/${companyNumber}`;
  const res = await fetch(url, { headers: { Authorization: CH_AUTH } });
  if (!res.ok) return null;
  return res.json();
}

// ---- Step 1: aggregate donors by total declared value ----
async function loadTopDonors() {
  const { data, error } = await supabase
    .from("financial_interests")
    .select("donor_name, value_amount")
    .not("donor_name", "is", null);
  if (error) throw error;

  const totals = new Map();
  for (const row of data) {
    const name = row.donor_name.trim();
    if (!name || JUNK_NAME.test(name)) continue;
    totals.set(name, (totals.get(name) ?? 0) + (row.value_amount ?? 0));
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_N_DONORS);
}

// ---- Run everything ----
async function main() {
  console.log("Loading top donors by declared value...");
  const donors = await loadTopDonors();
  console.log(`Processing ${donors.length} donors.\n`);

  const result = {};
  let tagged = 0;
  let skippedIndividuals = 0;

  for (const [i, donor] of donors.entries()) {
    const override = matchesManualOverride(donor.name);
    if (override) {
      result[donor.name] = { sector: override.sector, source: "manual-override" };
      tagged++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" → ${override.sector} (manual override)`);
      continue;
    }

    if (matchesKnownUnion(donor.name)) {
      result[donor.name] = { sector: "Trade Unions", source: "known-union-list" };
      tagged++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" → Trade Unions (known union)`);
      continue;
    }

    if (looksLikeIndividual(donor.name)) {
      skippedIndividuals++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" — looks like an individual, skipped`);
      continue;
    }

    try {
      const match = await searchCompany(donor.name);
      if (!match) {
        console.log(`[${i + 1}/${donors.length}] "${donor.name}" — no confident Companies House match`);
        await sleep(200);
        continue;
      }
      const profile = await getCompanyProfile(match.company_number);
      if (!profile) {
        console.log(`[${i + 1}/${donors.length}] "${donor.name}" — matched "${match.title}" but couldn't load its profile`);
        await sleep(200);
        continue;
      }
      // Dissolved/liquidated companies are a common source of stale or
      // coincidental name matches — only trust ones still on the register.
      if (profile.company_status && profile.company_status !== "active") {
        console.log(`[${i + 1}/${donors.length}] "${donor.name}" — matched "${match.title}" but it's ${profile.company_status}, skipped`);
        await sleep(200);
        continue;
      }
      const sicCode = (profile.sic_codes ?? [])[0];
      const sector = sicToSector(sicCode);
      if (sector) {
        result[donor.name] = {
          sector,
          source: "companies-house",
          companyName: match.title,
          companyNumber: match.company_number,
          sicCode,
        };
        tagged++;
        console.log(`[${i + 1}/${donors.length}] "${donor.name}" → ${sector} (via "${match.title}", SIC ${sicCode})`);
      } else {
        console.log(`[${i + 1}/${donors.length}] "${donor.name}" — matched "${match.title}" but no usable SIC code`);
      }
    } catch (err) {
      console.error(`[${i + 1}/${donors.length}] "${donor.name}" — error: ${err.message}`);
    }
    await sleep(200);
  }

  // Second safety net: even though every tagged name already passed the
  // individual check before being looked up, re-check the final tagged set
  // once more. If a name pattern that looks personal ended up tagged anyway
  // (e.g. reached via the union list or a manual override typo), pull it
  // back out rather than publish a possible person-vs-company mismatch, and
  // report it so it can be reviewed by hand.
  const flaggedForReview = [];
  for (const name of Object.keys(result)) {
    if (result[name].source !== "companies-house") continue;
    if (looksLikeIndividual(name)) {
      flaggedForReview.push({ name, ...result[name] });
      delete result[name];
      tagged--;
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));

  const meta = {
    generatedAt: new Date().toISOString(),
    donorsConsidered: donors.length,
    donorsTagged: tagged,
    individualsSkipped: skippedIndividuals,
    uncategorised: donors.length - tagged - skippedIndividuals,
    minMatchConfidence: MIN_MATCH_SCORE,
    flaggedForReview: flaggedForReview.length,
  };
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

  if (flaggedForReview.length > 0) {
    console.log(`\n⚠ ${flaggedForReview.length} match(es) removed by the safety net — name looked personal despite matching a company:`);
    for (const f of flaggedForReview) console.log(`   "${f.name}" was going to be ${f.sector} (via "${f.companyName}")`);
  }

  console.log(`\nDone. ${tagged} donors tagged, ${skippedIndividuals} individuals skipped, ${donors.length - tagged - skippedIndividuals} left uncategorised.`);
  console.log(`Written to ${OUTPUT_PATH} and ${META_PATH}`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
