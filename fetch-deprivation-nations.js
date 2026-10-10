// Fetches the Welsh Index of Multiple Deprivation 2025, the Scottish Index of Multiple Deprivation 2020 (v2) and the Northern
// Ireland Multiple Deprivation Measure 2017 and boils them down to what the Deprivation page shows for Wales, Scotland and
// Northern Ireland: for each local authority and each
// Westminster constituency, the share of its neighbourhoods in the most deprived tenth of the country, overall and
// on each kind of deprivation.
//
// Each nation ranks only its own neighbourhoods, built from different measures, so these figures say "relative to the
// rest of Wales" or "of Scotland" and cannot be set beside England's. The indices are published once, with no regular
// update, so this runs by hand when a new edition appears (a new SIMD is planned for late 2026).
//
//   Wales:    StatsWales API (WIMD 2025 ranks for the 1,917 neighbourhoods); neighbourhood -> local authority and
//             constituency from the ONS lookup LSOA21_PCON24_LAD21_EW_LU.
//   Scotland: gov.scot SIMD 2020v2 data zone lookup (6,976 data zones with every domain rank and the council area and
//             ward each sits in); ward -> constituency from the ONS lookup WD24_PCON24_LAD24_UTLA24_UK_LU. A ward that
//             straddles two seats is shared between them equally.
//
// Northern Ireland: NISRA's Northern Ireland Multiple Deprivation Measure 2017, at the level of its 462 wards (2014), which
// nest into the 18 constituencies (ONS lookup WD24_PCON24_LAD24_UTLA24_UK_LU; a ward in two seats is shared equally). Ranks
// and shares are of wards, not of the finer 890 super output areas, so that councils and constituencies are counted alike.
//
// Contains public sector information licensed under the Open Government Licence v3.0.
//
// Run it with: node fetch-deprivation-nations.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "./xlsx-lite.js";
import { readXls } from "./xls-lite.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "deprivationNations.json");
const HEADERS = { "User-Agent": "Mozilla/5.0 (simple-politics; independent, non-commercial)" };
const ARCGIS = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services";
const WIMD = "https://api.stats.gov.wales/v1/9706edd9-73ad-4902-bb12-7ccd7038626e/view";
const NIMDM_WARD = "https://www.nisra.gov.uk/files/nisra/publications/NIMDM17_Ward2014.xls";
const SIMD_LOOKUP = "https://www.gov.scot/binaries/content/documents/govscot/publications/statistics/2020/01/scottish-index-of-multiple-deprivation-2020-data-zone-look-up-file/documents/scottish-index-of-multiple-deprivation-data-zone-look-up/scottish-index-of-multiple-deprivation-data-zone-look-up/govscot%3Adocument/SIMD%2B2020v2%2B-%2Bdatazone%2Blookup%2B-%2Bupdated%2B2025.xlsx";

const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

async function getJson(url) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 5) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

async function arcgisAll(service, where, fields) {
  const rows = [];
  for (let offset = 0; offset < 100000; ) {
    const url = `${ARCGIS}/${service}/FeatureServer/0/query?where=${encodeURIComponent(where)}&outFields=${fields}&returnGeometry=false&resultOffset=${offset}&resultRecordCount=1000&orderByFields=ObjectId&f=json`;
    const j = await getJson(url);
    const got = j.features ?? [];
    rows.push(...got.map((f) => f.attributes));
    if (!got.length || !(j.exceededTransferLimit || got.length >= 1000)) break;
    offset += got.length;
  }
  return rows;
}

// A neighbourhood with a rank for each kind of deprivation (1 = most deprived) and the places it sits in.
// groups: Map of group key -> { name, code, seats weight }.
function summarise(neighbourhoods, N, domains, keyOf) {
  const groups = new Map();
  for (const n of neighbourhoods) {
    for (const [key, weight, meta] of keyOf(n)) {
      if (!groups.has(key)) groups.set(key, { ...meta, n: 0, ranksum: 0, worst10: 0, worst20: 0, best10: 0, domains: Object.fromEntries(domains.map((d) => [d.id, 0])), places: {} });
      const g = groups.get(key);
      g.n += weight;
      g.ranksum += (1 - n.ranks.imd / N) * weight;
      const tenth = N / 10;
      if (n.ranks.imd <= tenth) g.worst10 += weight;
      if (n.ranks.imd <= 2 * tenth) g.worst20 += weight;
      if (n.ranks.imd > 9 * tenth) g.best10 += weight;
      for (const d of domains.slice(1)) if (n.ranks[d.id] <= tenth) g.domains[d.id] += weight;
      if (n.place) g.places[n.place] = (g.places[n.place] ?? 0) + weight;
    }
  }
  return [...groups.entries()].map(([code, g]) => ({
    code,
    name: g.name,
    n: round(g.n, 1),
    score: round((g.ranksum / g.n) * 100),
    worst10: round((g.worst10 / g.n) * 100),
    worst20: round((g.worst20 / g.n) * 100),
    best10: round((g.best10 / g.n) * 100),
    domains: Object.fromEntries(Object.entries(g.domains).map(([id, v]) => [id, round((v / g.n) * 100)])),
    place: Object.entries(g.places).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  }));
}

function ranked(list) {
  list.sort((a, b) => b.score - a.score);
  list.forEach((a, i) => { a.rank = i + 1; });
  return list;
}

async function wales() {
  const domainMap = { WIMD: "imd", Income: "income", Employment: "employment", Health: "health", Education: "education", "Access to services": "access", Housing: "housing", "Community safety": "safety", "Physical environment": "environment" };
  const domains = [
    { id: "imd", label: "Overall deprivation" }, { id: "income", label: "Income" }, { id: "employment", label: "Employment" }, { id: "health", label: "Health" },
    { id: "education", label: "Education" }, { id: "access", label: "Access to services" }, { id: "housing", label: "Housing" },
    { id: "safety", label: "Community safety" }, { id: "environment", label: "Physical environment" },
  ];
  const ranks = new Map();
  const first = await getJson(`${WIMD}?page_size=10000&page_number=1`);
  const pages = [first];
  for (let p = 2; p <= first.total_pages; p++) pages.push(await getJson(`${WIMD}?page_size=10000&page_number=${p}`));
  for (const page of pages) {
    for (const [value, measure, code, name, domain] of page.data) {
      if (measure !== "Rank" || !domainMap[domain]) continue;
      if (!ranks.has(code)) ranks.set(code, { name, ranks: {} });
      ranks.get(code).ranks[domainMap[domain]] = Number(String(value).replace(/[,\s]/g, ""));
    }
  }
  const lookup = new Map((await arcgisAll("LSOA21_PCON24_LAD21_EW_LU", "LSOA21CD LIKE 'W01%'", "LSOA21CD,PCON24CD,PCON24NM,LAD21CD,LAD21NM")).map((r) => [r.LSOA21CD, r]));
  const hoods = [];
  for (const [code, r] of ranks) {
    if (domains.some((d) => r.ranks[d.id] == null || Number.isNaN(r.ranks[d.id]))) continue;
    const l = lookup.get(code);
    if (l) hoods.push({ code, ranks: r.ranks, lad: l, place: l.LAD21NM });
  }
  const N = hoods.length;
  if (N < 1800) throw new Error(`WIMD: only ${N} neighbourhoods matched`);
  const areas = ranked(summarise(hoods, N, domains, (n) => [[n.lad.LAD21CD, 1, { name: n.lad.LAD21NM }]]));
  const seats = ranked(summarise(hoods, N, domains, (n) => [[n.lad.PCON24CD, 1, { name: n.lad.PCON24NM }]]));
  if (areas.length < 20 || seats.length < 30) throw new Error(`WIMD: ${areas.length} authorities, ${seats.length} seats`);
  return {
    nation: "Wales", total: N, domains, areas, seats,
    source: { name: "Welsh Index of Multiple Deprivation (WIMD) 2025 (Welsh Government)", url: "https://www.gov.wales/welsh-index-multiple-deprivation-wimd-2025-results-report-overall-index-html", published: "November 2025" },
    boundaries: "Neighbourhoods are the 1,917 lower layer super output areas of the 2021 census. Each is matched to the July 2024 constituency it best fits (ONS lookup).",
  };
}

const NAA = ["S14000048", "North Ayrshire and Arran"];
const REDRAWN_WARDS = { S13003035: NAA, S13003036: NAA, S13003037: NAA, S13003038: NAA, S13003039: NAA, S13003040: NAA };

async function scotland() {
  const domains = [
    { id: "imd", label: "Overall deprivation" }, { id: "income", label: "Income" }, { id: "employment", label: "Employment" }, { id: "education", label: "Education, skills and training" },
    { id: "health", label: "Health" }, { id: "access", label: "Access to services" }, { id: "crime", label: "Crime" }, { id: "housing", label: "Housing" },
  ];
  const res = await fetch(SIMD_LOOKUP, { headers: HEADERS });
  if (!res.ok) throw new Error(`SIMD lookup: HTTP ${res.status}`);
  const book = readXlsx(Buffer.from(await res.arrayBuffer()));
  const sheet = book["SIMD 2020v2 DZ lookup data"];
  const head = sheet[0];
  const col = (n) => {
    const i = head.indexOf(n);
    if (i < 0) throw new Error(`SIMD: column not found: ${n}`);
    return i;
  };
  const c = { dz: col("DZ"), imd: col("SIMD2020v2_Rank"), income: col("SIMD2020v2_Income_Domain_Rank"), employment: col("SIMD2020_Employment_Domain_Rank"), education: col("SIMD2020_Education_Domain_Rank"), health: col("SIMD2020_Health_Domain_Rank"), access: col("SIMD2020_Access_Domain_Rank"), crime: col("SIMD2020_Crime_Domain_Rank"), housing: col("SIMD2020_Housing_Domain_Rank"), laCode: col("LAcode"), laName: col("LAname"), ward: col("MMWcode") };
  const hoods = sheet.slice(1).filter((r) => /^S01\d+$/.test(r[c.dz] ?? "")).map((r) => ({
    code: r[c.dz], ranks: Object.fromEntries(domains.map((d) => [d.id, Number(r[c[d.id]])])), la: { code: r[c.laCode], name: r[c.laName] }, ward: r[c.ward], place: r[c.laName],
  }));
  const N = hoods.length;
  if (N < 6900) throw new Error(`SIMD: only ${N} data zones`);

  // Ward -> constituency (a ward in two seats appears twice; its neighbourhoods are shared between them).
  const wardRows = await arcgisAll("WD24_PCON24_LAD24_UTLA24_UK_LU", "WD24CD LIKE 'S13%'", "WD24CD,WD24NM,PCON24CD,PCON24NM,LAD24CD,LAD24NM");
  const byWard = new Map();
  for (const w of wardRows) {
    if (!byWard.has(w.WD24CD)) byWard.set(w.WD24CD, []);
    byWard.get(w.WD24CD).push(w);
  }
  // The Western Isles are one seat, so a ward that does not match still lands in the right place by its council.
  const byLa = new Map();
  for (const w of wardRows) {
    if (!byLa.has(w.LAD24CD)) byLa.set(w.LAD24CD, new Map());
    byLa.get(w.LAD24CD).set(w.PCON24CD, w.PCON24NM);
  }
  let unmatched = 0;
  const seatsOf = (n) => {
    const hit = byWard.get(n.ward);
    if (hit?.length) return hit.map((w) => [w.PCON24CD, 1 / hit.length, { name: w.PCON24NM }]);
    // North Ayrshire's wards were redrawn in 2022 and the ONS list still has the old ones; these new wards sit wholly in the
    // North Ayrshire and Arran seat (Irvine and Kilwinning, which are in Central Ayrshire, keep their old codes).
    const redrawn = REDRAWN_WARDS[n.ward];
    if (redrawn) return [[redrawn[0], 1, { name: redrawn[1] }]];
    const la = byLa.get(n.la.code);
    if (la?.size === 1) { const [code, name] = [...la][0]; return [[code, 1, { name }]]; }
    unmatched++;
    return [];
  };
  const areas = ranked(summarise(hoods, N, domains, (n) => [[n.la.code, 1, { name: n.la.name }]]));
  const seats = ranked(summarise(hoods.map((n) => ({ ...n, place: n.la.name })), N, domains, seatsOf));
  if (unmatched > 60) throw new Error(`SIMD: ${unmatched} data zones could not be matched to a constituency`);
  if (areas.length < 30 || seats.length < 55) throw new Error(`SIMD: ${areas.length} council areas, ${seats.length} seats`);
  console.log(`Scotland: ${unmatched} of ${N} data zones had no constituency match`);
  return {
    nation: "Scotland", total: N, domains, areas, seats,
    source: { name: "Scottish Index of Multiple Deprivation (SIMD) 2020 v2 (Scottish Government)", url: "https://www.gov.scot/collections/scottish-index-of-multiple-deprivation-2020/", published: "January 2020 (revised June 2020)" },
    boundaries: "Neighbourhoods are the 6,976 data zones. Each ward is matched to the constituency it falls in (ONS lookup), and a ward split between two seats is shared equally between them.",
  };
}

async function northernIreland() {
  const domains = [
    { id: "imd", label: "Overall deprivation" }, { id: "income", label: "Income" }, { id: "employment", label: "Employment" }, { id: "health", label: "Health and disability" },
    { id: "education", label: "Education, skills and training" }, { id: "access", label: "Access to services" }, { id: "living", label: "Living environment" }, { id: "crime", label: "Crime and disorder" },
  ];
  const res = await fetch(NIMDM_WARD, { headers: HEADERS });
  if (!res.ok) throw new Error(`NIMDM: HTTP ${res.status}`);
  const sheet = readXls(Buffer.from(await res.arrayBuffer()))["NIMDM 2017"];
  const hoods = sheet.filter((r) => /^N08\d+$/.test(r[2] ?? "")).map((r) => ({ code: r[2], ranks: Object.fromEntries(domains.map((d, i) => [d.id, Number(r[4 + i])])), la: { code: r[0], name: r[0] }, place: r[0] }));
  const N = hoods.length;
  if (N < 450) throw new Error(`NIMDM: only ${N} wards`);
  const wardRows = await arcgisAll("WD24_PCON24_LAD24_UTLA24_UK_LU", "WD24CD LIKE 'N08%'", "WD24CD,PCON24CD,PCON24NM");
  const byWard = new Map();
  for (const w of wardRows) {
    if (!byWard.has(w.WD24CD)) byWard.set(w.WD24CD, []);
    byWard.get(w.WD24CD).push(w);
  }
  let unmatched = 0;
  const seatsOf = (n) => {
    const hit = byWard.get(n.code);
    if (!hit?.length) { unmatched++; return []; }
    return hit.map((w) => [w.PCON24CD, 1 / hit.length, { name: w.PCON24NM }]);
  };
  const areas = ranked(summarise(hoods, N, domains, (n) => [[n.la.code, 1, { name: n.la.name }]]));
  const seats = ranked(summarise(hoods, N, domains, seatsOf));
  if (unmatched > 0) throw new Error(`NIMDM: ${unmatched} wards could not be matched to a constituency`);
  if (areas.length !== 11 || seats.length !== 18) throw new Error(`NIMDM: ${areas.length} districts, ${seats.length} seats`);
  return {
    nation: "Northern Ireland", unit: "wards", total: N, domains, areas, seats,
    source: { name: "Northern Ireland Multiple Deprivation Measure 2017 (NISRA)", url: "https://www.nisra.gov.uk/statistics/deprivation/northern-ireland-multiple-deprivation-measure-2017-nimdm2017", published: "November 2017" },
    boundaries: "Areas are the 462 electoral wards (2014) ranked by NISRA. Each ward is matched to the constituency it falls in (ONS lookup), and a ward split between two seats is shared equally between them.",
  };
}

async function main() {
  const out = { fetchedAt: new Date().toISOString(), wales: await wales(), scotland: await scotland(), northernireland: await northernIreland() };
  fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  for (const k of ["wales", "scotland", "northernireland"]) console.log(`${k}: ${out[k].total} ${out[k].unit ?? "neighbourhoods"}, ${out[k].areas.length} council areas, ${out[k].seats.length} constituencies`);
  console.log(`Saved ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
