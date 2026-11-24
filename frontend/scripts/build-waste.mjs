// Builds src/data/wasteRecycling.json from Defra's yearly "Local authority collected waste management" statistics (the local authority workbook, Table 3).
//
//   node scripts/build-waste.mjs
//
// Published each March for the financial year that ended a year earlier. The newest workbook is found through the GOV.UK content API, so no address is hard-coded.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readOds } from "../../ods-lite.js";
import { govAttachments, download } from "./area-kit.mjs";
import { readWaste, newestWorkbook } from "./waste-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/wasteRecycling.json");
const PAGE = "/government/statistics/local-authority-collected-waste-management-annual-results";

// The workbook's address, used by the weekly check to see whether a new year has been published.
export async function newestFile() {
  const hit = newestWorkbook(await govAttachments(PAGE));
  if (!hit) throw new Error(`The local authority waste workbook was not found on ${PAGE}`);
  return hit;
}

async function main() {
  const file = await newestFile();
  console.log(`Waste workbook: ${file.url}`);
  const book = readOds(await download(file.url));
  const data = readWaste(Array.from(book.Table_3 ?? [], (r) => r ?? []));
  if (!data || !data.england || Object.keys(data.areas).length < 250) {
    console.error(`The workbook was not as expected (${data ? Object.keys(data.areas).length : 0} councils), so ${OUT} was left as it is.`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: file.url, title: file.title, ...data }) + "\n");
  console.log(`Wrote ${Object.keys(data.areas).length} councils, ${data.years[0]} to ${data.years.at(-1)}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
