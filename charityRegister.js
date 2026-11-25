// charityRegister.js
//
// Picks out of the Charity Commission's weekly register extract (publicextract.charity, tab-separated) the entry for each think tank the site lists, and keeps a handful of
// plain facts from it: the registered number, the status, and the latest income and spending the charity reported to the Commission with the year they cover.
// Pure functions over text, no network, so they can be tested.
//
// A think tank is matched by its exact registered name, never by a number typed in from memory, and only when exactly one entry on the register has that name and it is a
// "Registered" main charity (not a linked or removed one). A name that matches nothing, or more than one entry, is left out rather than guessed at.

export const normalise = (s) => String(s ?? "").toUpperCase().replace(/&/g, " AND ").replace(/[^A-Z0-9 ]/g, " ").replace(/^THE /, "").replace(/\s+/g, " ").trim();

// The header row -> a function that reads a named column from a row (names matched without case or underscores, since the extract's own spelling is its choice).
export function columns(headerLine) {
  const names = headerLine.split("\t").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  return (row, name) => {
    const i = names.indexOf(name.toLowerCase().replace(/[^a-z0-9]/g, ""));
    return i < 0 ? undefined : row[i]?.trim();
  };
}

const money = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[£,]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};
const day = (v) => {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v ?? "")) ?? /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(v ?? ""));
  if (!m) return null;
  return m.length === 2 ? m[1] : `${m[3]}-${m[2]}-${m[1]}`;
};

// `wanted` is [{ key, name }] where name is the exact registered name to look for. `lines` is the extract split into lines, the first being the header.
// Returns { found: { [key]: entry }, notFound: [key], ambiguous: [key] }.
export function matchCharities(lines, wanted) {
  const get = columns(lines[0]);
  const byName = new Map(wanted.map((w) => [normalise(w.name), { ...w, rows: [] }]));
  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split("\t");
    const target = byName.get(normalise(get(row, "charity_name")));
    if (target) target.rows.push(row);
  }
  const found = {};
  const notFound = [];
  const ambiguous = [];
  for (const w of byName.values()) {
    const live = w.rows.filter((r) => /^registered$/i.test(get(r, "charity_registration_status") ?? "") && !(get(r, "linked_charity_number") ?? "").replace(/^0$/, ""));
    if (live.length === 0) { notFound.push(w.key); continue; }
    if (live.length > 1) { ambiguous.push(w.key); continue; }
    const r = live[0];
    const number = get(r, "registered_charity_number");
    found[w.key] = {
      number: Number(number),
      name: get(r, "charity_name"),
      income: money(get(r, "latest_income")),
      expenditure: money(get(r, "latest_expenditure")),
      yearEnd: day(get(r, "latest_acc_fin_period_end_date")),
      registered: day(get(r, "date_of_registration")),
      url: `https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/${Number(number)}`,
    };
  }
  return { found, notFound, ambiguous };
}
