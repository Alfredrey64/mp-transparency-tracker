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
// SIPRI's names for the countries the page can compare (the first four are the ones shown at first).
const COUNTRIES = {
  uk: "United Kingdom", france: "France", germany: "Germany", usa: "United States of America",
  italy: "Italy", spain: "Spain", poland: "Poland", canada: "Canada", netherlands: "Netherlands", norway: "Norway", turkey: "Türkiye",
  russia: "Russia", china: "China", ukraine: "Ukraine",
};
const LABELS = { uk: "United Kingdom", france: "France", germany: "Germany", usa: "United States", italy: "Italy", spain: "Spain", poland: "Poland", canada: "Canada", netherlands: "Netherlands", norway: "Norway", turkey: "Turkey", russia: "Russia", china: "China", ukraine: "Ukraine" };
const here2 = path.dirname(fileURLToPath(import.meta.url));

const round = (v, n) => Math.round(v * 10 ** n) / 10 ** n;

// The armed forces' fully trained full-time strength each quarter (Ministry of Defence, quarterly service personnel statistics, worksheet 3a). The
// published figures are rounded to the nearest 10 in the bulletin, so these are too. The Army counts "trade trained" and the others "trained"; the
// Ministry's own total adds them and so does this.
async function fullTimeTrained() {
  const page = await (await fetch(`https://www.gov.uk/api/content/government/statistics/quarterly-service-personnel-statistics-${new Date().getFullYear()}`, { headers: { "User-Agent": "Mozilla/5.0 simple-politics" } })).json();
  const file = page.details.attachments.find((a) => a.content_type?.includes("spreadsheetml"));
  if (!file) throw new Error("No Excel tables on the Ministry of Defence page");
  const wb = readXlsx(Buffer.from(await (await fetch(file.url, { headers: { "User-Agent": "Mozilla/5.0 simple-politics" } })).arrayBuffer()));
  const rows = wb["3a"];
  const head = rows.find((r) => r && typeof r[1] === "string" && /\d{4}/.test(r[1]) && String(r[0]).includes("against the Workforce Requirement"));
  const months = { January: 0, April: 0.25, July: 0.5, October: 0.75 };
  const cols = head.map((h, c) => ({ c, m: /(January|April|July|October)\s+(\d{4})/.exec(String(h).replace(/\s+/g, " ")) })).filter((x) => x.m);
  const times = cols.map((x) => Number(x.m[2]) + months[x.m[1]]);
  const row = (name) => { const r = rows.find((x) => x && x[0] === name); if (!r) throw new Error(`No ${name}`); return cols.map((x) => (typeof r[x.c] === "number" ? Math.round(r[x.c] / 10) * 10 : null)); };
  const out = { published: String(page.title), file: file.title, times, all: row("FTTS (RN/RM and RAF) and FTTTS (Army)"), navy: row("Royal Navy/Royal Marines (FTTS)"), army: row("Army (FTTTS)"), airForce: row("Royal Air Force (FTTS)") };
  return out;
}

// Gross domestic product over the latest four quarters and the population, from the ONS data the rest of the site already holds.
function ukEconomy() {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(here2, "../src/data/ons", f), "utf8")).series;
  const q = read("economy.json")["gdp-cp"].points;
  const four = q.slice(-4);
  const pop = read("population.json").uk.points;
  return { gdpBillions: Math.round(four.reduce((a, p) => a + p[1], 0) / 1000), gdpQuarters: `${four[0][0]} to ${four[3][0]}`, populationMillions: Math.round(pop.at(-1)[1] / 1e5) / 10, populationYear: pop.at(-1)[0] };
}

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
  const real = Object.fromEntries(Object.entries(COUNTRIES).map(([k, n]) => [k, series("Constant (2024) US$", n)]));
  const realAligned = Object.fromEntries(Object.entries(real).map(([k, s]) => [k, years.map((y) => { const j = s.years.indexOf(y); return j < 0 ? null : round(s.values[j] / 1000, 1); })]));
  const forces = await fullTimeTrained();
  const economy = ukEconomy();
  const ukReal = series("Constant (2024) US$", COUNTRIES.uk);
  const ukGov = series("Share of Govt. spending", COUNTRIES.uk);
  const ukPerHead = series("Per capita", COUNTRIES.uk);
  const data = {
    built: new Date().toISOString().slice(0, 10),
    source: { label: "SIPRI Military Expenditure Database, 1949 to 2025 (published April 2026)", url: "https://www.sipri.org/databases/milex" },
    countries: LABELS,
    shareOfGdp: { years, ...aligned },
    realBillions: { years, ...realAligned },
    forces,
    economy,
    ukRealBillions: { years: ukReal.years, values: ukReal.values.map((v) => round(v / 1000, 1)) },
    ukShareOfGovernmentSpending: { years: ukGov.years, values: ukGov.values.map((v) => round(v * 100, 1)) },
    ukPerHeadUsd: { years: ukPerHead.years, values: ukPerHead.values.map((v) => Math.round(v)) },
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
