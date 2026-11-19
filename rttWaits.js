// rttWaits.js
//
// Turns NHS England's monthly "Incomplete pathways, by provider" workbook (Referral to Treatment waiting times) into one line for each NHS trust: how many people are waiting for
// planned hospital treatment, how many have waited under 18 weeks, and the long waits. Only each trust's "Total" row is used (all specialties together). Pure functions, no
// network, so they can be tested.

const num = (v) => { const x = Number(v); return Number.isFinite(x) ? x : null; };
const round = (v, d = 1) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

// The header row is the one naming "Provider Code"; the columns are found by name so a reordered workbook still reads correctly.
export function headerIndex(rows) {
  const at = rows.findIndex((r) => (r ?? []).includes("Provider Code"));
  if (at < 0) return null;
  const head = rows[at];
  const col = (re) => head.findIndex((h) => re.test(String(h ?? "")));
  const cols = {
    code: col(/^Provider Code$/), treatment: col(/^Treatment Function$/), total: col(/^Total number of incomplete pathways$/), within18: col(/^Total within 18 weeks$/),
    median: col(/median\) waiting time/i), p92: col(/^92nd percentile/i), w52: col(/^Total 52 plus weeks$/), w65: col(/^Total 65 plus weeks$/), name: col(/^Provider Name$/),
  };
  return Object.values(cols).some((c) => c < 0) ? null : { at, cols };
}

export function totalsFrom(rows) {
  const h = headerIndex(rows);
  if (!h) return {};
  const { cols } = h;
  const out = {};
  for (const r of rows.slice(h.at + 1)) {
    if (!r || String(r[cols.treatment] ?? "").trim() !== "Total") continue;
    const code = String(r[cols.code] ?? "").trim();
    const total = num(r[cols.total]);
    const within18 = num(r[cols.within18]);
    if (!code || !total || within18 == null) continue;
    out[code] = {
      total, within18,
      pct18: round((within18 / total) * 100),
      median: round(num(r[cols.median])),
      p92: round(num(r[cols.p92])),
      w52: num(r[cols.w52]) ?? 0,
      w65: num(r[cols.w65]) ?? 0,
    };
  }
  return out;
}

// England as the sum of the trusts that reported, so it is described as "the trusts that reported".
export function nationalFrom(trusts) {
  const list = Object.values(trusts);
  const total = list.reduce((s, t) => s + t.total, 0);
  const within18 = list.reduce((s, t) => s + t.within18, 0);
  return { trusts: list.length, total, within18, pct18: total ? round((within18 / total) * 100) : null, w52: list.reduce((s, t) => s + t.w52, 0) };
}

// "September 2026" from the "Period:" line in the workbook's cover block.
export function periodOf(rows) {
  const r = rows.find((x) => x && x[1] === "Period:");
  return r ? String(r[2] ?? "").trim() : "";
}
