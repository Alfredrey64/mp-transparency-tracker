// The arithmetic behind the 2024 general election page: seats and votes by party, how well the two match, and a look back at 2019.
//
// Each seat's record (data/constituencies.json) holds its latest result. Seven seats have since held by-elections, so their record now
// shows the by-election, not July 2024. For seat totals, those seats are counted for the party that won them in 2024 (REPLACED below, from
// the House of Commons Library); their votes are left out of vote totals because the by-election figures are not the 2024 ones.

export const REPLACED_SEAT_WINNERS = {
  "runcorn and helsby": "Labour",
  "holborn and st pancras": "Labour",
  "makerfield": "Labour",
  "gorton and denton": "Labour",
  "clacton": "Reform UK",
  "aberdeen south": "Scottish National Party",
  "arbroath and broughty ferry": "Scottish National Party",
};

// The 2024 general election, seat by seat. National vote totals are not worked out here: each seat's record keeps only its top few candidates,
// so small parties' votes would be undercounted (see data/generalElection2024.js for the published totals). `constituencies` is the object keyed by seat name from constituencies.json.
export function summarise2024(constituencies, replaced = REPLACED_SEAT_WINNERS) {
  const seats = {};
  let counted = 0;
  let turnoutVotes = 0;
  let winnerVotes = 0;
  let underHalf = 0;
  let notCounted = 0;
  const closest = [];

  for (const [key, seat] of Object.entries(constituencies)) {
    const result = seat.result;
    if (result?.isGeneralElection !== false && result?.candidates?.length) {
      counted += 1;
      const winner = result.candidates[0];
      seats[winner.party] = (seats[winner.party] ?? 0) + 1;
      turnoutVotes += result.turnout ?? 0;
      winnerVotes += winner.votes;
      if (winner.share < 0.5) underHalf += 1;
      closest.push({ name: seat.name, party: winner.party, majority: result.majority, runnerUp: result.candidates[1]?.party ?? null });
    } else if (replaced[key]) {
      seats[replaced[key]] = (seats[replaced[key]] ?? 0) + 1;
    } else {
      notCounted += 1;
    }
  }

  closest.sort((a, b) => a.majority - b.majority);
  const totalSeats = Object.values(seats).reduce((n, v) => n + v, 0);

  return {
    totalSeats,
    counted,
    replaced: totalSeats - counted,
    notCounted,
    seats,
    underHalf,
    shareNotForWinner: turnoutVotes ? (1 - winnerVotes / turnoutVotes) * 100 : null,
    closest: closest.slice(0, 5),
  };
}

// One row per party for the results table: its seats (counted from the seats themselves), the share of seats, the votes and share of
// votes as published, and the votes it took for each seat it won. Everyone else (independents, the Speaker and the small parties left out
// of the published table) is one last row; their votes are whatever is left of the valid votes.
export function resultRows(seats, official) {
  const totalSeats = Object.values(seats).reduce((n, v) => n + v, 0);
  const rows = official.parties.map(([party, votes, publishedSeats]) => {
    const s = seats[party] ?? 0;
    return { party, seats: s, publishedSeats, seatShare: totalSeats ? (s / totalSeats) * 100 : 0, votes, voteShare: (votes / official.validVotes) * 100, votesPerSeat: s ? votes / s : null };
  });
  const listedVotes = rows.reduce((n, r) => n + r.votes, 0);
  const listedSeats = rows.reduce((n, r) => n + r.seats, 0);
  const otherVotes = official.validVotes - listedVotes;
  const otherSeats = totalSeats - listedSeats;
  rows.sort((a, b) => b.seats - a.seats || b.votes - a.votes);
  rows.push({ party: "Independents and other parties", other: true, seats: otherSeats, publishedSeats: official.independentSeats, seatShare: totalSeats ? (otherSeats / totalSeats) * 100 : 0, votes: otherVotes, voteShare: (otherVotes / official.validVotes) * 100, votesPerSeat: otherSeats ? otherVotes / otherSeats : null });
  return rows;
}

// Seats won in 2019, from each seat's history (the old boundaries, 650 seats).
export function seats2019(bySeat) {
  const seats = {};
  for (const results of Object.values(bySeat)) {
    const r = results.find((e) => e.y === 2019);
    if (r?.c?.length) seats[r.c[0][0]] = (seats[r.c[0][0]] ?? 0) + 1;
  }
  return seats;
}

// 2019 against 2024, for the parties that won seats in either.
export function seatChanges(before, after) {
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...names]
    .map((party) => ({ party, before: before[party] ?? 0, after: after[party] ?? 0, change: (after[party] ?? 0) - (before[party] ?? 0) }))
    .sort((a, b) => b.after - a.after || b.before - a.before);
}
