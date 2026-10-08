// fetch-election-history.js
//
// What this does, in plain terms:
// 1. Asks Democracy Club (the volunteer-run election data project; its candidate and results database is open) for every
//    candidate's vote in each of the last four general elections that had the same boundaries as 2010: 2010, 2015, 2017 and
//    2019, for all 650 seats.
// 2. Files each seat's results under the name of today's constituency with the same name, and writes
//    frontend/src/data/electionHistory.json for the Elections tab on a constituency's page and the compare page.
//
// Worth being clear about its limit, because the pages are too: the 2024 boundaries redrew many seats, so an older result is
// for the old seat of that name, not exactly the same ground as today's. Seats with no old seat of the same name (new in 2024,
// or renamed) simply have no history.
//
// Past results never change, so this is run by hand, not daily. Democracy Club limits how fast it can be asked, so the script
// waits when told to (about 60 requests in all).
//
// Run it with: node fetch-election-history.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normaliseConstituencyName } from "./constituencyData.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "electionHistory.json");
const API = "https://candidates.democracyclub.org.uk/api/next";
const ELECTIONS = [["parl.2010-05-06", 2010], ["parl.2015-05-07", 2015], ["parl.2017-06-08", 2017], ["parl.2019-12-12", 2019]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(url.replace(/^http:/, "https:"), { headers: { Accept: "application/json", "User-Agent": "uk-parliament-tracker (independent, non-commercial)" } });
      const body = await res.json().catch(() => null);
      // "Request was throttled. Expected available in 10 seconds."
      if (res.status === 429 || body?.detail?.startsWith?.("Request was throttled")) {
        const secs = Number(/in (\d+) seconds/.exec(body?.detail ?? "")?.[1] ?? 30);
        console.log(`  throttled, waiting ${secs}s`);
        await sleep((secs + 2) * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return body;
    } catch (e) {
      if (attempt === 30) throw new Error(`${url}: ${e.message}`);
      await sleep(2000);
    }
  }
  return null;
}

async function allPages(url) {
  const out = [];
  for (let next = url; next; ) {
    const j = await getJson(next);
    console.log(`  page ok (${out.length + (j.results?.length ?? 0)} of ${j.count})`);
    out.push(...(j.results ?? []));
    next = j.next;
  }
  return out;
}

// Democracy Club's party names, in the short form the rest of the site uses, with the party's colour.
const PARTIES = [
  [/^conservative/i, "Conservative", "0063ba"],
  [/^labour/i, "Labour", "d50000"],
  [/^liberal democrat/i, "Liberal Democrat", "fc7d0b"],
  [/uk independence|ukip/i, "UKIP", "70147a"],
  [/^brexit party/i, "Brexit Party", "12b6cf"],
  [/^reform uk/i, "Reform UK", "12b6cf"],
  [/^green party|^scottish green|^green/i, "Green Party", "78b82a"],
  [/scottish national|^snp/i, "Scottish National Party", "ffd100"],
  [/plaid cymru/i, "Plaid Cymru", "005b54"],
  [/democratic unionist/i, "Democratic Unionist Party", "d46a4c"],
  [/sinn f/i, "Sinn Féin", "02665f"],
  [/social democratic (and|&) labour/i, "Social Democratic & Labour Party", "4ea268"],
  [/ulster unionist/i, "Ulster Unionist Party", "48a5ee"],
  [/^alliance/i, "Alliance", "f6cb2f"],
  [/^independent/i, "Independent", "909090"],
  [/british national party|^bnp/i, "British National Party", "2d3c76"],
  [/^speaker/i, "Speaker", "909090"],
  [/respect/i, "Respect", "ff5033"],
];
function party(name) {
  const hit = PARTIES.find(([re]) => re.test(name ?? ""));
  return hit ? { name: hit[1], colour: hit[2] } : { name: String(name ?? "Independent").replace(/ Party$/, ""), colour: null };
}

const pct = (x) => Math.round(x * 1000) / 10;

async function main() {
  const parties = {};
  const bySeat = {};
  for (const [id, year] of ELECTIONS) {
    console.log(`${year}: ballots...`);
    const labels = new Map((await allPages(`${API}/ballots/?election_id=${id}&limit=100`)).map((b) => [b.ballot_paper_id, b.post?.label]));
    console.log(`${year}: results...`);
    const results = await allPages(`${API}/results/?election_id=${id}&limit=100`);
    let n = 0;
    for (const r of results) {
      const label = labels.get(r.ballot?.ballot_paper_id);
      const cands = (r.candidate_results ?? []).filter((c) => Number.isFinite(c.num_ballots)).sort((a, b) => b.num_ballots - a.num_ballots);
      const total = cands.reduce((a, c) => a + c.num_ballots, 0);
      if (!label || cands.length < 2 || !total) continue;
      const key = normaliseConstituencyName(label);
      (bySeat[key] ??= []).push({
        y: year,
        m: cands[0].num_ballots - cands[1].num_ballots,
        p: pct((cands[0].num_ballots - cands[1].num_ballots) / total),
        c: cands.slice(0, 6).map((c) => { const p = party(c.party?.name); if (p.colour) parties[p.name] = p.colour; return [p.name, pct(c.num_ballots / total), c.num_ballots]; }),
      });
      n++;
    }
    console.log(`  ${n} seats`);
  }
  for (const list of Object.values(bySeat)) list.sort((a, b) => a.y - b.y);
  if (Object.keys(bySeat).length < 600) throw new Error(`only ${Object.keys(bySeat).length} seats have results`);
  fs.writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), years: ELECTIONS.map((e) => e[1]), parties, bySeat })}\n`);
  console.log(`Saved ${path.relative(process.cwd(), OUT)}: ${Object.keys(bySeat).length} seats`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
