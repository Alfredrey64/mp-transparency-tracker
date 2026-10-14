// Builds src/data/inequalityAbroad.json for the "Compared with other countries" tab of the Inequality page, from the OECD Income Distribution Database.
//
//   node scripts/build-international-inequality-data.mjs
//
// The OECD measures every country's household income the same way (equivalised disposable income, as the "current" definition since 2012), so the
// Gini coefficients are comparable between countries. They are not the same as the Office for National Statistics' own figures for the UK, which use
// the ONS's definition and a different survey year, so the page says which is which. Gini is on a scale of 0 (everyone has the same) to 1 (one
// person has everything); the page shows it as a percentage point figure to match how the ONS reports it.
//
// The data come from the OECD's open SDMX interface (https://sdmx.oecd.org/public/rest/). Nothing needs a key.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/inequalityAbroad.json");
const BASE = "https://sdmx.oecd.org/public/rest/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD,1.0";
const FROM = 2000;

const NAMES = {
  AUS: "Australia", AUT: "Austria", BEL: "Belgium", BGR: "Bulgaria", BRA: "Brazil", CAN: "Canada", CHE: "Switzerland", CHL: "Chile", CHN: "China", COL: "Colombia", CRI: "Costa Rica",
  CZE: "Czechia", DEU: "Germany", DNK: "Denmark", ESP: "Spain", EST: "Estonia", FIN: "Finland", FRA: "France", GBR: "United Kingdom", GRC: "Greece", HRV: "Croatia", HUN: "Hungary",
  IND: "India", IRL: "Ireland", ISL: "Iceland", ISR: "Israel", ITA: "Italy", JPN: "Japan", KOR: "South Korea", LTU: "Lithuania", LUX: "Luxembourg", LVA: "Latvia", MEX: "Mexico",
  NLD: "Netherlands", NOR: "Norway", NZL: "New Zealand", POL: "Poland", PRT: "Portugal", ROU: "Romania", RUS: "Russia", SVK: "Slovakia", SVN: "Slovenia", SWE: "Sweden", TUR: "Turkey",
  USA: "United States", ZAF: "South Africa",
};
const MEMBERS = new Set("AUS AUT BEL CAN CHL COL CRI CZE DNK EST FIN FRA DEU GRC HUN ISL IRL ISR ITA JPN KOR LVA LTU LUX MEX NLD NZL NOR POL PRT SVK SVN ESP SWE CHE TUR GBR USA".split(" "));

function parseCsv(text) {
  const rows = [];
  for (const line of text.split("\n")) if (line.trim()) rows.push(line.split(","));
  const head = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

async function pull(measure) {
  const url = `${BASE}/.A.${measure}....METH2012.D_CUR.?startPeriod=${FROM}`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.sdmx.data+csv;version=1.0.0", "User-Agent": "Mozilla/5.0 simple-politics" } });
  if (!res.ok) throw new Error(`${measure}: ${res.status}`);
  return parseCsv(await res.text());
}

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

// For each country, a series of { years, values } from the rows that match.
function seriesBy(rows, test, scale, digits) {
  const by = new Map();
  for (const r of rows) {
    if (!test(r)) continue;
    const v = Number(r.OBS_VALUE);
    if (!Number.isFinite(v)) continue;
    if (!by.has(r.REF_AREA)) by.set(r.REF_AREA, new Map());
    by.get(r.REF_AREA).set(Number(r.TIME_PERIOD), round(v * scale, digits));
  }
  return by;
}

async function main() {
  const [gini, market, gross, palma, s80, poverty] = await Promise.all(["INC_DISP_GINI", "INC_MRKT_GINI", "INC_GROSS_GINI", "PAL_INC_DISP", "QR_INC_DISP", "PR_INC_DISP"].map(pull));
  const total = (r) => r.AGE === "_T";
  const g = seriesBy(gini, total, 100, 1);
  const m = seriesBy(market, total, 100, 1);
  const gr = seriesBy(gross, total, 100, 1);
  const p = seriesBy(palma, total, 1, 2);
  const q = seriesBy(s80, total, 1, 2);
  const pov = seriesBy(poverty, (r) => total(r) && r.POVERTY_LINE === "PL_50", 1, 1);
  const latest = (by, c) => { const s = by.get(c); if (!s?.size) return null; const y = Math.max(...s.keys()); return { year: y, value: s.get(y) }; };
  const countries = {};
  for (const c of [...g.keys()].sort()) {
    if (!NAMES[c]) continue;
    const years = [...g.get(c).keys()].sort((a, b) => a - b);
    countries[c] = {
      name: NAMES[c], member: MEMBERS.has(c),
      gini: { years, values: years.map((y) => g.get(c).get(y)) },
      latest: { gini: latest(g, c), market: latest(m, c), gross: latest(gr, c), palma: latest(p, c), s80s20: latest(q, c), poverty: latest(pov, c) },
    };
    const my = m.get(c) ? [...m.get(c).keys()].sort((a, b) => a - b) : [];
    countries[c].market = { years: my, values: my.map((y) => m.get(c).get(y)) };
  }
  const data = {
    built: new Date().toISOString().slice(0, 10),
    source: { label: "OECD, Income Distribution Database (IDD)", url: "https://www.oecd.org/en/data/datasets/oecd-income-distribution-database.html" },
    countries,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB), ${Object.keys(countries).length} countries`);
}
main().catch((e) => { console.error(e); process.exit(1); });
