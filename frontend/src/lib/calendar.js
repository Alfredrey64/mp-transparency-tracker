// A calendar file (.ics) from a list of dates, so the dates that matter before an election can sit in the person's own calendar with a reminder.
// All-day events only, built by hand to RFC 5545: lines end CRLF, text is escaped, long lines are folded at 75 bytes. Pure and tested.

const pad = (n) => String(n).padStart(2, "0");
const stamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const compact = (iso) => iso.replace(/-/g, "");

export const icsText = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Lines over 75 bytes continue on the next line after one space. Cut on characters, not through the middle of one.
export function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let cur = "";
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.map((l, i) => (i ? ` ${l}` : l)).join("\r\n");
}

const nextDay = (iso) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`; };

// events: [{ date: "2027-05-06", title, note?, remindDays? }]. Each gets a reminder `remindDays` days before (default 7, 0 for none).
export function buildIcs(events, { name = "Dates that matter for your votes", now = new Date() } = {}) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Simple Politics//Your area//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsText(name)}`];
  events.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "")).forEach((e, i) => {
    lines.push("BEGIN:VEVENT", `UID:${compact(e.date)}-${i}@simple-politics.vercel.app`, `DTSTAMP:${stamp(now)}`, `DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${nextDay(e.date)}`, `SUMMARY:${icsText(e.title)}`);
    if (e.note) lines.push(`DESCRIPTION:${icsText(e.note)}`);
    lines.push("TRANSP:TRANSPARENT");
    const days = e.remindDays ?? 7;
    if (days > 0) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(e.title)}`, `TRIGGER:-P${days}D`, "END:VALARM");
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

// The dates for the elections the page lists: polling day, and the deadlines that are still ahead, each with a plain-English title.
export function electionEvents(contests, council, today = new Date()) {
  const todayIso = today.toISOString().slice(0, 10);
  const out = [];
  for (const c of contests ?? []) {
    out.push({ date: c.date, title: `Polling day: ${c.title}`, note: [c.role, c.voterId ? "Take photo ID with you." : null, "Check your polling station at wheredoivote.co.uk."].filter(Boolean).join(" "), remindDays: 3 });
    for (const d of c.deadlines ?? []) if (d.key !== "close_of_nominations" && d.date >= todayIso) out.push({ date: d.date, title: `${d.label} (${c.title})`, note: "The deadline is for this election.", remindDays: 3 });
  }
  const next = council?.next?.[0]?.[0];
  if (next && next >= todayIso && !out.some((e) => e.date === next)) out.push({ date: next, title: `${council.name} council election`, note: "Check the exact date and what ID you need on gov.uk.", remindDays: 7 });
  return out.filter((e) => e.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date));
}

export function downloadIcs(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
