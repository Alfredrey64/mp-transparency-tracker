// Builds src/data/careData.json for the Social care and childcare page.
//
//   node scripts/build-care-data.mjs
//
// Sources (each an official release; the page names them). Releases are found from GOV.UK's search, so the script keeps working when a new one replaces the old.
//   - DHSC and NHS England, Adult social care finance report, England (the finance return, ASC-FR): what councils spend on adult social care, since 2005 to 2006,
//     who pays, what it buys, what it costs per adult and per week in each region. Net current expenditure is in a second workbook.
//   - NHS England, Adult social care activity report, England: requests for support and people receiving long-term support, in each region.
//   - NHS England, Survey of adult carers in England: how carers feel about the support they get, every two years from 2012 to 2013.
//   - Skills for Care, The state of the adult social care sector and workforce in England: filled posts, vacancies, turnover and pay (the statistical appendix).
//   - Department for Education, Funded early education and childcare (the open statistics API): children registered for funded places, take-up, providers.
// The facts from the Childcare and early years survey of parents are written by hand in src/data/care.js, because the department publishes them as text.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { readXlsx } from "../../xlsx-lite.js";
import { readOds } from "../../ods-lite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/careData.json");
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
  const url = `https://www.gov.uk/api/search.json?q=${encodeURIComponent(query)}&count=40&fields=link&fields=public_timestamp${types}`;
  const results = (await getJson(url)).results.filter((r) => slugTest.test(r.link));
  if (!results.length) throw new Error(`No release found for ${query}`);
  results.sort((a, b) => b.public_timestamp.localeCompare(a.public_timestamp));
  return results[0].link;
}
const attachment = (page, test) => {
  const a = page.details.attachments.find((x) => x.url && test.test(`${x.title} ${x.url}`));
  if (!a) throw new Error(`No attachment matching ${test} on ${page.title}`);
  return a.url;
};
const ods = async (url) => readOds(await getBuf(url));
const sheetRows = (wb, name) => {
  const rows = wb[name];
  if (!rows) throw new Error(`No sheet ${name}`);
  return rows.filter(Boolean);
};
const startYear = (label) => Number(String(label).match(/\d{4}/)[0]);

const REGION_KEYS = { "North East": "ne", "North West": "nw", "Yorkshire and The Humber": "yh", "East Midlands": "em", "West Midlands": "wm", "East of England": "east", London: "london", "South East": "se", "South West": "sw" };
// Rows by region (and England) from a finance or activity table whose columns start: geography code, LA code, LA name, region code, region name.
function byRegion(rows, columns) {
  const head = rows.find((r) => r[0] === "Geography code");
  const out = {};
  for (const r of rows.slice(rows.indexOf(head) + 1)) {
    const name = r[4];
    const key = name === "England" ? "england" : REGION_KEYS[name];
    if (!key || r[2]) continue;
    out[key] = Object.fromEntries(Object.entries(columns).map(([k, test]) => {
      const i = head.findIndex((h) => test.test(String(h)));
      if (i < 0) throw new Error(`No column ${test} in table`);
      return [k, num(r[i])];
    }));
  }
  if (Object.keys(out).length !== 10) throw new Error(`Expected England and 9 regions, got ${Object.keys(out).length}`);
  return out;
}
const yearSeries = (rows, valueCols) => {
  const head = rows.findIndex((r) => r[0] === "Year");
  const out = { years: [] };
  for (const k of Object.keys(valueCols)) out[k] = [];
  for (const r of rows.slice(head + 1)) {
    if (!/^\d{4}/.test(String(r[0]))) break;
    out.years.push(startYear(r[0]));
    for (const [k, i] of Object.entries(valueCols)) out[k].push(num(r[i]));
  }
  return out;
};

// ---- Adult social care: finance --------------------------------------------------------------------------------------------------------------------------
async function finance() {
  const slug = await latestRelease("adult social care finance report", /^\/government\/statistics\/adult-social-care-finance-report-england-\d{4}-to-\d{4}$/);
  const page = await content(slug);
  const fin = await ods(attachment(page, /finance report.*data tables(?!.*net current)/i));
  const nce = await ods(attachment(page, /net current expenditure data tables/i));
  const gross = yearSeries(sheetRows(fin, "Table_4"), { cash: 1, real: 2 });
  const net = yearSeries(sheetRows(nce, "Table_4"), { cash: 1, real: 2 });
  const t3 = sheetRows(fin, "Table_3");
  const h3 = t3.find((r) => r[0] === "Geography code");
  const eng = t3.find((r) => r[4] === "England" && !r[2]);
  // Header wording changes between releases (the 2025 release wrote "expenditure:" in lower case), so the match ignores case.
  const col = (re) => { const i = h3.findIndex((h) => new RegExp(re.source, "i").test(String(h))); if (i < 0) throw new Error(`No ${re}`); return num(eng[i]); };
  const flows = { ownProvision: col(/^Expenditure: own provision/), byOthers: col(/^Expenditure: provision by others/), grants: col(/^Expenditure: grants/), expenditure: col(/^Expenditure: total/), clients: col(/^Income: client contributions/), joint: col(/^Income: joint/), nhs: col(/^Income: income from NHS/), otherIncome: col(/^Income: other income/), income: col(/^Income: total/) };
  const t14 = sheetRows(fin, "Table_14");
  const h14 = t14.find((r) => r[0] === "Geography code");
  const e14 = t14.find((r) => r[4] === "England" && !r[2]);
  const c14 = (re) => num(e14[h14.findIndex((h) => new RegExp(re.source, "i").test(String(h)))]);
  const careType = { long: c14(/^Long term care$/), short: c14(/^Short term care$/), other: c14(/^Other$/), total: c14(/^Total$/) };
  // The table has two years side by side; the later year's columns are the last matches.
  const t16 = sheetRows(fin, "Table_16");
  const h16 = t16.find((r) => r[0] === "Geography code");
  const latest = (re) => { const idx = h16.map((h, i) => (new RegExp(re.source, "i").test(String(h)) ? i : -1)).filter((i) => i >= 0); return idx.at(-1); };
  const prev = (re) => { const idx = h16.map((h, i) => (new RegExp(re.source, "i").test(String(h)) ? i : -1)).filter((i) => i >= 0); return idx.at(-2); };
  const ix = { gross: latest(/^Gross current expenditure: /), pop: latest(/^Population 18\+/), per: latest(/per 100,000 adults/), perPrev: prev(/per 100,000 adults/) };
  const regions = {};
  for (const r of t16.slice(t16.indexOf(h16) + 1)) {
    const key = r[4] === "England" ? "england" : REGION_KEYS[r[4]];
    if (!key || r[2]) continue;
    regions[key] = { gross: num(r[ix.gross]), adults: num(r[ix.pop]), perAdult: round(num(r[ix.per]) / 100, 0), perAdultBefore: round(num(r[ix.perPrev]) / 100, 0) };
  }
  if (Object.keys(regions).length !== 10) throw new Error("Table_16: expected England and 9 regions");
  const t52 = sheetRows(fin, "Table_52");
  const h52 = t52.find((r) => r[0] === "Geography code");
  const last52 = (re) => h52.map((h, i) => (re.test(String(h)) ? i : -1)).filter((i) => i >= 0).at(-1);
  const unitCosts = {};
  for (const r of t52.slice(t52.indexOf(h52) + 1)) {
    const key = r[4] === "England" ? "england" : REGION_KEYS[r[4]];
    if (!key || r[2]) continue;
    unitCosts[key] = { nursing: round(num(r[last52(/^Nursing: Total/)]), 0), residential: round(num(r[last52(/^Residential: Total/)]), 0) };
  }
  const t51 = sheetRows(fin, "Table_51");
  const h51 = t51.find((r) => r[0] === "Geography code");
  const last51 = (re) => h51.map((h, i) => (re.test(String(h)) ? i : -1)).filter((i) => i >= 0).at(-1);
  for (const r of t51.slice(t51.indexOf(h51) + 1)) {
    const key = r[4] === "England" ? "england" : REGION_KEYS[r[4]];
    if (!key || r[2] || !unitCosts[key]) continue;
    unitCosts[key].homeInHouse = round(num(r[last51(/^In house/)]), 2);
    unitCosts[key].homeExternal = round(num(r[last51(/^External/)]), 2);
  }
  const lastYear = gross.years.at(-1);
  return { release: page.title, updated: page.public_updated_at.slice(0, 10), year: `${lastYear} to ${lastYear + 1}`, gross, net, flows, careType, regions, unitCosts };
}

// ---- Adult social care: activity ---------------------------------------------------------------------------------------------------------------------------
async function activity() {
  const slug = await latestRelease("adult social care activity report", /^\/government\/statistics\/adult-social-care-activity-report-england-\d{4}-to-\d{4}$/);
  const page = await content(slug);
  const wb = await ods(attachment(page, /data tables/i));
  const clients = byRegion(sheetRows(wb, "Table_33"), { during18: /^18 to 64 - During year/, during65: /^65 and over - During year/, duringTotal: /^Total - During year/, endTotal: /^Total - Year end/ });
  const per100k = byRegion(sheetRows(wb, "Table_36"), { rate1864: /^18 to 64 - Clients per 100,000/, rate65: /^65 and over - Clients per 100,000/ });
  const requests = byRegion(sheetRows(wb, "Table_12"), { rate1864: /^Requests per 100,000 of the 18 to 64/, rate65: /^Requests per 100,000 of the 65 and over/, total1864: /^18 to 64 total requests/, total65: /^65 and over total requests/ });
  const merged = {};
  for (const k of Object.keys(clients)) merged[k] = { ...clients[k], clientsPer100k1864: per100k[k].rate1864, clientsPer100k65: per100k[k].rate65, requestsPer100k1864: requests[k].rate1864, requestsPer100k65: requests[k].rate65, requests1864: requests[k].total1864, requests65: requests[k].total65 };
  return { release: page.title, updated: page.public_updated_at.slice(0, 10), regions: merged };
}

// ---- Carers survey ---------------------------------------------------------------------------------------------------------------------------------------------------
async function carers() {
  const slug = await latestRelease("survey of adult carers in england", /^\/government\/statistics\/survey-of-adult-carers-in-england-\d{4}-to-\d{4}-report$/);
  const page = await content(slug);
  const wb = await ods(attachment(page, /time series data/i));
  const rows = sheetRows(wb, "Table_2");
  const head = rows.find((r) => r[0] === "Question");
  const est = head.map((h, i) => (/: Estimate$/.test(String(h)) ? i : -1)).filter((i) => i >= 0);
  const years = est.map((i) => startYear(head[i]));
  const get = (questionStart, response, excluding = false) => {
    const r = rows.find((x) => String(x[0]).startsWith(questionStart) && (excluding ? /Excluding/.test(String(x[0])) : !/Excluding/.test(String(x[0]))) && String(x[1]).startsWith(response));
    if (!r) throw new Error(`No ${questionStart} / ${response}`);
    return est.map((i) => num(r[i]));
  };
  const sum = (...a) => a[0].map((_, i) => (a.every((s) => s[i] !== null) ? round(a.reduce((x, s) => x + s[i], 0), 1) : null));
  const q4 = "Question 4 - Excluding";
  return {
    release: page.title, updated: page.public_updated_at.slice(0, 10), years,
    noSupport: get("Question 4 - Overall", "We haven't received any support"),
    satisfied: sum(get(q4, "I am extremely satisfied", true), get(q4, "I am very satisfied", true), get(q4, "I am quite satisfied", true)),
    dissatisfied: sum(get(q4, "I am quite dissatisfied", true), get(q4, "I am very dissatisfied", true), get(q4, "I am extremely dissatisfied", true)),
    moneyTrouble: sum(get("Question 15", "Yes, to some extent"), get("Question 15", "Yes, a lot")),
    lonely: get("Question 16", "Often or always"),
    littleSocial: get("Question 11", "I have little social contact"),
    neglecting: get("Question 9", "I feel I am neglecting myself"),
  };
}

// ---- The care workforce (Skills for Care) ----------------------------------------------------------------------------------------------------------------
async function workforce() {
  const html = (await getBuf("https://www.skillsforcare.org.uk/Adult-Social-Care-Workforce-Data/Workforce-intelligence/publications/national-information/The-state-of-the-adult-social-care-sector-and-workforce-in-England.aspx")).toString("utf8");
  const link = [...html.matchAll(/href="([^"]*Statistical-Appendix[^"]*\.xlsx)"/gi)].map((m) => m[1])[0];
  if (!link) throw new Error("No statistical appendix link");
  const wb = readXlsx(await getBuf(new URL(link, "https://www.skillsforcare.org.uk").toString()));
  const find = (sheet, title) => { const rows = wb[sheet]; const i = rows.findIndex((r) => r && typeof r[1] === "string" && r[1].startsWith(title)); if (i < 0) throw new Error(`No ${title}`); return { rows, i }; };
  const trend = (sheet, title, role) => {
    const { rows, i } = find(sheet, title);
    const hi = rows.findIndex((r, j) => j > i && r && typeof r[2] === "string" && /^\d{4}\/\d{2}$/.test(r[2]));
    const labels = rows[hi].slice(2).filter((c) => /^\d{4}\/\d{2}$/.test(String(c)));
    const row = rows.slice(hi + 1).find((r) => r && r[1] === role);
    return { years: labels.map((l) => Number(String(l).slice(0, 4))), values: labels.map((_, k) => round(row[2 + k] * 100, 1)) };
  };
  const vacancy = { all: trend("3.12", "Table 3.12.1", "All job roles"), care: trend("3.12", "Table 3.12.1", "Direct care") };
  const turnover = { all: trend("3.10", "Table 3.10.1", "All job roles"), care: trend("3.10", "Table 3.10.1", "Direct care") };
  // Pay: the independent sector's direct care workers, hourly, against the National Minimum or Living Wage, by year from April 2016.
  const { rows: pr, i: pi } = find("5.4", "Table 5.4.1");
  const hr = pr[pi + 3];
  const periods = hr.slice(13).filter((c) => /^Apr \d{2}/.test(String(c)));
  const wageRow = pr[pi + 4];
  const careRows = pr.slice(pi + 5).filter((r) => r && r[1] === "Direct care");
  const rateRow = pr[pr.indexOf(careRows[0]) + 1];
  const pay = { years: periods.map((p) => 2000 + Number(String(p).match(/Apr (\d{2})/)[1])), independentCare: periods.map((_, k) => round(rateRow[13 + k], 2)), minimum: periods.map((_, k) => round(wageRow[13 + k], 2)) };
  // Filled posts now, by service.
  const { rows: fr, i: fi } = find("1. Workforce estimates", "Table 1.1");
  const hi = fr.findIndex((r, j) => j > fi && r && r[2] === "Total workforce filled posts");
  const take = (service) => { const r = fr.slice(hi + 1, hi + 6).find((x) => x && x[2] === service); return { all: num(r[3]), localAuthority: num(r[4]), independent: num(r[5]) }; };
  const filled = { all: num(fr[hi][3]), localAuthority: num(fr[hi][4]), independent: num(fr[hi][5]), directPayments: num(fr[hi][6]), residential: take("Residential").all, domiciliary: take("Domiciliary").all, day: take("Day").all, community: take("Community").all };
  // People aged 65 and over, England, 2026 to 2040 (NOMIS).
  const { rows: qr, i: qi } = find("7.1", "Table 7.1");
  const yh = qr[qi + 3];
  const yrs = yh.slice(2).filter((c) => typeof c === "number");
  const eng = qr[qi + 5];
  const over65 = { years: yrs, values: yrs.map((_, k) => num(eng[2 + k])) };
  // Skills for Care's projection of the posts needed if the number of posts for each older person stays the same.
  const { rows: jr, i: ji } = find("7.2", "Table 7.2");
  const jh = jr.findIndex((r, j) => j > ji && r && typeof r[2] === "string" && r[2].startsWith("People aged 65+ per post"));
  const je = jr[jh + 1];
  if (!je || je[1] !== "England") throw new Error("No England row in table 7.2");
  const projection = { olderPerPost: num(je[2]), posts: num(je[3]), y2030: num(je[4]), y2035: num(je[5]), y2040: num(je[6]), extra2040: num(je[7]) };
  const apx = new URL(link, "https://www.skillsforcare.org.uk").toString();
  return { source: apx, year: pay.years.at(-1), vacancy, turnover, pay, filled, over65, projection };
}

// ---- Childcare: funded early education (DfE API) --------------------------------------------------------------------------------------------------------
const API = "https://api.education.gov.uk/statistics/v1";
const FUNDED = "0ce6a6c6-5451-4967-8dd4-2f4fa8131982";
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; } else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
async function dataSet(titleStart) {
  const list = await getJson(`${API}/publications/${FUNDED}/data-sets?pageSize=20`);
  const hit = list.results.find((r) => r.title.startsWith(titleStart));
  if (!hit) throw new Error(`No data set starting "${titleStart}"`);
  const buf = await getBuf(`${API}/data-sets/${hit.id}/csv`);
  return parseCsv((buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf) : buf).toString("utf8"));
}
const n = (v) => { const x = Number(v); return v === "" || Number.isNaN(x) ? null : x; };
async function childcare() {
  const head = (await dataSet("Headline figures")).filter((r) => r.geographic_level === "National");
  const years = [...new Set(head.map((r) => Number(r.time_period)))].sort((a, b) => a - b);
  const pick = (entitlement, age, field, scale = 1) => years.map((y) => { const r = head.find((x) => Number(x.time_period) === y && x.entitlement_type === entitlement && x.age === age); const v = r ? n(r[field]) : null; return v === null ? null : round(v / scale, scale === 1 ? 1 : 3); });
  const totalRow = (field) => pick("Total", "Total", field);
  const take = await dataSet("1 Children registered and take-up rates");
  const regional = (entitlement, year) => Object.fromEntries(take.filter((r) => r.geographic_level === "Regional" && r.time_period === String(year) && r.entitlement_type === entitlement && r.age === "Total" && REGION_KEYS[r.region_name]).map((r) => [REGION_KEYS[r.region_name], round(n(r.registered_eligible_children_percent), 1)]));
  const latest = years.at(-1);
  return {
    year: latest, years,
    registered: totalRow("registered_children_count"),
    shareOfAll: totalRow("registered_all_children_percent"),
    providers: totalRow("providers_count"),
    staff: totalRow("staff_count"),
    universal: { registered: pick("Universal", "Total", "registered_children_count"), takeUp: pick("Universal", "Total", "registered_eligible_children_percent") },
    twoYearOlds: { registered: pick("Early learning for 2-year-olds", "Total", "registered_children_count"), takeUp: pick("Early learning for 2-year-olds", "Total", "registered_eligible_children_percent") },
    working: { registered: pick("Working parents", "Total", "registered_children_count"), eligible: pick("Working parents", "Total", "eligible_children_count"), takeUp: pick("Working parents", "Total", "registered_eligible_children_percent"), byAge: Object.fromEntries(["9 months to 2 years", "2 years", "3 to 4 years"].map((a) => [a, { registered: pick("Working parents", a, "registered_children_count"), takeUp: pick("Working parents", a, "registered_eligible_children_percent") }])) },
    regional: { universal: regional("Universal", latest), universalBefore: regional("Universal", latest - 1), twoYearOlds: regional("Early learning for 2-year-olds", latest), twoYearOldsBefore: regional("Early learning for 2-year-olds", latest - 1) },
  };
}

async function main() {
  const data = { built: new Date().toISOString().slice(0, 10) };
  data.finance = await finance();
  data.activity = await activity();
  data.carers = await carers();
  data.workforce = await workforce();
  data.childcare = await childcare();
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB): finance ${data.finance.year}, workforce ${data.workforce.year}, childcare ${data.childcare.year}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
