// What goes on the share card for each part of the General elections page. The cards themselves are drawn by lib/shareCard.js; this works out
// the content from the same data the page shows, so the card and the page cannot disagree.

import history from "../data/electionsHistory.json";
import { GOVERNMENTS } from "../data/governments";
import { STATUS, manifestosFor } from "../data/manifestoPledges";
import { NATIONS, PARTIES, devolvedFacts } from "../data/devolvedElections";
import { GROUPS, GROUP_ORDER, election2024, electionLabel, outcome } from "./electionHistory";
import { devolvedShareSpec, electionShareSpec, governmentShareSpec } from "./shareSpecs";

export const ELECTIONS = [...history.elections, election2024()].map((e) => ({ ...e, ...outcome(e) }));

const dateText = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const year = (iso) => iso.slice(0, 4);

export function headline(e) {
  const lead = GROUPS[e.leader].label;
  return e.majority ? `${lead} won a majority` : `No party won a majority. ${lead} came first with ${e.leaderSeats} seats`;
}

export function electionSpec(e, link) {
  const lead = GROUPS[e.leader];
  const parties = GROUP_ORDER.filter((k) => (e.seatsWon[k] ?? 0) > 0).map((k) => ({ label: GROUPS[k].label, seats: e.seatsWon[k], colour: GROUPS[k].colour })).sort((a, b) => b.seats - a.seats);
  return electionShareSpec({
    label: electionLabel(e),
    headline: headline(e),
    date: dateText(e.date),
    accent: lead.colour,
    stats: [
      { value: String(e.leaderSeats), label: `${lead.label} seats` },
      { value: `${Math.round(e.voteShare[e.leader] ?? 0)}%`, label: "of the votes" },
      { value: `${e.turnout}%`, label: "turnout" },
    ],
    parties,
    total: e.seats,
    note: e.moreVotesFewerSeats ? `${GROUPS[e.moreVotesFewerSeats].label} won more votes but fewer seats.` : `${e.needed} seats were needed for a majority.`,
    link,
  });
}

export function lengthOf(g, now = Date.now()) {
  const from = Date.parse(`${g.from}T00:00:00Z`);
  const to = g.to ? Date.parse(`${g.to}T00:00:00Z`) : now;
  const months = Math.max(1, Math.round((to - from) / (30.4375 * 86400000)));
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? "year" : "years"}`);
  if (m) parts.push(`${m} ${m === 1 ? "month" : "months"}`);
  return `${parts.join(" and ")}${g.to ? "" : " so far"}`;
}

export function governmentSpec(g, link) {
  const counts = {};
  for (const m of manifestosFor(g)) for (const p of m.pledges) counts[p.status] = (counts[p.status] ?? 0) + 1;
  return governmentShareSpec({
    pm: g.pm,
    party: g.party === "l" ? "Labour government" : g.party === "c" ? "Conservative government" : "Coalition government",
    span: `${year(g.from)} to ${g.to ? year(g.to) : "now"}`,
    length: `${lengthOf(g)} in office`,
    took: g.took,
    outcomes: Object.keys(STATUS).filter((k) => counts[k]).map((k) => ({ label: STATUS[k].label, count: counts[k], colour: STATUS[k].colour })),
    accent: g.party === "l" ? GROUPS.l.colour : GROUPS.c.colour,
    link,
  });
}

export function devolvedSpec(nation, e, link) {
  const facts = devolvedFacts(nation, e);
  const parties = Object.entries(e.seats).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ label: PARTIES[k].label, seats: n, colour: PARTIES[k].colour }));
  return devolvedShareSpec({ nation, e, facts, parties, link });
}

// The card for whatever the page is showing: `tab` and `item` as in the address (#/generalElection/<tab>/<item>).
export function specForView(tab, item, link) {
  if (tab === "history") return electionSpec(ELECTIONS.find((e) => e.id === item) ?? ELECTIONS.at(-1), link);
  if (tab === "governments") return governmentSpec(GOVERNMENTS.find((g) => g.id === item) ?? GOVERNMENTS.at(-1), link);
  if (tab === "devolved") {
    const [nk, id] = String(item ?? "").split("/");
    const nation = NATIONS.find((n) => n.key === nk) ?? NATIONS[0];
    return devolvedSpec(nation, nation.elections.find((e) => e.id === id) ?? nation.elections.at(-1), link);
  }
  return electionSpec(ELECTIONS.at(-1), link);
}

