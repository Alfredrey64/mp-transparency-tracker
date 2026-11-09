// Builds src/data/partyLeaders.json: who leads each party on the Party History page now, with a portrait.
// Names come from the party's Wikipedia infobox (the "Leader" row) and portraits from the Wikipedia page summary (hosted on thumb.wikimedia.org, which the site's
// Content-Security-Policy already allows). Nothing is written from memory: the file is refused if a party has no leader or the set of parties changes.
// Run: node scripts/build-party-leaders.mjs   (leaders change rarely; re-run after a leadership election)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../src/data/partyLeaders.json", import.meta.url));
const UA = { "User-Agent": "DomesdayLive-data-build/1.0 (political transparency site)" };

// The name used on the Party History page → its Wikipedia article.
const PARTIES = {
  "Labour Party": "Labour_Party_(UK)",
  "Conservative Party": "Conservative_Party_(UK)",
  "Liberal Democrats": "Liberal_Democrats_(UK)",
  "Scottish National Party": "Scottish_National_Party",
  "Green Party": "Green_Party_of_England_and_Wales",
  "Reform UK": "Reform_UK",
  "Plaid Cymru": "Plaid_Cymru",
  "Democratic Unionist Party": "Democratic_Unionist_Party",
  "Sinn Féin": "Sinn_Féin",
  "Social Democratic & Labour Party": "Social_Democratic_and_Labour_Party",
  "Alliance": "Alliance_Party_of_Northern_Ireland",
  "Ulster Unionist Party": "Ulster_Unionist_Party",
};

const firstLink = (s) => /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(s ?? "");
const plain = (s) => (s ?? "").replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1").replace(/\{\{[^}]*\}\}/g, "").replace(/<[^>]+>/g, "").trim();

// The infobox line "| leader = [[X]]" or "| leader1_name = [[X]]", with its title ("| leader1_title = Leader") when there is one.
function leaderOf(wikitext) {
  const field = (k) => new RegExp(`^\\s*\\|\\s*${k}\\s*=\\s*(.*)$`, "im").exec(wikitext)?.[1];
  // "leader1_name" is the leader only when its title is not a deputy / vice post (the DUP and UUP boxes use "leader" for the leader and "leader1_*" for the deputy).
  const t1 = plain(field("leader1_title") ?? "Leader");
  const name = field("leader") ?? (/deputy|depute|vice/i.test(t1) ? null : field("leader1_name"));
  const title = /president/i.test(t1) ? "President" : "Leader";
  const link = firstLink(name);
  if (!link) return null;
  return { title, page: link[1].trim(), name: plain(link[2] ?? link[1]) };
}

const get = async (url) => {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r;
};

const out = {};
for (const [party, article] of Object.entries(PARTIES)) {
  const wikitext = await (await get(`https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(article)}&action=raw`)).text();
  const lead = leaderOf(wikitext);
  if (!lead) throw new Error(`No leader found in the infobox for ${party}`);
  const summary = await (await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(lead.page.replace(/ /g, "_"))}`)).json();
  const photo = summary.thumbnail?.source ?? null;
  out[party] = { name: lead.name, role: lead.title, page: summary.titles?.canonical ?? lead.page.replace(/ /g, "_"), photo };
  console.log(party.padEnd(34), lead.title.padEnd(10), lead.name.padEnd(22), photo ? "photo" : "no photo");
}

if (Object.keys(out).length !== Object.keys(PARTIES).length) throw new Error("Party set changed");
writeFileSync(OUT, `${JSON.stringify({ retrieved: new Date().toISOString().slice(0, 10), source: "Wikipedia party infoboxes; portraits via Wikimedia Commons", leaders: out }, null, 2)}\n`);
console.log("wrote", OUT);
