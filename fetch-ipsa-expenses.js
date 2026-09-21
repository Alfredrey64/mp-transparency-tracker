// fetch-ipsa-expenses.js
//
// What this does, in plain terms:
// 1. IPSA (the body that administers MPs' staffing and business cost
//    claims) publishes every MP's itemised claim history on their own
//    site. It's not a documented public API, but the site is a Next.js
//    app that loads each MP's data from a predictable JSON endpoint keyed
//    by the same Parliament member ID this app already uses elsewhere —
//    confirmed by hand before writing this script, not assumed.
// 2. For each current MP, fetches that JSON and keeps the current
//    financial year's itemised claims in full (for the "Claims" tab on
//    their profile), plus a category breakdown and a year-on-year total
//    against the previous financial year — the previous year's own
//    hundreds of claims aren't kept in full, just its total.
// 3. Saves that summary into an `ipsa_expenses` column on each MP's row.
//
// Caveat: this relies on IPSA's site internals (a Next.js "buildId" baked
// into their page, re-discovered fresh each run) rather than a stable,
// documented API, so it's more fragile than the official Parliament APIs
// this app otherwise uses — if IPSA redeploys their site with a
// sufficiently different structure, this script may need updating.
//
// Run it with: node fetch-ipsa-expenses.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function discoverBuildId() {
  const res = await fetch("https://www.theipsa.org.uk/");
  if (!res.ok) throw new Error(`Could not load IPSA homepage: ${res.status}`);
  const html = await res.text();
  const match = html.match(/"buildId":"([^"]+)"/);
  if (!match) throw new Error("Could not find a Next.js buildId on the IPSA homepage — their site structure may have changed.");
  return match[1];
}

// Turns a financial-year label like "24_25" into a sortable number.
function yearSortKey(year) {
  const [start] = year.split("_");
  return Number(start);
}

function summariseExpenses(expenses) {
  if (!expenses || expenses.length === 0) return null;
  const years = [...new Set(expenses.map((e) => e.year))].sort((a, b) => yearSortKey(b) - yearSortKey(a));
  const latestYear = years[0];
  const previousYear = years[1] ?? null;

  const latestExpenses = expenses.filter((e) => e.year === latestYear);
  const byCategory = new Map();
  for (const e of latestExpenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + (e.amountPaid ?? 0));
  }
  const categories = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  const total = Math.round(latestExpenses.reduce((sum, e) => sum + (e.amountPaid ?? 0), 0) * 100) / 100;
  const previousTotal = previousYear
    ? Math.round(expenses.filter((e) => e.year === previousYear).reduce((sum, e) => sum + (e.amountPaid ?? 0), 0) * 100) / 100
    : null;

  // The itemised claims themselves, for the current year — "details" (a
  // vendor name, or a purpose like "Aggregated figure for travel") is
  // usually more informative than "shortDescription", so it's tried first.
  const claims = latestExpenses
    .map((e) => ({
      date: e.date?.slice(0, 10) ?? null,
      category: e.category,
      expenseType: e.expenseType,
      description: (e.details || e.shortDescription || "").trim() || null,
      amount: e.amountPaid ?? 0,
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return {
    year: latestYear,
    total,
    byCategory: categories,
    previousYear: previousYear ? { year: previousYear, total: previousTotal } : null,
    claims,
  };
}

async function fetchMpExpenses(buildId, memberId) {
  try {
    const url = `https://www.theipsa.org.uk/_next/data/${buildId}/mp-staffing-business-costs/your-mp/mp/${memberId}.json?slug=mp&slug=${memberId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.pageProps?.mp?.expenses ?? null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("Discovering IPSA's current build id...");
  const buildId = await discoverBuildId();
  console.log(`Using build id: ${buildId}\n`);

  const { data: politicians, error } = await supabase
    .from("politicians")
    .select("id, parliament_member_id, name");
  if (error) throw error;

  console.log(`Fetching IPSA expense summaries for ${politicians.length} current MPs...\n`);

  let saved = 0;
  let skipped = 0;
  for (const [i, mp] of politicians.entries()) {
    if (!mp.parliament_member_id) continue;
    const expenses = await fetchMpExpenses(buildId, mp.parliament_member_id);
    const summary = summariseExpenses(expenses);

    if (summary) {
      const { error: updateError } = await supabase
        .from("politicians")
        .update({ ipsa_expenses: summary })
        .eq("id", mp.id);
      if (updateError) {
        console.error(`  ⚠ Failed to save expenses for ${mp.name}: ${updateError.message}`);
      } else {
        saved++;
      }
    } else {
      skipped++;
    }

    if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${politicians.length} done`);
    await sleep(150);
  }

  console.log(`\nDone. Saved expense summaries for ${saved} MPs (${skipped} had no data available).`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
