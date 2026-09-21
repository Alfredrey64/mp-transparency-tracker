// fetch-pm-portraits.js
//
// What this does, in plain terms:
// 1. Looks up a portrait for every Prime Minister listed in
//    frontend/src/lib/politicalHistoryData.js, using Wikipedia's public
//    page-summary API (no key required).
// 2. Many historic PMs are commonly known by a peerage title ("Duke of
//    Wellington", "Earl Grey") that doesn't match their actual Wikipedia
//    article title, and a couple of those titles are ambiguous (more than
//    one person has held them) — PM_WIKIPEDIA_TITLES below is a manually
//    verified map from this app's own "pm" name to the exact Wikipedia
//    article for the right person. Modern PMs, who Wikipedia titles by
//    their plain name, aren't listed — the lookup just uses their name
//    directly.
// 3. Writes the result to frontend/src/data/pmPortraits.json, keyed by the
//    same "pm" string used in politicalHistoryData.js.
//
// This is historical reference data, not something that changes day to
// day — run it by hand after adding a new PM to politicalHistoryData.js,
// rather than on the daily schedule.
//
// Run it with: node fetch-pm-portraits.js

import fs from "fs";

const OUTPUT_PATH = "frontend/src/data/pmPortraits.json";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PM_WIKIPEDIA_TITLES = {
  "Earl of Wilmington": "Spencer Compton, 1st Earl of Wilmington",
  "Duke of Newcastle": "Thomas Pelham-Holles, 1st Duke of Newcastle",
  "Duke of Devonshire": "William Cavendish, 4th Duke of Devonshire",
  "Earl of Bute": "John Stuart, 3rd Earl of Bute",
  "Marquess of Rockingham": "Charles Watson-Wentworth, 2nd Marquess of Rockingham",
  "William Pitt the Elder": "William Pitt, 1st Earl of Chatham",
  "Duke of Grafton": "Augustus FitzRoy, 3rd Duke of Grafton",
  "Lord North": "Frederick North, Lord North",
  "Earl of Shelburne": "William Petty, 2nd Earl of Shelburne",
  "Duke of Portland": "William Cavendish-Bentinck, 3rd Duke of Portland",
  "Henry Addington": "Henry Addington",
  "Lord Grenville": "William Grenville, 1st Baron Grenville",
  "Earl of Liverpool": "Robert Jenkinson, 2nd Earl of Liverpool",
  "Viscount Goderich": "F. J. Robinson, 1st Viscount Goderich",
  "Duke of Wellington": "Arthur Wellesley, 1st Duke of Wellington",
  "Earl Grey": "Charles Grey, 2nd Earl Grey",
  "Viscount Melbourne": "William Lamb, 2nd Viscount Melbourne",
  "Lord John Russell": "John Russell, 1st Earl Russell",
  "Earl of Derby": "Edward Smith-Stanley, 14th Earl of Derby",
  "Earl of Aberdeen": "George Hamilton-Gordon, 4th Earl of Aberdeen",
  "Viscount Palmerston": "Henry John Temple, 3rd Viscount Palmerston",
  "Earl Russell": "John Russell, 1st Earl Russell",
  "William Gladstone": "William Ewart Gladstone",
  "Marquess of Salisbury": "Robert Gascoyne-Cecil, 3rd Marquess of Salisbury",
  "Earl of Rosebery": "Archibald Primrose, 5th Earl of Rosebery",
  "Sir Alec Douglas-Home": "Alec Douglas-Home",
};

async function fetchPortrait(pmName, attempt = 1) {
  const title = PM_WIKIPEDIA_TITLES[pmName] ?? pmName;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetch(url, { headers: { "User-Agent": "mp-transparency-tracker/1.0 (civic transparency site)" } });
  if (res.status === 429 && attempt <= 3) {
    await sleep(2000 * attempt);
    return fetchPortrait(pmName, attempt + 1);
  }
  if (!res.ok) return null;
  const data = await res.json();
  return { url: data.thumbnail?.source ?? null, wikipediaTitle: data.title ?? null };
}

async function main() {
  const source = fs.readFileSync("frontend/src/lib/politicalHistoryData.js", "utf8");
  const pmNames = [...new Set([...source.matchAll(/pm: "([^"]+)"/g)].map((m) => m[1]))];
  console.log(`Found ${pmNames.length} unique Prime Ministers.\n`);

  const result = {};
  for (const [i, name] of pmNames.entries()) {
    try {
      const portrait = await fetchPortrait(name);
      if (portrait?.url) {
        result[name] = portrait;
        console.log(`[${i + 1}/${pmNames.length}] "${name}" → found (${portrait.wikipediaTitle})`);
      } else {
        console.log(`[${i + 1}/${pmNames.length}] "${name}" — no image found`);
      }
    } catch (err) {
      console.log(`[${i + 1}/${pmNames.length}] "${name}" — error: ${err.message}`);
    }
    await sleep(1000);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\nDone. ${Object.keys(result).length} of ${pmNames.length} portraits found.`);
  console.log(`Written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
