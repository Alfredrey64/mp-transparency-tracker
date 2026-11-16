// staleNotice.js
//
// A sentence for a page whose data file is refreshed by a script every day, to show when the script has been unable to refresh it for a few days (the publisher is down,
// say). Left out while the data is recent, so a healthy page says nothing extra. Pure, so it can be tested.

const DAY = 86_400_000;

// Whole days between an ISO date ("2026-11-09" or a full timestamp) and `now` (milliseconds). null when the date cannot be read.
export function daysOld(iso, now) {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor((now - t) / DAY) : null;
}

// `source` is the publisher in plain words ("Parliament's Statutory Instruments service"); `after` is how many days old the data may get before the page says so.
export function staleNotice(iso, now, { source, after = 3 } = {}) {
  const days = daysOld(iso, now);
  if (days === null || days <= after) return null;
  const when = new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `This page was last updated on ${when}. ${source ?? "The publisher"} has not given the site anything newer for ${days} days, so anything published since is not shown yet. It is tried again every day and catches up by itself.`;
}
