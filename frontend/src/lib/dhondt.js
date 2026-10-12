// The D'Hondt method: seats are given out one at a time to the party with the highest votes divided by (seats it already has plus one).
export function dhondt(votes, seats) {
  const won = votes.map(() => 0);
  for (let s = 0; s < seats; s++) {
    let best = 0;
    votes.forEach((v, i) => { if (v / (won[i] + 1) > votes[best] / (won[best] + 1)) best = i; });
    won[best] += 1;
  }
  return won;
}
