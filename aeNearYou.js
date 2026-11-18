// aeNearYou.js
//
// Turns NHS England's monthly A&E file (one row per provider) into the short list the Schools and A&E near you page uses: for each NHS trust with a major (type 1) A&E
// department, how many patients came and how many were seen, treated and admitted or discharged within four hours. Pure functions, no network, so they can be tested.

const n = (v) => { const x = Number(String(v ?? "").replace(/,/g, "").trim()); return Number.isFinite(x) ? x : 0; };

const titleCase = (s) => String(s ?? "").toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
  .replace(/\bNhs\b/g, "NHS").replace(/\bAnd\b/g, "and").replace(/\bOf\b/g, "of").replace(/\bThe\b/g, "the").replace(/\bFor\b/g, "for").replace(/\bSt\b/g, "St");

// One provider row: the figures NHS England publishes, grouped the way the page uses them. `Booked appointments` are counted with the other attendances, as in the
// headline four-hour measure.
export function providerRow(r) {
  const att1 = n(r["A&E attendances Type 1"]) + n(r["A&E attendances Booked Appointments Type 1"]);
  const over1 = n(r["Attendances over 4hrs Type 1"]) + n(r["Attendances over 4hrs Booked Appointments Type 1"]);
  const attAll = att1 + n(r["A&E attendances Type 2"]) + n(r["A&E attendances Booked Appointments Type 2"]) + n(r["A&E attendances Other A&E Department"]) + n(r["A&E attendances Booked Appointments Other Department"]);
  const overAll = over1 + n(r["Attendances over 4hrs Type 2"]) + n(r["Attendances over 4hrs Booked Appointments Type 2"]) + n(r["Attendances over 4hrs Other Department"]) + n(r["Attendances over 4hrs Booked Appointments Other Department"]);
  return {
    code: String(r["Org Code"] ?? "").trim(),
    name: titleCase(r["Org name"]),
    region: titleCase(String(r["Parent Org"] ?? "").replace(/^NHS ENGLAND /i, "")),
    att1, over1, attAll, overAll,
    w12: n(r["Patients who have waited 12+ hrs from DTA to admission"]),
  };
}

const pct = (att, over) => (att > 0 ? Math.round((1 - over / att) * 1000) / 10 : null);

// Only trusts with a major A&E department are kept: a row with no type 1 attendances is a walk-in centre, a GP practice or a community service.
export function trustsFrom(rows) {
  return rows.map(providerRow).filter((t) => t.code && t.att1 > 0).map((t) => ({
    code: t.code, name: t.name, region: t.region,
    attendances: t.att1, within4: pct(t.att1, t.over1),
    allAttendances: t.attAll, allWithin4: pct(t.attAll, t.overAll),
    waited12: t.w12,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// England as a whole, from every row in the file, the way NHS England counts it.
export function nationalFrom(rows) {
  const all = rows.map(providerRow);
  const sum = (k) => all.reduce((a, t) => a + t[k], 0);
  return { attendances: sum("att1"), within4: pct(sum("att1"), sum("over1")), allAttendances: sum("attAll"), allWithin4: pct(sum("attAll"), sum("overAll")), waited12: sum("w12") };
}

// "MSitAE-OCTOBER-2026" -> "October 2026".
export function monthOf(period) {
  const m = /-([A-Z]+)-(\d{4})$/i.exec(String(period ?? ""));
  return m ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}` : "";
}

// The NHS Organisation Data Service says where a trust is: the postcode of its main address.
export const postcodeOf = (ord) => ord?.Organisation?.GeoLoc?.Location?.PostCode ?? ord?.Organisation?.Geoloc?.Location?.PostCode ?? "";
