// build-benchmarks.js
//
// What this does, in plain terms:
// 1. Reads every current MP, every declared interest with a value, and every
//    recorded vote from the database.
// 2. Works out, for each MP, how much they have declared, how much of it is
//    outside earnings, their expenses so far this year, how often they vote
//    against their party, how many votes they turn up for, and how long they
//    have served.
// 3. Writes frontend/src/data/benchmarks.json: every MP's figures and the
//    sorted list of all MPs' figures for each measure, so the site can say
//    "more than most MPs" without loading everyone's records.
//
// If the figures look empty (an upstream outage) the existing file is left
// alone. Run it with: node build-benchmarks.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { computeBenchmarks } from "./benchmarks.js";

const OUTPUT = "frontend/src/data/benchmarks.json";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// The database returns at most 1,000 rows a request, so read in pages.
async function all(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order("id").range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

const [politicians, interests, votes] = await Promise.all([
  all("politicians", "id, party, parliament_member_id, ipsa_expenses"),
  all("financial_interests", "id, politician_id, category, value_amount"),
  all("voting_records", "id, politician_id, division_id, voted_with_party_majority"),
]);
const careers = JSON.parse(readFileSync("frontend/src/data/mpCareers.json", "utf8")).mps;

const result = computeBenchmarks({ politicians, interests, votes, careers });
if (politicians.length < 600 || result.distributions.rebelPct.length < 300) {
  throw new Error(`Too little data (${politicians.length} MPs, ${result.distributions.rebelPct.length} rebellion rates) — leaving ${OUTPUT} unchanged.`);
}
writeFileSync(OUTPUT, JSON.stringify(result) + "\n");
console.log(`Wrote benchmarks for ${politicians.length} MPs (${result.divisions} votes counted).`);
