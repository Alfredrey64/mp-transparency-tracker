// Two councils side by side, from files the site already holds: councilsIndex.json (who runs each council, its seats and its next election),
// councilTaxByCouncil.json (the Band D bill each year since 2010 to 11, England only) and deprivation.json (the English Indices of Deprivation, England only).
// Every function here is pure, so the page stays thin and the rules are tested. Nothing here says which council is better, only what the figures are.

export const SEP = "~";

// The pair in the address ("E08000003~E08000035") as two council codes. Anything that is not a council code is dropped, so a typed address can't break the page.
export function pairFromParam(param) {
  const [a, b] = String(param ?? "").split(SEP).map((x) => x.trim().toUpperCase());
  const ok = (x) => (/^[EWSN]\d{8}$/.test(x ?? "") ? x : null);
  return [ok(a), ok(b)];
}
export const pairPath = (a, b) => (a || b ? `#/compareCouncils/${encodeURIComponent(`${a ?? ""}${SEP}${b ?? ""}`)}` : "#/compareCouncils");

const NATIONS = { E: "England", S: "Scotland", W: "Wales", N: "Northern Ireland" };
export const nationOf = (council) => NATIONS[String(council?.id ?? "")[0]] ?? "UK";

// The region key used by the regional figures: England's nine regions (from the deprivation file), or the nation itself for the other three.
export function regionKeyFor(council, deprivation) {
  const first = String(council?.id ?? "")[0];
  if (first === "S") return "scotland";
  if (first === "W") return "wales";
  if (first === "N") return "ni";
  const area = deprivation?.areas?.find((a) => a.code === council.id);
  return area?.region ?? null;
}

// How a council's name is compared with the names in the council tax file ("Manchester City Council" and "Manchester" are the same).
export const normName = (s) => String(s ?? "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ")
  .replace(/\b(council|borough|city of|london borough of|royal borough of|metropolitan|district|county|the)\b/g, " ").replace(/\s+/g, " ").trim();

// A council's Band D bill: the latest year, the first year, and how much it rose. England only, and only for councils that send their own bill (not
// county councils, whose charge is part of the district's), so `null` means there is no figure, not that the bill is nothing.
export function taxFor(council, tax) {
  if (nationOf(council) !== "England" || !tax?.rows) return null;
  const want = normName(council.name);
  const row = tax.rows.find((r) => normName(r[0]) === want);
  if (!row) return null;
  const values = row[2];
  const lastIdx = values.length - 1;
  const latest = values[lastIdx];
  const first = values.find((v) => v !== null);
  if (latest == null || first == null) return null;
  return { latest, first, rise: ((latest - first) / first) * 100, fromYear: tax.from, toYear: tax.from + lastIdx };
}

// Where a council sits in England's deprivation ranking (1 is the most deprived of the councils ranked). Other nations rank only their own areas, on indices
// built differently, so there is no figure for them here.
export function deprivationFor(council, deprivation) {
  if (nationOf(council) !== "England" || !deprivation?.areas) return null;
  const a = deprivation.areas.find((x) => x.code === council.id);
  if (!a) return null;
  return { rank: a.rank, of: deprivation.areas.length, score: a.score, worst10: a.worst10 };
}

// "1st", "2nd", "23rd", "112th".
export function ordinal(n) {
  const v = Math.abs(n) % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[v % 10] ?? "th");
  return `${n}${suffix}`;
}

// Whole pounds, or "no figure".
export const pounds = (v) => (v == null ? "no figure" : `£${Math.round(v).toLocaleString("en-GB")}`);
// "£312 more" or "£312 less" for the first figure against the second, or null when they are equal.
export function differenceText(a, b) {
  if (a == null || b == null || Math.round(a) === Math.round(b)) return null;
  return { more: a > b, amount: Math.abs(Math.round(a - b)) };
}
