// mpRoster.js
//
// The MPs table is added to every day (fetch-interests.js) from the Members API's list of current MPs, but nothing takes anyone out of it. When an
// MP leaves (resigns, dies, is replaced at a by-election) their row stays beside their successor's, and the site counts both: 651 MPs for 650 seats.
//
// This only finds those rows; it changes nothing. Whether to delete them or keep them for the Former MPs page is a decision about the database,
// so it is left to a person, who is told by a warning in the run's log.

// Rows of the MPs table whose Parliament member id is not on today's list of current MPs.
export function staleRows(rows, currentIds) {
  const current = new Set([...currentIds].map(Number));
  return (rows ?? []).filter((r) => !current.has(Number(r.parliament_member_id)));
}

// What to print, in the form GitHub shows as a warning on the run; an empty string when there is nothing to say.
export function staleWarning(stale) {
  if (!stale.length) return "";
  const list = stale.map((r) => `${r.name} (${r.constituency ?? "no seat"})`).join("; ");
  return `::warning title=MPs who have left are still in the MPs table::${stale.length} row${stale.length === 1 ? "" : "s"} no longer on the current list: ${list}`;
}
