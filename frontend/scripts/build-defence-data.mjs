// Builds src/data/defenceData.json for the Defence page from the SIPRI Military Expenditure Database.
//
//   node scripts/build-defence-data.mjs [--from <path to SIPRI-Milex-data-1949-2025.xlsx>]
//
// SIPRI (the Stockholm International Peace Research Institute) counts military spending in one way for every country, so countries can be compared
// and a long run is possible (1949 on). Its totals differ a little from NATO's and from the Ministry of Defence's, which use their own definitions,
// so the page says which is which. The file's address changes each year when the new edition is published.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/defenceData.json");
const URL_ = "https://www.sipri.org/sites/default/files/SIPRI-Milex-data-1949-2025.xlsx";
const COUNTRIES = { uk: "United Kingdom", france: "France", germany: "Germany", usa: "United States of America" };

const round = (v, n) => Math.round(v * 10 ** n) / 10 ** n;

async function main() {
  const i = process.argv.indexOf("--from");
  const buf = i > 0 ? fs.readFileSync(process.argv[i + 1]) : Buffer.from(await (await fetch(URL_, { headers: { "User-Agent": "Mozilla/5.0 simple-politics" } })).arrayBuffer());
  const wb = readXlsx(buf);
  const series = (sheet, name, from = 1949) => {
    const rows = wb[sheet];
    const head = rows.find((r) => r && r[0] === "Country");
    const row = rows.find((r) => r && String(r[0]).trim() === name);
    if (!row) throw new Error(`No ${name} in ${sheet}`);
    const out = { years: [], values: [] };
    head.slice(2).forEach((y, k) => { const v = row[2 + k]; if (typeof y === "number" && y >= from && typeof v === "number") { out.years.push(y); out.values.push(v); } });
    return out;
  };
  const gdp = Object.fromEntries(Object.entries(COUNTRIES).map(([k, n]) => [k, series("Share of GDP", n)]));
  const years = gdp.uk.years;
  const aligned = Object.fromEntries(Object.entries(gdp).map(([k, s]) => [k, years.map((y) => { const j = s.years.indexOf(y); return j < 0 ? null : round(s.values[j] * 100, 2); })]));
  const ukReal = series("Constant (2024) US$", COUNTRIES.uk);
  const ukGov = series("Share of Govt. spending", COUNTRIES.uk);
  const ukPerHead = series("Per capita", COUNTRIES.uk);
  const data = {
    built: new Date().toISOString().slice(0, 10),
    source: { label: "SIPRI Military Expenditure Database, 1949 to 2025 (published April 2026)", url: "https://www.sipri.org/databases/milex" },
    shareOfGdp: { years, ...aligned },
    ukRealBillions: { years: ukReal.years, values: ukReal.values.map((v) => round(v / 1000, 1)) },
    ukShareOfGovernmentSpending: { years: ukGov.years, values: ukGov.values.map((v) => round(v * 100, 1)) },
    ukPerHeadUsd: { years: ukPerHead.years, values: ukPerHead.values.map((v) => Math.round(v)) },
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
