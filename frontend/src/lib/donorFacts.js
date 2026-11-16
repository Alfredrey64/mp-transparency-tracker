// What the Electoral Commission's register itself says about each donor, worked out from the donation rows as they stand, so it is there for every donor and keeps up as new
// donations are added: how many gifts, over what dates, the largest, how they were made, and the register record to check. Nothing here is written by hand.
export function addFact(prev, row) {
  const f = prev ?? { count: 0, first: null, last: null, biggest: 0, ref: null, types: {}, company: null };
  const date = row.accepted_date ?? row.received_date ?? null;
  const value = Number(row.value) || 0;
  const bigger = value > f.biggest || (f.ref === null && value >= f.biggest);
  const type = row.donation_type || "Other";
  return {
    count: f.count + 1,
    first: date && (!f.first || date < f.first) ? date : f.first,
    last: date && (!f.last || date > f.last) ? date : f.last,
    biggest: bigger ? value : f.biggest,
    ref: bigger ? row.ec_ref ?? f.ref : f.ref,
    types: { ...f.types, [type]: (f.types[type] ?? 0) + 1 },
    company: f.company ?? row.company_registration_number ?? null,
  };
}

const MONTH = { month: "short", year: "numeric", timeZone: "UTC" };
export const monthYear = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", MONTH);

// "Sep 2025", or "Sep 2025 to Jun 2026" when the gifts span months.
export function dateSpan(f) {
  if (!f.first) return null;
  const a = monthYear(f.first); const b = monthYear(f.last ?? f.first);
  return a === b ? a : `${a} to ${b}`;
}

export function typeLabel(type) {
  if (/^non[ -]?cash$/i.test(type)) return "non-cash (goods or services)";
  return String(type).toLowerCase();
}

// "cash", "cash (3) and non-cash (goods or services) (2)".
export function typeSummary(types) {
  const entries = Object.entries(types).sort((a, b) => b[1] - a[1]);
  if (entries.length === 1) return typeLabel(entries[0][0]);
  return entries.map(([t, n]) => `${typeLabel(t)} (${n})`).join(", ");
}

export const ecRecordUrl = (ref) => (ref ? `https://search.electoralcommission.org.uk/English/Donations/${encodeURIComponent(ref)}` : null);

// Companies House company numbers are eight characters: a short all-digit number is padded with zeros.
export function companiesHouseUrl(number) {
  if (!number) return null;
  const n = String(number).trim().replace(/\s+/g, "");
  if (!/^[A-Za-z0-9]{1,8}$/.test(n)) return null;
  return `https://find-and-update.company-information.service.gov.uk/company/${/^\d+$/.test(n) ? n.padStart(8, "0") : n.toUpperCase()}`;
}
