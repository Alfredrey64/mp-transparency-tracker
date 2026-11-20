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
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// One JSON answer from the API, or null if it is refused, fails, or takes longer than `ms`. A month is a big answer (about a thousand crimes within a mile in a town) and the newest month
// is sometimes very slow to build, so nothing here may wait for ever.
async function getJson(url, fetcher, ms) {
  try {
    const signal = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(ms) : undefined;
    const res = await fetcher(url, signal ? { signal } : undefined);
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

const crimesUrl = (point, ym) => `${API}/crimes-street/all-crime?lat=${point.lat}&lng=${point.lon}&date=${ym}`;

// The newest month the API has published, as "2026-09", or null if it cannot say.
async function publishedMonth(fetcher) {
  const stamp = await getJson(`${API}/crime-last-updated`, fetcher, 10000);
  return stamp?.date ? String(stamp.date).slice(0, 7) : null;
}

// What was recorded within about a mile of a point in the newest month, by kind and street. The newest month is asked for first; if it has not come in after `slowAfter` ms the month
// before is asked for too, and used if the newest then fails or runs out of patience. `behind` says the month used is not the newest published. Throws only if no recent month can be had.
export async function loadStreetCrime(point, fetcher = fetch, { slowAfter = 3500, patience = 15000 } = {}) {
  const published = await publishedMonth(fetcher);
  if (!published) throw new Error("crime");
  const newest = monthsBack(published, 0);
  const first = getJson(crimesUrl(point, newest), fetcher, patience);
  const early = await Promise.race([first, pause(slowAfter).then(() => "slow")]);
  let ym = newest;
  let crimes = early === "slow" ? null : early;
  if (!crimes) {
    const before = monthsBack(published, 1);
    const backup = getJson(crimesUrl(point, before), fetcher, 30000);
    crimes = early === "slow" ? await first : null;
    if (!crimes) { crimes = await backup; ym = before; }
  }
  if (!crimes) { ym = monthsBack(published, 2); crimes = await getJson(crimesUrl(point, ym), fetcher, 30000); }
  if (!crimes) throw new Error("crime");
  return { published, latest: ym, behind: ym !== newest, categories: byCategory(crimes), streets: busiestStreets(crimes), total: crimes.length };
}

// Each month's total for the `months` months up to `latest`, oldest first. `known` is the month already loaded, so it is not asked for again. A month that fails is left out.
export async function loadCrimeTrend(point, latest, months = 6, fetcher = fetch, known = null) {
  const asked = Array.from({ length: months }, (_, n) => monthsBack(latest, n)).filter((ym) => !known || ym !== known.ym);
  const got = await Promise.all(asked.map(async (ym) => {
    const crimes = await getJson(crimesUrl(point, ym), fetcher, 30000);
    return crimes ? { ym, total: crimes.length } : null;
  }));
  return [...got.filter(Boolean), ...(known ? [{ ym: known.ym, total: known.total }] : [])].sort((a, b) => (a.ym < b.ym ? -1 : 1));
}
