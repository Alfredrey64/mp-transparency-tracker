// fetch-consultations.js
//
// What this does, in plain terms:
// 1. Asks GOV.UK's search for every open consultation (the government asking the public for views on a proposal), newest first.
// 2. Keeps those whose closing day has not passed, and counts them by department (see consultations.js).
// 3. Writes frontend/src/data/consultations.json for the Have your say page. If too few come back (an outage), the existing file is left alone.
//
// Run it with: node fetch-consultations.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { summariseConsultations } from "./consultations.js";

const OUTPUT = "frontend/src/data/consultations.json";
const URL = "https://www.gov.uk/api/search.json?filter_content_store_document_type=open_consultation&count=500&order=-public_timestamp&fields=title,link,public_timestamp,description,organisations,end_date";
const MIN_OPEN = 10;

async function main() {
  const res = await fetchRetry(URL, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("GOV.UK search: HTTP " + res.status);
  const body = await res.json();
  const out = summariseConsultations(body.results, new Date().toISOString().slice(0, 10));
  if (out.total < MIN_OPEN) {
    console.error("Only " + out.total + " open consultations came back, so " + OUTPUT + " was left as it is.");
    process.exit(1);
  }
  writeFileSync(OUTPUT, JSON.stringify(out) + "\n");
  console.log("Wrote " + OUTPUT + ": " + out.total + " open consultations, first to close " + out.items[0].closes + ".");
}

main().catch((e) => { console.error(e); process.exit(1); });
