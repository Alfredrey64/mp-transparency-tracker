// Reading two GOV.UK live tables into the file behind the "New homes" card on Your area: Table 122 (net additional dwellings by local authority district, a year at a time since 2001-02)
// and Table 100 (the number of dwellings in each district on 31 March, the newest year's sheet). "Net additional" means homes built, converted or created by a change of use,
// minus homes demolished or lost, so a council that knocks down more than it builds has a negative figure. A district a year has no figure for ([x]) is kept as null, never as zero.
import { isCode, num, headerRow } from "./area-kit.mjs";

const clean = (c) => String(c ?? "").replace(/\s+/g, " ").trim();
const YEARS_SHOWN = 15; // the card draws the last fifteen financial years

// "2023-24 [r] [note 17]" -> "2023-24"
export const yearOf = (h) => (/^(\d{4}-\d{2})\b/.exec(clean(h)) ?? [])[1] ?? null;

// Table 122 -> { years: ["2010-11", ...], rows: Map(code -> { n, y: [..number|null] }) } for the last YEARS_SHOWN years, with England under its own code.
export function readSupply(rows) {
  const h = headerRow(rows, (c) => /^Current ONS code$/i.test(c));
  if (h < 0) return null;
  const head = rows[h].map(clean);
  const codeCol = head.findIndex((c) => /^Current ONS code$/i.test(c));
  const nameCol = head.findIndex((c) => /^Authority data$/i.test(c));
  const yearCols = head.map((c, i) => [yearOf(c), i]).filter(([y]) => y);
  if (codeCol < 0 || nameCol < 0 || yearCols.length < YEARS_SHOWN) return null;
  const shown = yearCols.slice(-YEARS_SHOWN);
  const out = new Map();
  for (const r of rows.slice(h + 1)) {
    const code = clean(r[codeCol]);
    if (!isCode(code)) continue;
    out.set(code, { n: clean(r[nameCol]), y: shown.map(([, i]) => num(r[i])) });
  }
  return { years: shown.map(([y]) => y), rows: out };
}

// Table 100's newest sheet -> Map(code -> total dwellings), England included.
export function readStock(rows) {
  const h = headerRow(rows, (c) => /^(new |current )?ONS code$/i.test(c));
  if (h < 0) return null;
  const head = rows[h].map(clean);
  const codeCol = head.findIndex((c) => /^(new |current )?ONS code$/i.test(c));
  const totalCol = head.findIndex((c) => /^Total$/i.test(c));
  if (codeCol < 0 || totalCol < 0) return null;
  const out = new Map();
  for (const r of rows.slice(h + 1)) {
    const code = clean(r[codeCol]);
    const total = num(r[totalCol]);
    if (isCode(code) && total != null && total > 0) out.set(code, Math.round(total));
  }
  return out;
}

const r1 = (v) => Math.round(v * 10) / 10;

// Joins the two. `rate` is the latest year's net additions for every 1,000 homes there are now (31 March of the stock year), so councils of different sizes can be set side by side.
export function buildSupply(supply, stock, { stockYear }) {
  const ENGLAND = "E92000001";
  if (!supply || !stock || supply.rows.size < 250 || !supply.rows.get(ENGLAND) || !stock.get(ENGLAND)) return null;
  const areas = {};
  let withLatest = 0;
  for (const [code, s] of supply.rows) {
    if (code === ENGLAND || !/^E0[6789]/.test(code)) continue;
    const dwellings = stock.get(code) ?? null;
    if (!dwellings) continue; // a council that no longer exists (merged or abolished) has no homes counted in the newest stock table
    if (s.y.at(-1) != null) withLatest += 1;
    areas[code] = { n: s.n, y: s.y, d: dwellings };
  }
  const e = supply.rows.get(ENGLAND);
  const dE = stock.get(ENGLAND);
  const england = { y: e.y, d: dE, rate: e.y.at(-1) == null ? null : r1((e.y.at(-1) / dE) * 1000) };
  return { years: supply.years, stockYear, withLatest, areas, england };
}
