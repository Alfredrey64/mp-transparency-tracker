// lordsVotes.js
//
// Turns the House of Lords' recorded divisions into the figures on the Lords votes page: how often each peer voted, and how often they voted against
// the way most of their own party voted. Pure functions, no network, so they can be tested.
//
// "Against their party" is only worked out for peers whose party has a whip and only in divisions the Lords marked as whipped. In each such division,
// the side most of that party's voters took is the party's line; a peer on the other side is counted as voting against it. A party with fewer than
// MIN_VOTERS voting in a division, or an exact tie, has no line that day. Crossbenchers, non-affiliated peers, bishops and "other" peers have no
// whip, so they are never counted as rebels.

export const MIN_VOTERS = 5;
const NO_WHIP = new Set(["Crossbench", "Non-affiliated", "Bishops", "Other", "Independent Social Democrat"]);

export const hasWhip = (party) => Boolean(party) && !NO_WHIP.has(party);

// One division in, the vote of each peer out: [{ id, name, party, colour, side }] with side "c" (Content) or "n" (Not content).
export function votersOf(division) {
  const out = [];
  for (const [list, side] of [[division.contents, "c"], [division.notContents, "n"]]) {
    for (const m of list ?? []) {
      out.push({ id: m.memberId, name: m.name, party: m.party ?? "Other", colour: m.partyColour ?? null, from: m.memberFrom ?? null, side });
    }
  }
  return out;
}

// The side each party took in one division, or null where it had no line.
export function partyLines(voters) {
  const by = new Map();
  for (const v of voters) {
    const t = by.get(v.party) ?? { c: 0, n: 0 };
    t[v.side] += 1;
    by.set(v.party, t);
  }
  const lines = new Map();
  for (const [party, t] of by) {
    const line = t.c + t.n < MIN_VOTERS || t.c === t.n ? null : t.c > t.n ? "c" : "n";
    lines.set(party, { ...t, line });
  }
  return lines;
}

export function summariseLordsVotes(divisions, { since = null, now = new Date() } = {}) {
  const peers = new Map();
  const parties = new Map();
  const rows = [];
  let whipped = 0;

  for (const d of [...divisions].sort((a, b) => String(b.date).localeCompare(String(a.date)))) {
    const voters = votersOf(d);
    const lines = partyLines(voters);
    const isWhipped = Boolean(d.isWhipped);
    if (isWhipped) whipped += 1;
    let rebels = 0;
    for (const v of voters) {
      const p = peers.get(v.id) ?? { id: v.id, name: v.name, party: v.party, colour: v.colour, from: v.from, voted: 0, whipped: 0, against: 0 };
      p.name = v.name; p.party = v.party; p.colour = v.colour; p.from = v.from; // the latest division wins, so a peer who changed party shows the new one
      p.voted += 1;
      const line = lines.get(v.party)?.line ?? null;
      if (isWhipped && hasWhip(v.party)) {
        p.whipped += 1;
        if (line && v.side !== line) { p.against += 1; rebels += 1; }
      }
      peers.set(v.id, p);
      const q = parties.get(v.party) ?? { name: v.party, colour: v.colour, votes: 0, whipped: 0, against: 0, ids: new Set() };
      q.votes += 1; q.ids.add(v.id);
      if (isWhipped && hasWhip(v.party)) { q.whipped += 1; if (line && v.side !== line) q.against += 1; }
      parties.set(v.party, q);
    }
    const splits = [...lines.entries()]
      .filter(([party, t]) => hasWhip(party) && t.c + t.n >= MIN_VOTERS)
      .sort((a, b) => b[1].c + b[1].n - (a[1].c + a[1].n))
      .slice(0, 6)
      .map(([party, t]) => [party, t.c, t.n]);
    rows.push({
      id: d.divisionId, date: String(d.date).slice(0, 10), title: d.title, content: d.contents?.length ?? 0, notContent: d.notContents?.length ?? 0,
      govWin: d.isGovernmentWin ?? null, whipped: isWhipped, rebels, splits,
    });
  }

  return {
    generatedAt: now.toISOString().slice(0, 10),
    since,
    divisions: rows.length,
    whippedDivisions: whipped,
    parties: [...parties.values()].map((q) => ({ name: q.name, colour: q.colour, peers: q.ids.size, votes: q.votes, whipped: q.whipped, against: q.against })).sort((a, b) => b.peers - a.peers),
    peers: Object.fromEntries([...peers.values()].map((p) => [p.id, [p.name, p.party, p.colour, p.from, p.voted, p.whipped, p.against]])),
    list: rows,
  };
}
