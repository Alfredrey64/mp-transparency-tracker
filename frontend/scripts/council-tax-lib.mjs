// Reading the Ministry of Housing, Communities and Local Government's "Council Tax levels set by local authorities in England" (Tables 1 to 9) into the file the site uses,
// src/data/councilTaxByCouncil.json: for each billing authority the whole Band D bill for its area (county, police, fire and parish charges included), one number per year since 2010 to 11.
// Table 9 of each year's release gives that year's figure for every authority, so each year the file gains one number on the end of every row.

// How the file's names ("Barking & Dagenham", "Derby City") are matched to the release's ("Barking and Dagenham", "Derby"): the words that only say what kind of council it is are dropped.
export const normTaxName = (s) => String(s ?? "").toLowerCase().replace(/&/g, " and ").replace(/[’']/g, "")
  .replace(/\b(council|borough|district|city|metropolitan|london|royal|county|of|the|and|unitary|authority|ua|mbc|cc)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

// The year a release is for, from its cover sheet ("Tables 1 - 9 for 2026-27" is 2026).
export function releaseYear(coverRows) {
  const text = coverRows.flat().map((c) => String(c ?? "")).join(" ");
  const m = /for (\d{4})-(\d{2})\b/.exec(text);
  if (!m || Number(m[2]) !== (Number(m[1]) + 1) % 100) return null;
  return Number(m[1]);
}

// Table 9: one row per billing authority, with the ONS code, name, class and the Band D figure.
export function readTable9(rows) {
  const head = rows.findIndex((r) => String(r?.[1] ?? "").trim() === "ONS Code");
  if (head < 0) return [];
  const col = rows[head].map((c) => String(c ?? "").trim());
  const [code, name, cls, bandD] = ["ONS Code", "Authority", "Class", "Band D"].map((h) => col.indexOf(h));
  if ([code, name, cls, bandD].some((i) => i < 0)) return [];
  return rows.slice(head + 1)
    .filter((r) => /^[A-Z]\d{8}$/.test(String(r?.[code] ?? "")) && Number.isFinite(Number(r[bandD])) && Number(r[bandD]) > 0)
    .map((r) => ({ code: String(r[code]), name: String(r[name]).trim(), cls: String(r[cls]).trim(), bandD: Math.round(Number(r[bandD])) }));
}

// Puts one year's figures into the file. A year already in the file is overwritten (the Ministry revises its tables); the year after the last is added to the end of every row; any
// other year is refused, because a gap would shift every figure to the wrong year. A row is matched by ONS code, or by name the first time (which is also how the code gets added).
// Returns the new data and a count of what happened, or throws if too few authorities matched for the result to be believed.
export function applyYear(data, entries, year) {
  const last = data.from + data.rows[0][2].length - 1;
  if (year !== last && year !== last + 1) throw new Error(`The release is for ${year} but the file ends at ${last}, so it was left as it is`);
  const append = year === last + 1;
  const byCode = new Map(data.rows.filter((r) => r[3]).map((r) => [r[3], r]));
  const byName = new Map();
  for (const r of data.rows) if (!r[3]) byName.set(normTaxName(r[0]), r);
  const touched = new Set();
  let matched = 0, added = 0;
  for (const e of entries) {
    const row = byCode.get(e.code) ?? byName.get(normTaxName(e.name));
    if (row && !touched.has(row)) {
      touched.add(row);
      row[3] = e.code;
      if (append) row[2].push(e.bandD); else row[2][row[2].length - 1] = e.bandD;
      matched += 1;
    } else if (!row) {
      // An authority that is new to the list: a row of blanks for the years before it existed.
      const series = Array(last - data.from + 1).fill(null);
      if (append) series.push(e.bandD); else series[series.length - 1] = e.bandD;
      data.rows.push([e.name, e.cls, series, e.code]);
      touched.add(data.rows[data.rows.length - 1]);
      added += 1;
    }
  }
  if (matched < data.rows.length * 0.9 || entries.length < 250) throw new Error(`Only ${matched} of ${data.rows.length} authorities matched the release (${entries.length} in it), so the file was left as it is`);
  // An authority that is no longer in the release (merged or abolished) has no figure for the new year.
  let ended = 0;
  for (const r of data.rows) if (!touched.has(r)) { if (append) r[2].push(null); ended += 1; }
  data.rows.sort((a, b) => a[0].localeCompare(b[0]));
  return { data, matched, added, ended };
}
