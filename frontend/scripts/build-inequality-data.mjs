// Builds src/data/inequalityData.json for the Inequality page from the official spreadsheets.
//
//   node scripts/build-inequality-data.mjs [--from <folder with the downloaded files>]
//
// Every figure on the page comes from one of five published workbooks, read here and written out with the table each number came from, so a figure
// can be traced and the page refreshed when a new release is published (the web addresses are at the top of the file; the links on a statistics page
// change with each edition, so check them against the "datasets" page named in each entry when a new year comes out).
//   - ONS, The effects of taxes and benefits on household income (financial year ending 2025): Gini at each stage of the tax and benefit system, the
//     ratio of the richest fifth to the poorest, the share of the top 1%, incomes by tenth, age and what taxes and benefits do to each fifth.
//   - DWP, Households Below Average Income 2024/25: relative low income (60% of the median) before and after housing costs, for everyone, children,
//     working-age adults, pensioners, disabled and working families, back to 1994/95.
//   - ONS, Total wealth in Great Britain, April 2020 to March 2022: wealth by tenth of households, by region, the Gini and the median.
//   - ONS, Regional gross disposable household income 1997 to 2024: income per head for every region and nation.
// The pay gaps and headline wealth thresholds that are only published in bulletins are in the page's own data file (src/data/inequality.js).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";
import { readOds } from "../../ods-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/inequalityData.json");
const ONS = "https://www.ons.gov.uk/file?uri=";
const FILES = {
  hdii: { name: "hdii2025.xlsx", url: `${ONS}/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/householddisposableincomeandinequality/financialyearending2025/hdiifye2025.xlsx` },
  hbai: { name: "hbai-summary.ods", url: "https://assets.publishing.service.gov.uk/media/69c28ffcb920af63be1c7767/summary-hbai-1994-95-2024-25-tables.ods" },
  wealth: { name: "wealth.xlsx", url: `${ONS}/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/totalwealthwealthingreatbritain/july2006tojune2016andapril2014tomarch2022/totalwealthtables.xlsx` },
  gdhi: { name: "gdhi.xlsx", url: `${ONS}/economy/regionalaccounts/grossdisposablehouseholdincome/datasets/regionalgrossdisposablehouseholdincomegdhi/1997to2024/regionalgrossdisposablehouseholdincomeallitlregions2024.xlsx` },
};

async function load(key, folder) {
  const { name, url } = FILES[key];
  if (folder && fs.existsSync(path.join(folder, name))) return fs.readFileSync(path.join(folder, name));
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 simple-politics" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const round = (v, n = 1) => (v === null ? null : Math.round(v * 10 ** n) / 10 ** n);
// "2024/25" is 2024 (the year it starts); a plain number is itself.
const startYear = (v) => (typeof v === "number" ? v : /^(\d{4})/.test(String(v).trim()) ? Number(String(v).trim().slice(0, 4)) : null);

// Rows of a sheet that start with a year, as { year, row }.
const yearRows = (rows, from = 0) => rows.slice(from).map((row) => ({ year: startYear(row[0]), row })).filter((r) => r.year !== null && (typeof r.row[0] === "number" || /^\d{4}\/\d{2}\s*$/.test(String(r.row[0]))));
const yearRowsAt = (rows, col, from = 0) => rows.slice(from).map((row) => ({ year: startYear(row[col]), row })).filter((r) => r.year !== null && /^\d{4}(\/\d{2})?\s*$/.test(String(r.row[col]).trim()));

function buildIncome(h) {
  const t9 = yearRows(h["Table 9"], 7);
  const t10 = yearRows(h["Table 10"], 5);
  const gini = { years: t9.map((r) => r.year), original: t9.map((r) => num(r.row[1])), gross: t9.map((r) => num(r.row[2])), disposable: t9.map((r) => num(r.row[3])) };
  const measures = {
    years: t10.map((r) => r.year),
    s80s20: t10.map((r) => num(r.row[1])), p90p10: t10.map((r) => num(r.row[2])), palma: t10.map((r) => num(r.row[3])), gini: t10.map((r) => num(r.row[4])), top1: t10.map((r) => num(r.row[5])),
  };
  const t1 = yearRows(h["Table 1"], 7);
  const medianSeries = { years: t1.map((r) => r.year), mean: t1.map((r) => num(r.row[1])), median: t1.map((r) => num(r.row[2])), medianRetired: t1.map((r) => num(r.row[6])), medianNonRetired: t1.map((r) => num(r.row[4])) };
  // What taxes and benefits do to each fifth.
  const q = h["Table 12"];
  const label = (rows, text) => rows.find((r) => clean(r[0]) === text);
  const quintiles = {
    groups: ["Poorest fifth", "Second", "Middle", "Fourth", "Richest fifth"],
    original: label(q, "Original income").slice(1, 6), cashBenefits: label(q, "plus cash benefits").slice(1, 6), gross: label(q, "Gross income").slice(1, 6),
    directTaxes: label(q, "less direct taxes and employees' NIC").slice(1, 6), disposable: label(q, "Disposable income").slice(1, 6),
    all: { original: label(q, "Original income")[6], disposable: label(q, "Disposable income")[6] },
  };
  // By tenth.
  const d = h["Table 14"];
  const deciles = {
    points: d.find((r) => clean(r[0]) === "Decile points (equivalised £)").slice(2, 10),
    original: d.find((r) => clean(r[0]) === "Equivalised original income").slice(1, 11),
    gross: d.find((r) => clean(r[0]) === "Equivalised gross income").slice(1, 11),
    disposable: d.find((r) => clean(r[0]) === "Equivalised disposable income").slice(1, 11),
  };
  // By age: median equivalised disposable income, 2024/25 prices.
  const bands = ["0 to 17", "18 to 24", "25 to 34", "35 to 44", "45 to 54", "55 to 64", "65 to 74", "75 to 84", "85+"];
  const t7 = yearRows(h["Table 7"], 6);
  const age = { bands, years: t7.map((r) => r.year), median: bands.map((_, i) => t7.map((r) => num(r.row[2 + i * 2]))) };
  // By tenure.
  const tenureRows = h["Table 26"].filter((r) => typeof r[0] === "string" || typeof r[1] === "string");
  const pick = (name) => tenureRows.find((r) => clean(r[0]) === name || clean(r[1]) === name);
  const tenure = ["Social rented", "Private rented unfurnished", "Owned outright", "With mortgage"].map((n) => { const r = pick(n); return { name: n, people: num(r[2]), disposable: num(r[3]), gross: num(r[4]) }; });
  return { gini, measures, medianSeries, quintiles, deciles, age, tenure };
}

function buildPoverty(b) {
  const years = [];
  const pull = (sheet, cols) => {
    const rows = yearRowsAt(b[sheet], 1, 6).filter((r) => !/^\s*$/.test(String(r.row[1])));
    return rows.map((r) => ({ year: r.year, values: cols.map((c) => num(r.row[c])) }));
  };
  const groups = { all: "1_3a", children: "1_4a", workingAge: "1_5a", pensioners: "1_6a" };
  const out = {};
  for (const [key, sheet] of Object.entries(groups)) {
    const rows = pull(sheet, [2, 7]); // relative low income, before and after housing costs
    if (!years.length) years.push(...rows.map((r) => r.year));
    out[key] = { bhc: rows.map((r) => round(r.values[0])), ahc: rows.map((r) => round(r.values[1])) };
  }
  // Counts in millions, latest year.
  const counts = {};
  for (const [key, sheet] of Object.entries({ all: "1_3b", children: "1_4b", workingAge: "1_5b", pensioners: "1_6b" })) {
    const rows = pull(sheet, [2, 7]);
    const last = rows.at(-1);
    counts[key] = { year: last.year, bhc: round(last.values[0], 2), ahc: round(last.values[1], 2) };
  }
  const dis = pull("1_7a", [2, 4, 10, 12]);
  const disability = { years: dis.map((r) => r.year), noOneDisabledAhc: dis.map((r) => round(r.values[2])), someoneDisabledAhc: dis.map((r) => round(r.values[3])) };
  const work = pull("1_5e", [2, 4, 6, 8]);
  const workStatus = { years: work.map((r) => r.year), childrenWorking: work.map((r) => round(r.values[0])), childrenWorkless: work.map((r) => round(r.values[1])), adultsWorking: work.map((r) => round(r.values[2])), adultsWorkless: work.map((r) => round(r.values[3])) };
  const deep = b["1_4h"].filter((r) => /^2024\/25/.test(String(r[1]).trim()))[0];
  const deepMaterialChildren = { year: 2024, percent: round(num(deep[3])), millions: round(num(deep[7]), 2) };
  // The Gini and the medians of each fifth, after housing costs and before.
  const t = b["1_2b"];
  const split = t.findIndex((r) => clean(r[0]) === "Income After Housing Costs");
  const take = (rows) => yearRowsAt(rows, 0, 0).filter((r) => r.row[1] !== undefined && num(r.row[1]) !== null).map((r) => ({ year: r.year, q: [1, 3, 5, 7, 9].map((c) => round(num(r.row[c]), 0)), mean: round(num(r.row[11]), 0), gini: round(num(r.row[13]), 1) }));
  const bhc = take(t.slice(0, split));
  const ahc = take(t.slice(split));
  return { years, ...out, counts, disability, workStatus, deepMaterialChildren, gini: { years: ahc.map((r) => r.year), bhc: bhc.map((r) => r.gini), ahc: ahc.map((r) => r.gini) }, quintileMedians: { years: ahc.map((r) => r.year), ahc: [0, 1, 2, 3, 4].map((i) => ahc.map((r) => r.q[i])), bhc: [0, 1, 2, 3, 4].map((i) => bhc.map((r) => r.q[i])) } };
}

function buildWealth(w) {
  const head = w["Table 2.2"].find((r) => r.some((c) => /April 2020\s*to\s*March 2022/.test(String(c))));
  const periods = head.slice(2).map((c) => clean(c).replace(/^\(\d\)\s*/, "")).filter(Boolean);
  const decRows = w["Table 2.2"].filter((r) => /^Total Wealth Decile/.test(clean(r[1]))).slice(0, 10);
  const deciles = decRows.map((r) => r.slice(2, 2 + periods.length));
  const total = periods.map((_, p) => deciles.reduce((s, d) => s + d[p], 0));
  const share = (from, to) => periods.map((_, p) => round((deciles.slice(from, to).reduce((s, d) => s + d[p], 0) / total[p]) * 100, 1));
  const shares = { top10: share(9, 10), top20: share(8, 10), bottom50: share(0, 5), bottom10: share(0, 1), next40: share(5, 9) };
  const latestDeciles = deciles.map((d) => round((d.at(-1) / total.at(-1)) * 100, 1));
  const ginis = {};
  for (const r of w["Table 2.3"]) { const l = clean(r[1]); if (["Property Wealth (net)", "Financial Wealth (net)", "Physical Wealth", "Private Pension Wealth", "Total Wealth"].includes(l) && !ginis[l]) ginis[l] = r.slice(2, 2 + periods.length); }
  const t24 = w["Table 2.4"];
  const medianRow = t24.find((r) => /50th percentile/.test(clean(r[0])));
  const median = medianRow.slice(2, 2 + periods.length);
  const t21 = w["Table 2.1"];
  const comp = (label) => t21.filter((r) => clean(r[1]) === label);
  const components = { aggregateBn: Object.fromEntries(["Property Wealth (net)", "Financial Wealth (net)", "Physical Wealth", "Private Pension Wealth", "Total Wealth (including Private Pension Wealth)"].map((l) => [l, comp(l)[0].slice(2, 2 + periods.length)])), sharePct: Object.fromEntries(["Property Wealth (net)", "Financial Wealth (net)", "Physical Wealth", "Private Pension Wealth"].map((l) => [l, comp(l)[1].slice(2, 2 + periods.length)])) };
  const t28 = w["Table 2.8"];
  const start = t28.findIndex((r) => /50th percentile/.test(clean(r[0])));
  const regions = t28.slice(start, start + 13).map((r) => ({ name: clean(r[1]), median: r[2 + periods.length - 1] })).filter((r) => r.name && r.median !== undefined).map((r) => ({ name: r.name.replace(/&/g, "and"), median: r.median }));
  const t29 = w["Table 2.9"];
  const typeStart = t29.findIndex((r) => /50th percentile/.test(clean(r[0])));
  const householdTypes = t29.slice(typeStart, typeStart + 11).map((r) => ({ name: clean(r[1]).replace(/\s*\(\d\)$/, ""), median: r[2 + periods.length - 1] })).filter((r) => r.name && typeof r.median === "number");
  return { periods, shares, latestDeciles, ginis, median, components, regions, householdTypes, total: total.map((t) => Math.round(t / 1000)) };
}

function buildGdhi(g) {
  const head = g["Table 3"].find((r) => r[0] === "ITL");
  const years = head.slice(3).map(Number);
  const rows = (sheet) => g[sheet].filter((r) => r[0] === "UK" || r[0] === "ITL1" || (r[0] === "Other" && r[2] === "England")).map((r) => ({ name: r[2], values: r.slice(3, 3 + years.length) }));
  const perHead = rows("Table 3");
  const index = rows("Table 4");
  return { years, perHead, index };
}

async function main() {
  const folder = process.argv.includes("--from") ? process.argv[process.argv.indexOf("--from") + 1] : null;
  const [hdii, hbai, wealth, gdhi] = await Promise.all(["hdii", "hbai", "wealth", "gdhi"].map((k) => load(k, folder)));
  const data = {
    built: new Date().toISOString().slice(0, 10),
    sources: {
      hdii: { label: "ONS, The effects of taxes and benefits on household income, financial year ending 2025", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/householddisposableincomeandinequality" },
      hbai: { label: "DWP, Households Below Average Income, 2024/25 (summary tables, published 26 March 2026)", url: "https://www.gov.uk/government/statistics/households-below-average-income-for-financial-years-ending-1995-to-2025" },
      wealth: { label: "ONS, Household total wealth in Great Britain, April 2020 to March 2022 (tables)", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/totalwealthwealthingreatbritain" },
      gdhi: { label: "ONS, Regional gross disposable household income, 1997 to 2024", url: "https://www.ons.gov.uk/economy/regionalaccounts/grossdisposablehouseholdincome/datasets/regionalgrossdisposablehouseholdincomegdhi" },
    },
    income: buildIncome(readXlsx(hdii)),
    poverty: buildPoverty(readOds(hbai)),
    wealth: buildWealth(readXlsx(wealth)),
    regions: buildGdhi(readXlsx(gdhi)),
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
