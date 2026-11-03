// What the Coming up in Parliament page draws, worked out from data/parliamentCalendar.json (see parliamentCalendar.js at the repo root). Pure functions.

const parse = (d) => new Date(`${d}T12:00:00Z`);
const iso = (t) => t.toISOString().slice(0, 10);
const addDays = (d, n) => { const t = parse(d); t.setUTCDate(t.getUTCDate() + n); return iso(t); };

// "Tue 10 Nov", and the long form "Tuesday 10 November".
export const dayShort = (d) => parse(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const dayLong = (d) => parse(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
export const dateLong = (d) => parse(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const weekday = (d) => parse(d).getUTCDay();

// "14:30" -> "2.30pm".
export function clock(time) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
  if (!m) return "";
  const h = Number(m[1]);
  const mins = m[2] === "00" ? "" : `.${m[2]}`;
  return `${h % 12 || 12}${mins}${h >= 12 ? "pm" : "am"}`;
}

const HOUSES = { C: "Commons", L: "Lords", J: "Joint" };
export const houseName = (h) => HOUSES[h] ?? "Commons";

// What each house is doing on one weekday: "recess", "off" (a Friday or other day it is not sitting), "sitting", or "weekend". The calendar lists the days a house is
// away; a weekday it does not list is a sitting day.
export function statusOn(date, house, away) {
  const dow = weekday(date);
  if (dow === 0 || dow === 6) return "weekend";
  const hit = away.find((a) => a.house === house && a.from <= date && date <= a.to);
  if (!hit) return "sitting";
  return hit.label === "Recess" ? "recess" : "off";
}

// The four weeks (Monday to Friday) the file covers, each day with what both houses are doing and how many items are listed for it.
export function weeks(data) {
  const counts = new Map();
  for (const e of data.events) if (e.k !== "hearing" && e.k !== "billcommittee") counts.set(e.d, (counts.get(e.d) ?? 0) + 1);
  const start = addDays(data.from, -((weekday(data.from) + 6) % 7));
  const out = [];
  for (let s = start; s <= data.to; s = addDays(s, 7)) {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = addDays(s, i);
      const inside = date >= data.from && date <= data.to;
      days.push({ date, inside, C: statusOn(date, "Commons", data.away), L: statusOn(date, "Lords", data.away), n: counts.get(date) ?? 0 });
    }
    out.push({ start: s, days });
  }
  return out;
}

// Each bill with the stages due in the window: [{ bill, url, stages: [{ d, h, stage }] }], earliest first.
export function billStages(data) {
  const by = new Map();
  for (const e of data.events) {
    if (e.k !== "bill") continue;
    const row = by.get(e.t) ?? { bill: e.t, url: e.url ?? null, stages: [] };
    if (!row.url && e.url) row.url = e.url;
    row.stages.push({ d: e.d, h: e.h, stage: e.stage });
    by.set(e.t, row);
  }
  return [...by.values()].sort((a, b) => a.stages[0].d.localeCompare(b.stages[0].d) || a.bill.localeCompare(b.bill));
}

// Bills going through a committee of MPs, line by line: [{ bill, sittings }].
export function billCommittees(data) {
  const by = new Map();
  for (const e of data.events) if (e.k === "billcommittee") by.set(e.t, (by.get(e.t) ?? 0) + 1);
  return [...by].map(([bill, sittings]) => ({ bill, sittings })).sort((a, b) => a.bill.localeCompare(b.bill));
}

// Select committees taking evidence, grouped by committee and inquiry: [{ committee, about, house, dates: [{ d, time }] }], soonest first.
export function hearings(data) {
  const by = new Map();
  for (const e of data.events) {
    if (e.k !== "hearing") continue;
    const key = `${e.t}|${e.about ?? ""}`;
    const row = by.get(key) ?? { committee: e.t, about: e.about ?? "", house: e.h, dates: [] };
    row.dates.push({ d: e.d, time: e.time });
    by.set(key, row);
  }
  return [...by.values()].sort((a, b) => a.dates[0].d.localeCompare(b.dates[0].d) || a.committee.localeCompare(b.committee));
}

// Oral questions in the Commons by day: the department whose ministers answer, and the Prime Minister's Questions. [{ d, items: [{ t, time }] }].
export function commonsQuestions(data) {
  const by = new Map();
  for (const e of data.events) {
    if (e.k !== "questions" || e.h !== "C") continue;
    const list = by.get(e.d) ?? [];
    list.push({ t: e.t.replace(/\s*\(including Topical Questions\)\s*/i, " (with topical questions)").trim(), time: e.time });
    by.set(e.d, list);
  }
  return [...by].map(([d, items]) => ({ d, items: items.sort((a, b) => (a.time || "99").localeCompare(b.time || "99")) })).sort((a, b) => a.d.localeCompare(b.d));
}

// Debates and statements: the main chamber business the Commons and Lords have listed, by day.
export function debates(data) {
  const by = new Map();
  for (const e of data.events) {
    if (e.k !== "debate" && e.k !== "statement") continue;
    const list = by.get(e.d) ?? [];
    list.push({ t: e.t, h: e.h, where: e.where ?? "", time: e.time, k: e.k });
    by.set(e.d, list);
  }
  return [...by].map(([d, items]) => ({ d, items })).sort((a, b) => a.d.localeCompare(b.d));
}

// How many separate things the window holds, for the figures at the top of the page.
export function totals(data) {
  const bills = billStages(data);
  return {
    bills: bills.length,
    stages: bills.reduce((n, b) => n + b.stages.length, 0),
    hearings: data.events.filter((e) => e.k === "hearing").length,
    committees: new Set(data.events.filter((e) => e.k === "hearing").map((e) => e.t)).size,
    debates: data.events.filter((e) => e.k === "debate").length,
    sittingDays: weeks(data).flatMap((w) => w.days).filter((d) => d.inside && d.C === "sitting").length,
  };
}

// The first recess that has not ended, for either house: { house, from, to } or null.
export function nextRecess(data, today) {
  return data.away.filter((a) => a.label === "Recess" && a.to >= today).sort((a, b) => a.from.localeCompare(b.from))[0] ?? null;
}

// Fewer days than a full week of listings means the calendar has not been filled in yet for those days.
export function thinWeeks(data) {
  return weeks(data).filter((w) => w.days.filter((d) => d.inside && d.C === "sitting").every((d) => d.n === 0) && w.days.some((d) => d.inside && d.C === "sitting")).length;
}

// Today's date in London as "2026-11-03", for picking out what is listed for today.
export const londonToday = (now = new Date()) => now.toLocaleDateString("en-CA", { timeZone: "Europe/London" });

// What is listed for one day: whether each house sits, and the business under each heading, soonest first. `inRange` is false when the calendar does not cover the day
// (the file is a few days old, say), so the page can say so instead of claiming nothing is on.
export function dayView(data, date) {
  const by = (kinds) => data.events.filter((e) => e.d === date && kinds.includes(e.k)).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  return {
    date,
    inRange: date >= data.from && date <= data.to,
    commons: statusOn(date, "Commons", data.away),
    lords: statusOn(date, "Lords", data.away),
    business: by(["debate", "statement"]),
    questions: by(["questions"]).filter((e) => e.h === "C"),
    bills: by(["bill"]),
    hearings: by(["hearing"]),
  };
}

// The next weekday after `date` that has anything listed, as { date, n }, or null when the calendar has nothing later.
export function nextBusyDay(data, date) {
  const counts = new Map();
  for (const e of data.events) if (e.d > date) counts.set(e.d, (counts.get(e.d) ?? 0) + 1);
  const days = [...counts].sort((a, b) => a[0].localeCompare(b[0]));
  return days.length ? { date: days[0][0], n: days[0][1] } : null;
}
