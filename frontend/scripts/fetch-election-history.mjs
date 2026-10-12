// Downloads every constituency result for the general elections of 1945 to 2019 from UK Parliament's "UK General Elections Results 1832 - 2019"
// (api.parliament.uk/uk-general-elections, built on Resul Umit's CC0 constituency dataset, published under the Open Parliament Licence).
// It writes the raw pages' results to a scratch JSON file, which scripts/build-election-history.mjs then turns into src/data/electionsHistory.json.
// Usage: node scripts/fetch-election-history.mjs <outFile>
import { writeFileSync } from "node:fs";

const BASE = "https://api.parliament.uk/uk-general-elections";
const FIRST = 28; // 1945
const LAST = 48; // 2019
const out = process.argv[2];
if (!out) throw new Error("Give an output file");

const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "\n").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').split("\n").map((s) => s.trim()).filter(Boolean);

async function get(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "simple-politics-data-build" } });
      if (r.ok) return await r.text();
      if (r.status !== 429 && r.status < 500) throw new Error(`${r.status} ${url}`);
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  throw new Error(`gave up on ${url}`);
}

function parseSeat(html) {
  const t = text(html);
  const i = t.indexOf("Constituency");
  const name = t[i + 1];
  const turnoutAt = t.indexOf("Turnout");
  const turnout = turnoutAt >= 0 ? parseFloat(t[turnoutAt + 1]) : null;
  const rs = t.indexOf("Results");
  const end = t.indexOf("About");
  const cells = t.slice(rs + 1, end);
  // Header row is Candidate, Party, Votes; then rows of three.
  const rows = [];
  for (let k = 3; k + 2 < cells.length + 0; k += 3) rows.push([cells[k], cells[k + 1], parseInt(cells[k + 2].replace(/,/g, ""), 10)]);
  return { name, turnout, rows };
}

async function pool(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }));
  return results;
}

const all = {};
for (let ge = FIRST; ge <= LAST; ge++) {
  const page = await get(`${BASE}/general-elections/${ge}`);
  const title = text(page).find((s) => /General Election$/.test(s));
  const voting = text(page).find((s) => s.startsWith("Voting:"));
  const ids = [...page.matchAll(/uk-general-elections\/elections\/(\d+)/g)].map((m) => m[1]);
  const seats = await pool(ids, 12, async (id) => ({ id, ...parseSeat(await get(`${BASE}/elections/${id}`)) }));
  all[ge] = { title, voting, seats };
  console.error(ge, title, voting, seats.length);
}
writeFileSync(out, JSON.stringify(all));
