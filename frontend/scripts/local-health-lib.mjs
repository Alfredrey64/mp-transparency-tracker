// Reading the Office for Health Improvement and Disparities' Fingertips data (its public API) into the file behind the local health card on Your area.
//
// Five measures, each one series chosen so the numbers are comparable between areas:
//  - life expectancy at birth, men and women, three-year figures (ONS), and the figure ten years earlier;
//  - healthy life expectancy at birth, men and women, three-year figures (ONS) - published for counties and unitary authorities only, so a district shows its county's;
//  - adults who smoke (Annual Population Survey, aged 18 and over), adults overweight or obese (Active Lives survey, 18+), adults physically inactive (Active Lives, 19+) - one year each,
//    with the 95% confidence range, because these come from surveys and small areas have wide ranges.
// Only the newest period of each series is kept, and only rows of exactly that period, so every area on the card is for the same years.
import { parseCsv } from "./build-council-complaints.mjs";

// key -> which rows. `types` are Fingertips area types (501 districts and unitary authorities, 502 counties and unitary authorities, both from April 2023); `prev` is how many years back to also keep.
export const SPECS = [
  { key: "le", id: 90366, types: [501, 502], range: "3y", age: "All ages", sexes: ["Male", "Female"], prev: 10 },
  { key: "hle", id: 90362, types: [502], range: "3y", age: "All ages", sexes: ["Male", "Female"] },
  { key: "smoke", id: 92443, types: [501, 502], range: "1y", age: "18+ yrs", sexes: ["Persons"] },
  { key: "over", id: 93088, types: [501, 502], range: "1y", age: "18+ yrs", sexes: ["Persons"] },
  { key: "inactive", id: 93015, types: [501, 502], range: "1y", age: "19+ yrs", sexes: ["Persons"] },
];

export function csvRows(text) {
  const grid = parseCsv(text.replace(/^﻿/, ""));
  const head = grid[0] ?? [];
  return grid.slice(1).filter((r) => r.length > 10).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const number = (s) => (s === "" || s == null || !Number.isFinite(Number(s)) ? null : Number(s));

// The rows of one series: no breakdown category, the chosen age and period length, the chosen sex.
const series = (rows, spec, sex) => rows.filter((r) => !r["Category Type"] && r.Sex === sex && r.Age === spec.age && r["Time period range"] === spec.range && number(r.Value) != null);

// Newest period of a series (or the one `years` years before it) as { period, byArea }, where byArea maps an area code to { n, v, lo, hi }.
export function pick(rows, spec, sex, years = 0) {
  const s = series(rows, spec, sex);
  if (!s.length) return null;
  const sortable = (r) => Number(r["Time period Sortable"]);
  const newest = Math.max(...s.map(sortable));
  const want = newest - years * 10000;
  const chosen = s.filter((r) => sortable(r) === want);
  if (!chosen.length) return null;
  const byArea = new Map();
  for (const r of chosen) byArea.set(r["Area Code"], { n: r["Area Name"], v: number(r.Value), lo: number(r["Lower CI 95.0 limit"]), hi: number(r["Upper CI 95.0 limit"]) });
  return { period: chosen[0]["Time period"], byArea };
}

const round = (v, d = 1) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

// Everything the card needs, keyed by area code. `files` maps a spec key to an array of CSV texts (one per area type).
// Two-sex series are stored as [men, women]; one-series measures as [value, low, high].
export function buildLocalHealth(files) {
  const areas = {};
  const periods = {};
  for (const spec of SPECS) {
    const rows = (files[spec.key] ?? []).flatMap(csvRows);
    const two = spec.sexes.length > 1;
    for (const [si, sex] of spec.sexes.entries()) {
      const now = pick(rows, spec, sex);
      if (!now) continue;
      periods[spec.key] = now.period;
      const before = spec.prev ? pick(rows, spec, sex, spec.prev) : null;
      if (before) periods[`${spec.key}Before`] = before.period;
      for (const [code, a] of now.byArea) {
        const area = (areas[code] ??= { n: a.n });
        if (two) { area[spec.key] ??= [null, null]; area[spec.key][si] = round(a.v); } else area[spec.key] = [round(a.v, 2), round(a.lo, 2), round(a.hi, 2)];
        const b = before?.byArea.get(code);
        if (b) { area[`${spec.key}Before`] ??= [null, null]; area[`${spec.key}Before`][si] = round(b.v); }
      }
    }
  }
  const england = areas.E92000001 ?? null;
  delete areas.E92000001;
  return { periods, england, areas };
}
