// The small calculations behind the "Seeing a GP" picture on the NHS page: sharing a hundred dots between the waiting bands, spreading the boards along a strip without them landing on top of
// one another, and saying how a figure has moved. Pure functions over the rows in data/gpAppointments.json.

// Shares out `total` dots among the bands in proportion to their percentages, with the largest remainders getting the spare ones, so the dots always add up exactly. Bands with no share get none.
export function allocate(percents, total = 100) {
  const sum = percents.reduce((s, p) => s + (p ?? 0), 0);
  if (!(sum > 0)) return percents.map(() => 0);
  const raw = percents.map((p) => ((p ?? 0) / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((s, x) => s + x, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i] += 1; left -= 1; } });
  return out;
}

// The band of each of the `total` dots, in order: [0,0,0,1,1,2,...].
export const dotBands = (counts) => counts.flatMap((n, band) => Array(n).fill(band));

// Where each board sits on a strip from `lo` to `hi`: x as a fraction, and a row (0 up) so that boards near each other in value stack instead of overlapping.
export function strip(values, lo, hi, gap = 0.028, rows = 6) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const placed = [];
  const out = Array(values.length);
  for (const [v, i] of order) {
    const x = (v - lo) / (hi - lo || 1);
    const used = new Set(placed.filter((p) => Math.abs(p.x - x) < gap).map((p) => p.row));
    let row = 0;
    while (used.has(row) && row < rows - 1) row += 1;
    placed.push({ x, row });
    out[i] = { x, row };
  }
  return out;
}

// "up 1.2 points on a year ago", "down 0.4 points", or "no change" - the words for a change in a share, to one decimal place.
export function pointsChange(now, before) {
  if (now == null || before == null) return null;
  const d = Math.round((now - before) * 10) / 10;
  if (d === 0) return "no change on a year ago";
  return `${d > 0 ? "up" : "down"} ${Math.abs(d).toFixed(1)} point${Math.abs(d) === 1 ? "" : "s"} on a year ago`;
}

// "September 2026" from "2026-09".
export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

// A link-friendly short label for a board in tight places: the first place name before the first comma or " and ".
export const shortBoard = (name) => name.split(/,| and /)[0];
