// build-calendar-feed.js
//
// Rewrites the subscribable calendar files (frontend/public/calendar/*.ics) from the data already saved in frontend/src/data/parliamentCalendar.json, without asking
// Parliament for anything. The daily fetch (fetch-parliament-calendar.js) does this itself; run this by hand after changing calendarFeed.js.
//
// Run it with: node build-calendar-feed.js

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { buildAllFeeds } from "./calendarFeed.js";

const data = JSON.parse(readFileSync("frontend/src/data/parliamentCalendar.json", "utf8"));
mkdirSync("frontend/public/calendar", { recursive: true });
for (const f of buildAllFeeds(data)) {
  writeFileSync(`frontend/public/calendar/${f.file}`, f.text);
  console.log(`Wrote frontend/public/calendar/${f.file} (${(f.text.match(/BEGIN:VEVENT/g) ?? []).length} items)`);
}
