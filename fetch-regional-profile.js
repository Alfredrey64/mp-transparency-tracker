// Downloads Census 2021 breakdowns of the population for the regions of England and for Wales
// (ethnic group, religion, where people were born, age, homes, qualifications, class, health) from
// Nomis (the ONS's website for labour market and census figures), and saves one small file,
// frontend/src/data/regionalProfile.json, for the Population page's "Who lives where" explorer.
//
// Scotland and Northern Ireland counted their people in separate censuses (Scotland's in 2022), with their own
// questions. Where the statistics agencies have published a UK-wide table on matching categories (broad ethnic
// group, religion, place of birth, age, health, housing tenure, qualifications), Scotland and Northern Ireland
// are filled in from those tables, which NISRA hosts. Anything they did not publish on matching terms (the
// detailed ethnic groups, overcrowding, type of work, disability) is left blank for them, and the page greys them out.
//
// The censuses are one-offs, so this does not need to run every day: run it by hand if a category is added below.
// (Pay by region is a yearly survey and is fetched with the other series by fetch-ons.js.)
//
// Contains public sector information licensed under the Open Government Licence v3.0.

import fs from "node:fs";
import path from "node:path";
import { readXlsx } from "./xlsx-lite.js";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "regionalProfile.json");
const BASE = "https://www.nomisweb.co.uk/api/v01/dataset";
const HEADERS = { "User-Agent": "uk-parliament-tracker (independent, non-commercial; contact via GitHub)" };
const CENSUS_URL = "https://www.ons.gov.uk/census";
const SOURCE = { name: "Census 2021 (ONS, via Nomis)", url: CENSUS_URL };

const PLACES = {
  "north east": "ne", "north west": "nw", "yorkshire and the humber": "yh", "east midlands": "em", "west midlands": "wm",
  east: "east", "east of england": "east", london: "london", "south east": "se", "south west": "sw", wales: "wales",
};

// Each category is a few groups. A group is one table (dataset + the question's column) and which answers to add up;
// the share is that sum divided by the table's total.
const TABLES = {
  eth: ["NM_2041_1", "c2021_eth_20"],
  religion: ["NM_2049_1", "c2021_religion_10"],
  birth: ["NM_2024_1", "c2021_cob_12"],
  age: ["NM_2020_1", "c2021_age_19"],
  tenure: ["NM_2072_1", "c2021_tenure_9"],
  bedrooms: ["NM_2070_1", "c2021_occrat_bedrooms_6"],
  cars: ["NM_2063_1", "c2021_cars_5"],
  qual: ["NM_2084_1", "c2021_hiqual_8"],
  class: ["NM_2079_1", "c2021_nssec_10"],
  health: ["NM_2055_1", "c2021_health_6"],
  disability: ["NM_2056_1", "c2021_disability_5"],
  deprived: ["NM_2031_1", "c2021_dep_6"],
};

const UK_NATIONS = ["Europe: United Kingdom: England", "Europe: United Kingdom: Northern Ireland", "Europe: United Kingdom: Scotland", "Europe: United Kingdom: Wales"];
// The UK-wide tables NISRA publishes, one per topic, with every country's figures side by side.
const UK_TABLE_KEYS = { Scotland: "scotland", "Northern Ireland": "ni" };

const CATEGORIES = [
  {
    id: "ethnicity", title: "Ethnic group", of: "of residents",
    blurb: "The ethnic group each person said they belong to, in the 2021 Census. It is how people describe themselves, so it is about identity and family background, not nationality.",
    groups: [
      ["not-white", "Any group other than White", "eth", [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], { t: "UK06", col: "Ethnic group", not: ["White ethnic groups"] }],
      ["not-white-british", "Any group other than White British", "eth", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]],
      ["asian", "Asian (all groups)", "eth", [10, 11, 12, 13, 14], { t: "UK06", col: "Ethnic group", pick: ["Asian ethnic groups"] }],
      ["black", "Black (all groups)", "eth", [15, 16, 17], { t: "UK06", col: "Ethnic group", pick: ["Black, Caribbean or African ethnic groups"] }],
      ["white-british", "White British", "eth", [1]],
      ["white-other", "Other White (including Irish and Roma)", "eth", [2, 3, 4, 5]],
      ["indian", "Indian", "eth", [10]],
      ["pakistani", "Pakistani", "eth", [11]],
      ["bangladeshi", "Bangladeshi", "eth", [12]],
      ["chinese", "Chinese", "eth", [13]],
      ["other-asian", "Other Asian", "eth", [14]],
      ["african", "Black African", "eth", [16]],
      ["caribbean", "Black Caribbean", "eth", [15]],
      ["mixed", "Mixed or multiple groups", "eth", [6, 7, 8, 9], { t: "UK06", col: "Ethnic group", pick: ["Mixed or Multiple ethnic groups"] }],
      ["arab-other", "Arab or another group", "eth", [18, 19], { t: "UK06", col: "Ethnic group", pick: ["Other ethnic groups"] }],
    ],
  },
  {
    id: "religion", title: "Religion", of: "of residents",
    blurb: "The religion people said they have, if any. The question was voluntary, so a small share did not answer.",
    groups: [
      ["no-religion", "No religion", "religion", [1], { t: "UK07", col: "Religion", pick: ["No religion"] }],
      ["christian", "Christian", "religion", [2], { t: "UK07", col: "Religion", pick: ["Christian"] }],
      ["muslim", "Muslim", "religion", [6], { t: "UK07", col: "Religion", pick: ["Muslim"] }],
      ["hindu", "Hindu", "religion", [4], { t: "UK07", col: "Religion", pick: ["Hindu"] }],
      ["sikh", "Sikh", "religion", [7]],
      ["jewish", "Jewish", "religion", [5]],
      ["buddhist", "Buddhist", "religion", [3], { t: "UK07", col: "Religion", pick: ["Buddhist"] }],
      ["other-religion", "Another religion (including Jewish and Sikh)", "religion", [5, 7, 8], { t: "UK07", col: "Religion", pick: ["Other religion"] }],
    ],
  },
  {
    id: "birth", title: "Where people were born", of: "of residents",
    blurb: "The country each person was born in. It says nothing about whether they are British citizens: many people born abroad are.",
    groups: [
      ["born-abroad", "Born outside the UK", "birth", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], { t: "UK05", col: "Country of birth", not: UK_NATIONS }],
      ["born-eu", "Born in the EU", "birth", [2, 3, 4, 5]],
      ["born-asia", "Born in the Middle East or Asia", "birth", [8], { t: "UK05", col: "Country of birth", pick: ["Middle East and Asia"] }],
      ["born-africa", "Born in Africa", "birth", [7], { t: "UK05", col: "Country of birth", pick: ["Africa"] }],
      ["born-americas", "Born in the Americas or Caribbean", "birth", [9], { t: "UK05", col: "Country of birth", pick: ["The Americas and Caribbean"] }],
    ],
  },
  {
    id: "age", title: "Age", of: "of residents",
    blurb: "How old people were on Census day in 2021. Younger people cluster in big cities, older people in coastal and rural areas.",
    groups: [
      ["under-15", "Under 15", "age", [1, 2, 3], { t: "UK05", col: "AGE_BAND_5YR_85", pick: ["0", "1", "2"] }],
      ["15-24", "15 to 24", "age", [4, 5], { t: "UK05", col: "AGE_BAND_5YR_85", pick: ["3", "4"] }],
      ["25-44", "25 to 44", "age", [6, 7, 8, 9], { t: "UK05", col: "AGE_BAND_5YR_85", pick: ["5", "6", "7", "8"] }],
      ["45-64", "45 to 64", "age", [10, 11, 12, 13], { t: "UK05", col: "AGE_BAND_5YR_85", pick: ["9", "10", "11", "12"] }],
      ["65-plus", "65 and over", "age", [14, 15, 16, 17, 18], { t: "UK05", col: "AGE_BAND_5YR_85", pick: ["13", "14", "15", "16", "17"] }],
      ["85-plus", "85 and over", "age", [18], { t: "UK05", col: "AGE_BAND_5YR_85", pick: ["17"] }],
    ],
  },
  {
    id: "homes", title: "Homes and households", of: "of households",
    blurb: "How households live: who owns, who rents, how crowded homes are, and who has a car.",
    groups: [
      ["own-outright", "Own their home outright", "tenure", [1], { t: "UK12", col: "Tenure", pick: ["Owned: owned outright"] }],
      ["own-mortgage", "Own with a mortgage or shared ownership", "tenure", [2, 3], { t: "UK12", col: "Tenure", pick: ["Owned: owned with a mortgage or loan", "Owned: shared ownership"] }],
      ["social-rent", "Rent from a council or housing association", "tenure", [4, 5], { t: "UK12", col: "Tenure", pick: ["Social rented"] }],
      ["private-rent", "Rent privately", "tenure", [6, 7], { t: "UK12", col: "Tenure", pick: ["Private rented: other private rented", "Private rented: private landlord or letting agency"] }],
      ["overcrowded", "Live in an overcrowded home", "bedrooms", [4, 5]],
      ["no-car", "Have no car or van", "cars", [1]],
    ],
  },
  {
    id: "education", title: "Qualifications", of: "of people aged 16 and over",
    blurb: "The highest qualification each person has. Level 4 and above means a degree, higher national diploma or similar.",
    groups: [
      ["degree", "Degree level or above", "qual", [6], { t: "UK16", col: "Highest level of qualification", pick: ["Degree level or above"] }],
      ["no-qualifications", "No qualifications", "qual", [1], { t: "UK16", col: "Highest level of qualification", pick: ["No qualifications"] }],
      ["apprenticeship", "An apprenticeship", "qual", [4]],
      ["level-3", "A-levels or equivalent", "qual", [5]],
    ],
  },
  {
    id: "class", title: "Type of work", of: "of people aged 16 and over",
    blurb: "The group of jobs people have (or last had), as the ONS classifies them. It is a guide to the kind of work done in each place, not to how much it pays.",
    groups: [
      ["higher-managerial", "Higher managers and professionals", "class", [1]],
      ["lower-managerial", "Lower managers and professionals", "class", [2]],
      ["intermediate", "Intermediate jobs", "class", [3]],
      ["own-account", "Small employers and self-employed", "class", [4]],
      ["routine", "Routine and semi-routine jobs", "class", [6, 7]],
      ["never-worked", "Never worked or long-term unemployed", "class", [8]],
      ["students", "Full-time students", "class", [9]],
    ],
  },
  {
    id: "health", title: "Health and disability", of: "of residents",
    blurb: "How people rated their own health, and whether they are disabled under the Equality Act (a long-term condition that limits day-to-day activities).",
    groups: [
      ["very-good-health", "Very good health", "health", [1], { t: "UK08", col: "General health", pick: ["Very good health"] }],
      ["bad-health", "Bad or very bad health", "health", [4, 5], { t: "UK08", col: "General health", pick: ["Bad health", "Very bad health"] }],
      ["disabled", "Disabled under the Equality Act", "disability", [1, 2]],
      ["limited-a-lot", "Day-to-day activities limited a lot", "disability", [1]],
    ],
  },
  {
    id: "deprivation-dimensions", title: "Household deprivation", of: "of households",
    blurb: "The census counts four ways a household can be deprived: nobody in work or full-time study, nobody with good qualifications, a member in bad health, and an overcrowded or shared home.",
    groups: [
      ["not-deprived", "Not deprived in any way", "deprived", [1]],
      ["deprived-two-plus", "Deprived in two or more ways", "deprived", [3, 4, 5]],
      ["deprived-three-plus", "Deprived in three or more ways", "deprived", [4, 5]],
    ],
  },
];

async function getCsv(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`${url}: ${last?.message ?? "failed"}`);
}

// The count for every answer in one table, for each place: { ne: { 0: total, 1: n, ... }, ..., eAndW: ... }.
const cache = new Map();
async function table(name) {
  if (!cache.has(name)) {
    const [dataset, dim] = TABLES[name];
    const codes = [...new Set(CATEGORIES.flatMap((c) => c.groups).filter((g) => g[2] === name).flatMap((g) => g[3]))];
    const url = `${BASE}/${dataset}.data.csv?date=latest&geography=TYPE480,TYPE499&${dim}=0,${codes.join(",")}&measures=20100&select=geography_name,${dim},obs_value`;
    const rows = (await getCsv(url)).trim().split(/\r?\n/).slice(1);
    const byPlace = {};
    for (const line of rows) {
      const m = /^"([^"]+)","(\d+)",(\d+)$/.exec(line.trim());
      if (!m) continue;
      const place = m[1].toLowerCase();
      const key = PLACES[place] ?? (place === "england" ? "england" : null);
      if (!key) continue;
      (byPlace[key] ??= {})[Number(m[2])] = Number(m[3]);
    }
    cache.set(name, byPlace);
    await new Promise((r) => setTimeout(r, 300));
  }
  return cache.get(name);
}

const BROWSER = { "User-Agent": `Mozilla/5.0 ${HEADERS["User-Agent"]}` };
const ukCache = new Map();

// A tiny CSV reader for the quoted tables NISRA serves.
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
  return rows.filter((r) => r.length > 3);
}

// One UK-wide table as objects: { Country, "<column>": value, ..., VALUE }.
async function ukTable(code) {
  if (!ukCache.has(code)) {
    const url = `https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadDataset/${code}/CSV/1.0/en`;
    let text;
    for (let i = 0; i < 3 && !text; i++) {
      try {
        const res = await fetch(url, { headers: BROWSER });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        text = (await res.text()).replace(/^\uFEFF/, "");
        if (!text.startsWith('"STATISTIC"')) throw new Error("not a data file");
      } catch (e) {
        text = undefined;
        if (i === 2) throw new Error(`${code}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
    }
    const [head, ...rows] = parseCsv(text);
    ukCache.set(code, rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]]))).filter((r) => r.VALUE !== ""));
  }
  return ukCache.get(code);
}

// A group's share for Scotland, Northern Ireland and the whole UK, from a UK-wide table.
async function nationShares(spec) {
  const rows = await ukTable(spec.t);
  const out = {};
  // The age bands in the table's own labels do not match its figures (they run in 18 five-year bands, 0-4 up to 85 and over,
  // with two empty codes after), so ages are read by band number. England and Wales is worked out the same way, as a check.
  for (const country of ["Scotland", "Northern Ireland", "United Kingdom", "England and Wales"]) {
    const mine = rows.filter((r) => r.Country === country);
    const total = mine.reduce((t, r) => t + Number(r.VALUE), 0);
    const part = mine.filter((r) => (spec.pick ? spec.pick.includes(r[spec.col]) : !spec.not.includes(r[spec.col]))).reduce((t, r) => t + Number(r.VALUE), 0);
    // Some tables leave a country out (Scotland's ethnic groups by age were not published): fill it in elsewhere.
    if (!total) continue;
    out[UK_TABLE_KEYS[country] ?? (country === "England and Wales" ? "ew" : "uk")] = round1((part / total) * 100);
  }
  return out;
}

// Scotland's Census 2022 ethnic groups (National Records of Scotland), read from the chart-data workbook linked on the
// release page, whose address changes, so it is found from the page each time.
async function scotlandCensus() {
  const page = await (await fetch("https://www.scotlandscensus.gov.uk/documents/scotlands-census-2022-ethnic-group-national-identity-language-and-religion-chart-data/", { headers: BROWSER })).text();
  const href = /href="([^"]+\.xlsx)"/i.exec(page)?.[1];
  if (!href) throw new Error("Scotland ethnic groups: workbook link not found");
  const res = await fetch(new URL(href, "https://www.scotlandscensus.gov.uk").href, { headers: BROWSER });
  if (!res.ok) throw new Error(`Scotland ethnic groups: HTTP ${res.status}`);
  const book = readXlsx(Buffer.from(await res.arrayBuffer()));
  const rows5 = (book["Figure 5"] ?? []).filter((r) => r?.[0] === 2022);
  const minority = (book["Figure 4"] ?? []).find((r) => r?.[0] === 2022)?.[1];
  if (rows5.length < 12 || typeof minority !== "number") throw new Error("Scotland ethnic groups: unexpected layout");
  const pct = (...starts) => starts.reduce((t, start) => {
    const row = rows5.find((r) => String(r[1]).trim().startsWith(start));
    if (!row) throw new Error(`Scotland ethnic groups: no row for ${start}`);
    return t + Number(row[2]);
  }, 0);
  const asian = pct("Pakistani", "Indian", "Bangladeshi", "Chinese", "Other Asian");
  const black = pct("African", "Caribbean or Black");
  const mixed = pct("Mixed");
  const other = pct("Arab", "Other ethnic group");
  const rows2 = (book["Figure 2"] ?? []).filter((r) => r?.[0] === 2022);
  const rel = (name) => {
    const row = rows2.find((r) => r[1] === name);
    if (!row) throw new Error(`Scotland religion: no row for ${name}`);
    return Number(row[2]);
  };
  const religion = {
    "no-religion": rel("No religion"),
    christian: rel("Church of Scotland") + rel("Roman Catholic") + rel("Other Christian"),
    muslim: rel("Muslim"), hindu: rel("Hindu"), sikh: rel("Sikh"), jewish: rel("Jewish"), buddhist: rel("Buddhist"),
    "other-religion": rel("Sikh") + rel("Jewish") + rel("Pagan") + rel("Another religion"),
  };
  return { religion, ethnic: {
    "not-white-british": minority,
    "white-british": 100 - minority,
    "not-white": asian + black + mixed + other,
    "white-other": pct("Irish", "Polish", "Gypsy", "Roma", "Showman", "Other White"),
    asian, black, mixed, "arab-other": other,
    indian: pct("Indian"), pakistani: pct("Pakistani"), bangladeshi: pct("Bangladeshi"), chinese: pct("Chinese"), "other-asian": pct("Other Asian"), african: pct("African"),
  } };
}

// Northern Ireland's ethnic groups in more detail than the UK-wide table has.
const NI_ETHNIC = {
  indian: ["Indian"], pakistani: ["Pakistani"], chinese: ["Chinese"], african: ["Black African"],
  "other-asian": ["Filipino", "Other Asian"], "arab-other": ["Arab", "Other ethnicities"],
};

const round1 = (x) => Math.round(x * 10) / 10;

async function main() {
  const scot = await scotlandCensus();
  const scotEth = scot.ethnic;
  const niEth = await ukTable("C21005NI");
  const niTotal = niEth.reduce((t, r) => t + Number(r.VALUE), 0);
  // People counted in each country, to weight the whole-UK figure.
  const popScot = (await ukTable("UK05")).filter((r) => r.Country === "Scotland").reduce((t, r) => t + Number(r.VALUE), 0);
  const regionKeys = [...new Set(Object.values(PLACES))];
  const out = {
    fetchedAt: new Date().toISOString(),
    note: "Census 2021 for England, Wales and Northern Ireland, and Scotland's Census 2022. Scotland and Northern Ireland are filled in only where a UK-wide table on matching categories exists.",
    source: SOURCE,
    categories: [],
  };
  for (const cat of CATEGORIES) {
    const groups = [];
    for (const [id, label, tableName, codes, nations] of cat.groups) {
      const data = await table(tableName);
      const values = {};
      for (const key of regionKeys) {
        const row = data[key];
        if (!row?.[0]) continue;
        values[key] = round1((codes.reduce((sum, c) => sum + (row[c] ?? 0), 0) / row[0]) * 100);
      }
      // England and Wales together: add the two countries' counts.
      const e = data.england;
      const w = data.wales;
      const ew = e && w ? (codes.reduce((sum, c) => sum + (e[c] ?? 0) + (w[c] ?? 0), 0) / (e[0] + w[0])) * 100 : null;
      if (Object.keys(values).length < 10 || ew === null) throw new Error(`${cat.id}/${id}: missing places (${Object.keys(values).join(",")})`);
      const group = { id, label, values, all: round1(ew) };
      if (nations) {
        const n = await nationShares(nations);
        // The same question, answered from the UK-wide table, must agree with the census figures for England and Wales.
        if (n.ew !== undefined && Math.abs(n.ew - group.all) > 0.7) throw new Error(`${cat.id}/${id}: UK table says ${n.ew}% for England and Wales, the census says ${group.all}%`);
        values.scotland = n.scotland;
        values.ni = n.ni;
        group.uk = n.uk;
      }
      if (cat.id === "ethnicity" || cat.id === "religion") {
        if (cat.id === "ethnicity") {
          const ni = NI_ETHNIC[id] ? (niEth.filter((r) => NI_ETHNIC[id].includes(r["Ethnic group"])).reduce((t, r) => t + Number(r.VALUE), 0) / niTotal) * 100 : values.ni;
          if (ni !== undefined) values.ni = round1(ni);
        }
        // Scotland's own published figures take the place of the UK-wide table's, which count people with no stated religion differently.
        const own = cat.id === "ethnicity" ? scotEth[id] : scot.religion[id];
        if (own !== undefined) values.scotland = round1(own);
        // The whole UK is worked out here, weighting each country by its people, when all three are known.
        if (values.scotland !== undefined && values.ni !== undefined) {
          const ewPeople = (await table("eth")).england[0] + (await table("eth")).wales[0];
          group.uk = round1((group.all * ewPeople + values.scotland * popScot + values.ni * niTotal) / (ewPeople + popScot + niTotal));
        } else delete group.uk;
      }
      groups.push(group);
    }
    out.categories.push({ id: cat.id, title: cat.title, of: cat.of, blurb: cat.blurb, groups });
    console.log(`${cat.id}: ${groups.length} groups`);
  }
  fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  console.log(`Saved ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
