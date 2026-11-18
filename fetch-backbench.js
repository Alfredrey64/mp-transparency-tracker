// fetch-backbench.js
//
// What this does, in plain terms:
// 1. Lists every private member's bill in the last two parliamentary sessions from Parliament's Bills API, a page of 50 at a time, and counts how far each kind got
//    (see backbench.js). The session numbers come from the newest bills on the list, so a new session is picked up by itself.
// 2. Looks up the sponsor of each ballot bill in the current session (the bill's own record names them).
// 3. Lists the Early Day Motions tabled since the current session began from Parliament's Early Day Motions API, and summarises who signs what.
// 4. Writes frontend/src/data/backbench.json for the Backbench power page.
//
// If the lists come back far too short (an upstream outage) the existing file is left alone.
//
// Run it with: node fetch-backbench.js

import { existsSync, readFileSync, writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";
import { PMB_TYPES, summariseBills, sumCounts, ballotRow, sessionStarts, summariseMotions } from "./backbench.js";

const OUTPUT = "frontend/src/data/backbench.json";
const BILLS = "https://bills-api.parliament.uk/api/v1";
const EDMS = "https://oralquestionsandmotions-api.parliament.uk/EarlyDayMotions/list";
const MIN_BILLS = 100;
const MIN_MOTIONS = 100;

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function billsFor(session, typeId) {
  const items = [];
  for (let skip = 0; ; skip += 50) {
    const page = await getJson(`${BILLS}/Bills?Session=${session}&BillType=${typeId}&take=50&skip=${skip}`);
    items.push(...page.items);
    if (!page.items.length || items.length >= page.totalResults) break;
  }
  return items;
}

// Every motion tabled on or after `from`. The first page says how many there are, and the rest are asked for a few at a time (each page takes several seconds).
async function motionsSince(from) {
  const url = (skip) => `${EDMS}?parameters.tabledStartDate=${from}&parameters.take=100&parameters.skip=${skip}`;
  const first = await getJson(url(0));
  const total = first.PagingInfo.Total;
  const skips = [];
  for (let skip = 100; skip < total; skip += 100) skips.push(skip);
  const pages = new Map([[0, first.Response]]);
  const queue = [...skips];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) { const skip = queue.shift(); pages.set(skip, (await getJson(url(skip))).Response); console.log(`  motions from ${skip + 1} of ${total}`); }
  }));
  return [...pages.entries()].sort((x, y) => x[0] - y[0]).flatMap(([, r]) => r);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  // The current session is the one the newest bill was introduced in; the one before it is the last full session.
  const newest = await getJson(`${BILLS}/Bills?SortOrder=DateUpdatedDescending&take=1`);
  const current = newest.items[0].introducedSessionId;
  const previous = current - 1;

  const bySession = {};
  const ballotBills = [];
  for (const session of [previous, current]) {
    const items = [];
    for (const t of PMB_TYPES) {
      const list = await billsFor(session, t.id);
      items.push(...list);
      if (session === current && t.key === "ballot") ballotBills.push(...list);
    }
    bySession[session] = items;
    console.log(`  session ${session}: ${items.length} private members' bills`);
  }
  const total = Object.values(bySession).reduce((n, l) => n + l.length, 0);
  if (total < MIN_BILLS) { console.error(`Only ${total} bills came back, so ${OUTPUT} was left as it is.`); process.exit(1); }

  const ballot = [];
  for (const bill of ballotBills) {
    const detail = await getJson(`${BILLS}/Bills/${bill.billId}`).catch(() => null);
    ballot.push(ballotRow(bill, detail, today));
  }
  ballot.sort((a, b) => (a.next ?? "9999").localeCompare(b.next ?? "9999") || a.title.localeCompare(b.title));

  // Early day motion numbers start again at 1 each session, so the day motion number 1 was tabled marks the start of a session. The first run looks back three years to find
  // the last two starts; after that the saved start is the place to begin, and only a new session (a second "number 1" in the list) sends the page back to look again.
  const saved = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : null;
  const threeYears = new Date(); threeYears.setFullYear(threeYears.getFullYear() - 3);
  const begin = saved?.sessions?.current?.from ?? threeYears.toISOString().slice(0, 10);
  const lookBack = await motionsSince(begin);
  const starts = sessionStarts(lookBack);
  if (!starts.length) { console.error("Could not tell when the session began, so the file was left as it is."); process.exit(1); }
  const sessionFrom = starts[starts.length - 1];
  const previousFrom = starts.length > 1 ? starts[starts.length - 2] : saved?.sessions?.current?.from === sessionFrom ? saved.sessions.previous.from : null;
  const motions = lookBack.filter((r) => String(r.DateTabled).slice(0, 10) >= sessionFrom);
  if (motions.length < MIN_MOTIONS) { console.error(`Only ${motions.length} motions came back, so ${OUTPUT} was left as it is.`); process.exit(1); }
  let previousMotions = saved?.motions?.previous ?? null;
  if (starts.length > 1) {
    const last = summariseMotions(lookBack.filter((r) => { const d = String(r.DateTabled).slice(0, 10); return d >= previousFrom && d < sessionFrom; }), { top: 0 });
    previousMotions = { total: last.total, median: last.median };
  }

  const out = {
    generated: today,
    sessions: { current: { id: current, from: sessionFrom }, previous: { id: previous, from: previousFrom, to: sessionFrom } },
    bills: {
      current: summariseBills(bySession[current]),
      previous: summariseBills(bySession[previous]),
    },
    ballot,
    motions: { current: summariseMotions(motions, { from: sessionFrom }), previous: previousMotions },
  };
  out.bills.currentTotal = sumCounts(out.bills.current);
  out.bills.previousTotal = sumCounts(out.bills.previous);
  writeFileSync(OUTPUT, `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${OUTPUT}: ${out.bills.previousTotal.total} + ${out.bills.currentTotal.total} bills, ${out.motions.current.total} motions this session.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
