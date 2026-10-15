// Builds src/data/transportData.json for the Transport page.
//
//   node scripts/build-transport-data.mjs
//
// Sources (each an official release; the page names them). DfT releases are found from GOV.UK's search or its data-set pages, and the ORR's tables from the
// ORR data portal, so the script keeps working when a new release replaces the old.
//   - Department for Transport, Road traffic estimates in Great Britain (billions of vehicle miles by vehicle type since 1949).
//   - DfT, Vehicle licensing statistics: cars licensed by region, cars registered for the first time by fuel type and by region, plug-in cars by region (monthly).
//   - DfT, Road conditions in England: the share of local roads where maintenance should be considered, by region.
//   - DfT, Reported road casualties Great Britain (road safety statistics data tables): deaths since 1926.
//   - DfT, Bus statistics: passenger journeys by region, the fares index in constant prices, net government support.
//   - Office of Rail and Road (ORR): passenger rail journeys, government support to the rail industry, fares against inflation, punctuality and cancellations.
//   - Regional populations are taken from src/data/brexitData.json (ONS mid-2024 estimates), which build-brexit-data.mjs saves.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzip } from "../../xlsx-lite.js";
import { readOds } from "../../ods-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/transportData.json");
const UA = { "User-Agent": "Mozilla/5.0 simple-politics" };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const getBuf = async (url) => {
  let last = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const r = await fetch(url, { headers: UA, redirect: "follow" });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    last = r.status;
    if (r.status < 500) break;
    await new Promise((x) => setTimeout(x, 1500 * (attempt + 1)));
  }
  throw new Error(`${url}: ${last}`);
};
const getJson = async (url) => JSON.parse((await getBuf(url)).toString("utf8"));
const content = (slug) => getJson(`https://www.gov.uk/api/content${slug}`);
async function latestRelease(query, slugTest) {
  const types = ["national_statistics", "official_statistics", "statistics"].map((t) => `&filter_content_store_document_type=${t}`).join("");
  const results = (await getJson(`https://www.gov.uk/api/search.json?q=${encodeURIComponent(query)}&count=40&fields=link&fields=public_timestamp${types}`)).results.filter((r) => slugTest.test(r.link));
  if (!results.length) throw new Error(`No release found for ${query}`);
  results.sort((a, b) => b.public_timestamp.localeCompare(a.public_timestamp));
  return results[0].link;
}
const ods = async (url) => readOds(await getBuf(url));
const rowsOf = (wb, name) => {
  if (!wb[name]) throw new Error(`No sheet ${name}`);
  return wb[name].filter(Boolean);
};
const findHeader = (rows, test) => rows.findIndex((r) => r.some((c) => typeof c === "string" && test(c)));
const norm = (s) => String(s).toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();

// The twelve places the site's maps use, and the names the department gives them.
const PLACES = { ne: "north east", nw: "north west", yh: "yorkshire and the humber", em: "east midlands", wm: "west midlands", east: "east", london: "london", se: "south east", sw: "south west", wales: "wales", scotland: "scotland", ni: "northern ireland" };
const placeKey = (name) => {
  const n = norm(name).replace(/^east of england$/, "east");
  return Object.entries(PLACES).find(([, v]) => v === n)?.[0] ?? null;
};
const populations = () => {
  const b = JSON.parse(fs.readFileSync(path.join(here, "../src/data/brexitData.json"), "utf8")).migrationByRegion.regions;
  return Object.fromEntries(Object.keys(PLACES).map((k) => [k, b[k].population]));
};

// ---- Road traffic -------------------------------------------------------------------------------------------------------------------------------------------
async function traffic() {
  const slug = await latestRelease("road traffic estimates in great britain", /^\/government\/statistics\/road-traffic-estimates-in-great-britain-\d{4}$/);
  const page = await content(slug);
  const zip = page.details.attachments.find((a) => a.url?.endsWith(".zip"));
  if (!zip) throw new Error("No data tables zip for road traffic");
  const files = unzip(await getBuf(zip.url), { binary: true });
  const name = [...files.keys()].find((n) => /tra0101-miles-by-vehicle-type\.ods$/.test(n));
  if (!name) throw new Error("No TRA0101 in the zip");
  const rows = rowsOf(readOds(files.get(name)()), "TRA0101");
  const hi = rows.findIndex((r) => r[0] === "Year");
  const col = (re) => rows[hi].findIndex((h) => re.test(String(h)));
  const c = { cars: col(/^Cars and Taxis/), vans: col(/^Light Commercial/), hgv: col(/^Heavy Goods/), motorcycles: col(/Motorcycles/), buses: col(/Buses and Coaches/), total: col(/^All Motor Vehicles/) };
  const out = { release: page.title, updated: page.public_updated_at.slice(0, 10), years: [], cars: [], vans: [], hgv: [], motorcycles: [], buses: [], total: [] };
  for (const r of rows.slice(hi + 1)) {
    if (typeof r[0] !== "number") continue;
    out.years.push(r[0]);
    for (const k of Object.keys(c)) out[k].push(num(r[c[k]]));
  }
  return out;
}

// ---- Vehicles ---------------------------------------------------------------------------------------------------------------------------------------------------
async function vehicles() {
  const page = await content("/government/statistical-data-sets/vehicle-licensing-statistics-data-tables");
  const url = (file) => { const a = page.details.attachments.find((x) => x.url?.endsWith(`/${file}.ods`)); if (!a) throw new Error(`No ${file}`); return a.url; };

  // Cars licensed in Great Britain at the end of each year (the fourth quarter), since 1994.
  const lic = rowsOf(await ods(url("veh0101")), "VEH0101a_Lic");
  const lh = findHeader(lic, (c) => c === "Geography");
  const carsCol = lic[lh].indexOf("Cars");
  const licensed = { years: [], thousands: [] };
  for (const r of lic.slice(lh + 1)) if (r[0] === "Great Britain" && /^\d{4} Q4/.test(String(r[1]))) { licensed.years.push(Number(String(r[1]).slice(0, 4))); licensed.thousands.push(round(r[carsCol], 0)); }

  // Cars registered for the first time in Great Britain (the UK series starts only in 2014), by fuel, each year since 2001.
  const reg = rowsOf(await ods(url("veh1153")), "VEH1153b_All");
  const rh = findHeader(reg, (c) => c === "Geography");
  const H = reg[rh];
  const ci = (name) => H.indexOf(name);
  const fuels = { petrol: [ci("Petrol")], diesel: [ci("Diesel")], hybrid: [ci("Hybrid Electric - Petrol"), ci("Hybrid Electric - Diesel")], plugin: [ci("Plug-in Hybrid Electric - Petrol"), ci("Plug-in Hybrid Electric - Diesel")], battery: [ci("Battery Electric")], other: [ci("Range Extended Electric"), ci("Fuel Cell Electric"), ci("Gas"), ci("Others")] };
  const newCars = { years: [], total: [], ...Object.fromEntries(Object.keys(fuels).map((k) => [k, []])) };
  for (const r of reg.slice(rh + 1)) {
    if (r[0] !== "Great Britain" || r[1] !== "Annual" || r[4] !== "Cars" || r[5] !== "Total") continue;
    newCars.years.push(Number(r[2]));
    newCars.total.push(round(r[ci("Total")], 1));
    for (const [k, idx] of Object.entries(fuels)) newCars[k].push(round(idx.reduce((a, i) => a + (num(r[i]) ?? 0), 0), 1));
  }

  // Cars licensed by region at the end of the latest year, and new cars and plug-in cars registered by region in the latest two full years.
  const lr = rowsOf(await ods(url("veh1104")), "VEH1104");
  const lrh = findHeader(lr, (c) => c === "Date");
  const q4 = lr.filter((r) => r[2] === "Cars" && /Q4 \(end December\)/.test(String(r[0]))).at(-1);
  const byPlace = (header, row) => Object.fromEntries(header.map((h, i) => [placeKey(h), row[i]]).filter(([k, v]) => k && typeof v === "number"));
  const licensedByPlace = byPlace(lr[lrh], q4);
  const licensedYear = Number(String(q4[0]).slice(0, 4));
  const nr = rowsOf(await ods(url("veh1154")), "VEH1154");
  const nrh = findHeader(nr, (c) => c === "Date");
  const newByPlace = (year) => byPlace(nr[nrh], nr.find((r) => r[0] === year && r[2] === "Cars"));
  const pr = rowsOf(await ods(url("veh0182")), "VEH0182");
  const prh = findHeader(pr, (c) => c === "Date Interval");
  const plugByPlace = (year) => {
    const sum = {};
    for (const r of pr.slice(prh + 1)) {
      if (r[0] !== "Monthly" || r[3] !== "Cars" || !String(r[1]).endsWith(String(year))) continue;
      for (const [k, v] of Object.entries(byPlace(pr[prh], r))) sum[k] = (sum[k] ?? 0) + v;
    }
    return sum;
  };
  const latestYear = newCars.years.at(-1);
  const places = (obj, scale = 1) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, round(v * scale, 2)]));
  return {
    licensed, newCars,
    byPlace: {
      licensedYear, licensedThousands: places(licensedByPlace),
      year: latestYear,
      newThousands: places(newByPlace(latestYear)), newThousandsBefore: places(newByPlace(latestYear - 1)),
      plugin: plugByPlace(latestYear), pluginBefore: plugByPlace(latestYear - 1),
    },
  };
}

// ---- Road conditions --------------------------------------------------------------------------------------------------------------------------------------------
async function roadConditions() {
  const slug = await latestRelease("road conditions in england", /^\/government\/statistics\/road-conditions-in-england-to-march-\d{4}$/);
  const page = await content(slug);
  const zip = page.details.attachments.find((a) => a.url?.endsWith(".zip"));
  const files = unzip(await getBuf(zip.url), { binary: true });
  const name = [...files.keys()].find((n) => /rdc0121\.ods$/i.test(n));
  if (!name) throw new Error("No RDC0121");
  const wb = readOds(files.get(name)());
  const read = (sheet) => {
    const rows = rowsOf(wb, sheet);
    const hi = rows.findIndex((r) => r[0] === "ONS Area Code");
    const years = rows[hi].slice(2).filter((c) => /^FYE \d{4}$/.test(String(c))).map((c) => Number(String(c).slice(4)));
    const out = { years };
    for (const r of rows.slice(hi + 1)) {
      const key = r[0] === "E92000001" ? "england" : placeKey(r[1]);
      if (!key) continue;
      out[key] = years.map((_, i) => num(r[2 + i]));
    }
    return out;
  };
  return { release: page.title, updated: page.public_updated_at.slice(0, 10), a: read(Object.keys(wb).find((n) => /A_Road/.test(n))), bc: read(Object.keys(wb).find((n) => /B_and_C/.test(n))) };
}

// ---- Road deaths ------------------------------------------------------------------------------------------------------------------------------------------------
async function casualties() {
  const page = await content("/government/statistical-data-sets/road-safety-statistics-data-tables");
  const a = page.details.attachments.find((x) => x.url?.endsWith("/ras0101.ods"));
  if (!a) throw new Error("No RAS0101");
  const rows = rowsOf(await ods(a.url), "Casualties");
  const hi = rows.findIndex((r) => r[0] === "Year");
  const H = rows[hi];
  const col = (re) => H.findIndex((h) => re.test(String(h)));
  const c = { pedestrians: col(/^Pedestrians \(killed\)/), cyclists: col(/^Pedal cyclists \(killed\)/), motorcyclists: col(/^Motorcyclists \(killed\)/), carOccupants: col(/^Car occupants \(killed\)/), all: col(/^All road users \(killed\)/) };
  const out = { updated: page.public_updated_at.slice(0, 10), years: [], ...Object.fromEntries(Object.keys(c).map((k) => [k, []])) };
  for (const r of rows.slice(hi + 1)) {
    if (typeof r[0] !== "number" || typeof r[c.all] !== "number") continue;
    out.years.push(r[0]);
    for (const k of Object.keys(c)) out[k].push(num(r[c[k]]));
  }
  return out;
}

// ---- Buses ------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function buses() {
  const page = await content("/government/statistical-data-sets/bus-statistics-data-tables");
  const url = (file) => { const a = page.details.attachments.find((x) => x.url?.endsWith(`/${file}.ods`)); if (!a) throw new Error(`No ${file}`); return a.url; };
  const byYear = (rows, headerRow, wanted) => {
    const H = rows[headerRow];
    const cols = Object.fromEntries(Object.entries(wanted).map(([k, test]) => [k, H.findIndex((h) => test(norm(h)))]));
    const out = { years: [] };
    for (const k of Object.keys(cols)) out[k] = [];
    for (const r of rows.slice(headerRow + 1)) {
      if (typeof r[0] !== "number") continue;
      out.years.push(r[0]);
      for (const [k, i] of Object.entries(cols)) out[k].push(i >= 0 && typeof r[i] === "number" ? round(r[i], 2) : null);
    }
    return out;
  };
  const wanted = { ...Object.fromEntries(Object.entries(PLACES).filter(([k]) => k !== "ni").map(([k, v]) => [k, (h) => h === v || (k === "east" && h === "east of england")])), england: (h) => h === "england", gb: (h) => h === "great britain", outsideLondon: (h) => h === "england outside london" };
  const wb = await ods(url("bus01"));
  const journeysRows = rowsOf(wb, "BUS01a");
  const journeys = byYear(journeysRows, journeysRows.findIndex((r) => r[0] === "Year ending March"), wanted);
  const perRows = rowsOf(wb, "BUS01b");
  const perHead = byYear(perRows, perRows.findIndex((r) => r[0] === "Year ending March"), wanted);

  // The fares index, constant prices (March 2005 = 100), quarterly.
  const fr = rowsOf(await ods(url("bus0415")), "BUS0415b");
  const fh = fr.findIndex((r) => r[0] === "Year" && String(r[1]).trim() === "Month");
  const months = { Mar: 2, Jun: 5, Sep: 8, Dec: 11 };
  const fares = { times: [], labels: [], london: [], outsideLondon: [], scotland: [], wales: [], gb: [] };
  const fcol = (test) => fr[fh].findIndex((h) => test(norm(h)));
  const fi = { london: fcol((h) => h === "london"), outsideLondon: fcol((h) => h === "england outside london"), scotland: fcol((h) => h === "scotland"), wales: fcol((h) => h === "wales"), gb: fcol((h) => h === "great britain") };
  for (const r of fr.slice(fh + 1)) {
    const m = months[String(r[1]).trim()];
    if (typeof r[0] !== "number" || m === undefined) continue;
    fares.times.push(round(r[0] + m / 12, 3));
    fares.labels.push(`${String(r[1]).trim()} ${r[0]}`);
    for (const [k, i] of Object.entries(fi)) fares[k].push(typeof r[i] === "number" ? round(r[i], 1) : null);
  }

  // Net support from central and local government, constant prices, £ million.
  const sr = rowsOf(await ods(url("bus05ii")), "BUS05bii");
  const sh = sr.findIndex((r) => String(r[0]).startsWith("Year ending March"));
  const totalCol = sr[sh].findIndex((h) => /^Total estimated net support/.test(String(h)));
  const support = { years: [], england: [], outsideLondon: [], london: [] };
  for (const r of sr.slice(sh + 1)) {
    if (typeof r[0] !== "number") continue;
    const key = { England: "england", "England outside London": "outsideLondon", London: "london" }[String(r[1]).trim()];
    if (!key) continue;
    if (key === "england") support.years.push(r[0]);
    support[key].push(num(r[totalCol]) === null ? null : round(r[totalCol], 0));
  }
  return { updated: page.public_updated_at.slice(0, 10), journeys, perHead, fares, support };
}

// ---- Rail (ORR data portal) ------------------------------------------------------------------------------------------------------------------------------------
const ORR = "https://dataportal.orr.gov.uk";
async function orrFile(section, table) {
  const html = (await getBuf(`${ORR}/statistics/${section}/${table}/`)).toString("utf8");
  const href = /href="([^"]+\.ods[^"]*)"/.exec(html)?.[1];
  if (!href) throw new Error(`No data file on ${table}`);
  return ods(new URL(href.replace(/&amp;/g, "&"), ORR).toString());
}
async function orrTable(section, table) {
  const html = (await getBuf(`${ORR}/statistics/${section}/${table}/`)).toString("utf8");
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()));
  return rows.filter((r) => r.length > 1);
}
// "Apr 2019 to Mar 2020 (Period 03)" is in the financial year that starts in 2019.
const fy = (label) => Number(/^(?:Apr )?(\d{4})/.exec(label.replace(/^Apr\s+/, ""))?.[1] ?? label.match(/\d{4}/)[0]);

async function rail() {
  const journeysRows = rowsOf(await orrFile("usage/passenger-rail-usage", "table-1220-passenger-journeys"), "1220_Passenger_journeys");
  const journeys = { years: [], millions: [], provisional: [] };
  for (const r of journeysRows) {
    const m = /^Apr (\d{4}) to Mar (\d{4})/.exec(String(r[0]).trim());
    if (!m || Number(m[1]) < 1985 || typeof r[1] !== "number") continue;
    journeys.years.push(Number(m[1]));
    journeys.millions.push(round(r[1], 0));
    journeys.provisional.push(/\[p\]/.test(String(r[0])));
  }

  const sup = rowsOf(await orrFile("finance/rail-industry-finance", "table-7270-government-support-to-the-rail-industry"), "7270_government_support");
  const sh = sup.findIndex((r) => r[0] === "Time period");
  const colOf = (re) => sup[sh].findIndex((h) => re.test(String(h).replace(/\s+/g, " ")));
  const cols = { total: colOf(/^Total government support/), operational: colOf(/^Total operational funding/), enhancements: colOf(/^Total enhancements funding/) };
  const support = { years: [], total: [], operational: [], enhancements: [] };
  for (const r of sup.slice(sh + 1)) {
    const m = /^Apr (\d{4})\s+to Mar/.exec(String(r[0]).replace(/\s+/g, " ").replace(" to", " to").trim()) ?? /^Apr (\d{4})/.exec(String(r[0]));
    if (!m || typeof r[cols.total] !== "number") continue;
    support.years.push(Number(m[1]));
    for (const k of Object.keys(cols)) support[k].push(num(r[cols[k]]) === null ? null : round(r[cols[k]], 0));
  }

  const fr = rowsOf(await orrFile("finance/rail-fares", "table-7180-average-change-in-fares-by-regulated-and-unregulated-tickets"), "7180_Change_by_regulated_status");
  const fh = fr.findIndex((r) => r[0] === "Sector");
  const yearCols = fr[fh].map((h, i) => ({ y: /^(\d{4})\b/.exec(String(h).trim())?.[1], i })).filter((x) => x.y);
  const years = yearCols.map((x) => Number(x.y));
  const grab = (a, b) => { const r = fr.find((x) => x[0] === a && x[1] === b); if (!r) throw new Error(`No fares row ${a}`); return yearCols.map((x) => round(r[x.i], 1)); };
  const fares = { years, allTickets: grab("All tickets", "All tickets"), standardRegulated: grab("All operators", "Standard class regulated"), standardUnregulated: grab("All operators", "Standard class unregulated"), rpi: grab("Retail Prices Index (all items)", "Retail Prices Index (all items)") };

  // Punctuality and cancellations, four-week periods, added up into financial years. A year in progress is marked with the number of periods it has.
  const pt = await orrTable("performance/passenger-rail-performance", "table-3138-train-punctuality-at-recorded-station-stops-by-operator-periodic");
  const ph = pt[0].map((h) => h.toLowerCase());
  const stopsI = ph.indexOf("recorded station stops");
  const t3I = ph.indexOf("time to 3");
  const onTimeI = ph.indexOf("on time within 59 seconds");
  const byYear = new Map();
  for (const r of pt.slice(1)) {
    if (r[1] !== "Great Britain") continue;
    const y = fy(r[0]);
    const stops = Number(r[stopsI]);
    const slot = byYear.get(y) ?? { stops: 0, t3: 0, ontime: 0, periods: 0 };
    slot.stops += stops; slot.t3 += stops * Number(r[t3I]); slot.ontime += stops * Number(r[onTimeI]); slot.periods += 1;
    byYear.set(y, slot);
  }
  const ct = await orrTable("performance/passenger-rail-performance", "table-3124-trains-planned-and-cancellations-by-operator-periodic");
  const chd = ct[0].map((h) => h.toLowerCase());
  const plI = chd.indexOf("number of trains planned");
  const cnI = chd.indexOf("cancellation number");
  const canc = new Map();
  for (const r of ct.slice(1)) {
    if (r[1] !== "Great Britain") continue;
    const y = fy(r[0]);
    const slot = canc.get(y) ?? { planned: 0, cancelled: 0, periods: 0 };
    slot.planned += Number(r[plI]); slot.cancelled += Number(r[cnI]); slot.periods += 1;
    canc.set(y, slot);
  }
  const yrs = [...byYear.keys()].sort((a, b) => a - b);
  const performance = {
    years: yrs, periods: yrs.map((y) => byYear.get(y).periods),
    timeTo3: yrs.map((y) => round(byYear.get(y).t3 / byYear.get(y).stops, 1)),
    onTime: yrs.map((y) => round(byYear.get(y).ontime / byYear.get(y).stops, 1)),
    cancelledYears: [...canc.keys()].sort((a, b) => a - b),
  };
  performance.cancelled = performance.cancelledYears.map((y) => round((canc.get(y).cancelled / canc.get(y).planned) * 100, 1));
  performance.cancelledPeriods = performance.cancelledYears.map((y) => canc.get(y).periods);
  performance.trainsPlannedLatest = canc.get(performance.cancelledYears.at(-1)).planned;
  return { journeys, support, fares, performance };
}

async function main() {
  const data = { built: new Date().toISOString().slice(0, 10), population: populations() };
  data.traffic = await traffic();
  data.vehicles = await vehicles();
  data.roadConditions = await roadConditions();
  data.deaths = await casualties();
  data.buses = await buses();
  data.rail = await rail();
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB): traffic to ${data.traffic.years.at(-1)}, deaths to ${data.deaths.years.at(-1)}, rail to ${data.rail.journeys.years.at(-1)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
