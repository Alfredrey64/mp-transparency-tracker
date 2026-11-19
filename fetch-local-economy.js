// fetch-local-economy.js
//
// What this does, in plain terms:
// 1. Asks Nomis (the Office for National Statistics' labour market service) for the claimant count for every Westminster constituency on the July 2024 boundaries, for the
//    latest month and the same month a year earlier, and for England.
// 2. Asks it for median full-time pay (Annual Survey of Hours and Earnings, workplace analysis) for the latest year and the one before.
// 3. Writes frontend/src/data/localEconomy.json (see localEconomy.js). If too few constituencies come back, the existing file is left alone.
//
// Run it with: node fetch-local-economy.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { parseCsvText, claimantsFrom, payFrom, economyFile } from "./localEconomy.js";

const OUTPUT = "frontend/src/data/localEconomy.json";
const NOMIS = "https://www.nomisweb.co.uk/api/v01/dataset";
const SEATS = "TYPE172"; // Westminster Parliamentary Constituencies (July 2024)
const COUNTRIES = "TYPE499";
const MIN_SEATS = 600;
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };

const get = async (url) => {
  const res = await fetchRetry(url, { headers });
  if (!res.ok) throw new Error("Nomis: HTTP " + res.status + " for " + url);
  return parseCsvText(await res.text());
};

const claimantUrl = (geography) => NOMIS + "/NM_162_1.data.csv?geography=" + geography + "&date=latest,latestMINUS12&gender=0&age=0&measure=1,2&measures=20100&select=geography_code,geography_name,date_name,measure,obs_value";
const payUrl = (geography) => NOMIS + "/NM_99_1.data.csv?geography=" + geography + "&date=latest,latestMINUS1&sex=8&item=2&pay=7&measures=20100&select=geography_code,geography_name,date_name,obs_value,obs_status_name";

async function main() {
  const [claimRows, claimCountries, payRows, payCountries] = await Promise.all([get(claimantUrl(SEATS)), get(claimantUrl(COUNTRIES)), get(payUrl(SEATS)), get(payUrl(COUNTRIES))]);
  const claimants = claimantsFrom(claimRows);
  const pay = payFrom(payRows);
  const england = { claimants: claimantsFrom(claimCountries).places.E92000001, pay: payFrom(payCountries).places.E92000001 };
  const file = economyFile(claimants, pay, england.claimants, england.pay);
  const seats = Object.keys(file.seats).length;
  if (seats < MIN_SEATS || file.england.r == null) {
    console.error("Only " + seats + " constituencies came back, so " + OUTPUT + " was left as it is.");
    process.exit(1);
  }
  const data = { fetchedAt: new Date().toISOString().slice(0, 10), source: "https://www.nomisweb.co.uk/", ...file };
  writeFileSync(OUTPUT, JSON.stringify(data) + "\n");
  console.log("Wrote " + seats + " constituencies (claimants " + file.claimantMonth + ", pay " + file.payYear + ") to " + OUTPUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
