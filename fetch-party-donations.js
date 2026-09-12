// fetch-party-donations.js
//
// What this does, in plain terms:
// 1. Pulls every donation made directly to a political party (not an
//    individual MP) from the Electoral Commission's public donations
//    register, over a rolling 365-day window — a window that updates
//    itself as new donations are reported, rather than a fixed date range
//    that needs updating by hand.
// 2. Saves/updates them in Supabase — safely re-runnable, no duplicates.
//
// This is a different regulatory regime and dataset from the Register of
// Members' Financial Interests (fetch-interests.js) — that one covers what
// individual MPs declare; this one covers what the Electoral Commission
// records parties themselves as having received.
//
// Run it with: node fetch-party-donations.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAGE_SIZE = 50; // the API ignores a larger `rows` and always returns 50
const WINDOW_DAYS = 365;

function ecDate(msTimestamp) {
  // The API returns dates as ASP.NET-style "/Date(1234567890000)/" strings.
  const match = /\/Date\((\d+)\)\//.exec(msTimestamp ?? "");
  if (!match) return null;
  return new Date(Number(match[1])).toISOString().slice(0, 10);
}

async function fetchAllPartyDonations() {
  const to = new Date();
  const from = new Date(to.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const all = [];
  let start = 0;
  while (true) {
    const url =
      `https://search.electoralcommission.org.uk/api/search/Donations` +
      `?rows=${PAGE_SIZE}&start=${start}&sort=AcceptedDate&order=desc` +
      `&et=pp&date=Accepted&from=${fromStr}&to=${toStr}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Electoral Commission API error: ${res.status}`);
    const data = await res.json();
    const items = data.Result ?? [];
    all.push(...items);
    if (items.length < PAGE_SIZE || all.length >= data.Total) break;
    start += PAGE_SIZE;
    await sleep(150);
  }
  return all;
}

async function main() {
  console.log("Fetching party donations from the Electoral Commission (last 365 days)...");
  const donations = await fetchAllPartyDonations();
  console.log(`Found ${donations.length} party donations on record.\n`);

  const rows = donations.map((d) => ({
    id: d.Id,
    ec_ref: d.ECRef ?? null,
    party_name: d.RegulatedEntityName,
    donor_name: d.DonorName?.trim() ?? null,
    donor_status: d.DonorStatus ?? null,
    company_registration_number: d.CompanyRegistrationNumber ?? null,
    value: d.Value ?? null,
    donation_type: d.DonationType ?? null,
    accepted_date: ecDate(d.AcceptedDate),
    received_date: ecDate(d.ReceivedDate),
    reported_date: ecDate(d.ReportedDate),
    register_name: d.RegisterName ?? null,
    is_irish_source: d.IsIrishSource ?? false,
  }));

  // Upsert in batches — Supabase rejects very large single payloads.
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("party_donations").upsert(batch, { onConflict: "id" });
    if (error) throw error;
  }

  console.log(`Done. Saved ${rows.length} party donations.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
