// fetch-election-history.js
//
// What this does, in plain terms:
// 1. Downloads from Democracy Club (the volunteer-run election data project; its candidate and results database is open) every
//    candidate's vote in each of the last four general elections that had the same boundaries as 2010: 2010, 2015, 2017 and
//    2019, for all 650 seats.
// 2. Files each seat's results under the name of today's constituency with the same name, and writes
//    frontend/src/data/electionHistory.json for the Elections tab on a constituency's page and the compare page.
//
// Worth being clear about its limit, because the pages are too: the 2024 boundaries redrew many seats, so an older result is
// for the old seat of that name, not exactly the same ground as today's. Seats with no old seat of the same name (new in 2024,
// or renamed) simply have no history.
//
// Past results never change, so this is run by hand, not daily. It takes four downloads, one per election.
//
// Run it with: node fetch-election-history.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normaliseConstituencyName } from "./constituencyData.js";
import { fetchRetry } from "./httpFetch.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "electionHistory.json");
const EXPORT = "https://candidates.democracyclub.org.uk/data/export_csv/";
const ELECTIONS = [["parl.2010-05-06", 2010], ["parl.2015-05-07", 2015], ["parl.2017-06-08", 2017], ["parl.2019-12-12", 2019]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getText(url) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetchRetry(url, { headers: { "User-Agent": "simple-politics (independent, non-commercial)" } });
      if (res.status === 429) { await sleep(30000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt === 10) throw new Error(`${url}: ${e.message}`);
      await sleep(3000);
    }
  }
  return "";
}

// A small CSV reader that copes with quoted fields.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
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
    console.log(`${year}...`);
    const [head, ...rows] = parseCsv(await getText(`${EXPORT}?election_id=${id}&field_group=results`)).filter((r) => r.length > 5);
    const col = (name) => {
      const i = head.indexOf(name);
      if (i < 0) throw new Error(`column not found: ${name}`);
      return i;
    };
    const c = { label: col("post_label"), ballot: col("ballot_paper_id"), party: col("party_name"), votes: col("votes_cast"), electorate: col("total_electorate"), turnout: col("turnout_reported") };
    const seats = new Map();
    for (const r of rows) {
      const votes = Number(r[c.votes]);
      if (!Number.isFinite(votes) || r[c.votes] === "") continue;
      if (!seats.has(r[c.ballot])) seats.set(r[c.ballot], { label: r[c.label], electorate: Number(r[c.electorate]) || null, turnout: Number(r[c.turnout]) || null, cands: [] });
      seats.get(r[c.ballot]).cands.push({ party: r[c.party], votes });
    }
    let n = 0;
    for (const s of seats.values()) {
      const cands = s.cands.sort((a, b) => b.votes - a.votes);
      const total = cands.reduce((a, x) => a + x.votes, 0);
      if (cands.length < 2 || !total) continue;
      (bySeat[normaliseConstituencyName(s.label)] ??= []).push({
        y: year,
        t: s.electorate && s.turnout ? pct(s.turnout / s.electorate) : s.electorate ? pct(total / s.electorate) : null,
        m: cands[0].votes - cands[1].votes,
        p: pct((cands[0].votes - cands[1].votes) / total),
        c: cands.slice(0, 6).map((x) => { const p = party(x.party); if (p.colour) parties[p.name] = p.colour; return [p.name, pct(x.votes / total), x.votes]; }),
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
