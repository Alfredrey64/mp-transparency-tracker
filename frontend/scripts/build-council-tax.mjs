// Brings src/data/councilTaxByCouncil.json up to date with the Ministry of Housing, Communities and Local Government's newest "Council Tax levels set by local authorities in England".
//
//   node scripts/build-council-tax.mjs
//
// The Ministry publishes each year's figures in March (and revises them in April) at a new address, GOV.UK's statistics page for that year, so the script looks for next year's page first and then
// this year's. Table 9 of the release gives the whole Band D bill for each billing authority's area; that number goes on the end of every row (see council-tax-lib.mjs). Nothing is changed
// unless the release is for the file's last year or the one after, and enough authorities match.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRetry } from "../../httpFetch.js";
import { readOds } from "../../ods-lite.js";
import { applyYear, readTable9, releaseYear } from "./council-tax-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/councilTaxByCouncil.json");
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };
const page = (y) => `https://www.gov.uk/api/content/government/statistics/council-tax-levels-set-by-local-authorities-in-england-${y}-to-${y + 1}`;

// The newest release the Ministry has published for the file: next year's if it is out, else this year's. Returns { year, url } or null.
export async function newestRelease(lastYear) {
  for (const y of [lastYear + 1, lastYear]) {
    const res = await fetchRetry(page(y), { headers });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`GOV.UK answered ${res.status} for the ${y} council tax release`);
    const hit = ((await res.json()).details?.attachments ?? []).find((a) => /tables 1 to 9/i.test(a.title ?? "") && /\.ods$/i.test(a.url ?? ""));
    if (hit) return { year: y, url: hit.url };
  }
  return null;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const lastYear = data.from + data.rows[0][2].length - 1;
  const release = await newestRelease(lastYear);
  if (!release) { console.log(`No release found for ${lastYear} or ${lastYear + 1}; the file was left as it is.`); return; }
  console.log(`Release for ${release.year}: ${release.url}`);
  const res = await fetchRetry(release.url, { headers });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const book = readOds(Buffer.from(await res.arrayBuffer()));
  const rows = (name) => Array.from(book[name] ?? [], (r) => r ?? []);
  const year = releaseYear(rows("Cover"));
  if (year !== release.year) throw new Error(`The file says it is for ${year}, not ${release.year}, so ${OUT} was left as it is`);
  const result = applyYear(data, readTable9(rows("Table_9")), year);
  const out = { from: data.from, year, fetchedAt: new Date().toISOString().slice(0, 10), source: release.url, rows: result.data.rows };
  fs.writeFileSync(OUT, JSON.stringify(out) + "\n");
  console.log(`Wrote ${out.rows.length} authorities to ${year}: ${result.matched} matched, ${result.added} new, ${result.ended} without a ${year} figure.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
