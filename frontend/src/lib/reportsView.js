// What the Committee reports and replies page shows, worked out from data/committeeReports.json (see committeeReports.js in the project root). Pure functions.

const dayNumber = (d) => Math.round(Date.parse(`${d}T00:00:00Z`) / 86400000);
export const daysBetween = (a, b) => dayNumber(b) - dayNumber(a);
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

// "replied" once any reply is published, split by whether the first came by the deadline; otherwise "waiting" while the deadline has not passed, "overdue" after.
export function statusOf(report, today) {
  if (report.replies.length) return report.replies[0].date <= report.due ? "ontime" : "late";
  return report.due >= today ? "waiting" : "overdue";
}

export function summary(data, today = data.generated) {
  const by = { ontime: 0, late: 0, waiting: 0, overdue: 0 };
  const waits = [];
  const lates = [];
  for (const r of data.reports) {
    const s = statusOf(r, today);
    by[s] += 1;
    if (r.replies.length) {
      waits.push(daysBetween(r.date, r.replies[0].date));
      if (s === "late") lates.push(daysBetween(r.due, r.replies[0].date));
    }
  }
  const due = data.reports.length - by.waiting;
  return { total: data.reports.length, ...by, due, answered: by.ontime + by.late, medianWait: median(waits), medianLate: median(lates), share: due ? (by.ontime + by.late) / due : 0 };
}

// Committees ranked by how many of their reports are still unanswered after the deadline: [{ committee, reports, answered, overdue }].
export function byCommittee(data, today = data.generated) {
  const map = new Map();
  for (const r of data.reports) {
    if (r.due >= today && !r.replies.length) continue;
    const row = map.get(r.committee) ?? { committee: r.committee, reports: 0, answered: 0, overdue: 0 };
    row.reports += 1;
    if (r.replies.length) row.answered += 1; else row.overdue += 1;
    map.set(r.committee, row);
  }
  return [...map.values()].sort((a, b) => b.overdue - a.overdue || b.reports - a.reports || a.committee.localeCompare(b.committee));
}

// Reports whose reply is past due, longest overdue first, with how many days overdue.
export function overdue(data, today = data.generated) {
  return data.reports.filter((r) => statusOf(r, today) === "overdue").map((r) => ({ ...r, daysOver: daysBetween(r.due, today) })).sort((a, b) => b.daysOver - a.daysOver || a.committee.localeCompare(b.committee));
}

// The replies published most recently: the report and how long the reply took.
export function recentReplies(data, n = 8) {
  return data.reports.filter((r) => r.replies.length).map((r) => ({ ...r, took: daysBetween(r.date, r.replies[0].date), replied: r.replies[0].date })).sort((a, b) => b.replied.localeCompare(a.replied)).slice(0, n);
}
