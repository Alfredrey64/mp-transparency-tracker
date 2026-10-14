// Adds tax rate changes to src/data/taxSeries.json after a Budget, checking each one first.
//
//   node scripts/add-tax-change.mjs <series> <date> <value|none> [--ann DATE] [--note "text"] [--month] [--replace]
//   node scripts/add-tax-change.mjs --file changes.json
//   node scripts/add-tax-change.mjs ... --event "2026-10-28=Autumn Budget 2026"
//   node scripts/add-tax-change.mjs ... --dry
//
// <series> is a key from taxSeries.json, for example vat.standard or incomeTax.basic (--list shows them all). <date> is the day the new value
// takes effect. <value> is the new number in the same unit as the rest of that series, or "none" if the tax stops being charged. --ann is
// the day it was announced or decided (the Budget date); the page uses it to credit the right government and Chancellor, so set it whenever
// it differs from the date the change takes effect. --month says the effective date is only known to the month. --event adds the Budget's
// name to src/data/taxEvents.js so the page can call it by name. A --file holds a list of {series, date, value, ann, note, month}.
//
// Nothing is written unless every change in the run passes. Run `npm run check:tax` and the tests afterwards; the README has the full list
// of steps for Budget day.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SERIES_PATH = fileURLToPath(new URL("../src/data/taxSeries.json", import.meta.url));
const EVENTS_PATH = fileURLToPath(new URL("../src/data/taxEvents.js", import.meta.url));
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const validDate = (s) => DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

// Returns { series, problems, notes } without changing the series it is given.
export function insertChange(series, change) {
  const problems = [];
  const notes = [];
  const { key, date, ann, note, month, replace } = change;
  const value = change.value === "none" ? null : change.value;
  if (!(key in series)) problems.push(`There is no series called ${key}. Use --list to see them.`);
  if (!validDate(date)) problems.push(`${key}: the date ${date} is not a real YYYY-MM-DD date.`);
  if (ann !== undefined && ann !== null && !validDate(ann)) problems.push(`${key}: the announcement date ${ann} is not a real YYYY-MM-DD date.`);
  if (validDate(date) && validDate(ann ?? "") && ann > date) problems.push(`${key}: it cannot be announced (${ann}) after it takes effect (${date}).`);
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) problems.push(`${key}: the value must be a number or "none", not ${change.value}.`);
  if (problems.length) return { series, problems, notes };

  const rows = series[key].map((r) => [...r]);
  const at = rows.findIndex((r) => r[0] === date);
  if (at >= 0 && !replace) problems.push(`${key} already has a value on ${date} (${rows[at][1]}). Add --replace to overwrite it.`);
  const opts = {};
  if (ann) opts.ann = ann;
  if (note) opts.note = note;
  if (month) opts.p = "m";
  const row = Object.keys(opts).length ? [date, value, opts] : [date, value];
  if (!problems.length) {
    if (at >= 0) rows[at] = row;
    else {
      rows.push(row);
      rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    }
    const i = rows.findIndex((r) => r[0] === date);
    const before = rows[i - 1];
    const after = rows[i + 1];
    if (before && before[1] === value) notes.push(`${key}: the value before ${date} is already ${value}, so this is not a change. Check the figure.`);
    if (after && after[1] === value) notes.push(`${key}: the next step after ${date} is also ${value}.`);
    if (before) notes.push(`${key}: ${before[1]} on ${before[0]}, then ${value} on ${date}.`);
    const taxDay = date > new Date().toISOString().slice(0, 10);
    if (taxDay && !ann) notes.push(`${key}: this takes effect in the future and has no --ann date, so it will be credited by its effective date. Set --ann to the Budget date.`);
  }
  return { series: problems.length ? series : { ...series, [key]: rows }, problems, notes };
}

// Adds "date": "name" to EVENT_NAMES in the right place. Returns the new file text.
export function addEvent(text, date, name) {
  if (!validDate(date)) throw new Error(`Event date ${date} is not a real YYYY-MM-DD date.`);
  const start = text.indexOf("export const EVENT_NAMES = {");
  const end = text.indexOf("\n};", start);
  if (start < 0 || end < 0) throw new Error("Could not find EVENT_NAMES in taxEvents.js.");
  const lines = text.slice(start, end).split("\n");
  const existing = lines.findIndex((l) => l.trim().startsWith(`"${date}":`));
  const entry = `  ${JSON.stringify(date)}: ${JSON.stringify(name)},`;
  if (existing >= 0) lines[existing] = entry;
  else {
    let place = lines.length;
    for (let i = 1; i < lines.length; i += 1) {
      const m = /^\s+"(\d{4}-\d{2}-\d{2})":/.exec(lines[i]);
      if (m && m[1] > date) { place = i; break; }
    }
    lines.splice(place, 0, entry);
  }
  return text.slice(0, start) + lines.join("\n") + text.slice(end);
}

function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--ann" || a === "--note" || a === "--file" || a === "--event") flags[a.slice(2)] = argv[++i];
    else if (a.startsWith("--")) flags[a.slice(2)] = true;
    else rest.push(a);
  }
  return { flags, rest };
}

function main() {
  const { flags, rest } = parseArgs(process.argv.slice(2));
  let series = JSON.parse(readFileSync(SERIES_PATH, "utf8"));
  if (flags.list) {
    for (const [k, v] of Object.entries(series)) console.log(`${k.padEnd(30)} last: ${v.at(-1)[0]} = ${v.at(-1)[1]}`);
    return;
  }
  let changes = [];
  if (flags.file) {
    changes = JSON.parse(readFileSync(flags.file, "utf8")).map((c) => ({ key: c.series ?? c.key, date: c.date, value: c.value, ann: c.ann, note: c.note, month: c.month, replace: flags.replace }));
  } else if (rest.length >= 3) {
    const raw = rest[2];
    changes = [{ key: rest[0], date: rest[1], value: raw === "none" ? "none" : Number(raw), ann: flags.ann, note: flags.note, month: Boolean(flags.month), replace: Boolean(flags.replace) }];
  } else {
    console.log("Usage: node scripts/add-tax-change.mjs <series> <date> <value|none> [--ann DATE] [--note TEXT] [--month] [--replace] [--event \"DATE=Name\"] [--dry]\n       node scripts/add-tax-change.mjs --file changes.json\n       node scripts/add-tax-change.mjs --list");
    process.exit(2);
  }
  const problems = [];
  for (const c of changes) {
    const out = insertChange(series, c);
    problems.push(...out.problems);
    for (const n of out.notes) console.log(`note   ${n}`);
    series = out.series;
  }
  let events = readFileSync(EVENTS_PATH, "utf8");
  if (flags.event) {
    const [d, ...n] = String(flags.event).split("=");
    try { events = addEvent(events, d, n.join("=")); } catch (e) { problems.push(e.message); }
  }
  if (problems.length) {
    for (const p of problems) console.log(`FAILED ${p}`);
    console.log("\nNothing was written.");
    process.exit(1);
  }
  if (flags.dry) { console.log(`\nChecked ${changes.length} change${changes.length === 1 ? "" : "s"}. --dry was set, so nothing was written.`); return; }
  writeFileSync(SERIES_PATH, JSON.stringify(series));
  if (flags.event) writeFileSync(EVENTS_PATH, events);
  console.log(`\nAdded ${changes.length} change${changes.length === 1 ? "" : "s"} to src/data/taxSeries.json${flags.event ? " and the event name to src/data/taxEvents.js" : ""}.\nNext: set NEXT_BUDGET in src/data/taxEvents.js, run npm test, then npm run check:tax.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
