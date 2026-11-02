// What the by-elections page works out from the list of by-elections: whether a seat changed hands, which party lost it to which, and the order they are shown in.

// "Gain" when a different party won the seat than held it, "Hold" when the same one did, from the word in Parliament's own result ("Reform UK Gain").
export function outcomeOf(result) {
  const match = /\b(Gain|Hold)\b/i.exec(result ?? "");
  return match ? (match[1].toLowerCase() === "gain" ? "gain" : "hold") : null;
}

// The party a seat was lost from, for every seat that changed hands, counted by pair: [{ from, to, count, seats: [name] }], the most common first.
// `predecessorFor(constituency, date)` gives the MP who held the seat before (or null), as the page already works it out.
export function movesBetweenParties(elections, predecessorFor) {
  const pairs = new Map();
  for (const e of elections) {
    if (outcomeOf(e.result) !== "gain" || !e.winning_party) continue;
    const from = predecessorFor(e.constituency_name, e.election_date)?.party;
    if (!from || from === e.winning_party) continue;
    const key = `${from}\u0000${e.winning_party}`;
    const row = pairs.get(key) ?? { from, to: e.winning_party, fromColour: null, toColour: e.winning_party_colour ?? null, count: 0, seats: [] };
    row.fromColour = predecessorFor(e.constituency_name, e.election_date)?.party_colour ?? row.fromColour;
    row.count += 1;
    row.seats.push(e.constituency_name);
    pairs.set(key, row);
  }
  return [...pairs.values()].sort((a, b) => b.count - a.count || a.from.localeCompare(b.from));
}

// The by-elections in the order they happened, oldest first, each with its outcome ("gain", "hold" or null), for the strip along the top.
export function strip(elections) {
  return [...elections]
    .sort((a, b) => (a.election_date ?? "").localeCompare(b.election_date ?? ""))
    .map((e) => ({ id: e.election_id, name: e.constituency_name, date: e.election_date, party: e.winning_party, colour: e.winning_party_colour, outcome: outcomeOf(e.result) }));
}

// The by-elections kept by a filter ("all", "gain" or "hold"), newest first, then split under their years: [{ year, items }].
export function byYear(elections, filter = "all") {
  const kept = elections
    .filter((e) => filter === "all" || outcomeOf(e.result) === filter)
    .sort((a, b) => (b.election_date ?? "").localeCompare(a.election_date ?? ""));
  const groups = [];
  for (const e of kept) {
    const year = e.election_date ? e.election_date.slice(0, 4) : "Undated";
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(e);
    else groups.push({ year, items: [e] });
  }
  return groups;
}
