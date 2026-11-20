// Builds src/data/homelessness.json from the newest "Statutory homelessness: detailed local authority-level tables" on GOV.UK.
//
//   node scripts/build-homelessness.mjs
//
// Published every quarter (January, April, July and October for the quarter before last). The newest file is the one whose title ends latest ("January to March 2026").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readOds } from "../../ods-lite.js";
import { readXlsx } from "../../xlsx-lite.js";
import { govAttachments, download } from "./area-kit.mjs";
import { readA1, readTA1, buildHomelessness } from "./homelessness-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/homelessness.json");
const PAGE = "/government/statistical-data-sets/live-tables-on-homelessness";
const MONTH = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

// The month a quarter's title ends in, as a sortable number, or null: "Detailed local authority level tables: January to March 2026 (revised)".
export const endOf = (title) => {
  const m = /tables: (\w+) to (\w+) (\d{4})/i.exec(title);
  const month = m ? MONTH.indexOf(m[2].toLowerCase()) : -1;
  return month < 0 ? null : Number(m[3]) * 12 + month;
};

export async function newestFile() {
  const files = (await govAttachments(PAGE))
    .filter((a) => /^Detailed local authority level tables: \w+ to \w+ \d{4}/i.test(a.title) && !/accessible|multiple disadvantage|financial year/i.test(a.title) && /\.(ods|xlsx)$/i.test(a.url))
    .map((a) => ({ ...a, end: endOf(a.title) })).filter((a) => a.end != null);
  if (!files.length) throw new Error("The detailed homelessness tables were not found");
  return files.sort((a, b) => b.end - a.end)[0];
}

async function main() {
  const file = await newestFile();
  console.log(`Homelessness: ${file.title}`);
  const buf = await download(file.url);
  const book = /\.xlsx$/i.test(file.url) ? readXlsx(buf) : readOds(buf);
  const sheet = (n) => Array.from(book[n] ?? [], (r) => r ?? []);
  const ta1 = sheet("TA1");
  const asAt = (/as at (\d{1,2} \w+ \d{4})/i.exec(String(ta1[0]?.[0] ?? "")) ?? [])[1] ?? null;
  const quarter = (/tables: (\w+ to \w+ \d{4})/i.exec(file.title) ?? [])[1] ?? null;
  const data = buildHomelessness(readTA1(ta1), readA1(sheet("A1")), { quarter, asAt });
  if (!data || !asAt || !quarter || data.reported < 100) {
    console.error(`The file was not as expected (${data ? data.reported : 0} councils reporting), so ${OUT} was left as it is.`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), source: file.url, title: file.title, ...data }) + "\n");
  console.log(`Wrote ${Object.keys(data.areas).length} councils (${data.reported} reported) for ${quarter}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
