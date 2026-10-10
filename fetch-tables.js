// Series that come from published spreadsheets rather than from a time series API:
// NHS England waiting times, the ONS migration tables, and the Home Office's asylum,
// returns, visa and small boat statistics. Each "feed" below finds the latest file,
// reads it with the small xlsx/ods readers, and returns [[period, value], ...].
//
// Periods use the same strings as the rest of the pipeline: "YYYY-MM" for a month (or the
// month a 12-month total ends in, or the date something was counted "as at").
//
// Contains public sector information licensed under the Open Government Licence v3.0.

import { readXlsx } from "./xlsx-lite.js";
import { readOds } from "./ods-lite.js";
import { readXls } from "./xls-lite.js";

const HEADERS = { "User-Agent": "Mozilla/5.0 (simple-politics; independent, non-commercial; contact via GitHub)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getBuffer(url, tries = 3) {
  let lastError;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastError = e;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error(`${url}: ${lastError?.message ?? "failed"}`);
}
const getText = async (url) => (await getBuffer(url)).toString("utf8");
const getJson = async (url) => JSON.parse(await getText(url));

// ---------------------------------------------------------------------------
// Pure helpers (tested in fetch-tables.test.js)

const MONTHS = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };

// "2025", "2024 [p]", "Dec 2010", "June 2026", "Year ending June 2025", "YE Mar 25 P R" -> "YYYY-MM" (a bare year means December).
export function headerPeriod(text) {
  const t = String(text ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
  // A financial year, "2024-25", is a year ending in March; a quarter, "2026 Q2", stays a quarter.
  const fy = /^(\d{4})-(\d{2})\b/.exec(t);
  if (fy && (Number(fy[1]) + 1) % 100 === Number(fy[2])) return `${Number(fy[1]) + 1}-03`;
  const q = /^(\d{4}) Q([1-4])\b/.exec(t);
  if (q) return `${q[1]}-Q${q[2]}`;
  const ye = /^YE ([A-Za-z]{3}) (\d{2})\b/.exec(t);
  if (ye && MONTHS[ye[1].toLowerCase()]) return `20${ye[2]}-${MONTHS[ye[1].toLowerCase()]}`;
  const named = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? (\d{4})\b/i.exec(t);
  if (named) return `${named[2]}-${MONTHS[named[1].toLowerCase()]}`;
  if (/^\d{4}$/.test(t)) return `${t}-12`;
  return null;
}

const numeric = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const byPeriod = (points) => points.sort((a, b) => a[0].localeCompare(b[0]));

// A table with periods across the top and one row per measure: find the header row (its first
// cell matches `headerFirst`), then the row whose first cell is `label`.
export function pointsFromRow(rows, headerFirst, label, scale = 1) {
  const head = rows.findIndex((r) => r && headerFirst.test(String(r[0] ?? "")));
  if (head < 0) throw new Error(`header ${headerFirst} not found`);
  const row = rows.slice(head + 1).find((r) => r && String(r[0] ?? "").replace(/\s+/g, " ").trim() === label);
  if (!row) throw new Error(`row "${label}" not found`);
  const points = [];
  rows[head].forEach((cell, i) => {
    const period = headerPeriod(cell);
    const v = numeric(row[i]);
    if (period && v !== null && i > 0) points.push([period, v * scale]);
  });
  return byPeriod(points);
}

// A table with one row per period down the side and one column per measure.
export function pointsFromColumn(rows, headerFirst, columnName, scale = 1) {
  const head = rows.findIndex((r) => r && headerFirst.test(String(r[0] ?? "")));
  if (head < 0) throw new Error(`header ${headerFirst} not found`);
  const col = rows[head].findIndex((c) => String(c ?? "").replace(/\s+/g, " ").trim() === columnName);
  if (col < 0) throw new Error(`column "${columnName}" not found`);
  const points = [];
  for (const r of rows.slice(head + 1)) {
    const period = headerPeriod(r?.[0]);
    const v = numeric(r?.[col]);
    if (period && v !== null) points.push([period, v * scale]);
  }
  return byPeriod(points);
}

// ONS migration table 1: "Flow", "Period" ("YE Dec 25 P"), then a column per nationality group.
export function pointsFromFlow(rows, flow, col) {
  const points = [];
  for (const r of rows) {
    if (!r || String(r[0] ?? "").replace(/\s+/g, " ").trim() !== flow) continue;
    const period = headerPeriod(r[1]);
    const v = numeric(r[col]);
    if (period && v !== null) points.push([period, v]);
  }
  if (!points.length) throw new Error(`flow "${flow}" not found`);
  return byPeriod(points);
}

// Daily counts ("2018-01-01", 3) added up into months. The latest month is left out unless
// the data runs to its last day, so a part-month never looks like a quiet one.
export function monthlySums(rows) {
  const totals = new Map();
  let latest = "";
  for (const r of rows) {
    const m = /^(\d{4}-\d{2})-(\d{2})$/.exec(String(r?.[0] ?? ""));
    const v = numeric(r?.[1]);
    if (m && v !== null) {
      totals.set(m[1], (totals.get(m[1]) ?? 0) + v);
      if (r[0] > latest) latest = r[0];
    }
  }
  if (latest) {
    const [y, mo, d] = latest.split("-").map(Number);
    if (d < new Date(Date.UTC(y, mo, 0)).getUTCDate()) totals.delete(latest.slice(0, 7));
  }
  return byPeriod([...totals.entries()]);
}

// An Excel date number (days since 1900) -> "YYYY-MM".
export function serialToPeriod(serial) {
  if (!(serial > 20000 && serial < 80000)) return null;
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 7);
}

// Minimal CSV reader that copes with quoted fields.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') quoted = false; else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---------------------------------------------------------------------------
// Finding the latest file for each source

const cache = new Map();
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

async function firstLink(pageUrl, pattern) {
  const html = await getText(pageUrl);
  const link = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).find((h) => pattern.test(h));
  if (!link) throw new Error(`${pageUrl}: no link matching ${pattern}`);
  return new URL(link, pageUrl).toString();
}

// NHS England files each financial year's waiting times on its own page ("rtt-data-2026-27").
async function rttBook() {
  const now = new Date();
  const start = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  for (const y of [start, start - 1]) {
    const page = `https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/rtt-data-${y}-${String(y + 1).slice(2)}/`;
    try {
      const url = await firstLink(page, /RTT-Overview-Timeseries[^"]*\.xlsx$/i);
      return readXlsx(await getBuffer(url));
    } catch (e) {
      if (y === start - 1) throw e;
    }
  }
  return null;
}
const rtt = () => once("rtt", rttBook);
const cwt = () => once("cwt", async () => readXlsx(await getBuffer(await firstLink("https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/", /CWT-CRS-National-Time-Series[^"]*Provisional\.xlsx$/i))));
const ae = () => once("ae", async () => readXls(await getBuffer(await firstLink("https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/", /Monthly-AE-Time-Series-[A-Za-z]+-\d{4}[^"]*\.xls$/i))));
const amb = () => once("amb", async () => parseCsv((await getBuffer(await firstLink("https://www.england.nhs.uk/statistics/statistical-work-areas/ambulance-quality-indicators/", /AmbSYS-to-[^"]*\.csv$/i))).toString("utf8")));

async function onsMigration() {
  const root = "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/datasets/longterminternationalimmigrationemigrationandnetmigrationflowsprovisional";
  const list = await getJson(`${root}/data`);
  const latest = list.datasets?.[0]?.uri;
  if (!latest) throw new Error("migration: no release");
  const release = await getJson(`https://www.ons.gov.uk${latest}/data`);
  const file = release.downloads?.[0]?.file;
  if (!file) throw new Error("migration: no file");
  return { sheets: readXlsx(await getBuffer(`https://www.ons.gov.uk/file?uri=${latest}/${file}`)), updated: release.description?.releaseDate ?? null };
}
const migration = () => once("migration", onsMigration);

// The Home Office lists each release as attachments on a GOV.UK page.
async function attachment(apiPath, titlePattern) {
  const page = await once(`gov|${apiPath}`, () => getJson(`https://www.gov.uk/api/content${apiPath}`));
  const found = (page.details?.attachments ?? []).find((a) => titlePattern.test(a.title ?? "") && a.url);
  if (!found) throw new Error(`${apiPath}: no attachment ${titlePattern}`);
  return { url: new URL(found.url, "https://www.gov.uk").toString(), updated: page.public_updated_at ?? null };
}
const IMMIGRATION_TABLES = "/government/statistical-data-sets/immigration-system-statistics-data-tables";
const hoBook = (title) => once(`ho|${title}`, async () => readOds(await getBuffer((await attachment(IMMIGRATION_TABLES, title)).url)));
const asylum = () => hoBook(/^Asylum summary tables/i);
const returns = () => hoBook(/^Returns summary tables/i);
const visas = () => hoBook(/^Entry clearance visas summary tables/i);
const HOUSING_TABLES = "/government/statistical-data-sets/live-tables-on-net-supply-of-housing";
const HOUSE_BUILDING = "/government/statistical-data-sets/live-tables-on-house-building";
const netSupply = () => once("lt120", async () => readOds(await getBuffer((await attachment(HOUSING_TABLES, /^Table 120:/i)).url)));
const houseBuilding = () => once("lt213", async () => readOds(await getBuffer((await attachment(HOUSE_BUILDING, /^Table 213:/i)).url)));
const boats = () => once("boats", async () => readOds(await getBuffer((await attachment("/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats", /time series/i)).url)));

// ---------------------------------------------------------------------------
// The feeds: name -> () => { points, updated? }

const ASYLUM_HEAD = /^Date \/ As at/i;
const sheetOf = async (book, name) => {
  const rows = (await book())[name];
  if (!rows) throw new Error(`sheet ${name} not found`);
  return rows;
};

async function rttColumn(col, scale = 1) {
  const rows = (await rtt())["Full Time Series"];
  const points = [];
  for (const r of rows) {
    const period = serialToPeriod(r?.[2]);
    const v = numeric(r?.[col]);
    if (period && v !== null) points.push([period, v * scale]);
  }
  if (points.length < 12) throw new Error(`RTT column ${col}: too few points`);
  return byPeriod(points);
}

async function cwtColumn(col) {
  const rows = (await cwt())["Monthly Performance"];
  const points = [];
  for (const r of rows) {
    const period = serialToPeriod(r?.[1]);
    const v = numeric(r?.[col]);
    if (period && v !== null && v > 0 && v <= 1) points.push([period, v * 100]);
  }
  if (points.length < 12) throw new Error(`cancer column ${col}: too few points`);
  return byPeriod(points);
}

async function aeColumn(col) {
  const rows = (await ae())["Performance"];
  const points = [];
  for (const r of rows) {
    const period = serialToPeriod(r?.[1]);
    const v = numeric(r?.[col]);
    if (period && v !== null && v > 0 && v <= 1) points.push([period, v * 100]);
  }
  if (points.length < 12) throw new Error(`A&E column ${col}: too few points`);
  return byPeriod(points);
}

async function ambulanceColumn(code, scale) {
  const rows = await amb();
  const head = rows[0];
  const col = head.indexOf(code);
  if (col < 0) throw new Error(`ambulance column ${code} not found`);
  const points = [];
  for (const r of rows.slice(1)) {
    if (r[2] !== "Eng" || r[3] !== "Eng") continue;
    const v = Number(r[col]);
    const month = String(Number(r[1])).padStart(2, "0");
    if (/^\d{4}$/.test(r[0]) && Number.isFinite(v) && r[col] !== "") points.push([`${r[0]}-${month}`, v * scale]);
  }
  if (points.length < 12) throw new Error(`ambulance ${code}: too few points`);
  return byPeriod(points);
}

// ---------------------------------------------------------------------------
// ONS Household Costs Indices: the cost of living for different kinds of household, counting mortgage interest, rent, council
// tax and the other things the main inflation figures leave out. The reference tables start in January 2022; January 2006 to
// December 2021 comes from an ONS extract for all households (the same index, 2015 = 100).

const HCI_PAGE = "https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/householdcostsindicesforukhouseholdgroupsreferencetables";
const HCI_LONG = "https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/adhocs/1676householdcostsindexallhouseholdsannualinflationratesjanuary2006toseptember2023/allhhhcijan06tosep23.csv";
const HCI_GROUPS = {
  "hci-decile1": "Income Decile 1", "hci-decile10": "Income Decile 10", "hci-mortgagor": "Mortgagor and other owner occupier", "hci-outright": "Outright owner occupier",
  "hci-renter": "Private renter", "hci-social": "Social and other renter", "hci-retired": "Retired", "hci-nonretired": "Non-Retired", "hci-children": "With Children", "hci-nochildren": "Without Children",
};

// "Jun-2026 [p]" -> "2026-06"; "Jan-06" -> "2006-01".
export function hciPeriod(text) {
  const m = /^([A-Za-z]{3})-(\d{2}|\d{4})\b/.exec(String(text ?? "").trim());
  if (!m || !MONTHS[m[1].toLowerCase()]) return null;
  return `${m[2].length === 2 ? `20${m[2]}` : m[2]}-${MONTHS[m[1].toLowerCase()]}`;
}

// The most recent of ONS's quarterly editions, read from the folder names in the links ("apriltojune2026", "october2025todecember2025").
export function latestHciLink(links) {
  const ORDER = Object.keys(MONTHS);
  const scored = links.map((l) => {
    const m = /\/(?:[a-z]+\d{0,4})to([a-z]+)(\d{4})\//.exec(l);
    if (!m) return null;
    const month = ORDER.indexOf(m[1].slice(0, 3));
    return month < 0 ? null : { l, at: Number(m[2]) * 12 + month };
  }).filter(Boolean).sort((a, b) => b.at - a.at);
  return scored[0]?.l ?? null;
}

const hciBook = () => once("hci", async () => {
  const html = await getText(HCI_PAGE);
  const links = [...html.matchAll(/href="(\/file\?uri=[^"]+\.xlsx)"/g)].map((m) => m[1]);
  const link = latestHciLink(links);
  if (!link) throw new Error("no Household Costs Indices tables found");
  return readXlsx(await getBuffer(new URL(link, "https://www.ons.gov.uk").toString()));
});

const hciLong = () => once("hci-long", async () => {
  const out = new Map();
  for (const line of (await getText(HCI_LONG)).split("\n").slice(2)) {
    const [d, rate, index] = line.split(",");
    const period = hciPeriod(d);
    if (period && period < "2022-01" && Number.isFinite(Number(rate)) && Number.isFinite(Number(index))) out.set(period, { rate: Number(rate), index: Number(index) });
  }
  return out;
});

async function hciTable(sheet, column) {
  const rows = (await hciBook())[sheet];
  const head = rows.find((r) => r?.[0] === "Description:");
  const col = head.indexOf(column);
  if (col < 0) throw new Error(`HCI column ${column} not found`);
  return rows.map((r) => [hciPeriod(r?.[0]), numeric(r?.[col])]).filter(([p, v]) => p && v !== null);
}

export const FEEDS = {
  // ONS: Household Costs Indices, all households: the index (2015 = 100) and how much it rose over 12 months, January 2006 onwards
  "hci-all-index": async () => byPeriod([...[...(await hciLong())].map(([p, v]) => [p, v.index]), ...(await hciTable("Table 2", "All Households"))]),
  "hci-all-rate": async () => byPeriod([...[...(await hciLong())].map(([p, v]) => [p, v.rate]), ...(await hciTable("Table 1", "All Households"))]),
  // ONS: Household Costs Indices, how much the cost of living rose over 12 months for one kind of household, January 2022 onwards
  ...Object.fromEntries(Object.entries(HCI_GROUPS).map(([id, column]) => [id, async () => byPeriod(await hciTable("Table 1", column))])),
  // NHS England: referral to treatment (RTT) waiting times, England
  "rtt-waiting": () => rttColumn(22),
  "rtt-within-18": () => rttColumn(8, 100),
  "rtt-over-52": () => rttColumn(12),
  "rtt-median": () => rttColumn(3),
  // NHS England: cancer waiting times
  "cancer-28-day": () => cwtColumn(5),
  "cancer-31-day": () => cwtColumn(12),
  "cancer-62-day": () => cwtColumn(19),
  // NHS England: A&E, share of attendances dealt with within four hours
  "ae-4-hour": () => aeColumn(10),
  "ae-4-hour-major": () => aeColumn(11),
  // NHS England: ambulance response times (Category 2 = emergencies such as strokes and heart attacks; Category 1 = life-threatening)
  "ambulance-c2": () => ambulanceColumn("A31", 1 / 60),
  "ambulance-c1": () => ambulanceColumn("A25", 1 / 60),
  // ONS: long-term international migration, year ending
  "migration-net": async () => pointsFromFlow(await sheetOf(async () => (await migration()).sheets, "1"), "Net migration", 2),
  "migration-in": async () => pointsFromFlow(await sheetOf(async () => (await migration()).sheets, "1"), "Immigration", 2),
  "migration-out": async () => pointsFromFlow(await sheetOf(async () => (await migration()).sheets, "1"), "Emigration", 2).map(([p, v]) => [p, Math.abs(v)]),
  "migration-non-eu": async () => pointsFromFlow(await sheetOf(async () => (await migration()).sheets, "1"), "Immigration", 5),
  // Housing supply, England (Department for Levelling Up, Housing and Communities)
  "homes-net": async () => pointsFromRow(await sheetOf(netSupply, "LT120_rounded"), /^Components of net housing supply$/i, "Total net additional dwellings"),
  "homes-completed": async () => pointsFromColumn(await sheetOf(houseBuilding, "LT_213_quarterly"), /^Period/i, "All Completions"),
  "homes-started": async () => pointsFromColumn(await sheetOf(houseBuilding, "LT_213_quarterly"), /^Period/i, "All Starts"),
  // Home Office: small boats (daily counts added up into months)
  "boats-month": async () => monthlySums(await sheetOf(boats, "SB_01")),
  // Home Office: asylum
  "asylum-claims": async () => pointsFromRow(await sheetOf(asylum, "Asy_00a"), ASYLUM_HEAD, "People claiming asylum"),
  "asylum-awaiting": async () => pointsFromRow(await sheetOf(asylum, "Asy_00a"), ASYLUM_HEAD, "People awaiting an initial decision"),
  "asylum-support": async () => pointsFromRow(await sheetOf(asylum, "Asy_00a"), ASYLUM_HEAD, "Asylum seekers in receipt of support"),
  "asylum-hotels": async () => pointsFromRow(await sheetOf(asylum, "Asy_00a"), ASYLUM_HEAD, "Of which accommodated in hotels"),
  "asylum-grant-rate": async () => pointsFromRow(await sheetOf(asylum, "Asy_00a"), ASYLUM_HEAD, "Grant rate at initial decision", 100),
  // Home Office: returns
  "returns-enforced": async () => pointsFromColumn(await sheetOf(returns, "Ret_01"), /^Data of return/i, "Enforced returns, total"),
  "returns-voluntary": async () => pointsFromColumn(await sheetOf(returns, "Ret_01"), /^Data of return/i, "Voluntary returns, total"),
  // Home Office: entry clearance visas granted
  "visas-work": async () => pointsFromRow(await sheetOf(visas, "Vis_01"), /^Visa type/i, "Work visas"),
  "visas-study": async () => pointsFromRow(await sheetOf(visas, "Vis_01"), /^Visa type/i, "Study visas"),
  "visas-family": async () => pointsFromRow(await sheetOf(visas, "Vis_01"), /^Visa type/i, "Family visas"),
};

// The date a feed's source was last published, where the source says.
export async function feedUpdated(feed) {
  try {
    if (feed.startsWith("migration")) return (await migration()).updated ?? null;
  } catch {
    // not worth failing for
  }
  return null;
}

export async function fetchFeed(feed) {
  const make = FEEDS[feed];
  if (!make) throw new Error(`unknown feed ${feed}`);
  const points = await make();
  if (!points.length) throw new Error(`${feed}: nothing found`);
  const freq = points.every(([p]) => /-Q\d$/.test(p)) ? "quarters" : "months";
  return { freq, points, updated: await feedUpdated(feed) };
}
