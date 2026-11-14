// The rule behind the tax check's "has the newest Budget been applied" step (scripts/check-tax-data.mjs), kept apart so it can be tested without a network.

// The day of the newest Budget or fiscal statement that any step in the tax series credits as its announcement (the `ann` date), or null.
export function latestAnnouncement(series) {
  let best = null;
  for (const rows of Object.values(series)) for (const r of rows) { const a = r[2]?.ann; if (a && (!best || a > best)) best = a; }
  return best;
}

// A Budget counts as applied when some step in the series was announced on its day (or the day either side, as the annex can be dated the day after the speech).
export function budgetApplied(series, budgetDate) {
  const day = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
  const wanted = new Set([day(budgetDate, -1), budgetDate, day(budgetDate, 1)]);
  for (const rows of Object.values(series)) for (const r of rows) if (wanted.has(r[2]?.ann)) return true;
  return false;
}
