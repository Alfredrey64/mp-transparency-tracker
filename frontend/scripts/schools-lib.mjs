// Turns a row of Ofsted's "latest inspections" management information, and the school's grid position from the schools register, into the short record the
// "Schools and A&E near you" page loads. Pure functions, no network, so they can be tested. Written for scripts/build-schools-near-you.mjs.

export const PHASE = { Primary: "P", Secondary: "S", Special: "X", Nursery: "N", "Alternative provision": "A" };

const nul = (v) => (v === undefined || v === null || v === "" || v === "NULL" ? "" : String(v).trim());

// "14/04/2026" -> "2026-04-14".
export const isoDate = (dmy) => {
  const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(nul(dmy));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

// The five report card judgements, as one letter each: Exceptional, Strong standard, Expected standard, Needs attention, Urgent improvement.
const CARD = { "Exceptional": "E", "Strong standard": "S", "Expected standard": "X", "Needs attention": "N", "Urgent improvement": "U" };
export const CARD_AREAS = ["Inclusion", "Curriculum and teaching", "Achievement", "Attendance and behaviour", "Personal development and wellbeing", "Leadership and governance"];

// A school's record, or null if it has no place on the map or is not a school the page shows.
export function schoolRecord(row, place) {
  const urn = Number(nul(row["URN"]));
  const phase = PHASE[nul(row["Ofsted phase"])];
  if (!urn || !phase || !place) return null;
  const oeif = nul(row["Latest OEIF overall effectiveness"]);
  const letters = CARD_AREAS.map((a) => CARD[nul(row[a])] ?? "");
  const rec = {
    u: urn,
    n: nul(row["School name"]),
    p: phase,
    la: Number(place.lat.toFixed(4)),
    lo: Number(place.lon.toFixed(4)),
    k: Number(nul(row["Total number of pupils"])) || 0,
    pc: nul(row["Postcode"]),
  };
  // The grade from the inspections used until autumn 2025: 1 outstanding, 2 good, 3 requires improvement, 4 inadequate.
  if (/^[1-4]$/.test(oeif)) { rec.g = Number(oeif); rec.gd = isoDate(row["Inspection start date of latest OEIF graded inspection"]).slice(0, 7); }
  // A report card has six judgements and a safeguarding finding, and no single overall grade.
  if (letters.every(Boolean)) {
    rec.c = letters.join("");
    rec.cs = nul(row["Safeguarding standards"]) === "Met" ? 1 : nul(row["Safeguarding standards"]) === "Not met" ? 0 : undefined;
    rec.cd = isoDate(row["Inspection start date"]).slice(0, 7);
  }
  const ungraded = nul(row["Ungraded inspection overall outcome"]);
  if (ungraded) { rec.o = ungraded.replace(/ - S5 Next$/, ""); rec.od = isoDate(row["Date of latest ungraded inspection"]).slice(0, 7); }
  const concern = nul(row["Most recent category of concern"]) || nul(row["Category of concern"]);
  if (concern) rec.x = concern;
  return rec;
}

// The map is cut into tiles, and each tile is one file; the rule is shared with the page that loads them.
export { tileOf } from "../src/lib/nearYou.js";
