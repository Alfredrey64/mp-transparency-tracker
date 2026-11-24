// Reading Defra's "Local authority collected waste management" tables into the file behind the "Waste and recycling" card on Your area. Table 3 of the local authority workbook
// gives, for every council that collects or disposes of household waste in England and every year since 2010-11: the household waste left over per household (kilograms, not
// recycled), the share of household waste sent for reuse, recycling or composting, and the household waste collected per person. A figure the table leaves blank ("-") is
// kept as null, never as zero. England's own figures are the table's "Total England" row (the region column says "Total England").
import { headerRow, num } from "./area-kit.mjs";

const clean = (c) => String(c ?? "").replace(/\s+/g, " ").trim();
const YEARS_SHOWN = 11; // the card draws the last eleven financial years (ten years of change)
const r1 = (v) => Math.round(v * 10) / 10;

export const yearLabel = (h) => (/^(\d{4})-(\d{2})$/.test(clean(h)) ? clean(h) : null);

// Table 3 -> { years: ["2014-15", ...], areas: { code: { n, t, p, k, c } }, england: { p, k, c } }.
//   p: % of household waste sent for reuse, recycling or composting   k: kg of household waste not recycled, per household   c: kg of household waste collected per person
// Only councils that collect household waste themselves ("Collection" and "Unitary") are kept: a county council that only disposes of it ("Disposal") is not what a postcode lands in.
export function readWaste(rows) {
  const h = headerRow(rows, (c) => /^ONS code$/i.test(c));
  if (h < 0) return null;
  const head = rows[h].map(clean);
  const col = (re) => head.findIndex((c) => re.test(c));
  const [yC, codeC, nameC, typeC, kC, pC, cC] = [col(/^Year$/i), col(/^ONS code$/i), col(/^Authority$/i), col(/^Authority type$/i), col(/^Residual household waste per household/i), col(/^Percentage of household waste sent for reuse/i), col(/^Collected household waste per person/i)];
  if ([yC, codeC, nameC, typeC, kC, pC, cC].some((i) => i < 0)) return null;
  const body = rows.slice(h + 1).filter((r) => r && yearLabel(r[yC]));
  const years = [...new Set(body.map((r) => yearLabel(r[yC])))].sort().slice(-YEARS_SHOWN);
  if (years.length < 3) return null;
  const slot = (y) => years.indexOf(y);
  const blank = () => years.map(() => null);
  const areas = {};
  let england = null;
  for (const r of body) {
    const y = slot(yearLabel(r[yC]));
    if (y < 0) continue;
    const p = num(r[pC]) == null ? null : r1(r[pC] * 100);
    const k = num(r[kC]) == null ? null : Math.round(r[kC]);
    const c = num(r[cC]) == null ? null : Math.round(r[cC]);
    // England's own row names England in the region column, with "Total" in the code and authority columns.
    if (r.some((c) => /^Total England$/i.test(clean(c)))) {
      england ??= { p: blank(), k: blank(), c: blank() };
      england.p[y] = p; england.k[y] = k; england.c[y] = c;
      continue;
    }
    const code = clean(r[codeC]);
    const type = clean(r[typeC]);
    if (!/^E0[6789]\d{6}$/.test(code) || !/^(Collection|Unitary)$/.test(type)) continue;
    areas[code] ??= { n: clean(r[nameC]), t: type, p: blank(), k: blank(), c: blank() };
    areas[code].n = clean(r[nameC]);
    areas[code].p[y] = p; areas[code].k[y] = k; areas[code].c[y] = c;
  }
  // A council with no recycling figure in the newest year (merged away, or did not report) is not shown.
  for (const code of Object.keys(areas)) if (areas[code].p.at(-1) == null) delete areas[code];
  return { years, areas, england };
}

// What the weekly check compares: the address of the newest local-authority workbook on Defra's page.
export function newestWorkbook(attachments) {
  const hits = (attachments ?? []).filter((a) => /local authority data annual results/i.test(a.title ?? "") && /\.ods$/i.test(a.url ?? ""));
  return hits[0] ?? null;
}
