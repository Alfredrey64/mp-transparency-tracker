// housePrices.js — turns the UK House Price Index's full file (HM Land Registry with the ONS, Registers of Scotland and Land & Property Services Northern Ireland) into the small
// table the Your area page reads: for every council area, the average price in the latest month, the 12-month change, the price by kind of home, the latest sales count, and
// the price in the same month of each of the last ten years. Pure, so the rules can be tested without the file.

// One line of CSV into its fields. The fast path is a plain split; a line with quotes (a name such as "Bournemouth, Christchurch and Poole") is read character by character.
export function csvLine(line) {
  if (!line.includes('"')) return line.split(",");
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false; } else cur += c; }
    else if (c === '"') quoted = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// "01/09/2026" -> "2026-09"
export const monthOf = (d) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(d).trim()); return m ? `${m[3]}-${m[2]}` : null; };

// Councils (England districts and unitaries, London boroughs, Wales, Scotland, Northern Ireland) and the comparison areas (regions, the four nations, the UK).
const COUNCIL = /^(E06|E07|E08|E09|W06|S12|N09)/;
const COMPARE = /^(E12|E92|W92|S92|N92|K02)/;
const num = (v) => { const n = Number(v); return v === "" || v == null || !Number.isFinite(n) ? null : n; };

export function buildHousePrices(text, { years = 11 } = {}) {
  const lines = text.split(/\r?\n/);
  const head = csvLine(lines[0]);
  const col = Object.fromEntries(head.map((h, i) => [h, i]));
  for (const need of ["Date", "RegionName", "AreaCode", "AveragePrice", "12m%Change", "SalesVolume", "DetachedPrice", "SemiDetachedPrice", "TerracedPrice", "FlatPrice"]) {
    if (col[need] == null) throw new Error(`The house price file has no ${need} column`);
  }
  const byCode = new Map();
  let latest = "";
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = csvLine(lines[i]);
    const code = f[col.AreaCode];
    if (!COUNCIL.test(code) && !COMPARE.test(code)) continue;
    const ym = monthOf(f[col.Date]);
    if (!ym) continue;
    if (ym > latest) latest = ym;
    let a = byCode.get(code);
    if (!a) byCode.set(code, (a = { name: f[col.RegionName], months: new Map() }));
    a.months.set(ym, f);
  }
  if (!latest) throw new Error("The house price file had no usable rows");
  const [ly, lm] = latest.split("-").map(Number);
  const sameMonth = (back) => `${ly - back}-${String(lm).padStart(2, "0")}`;
  const areas = {};
  for (const [code, a] of byCode) {
    const row = a.months.get(latest);
    const price = num(row?.[col.AveragePrice]);
    if (price == null) continue;
    // Sales are counted late, so the newest month often has none: take the latest month that does.
    let sales = null; let salesMonth = null;
    for (const ym of [...a.months.keys()].sort().reverse().slice(0, 8)) {
      const s = num(a.months.get(ym)[col.SalesVolume]);
      if (s != null) { sales = s; salesMonth = ym; break; }
    }
    const history = Array.from({ length: years }, (_, k) => num(a.months.get(sameMonth(years - 1 - k))?.[col.AveragePrice]));
    areas[code] = {
      n: a.name, p: price, c: num(row[col["12m%Change"]]), s: sales, sm: salesMonth,
      t: { d: num(row[col.DetachedPrice]), s: num(row[col.SemiDetachedPrice]), t: num(row[col.TerracedPrice]), f: num(row[col.FlatPrice]) },
      h: history,
    };
  }
  return { month: latest, years: Array.from({ length: years }, (_, k) => ly - (years - 1 - k)), areas };
}
