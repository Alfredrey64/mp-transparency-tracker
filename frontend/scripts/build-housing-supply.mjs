// Builds src/data/housingSupply.json from two GOV.UK live tables: Table 122 (net additional dwellings by local authority, yearly) and Table 100 (dwelling stock by local authority, yearly).
//
//   node scripts/build-housing-supply.mjs
//
// Table 122 is published each November (provisional figures for the year to March), Table 100 each May. A new file of either is found through the GOV.UK content API, so no address is hard-coded.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readOds } from "../../ods-lite.js";
import { govAttachments, download } from "./area-kit.mjs";
import { readSupply, readStock, buildSupply } from "./housing-supply-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/housingSupply.json");
const SUPPLY_PAGE = "/government/statistical-data-sets/live-tables-on-net-supply-of-housing";
const STOCK_PAGE = "/government/statistical-data-sets/live-tables-on-dwelling-stock-including-vacants";

const pick = async (page, re) => {
  const hit = (await govAttachments(page)).find((a) => re.test(a.title) && /\.ods$/i.test(a.url));
  if (!hit) throw new Error(`${re} was not found on ${page}`);
  return hit;
};

// The two files' addresses, used by the weekly check to see whether either has been replaced.
export async function newestFiles() {
  return { supply: await pick(SUPPLY_PAGE, /^Table 122:/i), stock: await pick(STOCK_PAGE, /^Table 100:/i) };
}

async function main() {
  const { supply, stock } = await newestFiles();
  console.log(`Housing supply: ${supply.url}\nDwelling stock: ${stock.url}`);
  const supplyBook = readOds(await download(supply.url));
  const stockBook = readOds(await download(stock.url));
  const sheet = (b, n) => Array.from(b[n] ?? [], (r) => r ?? []);
  const stockYear = Math.max(...Object.keys(stockBook).filter((k) => /^\d{4}$/.test(k)).map(Number));
  const data = buildSupply(readSupply(sheet(supplyBook, "LT_122")), readStock(sheet(stockBook, String(stockYear))), { stockYear });
  if (!data || data.withLatest < 250) {
    console.error(`The files were not as expected (${data ? data.withLatest : 0} councils with a latest figure), so ${OUT} was left as it is.`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: supply.url, stockSource: stock.url, ...data }) + "\n");
  console.log(`Wrote ${Object.keys(data.areas).length} councils; latest year ${data.years.at(-1)}, homes counted at 31 March ${stockYear}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
