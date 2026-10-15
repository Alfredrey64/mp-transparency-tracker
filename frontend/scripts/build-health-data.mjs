// Builds src/data/healthData.json for the Health and the NHS page.
//
//   node scripts/build-health-data.mjs
//
// Sources (each an official release; the page names them):
//   - NHS England, Referral to Treatment waiting times, "Incomplete Commissioner" workbooks: the number of people waiting for hospital treatment in
//     each of the seven NHS England regions, how many have waited within 18 weeks, the typical (median) wait and how many have waited over a year.
//     The latest month is read, and the same month in each of the three years before it, so the page can show the change over a year.
//   - The ONS series the site already holds in src/data/ons/health.json (waiting times, A&E, ambulances, cancer, NHS staff, long-term sickness),
//     for the national time charts. Run the site's ONS fetch first.
//   - World Bank, World Development Indicators (health spending from the WHO Global Health Expenditure Database; doctors, nurses and hospital beds
//     from the OECD and WHO): for how the UK compares.
//   - Regional population (ONS mid-year estimates) is taken from src/data/brexitData.json, which build-brexit-data.mjs saves.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/healthData.json");
const UA = { "User-Agent": "Mozilla/5.0 simple-politics" };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const getBuf = async (url) => { const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return Buffer.from(await r.arrayBuffer()); };

// ---- NHS England: waiting times by region -------------------------------------------------------------------------------------------------
const NHS_REGIONS = { Y56: { key: "london", name: "London", itl: ["london"] }, Y58: { key: "sw", name: "South West", itl: ["sw"] }, Y59: { key: "se", name: "South East", itl: ["se"] }, Y60: { key: "midlands", name: "Midlands", itl: ["em", "wm"] }, Y61: { key: "east", name: "East of England", itl: ["east"] }, Y62: { key: "nw", name: "North West", itl: ["nw"] }, Y63: { key: "neyh", name: "North East and Yorkshire", itl: ["ne", "yh"] } };

async function monthFile(month, year) {
  // A month such as "Aug" in the year 2026 is filed on the page for the financial year that contains it (April to March).
  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month);
  const fy = monthIndex >= 3 ? year : year - 1;
  const page = `https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/rtt-data-${fy}-${String(fy + 1).slice(2)}/`;
  const html = await (await fetch(page, { headers: UA })).text();
  const code = `${month}${String(year).slice(2)}`;
  const link = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).find((h) => new RegExp(`Incomplete-Commissioner-${code}[^"]*\\.xlsx$`, "i").test(h));
  if (!link) throw new Error(`No Incomplete Commissioner file for ${code} on ${page}`);
  return { code, url: new URL(link, page).toString() };
}

function regionRows(buf) {
  const book = readXlsx(buf);
  const rows = book.Region.filter(Boolean);
  const head = rows.find((r) => r.includes("Region Code"));
  const col = (test) => head.findIndex((c) => test(String(c)));
  const total = col((c) => /^Total number of incomplete pathways/.test(c));
  const within = col((c) => /^Total within 18 weeks/.test(c));
  const median = col((c) => /^Average \(median\)/.test(c));
  const p92 = col((c) => /^92nd percentile/.test(c));
  const over52 = col((c) => /^Total 52 plus weeks/.test(c));
  const period = (rows.find((r) => r[1] === "Period:") ?? [])[2];
  const out = {};
  for (const r of rows.slice(rows.indexOf(head) + 1)) {
    if (r[3] !== "C_999") continue;
    const reg = NHS_REGIONS[r[1]];
    if (!reg) continue;
    out[reg.key] = { pathways: r[total], within18: r[within], median: round(r[median], 1), p92: round(r[p92], 1), over52: r[over52] };
  }
  const nat = book.National.filter(Boolean);
  const nh = nat.find((r) => r.includes("Treatment Function Code"));
  const ncol = (test) => nh.findIndex((c) => test(String(c)));
  const nr = nat.slice(nat.indexOf(nh) + 1).find((r) => r[1] === "C_999");
  const national = { pathways: nr[ncol((c) => /^Total number of incomplete pathways/.test(c))], within18: nr[ncol((c) => /^Total within 18 weeks/.test(c))], median: round(nr[ncol((c) => /^Average \(median\)/.test(c))], 1), over52: nr[ncol((c) => /^Total 52 plus weeks/.test(c))] };
  return { period, regions: out, national };
}

async function waitingByRegion() {
  const now = new Date();
  // The latest published month: try the month before last first (NHS England publishes about two months in arrears), then step back.
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let latest = null;
  for (let back = 1; back <= 5 && !latest; back += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    try { latest = { month: months[d.getUTCMonth()], year: d.getUTCFullYear(), file: await monthFile(months[d.getUTCMonth()], d.getUTCFullYear()) }; } catch { /* try an earlier month */ }
  }
  if (!latest) throw new Error("No recent RTT file found");
  const snapshots = [];
  for (const back of [0, 1, 2, 3]) {
    const year = latest.year - back;
    const f = back === 0 ? latest.file : await monthFile(latest.month, year);
    const data = regionRows(await getBuf(f.url));
    snapshots.push({ month: latest.month, year, label: data.period, url: f.url, ...data });
  }
  return snapshots.reverse();
}

// ---- Regional population ----------------------------------------------------------------------------------------------------------------------
function populations() {
  const b = JSON.parse(fs.readFileSync(path.join(here, "../src/data/brexitData.json"), "utf8")).migrationByRegion.regions;
  return Object.fromEntries(Object.values(NHS_REGIONS).map((r) => [r.key, r.itl.reduce((a, k) => a + b[k].population, 0)]));
}

// ---- National series from the ONS data already held --------------------------------------------------------------------------------------------
const SERIES = {
  waitingList: "rtt-waiting", within18: "rtt-within-18", over52: "rtt-over-52", median: "rtt-median",
  ae4h: "ae-4-hour", ae4hMajor: "ae-4-hour-major", ambCat2: "ambulance-c2", ambCat1: "ambulance-c1",
  cancer62: "cancer-62-day", cancer28: "cancer-28-day", cancer31: "cancer-31-day", staff: "nhs-staff", longTermSick: "long-term-sick",
};
function nationalSeries() {
  const h = JSON.parse(fs.readFileSync(path.join(here, "../src/data/ons/health.json"), "utf8")).series;
  const t = (label) => { const m = /^(\d{4})-(\d{2})$/.exec(label); if (m) return round(Number(m[1]) + (Number(m[2]) - 1) / 12, 3); const q = /^(\d{4})-Q([1-4])$/.exec(label); return q ? Number(q[1]) + (Number(q[2]) - 1) / 4 : null; };
  const out = {};
  for (const [key, id] of Object.entries(SERIES)) {
    const s = h[id];
    if (!s) throw new Error(`No ${id} in health.json`);
    out[key] = { freq: s.freq, title: s.title, labels: s.points.map((p) => p[0]), times: s.points.map((p) => t(p[0])), values: s.points.map((p) => round(p[1], 2)) };
  }
  return out;
}

// ---- World Bank: how the UK compares ---------------------------------------------------------------------------------------------------------
const COUNTRIES = { GBR: "United Kingdom", FRA: "France", DEU: "Germany", ITA: "Italy", ESP: "Spain", NLD: "Netherlands", SWE: "Sweden", DNK: "Denmark", NOR: "Norway", FIN: "Finland", CAN: "Canada", USA: "United States", JPN: "Japan", AUS: "Australia", KOR: "South Korea", IRL: "Ireland", AUT: "Austria", BEL: "Belgium", CHE: "Switzerland", PRT: "Portugal", POL: "Poland", NZL: "New Zealand" };
const INDICATORS = { spendGdp: "SH.XPD.CHEX.GD.ZS", spendPerHead: "SH.XPD.CHEX.PP.CD", doctors: "SH.MED.PHYS.ZS", nurses: "SH.MED.NUMW.P3", beds: "SH.MED.BEDS.ZS" };
async function compare() {
  const out = Object.fromEntries(Object.entries(COUNTRIES).map(([c, name]) => [c, { name }]));
  for (const [key, ind] of Object.entries(INDICATORS)) {
    const url = `https://api.worldbank.org/v2/country/${Object.keys(COUNTRIES).join(";")}/indicator/${ind}?format=json&date=2015:2026&per_page=2000`;
    const json = await (await fetch(url, { headers: UA })).json();
    const latest = {};
    for (const r of json[1] ?? []) {
      if (r.value === null) continue;
      const y = Number(r.date);
      if (!latest[r.countryiso3code] || y > latest[r.countryiso3code].year) latest[r.countryiso3code] = { year: y, value: round(r.value, key === "spendPerHead" ? 0 : 2) };
    }
    for (const c of Object.keys(COUNTRIES)) out[c][key] = latest[c] ?? null;
  }
  return out;
}

async function main() {
  const data = {
    built: new Date().toISOString().slice(0, 10),
    national: nationalSeries(),
    waitingByRegion: await waitingByRegion(),
    population: populations(),
    nhsRegions: Object.values(NHS_REGIONS),
    compare: await compare(),
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB), latest ${data.waitingByRegion.at(-1).label}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
