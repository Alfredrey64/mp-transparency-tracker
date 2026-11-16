// The rules behind the weekly content check (scripts/audit-content.mjs), kept apart so they can be tested without a network or a file system.

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

// "30 October 2026" -> a Date, or null.
export function parseLongDate(text) {
  const m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(String(text ?? "").trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  return month < 0 ? null : new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
}

const days = (from, to) => Math.floor((to - from) / 86400000);

// A page of facts says when its figures were last checked against their sources. Past `limit` days it is due for another look.
export function staleExplainers(pages, now, limit = 60) {
  return pages.flatMap((p) => {
    const d = parseLongDate(p.checked);
    if (!d) return [{ name: p.name, problem: "has no date for when its figures were last checked" }];
    const age = days(d, now);
    return age > limit ? [{ name: p.name, problem: `its figures were last checked ${age} days ago (${p.checked})` }] : [];
  });
}

// How often each kind of saved data is rebuilt, in days. A file that has not changed for longer than twice this has stopped refreshing.
// The files rebuilt weekly from official statistics (education, energy, health, the inequality pages, defence, ageing, Brexit, devolution, transport, care and trust) are not
// here on purpose. The weekly refresh puts a file back as it was when the source has nothing new (so its "built" date stays put, and a figure published once a year looks
// "stale" for eleven months), and the refresh workflow itself now opens an issue when a step fails or when new figures wait for a person to read them.
export const CADENCE = [
  [/^(ons\/|regionalBreakdowns|benchmarks|representatives|pipelineStatus|mpCareers|councilsIndex)/, 1],
];

export function staleData(files, now) {
  return files.flatMap(({ name, stamp }) => {
    const rule = CADENCE.find(([re]) => re.test(name));
    if (!rule || !stamp) return [];
    const d = new Date(stamp);
    if (Number.isNaN(d.getTime())) return [];
    const age = days(d, now);
    const limit = rule[1] * 2 + 1;
    return age > limit ? [{ name, problem: `not rebuilt for ${age} days (it should be rebuilt every ${rule[1] === 1 ? "day" : `${rule[1]} days`})` }] : [];
  });
}

// Things a person types in (scripts/hand-kept.mjs), each with a cadence. `dateOf(row)` gives the day it was last read against its source (a stamp in its own file, else
// `checked`). Overdue rows are listed, with what to read, so a quiet month cannot go by without anyone looking at them.
export function handKeptDue(rows, now, dateOf) {
  return rows.flatMap((r) => {
    const raw = dateOf(r) ?? r.checked;
    const d = raw ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00Z` : raw) : null;
    if (!d || Number.isNaN(d.getTime())) return [{ name: r.what, problem: `has no readable date for when it was last checked (${r.files.join(", ")})` }];
    const age = days(d, now);
    return age > r.every ? [{ name: r.what, problem: `last checked ${age} days ago and looked at every ${r.every}. Read ${r.source}, then correct ${r.files.map((f) => `src/data/${f}`).join(", ")} and update its date` }] : [];
  });
}

// A link is a problem if it is gone or the site is failing. A site that refuses automatic visitors (403, 429) says nothing about whether the page exists.
export function brokenLinks(results) {
  return results.flatMap((r) => {
    if (r.status === 403 || r.status === 429 || r.status === 401) return [];
    if (r.status >= 200 && r.status < 400) return [];
    return [{ name: r.url, problem: r.status ? `answered ${r.status}` : `could not be reached (${r.error ?? "no answer"})` }];
  });
}

export function report(sections) {
  const lines = ["## Content check", ""];
  let total = 0;
  for (const [title, items] of sections) {
    lines.push(`### ${title}`, items.length ? "" : "Nothing to do.", ...items.map((i) => `- ${i.name}: ${i.problem}`), "");
    total += items.length;
  }
  lines.push(total ? `**${total} thing${total === 1 ? "" : "s"} to look at.**` : "**All clear.**");
  return { text: lines.join("\n"), total };
}

// The "Britain in numbers" pages keep the date they were last checked in their data file (`export const CHECKED = "13 November 2026"`). Their figures are rebuilt
// by the weekly refresh, but the wording and the policy facts beside them are written by hand, so the date is what says a person has looked lately.
export function staleCheckedConstants(items, now, limit = 45) {
  return items.flatMap(({ name, checked }) => {
    const d = parseLongDate(checked);
    if (!d) return [{ name, problem: "has no readable CHECKED date" }];
    const age = days(d, now);
    return age > limit ? [{ name, problem: `its wording was last checked ${age} days ago (${checked}), so look again at the policy facts beside the figures` }] : [];
  });
}

// Facts that are true only until a known day: a price cap that runs to 31 December, a tax cut due to end on 1 July, a Budget that was still "coming up".
// Each row is { date: "YYYY-MM-DD", lead: days before the date to start asking, what, where }. From `lead` days before the date, until `after` days past it, the row is
// listed, so that someone looks before the fact goes out of date and confirms (or corrects) it after. Past `after` days it is dropped, as it will have been dealt with.
export function dueDates(rows, now, after = 21) {
  return rows.flatMap((r) => {
    const d = new Date(`${r.date}T12:00:00Z`);
    if (Number.isNaN(d.getTime())) return [{ name: r.what, problem: `has an unreadable date (${r.date})` }];
    const until = days(now, d);
    if (until > (r.lead ?? 14) || until < -after) return [];
    const when = until > 0 ? `falls due in ${until} day${until === 1 ? "" : "s"} (${r.date})` : until === 0 ? `falls due today (${r.date})` : `fell due ${-until} day${until === -1 ? "" : "s"} ago (${r.date})`;
    return [{ name: r.what, problem: `${when}. Check ${r.where}` }];
  });
}

// Ofgem's price cap model, rebuilt weekly into energyData.json, lists every cap period. The page also states the announced figure for the current period by hand (CAP_NOW in
// src/data/energy.js). When the model has a period that starts after the one on the page, a new cap has been announced and the hand-written figure is out of date.
export function capBehind(modelLabels, capFrom) {
  const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const last = String(modelLabels.at(-1) ?? "");
  const m = /^(\w{3})\w* (\d{4})/.exec(last);
  const from = parseLongDate(capFrom);
  if (!m || !from || !(m[1].toLowerCase() in MON)) return null;
  const modelStart = Date.UTC(Number(m[2]), MON[m[1].toLowerCase()], 1);
  return modelStart > from.getTime() ? last : null;
}

// The Brexit page's headline goods trade (TRADE_LATEST in src/data/brexit.js) is typed in from the ONS bulletin, which excludes precious metals; the series the site holds
// (brexitData.json, rebuilt weekly) includes them, so the two cannot be swapped. When the held series has moved on a whole quarter or more, the typed figure is out of date.
// `period` is "October to December 2025"; `lastQuarter` is "2026-Q2". Returns how many quarters behind it is, or 0.
export function tradeHeadlineBehind(period, lastQuarter) {
  const MON = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
  const m = /(\w+) (\d{4})$/.exec(String(period ?? "").trim());
  const q = /^(\d{4})-Q([1-4])$/.exec(String(lastQuarter ?? ""));
  if (!m || !q || !(m[1].toLowerCase() in MON)) return 0;
  const typed = Number(m[2]) * 4 + Math.ceil(MON[m[1].toLowerCase()] / 3);
  const held = Number(q[1]) * 4 + Number(q[2]);
  return Math.max(0, held - typed);
}

// Individuals who have given a party at least `threshold` pounds in all (their gifts grouped the way the donors page groups them) and have no profile in
// src/data/donorProfiles.json. `group` turns a raw register name into the name the page shows, so the keys match the file.
export function donorsWithoutProfile(rows, profiles, group, threshold = 100000) {
  const totals = new Map();
  for (const r of rows) {
    if (r.donor_status !== "Individual" || !r.donor_name || !Number.isFinite(r.value)) continue;
    const name = group(r.donor_name);
    totals.set(name, (totals.get(name) ?? 0) + r.value);
  }
  return [...totals]
    .filter(([name, total]) => total >= threshold && !profiles[name])
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => ({ name, problem: `has given £${Math.round(total).toLocaleString("en-GB")} and has no profile in src/data/donorProfiles.json. Search for who they are, and add a line only if a page you read names them (leave it out otherwise), with that page as sourceUrl.` }));
}
