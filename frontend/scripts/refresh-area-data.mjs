// Keeps the figures behind Your area up to date without anyone running a builder: once a week it asks each official source whether a newer edition is out, and rebuilds only the
// datasets where it is. (Datasets that a daily job already rewrites, such as house prices, road casualties, A&E waits and local jobs, are not here.)
//
//   node scripts/refresh-area-data.mjs [--summary file.md] [--force] [--only id,id]
//
// Each dataset below has a check that returns a reason when a rebuild is needed (a new Ofsted month, a new CQC month, a new version of the Department for Education's results tables, a new
// year of the council tax, road condition, fly-tipping or Ombudsman figures) and null when the saved copy is current. A check that cannot reach its source is a failure, not "up to date": it
// is reported and the run ends with a non-zero code, so a source that has moved is noticed in a week instead of never.
// The builders themselves refuse to overwrite a file with a short or broken answer, so a bad edition leaves the last good one in place.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { newestOfsted } from "./build-schools-near-you.mjs";
import { newestRatings } from "./build-health-services.mjs";
import { dataSetVersions } from "./build-school-results.mjs";
import { roadFile, flyTippingFile } from "./build-council-services.mjs";
import { latestFiles } from "./build-council-complaints.mjs";
import { newestRelease } from "./build-council-tax.mjs";
import { newestFile as newestAsylum } from "./build-asylum-support.mjs";
import { newestFile as newestHomelessness } from "./build-homelessness.mjs";
import { newestFiles as newestHousing } from "./build-housing-supply.mjs";
import { newestFile as newestRents } from "./build-private-rents.mjs";
import { newestFile as newestWasteFile } from "./build-waste.mjs";
import { newestRelease as newestChildPoverty } from "./build-child-poverty.mjs";
import { editionOf as healthEdition } from "./build-local-health.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, "../src/data", f), "utf8"));
const daysSince = (iso) => (Date.now() - new Date(`${String(iso).slice(0, 10)}T00:00:00Z`).getTime()) / 86400000;
// The register of schools (where each one is) changes daily, so the school tiles are rebuilt at least this often even when Ofsted has published nothing new.
export const SCHOOL_REGISTER_DAYS = 35;

// Each: id, the script that rebuilds it, and `due()` returning why it needs rebuilding, or null.
export const DATASETS = [
  { id: "schools-near-you", script: "build-schools-near-you.mjs", then: "school-results", async due() {
    const meta = read("schoolsMeta.json");
    const now = await newestOfsted();
    if (now.asAt !== meta.asAt) return `Ofsted has published figures as at ${now.asAt} (the site has ${meta.asAt})`;
    if (daysSince(meta.builtAt) >= SCHOOL_REGISTER_DAYS) return `the schools register has not been re-read for ${Math.floor(daysSince(meta.builtAt))} days`;
    return null;
  } },
  { id: "health-services", script: "build-health-services.mjs", async due() {
    const meta = read("healthMeta.json");
    const now = await newestRatings();
    return now.asAt && now.asAt !== meta.asAt ? `the CQC has published ratings as at ${now.asAt} (the site has ${meta.asAt})` : null;
  } },
  { id: "school-results", script: "build-school-results.mjs", async due() {
    const meta = read("schoolResultsMeta.json");
    const now = await dataSetVersions();
    return now !== meta.versions ? `the Department for Education has a new version of its results tables (${now}; the site has ${meta.versions ?? "no record"})` : null;
  } },
  { id: "council-services", script: "build-council-services.mjs", async due() {
    const meta = read("councilServices.json");
    const now = { roads: await roadFile("rdc0120"), unclassified: await roadFile("rdc0130"), repairs: await roadFile("rdc0321"), flyTipping: await flyTippingFile() };
    const changed = Object.keys(now).filter((k) => now[k] !== meta.sources?.[k]);
    return changed.length ? `new file for ${changed.join(", ")}` : null;
  } },
  { id: "council-complaints", script: "build-council-complaints.mjs", async due() {
    const meta = read("councilComplaints.json");
    const now = await latestFiles();
    return now.year !== meta.year || now.decided !== meta.sources?.decided ? `the Ombudsman has published ${now.year} (the site has ${meta.year})` : null;
  } },
  { id: "council-tax", script: "build-council-tax.mjs", async due() {
    const meta = read("councilTaxByCouncil.json");
    const last = meta.from + read("councilTaxByCouncil.json").rows[0][2].length - 1;
    const now = await newestRelease(last);
    if (!now) return null;
    if (now.year > last) return `the Ministry has published the ${now.year} to ${now.year + 1} figures`;
    // Same year: the Ministry revises its tables in April, so a different file address means revised figures.
    return meta.source && now.url !== meta.source ? "the Ministry has published revised figures for the current year" : null;
  } },
  { id: "asylum-support", script: "build-asylum-support.mjs", async due() {
    const meta = read("asylumSupport.json");
    const now = await newestAsylum();
    return now.url !== meta.source ? `the Home Office has published a new quarter (${now.title.replace(/^.*year ending /i, "year ending ")})` : null;
  } },
  { id: "homelessness", script: "build-homelessness.mjs", async due() {
    const meta = read("homelessness.json");
    const now = await newestHomelessness();
    return now.url !== meta.source ? `the Ministry has published ${now.title.replace(/^.*tables: /i, "")}` : null;
  } },
  { id: "housing-supply", script: "build-housing-supply.mjs", async due() {
    const meta = read("housingSupply.json");
    const now = await newestHousing();
    if (now.supply.url !== meta.source) return "the Ministry has published new net additional dwellings figures (Table 122)";
    return now.stock.url !== meta.stockSource ? "the Ministry has published new dwelling stock figures (Table 100)" : null;
  } },
  { id: "private-rents", script: "build-private-rents.mjs", async due() {
    const meta = read("privateRents.json");
    const now = await newestRents();
    return now.url !== meta.source ? `the ONS has published private rents for a new month (released ${now.released})` : null;
  } },
  { id: "waste-recycling", script: "build-waste.mjs", async due() {
    const meta = read("wasteRecycling.json");
    const now = await newestWasteFile();
    return now.url !== meta.source ? `Defra has published ${now.title}` : null;
  } },
  { id: "child-poverty", script: "build-child-poverty.mjs", async due() {
    const meta = read("childPoverty.json");
    const now = await newestChildPoverty();
    return now.url !== meta.source ? `the Department for Work and Pensions has published ${now.title}` : null;
  } },
  { id: "local-health", script: "build-local-health.mjs", async due() {
    const meta = read("localHealth.json");
    const now = await healthEdition();
    return now !== meta.edition ? "Fingertips has a new period for at least one health measure" : null;
  } },
];

async function main() {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const value = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
  const only = value("--only")?.split(",");
  const lines = [];
  let failed = 0, rebuilt = 0;
  const run = (d, why) => {
    console.log(`\n== ${d.id}: rebuilding (${why})`);
    const r = spawnSync("node", [path.join(here, d.script)], { stdio: "inherit" });
    if (r.status !== 0) { failed += 1; lines.push(`- **${d.id}**: rebuild FAILED (${why}). The last good copy is still on the site.`); return false; }
    rebuilt += 1; lines.push(`- **${d.id}**: rebuilt because ${why}.`); return true;
  };
  const rebuiltIds = new Set();
  for (const d of DATASETS) {
    if (only && !only.includes(d.id)) continue;
    let why = flag("--force") ? "it was asked for" : null;
    try { why ??= await d.due(); } catch (e) { failed += 1; lines.push(`- **${d.id}**: could not check for a newer edition (${String(e.message ?? e).slice(0, 160)}).`); console.error(`${d.id}: ${e.message ?? e}`); continue; }
    if (!why) { console.log(`${d.id}: up to date`); lines.push(`- ${d.id}: up to date.`); continue; }
    if (run(d, why)) rebuiltIds.add(d.id);
  }
  // Rebuilding the school tiles starts from the saved results, which the tiles rebuild keeps; a results rebuild patches whatever tiles are there. Run results after tiles when both are due.
  const summary = path.resolve(value("--summary") ?? "");
  if (value("--summary")) fs.writeFileSync(summary, `Your area data refresh: ${rebuilt} rebuilt, ${failed} failed.\n\n${lines.join("\n")}\n`);
  console.log(`\n${rebuilt} rebuilt, ${failed} failed.`);
  if (failed) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
