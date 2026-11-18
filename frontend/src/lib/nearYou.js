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

// The six areas a report card grades, in the order of the letters stored for each school. The wording says what Ofsted's own toolkit for state-funded schools (for use from
// 7 September 2026) says each area considers, shortened. The areas are the ones named in the toolkit; the grade scale is the one in Ofsted's "Understanding Ofsted report cards
// and grades" guide.
export const CARD_AREAS = [
  { name: "Inclusion", text: "How well leaders and staff identify and support pupils who are disadvantaged, have special educational needs or disabilities, are or have been known to children's social care, or face other barriers to learning or wellbeing." },
  { name: "Curriculum and teaching", text: "Whether leaders design an ambitious curriculum for every pupil, whether it is taught well across subjects and year groups, and whether pupils get strong foundations in language, reading, writing and maths." },
  { name: "Achievement", text: "Whether pupils get a high-quality education that gives them the knowledge, skills and qualifications to succeed, and how much they progress from their starting points." },
  { name: "Attendance and behaviour", text: "Whether staff create a calm, orderly and respectful school, and what the school's work does for pupils' attendance, behaviour and attitudes to learning." },
  { name: "Personal development and wellbeing", text: "Whether the school offers a coherent programme of personal development and wider experiences, prepares pupils for later life and looks after their character and wellbeing." },
  { name: "Leadership and governance", text: "Whether leaders and those responsible for governance together make sure every pupil can thrive, with a clear approach to improvement and a commitment to raising standards." },
];
export const SAFEGUARDING_TEXT = "Whether the school has an open and positive safeguarding culture that puts pupils' interests first, and takes a whole-school approach to protecting them. Ofsted reports it as met or not met, not as a grade.";

// The five grades, with how Ofsted's guide for parents describes them, and a colour for each. The colour is only a help; the grade's name is always written out beside it.
export const CARD_GRADES = {
  E: { name: "Exceptional", tone: "#1B5E8C", text: "Practice among the very best nationally, which other schools could learn from." },
  S: { name: "Strong standard", tone: "#2F8F6B", text: "Excellent, consistent work that makes a real difference for children." },
  X: { name: "Expected standard", tone: "#7FB38F", text: "The school is doing everything it should. Ofsted calls it a high standard." },
  N: { name: "Needs attention", tone: "#C88A1E", text: "Work to do to reach the expected standard. Not a fail, but a sign of where problems could grow." },
  U: { name: "Urgent improvement", tone: "#B3262E", text: "The most serious grade: problems that need putting right urgently." },
};
export const OLD_GRADE_TONE = { 1: "#1B5E8C", 2: "#2F8F6B", 3: "#C88A1E", 4: "#B3262E" };

// What a school's latest inspections say, as rows with the same shape for every school: the report card (with its six areas), the grade from the old system, and a short
// inspection. A school may have any of them or none.
export function inspectionRows(s) {
  const rows = [];
  if (s.c) {
    const areas = [...s.c].map((letter, i) => ({ ...CARD_AREAS[i], letter, grade: CARD_GRADES[letter] })).filter((a) => a.grade);
    const strong = areas.filter((a) => a.letter === "E" || a.letter === "S").length;
    const weak = areas.filter((a) => a.letter === "N" || a.letter === "U").length;
    rows.push({
      kind: "card", label: "Report card", date: monthYear(s.cd), areas, strong, weak,
      safeguarding: s.cs === 1 ? "met" : s.cs === 0 ? "not met" : "",
      summary: `${strong} of ${areas.length} areas strong or better, ${weak ? `${weak} need${weak === 1 ? "s" : ""} attention or urgent improvement` : "none needs attention"}`,
    });
  }
  if (s.g) rows.push({ kind: "grade", label: "Previous overall grade", date: monthYear(s.gd), value: OLD_GRADE[s.g], tone: OLD_GRADE_TONE[s.g] });
  if (s.o) rows.push({ kind: "short", label: "Short inspection", date: monthYear(s.od), value: s.o });
  if (!rows.length) rows.push({ kind: "none", label: "Inspection", value: "No inspection result is listed for this school in Ofsted's latest data." });
  return rows;
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
