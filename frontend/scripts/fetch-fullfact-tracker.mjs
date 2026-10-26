// Reads the list of pledges on Full Fact's Government Tracker (fullfact.org/government-tracker) and writes the pledge wording, policy area, Full Fact's
// current verdict and the date it last changed to src/data/fullFactPledges.json. Only the facts in the list are kept (the quoted pledge, its area, the
// verdict and the date). The explanation of each verdict stays on Full Fact's own page, which every row links to.
//
// Run it with: node scripts/fetch-fullfact-tracker.mjs
import { writeFileSync } from "node:fs";

const TRACKER = "https://fullfact.org/government-tracker/";
const OUT = new URL("../src/data/fullFactPledges.json", import.meta.url);
const MIN = 60;

const decode = (s) => s
  .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const res = await fetch(TRACKER, { headers: { "User-Agent": "SimplePoliticsBot/1.0 (+https://simple-politics.vercel.app)" } });
if (!res.ok) throw new Error(`Full Fact answered ${res.status}`);
const html = await res.text();

const rows = [];
for (const tr of html.split("<tr>").slice(1)) {
  const area = tr.match(/data-policy-area="([^"]+)"[^>]*>([^<]+)</);
  const link = tr.match(/href="\/government-tracker\/([a-z0-9-]+)\/"[^>]*>([\s\S]*?)<\/a>/);
  const status = tr.match(/data-status="([a-z-]+)"/);
  const date = tr.match(/data-sort="(\d{4}-\d{2}-\d{2})"/);
  if (!area || !link || !status || !date) continue;
  rows.push({ slug: link[1], area: decode(area[2]), pledge: decode(link[2]).replace(/^[“"]|[”"]$/g, ""), status: status[1], updated: date[1] });
}
if (rows.length < MIN) throw new Error(`Only ${rows.length} pledges found, so the file was left as it is`);
rows.sort((a, b) => a.area.localeCompare(b.area) || a.pledge.localeCompare(b.pledge));
writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), source: TRACKER, pledges: rows }, null, 1)}\n`);
console.log(`Wrote ${rows.length} pledges`);
