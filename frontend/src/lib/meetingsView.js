// Small helpers for the Ministers' meetings page.

const UTC = { timeZone: "UTC" };

export function monthLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { month: "long", year: "numeric", ...UTC });
}

export function dayParts(dateStr) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-GB", { day: "numeric", ...UTC }),
    weekday: d.toLocaleDateString("en-GB", { weekday: "short", ...UTC }),
  };
}

// "Department for Work and Pensions" reads better in a row as "Work and Pensions".
export function shortDepartment(name) {
  return name.replace(/^(Department|Ministry) (for|of) (the )?/i, "");
}

// Roundtables can list a dozen attendees in one comma-separated string. This
// splits them so the page can show the first few and keep the rest a tap away.
export function splitAttendees(organisation, show = 3) {
  const all = organisation.split(",").map((n) => n.trim()).filter(Boolean);
  if (all.length <= show + 1) return { shown: all, rest: [], total: all.length };
  return { shown: all.slice(0, show), rest: all.slice(show), total: all.length };
}

// [[name, count], …] most first, ties in first-seen order.
export function tally(items, pick) {
  const counts = new Map();
  for (const it of items) counts.set(pick(it), (counts.get(pick(it)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
