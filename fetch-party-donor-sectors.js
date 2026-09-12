// fetch-party-donor-sectors.js
//
// What this does, in plain terms:
// 1. Pulls every donation from party_donations (donations made directly to
//    political parties), aggregates total value per donor, and focuses on
//    the top donors by value.
// 2. The Electoral Commission already records each donor's status
//    (Individual, Company, Trade Union, Public Fund, Unincorporated
//    Association, Trust) directly — unlike the MP-donations pipeline, this
//    dataset doesn't need to guess "is this a person?" from the name alone.
//    Individuals and public funds are left uncategorised; trade unions are
//    tagged directly.
// 3. For companies, the Electoral Commission often already gives a company
//    registration number — when it does, that's looked up directly rather
//    than fuzzy-matched by name; when it doesn't, it falls back to the same
//    Companies House name search used for MP donors.
// 4. Writes the result to frontend/src/data/partyDonorSectors.json — a
//    static, checked-in file the app reads directly, same pattern as
//    donorSectors.json.
//
// Run it with: node fetch-party-donor-sectors.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  sleep,
  looksLikeIndividual,
  matchesManualOverride,
  sicToSector,
  searchCompany,
  getCompanyProfile,
  MIN_MATCH_SCORE,
} from "./sectorTagging.js";
import fs from "fs";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const OUTPUT_PATH = "frontend/src/data/partyDonorSectors.json";
const META_PATH = "frontend/src/data/partyDonorSectorsMeta.json";
const TOP_N_DONORS = 150;

// ---- Step 1: aggregate donors by total declared value ----
async function loadTopDonors() {
  const { data, error } = await supabase
    .from("party_donations")
    .select("donor_name, donor_status, company_registration_number, value")
    .not("donor_name", "is", null);
  if (error) throw error;

  const totals = new Map();
  for (const row of data) {
    const name = row.donor_name.trim();
    if (!name) continue;
    const existing = totals.get(name);
    totals.set(name, {
      total: (existing?.total ?? 0) + (row.value ?? 0),
      donorStatus: existing?.donorStatus ?? row.donor_status,
      companyRegistrationNumber: existing?.companyRegistrationNumber ?? row.company_registration_number,
    });
  }

  return [...totals.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_N_DONORS);
}

// ---- Run everything ----
async function main() {
  console.log("Loading top party donors by declared value...");
  const donors = await loadTopDonors();
  console.log(`Processing ${donors.length} donors.\n`);

  const result = {};
  let tagged = 0;
  let skippedIndividuals = 0;
  let skippedOther = 0;

  for (const [i, donor] of donors.entries()) {
    const override = matchesManualOverride(donor.name);
    if (override) {
      result[donor.name] = { sector: override.sector, source: "manual-override" };
      tagged++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" → ${override.sector} (manual override)`);
      continue;
    }

    if (donor.donorStatus === "Trade Union") {
      result[donor.name] = { sector: "Trade Unions", source: "donor-status" };
      tagged++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" → Trade Unions (Electoral Commission donor status)`);
      continue;
    }

    if (donor.donorStatus === "Individual") {
      skippedIndividuals++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" — recorded as an individual, skipped`);
      continue;
    }

    if (donor.donorStatus === "Public Fund") {
      skippedOther++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" — public funding (e.g. Short Money), not an industry donor`);
      continue;
    }

    if (looksLikeIndividual(donor.name)) {
      skippedIndividuals++;
      console.log(`[${i + 1}/${donors.length}] "${donor.name}" — looks like an individual, skipped`);
      continue;
    }

    try {
      let match = null;
      let profile = null;

      if (donor.companyRegistrationNumber) {
        profile = await getCompanyProfile(donor.companyRegistrationNumber);
        if (profile) match = { title: profile.company_name, company_number: donor.companyRegistrationNumber };
      }

      if (!profile) {
        match = await searchCompany(donor.name);
        if (!match) {
          console.log(`[${i + 1}/${donors.length}] "${donor.name}" — no confident Companies House match`);
          await sleep(200);
          continue;
        }
        profile = await getCompanyProfile(match.company_number);
      }

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
          source: donor.companyRegistrationNumber ? "companies-house-crn" : "companies-house",
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

  // Second safety net: re-check the final tagged set for names that still
  // look personal despite matching a company (see fetch-donor-sectors.js).
  const flaggedForReview = [];
  for (const name of Object.keys(result)) {
    if (!result[name].source?.startsWith("companies-house")) continue;
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
    publicFundingSkipped: skippedOther,
    uncategorised: donors.length - tagged - skippedIndividuals - skippedOther,
    minMatchConfidence: MIN_MATCH_SCORE,
    flaggedForReview: flaggedForReview.length,
  };
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

  if (flaggedForReview.length > 0) {
    console.log(`\n⚠ ${flaggedForReview.length} match(es) removed by the safety net — name looked personal despite matching a company:`);
    for (const f of flaggedForReview) console.log(`   "${f.name}" was going to be ${f.sector} (via "${f.companyName}")`);
  }

  console.log(`\nDone. ${tagged} donors tagged, ${skippedIndividuals} individuals skipped, ${skippedOther} public funding skipped, ${donors.length - tagged - skippedIndividuals - skippedOther} left uncategorised.`);
  console.log(`Written to ${OUTPUT_PATH} and ${META_PATH}`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
