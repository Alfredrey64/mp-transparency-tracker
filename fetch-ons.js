// Downloads the Office for National Statistics time series behind the
// "Britain in numbers" pages (economy, prices, jobs, public finances,
// population, health, housing) and saves one small JSON file per page in
// frontend/src/data/ons/.
//
// Which series to fetch is defined once, in frontend/src/data/onsSectors.js,
// which the pages read as well. Weekly deaths come from the ONS dataset API;
// everything else is a classic time series. If a series can't be fetched this
// run, the copy saved last time is kept, so one bad response never blanks a
// page. The script only fails (so the daily status report flags it) when it
// couldn't refresh anything at all.
//
// Contains public sector information licensed under the Open Government
// Licence v3.0.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SECTORS, WEEKLY_DEATHS } from "./frontend/src/data/onsSectors.js";
import { normalisePeriod } from "./frontend/src/lib/onsFormat.js";

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

    for (const def of sector.series) {
      if (def.derive) continue; // worked out in the browser
      const key = `${def.path}|${def.cdid}|${def.dataset}`;
      try {
        if (!cache.has(key)) {
          cache.set(key, await fetchSeries(def));
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

  console.log(`Done: ${refreshed} refreshed, ${failed} kept from last time or missing.`);
  if (!refreshed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
