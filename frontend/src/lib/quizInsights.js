// Why a party scored as it did in the "Which party suits me?" quiz: the statements you and the party agree on most strongly, and the
// ones where you are furthest apart. Pure and tested. Positions are the quiz's own -2 to +2 scale.

export const STANCE = { "-2": "strongly disagrees", "-1": "disagrees", "0": "is neutral", "1": "agrees", "2": "strongly agrees" };
export const YOU = { "-2": "strongly disagreed", "-1": "disagreed", "0": "were not sure", "1": "agreed", "2": "strongly agreed" };

export function explainMatch(answers, partyKey, questions, limit = 3) {
  const rows = questions
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => {
      const user = answers[q.id];
      const party = q.positions[partyKey] ?? 0;
      return { id: q.id, issue: q.issue, statement: q.statement, user, party, distance: Math.abs(user - party) };
    });
  // Agreement only counts where you took a view: "not sure" matching a neutral party says nothing.
  const agree = rows.filter((r) => r.distance === 0 && r.user !== 0).sort((a, b) => Math.abs(b.user) - Math.abs(a.user)).slice(0, limit);
  // Likewise, "not sure" is not a disagreement.
  const differ = rows.filter((r) => r.distance >= 2 && r.user !== 0).sort((a, b) => b.distance - a.distance).slice(0, limit);
  return { agree, differ, answered: rows.length };
}
