// Splits a total into parts for the "out of every £1" cards.
//
// The parts and the total may be reported at different rhythms (monthly 12-month
// totals, quarterly four-quarter totals), so they are lined up on the latest month
// that every one of them has reached.

// A period's last month, counted in months: "2025-12" and "2025-Q4" both end in December 2025.
export function endMonth(period) {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return Number(q[1]) * 12 + Number(q[2]) * 3 - 1;
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (m) return Number(m[1]) * 12 + Number(m[2]) - 1;
  if (/^\d{4}$/.test(period)) return Number(period) * 12 + 11;
  return NaN;
}

export function monthLabel(index) {
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[index % 12]} ${Math.floor(index / 12)}`;
}

// Whole pence out of every £1 (100), adding up to exactly 100: each share is rounded down
// and the leftover pence go to the shares with the biggest remainders.
export function penceSplit(values) {
  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (!total) return values.map(() => 0);
  const exact = values.map((v) => (Math.max(0, v) / total) * 100);
  const pence = exact.map(Math.floor);
  let left = 100 - pence.reduce((a, b) => a + b, 0);
  const order = exact.map((e, i) => [e - Math.floor(e), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    pence[i] += 1;
    left -= 1;
  }
  return pence;
}

// seriesById: { id: [[period, value], ...] }; parts: [{ id, label }].
// Returns null if the total, or all the parts, are missing.
export function breakdownAt(seriesById, totalId, parts) {
  const total = seriesById[totalId];
  if (!total?.length) return null;
  const present = parts.filter((p) => seriesById[p.id]?.length);
  if (!present.length) return null;
  const ref = Math.min(...[totalId, ...present.map((p) => p.id)].map((id) => endMonth(seriesById[id].at(-1)[0])));
  const at = (id) => seriesById[id].find(([period]) => endMonth(period) === ref)?.[1];
  const totalValue = at(totalId);
  if (!(totalValue > 0)) return null;
  const rows = present.map((p) => ({ ...p, value: at(p.id) })).filter((p) => Number.isFinite(p.value) && p.value > 0);
  if (!rows.length) return null;
  const partsSum = rows.reduce((a, b) => a + b.value, 0);
  const other = Math.max(0, totalValue - partsSum);
  const shown = totalValue < partsSum ? partsSum : totalValue;
  const pence = penceSplit([...rows.map((r) => r.value), other]);
  return {
    ref,
    refLabel: monthLabel(ref),
    total: shown,
    parts: rows.map((r, i) => ({ ...r, pence: pence[i], share: (r.value / shown) * 100 })),
    other: { value: other, pence: pence[rows.length], share: (other / shown) * 100 },
  };
}
