// Every pledge on Full Fact's Government Tracker (data/fullFactPledges.json, written by scripts/fetch-fullfact-tracker.mjs), matched to this site's status
// labels. Pure, so it can be tested.

// Full Fact's verdict names, and the key each one has in data/promises.js.
export const STATUS_KEY = {
  achieved: "achieved",
  "appears-on-track": "on_track",
  "in-progress": "in_progress",
  "wait-and-see": "wait_see",
  "appears-off-track": "off_track",
  "not-kept": "not_kept",
  "unclear-or-disputed": "disputed",
};

export const pledgeUrl = (slug) => `https://fullfact.org/government-tracker/${slug}/`;

export function prepare(file) {
  return file.pledges.map((p) => ({ ...p, key: STATUS_KEY[p.status] ?? "disputed", url: pledgeUrl(p.slug) }));
}

export function countsByStatus(rows) {
  const out = {};
  for (const r of rows) out[r.key] = (out[r.key] ?? 0) + 1;
  return out;
}

export const areasOf = (rows) => [...new Set(rows.map((r) => r.area))].sort((a, b) => a.localeCompare(b));

export function filterPledges(rows, { query = "", status = "all", area = "all", sort = "area" } = {}) {
  const q = query.trim().toLowerCase();
  const out = rows.filter((r) => (status === "all" || r.key === status) && (area === "all" || r.area === area) && (!q || r.pledge.toLowerCase().includes(q) || r.area.toLowerCase().includes(q)));
  const order = ["not_kept", "off_track", "disputed", "wait_see", "in_progress", "on_track", "achieved"];
  const by = {
    area: (a, b) => a.area.localeCompare(b.area) || a.pledge.localeCompare(b.pledge),
    recent: (a, b) => b.updated.localeCompare(a.updated) || a.pledge.localeCompare(b.pledge),
    status: (a, b) => order.indexOf(a.key) - order.indexOf(b.key) || a.pledge.localeCompare(b.pledge),
  }[sort] ?? (() => 0);
  return out.sort(by);
}
