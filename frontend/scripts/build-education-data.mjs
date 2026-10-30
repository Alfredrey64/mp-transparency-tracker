// Builds src/data/educationData.json for the Education page from the Department for Education's open statistics API.
//
//   node scripts/build-education-data.mjs
//
// The API (https://api.education.gov.uk/statistics/v1) serves each release's data sets as gzipped CSV. The data sets are found by their title in each
// publication, so the script keeps working when a new release changes their ids. Years are the year an academic year starts (2024 is 2024/25) and
// a figure the department does not publish is null. England only.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/educationData.json");
const API = "https://api.education.gov.uk/statistics/v1";
const PUB = {
  ks4: "c8756008-ed50-4632-9b96-01b5ca002a43",
  ehc: "88312cc0-fe1d-4ab5-81df-33fd708185cb",
  sen: "f657afb4-8f4a-427d-a683-15f11a2aefb5",
  pupils: "a91d9e05-be82-474c-85ae-4913158406d0",
  ks2: "10370062-93b0-4dde-9097-5a56bf5b3064",
  absence: "cbbd299f-8297-44bc-92ac-558bcf51f8ad",
};

const headers = { "User-Agent": "Mozilla/5.0 simple-politics" };
const getJson = async (url) => (await fetch(url, { headers })).json();

async function dataSet(pub, titleStart) {
  const list = await getJson(`${API}/publications/${PUB[pub]}/data-sets?pageSize=20`);
  const hit = list.results.find((r) => r.title.startsWith(titleStart));
  if (!hit) throw new Error(`No data set starting "${titleStart}" in ${pub}`);
  const buf = Buffer.from(await (await fetch(`${API}/data-sets/${hit.id}/csv`, { headers })).arrayBuffer());
  const text = (buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf) : buf).toString("utf8");
  return parseCsv(text);
}

// A small CSV reader: quoted fields, commas and doubled quotes inside them.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const num = (v) => { const n = Number(v); return v === "" || v === undefined || Number.isNaN(n) ? null : n; };
const start = (period) => Number(String(period).slice(0, 4));
const round = (v, d) => (v === null ? null : Math.round(v * 10 ** d) / 10 ** d);
// Turn rows into { years: [...], values: [...] } with one value per year, for the years asked for.
function series(rows, valueOf, years) {
  const byYear = new Map(rows.map((r) => [start(r.time_period), valueOf(r)]));
  return years.map((y) => (byYear.has(y) ? byYear.get(y) : null));
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

async function main() {
  // Key stage 4 results by pupil group.
  const ks4 = (await dataSet("ks4", "National characteristics summary data")).filter((r) => r.geographic_level === "National");
  const group = (topic, breakdown) => ks4.filter((r) => r.breakdown_topic === topic && (breakdown === undefined || r.breakdown === breakdown));
  const ks4Years = range(2018, Math.max(...ks4.map((r) => start(r.time_period))));
  const pair = (rows) => ({ attainment8: series(rows, (r) => round(num(r.attainment8_average), 1), ks4Years), grade5: series(rows, (r) => round(num(r.engmath_95_percent), 1), ks4Years) });
  const gapRows = await dataSet("ks4", "Disadvantaged gap data");

  // Education, health and care plans each January.
  const ehc = (await dataSet("ehc", "Education, health and care plans as at January")).filter((r) => r.geographic_level === "National" && r.breakdown_topic === "All EHC plans" && r.setting_type === "Total");
  const ehcYears = ehc.map((r) => start(r.time_period)).sort();

  // Pupils with special educational needs, all schools.
  const sen = (await dataSet("sen", "Pupils in all schools, by type of SEN provision")).filter((r) => r.geographic_level === "National" && r.phase_type_grouping === "Total" && r.establishment_type === "Total" && r.hospital_school === "Total");
  const senOf = (name) => sen.filter((r) => r.sen_provision === name);
  const senYears = senOf("Total").map((r) => start(r.time_period)).sort();

  // Free school meals.
  const fsmRows = (await dataSet("pupils", "Pupil characteristics - number of pupils by fsm")).filter((r) => r.geographic_level === "National" && r.phase_type_grouping === "Total" && r.fsm_breakdown === "All pupils" && r.fsm_eligibility === "FSM eligible");
  const fsmYears = fsmRows.map((r) => start(r.time_period)).sort();

  // Key stage 2: the share of 11-year-olds reaching the expected standard in reading, writing and maths.
  const ks2 = (await dataSet("ks2", "Key stage 2 national headlines")).filter((r) => r.geographic_level === "National" && r.school_type === "AllSchools");
  const ks2Years = ks2.map((r) => start(r.time_period)).sort();

  // Absence.
  const abs = (await dataSet("absence", "Absence for persistent and severe absentees")).filter((r) => r.geographic_level === "National" && r.phase_type_grouping === "Total");
  const absYears = [...new Set(abs.map((r) => start(r.time_period)))].sort();
  const absOf = (name) => abs.filter((r) => r.absence_type === name);

  const data = {
    built: new Date().toISOString().slice(0, 10),
    gapIndex: { years: gapRows.map((r) => start(r.time_period)).sort(), values: gapRows.sort((a, b) => start(a.time_period) - start(b.time_period)).map((r) => round(num(r.disadvantage_gap_index), 2)) },
    ks4: {
      years: ks4Years,
      disadvantaged: pair(group("Disadvantage status", "Disadvantaged")),
      // The share of pupils at the end of key stage 4 who are counted as disadvantaged, so the page can quote it for the same year as the gap.
      disadvantagedShare: series(group("Disadvantage status", "Disadvantaged"), (r) => round(num(r.pupil_percent), 1), ks4Years),
      notDisadvantaged: pair(group("Disadvantage status", "Not known to be disadvantaged")),
      all: pair(group("Total")),
      girls: pair(group("Sex", "Girls")),
      boys: pair(group("Sex", "Boys")),
      ehcPlan: pair(group("SEN provision", "Education, health and care plan")),
      senSupport: pair(group("SEN provision", "SEN support / SEN without an EHC plan")),
      noSen: pair(group("SEN provision", "No SEN provision")),
    },
    ehcPlans: { years: ehcYears, values: series(ehc, (r) => num(r.ehc_plan_count), ehcYears) },
    sen: {
      years: senYears,
      pupils: series(senOf("Total"), (r) => num(r.pupil_count), senYears),
      ehcPlan: series(senOf("Education, health and care plan"), (r) => num(r.pupil_count), senYears),
      ehcPlanPct: series(senOf("Education, health and care plan"), (r) => round(num(r.pupil_percent), 2), senYears),
      supportPct: series(senOf("SEN support / SEN without an EHC plan"), (r) => round(num(r.pupil_percent), 2), senYears),
      support: series(senOf("SEN support / SEN without an EHC plan"), (r) => num(r.pupil_count), senYears),
    },
    freeMeals: { years: fsmYears, pct: series(fsmRows, (r) => round(num(r.pupil_percent), 2), fsmYears), pupils: series(fsmRows, (r) => num(r.pupil_count), fsmYears) },
    keyStage2: { years: ks2Years, readingWritingMaths: series(ks2, (r) => num(r.pt_rwm_exp), ks2Years), provisionalLast: ks2.some((r) => r.version === "Provisional" && start(r.time_period) === Math.max(...ks2Years)) },
    absence: { years: absYears, persistentPct: series(absOf("Persistent absence"), (r) => round(num(r.enrolment_percent), 2), absYears), severePct: series(absOf("Severe absence"), (r) => round(num(r.enrolment_percent), 2), absYears) },
  };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
