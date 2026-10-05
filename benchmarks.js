// How each MP compares with the rest, worked out once a day so the site can
// say "more than most MPs" without downloading every MP's records. Pure, so
// each rule can be tested against a small hand-made set.
//
// For each measure it keeps the sorted list of every MP's value (the
// "distribution") and each MP's own value. The site finds an MP's place by
// looking their value up in the distribution.

export const EARNINGS_CATEGORIES = [
  "Employment and earnings",
  "Employment and earnings - Ad hoc payments",
  "Employment and earnings - Ongoing paid employment",
];

// Independents and the Speaker sit under no party whip, so "voted against the
// party majority" means nothing for them.
const NO_WHIP = ["independent", "speaker"];
export const MIN_VOTES = 10;

const round = (n, dp = 0) => Math.round(n * 10 ** dp) / 10 ** dp;
const sortedNumbers = (values) => values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);

// politicians: [{ id, party, parliament_member_id, ipsa_expenses }]
// interests:   [{ politician_id, category, value_amount }]
// votes:       [{ politician_id, division_id, voted_with_party_majority }]
// careers:     { [parliament_member_id]: [firstYear, ...] }
export function computeBenchmarks({ politicians, interests, votes, careers, now = new Date() }) {
  const declared = new Map();
  const earnings = new Map();
  for (const i of interests) {
    if (!i.value_amount) continue;
    declared.set(i.politician_id, (declared.get(i.politician_id) ?? 0) + i.value_amount);
    if (EARNINGS_CATEGORIES.includes(i.category)) earnings.set(i.politician_id, (earnings.get(i.politician_id) ?? 0) + i.value_amount);
  }

  const divisions = new Set(votes.map((v) => v.division_id));
  const cast = new Map();
  const tally = new Map();
  for (const v of votes) {
    cast.set(v.politician_id, (cast.get(v.politician_id) ?? 0) + 1);
    if (v.voted_with_party_majority == null) continue;
    const t = tally.get(v.politician_id) ?? { total: 0, against: 0 };
    t.total += 1;
    if (v.voted_with_party_majority === false) t.against += 1;
    tally.set(v.politician_id, t);
  }

  const byMp = {};
  const lists = { declared: [], earnings: [], expenses: [], rebelPct: [], attendance: [], years: [] };
  for (const p of politicians) {
    const row = {};
    row.declared = round(declared.get(p.id) ?? 0);
    row.earnings = round(earnings.get(p.id) ?? 0);
    lists.declared.push(row.declared);
    lists.earnings.push(row.earnings);

    if (p.ipsa_expenses?.total != null) {
      row.expenses = round(p.ipsa_expenses.total);
      lists.expenses.push(row.expenses);
    }
    const t = tally.get(p.id);
    if (t && t.total >= MIN_VOTES && !NO_WHIP.includes((p.party ?? "").toLowerCase())) {
      row.rebelPct = round((t.against / t.total) * 100, 1);
      lists.rebelPct.push(row.rebelPct);
    }
    if (divisions.size && cast.has(p.id)) {
      row.attendance = round((cast.get(p.id) / divisions.size) * 100, 1);
      lists.attendance.push(row.attendance);
    }
    const first = careers?.[p.parliament_member_id]?.[0];
    if (first) {
      row.years = round(now.getFullYear() - first + (now.getMonth() >= 6 ? 0.5 : 0), 1);
      lists.years.push(row.years);
    }
    byMp[p.id] = row;
  }

  const distributions = {};
  for (const [key, list] of Object.entries(lists)) distributions[key] = sortedNumbers(list);
  return {
    generatedAt: now.toISOString(),
    divisions: divisions.size,
    expensesYear: politicians.find((p) => p.ipsa_expenses?.year)?.ipsa_expenses.year ?? null,
    distributions,
    byMp,
  };
}
