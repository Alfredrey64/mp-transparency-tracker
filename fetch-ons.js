// Downloads the official figures behind the "Britain in numbers" pages and
// saves one small JSON file per page in frontend/src/data/ons/. Most come from
// the Office for National Statistics; house prices come from HM Land Registry,
// crime from the ONS crime tables, interest rates, mortgage approvals and
// exchange rates from the Bank of England, and NHS waiting times, migration,
// asylum, small boats and housing supply from the spreadsheets their
// publishers release (see fetch-tables.js).
//
// Which series to fetch is defined once, in frontend/src/data/onsSectors.js,
// which the pages read as well. Weekly deaths come from the ONS dataset API;
// the ONS figures are classic time series. If a series can't be fetched this
// run, the copy saved last time is kept, so one bad response never blanks a
// page. The script only fails (so the daily status report flags it) when it
// couldn't refresh anything at all.
//
// Contains public sector information licensed under the Open Government
// Licence v3.0.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SECTORS, WEEKLY_DEATHS, sectorSeries } from "./frontend/src/data/onsSectors.js";
import { normalisePeriod } from "./frontend/src/lib/onsFormat.js";
import { readXlsx } from "./xlsx-lite.js";
import { fetchFeed } from "./fetch-tables.js";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "ons");
const HEADERS = { "User-Agent": "uk-parliament-tracker (independent, non-commercial; contact via GitHub)" };
// Keep the whole history: the pages compare today with decades ago.
const KEEP = { months: 1200, quarters: 400, years: 200 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  let lastError;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastError = e;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error(`${url}: ${lastError?.message ?? "failed"}`);
}

// One ONS time series as { freq, title, updated, points: [[period, value], ...] }.
async function fetchSeries(def) {
  const j = await getJson(`https://www.ons.gov.uk${def.path}/timeseries/${def.cdid.toLowerCase()}/${def.dataset}/data`);
  const freq = ["months", "quarters", "years"].find((k) => Array.isArray(j[k]) && j[k].length);
  if (!freq) throw new Error(`${def.cdid}: no data`);
  const points = [];
  for (const row of j[freq]) {
    const period = normalisePeriod(freq, row.date);
    const value = Number(row.value);
    if (period && row.value !== "" && Number.isFinite(value)) points.push([period, value]);
  }
  if (!points.length) throw new Error(`${def.cdid}: no usable points`);
  return {
    freq,
    title: j.description?.title ?? def.label,
    updated: j.description?.releaseDate ?? null,
    next: j.description?.nextRelease ?? null,
    points: points.slice(-KEEP[freq]),
  };
}

// --- House prices: the UK House Price Index (HM Land Registry, ONS and others) ---

const hpiCache = new Map();

async function hpiRegion(region) {
  if (!hpiCache.has(region)) {
    const items = [];
    for (let page = 0; page < 20; page++) {
      const j = await getJson(`https://landregistry.data.gov.uk/data/ukhpi/region/${region}.json?_view=all&_pageSize=200&_page=${page}&_sort=refMonth`);
      const got = j.result?.items ?? [];
      items.push(...got);
      if (got.length < 200) break;
      await sleep(200);
    }
    hpiCache.set(region, items);
  }
  return hpiCache.get(region);
}

async function fetchHpi(def) {
  const items = await hpiRegion(def.hpi.region);
  const points = items
    .filter((i) => i.refMonth && typeof i[def.hpi.field] === "number")
    .map((i) => [i.refMonth, i[def.hpi.field]])
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (!points.length) throw new Error(`${def.hpi.region}/${def.hpi.field}: no data`);
  return { freq: "months", title: def.label, updated: null, points: points.slice(-KEEP.months) };
}

// --- Crime: tables in the ONS "Crime in England and Wales" appendix workbook ---

let crimeBook;
const MONTHS = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
const tidy = (x) => String(x ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();

async function crimeWorkbook() {
  if (!crimeBook) {
    const root = await getJson("https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/datasets/crimeinenglandandwalesappendixtables/data");
    const latest = root.datasets?.[0]?.uri;
    if (!latest) throw new Error("crime tables: no latest release");
    const release = await getJson(`https://www.ons.gov.uk${latest}/data`);
    const file = release.downloads?.[0]?.file;
    if (!file) throw new Error("crime tables: no file");
    const res = await fetch(`https://www.ons.gov.uk/file?uri=${latest}/${file}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`crime tables: HTTP ${res.status}`);
    crimeBook = { sheets: readXlsx(Buffer.from(await res.arrayBuffer())), updated: release.description?.releaseDate ?? null };
  }
  return crimeBook;
}

async function fetchTable(def) {
  const book = await crimeWorkbook();
  const rows = book.sheets[def.table.sheet];
  if (!rows) throw new Error(`${def.table.sheet}: sheet not found`);
  const col = def.table.labelCol;
  const headIndex = rows.findIndex((r) => /^offence/i.test(tidy(r?.[col])));
  if (headIndex < 0) throw new Error(`${def.table.sheet}: header not found`);
  // Each data column is headed "Apr 2025 to Mar 2026": keep the month it ends in.
  const periods = {};
  rows[headIndex].forEach((cell, i) => {
    const text = tidy(cell);
    if (/compared|change/i.test(text)) return; // the "% change on last year" column
    const m = /(\w{3})\s+(\d{4})\s+to\s+(\w{3})\s+(\d{4})/.exec(text);
    if (m && MONTHS[m[3].toLowerCase()]) periods[i] = `${m[4]}-${MONTHS[m[3].toLowerCase()]}`;
  });
  const row = rows.slice(headIndex + 1).find((r) => r && def.table.match.test(tidy(r[col])));
  if (!row) throw new Error(`${def.table.sheet}: row not found for ${def.id}`);
  const points = Object.entries(periods)
    .map(([i, period]) => [period, row[i]])
    .filter(([, v]) => typeof v === "number" && Number.isFinite(v))
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (points.length < 3) throw new Error(`${def.id}: too few points`);
  return { freq: "months", title: def.label, updated: book.updated, points };
}
// --- Interest rates and the pound: the Bank of England's statistical database ---

const BOE_MONTHS = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
let boeTable;

// Every Bank of England series the pages use, in one request. Rows are { "YYYY-MM": [values...] } per code.
async function boeData() {
  if (!boeTable) {
    const codes = [...new Set(SECTORS.flatMap((sector) => sectorSeries(sector)).filter((def) => def.boe).map((def) => def.boe.code))];
    const url = `https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/1970&Dateto=now&SeriesCodes=${codes.join(",")}&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N`;
    let text;
    let lastError;
    for (let i = 0; i < 3 && !text; i++) {
      try {
        const res = await fetch(url, { headers: { ...HEADERS, "User-Agent": `Mozilla/5.0 ${HEADERS["User-Agent"]}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.text();
        if (!body.startsWith("DATE,")) throw new Error("not a data file");
        text = body;
      } catch (e) {
        lastError = e;
        await sleep(1500 * (i + 1));
      }
    }
    if (!text) throw new Error(`Bank of England: ${lastError?.message ?? "failed"}`);
    const [head, ...rows] = text.trim().split(/\r?\n/);
    const names = head.split(",").slice(1);
    const table = Object.fromEntries(names.map((n) => [n, new Map()]));
    for (const row of rows) {
      const [date, ...values] = row.split(",");
      const m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(date.trim());
      if (!m || !BOE_MONTHS[m[2].toLowerCase()]) continue;
      const period = `${m[3]}-${BOE_MONTHS[m[2].toLowerCase()]}`;
      names.forEach((name, i) => {
        const v = Number(values[i]);
        if (values[i]?.trim() && Number.isFinite(v)) {
          if (!table[name].has(period)) table[name].set(period, []);
          table[name].get(period).push(v);
        }
      });
    }
    boeTable = table;
  }
  return boeTable;
}

async function fetchBoe(def) {
  const table = (await boeData())[def.boe.code];
  if (!table?.size) throw new Error(`${def.boe.code}: no data`);
  const points = [...table.entries()]
    // An average over only a few days of the current month would mislead, so it waits for most of the month.
    .filter(([, values]) => def.boe.mode !== "mean" || values.length >= 10)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, values]) => [period, def.boe.mode === "mean" ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10000) / 10000 : values[values.length - 1]]);
  return { freq: "months", title: def.label, updated: null, points: points.slice(-KEEP.months) };
}

// --- Pay by region: the Annual Survey of Hours and Earnings, from Nomis (ONS) ---

let nomisPay;

// Median and the 10th/90th percentile of gross annual pay for employees, by where they live, for every
// region and nation in one request each. Saved as April of each year, when the survey is taken.
async function nomisAshe(stat) {
  nomisPay ??= new Map();
  if (!nomisPay.has(stat)) {
    const years = Array.from({ length: new Date().getFullYear() - 1996 }, (_, i) => 1997 + i).join(",");
    const url = `https://www.nomisweb.co.uk/api/v01/dataset/NM_30_1.data.csv?geography=TYPE480,TYPE499&date=${years}&sex=7&item=${stat}&pay=7&measures=20100&select=date_name,geography_name,obs_value`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Nomis pay: HTTP ${res.status}`);
    const byPlace = new Map();
    for (const line of (await res.text()).trim().split(/\r?\n/).slice(1)) {
      const m = /^"(\d{4})","([^"]+)",(-?[\d.]+)$/.exec(line.trim());
      if (!m) continue;
      const place = m[2].toLowerCase();
      if (!byPlace.has(place)) byPlace.set(place, []);
      byPlace.get(place).push([`${m[1]}-04`, Number(m[3])]);
    }
    // Some places appear under both the regions and the countries, so keep one reading per year.
    for (const [place, points] of byPlace) byPlace.set(place, [...new Map(points).entries()].sort((a, b) => a[0].localeCompare(b[0])));
    nomisPay.set(stat, byPlace);
  }
  return nomisPay.get(stat);
}

async function fetchNomis(def) {
  const points = (await nomisAshe(def.nomis.stat)).get(def.nomis.place.toLowerCase());
  if (!points || points.length < 5) throw new Error(`${def.id}: no pay figures for ${def.nomis.place}`);
  return { freq: "months", title: def.label, updated: null, points };
}

// Deaths registered each week in England and Wales (England plus Wales), for
// this year and last, so a page can compare the two.
async function fetchWeeklyDeaths() {
  const meta = await getJson(`https://api.beta.ons.gov.uk/v1/datasets/${WEEKLY_DEATHS.dataset}`);
  const versionPath = new URL(meta.links.latest_version.href).pathname;
  const version = await getJson(`https://api.beta.ons.gov.uk${versionPath}`);
  const thisYear = new Date().getFullYear();
  const years = {};
  for (const year of [thisYear - 1, thisYear]) {
    const weeks = new Array(53).fill(null);
    let got = 0;
    for (const geo of WEEKLY_DEATHS.geographies) {
      try {
        const j = await getJson(`https://api.beta.ons.gov.uk${versionPath}/observations?time=${year}&geography=${geo}&week=*&causeofdeath=${WEEKLY_DEATHS.cause}`);
        for (const o of j.observations ?? []) {
          const id = o.dimensions?.Week?.id ?? "";
          const week = Number(/week-(\d+)/.exec(id)?.[1]);
          const n = Number(o.observation);
          // Weeks not yet reported come back as 0; a real week is never 0.
          if (week >= 1 && week <= 53 && Number.isFinite(n) && n > 0) {
            weeks[week - 1] = (weeks[week - 1] ?? 0) + n;
            got++;
          }
        }
      } catch {
        // A year the dataset doesn't hold (yet) is just left out.
      }
    }
    if (got) years[year] = weeks;
  }
  if (!Object.keys(years).length) throw new Error("weekly deaths: nothing returned");
  return { updated: version.release_date ?? null, years };
}

// The Consumer Prices Index itself (2015 = 100, monthly from 1988), used on the
// pages to show money amounts in today's prices.
async function fetchDeflator() {
  const j = await getJson("https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23/data");
  const points = [];
  for (const row of j.months ?? []) {
    const period = normalisePeriod("months", row.date);
    const value = Number(row.value);
    if (period && Number.isFinite(value) && value > 0) points.push([period, value]);
  }
  if (points.length < 100) throw new Error("deflator: too few points");
  return { fetchedAt: new Date().toISOString(), title: j.description?.title ?? "CPI index", updated: j.description?.releaseDate ?? null, points };
}

function readExisting(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cache = new Map();
  let refreshed = 0;
  let failed = 0;

  for (const sector of SECTORS) {
    const file = path.join(OUT_DIR, `${sector.key}.json`);
    const previous = readExisting(file);
    const out = { fetchedAt: new Date().toISOString(), series: {} };

    for (const def of sectorSeries(sector)) {
      if (def.derive) continue; // worked out in the browser
      const key = def.feed ? `feed|${def.feed}` : def.boe ? `boe|${def.boe.code}|${def.boe.mode}` : def.nomis ? `nomis|${def.nomis.stat}|${def.nomis.place}` : def.hpi ? `hpi|${def.hpi.region}|${def.hpi.field}` : def.table ? `table|${def.table.sheet}|${def.id}` : `${def.path}|${def.cdid}|${def.dataset}`;
      try {
        if (!cache.has(key)) {
          cache.set(key, def.feed ? { title: def.label, ...(await fetchFeed(def.feed)) } : def.boe ? await fetchBoe(def) : def.nomis ? await fetchNomis(def) : def.hpi ? await fetchHpi(def) : def.table ? await fetchTable(def) : await fetchSeries(def));
          await sleep(250);
        }
        out.series[def.id] = cache.get(key);
        refreshed++;
      } catch (e) {
        failed++;
        console.warn(`! ${sector.key}/${def.id}: ${e.message}`);
        if (previous?.series?.[def.id]) out.series[def.id] = previous.series[def.id];
      }
    }

    if (sector.weeklyDeaths) {
      try {
        out.weeklyDeaths = await fetchWeeklyDeaths();
        refreshed++;
      } catch (e) {
        failed++;
        console.warn(`! ${sector.key}/weekly deaths: ${e.message}`);
        if (previous?.weeklyDeaths) out.weeklyDeaths = previous.weeklyDeaths;
      }
    }

    if (Object.keys(out.series).length || out.weeklyDeaths) {
      fs.writeFileSync(file, `${JSON.stringify(out)}\n`);
      console.log(`${sector.key}: ${Object.keys(out.series).length} series saved`);
    }
  }

  const deflatorFile = path.join(OUT_DIR, "deflator.json");
  try {
    fs.writeFileSync(deflatorFile, `${JSON.stringify(await fetchDeflator())}\n`);
    refreshed++;
    console.log("deflator: saved");
  } catch (e) {
    failed++;
    console.warn(`! deflator: ${e.message}`);
  }

  console.log(`Done: ${refreshed} refreshed, ${failed} kept from last time or missing.`);
  if (!refreshed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
