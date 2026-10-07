// Downloads Census 2021 breakdowns of the population for the regions of England and for Wales
// (ethnic group, religion, where people were born, age, homes, qualifications, class, health) from
// Nomis (the ONS's website for labour market and census figures), and saves one small file,
// frontend/src/data/regionalProfile.json, for the Population page's "Who lives where" explorer.
//
// The 2021 Census is a one-off, so this does not need to run every day: run it by hand if a category
// is added below. (Pay by region is a yearly survey and is fetched with the other series by
// fetch-ons.js.) Scotland and Northern Ireland counted their people in separate censuses with
// different questions, so they are left out and the page says so.
//
// Contains public sector information licensed under the Open Government Licence v3.0.

import fs from "node:fs";
import path from "node:path";
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

const CATEGORIES = [
  {
    id: "ethnicity", title: "Ethnic group", of: "of residents",
    blurb: "The ethnic group each person said they belong to, in the 2021 Census. It is how people describe themselves, so it is about identity and family background, not nationality.",
    groups: [
      ["not-white-british", "Any group other than White British", "eth", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]],
      ["white-british", "White British", "eth", [1]],
      ["white-other", "Other White (including Irish and Roma)", "eth", [2, 3, 4, 5]],
      ["indian", "Indian", "eth", [10]],
      ["pakistani", "Pakistani", "eth", [11]],
      ["bangladeshi", "Bangladeshi", "eth", [12]],
      ["chinese", "Chinese", "eth", [13]],
      ["other-asian", "Other Asian", "eth", [14]],
      ["african", "Black African", "eth", [16]],
      ["caribbean", "Black Caribbean", "eth", [15]],
      ["mixed", "Mixed or multiple groups", "eth", [6, 7, 8, 9]],
      ["arab-other", "Arab or another group", "eth", [18, 19]],
    ],
  },
  {
    id: "religion", title: "Religion", of: "of residents",
    blurb: "The religion people said they have, if any. The question was voluntary, so a small share did not answer.",
    groups: [
      ["no-religion", "No religion", "religion", [1]],
      ["christian", "Christian", "religion", [2]],
      ["muslim", "Muslim", "religion", [6]],
      ["hindu", "Hindu", "religion", [4]],
      ["sikh", "Sikh", "religion", [7]],
      ["jewish", "Jewish", "religion", [5]],
      ["buddhist", "Buddhist", "religion", [3]],
      ["other-religion", "Another religion", "religion", [8]],
    ],
  },
  {
    id: "birth", title: "Where people were born", of: "of residents",
    blurb: "The country each person was born in. It says nothing about whether they are British citizens: many people born abroad are.",
    groups: [
      ["born-abroad", "Born outside the UK", "birth", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
      ["born-eu", "Born in the EU", "birth", [2, 3, 4, 5]],
      ["born-asia", "Born in the Middle East or Asia", "birth", [8]],
      ["born-africa", "Born in Africa", "birth", [7]],
      ["born-americas", "Born in the Americas or Caribbean", "birth", [9]],
    ],
  },
  {
    id: "age", title: "Age", of: "of residents",
    blurb: "How old people were on Census day in 2021. Younger people cluster in big cities, older people in coastal and rural areas.",
    groups: [
      ["under-15", "Under 15", "age", [1, 2, 3]],
      ["15-24", "15 to 24", "age", [4, 5]],
      ["25-44", "25 to 44", "age", [6, 7, 8, 9]],
      ["45-64", "45 to 64", "age", [10, 11, 12, 13]],
      ["65-plus", "65 and over", "age", [14, 15, 16, 17, 18]],
      ["85-plus", "85 and over", "age", [18]],
    ],
  },
  {
    id: "homes", title: "Homes and households", of: "of households",
    blurb: "How households live: who owns, who rents, how crowded homes are, and who has a car.",
    groups: [
      ["own-outright", "Own their home outright", "tenure", [1]],
      ["own-mortgage", "Own with a mortgage or shared ownership", "tenure", [2, 3]],
      ["social-rent", "Rent from a council or housing association", "tenure", [4, 5]],
      ["private-rent", "Rent privately", "tenure", [6, 7]],
      ["overcrowded", "Live in an overcrowded home", "bedrooms", [4, 5]],
      ["no-car", "Have no car or van", "cars", [1]],
    ],
  },
  {
    id: "education", title: "Qualifications", of: "of people aged 16 and over",
    blurb: "The highest qualification each person has. Level 4 and above means a degree, higher national diploma or similar.",
    groups: [
      ["degree", "Degree level or above", "qual", [6]],
      ["no-qualifications", "No qualifications", "qual", [1]],
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
      ["very-good-health", "Very good health", "health", [1]],
      ["bad-health", "Bad or very bad health", "health", [4, 5]],
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

const round1 = (x) => Math.round(x * 10) / 10;

async function main() {
  const regionKeys = [...new Set(Object.values(PLACES))];
  const out = {
    fetchedAt: new Date().toISOString(),
    note: "Census 2021, England and Wales only. Scotland and Northern Ireland ran their own censuses with different questions.",
    source: SOURCE,
    categories: [],
  };
  for (const cat of CATEGORIES) {
    const groups = [];
    for (const [id, label, tableName, codes] of cat.groups) {
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
      groups.push({ id, label, values, all: round1(ew) });
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
