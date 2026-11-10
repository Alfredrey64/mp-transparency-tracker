// check-office-holders.js
//
// Compares who the site names as Prime Minister, Chancellor and First Minister of Scotland, Wales and Northern Ireland with who holds those offices now (see officeHolders.js).
//
//   node check-office-holders.js
//
// Exit codes: 0 = they agree; 1 = at least one office has a different holder (the workflow opens an issue); 2 = a source could not be read, so the check could not be sure
// (the run goes red and GitHub emails the owner, but no issue is opened for something that may be a source's bad hour).

import fs from "fs";
import { pathToFileURL } from "url";
import { fetchRetry } from "./httpFetch.js";
import { postHolders, currentHeadId, entityName, devolvedHoldersOnSite, primeMinisterOnSite, chancellorOnSite, differences } from "./officeHolders.js";

const HEADERS = { "User-Agent": "domesday-live/1.0 (civic information site; contact via GitHub)" };
const NATIONS = { scotland: "Q22", wales: "Q25", northernIreland: "Q26" };

async function json(url) {
  const res = await fetchRetry(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}

async function liveHolders() {
  const posts = await json("https://members-api.parliament.uk/api/Posts/GovernmentPosts");
  const live = { primeMinister: postHolders(posts, "Prime Minister"), chancellor: postHolders(posts, "Chancellor of the Exchequer") };
  const ids = {};
  for (const [nation, qid] of Object.entries(NATIONS)) ids[nation] = currentHeadId(await json(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qid}&property=P6&format=json`));
  const wanted = [...new Set(Object.values(ids).filter(Boolean))];
  const labels = wanted.length ? (await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wanted.join("|")}&props=labels|sitelinks&format=json`)).entities ?? {} : {};
  for (const nation of Object.keys(NATIONS)) live[nation] = ids[nation] ? entityName(labels[ids[nation]]) : null;
  return live;
}

async function main() {
  const { GOVERNMENTS } = await import(pathToFileURL("frontend/src/data/governments.js"));
  const { CHANCELLORS } = await import(pathToFileURL("frontend/src/data/chancellors.js"));
  const site = {
    primeMinister: primeMinisterOnSite(GOVERNMENTS),
    chancellor: chancellorOnSite(CHANCELLORS),
    ...devolvedHoldersOnSite(fs.readFileSync("frontend/src/components/DevolvedAdministrations.jsx", "utf8")),
  };
  let live;
  try {
    live = await liveHolders();
  } catch (e) {
    console.log(`COULD NOT CHECK: ${e.message}`);
    process.exit(2);
  }
  const diff = differences(site, live);
  for (const d of diff) console.log(`${d.office}: the site names ${d.site}; the source says ${d.live}`);
  if (!diff.length) console.log("Every office holder on the site matches the official source.");
  process.exit(diff.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
