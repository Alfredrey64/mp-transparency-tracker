// localEconomy.js
//
// Turns two Nomis (Office for National Statistics) tables into one record for each Westminster constituency, on the July 2024 boundaries: the claimant count (people claiming
// unemployment-related benefits) and median full-time pay for jobs located in the constituency. Pure functions, no network, so they can be tested.

const num = (v) => { const x = Number(v); return v !== "" && v != null && Number.isFinite(x) ? x : null; };

// A minimal reader for the quoted CSV that Nomis returns.
export function parseCsvText(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const s = String(text).replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) { if (ch === '"' && s[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') quoted = false; else field += ch; }
    else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && s[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows[0] ?? [];
  return rows.slice(1).filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Claimant count rows: GEOGRAPHY_CODE, GEOGRAPHY_NAME, DATE_NAME, MEASURE ("1" count, "2" share of residents aged 16 to 64), OBS_VALUE. Returns the two dates, the count and share
// for each place on each date.
export function claimantsFrom(rows) {
  const dates = [...new Set(rows.map((r) => r.DATE_NAME))];
  const monthKey = (d) => { const [m, y] = String(d).split(" "); return Number(y) * 12 + MONTHS.indexOf(m); };
  dates.sort((a, b) => monthKey(a) - monthKey(b));
  const now = dates[dates.length - 1];
  const before = dates.length > 1 ? dates[0] : null;
  const out = {};
  for (const r of rows) {
    const code = r.GEOGRAPHY_CODE;
    if (!code) continue;
    const slot = out[code] ?? (out[code] = { name: r.GEOGRAPHY_NAME });
    const key = r.DATE_NAME === now ? "now" : r.DATE_NAME === before ? "before" : null;
    if (!key) continue;
    slot[key] = { ...(slot[key] ?? {}), [r.MEASURE === "1" ? "count" : "rate"]: num(r.OBS_VALUE) };
  }
  return { now, before, places: out };
}

// ASHE rows: GEOGRAPHY_CODE, GEOGRAPHY_NAME, DATE_NAME (the survey year), OBS_VALUE, OBS_STATUS_NAME. A value with a status other than "Normal Value" (suppressed or flagged
// unreliable) is left out.
export function payFrom(rows) {
  const years = [...new Set(rows.map((r) => r.DATE_NAME))].sort();
  const year = years[years.length - 1];
  const before = years.length > 1 ? years[0] : null;
  const out = {};
  for (const r of rows) {
    if (r.OBS_STATUS_NAME && r.OBS_STATUS_NAME !== "Normal Value") continue;
    const v = num(r.OBS_VALUE);
    if (v == null) continue;
    const slot = out[r.GEOGRAPHY_CODE] ?? (out[r.GEOGRAPHY_CODE] = { name: r.GEOGRAPHY_NAME });
    if (r.DATE_NAME === year) slot.now = v;
    else if (r.DATE_NAME === before) slot.before = v;
  }
  return { year, before, places: out };
}

// The file the page reads: constituency records keyed by ONS code, with England's figures to compare with.
export function economyFile(claimants, pay, claimantEngland, payEngland) {
  const seats = {};
  for (const [code, c] of Object.entries(claimants.places)) {
    if (!/^(E14|N05|S14|W07)\d{6}$/.test(code)) continue;
    seats[code] = { n: c.name, c: c.now?.count ?? null, r: c.now?.rate ?? null, rb: c.before?.rate ?? null, p: pay.places[code]?.now ?? null, pb: pay.places[code]?.before ?? null };
  }
  return {
    claimantMonth: claimants.now, claimantBefore: claimants.before, payYear: pay.year, payBefore: pay.before,
    england: { r: claimantEngland?.now?.rate ?? null, rb: claimantEngland?.before?.rate ?? null, p: payEngland?.now ?? null, pb: payEngland?.before ?? null },
    seats,
  };
}
