// Builds src/data/brexitData.json for the Brexit page's charts and its regional picker.
//
//   node scripts/build-brexit-data.mjs [--rts <slug of an HMRC regional trade release>]
//
// Sources (each is an official release; the page names them):
//   - OECD, Quarterly National Accounts: real GDP per head (US dollars, constant prices and PPPs) for the UK, the G7, the euro area, the EU and some
//     comparator countries, which the page sets to 100 in the quarter of the referendum (2016 Q2).
//   - ONS, UK trade (quarterly goods exports and imports with the EU and non-EU countries) and long-term international migration, both read from the
//     ONS series the site already holds in src/data/ons (run the site's ONS fetch first so they are fresh).
//   - HMRC, UK regional trade in goods statistics: each nation's goods exports and imports with the EU and non-EU countries, each quarter from
//     the first quarter of 2021 (the first after the trade deal began).
//   - ONS, Population estimates for the UK, mid-2025 (table MYE3): the people who came to live in each region and nation, and left, in the year to
//     mid-2025, and the population.
// The referendum result by region is in src/data/brexit.js, from the Electoral Commission.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";
import { readOds } from "../../ods-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/brexitData.json");
const UA = { "User-Agent": "Mozilla/5.0 simple-politics" };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
// The OECD's service now and then answers with a server error, so a request is tried a few times.
const fetchBuf = async (url, headers = {}) => {
  let last = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const r = await fetch(url, { headers: { ...UA, ...headers } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    last = r.status;
    if (r.status < 500) break;
    await new Promise((x) => setTimeout(x, 1500 * (attempt + 1)));
  }
  throw new Error(`${url}: ${last}`);
};
const ons = (file) => JSON.parse(fs.readFileSync(path.join(here, "../src/data/ons", file), "utf8")).series;

// ---- OECD: GDP per head, 2016 Q2 = 100 ------------------------------------------------------------------------------------------------------
const GDP_AREAS = { GBR: "United Kingdom", G7: "G7 countries", EA: "Euro area", EU: "European Union", USA: "United States", FRA: "France", DEU: "Germany", ITA: "Italy", CAN: "Canada", JPN: "Japan" };
async function gdpPerHead() {
  const url = "https://sdmx.oecd.org/public/rest/data/OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA_EXPENDITURE_CAPITA,1.1/Q.Y..S1.S1.B1GQ_POP._Z._Z._Z.USD_PPP_PS.LR.LA.T0102?startPeriod=2010-Q1";
  const text = (await fetchBuf(url, { Accept: "application/vnd.sdmx.data+csv;version=1.0.0" })).toString("utf8");
  const [head, ...lines] = text.trim().split("\n");
  const cols = head.split(",");
  const area = cols.indexOf("REF_AREA");
  const time = cols.indexOf("TIME_PERIOD");
  const val = cols.indexOf("OBS_VALUE");
  const by = {};
  for (const l of lines) {
    const c = l.split(",");
    if (!GDP_AREAS[c[area]]) continue;
    (by[c[area]] ??= {})[c[time]] = Number(c[val]);
  }
  const lastCommon = Object.values(by).map((s) => Object.keys(s).sort().at(-1)).sort()[0];
  const quarters = Object.keys(by.GBR).filter((q) => q >= "2014-Q1" && q <= lastCommon).sort();
  const t = (q) => Number(q.slice(0, 4)) + (Number(q.slice(6)) - 1) / 4;
  const series = Object.fromEntries(Object.keys(GDP_AREAS).map((k) => [k, quarters.map((q) => round((by[k][q] / by[k]["2016-Q2"]) * 100, 1))]));
  return { base: "2016-Q2", times: quarters.map(t), quarters, last: lastCommon, names: GDP_AREAS, series };
}

// ---- ONS series the site already holds -------------------------------------------------------------------------------------------------------
function tradeAndMigration() {
  const trade = ons("trade.json");
  const q = (id, from = "2010-Q1") => trade[id].points.filter((p) => p[0] >= from);
  const eu = q("eu-exports");
  const non = q("noneu-exports");
  const euI = q("eu-imports");
  const nonI = q("noneu-imports");
  const t = (label) => Number(label.slice(0, 4)) + (Number(label.slice(6)) - 1) / 4;
  const quarters = eu.map((p) => p[0]);
  const same = (a) => a.length === quarters.length && a.every((p, i) => p[0] === quarters[i]);
  if (![non, euI, nonI].every(same)) throw new Error("ONS trade series have different quarters");
  const mig = ons("immigration.json");
  const m = (id) => mig[id].points;
  const months = m("migration-net").map((p) => p[0]);
  const mt = (label) => Number(label.slice(0, 4)) + (Number(label.slice(5)) - 1) / 12;
  return {
    trade: { quarters, times: quarters.map(t), euExports: eu.map((p) => p[1]), nonEuExports: non.map((p) => p[1]), euImports: euI.map((p) => p[1]), nonEuImports: nonI.map((p) => p[1]) },
    migration: { months, times: months.map(mt), net: m("migration-net").map((p) => p[1]), arrivals: m("migration-in").map((p) => p[1]), departures: m("migration-out").map((p) => p[1]), nonEuArrivals: m("migration-non-eu").map((p) => p[1]) },
  };
}

// ---- HMRC: each nation's goods trade, quarterly --------------------------------------------------------------------------------------------
const NATIONS = [["england", "England", /^England.s trade in goods/], ["wales", "Wales", /^Wales.? trade in goods/], ["scotland", "Scotland", /^Scotland.s trade in goods/], ["ni", "Northern Ireland", /^Northern Ireland.s trade in goods/]];
async function nationTrade(slug) {
  const page = await (await fetch(`https://www.gov.uk/api/content/government/statistics/${slug}`, { headers: UA })).json();
  const files = page.details.attachments.filter((a) => a.url?.endsWith(".ods"));
  const out = {};
  let quarters = null;
  for (const [key, , test] of NATIONS) {
    const f = files.find((a) => test.test(a.title.replace(/[’‘]/g, "'")));
    if (!f) throw new Error(`No file for ${key}`);
    const book = readOds(await fetchBuf(f.url));
    const rows = book[Object.keys(book)[0]];
    const head = rows.find((r) => r.some((c) => /^\d{4} Q[1-4]$/.test(String(c))));
    const cols = head.map((c, i) => ({ i, c })).filter((x) => /^\d{4} Q[1-4]$/.test(String(x.c)));
    quarters ??= cols.map((x) => x.c);
    const row = (label) => { const r = rows.find((x) => String(x[0]).trim() === label); if (!r) throw new Error(`No ${label} for ${key}`); return cols.map((x) => round(Number(r[x.i]), 2)); };
    out[key] = { euExports: row("EU exports"), nonEuExports: row("Non-EU exports"), euImports: row("EU imports"), nonEuImports: row("Non-EU imports") };
  }
  const label = (q) => `${q.slice(0, 4)} ${q.slice(5)}`;
  return { release: page.title, quarters: quarters.map(label), times: quarters.map((q) => Number(q.slice(0, 4)) + (Number(q.slice(6)) - 1) / 4), nations: out };
}

// ---- ONS population estimates: migration by region ----------------------------------------------------------------------------------------
const REGION_KEYS = { "NORTH EAST": "ne", "NORTH WEST": "nw", "YORKSHIRE AND THE HUMBER": "yh", "EAST MIDLANDS": "em", "WEST MIDLANDS": "wm", EAST: "east", LONDON: "london", "SOUTH EAST": "se", "SOUTH WEST": "sw", WALES: "wales", SCOTLAND: "scotland", "NORTHERN IRELAND": "ni" };
async function migrationByRegion() {
  const wb = readXlsx(await fetchBuf("https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland/mid2025/mye25tablesuk.xlsx"));
  const rows = wb.MYE3.filter(Boolean);
  const head = rows.find((r) => r[0] === "Code");
  const col = (name) => head.indexOf(name);
  const out = {};
  for (const r of rows) {
    const key = REGION_KEYS[String(r[1]).toUpperCase()];
    if (!key || !(r[2] === "Region" || r[2] === "Country")) continue;
    out[key] = {
      population: r[col("Estimated Population mid-2024")], arrivals: r[col("International Migration Inflow")], departures: r[col("International Migration Outflow")], net: r[col("International Migration Net")],
    };
  }
  const uk = rows.find((r) => r[1] === "UNITED KINGDOM");
  return { year: "year to mid-2025", regions: out, uk: { population: uk[col("Estimated Population mid-2024")], arrivals: uk[col("International Migration Inflow")], departures: uk[col("International Migration Outflow")], net: uk[col("International Migration Net")] } };
}

async function main() {
  const i = process.argv.indexOf("--rts");
  const slug = i > 0 ? process.argv[i + 1] : "uk-regional-trade-in-goods-statistics-fourth-quarter-october-to-december-2025";
  const data = {
    built: new Date().toISOString().slice(0, 10),
    gdp: await gdpPerHead(),
    ...tradeAndMigration(),
    nationTrade: await nationTrade(slug),
    migrationByRegion: await migrationByRegion(),
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
