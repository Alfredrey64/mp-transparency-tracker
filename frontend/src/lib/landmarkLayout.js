// Where each landmark vote goes on the "at a glance" chart: across by time, down by theme. Eras are given room in proportion to how many votes
// they hold (with a little extra so a quiet era is still readable), so the busy modern decades are not squashed into a few pixels. The chart
// marks each era's start year along the bottom so the stretching is never hidden. Dots in the same row that would touch are moved into a
// second or third row inside their lane.

export const DOT = 12;
export const STEP = 15;
const EDGE = 10;
const INSET = 6;

export const landmarkId = (vote) => `lm-${vote.year}-${vote.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Eras as they are drawn: each starts where the one before ends, the first begins at the earliest vote and the last ends at the latest.
export function spanEras(eras, votes) {
  const years = votes.map((v) => v.year);
  const first = Math.min(...years);
  const last = Math.max(...years);
  return eras.map((e, i) => ({ ...e, start: i === 0 ? first : eras[i - 1].to, end: Number.isFinite(e.to) ? e.to : last }));
}

const eraOf = (eras, year) => {
  const i = eras.findIndex((e) => year <= e.end);
  return i < 0 ? eras.length - 1 : i;
};

export function layoutLandmarks({ votes, eras, themes, width, labelPad = 6 }) {
  const usable = Math.max(120, width - EDGE * 2);
  const counts = eras.map(() => 0);
  for (const v of votes) counts[eraOf(eras, v.year)] += 1;
  const weights = counts.map((c) => c * 1.8 + 6);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const bands = eras.map((e, i) => {
    const left = EDGE + (usable * acc) / total;
    acc += weights[i];
    return { ...e, left, width: (usable * weights[i]) / total, count: counts[i] };
  });
  const xOf = (v) => {
    const b = bands[eraOf(eras, v.year)];
    const f = b.end > b.start ? clamp((v.year - b.start) / (b.end - b.start), 0, 1) : 0;
    return b.left + INSET + f * Math.max(0, b.width - INSET * 2);
  };

  let top = 0;
  const lanes = themes.map((t) => {
    const items = votes.filter((v) => v.theme === t.key).map((v) => ({ vote: v, id: landmarkId(v), x: xOf(v) })).sort((a, b) => a.x - b.x || a.vote.year - b.vote.year);
    const ends = [];
    for (const it of items) {
      let s = ends.findIndex((e) => it.x - e >= STEP);
      if (s < 0) s = ends.length;
      ends[s] = it.x;
      it.slot = s;
    }
    const slots = Math.max(1, ends.length);
    const lane = { ...t, items, slots, top, height: labelPad + slots * STEP + 10 };
    for (const it of items) it.y = top + labelPad + it.slot * STEP + STEP / 2;
    top += lane.height;
    return lane;
  });
  return { bands, lanes, height: top, nodes: lanes.flatMap((l) => l.items.map((it) => ({ ...it, theme: l.key, color: l.color }))) };
}

// The dot nearest a point, if one is close enough to mean it.
export function nearestNode(nodes, x, y, reach = 16) {
  let best = null;
  let bestD = reach * reach;
  for (const n of nodes) {
    const d = (n.x - x) ** 2 + (n.y - y) ** 2;
    if (d <= bestD) { best = n; bestD = d; }
  }
  return best;
}
