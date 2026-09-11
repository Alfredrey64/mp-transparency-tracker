// fetch-former-mps.js
//
// What this does, in plain terms:
// 1. Fetches every former MP the Parliament Members API knows about (the API
//    caps each page at 20 results, so this is many small requests — it's a
//    small, infrequent script, not something worth optimising further)
// 2. Sorts them by how recently they left the Commons, and keeps the most
//    recent 80 — a rolling "who's left lately" window that updates itself as
//    new people leave, rather than a fixed cutoff date that needs updating
// 3. Saves/updates them in Supabase — safely re-runnable, no duplicates
//
// What this can't tell you: the API records *why* someone's membership
// ended in Parliament's own terms (a general election, a resignation, a
// death) — it does not know what they went on to do afterwards. We don't
// guess at that.
//
// Run it with: node fetch-former-mps.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAGE_SIZE = 20; // the API ignores a larger `take` and always returns 20
const KEEP_MOST_RECENT = 80;

async function fetchAllFormerMembers() {
  const all = [];
  let skip = 0;
  while (true) {
    const url = `https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=false&skip=${skip}&take=${PAGE_SIZE}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Members search API error: ${res.status}`);
    const data = await res.json();
    const items = data.items ?? [];
    all.push(...items.map((i) => i.value));
    if (items.length < PAGE_SIZE || all.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    await sleep(120);
  }
  return all;
}

function readableReason(raw) {
  if (!raw) return null;
  // "Resignation (Chiltern Hundreds)" / "Resignation (Northstead)" are the
  // two ceremonial Crown offices MPs formally apply for, since they can't
  // resign a Commons seat directly — both just mean "resigned".
  if (raw.toLowerCase().startsWith("resignation")) return "Resigned";
  if (raw === "Dissolution") return "Did not return at the next election";
  return raw;
}

async function main() {
  console.log("Fetching all former MPs (paginated, 20 at a time)...");
  const members = await fetchAllFormerMembers();
  console.log(`Found ${members.length} former MPs on record.\n`);

  const withEndDate = members.filter((m) => m.latestHouseMembership?.membershipEndDate);
  withEndDate.sort(
    (a, b) => new Date(b.latestHouseMembership.membershipEndDate) - new Date(a.latestHouseMembership.membershipEndDate)
  );
  const recent = withEndDate.slice(0, KEEP_MOST_RECENT);

  const rows = recent.map((m) => ({
    parliament_member_id: m.id,
    name: m.nameDisplayAs,
    party: m.latestParty?.name ?? null,
    party_colour: m.latestParty?.backgroundColour ?? null,
    constituency: m.latestHouseMembership?.membershipFrom ?? null,
    membership_end_date: m.latestHouseMembership.membershipEndDate.slice(0, 10),
    membership_end_reason: readableReason(m.latestHouseMembership?.membershipEndReason),
    thumbnail_url: m.thumbnailUrl ?? null,
  }));

  const { error } = await supabase.from("former_mps").upsert(rows, { onConflict: "parliament_member_id" });
  if (error) throw error;

  console.log(`Done. Saved the ${rows.length} most recently departed MPs.`);
  console.log(`Most recent: ${rows[0]?.name} (${rows[0]?.membership_end_date})`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
