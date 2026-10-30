// fetch-representatives.js
//
// What this does, in plain terms:
// 1. Reads the public lists of who holds the offices a postcode is covered by, besides the MP and the council:
//    police and crime commissioners and the mayors of combined authorities (Wikipedia's tables, which cite the Association of Police and Crime
//    Commissioners and the authorities themselves), members of the Senedd (Wikipedia), MSPs (the Scottish Parliament's open data) and
//    MLAs (the Northern Ireland Assembly's open data). It also reads the ONS's list of which councils sit in which combined authority.
// 2. Checks the shape of what came back: every police force, 16 Senedd constituencies of 6, 73 Scottish constituencies, 18 Assembly constituencies.
//    If a source has changed so much that a check fails, the old file is left in place and the run stops with a message.
// 3. Writes frontend/src/data/representatives.json, with the date it was checked.
//
// Run it with: node fetch-representatives.js

import fs from "fs";
import { fetchRetry } from "./httpFetch.js";
import { parsePcc, parseMayors, parseSenedd, scotlandFrom, niFrom } from "./representatives.js";

const OUTPUT_PATH = "frontend/src/data/representatives.json";
const HEADERS = { "User-Agent": "simple-politics/1.0 (civic information site; contact via GitHub)" };

async function json(url) {
  const res = await fetchRetry(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}
const wikitext = async (title) => (await json(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&formatversion=2`)).parse.wikitext;
const scot = (name) => json(`https://data.parliament.scot/api/${name}`);

function check(label, ok, detail) {
  if (!ok) throw new Error(`Check failed, so ${OUTPUT_PATH} was left alone: ${label} (${detail})`);
}

async function main() {
  const [pccText, mayorText, seneddText] = await Promise.all([wikitext("Police and crime commissioner"), wikitext("Strategic authority mayor"), wikitext("List of members of the Senedd")]);
  const pcc = parsePcc(pccText);
  const mayors = parseMayors(mayorText);
  const senedd = parseSenedd(seneddText);
  check("police and crime commissioners", Object.keys(pcc).length >= 36, Object.keys(pcc).length);
  check("every commissioner has a party", Object.values(pcc).every((p) => p.party), JSON.stringify(Object.entries(pcc).filter(([, p]) => !p.party).map(([k]) => k)));
  check("mayors", mayors.length >= 12 && mayors.every((m) => m.name && m.authority), mayors.length);
  check("Senedd constituencies", Object.keys(senedd).length === 16 && Object.values(senedd).every((l) => l.length === 6), Object.entries(senedd).map(([k, l]) => `${k}:${l.length}`).join(", "));

  const [members, constituencies, regions, constituencyStatuses, regionStatuses, memberParties, parties] = await Promise.all(
    ["members", "constituencies", "regions", "memberelectionconstituencystatuses", "memberelectionregionstatuses", "memberparties", "parties"].map(scot),
  );
  const scotland = scotlandFrom({ members, constituencies, regions, constituencyStatuses, regionStatuses, memberParties, parties });
  const tidy = (s) => s?.replace(/\bScot\b/g, "Scotland") ?? s;
  scotland.regions = Object.fromEntries(Object.entries(scotland.regions).map(([k, v]) => [tidy(k), v]));
  for (const c of Object.values(scotland.constituencies)) c.region = tidy(c.region);
  check("Scottish constituencies", Object.keys(scotland.constituencies).length === 73 && Object.values(scotland.constituencies).every((c) => c.msp?.name), Object.keys(scotland.constituencies).length);
  check("Scottish regions", Object.keys(scotland.regions).length === 8 && Object.values(scotland.regions).every((l) => l.length === 7), Object.entries(scotland.regions).map(([k, l]) => `${k}:${l.length}`).join(", "));

  const niRes = await fetchRetry("http://data.niassembly.gov.uk/members_json.asmx/GetAllCurrentMembers_JSON", { headers: HEADERS });
  check("Assembly request", niRes.ok, niRes.status);
  const ni = niFrom(await niRes.text());
  check("Assembly constituencies", Object.keys(ni).length === 18 && Object.values(ni).every((l) => l.length >= 4 && l.length <= 5), Object.entries(ni).map(([k, l]) => `${k}:${l.length}`).join(", "));

  // Which council sits in which combined authority (ONS, May 2025), by the council's own code.
  const lookup = await json("https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD25_CAUTH25_EN_LU/FeatureServer/0/query?where=1%3D1&outFields=LAD25CD,CAUTH25NM&returnGeometry=false&f=json&resultRecordCount=2000");
  const councilAuthority = Object.fromEntries((lookup.features ?? []).map((f) => [f.attributes.LAD25CD, f.attributes.CAUTH25NM]));
  check("council to authority lookup", Object.keys(councilAuthority).length > 90, Object.keys(councilAuthority).length);

  const out = { checked: new Date().toISOString().slice(0, 10), pcc, mayors, councilAuthority, senedd, scotland, ni };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out) + "\n");
  console.log(`Saved ${Object.keys(pcc).length} commissioners, ${mayors.length} mayors, ${Object.values(senedd).flat().length} Senedd members, ${Object.keys(scotland.constituencies).length} Scottish constituencies and ${Object.values(ni).flat().length} MLAs to ${OUTPUT_PATH}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
