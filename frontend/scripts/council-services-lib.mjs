// Turns two sets of official figures for every council in England into one small file keyed by the council's ONS code: how much of its roads the Department for Transport's
// surveys say should be considered for maintenance, and how many fly-tipping incidents the council reported to Defra. Pure functions, no network, so they can be tested.
// Written for scripts/build-council-services.mjs.

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// A road condition sheet (RDC0120 A, B and C roads, or RDC0130 unclassified): a header row naming "ONS Area Code" then one "FYE <year>" column for each financial year ending
// in that year, and a row for each authority. Cells that hold a note marker such as [x] are not numbers and are left out. Returns the year labels, the last `keep` values for
// each authority (newest last, null where there is none) and England's row.
export function roadSheet(rows, keep = 5) {
  const at = rows.findIndex((r) => (r ?? [])[0] === "ONS Area Code");
  if (at < 0) return null;
  const head = rows[at];
  const yearCols = head.map((h, i) => [/^FYE (\d{4})$/.exec(String(h ?? ""))?.[1], i]).filter(([y]) => y).map(([y, i]) => ({ year: Number(y), col: i }));
  if (!yearCols.length) return null;
  const use = yearCols.slice(-keep);
  const councils = {};
  let england = null;
  for (const r of rows.slice(at + 1)) {
    const code = String(r?.[0] ?? "").trim();
    if (!/^[EWSN]\d{8}$/.test(code)) continue;
    const series = use.map((y) => num(r[y.col]));
    if (code === "E92000001") england = series;
    else if (series.some((v) => v != null)) councils[code] = series;
  }
  return { years: use.map((y) => y.year), councils, england };
}

// Combines the three sheets: for each authority, [A roads, B and C roads, unclassified] each as a short series.
export function roadsFrom(a, bc, unc) {
  if (!a || !bc || !unc) return null;
  const years = a.years;
  const codes = new Set([...Object.keys(a.councils), ...Object.keys(bc.councils), ...Object.keys(unc.councils)]);
  const councils = {};
  for (const c of codes) councils[c] = { a: a.councils[c] ?? null, bc: bc.councils[c] ?? null, u: unc.councils[c] ?? null };
  return { years, england: { a: a.england, bc: bc.england, u: unc.england }, councils };
}

// The fly-tipping incidents sheet: a header row with "Year", "ONS Code" and "Total Incidents", a row for each authority and year. Returns the newest year, and for each authority
// its incidents that year and the year before.
export function flyTippingFrom(rows) {
  const at = rows.findIndex((r) => (r ?? [])[0] === "Year" && (r ?? []).includes("ONS Code"));
  if (at < 0) return null;
  const head = rows[at];
  const col = { year: head.indexOf("Year"), code: head.indexOf("ONS Code"), total: head.indexOf("Total Incidents") };
  if (col.total < 0) return null;
  const byYear = new Map();
  for (const r of rows.slice(at + 1)) {
    const year = String(r?.[col.year] ?? "").trim().replace("-", "/");
    const code = String(r?.[col.code] ?? "").trim();
    const total = num(r?.[col.total]);
    if (!/^\d{4}\/\d{2}$/.test(year) || !/^E\d{8}$/.test(code) || total == null) continue;
    if (!byYear.has(year)) byYear.set(year, {});
    byYear.get(year)[code] = total;
  }
  const years = [...byYear.keys()].sort();
  if (!years.length) return null;
  const latest = years[years.length - 1];
  const before = years[years.length - 2];
  const councils = {};
  for (const [code, total] of Object.entries(byYear.get(latest))) councils[code] = { t: total, p: before ? byYear.get(before)[code] ?? null : null };
  return { year: latest, before: before ?? null, councils, englandTotal: Object.values(byYear.get(latest)).reduce((s, v) => s + v, 0) };
}

// The road maintenance sheet (RDC0321, A roads, or B, C and unclassified roads together): for each highway authority the length of its network (km) and the share of that length
// that was strengthened, resurfaced or preserved (surface dressing and similar) in the year, then the total. A cell that holds a note marker is not a number and is left as null.
// Returns the year the sheet is for (the financial year ending), each authority as [km, strengthening %, resurfacing %, preservation %, total %], and England's average total,
// weighted by network length so a long network counts for more.
export function repairSheet(rows) {
  const at = rows.findIndex((r) => (r ?? [])[0] === "ONS Area Code");
  if (at < 0) return null;
  const head = (rows[at] ?? []).map((h) => String(h ?? "").replace(/\s*\[.*$/, "").trim());
  const col = { km: head.findIndex((h) => /^Network Length/i.test(h)), s: head.indexOf("Strengthening"), r: head.indexOf("Resurfacing"), p: head.indexOf("Preservation"), t: head.indexOf("Total") };
  if (Object.values(col).some((i) => i < 0)) return null;
  const year = Number(/Financial Year Ending (\d{4})/i.exec(String(rows[0]?.[0] ?? ""))?.[1]) || null;
  const councils = {};
  let km = 0, weighted = 0;
  for (const r of rows.slice(at + 1)) {
    const code = String(r?.[0] ?? "").trim();
    if (!/^E\d{8}$/.test(code)) continue;
    const row = [num(r[col.km]), num(r[col.s]), num(r[col.r]), num(r[col.p]), num(r[col.t])];
    if (row[0] == null || row[4] == null) continue;
    councils[code] = row;
    km += row[0];
    weighted += row[0] * row[4];
  }
  if (!Object.keys(councils).length) return null;
  return { year, councils, england: km ? Math.round((weighted / km) * 10) / 10 : null };
}

// Joins the two sheets: for each authority { a: [...] for A roads, o: [...] for B, C and unclassified roads }.
export function repairsFrom(a, other) {
  if (!a || !other) return null;
  const codes = new Set([...Object.keys(a.councils), ...Object.keys(other.councils)]);
  const councils = {};
  for (const c of codes) councils[c] = { a: a.councils[c] ?? null, o: other.councils[c] ?? null };
  return { year: a.year ?? other.year, england: { a: a.england, o: other.england }, councils };
}
