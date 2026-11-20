// Builds src/data/childPoverty.json from the Department for Work and Pensions' newest "Children in low income families: local area statistics" workbook.
//
//   node scripts/build-child-poverty.mjs
//
// Published every March. The newest release is the one with the latest "20XX to 20YY" in its title; the workbook is found through GOV.UK's content API.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readOds } from "../../ods-lite.js";
import { govAttachments, download, headers } from "./area-kit.mjs";
import { fetchRetry } from "../../httpFetch.js";
import { readChildPoverty, buildChildPoverty } from "./child-poverty-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/childPoverty.json");
const COLLECTION = "https://www.gov.uk/api/content/government/collections/children-in-low-income-families-local-area-statistics";

// The newest release page of the collection ("... 2022 to 2025" beats "... 2014 to 2024").
export async function newestRelease() {
  const res = await fetchRetry(COLLECTION, { headers });
  if (!res.ok) throw new Error(`GOV.UK answered ${res.status} for the child poverty collection`);
  const pages = ((await res.json()).links?.documents ?? [])
    .map((d) => ({ path: d.base_path, title: d.title, end: Number((/(\d{4})$/.exec(d.title ?? "") ?? [])[1]) }))
    .filter((d) => /^\/government\/statistics\/children-in-low-income-families-local-area-statistics-/.test(d.path) && d.end > 2000);
  if (!pages.length) throw new Error("No child poverty release was found");
  const page = pages.sort((a, b) => b.end - a.end)[0];
  const ods = (await govAttachments(page.path)).find((a) => /\.ods$/i.test(a.url));
  if (!ods) throw new Error(`The workbook was not found on ${page.path}`);
  return { url: ods.url, title: page.title, end: page.end };
}

async function main() {
  const release = await newestRelease();
  console.log(`Child poverty: ${release.title}`);
  const book = readOds(await download(release.url));
  const sheet = (re) => Array.from(book[Object.keys(book).find((n) => re.test(n))] ?? [], (r) => r ?? []);
  const data = buildChildPoverty(readChildPoverty(sheet(/^2_AHC_Relative_LA/)), readChildPoverty(sheet(/^3_AHC_Relative_Parl/)));
  if (!data) { console.error(`The workbook was not as expected, so ${OUT} was left as it is.`); process.exit(1); }
  fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: release.url, title: release.title, ...data }) + "\n");
  console.log(`Wrote ${Object.keys(data.la).length} local authorities and ${Object.keys(data.con).length} constituencies, years ${data.years.join(" and ")}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
