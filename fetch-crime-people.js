// fetch-crime-people.js
//
// What this does, in plain terms: gathers the official figures on WHO is involved in crime, from four public sources, and
// writes frontend/src/data/crimePeople.json for the "Who is involved in crime" section of the Crime page.
//
//   Arrests, stop and search, reoffending      GOV.UK "Ethnicity facts and figures" (Home Office and Ministry of Justice), CSV
//   What people are held for, and prison       Ministry of Justice "Statistics on Ethnicity and the Criminal Justice System 2024"
//                                              (police-station legal aid cases by offence, Table 5.03; prison population, Table 6.01)
//   Victims, by ethnic group, age, income,     ONS Crime Survey for England and Wales, annual supplementary tables
//   area deprivation
//
// What is NOT in it, because no official source publishes it: the income of the people who are arrested or convicted. The closest
// official figures are who is a victim by household income and area deprivation, and the deprivation of the area (not published
// here). The page says so.
//
// These are published once a year (the ethnicity report every two years), so this is run by hand, not daily.
//
// Run it with: node fetch-crime-people.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readOds } from "./ods-lite.js";
import { readXlsx } from "./xlsx-lite.js";
import { fetchRetry } from "./httpFetch.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "crimePeople.json");
const HEADERS = { "User-Agent": "Mozilla/5.0 (simple-politics; independent, non-commercial)" };
const EFF = "https://www.ethnicity-facts-figures.service.gov.uk/crime-justice-and-the-law";
const MOJ = "https://assets.publishing.service.gov.uk/media";
const MOJ_PAGE = "https://www.gov.uk/government/statistics/ethnicity-and-the-criminal-justice-system-2024";
const ONS = "https://www.ons.gov.uk";

const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const num = (s) => {
  const n = Number(String(s ?? "").replace(/[,%\s]/g, ""));
  return Number.isFinite(n) && String(s ?? "").trim() !== "" ? n : null;
};

async function get(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetchRetry(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (attempt === 4) throw new Error(`${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

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
  return rows.filter((r) => r.length > 1);
}

const eff = async (topic, file) => parseCsv(await (await get(`${EFF}/${topic}/latest/downloads/${file}`)).text());
const effPeriod = async (topic) => {
  const html = await (await get(`${EFF}/${topic}/latest/`)).text();
  return /(April \d{4} to March \d{4})/.exec(html)?.[1] ?? null;
};

// The five broad groups the official tables share, however each table words them.
const BROAD = [
  { id: "asian", label: "Asian", re: /^asian/i },
  { id: "black", label: "Black", re: /^black/i },
  { id: "mixed", label: "Mixed", re: /^mixed/i },
  { id: "white", label: "White", re: /^white/i },
  { id: "other", label: "Other", re: /^other/i },
];
const broadOf = (label) => BROAD.find((b) => b.re.test(String(label).trim()))?.id ?? null;

// Arrests and stop and search by ethnic group: a rate per 1,000 people of that group, and how many.
function ratesByEthnicity(rows) {
  const [, ...body] = rows;
  const out = { all: null, unknown: null, groups: [] };
  let parent = null;
  for (const [label, rate, number] of body) {
    const l = label.trim();
    if (l === "All") { out.all = { rate: num(rate), number: num(number) }; continue; }
    if (l === "Unknown") { out.unknown = { number: num(number) }; continue; }
    const top = BROAD.some((b) => b.label.toLowerCase() === l.toLowerCase());
    if (top) parent = broadOf(l);
    out.groups.push({ label: l, parent: top ? null : parent, broad: top ? broadOf(l) : parent, rate: num(rate), number: num(number) });
  }
  return out;
}

async function arrests() {
  const main = ratesByEthnicity(await eff("policing/number-of-arrests", "by-ethnicity.csv"));
  // By sex: [sex, ethnicity, rate, number]
  const [, ...sexRows] = await eff("policing/number-of-arrests", "by-ethnicity-and-sex.csv");
  const bySex = { male: {}, female: {} };
  for (const [sex, eth, rate] of sexRows) {
    const s = sex.trim().toLowerCase();
    const id = eth.trim() === "All" ? "all" : BROAD.some((b) => b.label.toLowerCase() === eth.trim().toLowerCase()) ? broadOf(eth) : null;
    if ((s === "male" || s === "female") && id) bySex[s][id] = num(rate);
  }
  // Over time: [time, ethnicity, rate, number]
  const [, ...timeRows] = await eff("policing/number-of-arrests", "by-ethnicity-over-time.csv");
  const years = [...new Set(timeRows.map((r) => r[0]))];
  const overTime = years.map((y) => ({ year: y, rates: Object.fromEntries(timeRows.filter((r) => r[0] === y).map((r) => [r[1] === "All" ? "all" : broadOf(r[1]) ?? r[1], num(r[2])]).filter(([, v]) => v !== null)) }));
  // The population of each broad group (2021 Census, England and Wales) is the number of arrests over the rate per 1,000.
  const population = Object.fromEntries(main.groups.filter((g) => !g.parent && g.rate).map((g) => [g.broad, Math.round((g.number / g.rate) * 1000)]));
  population.all = Math.round((main.all.number / main.all.rate) * 1000);
  const last = years.at(-1);
  const period = /^(\d{4})\/(\d{2})$/.test(last) ? `April ${last.slice(0, 4)} to March 20${last.slice(5)}` : last;
  return { period, ...main, bySex, overTime, population, note: "Arrests for notifiable offences in England and Wales (City of London excluded). A person arrested more than once in a year is counted each time. Ethnic group is as recorded by the police." };
}

async function stopSearch() {
  const period = await effPeriod("policing/stop-and-search");
  return { period, ...ratesByEthnicity(await eff("policing/stop-and-search", "by-ethnicity.csv")) };
}

async function reoffending() {
  const period = await effPeriod("crime-and-reoffending/proven-reoffending");
  const [, ...rows] = await eff("crime-and-reoffending/proven-reoffending", "by-ethnicity.csv");
  return { period, groups: rows.map(([label, pct, number, avg]) => ({ label: label.trim(), pct: num(pct), number: num(number), average: num(avg) })).filter((g) => g.label !== "All" && g.pct !== null), all: (() => { const r = rows.find((x) => x[0].trim() === "All"); return r ? { pct: num(r[1]), number: num(r[2]), average: num(r[3]) } : null; })() };
}

// The links to this edition's tables, read from the publication's own page.
async function mojTables() {
  const html = await (await get(MOJ_PAGE)).text();
  const links = [...html.matchAll(/href="(https:\/\/assets\.publishing\.service\.gov\.uk\/media\/[^"]+\.ods)"/g)].map((m) => m[1]);
  const find = (re) => links.find((l) => re.test(l));
  return { defendants: find(/5_Defendants/i), management: find(/6_Offender_Management/i) };
}

const OFFENCES = [
  ["Offences against the person", "Violence against the person"],
  ["Drug offences", "Drugs"],
  ["Theft", "Theft"],
  ["Burglary", "Burglary"],
  ["Robbery", "Robbery"],
  ["Sexual offences", "Sexual offences"],
  ["Public order", "Public order"],
  ["Criminal damage", "Criminal damage"],
  ["Driving and motor vehicle", "Driving offences"],
  ["Fraud and forgery", "Fraud"],
];

async function offences(url) {
  const book = readOds(Buffer.from(await (await get(url)).arrayBuffer()));
  const rows = book["5_03"];
  const head = rows.find((r) => r?.[0] === "Ethnic Group");
  const year = String(head.at(-1));
  const col = head.length - 1;
  const groups = {};
  let current = null;
  for (const r of rows) {
    if (!r || r.length < 3) continue;
    if (r[0] && r[0] !== "Ethnic Group" && !/^Table|^This|^Source/.test(String(r[0]))) current = /^unknown/i.test(String(r[0])) ? "unknown" : broadOf(String(r[0]).replace(/^Asian\/Asian British/i, "Asian").replace(/^Black\/.*/i, "Black"));
    if (!current || !r[1] || r[0] === "Ethnic Group") continue;
    const name = String(r[1]).trim();
    const v = num(r[col]);
    if (v === null) continue;
    (groups[current] ??= { byOffence: {}, total: 0 });
    if (/^total/i.test(name)) groups[current].total = v;
    else {
      const hit = OFFENCES.find(([key]) => name.toLowerCase().startsWith(key.toLowerCase()));
      const key = hit ? hit[1] : "Other";
      groups[current].byOffence[key] = (groups[current].byOffence[key] ?? 0) + v;
    }
  }
  return { year, groups, note: "Cases where a suspect held at a police station was represented under legal aid, by the offence they were suspected of. Most people held get legal advice, so it is a good guide to who is held for what, but it counts cases, not people, and a suspect is not necessarily guilty." };
}

async function prison(url) {
  const book = readOds(Buffer.from(await (await get(url)).arrayBuffer()));
  const rows = book["6_01"];
  const head = rows.find((r) => r?.[0] === "Age");
  const col = head.length - 1;
  const date = String(head[col]).replace(/^31-Jun/, "30-Jun");
  const take = (sex) => Object.fromEntries(rows.filter((r) => r?.[0] === "Total" && r?.[1] === sex).map((r) => [String(r[2]).trim(), num(r[col])]).filter(([, v]) => v !== null));
  const total = take("Total");
  const groups = {};
  for (const [label, v] of Object.entries(total)) {
    const id = broadOf(label === "Other ethnic group" ? "Other" : label);
    if (id) groups[id] = v;
  }
  return { date: date.replace(/^30-Jun-/, "30 June 20"), groups, known: total["Total known"], unrecorded: total["Not stated/ Unrecorded"], men: take("Male"), women: take("Female") };
}

// Victims, from the ONS annual supplementary tables (year ending March).
async function victims() {
  const html = await (await get(`${ONS}/peoplepopulationandcommunity/crimeandjustice/datasets/crimeinenglandandwalesannualsupplementarytables`)).text();
  const files = [...html.matchAll(/href="(\/file\?uri=[^"]+\/(march\d{4})\/[^"]+\.xlsx)"/g)].map((m) => ({ url: m[1], year: Number(m[2].slice(5)) }));
  if (!files.length) throw new Error("no annual supplementary tables found");
  const latest = files.sort((a, b) => b.year - a.year)[0];
  const book = readXlsx(Buffer.from(await (await get(`${ONS}${latest.url}`)).arrayBuffer()));
  const parse = (sheet) => {
    const rows = book[sheet];
    const head = rows.find((r) => /breakdown/i.test(String(r?.[1] ?? "")));
    const out = [];
    for (const r of rows.slice(rows.indexOf(head) + 1)) {
      if (!r || !r[0] || !r[1]) continue;
      const any = typeof r[2] === "number" ? round(r[2]) : null;
      const personal = typeof r[3] === "number" ? round(r[3]) : null;
      const base = typeof r[4] === "number" ? r[4] : null;
      out.push({ group: String(r[0]).replace(/\s*\[note \d+\]/g, "").trim(), label: String(r[1]).replace(/\s*\[note \d+\]/g, ""), any, personal, base });
    }
    return out;
  };
  const a1 = parse("Table A1");
  const a2 = parse("Table A2");
  const pick = (rows, group, filter = () => true) => rows.filter((r) => r.group === group && filter(r)).map((r) => ({ label: r.label.trim(), indent: /^\s{2,}/.test(r.label), any: r.any, personal: r.personal, base: r.base })).filter((r) => r.any !== null || r.personal !== null);
  const label = (s) => String(s).trim();
  return {
    year: `year ending March ${latest.year}`,
    all: a1.find((r) => r.group === "All people" && r.label === "All people") ? { any: a1.find((r) => r.group === "All people" && r.label === "All people").any, personal: a1.find((r) => r.group === "All people" && r.label === "All people").personal } : null,
    ethnic: pick(a1, "Ethnic group", (r) => !/^\s{2,}/.test(r.label)).map((r) => ({ ...r, label: label(r.label) })),
    ethnicDetail: pick(a1, "Ethnic group", (r) => /^\s{2,}/.test(r.label)),
    age: a1.filter((r) => r.group === "All people" && /^\d|^75/.test(r.label)).map((r) => ({ label: r.label.trim(), any: r.any, personal: r.personal, base: r.base })),
    sex: a1.filter((r) => (r.group === "Men" || r.group === "Women") && r.label === r.group).map((r) => ({ label: r.label, any: r.any, personal: r.personal, base: r.base })),
    income: pick(a2, "Total household income", (r) => !/No income stated/i.test(r.label)),
    deprivation: pick(a2, "English Indices of Deprivation (Employment)"),
    tenure: pick(a2, "Tenure"),
    area: pick(a2, "Area type"),
    disability: pick(a1, "Disability [note 4]").length ? pick(a1, "Disability [note 4]") : a1.filter((r) => /^Disability/.test(r.group)).map((r) => ({ label: r.label.trim(), any: r.any, personal: r.personal, base: r.base })),
    employment: pick(a1, "Respondent's employment status", (r) => !/^\s{2,}/.test(r.label)),
  };
}

async function main() {
  const tables = await mojTables();
  if (!tables.defendants || !tables.management) throw new Error("could not find the Ministry of Justice tables on the publication page");
  const out = {
    fetchedAt: new Date().toISOString(),
    arrests: await arrests(),
    stopSearch: await stopSearch(),
    reoffending: await reoffending(),
    offences: await offences(tables.defendants),
    prison: await prison(tables.management),
    victims: await victims(),
    sources: {
      arrests: { name: "Home Office police powers and procedures, via GOV.UK Ethnicity facts and figures", url: `${EFF}/policing/number-of-arrests/latest/` },
      stopSearch: { name: "Home Office stop and search statistics, via GOV.UK Ethnicity facts and figures", url: `${EFF}/policing/stop-and-search/latest/` },
      reoffending: { name: "Ministry of Justice proven reoffending statistics, via GOV.UK Ethnicity facts and figures", url: `${EFF}/crime-and-reoffending/proven-reoffending/latest/` },
      ethnicityCjs: { name: "Statistics on Ethnicity and the Criminal Justice System 2024 (Ministry of Justice)", url: MOJ_PAGE },
      csew: { name: "Crime in England and Wales: annual supplementary tables (ONS, Crime Survey for England and Wales)", url: `${ONS}/peoplepopulationandcommunity/crimeandjustice/datasets/crimeinenglandandwalesannualsupplementarytables` },
    },
  };
  if (!out.arrests.groups.length || !out.victims.ethnic.length || !Object.keys(out.offences.groups).length) throw new Error("a table came back empty");
  fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  void MOJ;
  console.log(`Saved ${path.relative(process.cwd(), OUT)}`);
  console.log(`arrests ${out.arrests.period}; offences ${out.offences.year}; prison ${out.prison.date}; victims ${out.victims.year}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
