// gpAppointments.js
//
// Turning NHS England's "Appointments in General Practice" regional files (one CSV per integrated care board, one row per month, status, type of staff, mode and time between booking and
// appointment) into the small file behind the "Waiting for a GP" picture on the NHS page. Pure functions; nothing fetches here.
//
// What is counted: appointments recorded in GP practices' appointment books, not people and not every contact with a practice. "Time between booking and appointment" is the gap from when the
// appointment was made to the day it took place, so a same-day appointment may be urgent care offered on the day or an appointment booked for later that was moved: it is not a measure of how
// long a patient waited after asking for care. Waits are measured over appointments that took place (status "Attended"); missed ones (did not attend) are counted separately.

export const BANDS = ["Same day", "1 day", "2 to 7 days", "8 to 14 days", "15 to 21 days", "22 to 28 days", "More than 28 days"];
const BAND_AT = new Map(BANDS.map((b, i) => [b.toLowerCase(), i]));
export const WITHIN_TWO_WEEKS = 4; // the first four bands: up to and including 14 days

const MONTHS = { JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06", JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12" };

// "SEP2026" -> "2026-09", or null.
export function monthKey(s) {
  const m = /^([A-Z]{3})(\d{4})$/.exec(String(s).trim().toUpperCase());
  return m && MONTHS[m[1]] ? `${m[2]}-${MONTHS[m[1]]}` : null;
}

// "More than 28 Days", "15  to 21 Days" (note the two spaces), "1 Day" -> index into BANDS, or -1 for "Unknown / Data Quality" and anything else.
export function bandIndex(s) {
  const t = String(s).trim().toLowerCase().replace(/\s+/g, " ").replace(/\bdays?\b/, (d) => (d === "day" ? "day" : "days"));
  return BAND_AT.get(t) ?? -1;
}

// Split one CSV line into fields (a field may be wrapped in double quotes and hold commas).
export function splitLine(line) {
  const out = []; let f = ""; let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { f += '"'; i += 1; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { out.push(f); f = ""; }
    else f += c;
  }
  out.push(f);
  return out;
}

// "NHS Bath and North East Somerset, Swindon and Wiltshire Integrated Care Board" -> "Bath and North East Somerset, Swindon and Wiltshire".
export const shortName = (s) => String(s).replace(/^NHS\s+/i, "").replace(/\s+Integrated Care Board$/i, "").trim();

const empty = () => ({ bands: Array(BANDS.length).fill(0), attended: 0, dna: 0, mode: {}, staff: {} });

// Adds the rows of one file's text to `acc` (a Map of ICB code -> { name, months: Map of month -> tallies }). Returns how many rows it understood.
export function addCsv(acc, text) {
  const lines = text.split(/\r?\n/);
  const head = splitLine(lines[0] ?? "");
  const col = Object.fromEntries(head.map((h, i) => [h.trim(), i]));
  for (const need of ["ICB_ONS_CODE", "ICB_NAME", "APPOINTMENT_MONTH", "APPT_STATUS", "HCP_TYPE", "APPT_MODE", "TIME_BETWEEN_BOOK_AND_APPT", "COUNT_OF_APPOINTMENTS"]) {
    if (!(need in col)) throw new Error(`The appointments file has no ${need} column`);
  }
  let used = 0;
  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const r = splitLine(lines[i]);
    const month = monthKey(r[col.APPOINTMENT_MONTH]);
    const n = Number(r[col.COUNT_OF_APPOINTMENTS]);
    if (!month || !Number.isFinite(n)) continue;
    const code = r[col.ICB_ONS_CODE];
    let icb = acc.get(code);
    if (!icb) { icb = { name: shortName(r[col.ICB_NAME]), months: new Map() }; acc.set(code, icb); }
    let t = icb.months.get(month);
    if (!t) { t = empty(); icb.months.set(month, t); }
    const status = r[col.APPT_STATUS];
    if (status === "DNA") t.dna += n;
    else if (status === "Attended") {
      t.attended += n;
      const b = bandIndex(r[col.TIME_BETWEEN_BOOK_AND_APPT]);
      if (b >= 0) t.bands[b] += n;
      const mode = r[col.APPT_MODE]; t.mode[mode] = (t.mode[mode] ?? 0) + n;
      const staff = r[col.HCP_TYPE]; t.staff[staff] = (t.staff[staff] ?? 0) + n;
    }
    used += 1;
  }
  return used;
}

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
const sum = (xs) => xs.reduce((s, x) => s + x, 0);

// The shares for one month's tallies.
export function shares(t) {
  const known = sum(t.bands);
  return {
    n: t.attended,
    bands: t.bands.map((x) => pct(x, known)),
    within2w: pct(sum(t.bands.slice(0, WITHIN_TWO_WEEKS)), known),
    sameDay: pct(t.bands[0], known),
    over28: pct(t.bands[6], known),
    dna: pct(t.dna, t.attended + t.dna),
  };
}

const addTally = (a, b) => {
  const out = empty();
  for (const t of [a, b]) {
    t.bands.forEach((x, i) => { out.bands[i] += x; });
    out.attended += t.attended; out.dna += t.dna;
    for (const k of Object.keys(t.mode)) out.mode[k] = (out.mode[k] ?? 0) + t.mode[k];
    for (const k of Object.keys(t.staff)) out.staff[k] = (out.staff[k] ?? 0) + t.staff[k];
  }
  return out;
};

const monthBefore = (m, years) => `${Number(m.slice(0, 4)) - years}${m.slice(4)}`;

// The file's contents: months in order, England as a whole, and each board with its newest month, the same month a year earlier and its two-weeks share month by month.
export function build(acc) {
  const monthSet = new Set();
  for (const icb of acc.values()) for (const m of icb.months.keys()) monthSet.add(m);
  const months = [...monthSet].sort();
  const latest = months.at(-1);
  const england = new Map();
  for (const icb of acc.values()) for (const [m, t] of icb.months) england.set(m, addTally(england.get(m) ?? empty(), t));
  const mix = (o) => { const total = sum(Object.values(o)); return Object.fromEntries(Object.entries(o).filter(([k]) => k !== "Unknown").map(([k, v]) => [k, pct(v, total)])); };
  const eNow = england.get(latest);
  return {
    months,
    latest,
    bands: BANDS,
    england: { ...shares(eNow), series: months.map((m) => (england.has(m) ? shares(england.get(m)).within2w : null)), yearAgo: england.has(monthBefore(latest, 1)) ? shares(england.get(monthBefore(latest, 1))) : null, mode: mix(eNow.mode), staff: mix(eNow.staff) },
    icbs: [...acc.entries()].map(([code, icb]) => {
      const t = icb.months.get(latest);
      if (!t) return null;
      const ago = icb.months.get(monthBefore(latest, 1));
      return { code, name: icb.name, ...shares(t), yearAgo: ago ? shares(ago) : null, series: months.map((m) => (icb.months.has(m) ? shares(icb.months.get(m)).within2w : null)) };
    }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

// The newest publication page to try, newest first: [{ month: "october", year: 2026, url }, ...] for the current month back `count` months.
export function candidatePages(now, count = 5) {
  const names = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const out = [];
  for (let k = 0; k < count; k += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 1));
    const month = names[d.getUTCMonth()]; const year = d.getUTCFullYear();
    out.push({ month, year, key: `${year}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, url: `https://digital.nhs.uk/data-and-information/publications/statistical/appointments-in-general-practice/${month}-${year}` });
  }
  return out;
}

// The regional zip's address on a publication page, or null.
export const regionalZip = (html) => /href="(https:\/\/files\.digital\.nhs\.uk\/[^"]*Appointments_GP_Regional_CSV[^"]*\.zip)"/i.exec(html)?.[1] ?? null;
