// Reading the Office for National Statistics' "Price Index of Private Rents" workbook into the file behind the "Private rents" card on Your area. Its one table gives, for every month
// since January 2015 and for every council in England and Wales (and the regions, the nations and the UK), the average monthly rent actually paid on privately rented homes, its change
// on a year earlier, and the average for one-, two-, three- and four-or-more-bedroom homes and for detached, semi-detached, terraced and flat homes. A cell the table marks as not
// available ([x]) or not applicable ([z]) is kept as null, never as zero. Scotland and Northern Ireland are given by "broad rental market area", not by council, so they are left out.
import { headerRow, num } from "./area-kit.mjs";

const clean = (c) => String(c ?? "").replace(/\s+/g, " ").trim();
const YEARS_SHOWN = 12; // the card draws the same month of each of the last twelve years (eleven years of change)
const r1 = (v) => Math.round(v * 10) / 10;

// A spreadsheet date (days since 1899-12-30) -> "2026-10".
export function monthOf(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400000));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

// The workbook links on the ONS dataset page (newest first, each under a folder named for its release date, such as /18november2026/) -> the newest one, as { url, released }.
export function newestWorkbook(html) {
  const found = [];
  for (const m of String(html ?? "").matchAll(/href="(\/file\?uri=[^"]*priceindexofprivaterentsukmonthlypricestatistics\/(\d{1,2})([a-z]+)(\d{4})\/[^"]*\.xlsx)"/gi)) {
    const month = MONTHS[m[3].toLowerCase()];
    if (!month) continue;
    found.push({ url: `https://www.ons.gov.uk${m[1].replace(/&amp;/g, "&")}`, released: `${m[4]}-${String(month).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}` });
  }
  return found.sort((a, b) => b.released.localeCompare(a.released))[0] ?? null;
}

const COLS = {
  rent: "Rental price", annual: "Annual change",
  bed: ["Rental price one bed", "Rental price two bed", "Rental price three bed", "Rental price four or more bed"],
  type: ["Rental price detached", "Rental price semidetached", "Rental price terraced", "Rental price flat maisonette"],
};

// "Table 1" -> { month, years: [2015, ...], areas: { code: { n, g, r, a, b, t, s } }, regions: { name: {...} }, england, wales }
//   r: average monthly rent in the latest month (£)   a: change on a year earlier (%)   b: rent by bedrooms (1, 2, 3, 4+)   t: rent by kind of home (detached, semi, terraced, flat)
//   s: the rent in the same month of each earlier year, oldest first, ending with the latest   g: the region (or "Wales") the council is in
export function readRents(rows) {
  const h = headerRow(rows, (c) => /^Time period$/i.test(c));
  if (h < 0) return null;
  const head = rows[h].map(clean);
  const at = (name) => head.indexOf(name);
  const [tC, codeC, nameC, regC, rentC, annC] = ["Time period", "Area code", "Area name", "Region or country name", COLS.rent, COLS.annual].map(at);
  const bedC = COLS.bed.map(at);
  const typeC = COLS.type.map(at);
  if ([tC, codeC, nameC, regC, rentC, annC, ...bedC, ...typeC].some((i) => i < 0)) return null;
  const body = rows.slice(h + 1).filter((r) => r && typeof r[tC] === "number");
  if (!body.length) return null;
  const newest = Math.max(...body.map((r) => r[tC]));
  const month = monthOf(newest);
  const [ly, lm] = month.split("-").map(Number);
  const wanted = Array.from({ length: YEARS_SHOWN }, (_, k) => `${ly - (YEARS_SHOWN - 1 - k)}-${String(lm).padStart(2, "0")}`);
  const byArea = new Map();
  for (const r of body) {
    const m = monthOf(r[tC]);
    if (!wanted.includes(m)) continue;
    const code = clean(r[codeC]);
    if (!byArea.has(code)) byArea.set(code, { n: clean(r[nameC]), g: clean(r[regC]), rows: new Map() });
    byArea.get(code).rows.set(m, r);
  }
  const build = (a) => {
    const last = a.rows.get(month);
    if (!last || num(last[rentC]) == null) return null;
    return {
      n: a.n, g: a.g,
      r: Math.round(last[rentC]),
      a: num(last[annC]) == null ? null : r1(last[annC]),
      b: bedC.map((i) => (num(last[i]) == null ? null : Math.round(last[i]))),
      t: typeC.map((i) => (num(last[i]) == null ? null : Math.round(last[i]))),
      s: wanted.map((m) => { const x = a.rows.get(m); return x && num(x[rentC]) != null ? Math.round(x[rentC]) : null; }),
    };
  };
  const areas = {};
  const regions = {};
  let england = null, wales = null;
  for (const [code, a] of byArea) {
    const v = build(a);
    if (!v) continue;
    if (/^(E0[6789]|W06)\d{6}$/.test(code)) areas[code] = v;
    else if (/^E12\d{6}$/.test(code)) regions[v.n] = v;
    else if (code === "E92000001") england = v;
    else if (code === "W92000004") wales = v;
  }
  return { month, years: wanted.map((m) => Number(m.slice(0, 4))), areas, regions, england, wales };
}
