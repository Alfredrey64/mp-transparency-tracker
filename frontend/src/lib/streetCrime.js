// Street-level crime from the police.uk API: what is recorded within about a mile of a point. The API anonymises each crime to the nearest street or public place, covers England,
// Wales and Northern Ireland (not Scotland), and publishes about two months behind.

export const CRIME_NAME = {
  "anti-social-behaviour": "Anti-social behaviour",
  "bicycle-theft": "Bicycle theft",
  burglary: "Burglary",
  "criminal-damage-arson": "Criminal damage and arson",
  drugs: "Drugs",
  "other-theft": "Other theft",
  "possession-of-weapons": "Possession of weapons",
  "public-order": "Public order",
  robbery: "Robbery",
  shoplifting: "Shoplifting",
  "theft-from-the-person": "Theft from the person",
  "vehicle-crime": "Vehicle crime",
  "violent-crime": "Violence and sexual offences",
  "other-crime": "Other crime",
};

export const crimeName = (slug) => CRIME_NAME[slug] ?? String(slug ?? "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

// The crimes counted by kind, most first.
export function byCategory(crimes) {
  const counts = new Map();
  for (const c of crimes ?? []) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return [...counts].map(([slug, count]) => ({ slug, name: crimeName(slug), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// The streets with the most recorded crime, with how many each had.
export function busiestStreets(crimes, count = 3) {
  const counts = new Map();
  for (const c of crimes ?? []) {
    const name = c.location?.street?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, n]) => ({ name: name.replace(/^On or near /i, "").trim() || name, count: n })).sort((a, b) => b.count - a.count).slice(0, count);
}

// "2025-09" -> "September 2025"
export function monthName(ym) {
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return "";
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

// The month to ask for, n months before the latest one the API has published ("2025-09-01" is its last-updated stamp).
export function monthsBack(latest, n) {
  const [y, m] = String(latest).slice(0, 7).split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const API = "https://data.police.uk/api";

// The latest month and the five before it: each month's total, and the kinds and streets for the latest. A month that fails is left out of the totals; if the latest fails, it throws.
export async function loadStreetCrime(point, months = 6, fetcher = fetch) {
  const stamp = await (await fetcher(`${API}/crime-last-updated`)).json();
  const latest = String(stamp.date).slice(0, 7);
  const asked = Array.from({ length: months }, (_, n) => monthsBack(latest, n));
  const got = await Promise.all(asked.map(async (ym) => {
    try {
      const res = await fetcher(`${API}/crimes-street/all-crime?lat=${point.lat}&lng=${point.lon}&date=${ym}`);
      if (!res.ok) return { ym, crimes: null };
      return { ym, crimes: await res.json() };
    } catch { return { ym, crimes: null }; }
  }));
  const first = got[0];
  if (!first.crimes) throw new Error("crime");
  return {
    latest,
    months: got.filter((g) => g.crimes).map((g) => ({ ym: g.ym, total: g.crimes.length })).reverse(),
    categories: byCategory(first.crimes),
    streets: busiestStreets(first.crimes),
    total: first.crimes.length,
  };
}
