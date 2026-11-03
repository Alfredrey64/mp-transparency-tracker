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

// One report put into plain words for its card: where it stands, one sentence saying so, and the points for its progress bar (as percentages along the line from the day the
// report came out to the latest of the deadline, the reply and today).
export function describe(report, today) {
  const status = statusOf(report, today);
  const reply = report.replies[0]?.date ?? null;
  const end = [report.due, reply ?? today].sort().pop();
  const span = Math.max(1, daysBetween(report.date, end));
  const at = (d) => Math.min(100, Math.max(0, (daysBetween(report.date, d) / span) * 100));
  const days = (n) => `${n} day${n === 1 ? "" : "s"}`;
  let label;
  let say;
  if (status === "ontime") {
    label = "Answered on time";
    say = `The government replied ${days(daysBetween(report.date, reply))} after the report, before the deadline.`;
  } else if (status === "late") {
    const late = daysBetween(report.due, reply);
    label = `Answered ${days(late)} late`;
    say = `The government replied ${days(daysBetween(report.date, reply))} after the report, ${days(late)} after the deadline.`;
  } else if (status === "waiting") {
    const left = daysBetween(today, report.due);
    label = left === 0 ? "Reply due today" : `Reply due in ${days(left)}`;
    say = "The government has not replied yet. It has until the deadline.";
  } else {
    const over = daysBetween(report.due, today);
    label = `${days(over)} overdue`;
    say = "The deadline has passed and Parliament lists no reply. A reply may have been sent in another form that is not linked to the report.";
  }
  return { status, label, say, dueAt: at(report.due), replyAt: reply ? at(reply) : null, todayAt: reply ? null : at(today), fill: reply ? at(reply) : at(today) };
}

// The reports a filter keeps ("all", "waiting" for not yet due, "overdue", "answered", "late") and a committee-name search, newest first.
export function browse(data, { filter = "all", query = "" } = {}, today = data.generated) {
  const q = query.trim().toLowerCase();
  return data.reports
    .filter((r) => {
      const s = statusOf(r, today);
      if (filter === "answered" && !(s === "ontime" || s === "late")) return false;
      if (filter !== "all" && filter !== "answered" && s !== filter) return false;
      return !q || `${r.title} ${r.committee} ${r.inquiry ?? ""}`.toLowerCase().includes(q);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.committee.localeCompare(b.committee));
}
