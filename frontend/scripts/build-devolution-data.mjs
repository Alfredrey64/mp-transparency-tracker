// Builds src/data/devolutionData.json for the Devolution and the union page.
//
//   node scripts/build-devolution-data.mjs
//
// Sources (each an official release; the page names them). The newest release of each is found from GOV.UK's search or the ONS dataset pages.
//   - HM Treasury, Country and regional analysis (CRA): public spending on services that can be identified with a country or region, per head, each year, and
//     by what it is spent on in the latest year (Chapter A tables).
//   - ONS, Country and regional public sector finances, net fiscal balance tables: what each country and region's public sector spends, raises in revenue and
//     the gap between the two, every year since 1999 to 2000. A positive balance is a deficit.
//   - ONS, Regional gross domestic product, all ITL regions: the size of each country and region's economy, its population, GDP per head and growth.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/devolutionData.json");
const UA = { "User-Agent": "Mozilla/5.0 simple-politics" };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const getBuf = async (url) => {
  let last = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const r = await fetch(url, { headers: UA, redirect: "follow" });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    last = r.status;
    if (r.status < 500) break;
    await new Promise((x) => setTimeout(x, 1500 * (attempt + 1)));
  }
  throw new Error(`${url}: ${last}`);
};
const getJson = async (url) => JSON.parse((await getBuf(url)).toString("utf8"));
const content = (slug) => getJson(`https://www.gov.uk/api/content${slug}`);
async function latestRelease(query, slugTest) {
  const types = ["national_statistics", "official_statistics", "statistics"].map((t) => `&filter_content_store_document_type=${t}`).join("");
  const results = (await getJson(`https://www.gov.uk/api/search.json?q=${encodeURIComponent(query)}&count=40&fields=link&fields=public_timestamp${types}`)).results.filter((r) => slugTest.test(r.link));
  if (!results.length) throw new Error(`No release found for ${query}`);
  results.sort((a, b) => b.public_timestamp.localeCompare(a.public_timestamp));
  return results[0].link;
}
const rowsOf = (wb, name) => {
  if (!wb[name]) throw new Error(`No sheet ${name}`);
  return wb[name].filter(Boolean);
};
const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

// The twelve places the site's maps use.
const PLACES = { ne: "north east", nw: "north west", yh: "yorkshire and the humber", em: "east midlands", wm: "west midlands", east: "east", london: "london", se: "south east", sw: "south west", wales: "wales", scotland: "scotland", ni: "northern ireland" };
const placeKey = (name) => {
  const n = norm(name).replace(/^east of england$/, "east").replace(/ \[.*\]$/, "");
  if (n === "united kingdom" || n === "uk identifiable expenditure" || n === "uk") return "uk";
  if (n === "england" || n === "total england") return "england";
  return Object.entries(PLACES).find(([, v]) => v === n)?.[0] ?? null;
};
const yearStart = (label) => Number(String(label).match(/\d{4}/)[0]);

// ---- HM Treasury: country and regional analysis -------------------------------------------------------------------------------------------------------
async function spending() {
  const slug = await latestRelease("country and regional analysis", /^\/government\/statistics\/country-and-regional-analysis-\d{4}$/);
  const page = await content(slug);
  const a = page.details.attachments.find((x) => x.url?.endsWith(".xlsx") && /Chapter_A/i.test(x.url));
  if (!a) throw new Error("No Chapter A tables");
  const wb = readXlsx(await getBuf(a.url));

  // A.1b: £ per head for five years, then the same as an index (UK identifiable expenditure = 100).
  const a1b = rowsOf(wb, "A.1b");
  const head = a1b.findIndex((r) => r.filter((c) => /outturn/.test(String(c))).length >= 5);
  const labels = a1b[head].filter((c) => /outturn/.test(String(c)));
  const years = labels.slice(0, 5).map((l) => yearStart(l));
  const perHead = {};
  const index = {};
  for (const r of a1b.slice(head + 1)) {
    const k = placeKey(r[0]);
    if (!k) continue;
    perHead[k] = years.map((_, i) => num(r[1 + i]));
    index[k] = years.map((_, i) => num(r[6 + i]));
  }
  // A.2b: the same in the prices of the latest year.
  const a2b = rowsOf(wb, "A.2b");
  const h2 = a2b.findIndex((r) => r.filter((c) => /outturn/.test(String(c))).length >= 5);
  const real = {};
  for (const r of a2b.slice(h2 + 1)) {
    const k = placeKey(r[0]);
    if (k) real[k] = years.map((_, i) => num(r[1 + i]));
  }
  // A.15: per head by function, the latest year's block.
  const a15 = rowsOf(wb, "A.15");
  const fh = a15.findIndex((r) => r.some((c) => /^\d+\. General public services/.test(String(c))));
  const fnCols = a15[fh].map((c, i) => ({ c: String(c ?? "").trim(), i })).filter((x) => /^\d+\. /.test(x.c));
  const blocks = [];
  for (let i = fh + 1; i < a15.length; i += 1) if (/^\d{4}-\d{2}$/.test(String(a15[i][0] ?? "").trim())) blocks.push(i);
  const lastBlock = blocks.at(-1);
  const functions = Object.fromEntries(fnCols.map((f) => [f.c, {}]));
  for (const r of a15.slice(lastBlock + 1, lastBlock + 17)) {
    const k = placeKey(r[0]);
    if (!k) continue;
    for (const f of fnCols) functions[f.c][k] = num(r[f.i]);
  }
  return { release: page.title, updated: page.public_updated_at.slice(0, 10), years, perHead, index, real, functionsYear: yearStart(a15[lastBlock][0]), functions };
}

// ---- ONS: country and regional public sector finances -----------------------------------------------------------------------------------------------
async function fiscal() {
  const page = (await getBuf("https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/datasets/countryandregionalpublicsectorfinancesnetfiscalbalancetables")).toString("utf8");
  const links = [...page.matchAll(/href="([^"]*financialyearending(\d{4})\/[^"]*netfiscalbalance[^"]*\.xlsx)"/gi)].map((m) => ({ href: m[1], fye: Number(m[2]) })).sort((a, b) => b.fye - a.fye);
  if (!links.length) throw new Error("No net fiscal balance file");
  const wb = readXlsx(await getBuf(new URL(links[0].href.replace(/&amp;/g, "&"), "https://www.ons.gov.uk").toString()));
  const out = {};
  let years = null;
  for (const name of Object.keys(wb)) {
    const k = placeKey(name);
    if (!k) continue;
    const rows = rowsOf(wb, name);
    const head = rows.find((r) => r[0] === "£ million");
    if (!head) continue;
    years ??= head.slice(1).filter((c) => /^\d{4} to \d{4}$/.test(String(c))).map((c) => yearStart(c));
    const get = (test) => { const r = rows.find((x) => test(String(x[0]))); if (!r) throw new Error(`No row in ${name}`); return years.map((_, i) => num(r[1 + i])); };
    out[k] = {
      expenditure: get((s) => s === "Total Current Expenditure"),
      receipts: get((s) => s.startsWith("Total Current Receipts (incl. North Sea Oil & Gas Revenues by geographic")),
      balance: get((s) => s.startsWith("Net Fiscal Balance (incl. North Sea Oil & Gas Revenues by geographic")),
      balancePop: get((s) => s.startsWith("Net Fiscal Balance (incl. North Sea Oil & Gas Revenues by population")),
      balanceNoOil: get((s) => s.startsWith("Net Fiscal Balance excl. North Sea")),
    };
  }
  if (Object.keys(out).length !== 14) throw new Error(`Expected the UK, England and twelve places, got ${Object.keys(out).length}`);
  return { fye: links[0].fye, years, places: out };
}

// ---- ONS: regional GDP -----------------------------------------------------------------------------------------------------------------------------------------------
async function gdp() {
  const page = (await getBuf("https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossdomesticproductallnutslevelregions")).toString("utf8");
  const links = [...page.matchAll(/href="([^"]*regionalgrossdomesticproductallnutslevelregions\/1998to(\d{4})\/[^"]*\.xlsx)"/gi)].map((m) => ({ href: m[1], last: Number(m[2]) })).sort((a, b) => b.last - a.last);
  if (!links.length) throw new Error("No regional GDP file");
  const wb = readXlsx(await getBuf(new URL(links[0].href.replace(/&amp;/g, "&"), "https://www.ons.gov.uk").toString()));
  const sheetFor = (re) => {
    const name = Object.keys(wb).find((n) => /^Table \d+$/.test(n) && re.test(String(wb[n].find((r) => r && typeof r[0] === "string" && /^Table/.test(r[0]))?.[0] ?? "")));
    if (!name) throw new Error(`No table for ${re}`);
    return rowsOf(wb, name);
  };
  const read = (re) => {
    const rows = sheetFor(re);
    const head = rows.find((r) => r[0] === "ITL");
    const cols = head.map((c, i) => ({ y: /^\d{4}$/.test(String(c).trim()) ? Number(c) : null, i })).filter((x) => x.y);
    const out = {};
    for (const r of rows.slice(rows.indexOf(head) + 1)) {
      if (!(r[0] === "UK" || r[0] === "ITL1" || r[2] === "England")) continue;
      const k = placeKey(r[2]);
      if (k) out[k] = cols.map((x) => num(r[x.i]));
    }
    return { years: cols.map((x) => x.y), places: out };
  };
  const perHead = read(/GDP\) per head at current market prices/i);
  const population = read(/Total resident population/i);
  const realPerHead = read(/chained volume measures \(CVM\) in \d{4} money value, per head/i);
  return { last: links[0].last, years: perHead.years, perHead: perHead.places, population: population.places, realPerHead: realPerHead.places };
}

async function main() {
  const data = { built: new Date().toISOString().slice(0, 10) };
  data.spending = await spending();
  data.fiscal = await fiscal();
  data.gdp = await gdp();
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB): spending to ${data.spending.years.at(-1)}, finances to ${data.fiscal.fye}, GDP to ${data.gdp.last}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
