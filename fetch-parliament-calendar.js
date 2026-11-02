// fetch-parliament-calendar.js
//
// What this does, in plain terms:
// 1. Asks Parliament's What's On calendar for everything in the Commons and Lords over the next four weeks (a week at a time, because the calendar fails on long ranges).
// 2. Asks the same service for the days and weeks MPs and peers are not sitting.
// 3. Boils that down (see parliamentCalendar.js) and writes frontend/src/data/parliamentCalendar.json for the Coming up in Parliament page.
//
// If the calendar returns almost nothing (an outage, or a gap in the calendar) the existing file is left alone.
//
// Run it with: node fetch-parliament-calendar.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { summariseCalendar } from "./parliamentCalendar.js";

const OUTPUT = "frontend/src/data/parliamentCalendar.json";
const API = "https://whatson-api.parliament.uk/calendar/events";
const WEEKS = 4;
const MIN_EVENTS = 20;

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function main() {
  const today = new Date(`${iso(new Date())}T00:00:00Z`);
  const from = iso(today);
  const to = iso(addDays(today, WEEKS * 7 - 1));

  const events = [];
  for (let w = 0; w < WEEKS; w++) {
    const s = iso(addDays(today, w * 7));
    const e = iso(addDays(today, w * 7 + 6));
    const rows = await getJson(`${API}/list.json?queryParameters.startDate=${s}&queryParameters.endDate=${e}`);
    events.push(...rows);
    console.log(`  ${s} to ${e}: ${rows.length} events`);
  }
  // Breaks are listed by the day they start, so ask for a wider range to catch a recess that began before today.
  const breaks = await getJson(`${API}/nonsitting.json?queryParameters.startDate=${iso(addDays(today, -21))}&queryParameters.endDate=${to}`);

  const out = summariseCalendar(events, breaks, { from, to, generated: from });
  if (out.events.length < MIN_EVENTS) {
    console.error(`Only ${out.events.length} events came back, so ${OUTPUT} was left as it is.`);
    process.exit(1);
  }
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.events.length} events and ${out.away.length} non-sitting periods from ${from} to ${to}.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
