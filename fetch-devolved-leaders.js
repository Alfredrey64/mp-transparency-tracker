// fetch-devolved-leaders.js
//
// What this does, in plain terms:
// 1. Looks up a portrait for each leader shown on the Scotland, Wales and Northern Ireland page, using Wikipedia's public
//    page-summary API (no key needed).
// 2. Writes the result to frontend/src/data/devolvedLeaders.json, keyed by the leader's name, with the Wikipedia page so the page can
//    link to it for credit and licence details.
//
// Leaders change after elections, so add or change names in LEADERS below to match frontend/src/components/DevolvedAdministrations.jsx
// and run it by hand: node fetch-devolved-leaders.js

import fs from "fs";
import { fetchRetry } from "./httpFetch.js";

const OUTPUT_PATH = "frontend/src/data/devolvedLeaders.json";
const HEADERS = { "User-Agent": "simple-politics/1.0 (civic information site; contact via GitHub)" };

// Leader name on the page: the exact Wikipedia article for that person.
const LEADERS = {
  "John Swinney": "John Swinney",
  "Rhun ap Iorwerth": "Rhun ap Iorwerth",
  "Michelle O'Neill": "Michelle O'Neill",
  "Emma Little-Pengelly": "Emma Little-Pengelly",
};

async function main() {
  const out = {};
  for (const [name, title] of Object.entries(LEADERS)) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
    const res = await fetchRetry(url, { headers: HEADERS });
    if (!res.ok) {
      console.log(`${name}: lookup failed (${res.status})`);
      continue;
    }
    const data = await res.json();
    if (!data.thumbnail?.source) {
      console.log(`${name}: no image`);
      continue;
    }
    out[name] = { url: data.thumbnail.source, page: data.content_urls?.desktop?.page ?? null, wikipediaTitle: data.title };
    console.log(`${name}: ${data.thumbnail.source}`);
    await new Promise((r) => setTimeout(r, 800));
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Saved ${Object.keys(out).length} portraits to ${OUTPUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
