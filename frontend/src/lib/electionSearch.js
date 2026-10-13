// Search entries for the General elections page: each election, each government, each devolved election, and every seat name that has ever
// appeared in a general election since 1950 (so an old seat such as "Bristol North West" can be found even though today's list has no such seat).
// Built once when the search box is first used.

import { ELECTIONS, headline } from "./electionSpecs";
import { GOVERNMENTS } from "../data/governments";
import { NATIONS, PARTIES, devolvedFacts } from "../data/devolvedElections";
import { GROUPS, electionLabel } from "./electionHistory";

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9£%& ]/g, " ").replace(/\s+/g, " ").trim();
const ALIASES = { scotland: "holyrood msp scottish parliament", wales: "senedd welsh assembly national assembly ms", ni: "stormont mla northern ireland assembly" };

export function buildElectionIndex(seatBook) {
  const out = [];
  for (const e of [...ELECTIONS].reverse()) {
    const label = electionLabel(e);
    out.push({ kind: "election", name: `${label} general election`, sub: headline(e), hash: `#/generalElection/history/${e.id}`, text: norm(`${label} ${e.id} general election election result ${GROUPS[e.leader].label} ${headline(e)}`) });
  }
  for (const g of GOVERNMENTS) {
    const party = g.party === "l" ? "labour" : g.party === "c" ? "conservative" : "coalition conservative liberal democrat";
    out.push({ kind: "government", name: `${g.pm}'s government`, sub: `${g.from.slice(0, 4)} to ${g.to ? g.to.slice(0, 4) : "now"}: how it came to power and what changed`, hash: `#/generalElection/governments/${g.id}`, text: norm(`${g.pm} government prime minister ${party} ${g.from.slice(0, 4)} ${g.to?.slice(0, 4) ?? ""}`) });
  }
  for (const n of NATIONS) {
    for (const e of [...n.elections].reverse()) {
      const f = devolvedFacts(n, e);
      out.push({ kind: "devolved", name: `${n.body} election ${e.id}`, sub: `${PARTIES[f.leader].label} had the most seats (${f.leaderSeats} of ${f.total})`, hash: `#/generalElection/devolved/${n.key}/${e.id}`, text: norm(`${n.name} ${n.body} ${e.id} election ${ALIASES[n.key]}`) });
    }
  }
  if (seatBook) {
    for (const name of seatBook.names) {
      out.push({ kind: "seat", name, sub: "Who has won this seat since 1950", hash: `#/generalElection/history/seat/${encodeURIComponent(name)}`, text: norm(name) });
    }
  }
  return out;
}

const KIND_ORDER = { election: 0, government: 1, devolved: 2, seat: 3 };

// Every word typed has to be in the entry. Elections, governments and devolved elections come before seat names, and an exact start of the
// name comes first within each.
export function findElections(query, index, limit = 5) {
  const words = norm(query).split(" ").filter(Boolean);
  if (!words.length || norm(query).length < 2) return [];
  const phrase = words.join(" ");
  return index
    .filter((it) => words.every((w) => it.text.includes(w)))
    .map((it) => ({ it, s: norm(it.name).startsWith(phrase) ? 0 : 1 }))
    .sort((a, b) => KIND_ORDER[a.it.kind] - KIND_ORDER[b.it.kind] || a.s - b.s || a.it.name.length - b.it.name.length)
    .slice(0, limit)
    .map((r) => r.it);
}
