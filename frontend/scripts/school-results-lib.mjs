// Turns the Department for Education's school-level results into the short figures added to each school's record on the map: GCSE results for secondary schools (Key stage 4
// performance tables) and the share of pupils reaching the expected standard in reading, writing and maths for primary schools (Key stage 2). Pure functions, no network, so
// they can be tested. Written for scripts/build-school-results.mjs.

// The DfE marks a figure it does not publish with a letter: z (not applicable), x (not available), c (suppressed because the group is small), u, low.
export const figure = (v) => {
  const t = String(v ?? "").trim();
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
};

// "202526" -> "2025/26"
export const yearLabel = (p) => (/^\d{6}$/.test(String(p)) ? `${String(p).slice(0, 4)}/${String(p).slice(4)}` : "");

// Rows with every breakdown set to Total are the school's whole cohort; the others are by sex, disadvantage and so on.
const whole = (r) => ["breakdown_topic", "breakdown", "sex", "disadvantage_status", "first_language", "prior_attainment", "mobility"].every((k) => r[k] === undefined || r[k] === "Total");

// Key stage 4: from the rows of the "Performance tables schools data" set, the newest year with a published Attainment 8 for each school (URN).
export function ks4From(rows) {
  const out = {};
  for (const r of rows) {
    if (!whole(r)) continue;
    const a8 = figure(r.attainment8_average);
    if (a8 == null) continue;
    const urn = String(r.school_urn ?? "").trim();
    if (!urn) continue;
    const have = out[urn];
    if (have && have.p >= r.time_period) continue;
    const pupils = figure(r.pupil_count);
    out[urn] = { p: r.time_period, a: a8, g5: figure(r.engmath_95_percent), g4: figure(r.engmath_94_percent), pr: figure(r.progress8_average), n: pupils, v: r.version === "Provisional" ? 1 : 0 };
  }
  return out;
}

// The England averages for the same measures, from the national rows of the "National characteristics summary data" set.
export function ks4National(rows) {
  const national = rows.filter((r) => r.geographic_level === "National" && r.breakdown_topic === "Total" && r.breakdown === "Total" && r.establishment_type_group === "All state-funded" && figure(r.attainment8_average) != null);
  national.sort((a, b) => String(b.time_period).localeCompare(String(a.time_period)));
  const r = national[0];
  return r ? { p: r.time_period, a: figure(r.attainment8_average), g5: figure(r.engmath_95_percent), g4: figure(r.engmath_94_percent) } : null;
}

// Key stage 2: one row of the school-level performance set, kept only for all pupils, reading, writing and maths combined. Returns [urn, record] or null.
export function ks2Row(r) {
  if (r.breakdown_topic !== "All pupils" || r.breakdown !== "Total" || r.subject !== "Reading, writing and maths") return null;
  const e = figure(r.expected_standard_pupil_percent);
  const urn = String(r.school_urn ?? "").trim();
  if (e == null || !urn) return null;
  return [urn, { p: r.time_period, e, h: figure(r.higher_standard_pupil_percent) }];
}

export function ks2National(rows) {
  const national = rows.filter((r) => r.geographic_level === "National" && r.subject === "Reading, writing and maths" && /^All state.funded$/i.test(r.establishment_type_group ?? "") && (r.sex ?? "Total") === "Total" && (r.priority_area_flag ?? "Not a priority") === "Not a priority" && figure(r.expected_standard_pupil_percent) != null);
  national.sort((a, b) => String(b.time_period).replace(/\D/g, "").localeCompare(String(a.time_period).replace(/\D/g, "")));
  const r = national[0];
  return r ? { p: String(r.time_period).replace(/\D/g, ""), e: figure(r.expected_standard_pupil_percent), h: figure(r.higher_standard_pupil_percent) } : null;
}

// Adds a school's results to its map record: secondary schools get `s4`, primary schools `s2`. Anything else, or a school with no published figure, is left as it was.
export function withResults(school, ks4, ks2) {
  const urn = String(school.u);
  const rec = { ...school };
  delete rec.s4;
  delete rec.s2;
  if (school.p === "S" && ks4[urn]) {
    const k = ks4[urn];
    rec.s4 = { y: yearLabel(k.p), a: k.a, ...(k.g5 != null && { g5: k.g5 }), ...(k.g4 != null && { g4: k.g4 }), ...(k.pr != null && { pr: k.pr }), ...(k.v && { v: 1 }) };
  }
  if (school.p === "P" && ks2[urn]) {
    const k = ks2[urn];
    rec.s2 = { y: yearLabel(k.p), e: k.e, ...(k.h != null && { h: k.h }) };
  }
  return rec;
}
