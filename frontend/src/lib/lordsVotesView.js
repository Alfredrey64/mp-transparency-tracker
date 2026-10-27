// What the Lords votes page shows, worked out from data/lordsVotes.json (see lordsVotes.js in the project root). Pure, so it can be tested.

export const hexOf = (colour) => (colour ? `#${String(colour).replace(/^#/, "")}` : "#8A94A6");

// The file's compact peer rows as objects.
export function peerRows(data) {
  return Object.entries(data.peers).map(([id, [name, party, colour, from, voted, whipped, against]]) => ({
    id, name, party, colour: hexOf(colour), from, voted, whipped, against, share: data.divisions ? voted / data.divisions : 0,
  }));
}

// How united each party was: of the votes cast in whipped divisions, how many were with the party line. Parties with no whip are left out.
export function partyUnity(data) {
  return data.parties
    .filter((p) => p.whipped > 0)
    .map((p) => ({ name: p.name, colour: hexOf(p.colour), peers: p.peers, votes: p.whipped, against: p.against, unity: p.whipped ? 1 - p.against / p.whipped : 1 }))
    .sort((a, b) => b.peers - a.peers);
}

// Divisions where the most peers broke from their party, newest first among equals.
export function mostDivided(data, n = 10) {
  return data.list.filter((d) => d.rebels > 0).sort((a, b) => b.rebels - a.rebels || b.date.localeCompare(a.date)).slice(0, n);
}

// Divisions the government lost, newest first.
export const governmentDefeats = (data) => data.list.filter((d) => d.govWin === false).sort((a, b) => b.date.localeCompare(a.date));

export function filterPeers(rows, { query = "", party = "all", sort = "voted" } = {}) {
  const q = query.trim().toLowerCase();
  const out = rows.filter((p) => (party === "all" || p.party === party) && (!q || p.name.toLowerCase().includes(q)));
  const by = {
    voted: (a, b) => b.voted - a.voted || a.name.localeCompare(b.name),
    fewest: (a, b) => a.voted - b.voted || a.name.localeCompare(b.name),
    against: (a, b) => (b.whipped ? b.against / b.whipped : 0) - (a.whipped ? a.against / a.whipped : 0) || b.against - a.against || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name),
  }[sort] ?? (() => 0);
  return out.sort(by);
}

const LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const longDay = (iso) => LONG.format(new Date(`${iso}T12:00:00Z`));

// Divisions in each of the last 12 months, oldest first: [{ key: "2026-03", label: "Mar", n }].
export function perMonth(data, months = 12) {
  const end = new Date(`${data.list[0]?.date ?? data.generatedAt}T12:00:00Z`);
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    out.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }), n: 0 });
  }
  for (const r of data.list) { const m = out.find((x) => x.key === r.date.slice(0, 7)); if (m) m.n += 1; }
  return out;
}

// How many peers voted in at least a quarter of the divisions: the regulars, as against peers who vote now and then.
export function regulars(rows, divisions, share = 0.25) {
  return rows.filter((p) => divisions && p.voted / divisions >= share).length;
}
