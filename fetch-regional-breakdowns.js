// Downloads the regional breakdowns behind the "Who ... where" maps on the Britain in numbers pages, and
// saves them in frontend/src/data/regionalBreakdowns.json:
//
//   jobs     the Annual Population Survey (employment, unemployment, inactivity, type of work, occupations,
//            qualifications) and the Annual Survey of Hours and Earnings (pay by sex and hours), both from Nomis
//   housing  prices by type of home and of buyer, and how many years of pay a home costs (HM Land Registry
//            and the ONS), with pay from the same survey
//   crime    offences per 1,000 people by type, and their change on a year earlier, by region and police area
//            (the Home Office, published by the ONS)
//
// Each category holds a few groups, and each group has one figure per region or nation (null where the
// publisher has none), plus a figure for the whole country to compare with. The pages draw them with the
// same map, key and ranked list as the census figures on the Population page.
//
// If one source fails this run, the copy saved last time is kept for it, so a bad response never blanks a map.
// Contains public sector information licensed under the Open Government Licence v3.0.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readXlsx } from "./xlsx-lite.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "regionalBreakdowns.json");
const HEADERS = { "User-Agent": "uk-parliament-tracker (independent, non-commercial; contact via GitHub)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The 12 regions and nations, with the name each source uses for them (lower case, trimmed).
const REGIONS = [
  { key: "ne", names: ["north east"], hpi: "north-east" },
  { key: "nw", names: ["north west"], hpi: "north-west" },
  { key: "yh", names: ["yorkshire and the humber"], hpi: "yorkshire-and-the-humber" },
  { key: "em", names: ["east midlands"], hpi: "east-midlands" },
  { key: "wm", names: ["west midlands"], hpi: "west-midlands" },
  { key: "east", names: ["east", "east of england"], hpi: "east-of-england" },
  { key: "london", names: ["london"], hpi: "london" },
  { key: "se", names: ["south east"], hpi: "south-east" },
  { key: "sw", names: ["south west"], hpi: "south-west" },
  { key: "wales", names: ["wales"], hpi: "wales" },
  { key: "scotland", names: ["scotland"], hpi: "scotland" },
  { key: "ni", names: ["northern ireland"], hpi: "northern-ireland" },
];
const keyFor = (name) => REGIONS.find((r) => r.names.includes(String(name).trim().toLowerCase()))?.key ?? null;
const round = (x, d = 1) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d);

async function getText(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      last = e;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error(`${url}: ${last?.message ?? "failed"}`);
}
const getJson = async (url) => JSON.parse(await getText(url));

// ---------------------------------------------------------------------------------------------
// Nomis: the Annual Population Survey

const NOMIS = "https://www.nomisweb.co.uk/api/v01/dataset";
const APS = {
  employment: [[45, "All people aged 16 to 64"], [54, "Men"], [63, "Women"], [46, "Aged 16 to 19"], [47, "Aged 20 to 24"], [48, "Aged 25 to 34"], [49, "Aged 35 to 49"], [51, "Aged 50 to 64"], [1757, "Disabled"], [1760, "Not disabled"]],
  unemployment: [[84, "All people aged 16 to 64"], [93, "Men"], [102, "Women"], [85, "Aged 16 to 19"], [86, "Aged 20 to 24"], [87, "Aged 25 to 34"], [90, "Aged 50 to 64"]],
  inactivity: [[111, "All people aged 16 to 64"], [120, "Men"], [129, "Women"], [112, "Aged 16 to 19"], [113, "Aged 20 to 24"], [117, "Aged 50 to 64"], [1781, "Disabled"], [1784, "Not disabled"], [254, "Would like a job"]],
  worktype: [[74, "Self-employed"], [202, "Working part-time"], [197, "Working full-time"]],
  occupations: [[1815, "Managers, directors and senior officials"], [1816, "Professional jobs"], [1817, "Associate professional jobs"], [1818, "Administrative and secretarial jobs"], [1819, "Skilled trades"], [1820, "Caring, leisure and other services"], [1821, "Sales and customer service"], [1822, "Machine and plant operatives"], [1823, "Elementary jobs"]],
  qualifications: [[1902, "Degree level or above"], [1911, "A-levels or equivalent"], [1920, "GCSE level"], [1947, "No qualifications"]],
};

async function apsValues() {
  const vars = [...new Set(Object.values(APS).flat().map(([v]) => v))];
  const csv = await getText(`${NOMIS}/NM_17_5.data.csv?geography=TYPE480,TYPE499&date=latest&variable=${vars.join(",")}&measures=20599&select=date_name,geography_name,variable,obs_value`);
  const out = {};
  let period = null;
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const m = /^"([^"]*)","([^"]+)","(\d+)",(.*)$/.exec(line.trim());
    if (!m) continue;
    const v = Number(m[4].replace(/"/g, ""));
    period = m[1];
    const name = m[2].trim().toLowerCase();
    const key = name === "united kingdom" ? "uk" : keyFor(name);
    if (!key || !Number.isFinite(v)) continue;
    ((out[m[3]] ??= {})[key] = v);
  }
  return { values: out, period };
}

// Some APS figures (qualifications, at the time of writing) are held back for the newest period, so these are read
// for the latest period in which the regions have figures.
async function apsLatestWithData(variables) {
  const dates = ["latest", ...[1, 2, 3, 4, 5, 6, 9, 12, 15, 18].map((n) => `latestMINUS${n}`)].join(",");
  const csv = await getText(`${NOMIS}/NM_17_5.data.csv?geography=TYPE480,TYPE499&date=${dates}&variable=${variables.join(",")}&measures=20599&select=date_name,geography_name,variable,obs_value`);
  const byPeriod = new Map();
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const m = /^"([^"]*)","([^"]+)","(\d+)",(.*)$/.exec(line.trim());
    if (!m) continue;
    const v = Number(m[4].replace(/"/g, ""));
    const key = m[2].trim().toLowerCase() === "united kingdom" ? "uk" : keyFor(m[2]);
    if (!key || !Number.isFinite(v) || m[4] === "") continue;
    if (!byPeriod.has(m[1])) byPeriod.set(m[1], {});
    ((byPeriod.get(m[1])[m[3]] ??= {})[key] = v);
  }
  // Rolling periods read "Jan 2024-Dec 2024": the one ending latest comes first.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const endOf = (label) => { const [mon, yr] = label.split("-").pop().split(" "); return Number(yr) * 12 + MONTHS.indexOf(mon); };
  const ordered = [...byPeriod.entries()].sort((a, b) => endOf(b[0]) - endOf(a[0]));
  for (const [period, values] of ordered) if (Object.values(values).every((r) => Object.keys(r).filter((k) => k !== "uk").length >= 10)) return { values, period };
  return null;
}

// ASHE: median pay for employees by where they live, split by sex and hours.
async function asheValues(item, pay, years) {
  const csv = await getText(`${NOMIS}/NM_30_1.data.csv?geography=TYPE480,TYPE499&date=${years}&sex=5,6,7,8,9&item=${item}&pay=${pay}&measures=20100&select=date_name,geography_name,sex,obs_value`);
  const rows = [];
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const m = /^"(\d{4})","([^"]+)","(\d+)",(-?[\d.]+)$/.exec(line.trim());
    if (m) rows.push({ year: Number(m[1]), name: m[2].trim().toLowerCase(), sex: m[3], v: Number(m[4]) });
  }
  const latest = Math.max(...rows.map((r) => r.year));
  const bySex = {};
  for (const r of rows.filter((x) => x.year === latest)) {
    const key = r.name === "united kingdom" ? "uk" : keyFor(r.name);
    if (key) (bySex[r.sex] ??= {})[key] = r.v;
  }
  return { bySex, year: latest };
}

const NOMIS_SOURCE = { name: "ONS, via Nomis", url: "https://www.nomisweb.co.uk/" };

async function jobs() {
  const { values, period } = await apsValues();
  const qual = await apsLatestWithData(APS.qualifications.map(([v]) => v));
  if (qual) Object.assign(values, qual.values);
  const years = Array.from({ length: new Date().getFullYear() - 2010 }, (_, i) => 2011 + i).join(",");
  const cats = [];
  const aps = (id, title, blurb, list, extra = {}) => cats.push({
    id, title, blurb, kind: "value", format: "pct", whole: "the UK", source: { name: "Annual Population Survey (ONS, via Nomis)", url: NOMIS_SOURCE.url }, period: `${period ?? ""}`.replace(/^[A-Za-z]+ (\d{4})-/, "").trim() ? `year to ${period.split("-").pop()}` : "", ...extra,
    groups: list.map(([v, label]) => ({ id: `v${v}`, label, values: Object.fromEntries(REGIONS.map((r) => [r.key, values[v]?.[r.key] ?? null])), all: values[v]?.uk ?? null })).filter((g) => Object.values(g.values).filter((x) => x !== null && x !== 0).length >= 8),
  });
  aps("employment", "In work", "The share of people aged 16 to 64 who have a paid job, for everyone and for different groups. Gaps between groups show who is missing out on work in each place.", APS.employment);
  aps("unemployment", "Looking for work", "The share of people who want a job, are looking and could start, out of those working or looking. Figures for small groups in some places are too uncertain to publish and are left blank.", APS.unemployment);
  aps("inactivity", "Not working or looking", "The share of people aged 16 to 64 who are neither in work nor looking for it, for example because of study, caring, sickness or retirement.", APS.inactivity);
  aps("worktype", "How people work", "Of the people in work (aged 16 to 64), the share who are self-employed, work part-time, or work full-time.", APS.worktype, { of: "of people in work" });
  aps("occupations", "Kinds of job", "Of everyone in work, the share doing each kind of job, as the ONS classifies them. It shows what the local economy is built on.", APS.occupations, { of: "of people in work" });
  aps("qualifications", "Qualifications", "The share of people aged 16 to 64 whose highest qualification is a degree, A-levels, GCSEs, or nothing.", APS.qualifications, { period: qual ? `year to ${qual.period.split("-").pop()}` : "" });

  // Pay: per hour (so full-time and part-time can be compared), and the gap between men and women.
  const hourly = await asheValues(2, 5, years);
  const groups = [["7", "All employees"], ["5", "Men"], ["6", "Women"], ["8", "Full-time workers"], ["9", "Part-time workers"]];
  const pick = (s) => Object.fromEntries(REGIONS.map((r) => [r.key, hourly.bySex[s]?.[r.key] ?? null]));
  cats.push({
    id: "pay", title: "Pay per hour", blurb: "The pay of the typical employee living in each place, per hour before tax, for different groups. Hourly pay lets full-time and part-time workers be compared fairly.",
    kind: "value", format: "gbp2", whole: "the UK", source: { name: "Annual Survey of Hours and Earnings (ONS, via Nomis)", url: NOMIS_SOURCE.url }, period: `April ${hourly.year}`,
    groups: groups.map(([s, label]) => ({ id: `pay${s}`, label, values: pick(s), all: hourly.bySex[s]?.uk ?? null })).filter((g) => Object.values(g.values).filter((x) => x !== null).length >= 8),
  });
  const gap = (men, women) => (men && women ? ((men - women) / men) * 100 : null);
  cats.push({
    id: "paygap", title: "Gap between men and women", blurb: "How far below men's pay women's pay is, as a share of men's median hourly pay. A positive figure means women are paid less per hour.",
    kind: "value", format: "pct", whole: "the UK", source: { name: "Annual Survey of Hours and Earnings (ONS, via Nomis)", url: NOMIS_SOURCE.url }, period: `April ${hourly.year}`,
    groups: [{ id: "gap-all", label: "Women's pay below men's, all employees", values: Object.fromEntries(REGIONS.map((r) => [r.key, round(gap(hourly.bySex["5"]?.[r.key], hourly.bySex["6"]?.[r.key]))])), all: round(gap(hourly.bySex["5"]?.uk, hourly.bySex["6"]?.uk)) }],
  });
  return { categories: cats.filter((c) => c.groups.length) };
}

// ---------------------------------------------------------------------------------------------
// Housing: the UK House Price Index, and pay for the years-of-pay figure

const HPI_FIELDS = {
  price: [["averagePrice", "All homes"], ["averagePriceDetached", "Detached houses"], ["averagePriceSemiDetached", "Semi-detached houses"], ["averagePriceTerraced", "Terraced houses"], ["averagePriceFlatMaisonette", "Flats and maisonettes"]],
  buyer: [["averagePriceFirstTimeBuyer", "First-time buyers"], ["averagePriceFormerOwnerOccupier", "People who already own a home"], ["averagePriceMortgage", "Buyers with a mortgage"], ["averagePriceCash", "Cash buyers"]],
  change: [["percentageAnnualChange", "All homes"], ["percentageAnnualChangeDetached", "Detached houses"], ["percentageAnnualChangeSemiDetached", "Semi-detached houses"], ["percentageAnnualChangeTerraced", "Terraced houses"], ["percentageAnnualChangeFlatMaisonette", "Flats and maisonettes"], ["percentageAnnualChangeFirstTimeBuyer", "First-time buyers"]],
};

async function hpiLatest(region) {
  const j = await getJson(`https://landregistry.data.gov.uk/data/ukhpi/region/${region}.json?_view=all&_pageSize=14&_sort=-refMonth`);
  return j.result?.items ?? [];
}

async function housing() {
  const byRegion = {};
  for (const r of REGIONS) { byRegion[r.key] = await hpiLatest(r.hpi); await sleep(250); }
  const ukItems = await hpiLatest("united-kingdom");
  // The latest month for which a field is published in nearly every region (some fields arrive a month later than others).
  const valueFor = (field) => {
    const months = [...new Set(Object.values(byRegion).flatMap((items) => items.map((i) => i.refMonth)))].sort().reverse();
    for (const month of months) {
      const values = Object.fromEntries(REGIONS.map((r) => [r.key, round(byRegion[r.key].find((i) => i.refMonth === month)?.[field] ?? null, field.startsWith("percentage") ? 1 : 0)]));
      if (Object.values(values).filter((v) => v !== null).length >= 10) return { month, values, all: round(ukItems.find((i) => i.refMonth === month)?.[field] ?? null, field.startsWith("percentage") ? 1 : 0) };
    }
    return null;
  };
  const source = { name: "UK House Price Index (HM Land Registry, ONS and others)", url: "https://www.gov.uk/government/collections/uk-house-price-index-reports" };
  const make = (list) => list.map(([field, label]) => {
    const got = valueFor(field);
    return got ? { id: field, label, values: got.values, all: got.all, month: got.month } : null;
  }).filter(Boolean);
  const monthLabel = (m) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const cats = [];
  const add = (id, title, blurb, groups, format, extra = {}) => {
    if (!groups.length) return;
    cats.push({ id, title, blurb, kind: "value", format, whole: "the UK", source, period: monthLabel(groups[0].month), ...extra, groups: groups.map(({ month, ...g }) => g) });
  };
  const price = make(HPI_FIELDS.price);
  add("price", "Price by type of home", "The average price paid for each kind of home in each place. A flat in London can cost more than a detached house in the North East.", price, "gbp");
  add("buyer", "Price by type of buyer", "The average price paid by different kinds of buyer. First-time buyers pay less than people who already own a home, and the gap shows how far up the ladder each place sits.", make(HPI_FIELDS.buyer), "gbp");
  add("change", "Change in price over a year", "How much the average price has changed compared with a year earlier, by type of home and buyer. Press the groups to see where each kind of home is rising or falling.", make(HPI_FIELDS.change), "pct");

  // Years of pay: the average price divided by what a typical employee living in the same place earns in a year.
  const pay = await asheValues(2, 7, Array.from({ length: new Date().getFullYear() - 2010 }, (_, i) => 2011 + i).join(","));
  const annual = pay.bySex["7"] ?? {};
  const priced = price.concat(make(HPI_FIELDS.buyer));
  const ratio = (field) => {
    const g = priced.find((x) => x.id === field);
    if (!g) return null;
    return { values: Object.fromEntries(REGIONS.map((r) => [r.key, annual[r.key] && g.values[r.key] ? round(g.values[r.key] / annual[r.key], 1) : null])), all: annual.uk && g.all ? round(g.all / annual.uk, 1) : null };
  };
  const years = [["averagePrice", "A typical home"], ["averagePriceFirstTimeBuyer", "A first-time buyer's home"], ["averagePriceFlatMaisonette", "A flat"], ["averagePriceDetached", "A detached house"]]
    .map(([field, label]) => ({ id: `years-${field}`, label, ...ratio(field) })).filter((g) => g.values);
  if (years.length) {
    cats.push({
      id: "affordability", title: "Years of pay to buy", blurb: "The average price of a home divided by the typical annual pay of employees living in the same place. A figure of 8 means a home costs eight years of pay before tax. It is a rough guide: it compares one person's pay with the price of a whole home.",
      kind: "value", format: "multiple", whole: "the UK", source: { name: "UK House Price Index and Annual Survey of Hours and Earnings", url: source.url }, period: `${monthLabel(price[0].month)} prices, April ${pay.year} pay`,
      groups: years,
    });
  }
  return { categories: cats };
}

// ---------------------------------------------------------------------------------------------
// Crime: the ONS police force area tables (England and Wales)

async function crime() {
  const root = await getJson("https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/datasets/policeforceareadatatables/data");
  const latest = root.datasets?.[0]?.uri;
  if (!latest) throw new Error("police force area tables: no latest release");
  const release = await getJson(`https://www.ons.gov.uk${latest}/data`);
  const file = release.downloads?.[0]?.file;
  const res = await fetch(`https://www.ons.gov.uk/file?uri=${latest}/${file}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`police force area tables: HTTP ${res.status}`);
  const book = readXlsx(Buffer.from(await res.arrayBuffer()));
  const tidy = (x) => String(x ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
  const title = (sheet) => tidy(book[sheet]?.[0]?.[0]);
  const period = /year ending (\w+ \d{4})/i.exec(title("Table P3") || title("Table P1"))?.[1] ?? "the latest year";
  const read = (sheet) => {
    const rows = book[sheet] ?? [];
    const head = rows.find((r) => r?.[0] === "Area Code");
    if (!head) throw new Error(`${sheet}: header not found`);
    return { head: head.map(tidy), rows: rows.filter((r) => /^(E12|W92|K04)/.test(String(r?.[0] ?? ""))) };
  };
  const OFFENCES = [
    ["Total recorded crime (excluding fraud)", "All crime (excluding fraud)"], ["Violence against the person", "Violence against the person"], ["Violence with injury", "Violence with injury"], ["Stalking and harassment", "Stalking and harassment"],
    ["Sexual offences", "Sexual offences"], ["Robbery", "Robbery"], ["Theft offences", "All theft"], ["Burglary", "Burglary"], ["Vehicle offences", "Vehicle offences"], ["Theft from the person", "Theft from the person"],
    ["Shoplifting", "Shoplifting"], ["Criminal damage and arson", "Criminal damage and arson"], ["Drug offences", "Drug offences"], ["Possession of weapons offences", "Possession of weapons"], ["Public order offences", "Public order offences"],
  ];
  const build = (sheet, scale) => {
    const { head, rows } = read(sheet);
    return OFFENCES.map(([column, label]) => {
      const i = head.findIndex((h) => h.toLowerCase().startsWith(column.toLowerCase()));
      if (i < 0) return null;
      const values = Object.fromEntries(REGIONS.map((r) => [r.key, null]));
      let all = null;
      for (const row of rows) {
        const v = typeof row[i] === "number" ? round(row[i], scale) : null;
        if (row[0] === "K04000001") all = v;
        else if (/^(E12|W92)/.test(row[0])) { const key = keyFor(tidy(row[1])); if (key) values[key] = v; }
      }
      return { id: column.toLowerCase().replace(/[^a-z]+/g, "-"), label, values, all };
    }).filter(Boolean);
  };
  const source = { name: "Police recorded crime (Home Office, published by the ONS)", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/datasets/policeforceareadatatables" };
  return {
    categories: [
      {
        id: "rate", title: "Crimes per 1,000 people", blurb: "Crimes recorded by the police in each region for every 1,000 people living there, for each type of offence. Police recording practice and how willing people are to report vary by place, so the figures show recorded crime, not exactly how much happens.",
        kind: "value", format: "per1000", whole: "England and Wales", source, period: `year ending ${period}`, groups: build("Table P3", 2),
      },
      {
        id: "change", title: "Change over a year", blurb: "How much the number of recorded crimes has changed compared with the year before, by region. A rise can reflect more reporting or better recording as well as more crime.",
        kind: "value", format: "pct", whole: "England and Wales", source, period: `year ending ${period}, compared with a year earlier`, groups: build("Table P2", 1),
      },
    ],
  };
}

// ---------------------------------------------------------------------------------------------

async function main() {
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { /* first run */ }
  const out = { fetchedAt: new Date().toISOString(), sectors: {} };
  let ok = 0;
  for (const [name, run] of [["jobs", jobs], ["housing", housing], ["crime", crime]]) {
    try {
      out.sectors[name] = await run();
      ok++;
      console.log(`${name}: ${out.sectors[name].categories.length} categories, ${out.sectors[name].categories.reduce((n, c) => n + c.groups.length, 0)} groups`);
    } catch (e) {
      console.warn(`! ${name}: ${e.message}`);
      if (previous.sectors?.[name]) out.sectors[name] = previous.sectors[name];
    }
  }
  if (!ok) process.exit(1);
  fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  console.log(`Saved ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
