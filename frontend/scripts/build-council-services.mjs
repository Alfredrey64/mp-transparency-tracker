// Builds src/data/councilServices.json: how councils in England compare on two services residents notice, from two official sets of figures.
//
//   node scripts/build-council-services.mjs
//
//   1. Road condition: the Department for Transport's road condition statistics (tables RDC0120 for A roads and for B and C roads, RDC0130 for unclassified roads), the
//      share of each council's roads where maintenance should have been considered.
//   2. Fly-tipping: Defra's fly-tipping incidents reported by every local authority in England.
// Both are published once a year (roads in the autumn, fly-tipping in the winter), so this is run by hand when either changes. The newest files are found through GOV.UK's
// content API. Every figure is keyed by the council's ONS code, which is also how the site identifies a council.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRetry } from "../../httpFetch.js";
import { readOds } from "../../ods-lite.js";
import { roadSheet, roadsFrom, flyTippingFrom } from "./council-services-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/councilServices.json");
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };
const ROADS_PAGE = "https://www.gov.uk/api/content/government/statistical-data-sets/road-condition-statistics-data-tables-rdc";
const FLY_PAGE = "https://www.gov.uk/api/content/government/statistics/fly-tipping-statistics-for-england";

async function sheets(url) {
  const res = await fetchRetry(url, { headers });
  if (!res.ok) throw new Error("Download failed: HTTP " + res.status + " for " + url);
  const book = readOds(Buffer.from(await res.arrayBuffer()));
  return (name) => Array.from(book[name] ?? [], (r) => r ?? []);
}

async function roadFile(code) {
  const page = await (await fetchRetry(ROADS_PAGE, { headers })).json();
  const hit = (page.details?.attachments ?? []).find((a) => new RegExp("/" + code + "\\.ods$", "i").test(a.url ?? ""));
  if (!hit) throw new Error("The road condition table " + code + " was not found");
  return hit.url;
}

async function flyTippingFile() {
  const page = await (await fetchRetry(FLY_PAGE, { headers })).json();
  const html = JSON.stringify(page.details);
  const m = /https:\/\/assets\.publishing\.service\.gov\.uk\/media\/[^"\\]+reported_by_LAs[^"\\]+\.ods/i.exec(html);
  if (!m) throw new Error("The fly-tipping local authority file was not found");
  return m[0];
}

async function main() {
  const [urlA, urlU, urlFly] = [await roadFile("rdc0120"), await roadFile("rdc0130"), await flyTippingFile()];
  console.log("Roads: " + urlA + "\nUnclassified: " + urlU + "\nFly-tipping: " + urlFly);
  const classified = await sheets(urlA);
  const unclassified = await sheets(urlU);
  const flyBook = await sheets(urlFly);
  const roads = roadsFrom(roadSheet(classified("RDC0120_A_Road_and_Motorway")), roadSheet(classified("RDC0120_B_and_C_Road")), roadSheet(unclassified("RDC0130")));
  const fly = flyTippingFrom(flyBook("LA_incidents"));
  if (!roads || Object.keys(roads.councils).length < 100 || !fly || Object.keys(fly.councils).length < 250) {
    console.error("The files were not as expected, so " + OUT + " was left as it is.");
    process.exit(1);
  }
  const data = { builtAt: new Date().toISOString().slice(0, 10), sources: { roads: urlA, unclassified: urlU, flyTipping: urlFly }, roads, flyTipping: fly };
  fs.writeFileSync(OUT, JSON.stringify(data) + "\n");
  console.log("Wrote " + Object.keys(roads.councils).length + " councils' road condition (to " + roads.years[roads.years.length - 1] + ") and " + Object.keys(fly.councils).length + " councils' fly-tipping (" + fly.year + ") to " + OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
