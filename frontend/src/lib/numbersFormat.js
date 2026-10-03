// Small helpers shared by the Commons and Lords halves of Parliament in Numbers.

export const fmt = (n) => n.toLocaleString("en-GB");
export const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
export const pct0 = (n) => `${Math.round(n)}%`;
export const joinNames = (n) => (n.length <= 2 ? n.join(" and ") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);
export const family = (n) => String(n ?? "").replace(/\s*\(Co-op\)\s*$/i, "").trim();
export const surname = (n) => String(n ?? "").trim().split(/\s+/).pop().toLowerCase();
export const byName = (a, b) => surname(a.name).localeCompare(surname(b.name)) || a.name.localeCompare(b.name);
export const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
export const leadText = (pct) => `${pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}% lead`;
export const goMp = (id) => {
  window.location.hash = `#/mp/${id}`;
};
export const goSeat = (name) => {
  window.location.hash = `#/constituency/${encodeURIComponent(name)}`;
};
export const EDGE = { people: "#4F46E5", careers: "#1FA97C", seats: "#E8A33D", change: "#E0367A" };
export const COLUMNS = "minmax(120px, 190px) minmax(0, 1fr) 118px";
