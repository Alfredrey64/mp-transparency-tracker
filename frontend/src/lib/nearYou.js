// The sums behind the Schools and A&E near you page: how far apart two places are, which map tiles to load for a postcode, and what to say about a school's or an
// A&E department's figures. Pure and tested. The data builds in scripts/ use the same tile rule, so the files they write are the ones this finds.

// The map is cut into tiles of 0.2 of a degree on a side (roughly 22 km by 14 km), and each tile is one file.
const PER_DEGREE = 5;
export const tileOf = (lat, lon) => `${Math.floor(lat * PER_DEGREE)}_${Math.floor(lon * PER_DEGREE)}`;

const rad = (d) => (d * Math.PI) / 180;
const EARTH_MILES = 3958.8;

// The distance in miles between two points, along the ground.
export function miles(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.sqrt(h));
}

// The tiles a circle of `radius` miles round a point can touch.
export function tilesAround(point, radius) {
  const dLat = radius / 69;
  const dLon = radius / (69 * Math.max(0.2, Math.cos(rad(point.lat))));
  const keys = new Set();
  for (const lat of [point.lat - dLat, point.lat, point.lat + dLat]) for (const lon of [point.lon - dLon, point.lon, point.lon + dLon]) keys.add(tileOf(lat, lon));
  return [...keys];
}

export const PHASE_NAME = { P: "Primary", S: "Secondary", X: "Special", N: "Nursery", A: "Alternative provision" };
export const OLD_GRADE = { 1: "Outstanding", 2: "Good", 3: "Requires improvement", 4: "Inadequate" };
export const CARD_NAME = { E: "Exceptional", S: "Strong standard", X: "Expected standard", N: "Needs attention", U: "Urgent improvement" };

// Schools within `radius` miles of a point, nearest first, each with its distance.
export function schoolsWithin(records, point, radius, phase = "all") {
  return records
    .filter((s) => phase === "all" || s.p === phase)
    .map((s) => ({ ...s, miles: miles(point, { lat: s.la, lon: s.lo }) }))
    .filter((s) => s.miles <= radius)
    .sort((a, b) => a.miles - b.miles || a.n.localeCompare(b.n));
}

// What a school's latest inspection says, in one line each for the old grade and the new report card. A school may have either, both or neither.
export function inspectionLines(s) {
  const lines = [];
  if (s.c) {
    const strong = [...s.c].filter((l) => l === "E" || l === "S").length;
    const weak = [...s.c].filter((l) => l === "N" || l === "U").length;
    const safe = s.cs === 1 ? "safeguarding met" : s.cs === 0 ? "safeguarding not met" : "";
    const parts = [`${strong} of 6 areas strong or better`, weak ? `${weak} need${weak === 1 ? "s" : ""} attention or urgent improvement` : "none needs attention", safe].filter(Boolean);
    lines.push({ kind: "card", text: `Report card, ${monthYear(s.cd)}: ${parts.join(", ")}.` });
  }
  if (s.g) lines.push({ kind: "grade", text: `Last overall grade, ${monthYear(s.gd)}: ${OLD_GRADE[s.g]}.` });
  if (s.o) lines.push({ kind: "short", text: `Short inspection, ${monthYear(s.od)}: ${s.o}.` });
  if (!lines.length) lines.push({ kind: "none", text: "No inspection result is listed for this school in Ofsted's latest data." });
  return lines;
}

export function monthYear(ym) {
  const m = /^(\d{4})-(\d\d)$/.exec(ym ?? "");
  if (!m) return "date not listed";
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

// A&E trusts nearest a point, nearest first, each with its distance.
export function nearestTrusts(trusts, point, count = 3) {
  return trusts.map((t) => ({ ...t, miles: miles(point, { lat: t.la, lon: t.lo }) })).sort((a, b) => a.miles - b.miles).slice(0, count);
}

// Ofsted's category-of-concern codes as they appear in its data, in words.
export const CONCERN_NAME = { SM: "special measures", SWK: "serious weaknesses", RSI: "requires significant improvement" };
