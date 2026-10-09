// A vertical scale that stays readable when a few values are huge: an inverse hyperbolic sine, which is almost a straight line
// near zero and then bends, so a 500% spike sits only a few steps above 5%, and falls and rises both still show. Zero stays
// where it is, so up and down still read correctly. The chart labels the axis with the real figures.

const STEPS = [1, 2, 5];

// The scale for a set of values: `to` maps a real value onto the squeezed axis, `from` maps back.
export function makeSquash(values) {
  const abs = values.map(Math.abs).filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  // Typical size of a value: the 75th percentile, so the usual range keeps most of the room.
  const k = Math.max(1, abs.length ? abs[Math.floor(abs.length * 0.75)] : 1);
  return { k, to: (y) => Math.asinh(y / k), from: (t) => k * Math.sinh(t) };
}

// True when the biggest value is so far out that a straight scale would flatten everything else.
export function hasExtremes(values) {
  const abs = values.map(Math.abs).filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (abs.length < 8) return false;
  const typical = abs[Math.floor(abs.length * 0.75)];
  return abs.at(-1) > Math.max(10, typical * 6);
}

// Round-number labels for the range, both sides of zero, no more than `max` of them: 1, 2, 5, 10, 20, 50 ... if there is room,
// then 1, 5, 10, 50 ..., then only 1, 10, 100.
export function squashTicks(lo, hi, max = 8) {
  for (const steps of [STEPS, [1, 5], [1]]) {
    const all = [0];
    for (let mag = 1; mag <= 1e7; mag *= 10) for (const s of steps) {
      const v = s * mag;
      if (v <= hi + 1e-9) all.push(v);
      if (-v >= lo - 1e-9) all.push(-v);
    }
    const sorted = [...new Set(all)].sort((a, b) => a - b);
    if (sorted.length <= max) return sorted;
  }
  // Still too many (a very wide range): decades only, dropping the smallest, then the largest, until they fit.
  const all = [0];
  for (let mag = 1; mag <= 1e7; mag *= 10) { if (mag <= hi + 1e-9) all.push(mag); if (-mag >= lo - 1e-9) all.push(-mag); }
  let out = [...new Set(all)].sort((a, b) => a - b);
  let dropSmall = true;
  while (out.length > max && out.length > 1) {
    const nonzero = out.filter((v) => v !== 0).map(Math.abs);
    const target = dropSmall ? Math.min(...nonzero) : Math.max(...nonzero);
    out = out.filter((v) => Math.abs(v) !== target);
    dropSmall = !dropSmall;
  }
  return out;
}
