// bathingWater.js
//
// Turns the Environment Agency's bathing water list (the linked-data API at environment.data.gov.uk/doc/bathing-water) into the short list the In numbers view of Your area
// uses: each designated beach or inland bathing water in England with its position and the classification it was given at the end of the last bathing season. Pure
// functions, no network, so they can be tested.

const text = (v) => (v && typeof v === "object" ? v._value ?? "" : v ?? "");

// "…/compliance-rBWD/point/03600/year/2025" -> 2025
const yearOf = (about) => Number((/\/year\/(\d{4})/.exec(String(about ?? "")) ?? [])[1]) || null;

export const RATINGS = ["Excellent", "Good", "Sufficient", "Poor"];

export function siteFrom(item) {
  const point = item?.samplingPoint;
  const lat = Number(point?.lat);
  const lon = Number(point?.long);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const assessment = item.latestComplianceAssessment;
  const rating = text(assessment?.complianceClassification?.name) || null;
  const district = [item.district].flat().map((d) => text(d?.name)).find(Boolean) ?? "";
  return {
    id: String(item.eubwidNotation ?? "").trim(),
    name: text(item.name).trim(),
    lat: Math.round(lat * 1e5) / 1e5,
    lon: Math.round(lon * 1e5) / 1e5,
    rating: rating && (RATINGS.includes(rating) || rating === "Closed") ? rating : null,
    year: yearOf(assessment?._about),
    company: text(item.appointedSewerageUndertaker?.name).replace(/ (Services )?(Limited|Ltd)$/i, "").trim(),
    district,
    heavyRain: item.waterQualityImpactedByHeavyRain === true,
  };
}

export function sitesFrom(items) {
  return (items ?? []).map(siteFrom).filter((s) => s && s.id && s.name);
}

// The year most sites were assessed in: the latest classification year.
export function latestYear(sites) {
  const counts = new Map();
  for (const s of sites) if (s.year) counts.set(s.year, (counts.get(s.year) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? null;
}
