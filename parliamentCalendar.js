// parliamentCalendar.js
//
// Turns Parliament's What's On calendar into the short list the Coming up page shows: what is due in the Commons and Lords chambers, in committees and in
// Westminster Hall over the next few weeks, and the days MPs and peers are away. Pure functions, no network, so they can be tested.
//
// Private committee meetings, cancelled events and housekeeping items (introductions of new peers, the estimated rising time) are left out. No member's name is kept:
// the page says what is happening, not who is speaking.

const HOUSE = { Commons: "C", Lords: "L", Joint: "J" };

// What each calendar category becomes. "bill" events are the stages of a bill; "hearing" is a committee taking evidence; "billcommittee" is a committee going through a
// bill line by line; "debate" is any debate or motion; "questions" is oral questions, including Prime Minister's Questions.
const KIND = {
  Legislation: "bill",
  "Oral evidence": "hearing",
  "Westminster Hall debate": "debate",
  Debate: "debate",
  "Opposition Day Debate": "debate",
  "Backbench Business": "debate",
  "Ten Minute Rule Motion": "debate",
  "Private Members' Bills": "debate",
  Adjournment: "debate",
  "Oral questions": "questions",
  "Prime Minister's Question Time": "questions",
  "Business Statement": "questions",
  "Ministerial statement": "statement",
  Statement: "statement",
  "Orders and regulations": "regs",
  "Royal Assent": "assent",
};

const clean = (s) => String(s ?? "").replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, " ").trim();
const day = (iso) => String(iso ?? "").slice(0, 10);

// "Housing Bill - committee stage (day 4)" -> { bill: "Housing Bill", stage: "committee stage (day 4)" }. The calendar writes the stage after a colon or a dash.
export function splitStage(description) {
  const text = clean(description);
  const m = text.match(/^(.*?)\s*(?::|\s-\s)\s*(.+)$/);
  return m ? { bill: m[1], stage: m[2] } : { bill: text, stage: "" };
}

// The place an event sits: the room it is in, for events that are not in a main chamber.
function placeOf(e) {
  const where = String(e.SummarisedDetails ?? "").replace(/\\n/g, "\n").split("\n").map(clean).filter(Boolean)[0] ?? "";
  if (/Westminster Hall/i.test(where)) return "Westminster Hall";
  if (/Grand Committee/i.test(where)) return "Grand Committee";
  if (/General Committee/i.test(where)) return "General Committee";
  return "";
}

// One calendar event in, one compact entry out, or null for an event the page does not show.
export function tidyEvent(e) {
  if (!e || e.CancelledDate) return null;
  const kind = KIND[e.Category];
  if (!kind) return null;
  const date = day(e.StartDate);
  if (!date) return null;
  const place = placeOf(e);
  const out = { d: date, h: HOUSE[e.House] ?? "C", k: kind, time: clean(e.StartTime) };
  if (place) out.where = place;
  if (kind === "hearing" || e.Committee) {
    const committee = clean(e.Committee?.Description);
    if (!committee) return null;
    // A committee going through a bill line by line is filed under the bill's name, so it is a different kind of entry from a committee taking evidence.
    if (place === "General Committee") {
      out.t = committee;
      out.k = /Delegated Legislation Committee$/i.test(committee) ? "regs" : "billcommittee";
      return out;
    }
    out.t = committee;
    const inquiry = clean(e.Committee?.Inquiries?.[0]?.Description);
    if (inquiry) out.about = inquiry;
    return out;
  }
  if (kind === "bill") {
    const { bill, stage } = splitStage(e.Description);
    out.t = clean(e.BillName) || bill;
    out.stage = stage;
    if (/^https:\/\/bills\.parliament\.uk\//.test(e.BillPageLink ?? "")) out.url = e.BillPageLink;
    return out;
  }
  const title = clean(e.Description);
  if (e.Category === "Prime Minister's Question Time") out.t = "Prime Minister's Questions";
  else if (title) out.t = title;
  else return null;
  if (e.Category === "Private Members' Bills") out.t = title.replace(/:\s*Second Reading$/i, "");
  return out;
}

// A run of non-sitting days, as the calendar describes it: { house, from, to, label }. Fridays the Commons does not sit are listed separately from recesses.
export function tidyBreak(e) {
  const from = day(e.StartDate);
  const to = day(e.EndDate) || from;
  const house = /Lords/.test(e.Category ?? "") ? "Lords" : /Commons/.test(e.Category ?? "") ? "Commons" : e.House === "Lords" ? "Lords" : "Commons";
  const label = /Friday/i.test(e.Category ?? "") ? "Not sitting" : /Recess/i.test(e.Category ?? "") ? "Recess" : clean(e.Category).replace(/\s*-\s*(Commons|Lords)\s*$/i, "");
  return from ? { house, from, to, label } : null;
}

// The order entries are shown in within one day: the main business first, then committees.
const ORDER = { questions: 0, statement: 1, bill: 2, debate: 3, regs: 4, assent: 5, billcommittee: 6, hearing: 7 };
export const byDay = (a, b) => a.d.localeCompare(b.d) || (a.time || "99").localeCompare(b.time || "99") || ORDER[a.k] - ORDER[b.k] || a.t.localeCompare(b.t);

// Everything the fetch script collected, as the file the page reads. `events` and `breaks` are raw calendar rows. Repeats (the same event listed twice by overlapping
// windows) are dropped.
export function summariseCalendar(events, breaks, { from, to, generated }) {
  const seen = new Set();
  const list = [];
  for (const e of events) {
    const t = tidyEvent(e);
    if (!t || t.d < from || t.d > to) continue;
    const key = [t.d, t.h, t.k, t.t, t.time, t.about ?? "", t.stage ?? ""].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(t);
  }
  list.sort(byDay);
  const away = [];
  const seenBreak = new Set();
  for (const e of breaks) {
    const b = tidyBreak(e);
    if (!b || b.to < from || b.from > to) continue;
    const key = `${b.house}|${b.from}|${b.to}|${b.label}`;
    if (seenBreak.has(key)) continue;
    seenBreak.add(key);
    away.push(b);
  }
  away.sort((a, b) => a.from.localeCompare(b.from) || a.house.localeCompare(b.house));
  return { generated, from, to, away, events: list };
}
