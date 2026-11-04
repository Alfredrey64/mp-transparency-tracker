// What the Laws made by ministers page works out from data/statutoryInstruments.json: the headline counts, the list of newest instruments with its filter and search, and the
// plain-words line for each card.

export const FILTERS = [["all", "All"], ["approve", "Parliament must approve"], ["object", "Goes ahead unless a House objects"]];

export function summary(data) {
  const sum = (route) => data.months.reduce((n, m) => n + m[route], 0);
  const approve = sum("approve");
  const object = sum("object");
  const total = approve + object;
  const monthly = data.months.map((m) => m.approve + m.object).sort((a, b) => a - b);
  const busiest = data.months.reduce((best, m) => (m.approve + m.object > best.approve + best.object ? m : best), data.months[0]);
  return {
    total,
    approve,
    object,
    shareApprove: total ? approve / total : 0,
    median: monthly.length ? monthly[Math.floor(monthly.length / 2)] : 0,
    busiest: { month: busiest.month, count: busiest.approve + busiest.object },
  };
}

// "2026-03" -> "March 2026".
export const monthName = (month) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export function browse(data, { filter = "all", query = "" } = {}) {
  const q = query.trim().toLowerCase();
  return data.recent.filter((r) => (filter === "all" || r.route === filter) && (!q || `${r.name} ${r.department ?? ""} ${r.ref ?? ""}`.toLowerCase().includes(q)));
}

export function describe(data, r, today) {
  const p = data.kinds[r.procedure];
  let force = "";
  if (r.inForce) force = r.inForce > today ? "comes into force on" : "came into force on";
  return { label: p.label, say: p.say, force };
}
