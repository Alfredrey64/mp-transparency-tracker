// Builds src/data/trustData.json for the Trust in politics page.
//
//   node scripts/build-trust-data.mjs
//
// Source: the OECD Trust Survey (Government at a Glance, 2025 edition, "Trust, security and dignity" indicators), which asks about 60,000 people across OECD
// countries, in 2021 and 2023, how much they trust their government and other institutions. In the UK the ONS ran the survey. For each country and each
// of the two waves the file keeps the share who report high or moderately high trust, or (for the two questions about having a say) the share who are confident, for the measures the page shows, and for trust in the national
// government also the share who report low or no trust and the share neutral. The turnout, votes and seats on the page come from data the site already
// holds (src/data/electionsHistory.json and src/data/generalElection2024.js).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../src/data/trustData.json");
const UA = { "User-Agent": "Mozilla/5.0 simple-politics" };
const FLOW = "OECD.GOV.GIP,DSD_GOV_INT@DF_GOV_TDG_2025,1.1";
const MEASURES = { TRUST_NG: "government", TRUST_LE: "parliament", TRUST_CS: "civilService", TRUST_LG: "localGovernment", TRUST_CL: "courts", TRUST_PE_EXT: "voice", TRUST_PE_INT: "ownSay" };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const get = async (url, headers = {}) => {
  let last = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const r = await fetch(url, { headers: { ...UA, ...headers } });
    if (r.ok) return r.text();
    last = r.status;
    if (r.status < 500) break;
    await new Promise((x) => setTimeout(x, 1500 * (attempt + 1)));
  }
  throw new Error(`${url}: ${last}`);
};

// The OECD's own area codes include currencies and other things with the same letters, so the countries are named here.
const NAMES = { AUS: "Australia", AUT: "Austria", BEL: "Belgium", CAN: "Canada", CHE: "Switzerland", CHL: "Chile", COL: "Colombia", CRI: "Costa Rica", CZE: "Czechia", DEU: "Germany", DNK: "Denmark", ESP: "Spain", EST: "Estonia", FIN: "Finland", FRA: "France", GBR: "United Kingdom", GRC: "Greece", IRL: "Ireland", ISL: "Iceland", ITA: "Italy", JPN: "Japan", KOR: "South Korea", LUX: "Luxembourg", LVA: "Latvia", MEX: "Mexico", NLD: "Netherlands", NOR: "Norway", NZL: "New Zealand", PRT: "Portugal", SVK: "Slovakia", SVN: "Slovenia", SWE: "Sweden", OECD_REP: "OECD average" };

async function main() {
  const csv = await get(`https://sdmx.oecd.org/public/rest/data/${FLOW}/all?startPeriod=2020`, { Accept: "application/vnd.sdmx.data+csv;version=1.0.0" });
  const [head, ...lines] = csv.trim().split("\n");
  const cols = head.split(",");
  const ix = Object.fromEntries(cols.map((c, i) => [c, i]));
  const rows = {};
  for (const l of lines) {
    const c = l.split(",");
    const key = MEASURES[c[ix.MEASURE]];
    if (!key) continue;
    const area = c[ix.REF_AREA];
    const year = c[ix.TIME_PERIOD];
    const scale = c[ix.SCALE];
    const v = Number(c[ix.OBS_VALUE]);
    if (!Number.isFinite(v)) continue;
    // Trust in government has the whole spread; the other measures have only the share with high or moderately high trust (code HMH, or the single value).
    const slot = ((rows[area] ??= {})[year] ??= {});
    if (key === "government") (slot.government ??= {})[scale] = round(v, 1);
    else if (scale === "HMH" || scale === "CON" || scale === "_Z" || scale === "") slot[key] = round(v, 1);
  }
  const countries = {};
  for (const a of Object.keys(rows)) {
    if (!NAMES[a]) throw new Error(`Unnamed area ${a}`);
    countries[a] = { name: NAMES[a], years: rows[a] };
  }
  if (!countries.OECD_REP) throw new Error("No OECD average");
  if (!countries.GBR) throw new Error("No UK figures");
  const g = countries.GBR.years["2023"]?.government?.HMH;
  if (typeof g !== "number") throw new Error("No UK trust in government for 2023");
  const data = { built: new Date().toISOString().slice(0, 10), edition: "Government at a Glance 2025, OECD Trust Survey 2021 and 2023", countries };
  fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} kB), ${Object.keys(countries).length} places, UK trust in government ${g}% in 2023`);
}
main().catch((e) => { console.error(e); process.exit(1); });
