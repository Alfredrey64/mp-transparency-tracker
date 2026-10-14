// Builds src/data/inequalityPlace.json for the Place tab of the Inequality page: how poverty, income and wealth differ across the regions and nations,
// within them, and between kinds of area.
//
//   node scripts/build-place-data.mjs [--from <folder with the downloaded files>]
//
// Sources, all official spreadsheets:
//   - DWP, Households Below Average Income 2024/25, detailed tables (a zip of spreadsheets): the share of people, children, working-age adults and
//     pensioners in relative low income and the median income, for each region and nation, as three-year averages back to 1994/95. Northern Ireland is
//     missing for the first years.
//   - ONS, Regional gross disposable household income 1997 to 2024: income per head before and after tax and benefits for each region, and for each
//     of the 182 smallest areas (ITL3) the ONS publishes.
//   - ONS, Total wealth in Great Britain, April 2020 to March 2022: the 25th percentile, median and 75th percentile of household wealth, and the
//     share held as property, for each region.
//   - ONS, The effects of taxes and benefits on household income 2024/25: income by kind of neighbourhood (Output Area Classification) and urban or rural.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx, unzip } from "../../xlsx-lite.js";
import { readOds } from "../../ods-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/inequalityPlace.json");
const ONS = "https://www.ons.gov.uk/file?uri=";
const FILES = {
  hbaiZip: { name: "hbai-tables.zip", url: "https://assets.publishing.service.gov.uk/media/69c2902a7e02b81c0d1c7762/hbai-data_tables-2025.zip" },
  hdii: { name: "hdii.xlsx", url: `${ONS}/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/householddisposableincomeandinequality/financialyearending2025/hdiifye2025.xlsx` },
  wealth: { name: "wealth.xlsx", url: `${ONS}/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/totalwealthwealthingreatbritain/july2006tojune2016andapril2014tomarch2022/totalwealthtables.xlsx` },
  gdhi: { name: "gdhi.xlsx", url: `${ONS}/economy/regionalaccounts/grossdisposablehouseholdincome/datasets/regionalgrossdisposablehouseholdincomegdhi/1997to2024/regionalgrossdisposablehouseholdincomeallitlregions2024.xlsx` },
};

// The twelve regions and nations, in the order the map and tables use, with the code the ONS gives each (the first three letters of an ITL3 code).
const REGIONS = [
  { key: "ne", name: "North East", itl: "TLC" }, { key: "nw", name: "North West", itl: "TLD" }, { key: "yh", name: "Yorkshire and the Humber", itl: "TLE" },
  { key: "em", name: "East Midlands", itl: "TLF" }, { key: "wm", name: "West Midlands", itl: "TLG" }, { key: "east", name: "East of England", itl: "TLH" },
  { key: "london", name: "London", itl: "TLI" }, { key: "se", name: "South East", itl: "TLJ" }, { key: "sw", name: "South West", itl: "TLK" },
  { key: "wales", name: "Wales", itl: "TLL" }, { key: "scotland", name: "Scotland", itl: "TLM" }, { key: "ni", name: "Northern Ireland", itl: "TLN" },
];
const ALIASES = { "yorkshire & the humber": "Yorkshire and the Humber", "yorkshire and humber": "Yorkshire and the Humber", east: "East of England", "east of england": "East of England" };
const regionOf = (label) => { const s = String(label ?? "").replace(/\s+/g, " ").trim(); const n = ALIASES[s.toLowerCase()] ?? s; return REGIONS.find((r) => r.name === n) ?? null; };

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const round = (v, n = 1) => (v === null ? null : Math.round(v * 10 ** n) / 10 ** n);

async function load(key, folder) {
  const { name, url } = FILES[key];
  if (folder && fs.existsSync(path.join(folder, name))) return fs.readFileSync(path.join(folder, name));
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 simple-politics" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// "94/95-96/97" -> { from: 1994, to: 1996 }, the first year of each end of the three-year average.
const century = (yy) => (yy >= 90 ? 1900 + yy : 2000 + yy);
const period = (s) => { const m = /^(\d{2})\/\d{2}-(\d{2})\/\d{2}$/.exec(String(s ?? "").replace(/\s+/g, "")); return m ? { from: century(Number(m[1])), to: century(Number(m[2])) } : null; };

// A table of regions by three-year period, in blocks ("Before housing costs", "After housing costs"). Returns { periods, blocks: { before, after } }.
function regionBlocks(rows, markers) {
  const head = rows.find((r) => r.some((c) => period(c)));
  const cols = head.map((c, i) => ({ i, p: period(c) })).filter((c) => c.p);
  const blocks = {};
  let current = null;
  for (const r of rows) {
    const first = clean(r[0]).toLowerCase();
    const mark = Object.entries(markers).find(([, test]) => test(first));
    if (mark && r.slice(1).every((c) => c === null || c === undefined || c === "")) { current = mark[0]; blocks[current] ??= {}; continue; }
    if (!current) continue;
    const region = regionOf(r[0]);
    const label = region?.key ?? (/^england$/.test(first) ? "england" : /^all /.test(first) ? "uk" : null);
    if (label) blocks[current][label] = cols.map((c) => round(num(r[c.i]), 1));
  }
  return { periods: cols.map((c) => c.p), blocks };
}

function buildPoverty(zip) {
  const files = unzip(zip, { binary: true });
  const sheet = (file, name) => readOds(files.get(file)())[name];
  const groups = [
    ["all", "population-hbai-timeseries-1994-95-2024-25-tables.ods", "3_17ts"],
    ["children", "children-hbai-timeseries-1994-95-2024-25-tables.ods", "4_16ts"],
    ["workingAge", "workingage-hbai-timeseries-1994-95-2024-25-tables.ods", "5_17ts"],
    ["pensioners", "pensioners-hbai-timeseries-1994-95-2024-25-tables.ods", "6_10ts"],
  ];
  const poverty = {};
  let periods = null;
  for (const [key, file, tab] of groups) {
    const t = regionBlocks(sheet(file, tab), { bhc: (s) => s.startsWith("before housing"), ahc: (s) => s.startsWith("after housing") });
    periods ??= t.periods;
    if (t.periods.length !== periods.length) throw new Error(`${tab} has a different number of periods`);
    poverty[key] = t.blocks;
  }
  const inc = regionBlocks(sheet("income-values-and-inequality-measures-hbai-1994-95-2024-25-tables.ods", "2_5ts"), {
    medianBhc: (s) => /^median/.test(s) && /before/.test(s), medianAhc: (s) => /^median/.test(s) && /after/.test(s),
  });
  return { periods, poverty, median: { bhc: inc.blocks.medianBhc, ahc: inc.blocks.medianAhc } };
}

function buildIncome(g) {
  const head = g["Table 3"].find((r) => r[0] === "ITL");
  const years = head.slice(3).map(Number);
  const col = years.indexOf(Math.max(...years));
  const at = (sheet, test) => g[sheet].filter(test);
  const itl1 = (sheet) => Object.fromEntries(at(sheet, (r) => r[0] === "ITL1").map((r) => [r[1], r[3 + col]]));
  const perHead = itl1("Table 3");
  const uk = g["Table 3"].find((r) => r[0] === "UK")[3 + col];
  // Before and after tax and benefits, per head, from the components table.
  const comp = (code, label) => Object.fromEntries(g["Table 8"].filter((r) => r[0] === "ITL1" && r[3] === code && (label ? clean(r[4]) === label : true)).map((r) => [r[1], r[5 + col]]));
  const primary = comp("B.5g");
  const net = Object.fromEntries(g["Table 8"].filter((r) => r[0] === "ITL1" && clean(r[4]) === "Balance of secondary income").map((r) => [r[1], r[5 + col]]));
  const ukRow = (label) => g["Table 8"].find((r) => r[0] === "UK" && clean(r[4]) === label)[5 + col];
  const regions = REGIONS.map((r) => ({ key: r.key, name: r.name, perHead: perHead[r.itl] ?? null, primary: primary[r.itl] ?? null, net: net[r.itl] ?? null }));
  const local = g["Table 3"].filter((r) => r[0] === "ITL3").map((r) => ({ code: r[1], name: clean(r[2]), region: REGIONS.find((x) => x.itl === String(r[1]).slice(0, 3))?.key ?? null, value: r[3 + col] })).filter((r) => r.region && typeof r.value === "number");
  const pop = g["Table 2"].filter((r) => r[0] === "ITL3");
  const popBy = new Map(pop.map((r) => [r[1], r[3 + col]]));
  return {
    year: years[col],
    uk: { perHead: uk, primary: ukRow("Balance of primary incomes"), net: ukRow("Balance of secondary income") },
    regions,
    local: local.map((r) => ({ ...r, people: popBy.get(r.code) ?? null })),
  };
}

function buildWealth(w) {
  const t28 = w["Table 2.8"];
  const cols = t28[2].length - 1; // the latest period is the last column
  const block = (rows, test) => { const start = rows.findIndex((r) => test(clean(r[0]))); return rows.slice(start, start + 13); };
  const read = (rows, test) => Object.fromEntries(block(rows, test).map((r) => [clean(r[1]), r[cols]]));
  const p25 = read(t28, (s) => /25th percentile/.test(s));
  const median = read(t28, (s) => /50th percentile/.test(s));
  const p75 = read(t28, (s) => /75th percentile/.test(s));
  const households = read(t28, (s) => /^Weighted Frequency/.test(s));
  const t27 = w["Table 2.7"];
  const aggregate = read(t27, (s) => /^Aggregate total wealth/.test(s));
  const propertyShare = read(t27, (s) => /^Aggregate property wealth \(net\)\s+as a percentage/.test(s));
  const out = REGIONS.filter((r) => r.key !== "ni").map((r) => {
    const n = Object.keys(median).find((k) => regionOf(k)?.key === r.key);
    return { key: r.key, name: r.name, p25: p25[n], median: median[n], p75: p75[n], mean: Math.round((aggregate[n] * 1e6) / households[n]), propertyShare: propertyShare[n] };
  });
  const gb = { p25: p25["Great Britain"], median: median["Great Britain"], p75: p75["Great Britain"], mean: Math.round((aggregate["Great Britain"] * 1e6) / households["Great Britain"]), propertyShare: propertyShare["Great Britain"] };
  return { period: "April 2020 to March 2022", regions: out, gb };
}

function buildAreas(h) {
  const t30 = h["Table 30"];
  const names = t30[3].slice(1, 9).map(clean);
  const row = (label) => t30.find((r) => clean(r[0]).startsWith(label));
  const people = row("Weighted number of persons");
  const gross = row("Gross annual household income");
  const disposable = row("Disposable annual household income");
  const types = names.map((n, i) => ({ name: n, people: people[1 + i] * 1000, gross: gross[1 + i], disposable: disposable[1 + i] }));
  const all = { people: people[9] * 1000, gross: gross[9], disposable: disposable[9] };
  const t27 = h["Table 27"];
  const urbanRural = ["Urban", "Rural"].map((n) => { const r = t27.find((x) => clean(x[0]) === n); return { name: n, people: r[1] * 1000, disposable: r[2], gross: r[3] }; });
  return { types, all, urbanRural };
}

async function main() {
  const folder = process.argv.includes("--from") ? process.argv[process.argv.indexOf("--from") + 1] : null;
  const [hbai, hdii, wealth, gdhi] = await Promise.all(["hbaiZip", "hdii", "wealth", "gdhi"].map((k) => load(k, folder)));
  const poverty = buildPoverty(hbai);
  const data = {
    built: new Date().toISOString().slice(0, 10),
    regions: REGIONS.map(({ key, name }) => ({ key, name })),
    sources: {
      hbai: { label: "DWP, Households Below Average Income 2024/25, detailed tables (regional time series)", url: "https://www.gov.uk/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" },
      gdhi: { label: "ONS, Regional gross disposable household income, 1997 to 2024 (all ITL regions)", url: "https://www.ons.gov.uk/economy/regionalaccounts/grossdisposablehouseholdincome/datasets/regionalgrossdisposablehouseholdincomegdhi" },
      wealth: { label: "ONS, Household total wealth in Great Britain, April 2020 to March 2022 (tables 2.7 and 2.8)", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/totalwealthwealthingreatbritain" },
      hdii: { label: "ONS, The effects of taxes and benefits on household income, financial year ending 2025 (tables 27 and 30)", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/householddisposableincomeandinequality" },
    },
    ...poverty,
    income: buildIncome(readXlsx(gdhi)),
    wealth: buildWealth(readXlsx(wealth)),
    areas: buildAreas(readXlsx(hdii)),
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
