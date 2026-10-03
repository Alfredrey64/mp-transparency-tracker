// Turns the dated career detail (see careerDetail() in mpCareers.js at the
// repo root for the shape) into what the Career tab draws: swimlane rows, a
// chronological log, and a handful of summary figures. Pure, so each rule is
// tested against a hand-built career.

const DAY = 24 * 60 * 60 * 1000;
const YEAR = 365.25 * DAY;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const ms = (iso) => (iso ? Date.parse(iso) : null);
const yearOf = (iso) => (iso ? Number(iso.slice(0, 4)) : null);
const endOrNow = (end, now) => (end ? ms(end) : now);

// "June 1987", or "now" for something still going.
export function monthYear(iso) {
  if (!iso) return "now";
  return `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

// "2 yrs 5 mths", "8 months", "3 weeks": how long a spell lasted.
export function duration(startIso, endIso, now = Date.now()) {
  const span = endOrNow(endIso, now) - ms(startIso);
  if (!(span >= 0)) return "";
  const months = Math.round(span / (YEAR / 12));
  if (months >= 24) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m ? `${y} yrs ${m} mth${m === 1 ? "" : "s"}` : `${y} yrs`;
  }
  if (months >= 12) {
    const m = months - 12;
    return m ? `1 yr ${m} mth${m === 1 ? "" : "s"}` : "1 yr";
  }
  if (months >= 2) return `${months} months`;
  const weeks = Math.round(span / (7 * DAY));
  if (weeks >= 2) return `${weeks} weeks`;
  const days = Math.max(1, Math.round(span / DAY));
  return `${days} day${days === 1 ? "" : "s"}`;
}

// Total years covered by a set of [start, end] spells, counting overlaps once.
export function unionYears(spans, now = Date.now()) {
  const sorted = spans
    .filter((s) => s[0])
    .map((s) => [ms(s[0]), endOrNow(s[1], now)])
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur = null;
  for (const [a, b] of sorted) {
    if (!cur) cur = [a, b];
    else if (a <= cur[1]) cur[1] = Math.max(cur[1], b);
    else {
      total += cur[1] - cur[0];
      cur = [a, b];
    }
  }
  if (cur) total += cur[1] - cur[0];
  return total / YEAR;
}

// Seat spells in the biography are split wherever the boundaries changed,
// so one long run for the same seat can arrive as several rows. Join rows
// for the same seat that follow on from each other.
export function mergeSeats(seats) {
  const out = [];
  for (const [name, start, end, elected] of seats) {
    const prev = out[out.length - 1];
    if (prev && prev.name === name && prev.end && start && ms(start) - ms(prev.end) <= 400 * DAY) {
      prev.end = end;
      prev.elected += elected;
    } else {
      out.push({ name, start, end, elected });
    }
  }
  return out;
}

// Gives each item a row so that none overlap another in the same row:
// the first row that is free by the time it starts. Items need ms start/end.
export function packRows(items) {
  const rowEnds = [];
  const placed = [...items]
    .sort((a, b) => a.from - b.from || a.to - b.to)
    .map((item) => {
      let row = rowEnds.findIndex((end) => end <= item.from);
      if (row === -1) row = rowEnds.length;
      rowEnds[row] = item.to;
      return { ...item, row };
    });
  return { items: placed, rows: Math.max(1, rowEnds.length) };
}

const spellItems = (list, make, now) => list.filter((r) => ms(make(r).start)).map((r) => {
  const m = make(r);
  const from = ms(m.start);
  const to = Math.max(endOrNow(m.end, now), from + 20 * DAY);
  return { ...m, from, to, ongoing: !m.end };
});

// The swimlanes: one entry per lane, each with its packed bars.
export function buildLanes(detail, now = Date.now()) {
  const lanes = [
    { key: "commons", label: "In the Commons", items: spellItems(detail.h, (r) => ({ label: "MP", start: r[0], end: r[1] }), now) },
    { key: "seat", label: "Seat", items: spellItems(mergeSeats(detail.s), (r) => ({ label: r.name, start: r.start, end: r.end, note: r.elected ? `Elected ${r.elected} time${r.elected === 1 ? "" : "s"}` : "" }), now) },
    { key: "party", label: "Party", items: spellItems(detail.p, (r) => ({ label: r[0], start: r[1], end: r[2] }), now) },
    { key: "gov", label: "Government", items: spellItems(detail.g, (r) => ({ label: r[0], note: r[1], start: r[2], end: r[3] }), now) },
    { key: "opp", label: "Shadow front bench", items: spellItems(detail.o, (r) => ({ label: r[0], note: r[1], start: r[2], end: r[3] }), now) },
    { key: "other", label: "Other posts", items: spellItems(detail.x, (r) => ({ label: r[0], start: r[1], end: r[2] }), now) },
    { key: "committee", label: "Committees", items: spellItems(detail.c, (r) => ({ label: r[0], note: r[3], start: r[1], end: r[2] }), now) },
  ];
  return lanes
    .filter((l) => l.items.length)
    .map((l) => {
      // The Commons, seat and party lanes are each one continuous line, so
      // they need only one row; posts can overlap and get packed.
      const packed = packRows(l.items);
      return { ...l, items: packed.items, rows: packed.rows };
    });
}

// Left and right edge of the chart: from a round year before the first thing
// that happened to now.
export function chartRange(lanes, now = Date.now()) {
  const all = lanes.flatMap((l) => l.items);
  if (!all.length) return { from: now - 10 * YEAR, to: now };
  const first = new Date(Math.min(...all.map((i) => i.from))).getUTCFullYear();
  const from = Date.UTC(first - (first % 5), 0, 1);
  return { from, to: Math.max(now, ...all.map((i) => i.to)) };
}

export function axisTicks(range) {
  const years = (range.to - range.from) / YEAR;
  const step = years > 40 ? 10 : years > 18 ? 5 : years > 8 ? 2 : 1;
  const startYear = new Date(range.from).getUTCFullYear();
  const endYear = new Date(range.to).getUTCFullYear();
  const ticks = [];
  for (let y = startYear; y <= endYear; y += step) {
    const at = Date.UTC(y, 0, 1);
    if (at >= range.from && at <= range.to) ticks.push({ year: y, at });
  }
  return ticks;
}

// Everything that happened, as a dated log. `kind` drives the chip.
export function buildEvents(detail) {
  const events = [];
  const add = (kind, start, end, title, sub, extra = {}) => {
    if (!start) return;
    events.push({ kind, start, end: end ?? null, ongoing: !end, title, sub: sub ?? null, years: yearOf(start), ...extra });
  };

  for (const seat of mergeSeats(detail.s)) {
    add("seat", seat.start, seat.end, `MP for ${seat.name}`, seat.elected ? `Elected ${seat.elected} time${seat.elected === 1 ? "" : "s"} in this spell` : null);
  }
  detail.p.forEach(([party, start, end], i) => {
    const prev = detail.p[i - 1];
    add("party", start, end, i === 0 ? `Joined ${party}` : party === "Independent" ? "Became an independent" : `Became ${party}`, prev ? `Previously ${prev[0]}` : null);
  });
  for (const [post, dept, start, end] of detail.g) add("gov", start, end, post, dept);
  for (const [post, dept, start, end] of detail.o) add("opp", start, end, post, dept);
  for (const [post, start, end] of detail.x) add("other", start, end, post, null);
  for (const [name, start, end, role] of detail.c) add("committee", start, end, name, role);
  for (const [seat, date] of detail.l) add("lost", date, date, `Stood for ${seat} and lost`, null, { ongoing: false });

  return events.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

export const EVENT_KINDS = [
  { key: "seat", label: "Seats", colour: "#4F46E5" },
  { key: "party", label: "Party", colour: "#8A6D3B" },
  { key: "gov", label: "Government", colour: "#1FA97C" },
  { key: "opp", label: "Shadow front bench", colour: "#E8A33D" },
  { key: "other", label: "Other posts", colour: "#7B6CF0" },
  { key: "committee", label: "Committees", colour: "#2F8FBF" },
  { key: "lost", label: "Lost elections", colour: "#C2415D" },
];

// Headline figures for the top of the tab.
export function summarise(detail, now = Date.now()) {
  const seats = mergeSeats(detail.s);
  const firstStart = detail.h[0]?.[0] ?? seats[0]?.start ?? null;
  const party = detail.p;
  const switches = party.filter((p, i) => i > 0 && p[0] !== party[i - 1][0]).length;
  const longest = [...detail.g, ...detail.o.map((o) => [o[0], o[1], o[2], o[3]])]
    .filter((p) => p[2])
    .map((p) => ({ post: p[0], years: (endOrNow(p[3], now) - ms(p[2])) / YEAR }))
    .sort((a, b) => b.years - a.years)[0] ?? null;
  const departments = new Set(detail.g.map((p) => p[1]).filter(Boolean));
  return {
    firstElected: firstStart,
    yearsInCommons: unionYears(detail.h.length ? detail.h : seats.map((s) => [s.start, s.end]), now),
    electionsWon: detail.s.reduce((n, s) => n + s[3], 0),
    electionsLost: detail.l.length,
    seats: [...new Set(seats.map((s) => s.name))],
    governmentYears: unionYears(detail.g.map((p) => [p[2], p[3]]), now),
    governmentPosts: detail.g.length,
    departments: departments.size,
    shadowYears: unionYears(detail.o.map((p) => [p[2], p[3]]), now),
    shadowPosts: detail.o.length,
    committees: detail.c.length,
    committeesNow: detail.c.filter((c) => !c[2]).length,
    partyChanges: switches,
    longestRole: longest,
  };
}

// A few plain sentences telling the story. Written without pronouns, so it
// reads the same for everyone.
export function careerStory(name, detail, now = Date.now()) {
  const s = summarise(detail, now);
  const lines = [];
  if (s.firstElected) {
    const seats = s.seats;
    const seatText = seats.length === 0 ? "" : seats.length === 1 ? ` for ${seats[0]}` : `, first for ${seats[0]} and now for ${seats[seats.length - 1]}`;
    lines.push(`${name} has been an MP${seatText} since ${monthYear(s.firstElected)}, ${s.yearsInCommons >= 1 ? `about ${Math.round(s.yearsInCommons)} years in the Commons` : "less than a year in the Commons"}.`);
  }
  if (s.electionsWon || s.electionsLost) {
    lines.push(`${s.electionsWon} election${s.electionsWon === 1 ? "" : "s"} won${s.electionsLost ? ` and ${s.electionsLost} lost` : ""} on record.`);
  }
  if (s.governmentPosts) lines.push(`Held ${s.governmentPosts} government post${s.governmentPosts === 1 ? "" : "s"} over about ${Math.max(1, Math.round(s.governmentYears))} year${Math.round(s.governmentYears) <= 1 ? "" : "s"}${s.departments > 1 ? `, across ${s.departments} departments` : ""}.`);
  if (s.shadowPosts) lines.push(`Held ${s.shadowPosts} shadow front-bench post${s.shadowPosts === 1 ? "" : "s"}.`);
  if (s.partyChanges) lines.push(`Party membership has changed ${s.partyChanges} time${s.partyChanges === 1 ? "" : "s"}, counting spells as an independent.`);
  return lines;
}

// Parties by name, for colouring the party lane. Unknown parties get a
// neutral colour picked from a fixed palette by name, so a party is the
// same colour every time it appears.
export const PARTY_COLOURS = {
  Labour: "#d50000",
  "Labour (Co-op)": "#d50000",
  Conservative: "#0063ba",
  "Liberal Democrat": "#fc7d0b",
  "Scottish National Party": "#d9b900",
  "Green Party": "#78b82a",
  "Plaid Cymru": "#348837",
  "Reform UK": "#12b6cf",
  "Democratic Unionist Party": "#d46a4c",
  "Sinn Féin": "#02665f",
  "Ulster Unionist Party": "#6ba3d6",
  "Social Democratic & Labour Party": "#4ea268",
  Alliance: "#cdaf2d",
  "Your Party": "#ff3131",
  Independent: "#909090",
  Speaker: "#909090",
};
const FALLBACKS = ["#8E6BBF", "#B0734A", "#4D8F8B", "#9A6A8A", "#6F8A3D", "#A66A3B"];

export function partyColourByName(name) {
  if (PARTY_COLOURS[name]) return PARTY_COLOURS[name];
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACKS[h % FALLBACKS.length];
}
