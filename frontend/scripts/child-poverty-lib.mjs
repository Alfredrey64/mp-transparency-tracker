// Reading the Department for Work and Pensions' "Children in low income families: local area statistics" (annual, United Kingdom) into the file behind the child poverty card on Your area.
// The measure used is the one the card names: children aged under 16 in relative low income families, after housing costs (below 60% of the middle household income of that year,
// after rent or mortgage), as a share of all children that age. Figures for the latest two financial years are in each release; the Department marks them provisional.
import { isCode, num, headerRow } from "./area-kit.mjs";

const clean = (c) => String(c ?? "").replace(/\s+/g, " ").trim();

// One sheet (local authorities or Westminster constituencies): number and percentage of children for each of the two years.
export function readChildPoverty(rows) {
  const h = headerRow(rows, (c) => /^Area Code$/i.test(c));
  if (h < 0) return null;
  const head = rows[h].map(clean);
  const years = [...new Set(head.map((c) => /^Number of children FYE (\d{4})/i.exec(c)?.[1]).filter(Boolean))].map(Number).sort();
  if (years.length < 2) return null;
  const code = head.findIndex((c) => /^Area Code$/i.test(c));
  const at = (re) => head.findIndex((c) => re.test(c));
  const cols = years.map((y) => ({ y, n: at(new RegExp(`^Number of children FYE ${y}`, "i")), p: at(new RegExp(`^Percentage of children FYE ${y}`, "i")) }));
  if (cols.some((c) => c.n < 0 || c.p < 0)) return null;
  const out = new Map();
  for (const r of rows.slice(h + 1)) {
    const k = String(r[code] ?? "").trim();
    if (!isCode(k)) continue;
    out.set(k, { n: clean(r[0]), c: cols.map((c) => num(r[c.n])), p: cols.map((c) => { const v = num(r[c.p]); return v == null ? null : Math.round(v * 1000) / 10; }) });
  }
  return { years: cols.map((c) => c.y), rows: out };
}

// Both sheets as one object keyed by code. The United Kingdom row (K02000001) gives the comparison figure.
export function buildChildPoverty(la, con) {
  if (!la || !con || la.rows.size < 300 || con.rows.size < 600 || !la.rows.has("K02000001")) return null;
  if (la.years.join() !== con.years.join()) return null;
  const obj = (m) => Object.fromEntries([...m].map(([k, v]) => [k, { n: v.n, c: v.c, p: v.p }]));
  return { years: la.years, uk: la.rows.get("K02000001").p, la: obj(la.rows), con: obj(con.rows) };
}
