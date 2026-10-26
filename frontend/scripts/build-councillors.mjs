// Builds one searchable list of every councillor in the UK from the council files already in the repo (councilsIndex.json for the councils and
// parties, councilDetail/*.json for the wards and the people in them). It is served as a plain file, not bundled, so only the Councillors page
// downloads it. Writes public/data/councillors.json.
//
// Run it with: node scripts/build-councillors.mjs   (after fetch-councils.js has refreshed the council files)
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";

const data = new URL("../src/data/", import.meta.url);
const out = new URL("../public/data/councillors.json", import.meta.url);
const index = JSON.parse(readFileSync(new URL("councilsIndex.json", data), "utf8"));

const councilAt = new Map(index.index.map((c, i) => [c.id, i]));
const rows = [];
for (const f of readdirSync(new URL("councilDetail/", data)).filter((n) => n.endsWith(".json"))) {
  const shard = JSON.parse(readFileSync(new URL(`councilDetail/${f}`, data), "utf8"));
  for (const [id, detail] of Object.entries(shard)) {
    const ci = councilAt.get(id);
    if (ci === undefined) continue;
    const moved = new Set((detail.moved ?? []).map(([ward, name]) => `${ward}|${name}`));
    for (const [ward, people] of detail.wards ?? []) {
      for (const [name, party] of people) rows.push([name, ci, ward, party, moved.has(`${ward}|${name}`) ? 1 : 0]);
    }
  }
}
if (rows.length < 15000) throw new Error(`Only ${rows.length} councillors found, so the file was left as it is`);
rows.sort((a, b) => a[0].localeCompare(b[0], "en-GB") || a[1] - b[1]);

mkdirSync(new URL("./", out), { recursive: true });
writeFileSync(out, JSON.stringify({
  generatedAt: index.generatedAt,
  parties: index.parties.map((p) => [p.short, p.colour]),
  councils: index.index.map((c) => [c.id, c.name]),
  c: rows,
}));
console.log(`Wrote ${rows.length} councillors`);
