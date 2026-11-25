// fetch-special-advisers.js
//
// What this does, in plain terms:
// 1. Asks GOV.UK's Content API for the collection "Special adviser data releases: numbers and costs" and picks the newest edition (the Cabinet Office publishes one a year).
// 2. Reads that edition's HTML version and takes from it the number of special advisers, the pay bill, the four pay bands and the list of advisers by appointing minister (see specialAdvisers.js).
// 3. Writes frontend/src/data/specialAdvisers.json for the Special advisers page.
//
// If the report cannot be found or its layout has changed so that a figure cannot be read, the existing file is left alone and the run fails (so the pipeline report shows it).
// Most days nothing has changed and the file is not rewritten.
//
// Run it with: node fetch-special-advisers.js

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { htmlAttachment, latestEdition, parseReport, perBand, perMinister } from "./specialAdvisers.js";

const OUTPUT = "frontend/src/data/specialAdvisers.json";
const SITE = "https://www.gov.uk";
const COLLECTION = "/government/collections/special-adviser-data-releases-numbers-and-costs";

async function getJson(path) {
  const res = await fetchRetry(`${SITE}/api/content${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

async function main() {
  const edition = latestEdition(await getJson(COLLECTION));
  if (!edition) throw new Error("No 'numbers and costs' edition is listed in the collection.");
  const publication = await getJson(edition.path);
  const htmlPath = htmlAttachment(publication);
  if (!htmlPath) throw new Error(`The edition ${edition.path} has no HTML version to read.`);
  const page = await getJson(htmlPath);
  const report = parseReport(page.details?.body ?? "");

  const out = {
    edition: { title: edition.title, published: edition.updated, url: `${SITE}${edition.path}`, htmlUrl: `${SITE}${htmlPath}` },
    ...report,
    perBand: perBand(report.advisers),
    perMinister: perMinister(report.advisers),
  };
  const text = `${JSON.stringify(out)}\n`;
  if (existsSync(OUTPUT) && readFileSync(OUTPUT, "utf8") === text) return console.log(`Special advisers unchanged (${edition.title}).`);
  writeFileSync(OUTPUT, text);
  console.log(`Wrote ${OUTPUT}: ${report.count} special advisers as at ${report.asAt}, ${report.advisers.length} rows, edition published ${edition.updated}.`);
}

main().catch((err) => { console.error("Something went wrong:", err.message); process.exit(1); });
