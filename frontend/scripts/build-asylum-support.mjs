// Builds src/data/asylumSupport.json from the Home Office's newest "Asylum seekers in receipt of Home Office support by local authority" workbook.
//
//   node scripts/build-asylum-support.mjs
//
// The Home Office publishes it every quarter (February, May, August and November) with the other immigration statistics. The newest file is found through GOV.UK's content API.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";
import { govAttachments, download } from "./area-kit.mjs";
import { buildAsylum } from "./asylum-support-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/asylumSupport.json");
const PAGE = "/government/statistical-data-sets/immigration-system-statistics-data-tables";

export async function newestFile() {
  const hit = (await govAttachments(PAGE)).find((a) => /asylum seekers in receipt of home office support by local authority detailed datasets/i.test(a.title) && /\.xlsx$/i.test(a.url));
  if (!hit) throw new Error("The Home Office's asylum support by local authority file was not found");
  return { url: hit.url, title: hit.title };
}

async function main() {
  const file = await newestFile();
  console.log(`Asylum support: ${file.title}`);
  const book = readXlsx(await download(file.url));
  const rows = Array.from(book.Data_Asy_D11 ?? [], (r) => r ?? []);
  const data = buildAsylum(rows);
  if (!data || Object.keys(data.areas).length < 250 || data.uk.t.at(-1) < 20000) {
    console.error(`The file was not as expected (${data ? Object.keys(data.areas).length : 0} areas), so ${OUT} was left as it is.`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: file.url, title: file.title, ...data }) + "\n");
  console.log(`Wrote ${Object.keys(data.areas).length} areas, ${data.quarters[0]} to ${data.asAt}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
