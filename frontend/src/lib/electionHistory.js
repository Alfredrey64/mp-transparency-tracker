// Helpers for the General elections page: the party groups used to compare elections across seventy-nine years, the national result of every
// election since 1945, and the maps of who won which seat. The numbers come from data/electionsHistory.json (built by
// scripts/build-election-history.mjs from Parliament's constituency results) and, for 2024, from data/generalElection2024.js.

import { GE2024 } from "../data/generalElection2024";
import { normSeat } from "./seatMap";

// One letter per group. Conservative includes its allies (Scottish Unionists, National Liberals and, until 1970, the Ulster Unionists), and
// Liberal includes the SDP and the Alliance of the 1980s, which is how the House of Commons Library counts them.
export const GROUPS = {
  l: { label: "Labour", colour: "#d50000" },
  c: { label: "Conservative", colour: "#0063ba" },
  d: { label: "Liberal Democrat", short: "Lib Dem", colour: "#fc7d0b" },
  s: { label: "SNP", colour: "#d9b900" },
  p: { label: "Plaid Cymru", colour: "#348837" },
  g: { label: "Green", colour: "#78b82a" },
  u: { label: "Reform and UKIP", short: "Reform/UKIP", colour: "#12b6cf" },
  n: { label: "Northern Ireland parties", short: "N. Ireland", colour: "#7d8c6b" },
  x: { label: "Independents and others", short: "Others", colour: "#9a9aa6" },
  k: { label: "Speaker", colour: "#c7c7d0" },
};
export const GROUP_ORDER = ["l", "c", "d", "s", "p", "g", "u", "n", "x", "k"];
export const NO_MATCH = "#e3e0d6";

// The party group for a party named as in the 2024 data.
export function groupOf2024(party) {
  switch (party) {
    case "Labour": case "Labour (Co-op)": return "l";
    case "Conservative": return "c";
    case "Liberal Democrat": return "d";
    case "Scottish National Party": return "s";
    case "Plaid Cymru": return "p";
    case "Green Party": return "g";
    case "Reform UK": return "u";
    case "Sinn Féin": case "Democratic Unionist Party": case "Social Democratic & Labour Party": case "Ulster Unionist Party": case "Alliance": case "Traditional Unionist Voice": return "n";
    case "Speaker": return "k";
    default: return "x";
  }
}

// The 2024 election in the same shape as the older ones. Shares come from Parliament's published table (votes over valid votes).
export function election2024() {
  const seatsWon = { l: 0, c: 0, d: 0, s: 0, p: 0, g: 0, u: 0, n: 0, x: GE2024.independentSeats - 1, k: 1 };
  const votes = { l: 0, c: 0, d: 0, s: 0, p: 0, g: 0, u: 0, n: 0, x: 0 };
  for (const [party, v, seats] of GE2024.parties) {
    const g = groupOf2024(party);
    seatsWon[g] += seats;
    votes[g] += v;
  }
  const listed = Object.values(votes).reduce((n, v) => n + v, 0);
  votes.x = GE2024.validVotes - listed;
  const voteShare = Object.fromEntries(Object.entries(votes).map(([k, v]) => [k, Math.round((v / GE2024.validVotes) * 1000) / 10]));
  return { id: "2024", date: GE2024.date, turnout: 59.9, seats: 650, seatsWon, voteShare, validVotes: GE2024.validVotes, matchedSeats: 650 };
}

// Who came first in seats, whether that was a majority, and whether the votes told a different story.
export function outcome(e) {
  const seatLeader = Object.entries(e.seatsWon).filter(([k]) => "lcd".includes(k)).sort((a, b) => b[1] - a[1])[0];
  const needed = Math.floor(e.seats / 2) + 1;
  const [leader, leaderSeats] = seatLeader;
  const voteLeader = Object.entries(e.voteShare).filter(([k]) => "lc".includes(k)).sort((a, b) => b[1] - a[1])[0][0];
  return {
    leader,
    leaderSeats,
    needed,
    majority: leaderSeats >= needed,
    shortBy: leaderSeats >= needed ? 0 : needed - leaderSeats,
    // The party with more votes between the two biggest, when it is not the party with more seats.
    moreVotesFewerSeats: "lc".includes(leader) && voteLeader !== leader ? voteLeader : null,
  };
}

// All the elections, oldest first, with what each one decided.
export function allElections(history) {
  return [...history.elections, election2024()].map((e) => ({ ...e, ...outcome(e) }));
}

export const electionLabel = (e) => (e.id === "1974a" ? "February 1974" : e.id === "1974b" ? "October 1974" : e.id);

// Short label for chips.
export const electionShort = (e) => (e.id === "1974a" ? "Feb 1974" : e.id === "1974b" ? "Oct 1974" : e.id);

export const percent = (n) => `${Math.round(n)}%`;

// What the map says for each seat in an election: the winner's group letter and how big the lead was, band 0 (under 5 points) to 9 (45 or more).
export function decodeMap(entry) {
  if (!entry) return [];
  return Array.from(entry.w, (g, i) => (g === "." ? null : { group: g, band: Number(entry.b[i]) }));
}

// A seat's winner at every election it can be matched in, oldest first. `maps` is history.maps; `elections` the list with ids.
export function seatTimeline(index, elections, maps) {
  return elections
    .filter((e) => maps[e.id])
    .map((e) => {
      const g = maps[e.id].w[index];
      return g === "." ? { id: e.id, group: null } : { id: e.id, group: g, band: Number(maps[e.id].b[index]) };
    });
}

// The 2019-layout hexagons are listed [code, name, q, r, region]. "odd-q" files stand the columns up: flat-topped hexagons, every other
// column half a step along. The rows run south to north, so y is flipped to put Scotland at the top.
export function flatHexPosition(q, r, size = 1) {
  const odd = ((q % 2) + 2) % 2;
  return { x: size * 1.5 * q, y: -size * Math.sqrt(3) * (r + 0.5 * odd) };
}

export function flatHexPoints(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i);
    return `${(cx + size * Math.cos(a)).toFixed(2)},${(cy + size * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

// Lead bands as a colour ramp from pale (marginal) to full colour (safe).
export function shadeFor(colour, band) {
  const t = 0.42 + 0.58 * (Math.min(9, Math.max(0, band)) / 9);
  return `color-mix(in srgb, ${colour} ${Math.round(t * 100)}%, #ffffff)`;
}

// The 2024 result for every hexagon on the 2024 map. `hexes` is seatHexes.json's list; `constituencies` is constituencies.json keyed by seat name.
// Seats that have had a by-election since keep their 2024 winner (see REPLACED_SEAT_WINNERS) but have no lead or runner-up to show.
export function seatResults2024(hexes, constituencies, replaced) {
  const byNorm = new Map(Object.values(constituencies).map((s) => [normSeat(s.name), s]));
  return hexes.map(([, name]) => {
    const key = normSeat(name);
    const r = byNorm.get(key)?.result;
    if (r?.isGeneralElection !== false && r?.candidates?.length) {
      const [w, second] = r.candidates;
      const lead = r.majorityPct ?? 0;
      return { group: groupOf2024(w.party), party: w.party, runnerUp: second?.party ?? null, lead, band: Math.min(9, Math.floor(lead / 5)), gain: /gain/i.test(r.outcome ?? ""), share: w.share };
    }
    const party = replaced[key];
    return party ? { group: groupOf2024(party), party, runnerUp: null, lead: null, band: 0, gain: false, share: null, byElection: true } : null;
  });
}
