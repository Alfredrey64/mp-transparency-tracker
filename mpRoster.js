// mpRoster.js
//
// The MPs table is added to every day (fetch-interests.js) from the Members API's list of current MPs. When an MP leaves (resigns, dies, is replaced at a
// by-election) their profile no longer belongs in the lists of sitting MPs: their declared interests, votes and news come out, and so does the row, so the
// site counts 650 MPs for 650 seats. Their name stays in the history: the Former MPs page (fetch-former-mps.js), the seat's history, the governments they were
// in. Anything that is a record in its own right, a standards report or a ministerial gift, is not deleted: an MP with one of those is left in place and
// reported, for a person to look at.
//
// Nothing is removed if the list of current MPs looks wrong (too short, or far too many leavers at once), since that would mean the lookup failed,
// not that dozens of MPs left on the same day.

// The tables that hold what the site shows about a sitting MP, one row each per MP id, taken out with the profile.
export const PROFILE_TABLES = ["financial_interests", "voting_records", "written_questions", "mp_news"];
// The tables whose rows are records in themselves: they keep their MP, and stop that MP being removed.
export const RECORD_TABLES = ["standards_reports", "ministerial_gifts"];
export const MIN_CURRENT = 600;
export const MAX_REMOVALS = 15;

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

// Who to take out: the rows no longer on the current list, unless the list itself looks wrong. Returns { remove, reason }, where `reason` says why nothing
// is being removed (or is "" when it is safe to go ahead).
export function removalPlan(rows, currentIds, { minCurrent = MIN_CURRENT, maxRemovals = MAX_REMOVALS } = {}) {
  const current = new Set([...currentIds].map(Number));
  const stale = staleRows(rows, current);
  if (current.size < minCurrent) return { remove: [], reason: `only ${current.size} current MPs came back, which is too few to trust, so nobody was removed` };
  if (stale.length > maxRemovals) return { remove: [], reason: `${stale.length} MPs look as if they have left, which is more than ${maxRemovals} at once, so nobody was removed` };
  return { remove: stale, reason: "" };
}
