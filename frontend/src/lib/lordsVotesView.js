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

// A bill's name with the marks that differ between lists ("[HL]", brackets, capitals, punctuation) taken out.
export const normTitle = (t) => String(t ?? "").toLowerCase().replace(/\[[^\]]*\]|\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

// The bill a Lords vote was on, from the list of bills, or null: the vote's title is the bill's name.
export function findBill(title, bills) {
  const t = normTitle(title);
  if (!t) return null;
  return bills.find((b) => normTitle(b.short_title) === t) ?? bills.find((b) => { const n = normTitle(b.short_title); return n && (t.startsWith(n) || n.startsWith(t)); }) ?? null;
}

// "Agreed" when more peers voted Content than Not content, "Rejected" otherwise.
export const outcomeOf = (d) => (d.content > d.notContent ? "Agreed" : "Rejected");

// Votes in each of the last 12 months split by who came out ahead, oldest first: [{ key, label, won, lost, other }]. "other" is a vote with no government side.
export function monthlyOutcomes(data, months = 12) {
  return perMonth(data, months).map((m) => {
    const day = data.list.filter((r) => r.date.startsWith(m.key));
    const lost = day.filter((r) => r.govWin === false).length;
    const won = day.filter((r) => r.govWin === true).length;
    return { key: m.key, label: m.label, won, lost, other: day.length - won - lost, n: day.length };
  });
}

// The middle number of peers taking part in a vote.
export function typicalTurnout(data) {
  const t = data.list.map((r) => r.content + r.notContent).sort((a, b) => a - b);
  if (!t.length) return 0;
  const mid = Math.floor(t.length / 2);
  return t.length % 2 ? t[mid] : Math.round((t[mid - 1] + t[mid]) / 2);
}

// How many peers took part in each tenth of the votes: [{ from, to, n }] for 0-10% up to 90-100%, so how often peers vote can be drawn as a histogram.
export function turnoutBands(rows, bands = 10) {
  const out = Array.from({ length: bands }, (_, i) => ({ from: Math.round((i * 100) / bands), to: Math.round(((i + 1) * 100) / bands), n: 0 }));
  for (const p of rows) out[Math.min(bands - 1, Math.floor(Math.min(0.9999, p.share) * bands))].n += 1;
  return out;
}

// One vote drawn as two sides: the parties on the Content side and on the Not content side, biggest first, so who stood with whom can be seen.
export function sidesOf(d, colours) {
  const mk = (i) => d.splits.filter((s) => s[i] > 0).map((s) => ({ party: s[0], n: s[i], colour: colours[s[0]] ?? "#8A94A6" })).sort((a, b) => b.n - a.n);
  const named = (i) => d.splits.reduce((t, s) => t + s[i], 0);
  const sides = [mk(1), mk(2)];
  // peers outside the named parties (crossbench and the like) make up the difference
  const other = [Math.max(0, d.content - named(1)), Math.max(0, d.notContent - named(2))];
  sides.forEach((s, i) => { if (other[i] > 0) s.push({ party: "Other peers", n: other[i], colour: "#8A94A6" }); });
  return sides;
}
