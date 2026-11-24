// Builds src/data/privateRents.json from the ONS "Price Index of Private Rents" (monthly price statistics) workbook.
//
//   node scripts/build-private-rents.mjs
//
// The ONS publishes a new workbook every month (around the third Wednesday), under a dated folder on its dataset page, so the newest is found by reading that page and no address is
// hard-coded. The workbook is large (about 19 MB), so the weekly check only downloads it when the page lists a newer one.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";
import { fetchRetry } from "../../httpFetch.js";
import { headers, download } from "./area-kit.mjs";
import { readRents, newestWorkbook } from "./rents-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/privateRents.json");
const PAGE = "https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics";

// The newest workbook's address and release date, used by the weekly check to see whether a new month has been published.
export async function newestFile() {
  const res = await fetchRetry(PAGE, { headers });
  if (!res.ok) throw new Error(`The ONS answered ${res.status} for the private rents page`);
  const hit = newestWorkbook(await res.text());
  if (!hit) throw new Error("No workbook was found on the ONS private rents page");
  return hit;
}

async function main() {
  const file = await newestFile();
  console.log(`Private rents workbook (released ${file.released}): ${file.url}`);
  const data = readRents(readXlsx(await download(file.url))["Table 1"] ?? []);
  if (!data || !data.england || Object.keys(data.areas).length < 300 || Object.keys(data.regions).length < 9) {
    console.error(`The workbook was not as expected (${data ? Object.keys(data.areas).length : 0} councils), so ${OUT} was left as it is.`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: file.url, released: file.released, ...data }) + "\n");
  console.log(`Wrote ${Object.keys(data.areas).length} councils for ${data.month}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
