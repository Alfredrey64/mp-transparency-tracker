// Food hygiene ratings near a point, from the Food Standards Agency's public ratings service (live, open to any website). Every place that sells or serves food is inspected by its
// council and given a rating. England, Wales and Northern Ireland use the Food Hygiene Rating Scheme (0 to 5, where 5 is "very good"); Scotland uses the Food Hygiene Information
// Scheme (Pass or Improvement Required). Places not yet inspected or exempt are counted apart, never as a rating.

const API = "https://api.ratings.food.gov.uk/Establishments";

export const FHRS_WORDS = { 5: "Very good", 4: "Good", 3: "Generally satisfactory", 2: "Improvement necessary", 1: "Major improvement necessary", 0: "Urgent improvement necessary" };

const normal = (v) => String(v ?? "").trim().toLowerCase();

// One establishment's standing: { kind: "rated", value: 0..5 } | { kind: "pass" } | { kind: "improve" } | { kind: "waiting" } | { kind: "exempt" } | { kind: "other" }
export function standing(e) {
  const v = normal(e?.RatingValue);
  if (/^[0-5]$/.test(v) && normal(e?.SchemeType) !== "fhis") return { kind: "rated", value: Number(v) };
  if (v === "pass" || v === "pass and eat safe") return { kind: "pass" };
  if (v === "improvement required") return { kind: "improve" };
  if (v.replace(/\s/g, "") === "awaitinginspection" || v.replace(/\s/g, "") === "awaitingpublication") return { kind: "waiting" };
  if (v === "exempt") return { kind: "exempt" };
  return { kind: "other" };
}

const placeOf = (e) => ({
  id: e.FHRSID,
  name: String(e.BusinessName ?? "").trim() || "Unnamed business",
  type: e.BusinessType ?? "",
  miles: Number(e.Distance) || 0,
  date: typeof e.RatingDate === "string" ? e.RatingDate.slice(0, 10) : null,
  postcode: e.PostCode ?? "",
});

// The summary for a list of establishments: how many fall in each rating, and the ones needing most improvement (nearest first within a rating).
export function summariseHygiene(list, { show = 5 } = {}) {
  const items = Array.isArray(list) ? list : [];
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let rated = 0; let pass = 0; let improve = 0; let waiting = 0; let exempt = 0; let fhis = 0; let fhrs = 0;
  const weak = [];
  for (const e of items) {
    const s = standing(e);
    if (normal(e.SchemeType) === "fhis") fhis++; else if (s.kind !== "other") fhrs++;
    if (s.kind === "rated") { counts[s.value]++; rated++; if (s.value <= 2) weak.push({ ...placeOf(e), rating: s.value }); }
    else if (s.kind === "pass") pass++;
    else if (s.kind === "improve") { improve++; weak.push({ ...placeOf(e), rating: null }); }
    else if (s.kind === "waiting") waiting++;
    else if (s.kind === "exempt") exempt++;
  }
  weak.sort((a, b) => (a.rating ?? -1) - (b.rating ?? -1) || a.miles - b.miles);
  const scheme = fhis > fhrs ? "FHIS" : "FHRS";
  const judged = scheme === "FHIS" ? pass + improve : rated;
  const top = scheme === "FHIS" ? pass : counts[5] + counts[4];
  const authority = items.find((e) => e.LocalAuthorityName)?.LocalAuthorityName ?? null;
  return { scheme, total: items.length, judged, rated, counts, pass, improve, waiting, exempt, goodShare: judged ? top / judged : null, weakCount: scheme === "FHIS" ? improve : counts[0] + counts[1] + counts[2], weak: weak.slice(0, show), authority };
}

// Asks for everything within `miles` of the point (one page: 5,000 is more than any square mile of the UK holds).
export async function loadFoodHygiene({ lat, lon }, miles = 1, fetcher = fetch) {
  const url = `${API}?latitude=${lat.toFixed(5)}&longitude=${lon.toFixed(5)}&maxDistanceLimit=${miles}&pageSize=5000&pageNumber=1&sortOptionKey=distance`;
  const res = await fetcher(url, { headers: { "x-api-version": "2", accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Food ratings answered ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body?.establishments)) throw new Error("The food ratings answer had no establishments");
  return { radius: miles, ...summariseHygiene(body.establishments), truncated: Number(body?.meta?.totalCount) > body.establishments.length };
}
