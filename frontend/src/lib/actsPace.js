// The numbers behind the "Acts that have become law" picture on the how-a-law-is-made page: where on the year each Act falls, how many Acts there had been by this date last year,
// and which years had a general election. Pure functions over the rows in data/acts.json.

// UK general election years since 1990, for marking the yearly bars (each is a year Parliament was dissolved for a campaign).
export const ELECTION_YEARS = new Set([1992, 1997, 2001, 2005, 2010, 2015, 2017, 2019, 2024]);

const DAY = 86400000;
const utc = (iso) => Date.parse(`${iso}T00:00:00Z`);

// 0 for 1 January to 1 for 31 December, by the day of the year of an ISO date.
export function yearFraction(iso) {
  const y = Number(iso.slice(0, 4));
  const start = Date.UTC(y, 0, 1);
  const len = (Date.UTC(y + 1, 0, 1) - start) / DAY;
  return (utc(iso) - start) / DAY / len;
}

// How many of `acts` ({ date }) were made on or before the same day of the year as `today` (an ISO date), whatever year those Acts are from.
export function countBy(acts, today) {
  const md = today.slice(5);
  return acts.filter((a) => a.date.slice(5) <= md).length;
}

// A step line through the dates of the Acts as { x, y } points (x a fraction of the year, y the running count), flat until `until` (a fraction) if given.
export function stepPoints(acts, until = null) {
  const pts = [{ x: 0, y: 0 }];
  acts.forEach((a, i) => {
    const x = yearFraction(a.date);
    pts.push({ x, y: i }, { x, y: i + 1 });
  });
  const end = until ?? 1;
  pts.push({ x: Math.max(end, pts[pts.length - 1].x), y: acts.length });
  return pts;
}

// "M0 100 L..." for those points, scaled into a 0..100 box with `top` the count at the top edge.
export function pathOf(points, top) {
  return points.map((p, i) => `${i ? "L" : "M"}${(p.x * 100).toFixed(2)} ${(100 - (p.y / top) * 100).toFixed(2)}`).join("");
}

// A tidy top for the vertical scale: the next multiple of 10 above the biggest count.
export const niceTop = (n) => Math.max(10, Math.ceil((n + 1) / 10) * 10);

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
