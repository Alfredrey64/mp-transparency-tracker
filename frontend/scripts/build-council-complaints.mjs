// Builds src/data/councilComplaints.json for the council complaints page and the "How your council handles complaints" card on Your area, from the Local Government and
// Social Care Ombudsman's yearly datasheets.
//
//   node scripts/build-council-complaints.mjs
//
// The Ombudsman publishes each year's figures for every authority in England as CSV files (complaints decided by outcome, and remedies and compliance). The newest year is
// found on its "local government complaint reviews" page, so the script keeps working when a new year is added. Authorities are matched to the councils in
// councilsIndex.json by name; fire services, national parks and combined authorities are not councils on that list, so they are left out of the lookup (their rows still
// count in the national totals, which are the Ombudsman's own "Totals" row). A figure the Ombudsman does not give is null.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRetry } from "../../httpFetch.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/councilComplaints.json");
const INDEX = path.join(here, "../src/data/councilsIndex.json");
const PAGE = "https://www.lgo.org.uk/information-centre/reports/annual-review-reports/local-government-complaint-reviews";
const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };

// A small CSV reader: quoted fields, doubled quotes and line breaks inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === "\"" && text[i + 1] === "\"") { field += "\""; i += 1; } else if (ch === "\"") quoted = false; else field += ch;
    } else if (ch === "\"") quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i += 1; row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export const num = (s) => { const t = String(s ?? "").replace(/[,%\s]/g, ""); return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null; };

// "Adur District Council" and "Adur" are the same council: the words that only say what kind of council it is are dropped before the names are compared.
export const norm = (s) => String(s ?? "").toLowerCase().replace(/&/g, " and ").replace(/[’']/g, "")
  .replace(/\b(council|borough|district|city|metropolitan|london|royal|county|of|the|and|unitary|authority)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

// The decided sheet: one header row naming "Authority Name", then a row per authority and a "Totals" row.
export function readDecided(rows) {
  const head = rows.findIndex((r) => r[0]?.trim() === "Authority Name");
  const out = new Map();
  for (const r of rows.slice(head + 1)) {
    const name = r[0]?.trim();
    if (!name || num(r[7]) === null) continue;
    out.set(name, { invalid: num(r[1]), advice: num(r[2]), referredBack: num(r[3]), closedEarly: num(r[4]), notUpheld: num(r[5]), upheld: num(r[6]), decided: num(r[7]), upheldPer100k: num(r[8]), similarPer100k: num(r[9]), upholdRate: num(r[10]), similarUpholdRate: num(r[11]) });
  }
  return out;
}

// The remedies sheet: per authority, how often it put things right before the Ombudsman had to, and how often it did what the Ombudsman recommended, and on time.
export function readRemedy(rows) {
  const head = rows.findIndex((r) => r[0]?.trim() === "Authority Name");
  const out = new Map();
  for (const r of rows.slice(head + 1)) {
    const name = r[0]?.trim();
    if (!name || num(r[1]) === null) continue;
    out.set(name, { remedyBefore: num(r[4]), similarRemedyBefore: num(r[5]), outcomes: num(r[6]), onTime: num(r[7]), timely: num(r[8]), similarTimely: num(r[9]), compliance: num(r[10]), similarCompliance: num(r[11]) });
  }
  return out;
}

export async function latestFiles() {
  const html = await (await fetchRetry(PAGE, { headers })).text();
  const links = [...html.matchAll(/href="([^"]+\.csv)"/g)].map((m) => m[1]);
  const pick = (re) => links.find((l) => re.test(l));
  const decided = pick(/Complaints-Decided-(\d\d-\d\d)\.csv$/i);
  const remedy = pick(/Remedy-Compliance-Outcomes-(\d\d-\d\d)\.csv$/i);
  if (!decided || !remedy) throw new Error("The Ombudsman's datasheets were not found on its page");
  const year = /(\d\d)-(\d\d)\.csv$/i.exec(decided);
  return { decided: new URL(decided, PAGE).href, remedy: new URL(remedy, PAGE).href, year: `20${year[1]}-${year[2]}` };
}

async function main() {
  const files = await latestFiles();
  console.log(`Newest year: ${files.year}`);
  const csv = async (url) => parseCsv(new TextDecoder("utf-8").decode(await (await fetchRetry(url, { headers })).arrayBuffer()).replace(/^﻿/, ""));
  const decided = readDecided(await csv(files.decided));
  const remedy = readRemedy(await csv(files.remedy));
  const totals = decided.get("Totals");
  if (!totals || decided.size < 300) throw new Error(`Only ${decided.size} authorities came back, so ${OUT} was left as it is`);

  const index = JSON.parse(fs.readFileSync(INDEX, "utf8")).index.filter((c) => c.id.startsWith("E"));
  const byName = new Map();
  for (const c of index) byName.set(norm(c.name), [...(byName.get(norm(c.name)) ?? []), c]);

  const councils = {};
  const unmatched = [];
  for (const [name, d] of decided) {
    if (name === "Totals") continue;
    const hits = byName.get(norm(name)) ?? [];
    // Two councils can share a short name (a county and a district). The kind of council in the Ombudsman's name settles which.
    const county = /county council/i.test(name);
    const pickOne = hits.length === 1 ? hits[0] : hits.find((h) => (county ? h.id.startsWith("E10") : !h.id.startsWith("E10"))) ?? null;
    if (!pickOne) { unmatched.push(name); continue; }
    councils[pickOne.id] = { name, ...d, ...(remedy.get(name) ?? {}) };
  }
  const left = unmatched.filter((n) => !/fire|national park|combined|authority|commissioner|transport for london|environment agency|Greater London/i.test(n));
  if (left.length) console.warn(`Not matched to a council: ${left.join("; ")}`);

  const out = {
    year: files.year,
    fetchedAt: new Date().toISOString().slice(0, 10),
    sources: { decided: files.decided, remedy: files.remedy, page: PAGE },
    national: { ...totals, ...(remedy.get("Totals") ?? {}), authorities: decided.size - 1 },
    councils,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUT}: ${Object.keys(councils).length} councils matched, ${decided.size - 1} authorities in all.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
