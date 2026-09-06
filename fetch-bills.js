// fetch-bills.js
//
// What this does, in plain terms:
// 1. Fetches the most recently updated bills currently going through Parliament
// 2. For each one, fetches full detail — long title, sponsor, department,
//    current stage, and the next scheduled sitting date (if any)
// 3. Saves/updates all of it into Supabase — safely re-runnable, no duplicates
//
// Run it with: node fetch-bills.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// How many of the most recently updated bills to track
const BILLS_TO_FETCH = 100;

async function fetchRecentBillIds() {
  const url = `https://bills-api.parliament.uk/api/v1/Bills?SortOrder=DateUpdatedDescending&Take=${BILLS_TO_FETCH}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bills list API error: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((b) => b.billId);
}

async function fetchBillDetail(billId) {
  const url = `https://bills-api.parliament.uk/api/v1/Bills/${billId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bill detail API error for ${billId}: ${res.status}`);
  return res.json();
}

function nextSittingDate(currentStage) {
  const sittings = currentStage?.stageSittings ?? [];
  const now = new Date();
  const future = sittings
    .map((s) => new Date(s.date))
    .filter((d) => d >= now)
    .sort((a, b) => a - b);
  return future.length > 0 ? future[0].toISOString().slice(0, 10) : null;
}

async function main() {
  console.log("Fetching list of recently updated bills...");
  const billIds = await fetchRecentBillIds();
  console.log(`Found ${billIds.length} bills.\n`);

  let saved = 0;
  for (const [i, billId] of billIds.entries()) {
    try {
      const bill = await fetchBillDetail(billId);
      const sponsor = bill.sponsors?.[0];

      const row = {
        bill_id: bill.billId,
        short_title: bill.shortTitle ?? null,
        long_title: bill.longTitle ?? null,
        summary: bill.summary ?? null,
        current_stage: bill.currentStage?.description ?? null,
        current_house: bill.currentHouse ?? null,
        is_act: bill.isAct ?? false,
        is_defeated: bill.isDefeated ?? false,
        sponsor_name: sponsor?.member?.name ?? null,
        sponsor_party: sponsor?.member?.party ?? null,
        sponsor_member_id: sponsor?.member?.memberId ?? null,
        sponsoring_department: sponsor?.organisation?.name ?? null,
        next_sitting_date: nextSittingDate(bill.currentStage),
        last_updated: bill.lastUpdate ?? null,
        source_url: `https://bills.parliament.uk/bills/${bill.billId}`,
      };

      const { error } = await supabase.from("bills").upsert(row, { onConflict: "bill_id" });
      if (error) throw error;

      saved++;
      console.log(`[${i + 1}/${billIds.length}] ${bill.shortTitle} — ${bill.currentStage?.description ?? "no stage"}`);
    } catch (err) {
      console.error(`  ⚠ Failed for bill ${billId}: ${err.message}`);
    }
    await sleep(150);
  }

  console.log(`\nDone. ${billIds.length} bills processed, ${saved} saved/updated.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
