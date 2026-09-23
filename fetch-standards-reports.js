// fetch-standards-reports.js
//
// What this does, in plain terms:
// 1. Fetches every report the Commons Committee on Standards has ever
//    published, from the UK Parliament Committees API (no key needed) —
//    the same API this site already uses for the Select Committees page.
// 2. The committee publishes two very different kinds of report under one
//    list: general policy reviews (the Code of Conduct, APPG rules, how
//    sanctions should work) and reports naming a specific MP's individual
//    conduct case. This script keeps only the second kind — a report is
//    almost always titled either "Nth Report - policy topic" or
//    "Nth Report - An MP's Name", so a report is kept only if, once the
//    "Nth Report -" prefix is stripped, what's left reads like a person's
//    name (short, no colon, no digits, no obvious policy keyword) rather
//    than a topic.
// 3. Tries to match that name against a *current* MP in our own
//    `politicians` table, so the frontend can link straight to their
//    profile — many of these reports are about MPs who have since left
//    Parliament, which is left visible rather than hidden.
// 4. Replaces the `standards_reports` table with the full result each run
//    — this is a small, slow-growing list (a couple of dozen a year at
//    most), so there's no need for a rolling window like the other
//    high-volume features.
//
// Run it with: node fetch-standards-reports.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API = "https://committees-api.parliament.uk/api";
const STANDARDS_COMMITTEE_ID = 290;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const REQUEST_TIMEOUT_MS = 15000;
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

async function getJson(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await withTimeout(fetch(url, { headers: { Accept: "application/json" } }), REQUEST_TIMEOUT_MS);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1500 * attempt);
    }
  }
}

async function fetchAllPublications() {
  const all = [];
  let skip = 0;
  const take = 100;
  while (true) {
    const data = await getJson(
      `${API}/Publications?CommitteeId=${STANDARDS_COMMITTEE_ID}&Take=${take}&Skip=${skip}&SortOrder=PublicationDateDescending`
    );
    all.push(...(data.items ?? []));
    if ((data.items ?? []).length < take || all.length >= data.totalResults) break;
    skip += take;
    await sleep(150);
  }
  return all;
}

const REPORT_PREFIX = /^(?:\d+\w{0,3}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth)\s+(?:special\s+)?report\s*[-–—]\s*/i;

const POLICY_KEYWORDS = /\b(code of conduct|register of interests|sanctions|all-party|standards landscape|business costs|influencing|confidentiality|precautionary|natural justice|guide to the rules|procedural protocol|stationery|values,?\s*attitudes|government response|final proposals|transitional provisions|ipsa|scheme of business|respect policy|dignity policy|complaints procedure|risk assurance)\b/i;

// A candidate name is short, has no colon (a subtitle marker for policy
// reports), and no digits — i.e. it reads like "Andrew Gwynne", not
// "Review of the Code of Conduct: proposals for consultation".
function extractPersonName(title) {
  if (!REPORT_PREFIX.test(title)) return null;
  const rest = title.replace(REPORT_PREFIX, "").trim();
  if (!rest || rest.includes(":") || /\d/.test(rest) || POLICY_KEYWORDS.test(rest)) return null;
  const words = rest.split(/\s+/);
  if (words.length < 2 || words.length > 5) return null;
  return rest;
}

const TITLE_PREFIX = /^(mr|mrs|ms|miss|dr|sir|dame|lord|lady|rt hon|the rt hon)\.?\s+/i;
function normaliseNameForMatch(name) {
  return name.replace(TITLE_PREFIX, "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  console.log("Fetching Committee on Standards publications...");
  const publications = await fetchAllPublications();
  console.log(`Found ${publications.length} publications; filtering to named-MP conduct reports...`);

  const { data: politicians } = await supabase.from("politicians").select("id, name");
  const politicianByNormalisedName = new Map(
    (politicians ?? []).map((p) => [normaliseNameForMatch(p.name), p])
  );

  const seen = new Set();
  const rows = [];
  for (const item of publications) {
    if (!item.additionalContentUrl) continue; // evidence submissions etc, not the report itself
    const title = item.description ?? "";
    const name = extractPersonName(title);
    if (!name || seen.has(item.id)) continue;
    seen.add(item.id);

    const match = politicianByNormalisedName.get(normaliseNameForMatch(name));
    rows.push({
      id: item.id,
      title,
      extracted_name: name,
      politician_id: match?.id ?? null,
      politician_name: match?.name ?? null,
      is_current_mp: Boolean(match),
      publication_date: item.publicationStartDate ? item.publicationStartDate.slice(0, 10) : null,
      report_url: item.additionalContentUrl,
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`Kept ${rows.length} individually-named conduct reports (${rows.filter((r) => r.is_current_mp).length} matched to a current MP).`);

  console.log(`\nReplacing standards_reports table with ${rows.length} reports...`);
  const { error: deleteError } = await supabase.from("standards_reports").delete().neq("id", 0);
  if (deleteError) throw deleteError;

  const BATCH_SIZE = 50;
  let saved = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from("standards_reports").insert(batch);
    if (insertError) {
      console.error(`  ⚠ Batch ${i / BATCH_SIZE + 1} failed: ${insertError.message}`);
      continue;
    }
    saved += batch.length;
  }

  console.log(`\nDone. Saved ${saved} of ${rows.length} standards reports.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Something went wrong:", err.message);
    process.exit(1);
  });
