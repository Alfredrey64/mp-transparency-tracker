// calendarFeed.js
//
// Turns the Coming up data (frontend/src/data/parliamentCalendar.json, from Parliament's own What's On calendar) into calendar files that can be subscribed to from Apple
// Calendar, Google Calendar or Outlook. Pure functions, no network, so they can be tested. Written out by fetch-parliament-calendar.js every time the data is refreshed.
//
// Three feeds, so nobody has to take four weeks of committee hearings to get the bills:
//   bills     the stages of bills in either House, bill committees and Royal Assent
//   chambers  the above plus debates, questions and statements, and the days a House is away
//   all       everything listed, including committee hearings and regulations
//
// Times are the ones Parliament lists, in UK time. The calendar gives a start time and no end, so a timed item is shown as one hour long and the description says so;
// an item with no time (many bill stages are "after the main business") is an all-day item. Nothing is added to what Parliament lists except a plain-English line saying what
// the kind of item is.

const SITE = "https://domesdaylive.co.uk";
const HOUSE = { C: "Commons", L: "Lords", J: "Commons and Lords" };

export const FEEDS = {
  bills: { file: "parliament-bills.ics", name: "Bills in Parliament", kinds: ["bill", "billcommittee", "assent"], away: false, about: "Each stage a bill reaches in the Commons or Lords, bill committee meetings and Royal Assent." },
  chambers: { file: "parliament-chambers.ics", name: "Parliament: bills, debates and questions", kinds: ["bill", "billcommittee", "assent", "debate", "questions", "statement"], away: true, about: "Bill stages, debates, questions and statements in both Houses, and the days each House is away." },
  all: { file: "parliament-everything.ics", name: "Parliament: everything listed", kinds: null, away: true, about: "Everything the calendar lists, including committee hearings and regulations." },
};

const WHAT = {
  bill: "A stage of a bill in this House.",
  billcommittee: "A committee going through a bill line by line.",
  assent: "The King agrees a bill and it becomes an Act of Parliament.",
  debate: "A debate in the House or Westminster Hall.",
  questions: "Questions put to ministers.",
  statement: "A minister reports to the House.",
  hearing: "A committee taking evidence.",
  regs: "A committee or the House considering regulations (secondary legislation).",
};

// "Text" values in a calendar file: backslash, semicolon, comma and line breaks are escaped.
export const escapeText = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Lines longer than 75 bytes are folded onto a continuation line that starts with a space, without splitting a multi-byte character.
export function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let cur = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) { parts.push(cur); cur = ""; bytes = 0; limit = 74; }
    cur += ch;
    bytes += n;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => d.replaceAll("-", "");
const stamp = (t) => `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`;

// The moment a UK wall-clock time is, as a UTC Date. Britain is an hour ahead of UTC in summer, so the offset is worked out for that day rather than assumed.
export function ukToUtc(date, time) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return new Date(guess - (shown - guess));
}

// A short fixed-length hash, so an item keeps the same id every day and a calendar app updates it instead of adding it again.
function hash(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

const addDay = (d) => { const t = new Date(`${d}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };

function eventLines(e, generated) {
  const house = HOUSE[e.h] ?? "Parliament";
  const title = e.k === "bill" && e.stage ? `${e.t}: ${e.stage}` : e.t;
  const where = e.where ? `${house}, ${e.where}` : house;
  const desc = [WHAT[e.k], e.about ? `About: ${e.about}` : null, e.time ? "Parliament lists a start time but not an end time, so this is shown as one hour." : null, e.url ? `Bill page: ${e.url}` : null, `More on Domesday Live: ${SITE}/thisWeek/ahead`].filter(Boolean).join("\n");
  const lines = ["BEGIN:VEVENT", `UID:${hash(`${e.d}|${e.h}|${e.k}|${e.t}|${e.stage ?? ""}|${e.time ?? ""}|${e.where ?? ""}`)}@domesdaylive.co.uk`, `DTSTAMP:${ymd(generated)}T000000Z`];
  if (e.time) {
    const start = ukToUtc(e.d, e.time);
    lines.push(`DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 3600000))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${ymd(e.d)}`, `DTEND;VALUE=DATE:${ymd(addDay(e.d))}`);
  }
  lines.push(`SUMMARY:${escapeText(title)}`, `LOCATION:${escapeText(where)}`, `DESCRIPTION:${escapeText(desc)}`, "TRANSP:TRANSPARENT");
  if (e.url) lines.push(`URL:${e.url}`);
  lines.push("END:VEVENT");
  return lines;
}

function awayLines(a, generated) {
  return [
    "BEGIN:VEVENT",
    `UID:${hash(`away|${a.house}|${a.from}|${a.to}|${a.label}`)}@domesdaylive.co.uk`,
    `DTSTAMP:${ymd(generated)}T000000Z`,
    `DTSTART;VALUE=DATE:${ymd(a.from)}`,
    `DTEND;VALUE=DATE:${ymd(addDay(a.to))}`,
    `SUMMARY:${escapeText(`${a.house}: ${String(a.label).toLowerCase()}`)}`,
    `DESCRIPTION:${escapeText(`The ${a.house} is not sitting. More on Domesday Live: ${SITE}/thisWeek/ahead`)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

// One calendar file as text, lines ended with CRLF as the format requires. `data` is the parsed parliamentCalendar.json.
export function buildFeed(data, feedKey) {
  const feed = FEEDS[feedKey];
  if (!feed) throw new Error(`No feed called ${feedKey}`);
  const events = data.events.filter((e) => (feed.kinds ? feed.kinds.includes(e.k) : true)).sort((a, b) => `${a.d}${a.time ?? ""}${a.t}`.localeCompare(`${b.d}${b.time ?? ""}${b.t}`));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Domesday Live//Parliament calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(feed.name)}`,
    `X-WR-CALDESC:${escapeText(`${feed.about} From Parliament's What's On calendar, the next four weeks, refreshed daily. ${SITE}/thisWeek/ahead`)}`,
    "X-WR-TIMEZONE:Europe/London",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
  ];
  for (const e of events) lines.push(...eventLines(e, data.generated));
  if (feed.away) for (const a of data.away ?? []) lines.push(...awayLines(a, data.generated));
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function buildAllFeeds(data) {
  return Object.entries(FEEDS).map(([key, f]) => ({ key, file: f.file, text: buildFeed(data, key) }));
}
