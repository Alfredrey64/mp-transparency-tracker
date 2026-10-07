// Downloads the English Indices of Deprivation 2025 (Ministry of Housing, Communities and Local
// Government) and boils the 33,755 neighbourhoods down to what the Deprivation page shows: for each
// region of England, the share of people living in the most (and least) deprived tenth of
// neighbourhoods overall and on each of the seven kinds of deprivation, and a one-line summary for
// each of England's 296 local authorities.
//
// The indices are published once, with no regular update, so this does not run every day: run it by
// hand when a new edition appears (change the two file addresses below). England only: Scotland,
// Wales and Northern Ireland have their own indices, built differently, which cannot be compared
// with these.
//
// Contains public sector information licensed under the Open Government Licence v3.0.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "./xlsx-lite.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "deprivation.json");
const HEADERS = { "User-Agent": "uk-parliament-tracker (independent, non-commercial; contact via GitHub)" };
// File 7 is every neighbourhood with its ranks, deciles and population; file 10 summarises each lower-tier local authority.
const FILE_7 = "https://assets.publishing.service.gov.uk/media/691ded56d140bbbaa59a2a7d/File_7_IoD2025_All_Ranks_Scores_Deciles_Population_Denominators.csv";
const FILE_10 = "https://assets.publishing.service.gov.uk/media/6917412ebc34c86ce4e6e7fc/File_10_-_IoD2025_Local_Authority_District_Summaries__lower-tier__v2.xlsx";
const LOOKUP = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD24_RGN24_EN_LU/FeatureServer/0/query?where=1%3D1&outFields=LAD24CD,RGN24NM&resultRecordCount=2000&f=json";

const REGIONS = {
  "North East": "ne", "North West": "nw", "Yorkshire and The Humber": "yh", "East Midlands": "em", "West Midlands": "wm",
  "East of England": "east", London: "london", "South East": "se", "South West": "sw",
};

// The overall index and its seven kinds of deprivation, with the words used in the files.
const DOMAINS = [
  { id: "imd", label: "Overall deprivation", match: "Index of Multiple Deprivation (IMD) Decile", sheet: "IMD" },
  { id: "income", label: "Income", match: "Income Decile", sheet: "Income" },
  { id: "employment", label: "Employment", match: "Employment Decile", sheet: "Employment" },
  { id: "education", label: "Education, skills and training", match: "Education, Skills and Training Decile", sheet: "Education" },
  { id: "health", label: "Health and disability", match: "Health Deprivation and Disability Decile", sheet: "Health" },
  { id: "crime", label: "Crime", match: "Crime Decile", sheet: "Crime" },
  { id: "barriers", label: "Barriers to housing and services", match: "Barriers to Housing and Services Decile", sheet: "Barriers" },
  { id: "living", label: "Living environment", match: "Living Environment Decile", sheet: "Living" },
];

// A small CSV reader that copes with quoted fields.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

async function main() {
  const lookup = Object.fromEntries((await (await get(LOOKUP)).json()).features.map((f) => [f.attributes.LAD24CD, f.attributes.RGN24NM]));
  const [head, ...body] = parseCsv(await (await get(FILE_7)).text()).filter((r) => r.length > 5);
  const col = (needle) => {
    const i = head.findIndex((h) => h.startsWith(needle));
    if (i < 0) throw new Error(`column not found: ${needle}`);
    return i;
  };
  const ladCol = col("Local Authority District code");
  const popCol = col("Total population: mid 2022");
  const scoreCol = col("Index of Multiple Deprivation (IMD) Score");
  const domainCols = DOMAINS.map((d) => col(d.match));

  // Per region: people in each tenth (1 = most deprived) for each kind of deprivation.
  const regions = {};
  const england = { people: 0, score: 0, deciles: DOMAINS.map(() => new Array(10).fill(0)) };
  for (const key of Object.values(REGIONS)) regions[key] = { people: 0, score: 0, deciles: DOMAINS.map(() => new Array(10).fill(0)) };
  for (const row of body) {
    const region = REGIONS[lookup[row[ladCol]]];
    const people = Number(row[popCol]);
    if (!region || !Number.isFinite(people)) continue;
    for (const target of [regions[region], england]) {
      target.people += people;
      target.score += Number(row[scoreCol]) * people;
      domainCols.forEach((c, i) => { target.deciles[i][Number(row[c]) - 1] += people; });
    }
  }
  const summary = (t) => ({
    people: t.people,
    score: round(t.score / t.people),
    // Share of the region's people living in each tenth of neighbourhoods, for each kind of deprivation.
    deciles: Object.fromEntries(DOMAINS.map((d, i) => [d.id, t.deciles[i].map((n) => round((n / t.people) * 100))])),
  });

  // One line for each local authority, from the Ministry's own summary tables.
  const book = readXlsx(Buffer.from(await (await get(FILE_10)).arrayBuffer()));
  const sheetRows = (name) => book[name].filter((r) => /^E\d{8}$/.test(r?.[0] ?? ""));
  const imd = sheetRows("IMD");
  const byCode = {};
  for (const r of imd) byCode[r[0]] = { code: r[0], name: r[1], region: REGIONS[lookup[r[0]]] ?? null, score: round(r[4]), rank: r[5], worst10: round(r[6] * 100), domains: {} };
  for (const d of DOMAINS.slice(1)) {
    const rows = sheetRows(d.sheet);
    const share = book[d.sheet][0].findIndex((h) => /Proportion of LSOAs in most deprived 10%/.test(String(h)) && !/Rank of/.test(String(h)));
    for (const r of rows) if (byCode[r[0]]) byCode[r[0]].domains[d.id] = round(r[share] * 100);
  }
  const areas = Object.values(byCode).filter((a) => a.region).sort((a, b) => a.rank - b.rank);
  if (areas.length < 280) throw new Error(`only ${areas.length} local authorities matched a region`);

  const out = {
    fetchedAt: new Date().toISOString(),
    source: { name: "English Indices of Deprivation 2025 (Ministry of Housing, Communities and Local Government)", url: "https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025" },
    domains: DOMAINS.map(({ id, label }) => ({ id, label })),
    england: summary(england),
    regions: Object.fromEntries(Object.entries(regions).map(([k, t]) => [k, summary(t)])),
    areas,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  console.log(`Saved ${path.relative(process.cwd(), OUT)}: ${areas.length} local authorities, ${Object.keys(regions).length} regions`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
