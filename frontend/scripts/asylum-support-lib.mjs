// Reading the Home Office's "Asylum seekers in receipt of Home Office support by local authority" (table Asy_D11, quarterly) into the file behind the asylum support card on Your area.
//
// What the figures are, and what changed over time (these are the Home Office's own notes, and the card says so):
//  - people (main applicants and dependants) in receipt of support on the last day of the quarter, not everyone supported during it;
//  - unaccompanied asylum-seeking children, who are supported by councils, are not included;
//  - "subsistence only" (cash, no accommodation) has no local authority figures from 31 December 2023 to 31 December 2024, so the trend here counts people in Home Office accommodation only;
//  - hotel and other contingency accommodation are shown separately from dispersal accommodation (which, before 31 March 2023, also holds everyone on section 4 support).
import { isCode } from "./area-kit.mjs";

const KIND = {
  "dispersal accommodation": "dispersal",
  "contingency accommodation - hotel": "hotel",
  "contingency accommodation - other": "contingency",
  "initial accommodation": "initial",
  "other accommodation": "other",
  "n/a - section 98 (pre-2023)": "other",
  "subsistence only": "subsistence",
};
export const HOUSED = ["dispersal", "hotel", "contingency", "initial", "other"];
const MONTH = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
export const dateOf = (s) => {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(String(s).trim());
  return m && m[2] in MONTH ? Date.UTC(Number(m[3]), MONTH[m[2]], Number(m[1])) : NaN;
};

// rows: the data sheet. Returns { asAt, quarters, areas: { code: { n, t, now } }, uk: { t, now } } where `t` is people in accommodation at the end of each of the last `keep` quarters
// (oldest first) and `now` splits the latest quarter by kind (including subsistence only). Returns null if the sheet is not the one expected.
export function buildAsylum(rows, keep = 8) {
  const head = rows.findIndex((r) => /^Date \(as at/i.test(String(r[0] ?? "")));
  if (head < 0) return null;
  const data = rows.slice(head + 1).filter((r) => isCode(r[4]) && typeof r[6] === "number" && Number.isFinite(dateOf(r[0])) && KIND[String(r[5]).trim().toLowerCase()]);
  const quarters = [...new Set(data.map((r) => String(r[0]).trim()))].sort((a, b) => dateOf(a) - dateOf(b)).slice(-keep);
  if (quarters.length < 2) return null;
  const at = new Map(quarters.map((q, i) => [q, i]));
  const last = quarters.length - 1;
  const blank = () => ({ t: Array(quarters.length).fill(0), now: {} });
  const areas = {};
  const uk = blank();
  for (const r of data) {
    const i = at.get(String(r[0]).trim());
    if (i === undefined) continue;
    const kind = KIND[String(r[5]).trim().toLowerCase()];
    const code = String(r[4]).trim();
    const a = (areas[code] ??= { n: String(r[3]).trim(), ...blank() });
    for (const target of [a, uk]) {
      if (kind !== "subsistence") target.t[i] += r[6];
      if (i === last) target.now[kind] = (target.now[kind] ?? 0) + r[6];
    }
  }
  return { asAt: quarters[last], quarters, areas, uk };
}
