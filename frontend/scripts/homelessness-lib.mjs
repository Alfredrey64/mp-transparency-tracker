// Reading the Ministry of Housing, Communities and Local Government's "Statutory homelessness: detailed local authority-level tables" (quarterly, England) into the file behind the
// homelessness card on Your area. Two tables are used: TA1 (households in temporary accommodation on the last day of the quarter) and A1 (households assessed as owed a homelessness duty
// during the quarter). A council that did not send its return has [x] in every cell; the card says so instead of showing a gap or a zero.
import { isCode, num, headerRow } from "./area-kit.mjs";

const clean = (c) => String(c ?? "").replace(/\s+/g, " ").trim();
const table = (rows) => {
  const h = headerRow(rows, (c) => /^Organisation Identification Code/i.test(c));
  return h < 0 ? null : { head: rows[h].map(clean), body: rows.slice(h + 1).filter((r) => isCode(r[0])) };
};

// TA1: total in temporary accommodation, per thousand households, with children, children, and in bed and breakfast hotels.
export function readTA1(rows) {
  const t = table(rows);
  if (!t) return null;
  const col = (re) => t.head.findIndex((h) => re.test(h));
  const c = { ta: col(/^Households in TA Total \[note/i), hh: col(/^Households in area/i), perK: col(/^Households in TA Total \(per thousand\)/i), kids: col(/^Households in TA with children Total/i), children: col(/^Children in TA Total/i), bnb: col(/^Households in B&Bs including shared annexes Total/i) };
  if (Object.values(c).some((i) => i < 0)) return null;
  const out = new Map();
  for (const r of t.body) out.set(String(r[0]).trim(), { n: clean(r[1]), ta: num(r[c.ta]), hh: num(r[c.hh]), perK: num(r[c.perK]), kids: num(r[c.kids]), children: num(r[c.children]), bnb: num(r[c.bnb]) });
  return out;
}

// A1: households assessed as owed a prevention or relief duty, and how many per thousand households were threatened with, or were, homeless.
export function readA1(rows) {
  const t = table(rows);
  if (!t) return null;
  const col = (re) => t.head.findIndex((h) => re.test(h));
  const c = { owed: col(/^Assessed as owed a duty Owed a prevention or relief duty Total/i), hh: col(/^Households in area/i), threat: col(/^Households assessed as threatened with homelessness \(per thousand\)/i), homeless: col(/^Households assessed as homeless \(per thousand\)/i) };
  if (Object.values(c).some((i) => i < 0)) return null;
  const out = new Map();
  for (const r of t.body) out.set(String(r[0]).trim(), { n: clean(r[1]), owed: num(r[c.owed]), hh: num(r[c.hh]), threat: num(r[c.threat]), homeless: num(r[c.homeless]) });
  return out;
}

const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);

// Joins the two tables by code. `owedK` is households owed a duty per thousand households, worked out here from the published counts.
export function buildHomelessness(ta, a1, { quarter, asAt }) {
  const ENGLAND = "E92000001"; // the table's own England row; the regions (E12...) are left out of the councils
  if (!ta || !a1 || ta.size < 250 || !ta.get(ENGLAND)) return null;
  const areas = {};
  let reported = 0;
  for (const [code, t] of ta) {
    if (code === ENGLAND || code.startsWith("E12")) continue;
    const a = a1.get(code);
    const owed = a?.owed ?? null;
    const hh = t.hh ?? a?.hh ?? null;
    const row = { n: t.n, ta: t.ta, perK: r2(t.perK), kids: t.kids, children: t.children, bnb: t.bnb, owed, owedK: owed != null && hh ? r2(owed / hh) : null, hh: hh == null ? null : r1(hh) };
    if (t.ta != null || owed != null) reported += 1;
    areas[code] = row;
  }
  const e = ta.get(ENGLAND);
  const ea = a1.get(ENGLAND);
  const england = { ta: e.ta, perK: r2(e.perK), kids: e.kids, children: e.children, bnb: e.bnb, owed: ea?.owed ?? null, owedK: ea?.owed != null && e.hh ? r2(ea.owed / e.hh) : null };
  return { quarter, asAt, reported, areas, england };
}
