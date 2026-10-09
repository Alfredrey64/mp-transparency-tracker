// Working out the figures on the "Who is involved in crime" card from crimePeople.json (see fetch-crime-people.js).
// Plain arithmetic only, so it can be tested without drawing anything.

export const GROUPS = [
  { id: "white", label: "White" },
  { id: "asian", label: "Asian" },
  { id: "black", label: "Black" },
  { id: "mixed", label: "Mixed" },
  { id: "other", label: "Other" },
];

export const groupLabel = (id) => GROUPS.find((g) => g.id === id)?.label ?? id;

const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

// How many times higher a is than b: "about twice", "2.2 times", "about the same".
export function timesPhrase(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  const r = a / b;
  if (r >= 0.9 && r <= 1.1) return "about the same rate";
  if (r > 1.1 && r < 1.35) return "a little higher";
  if (r >= 1.9 && r < 2.1) return "about twice the rate";
  if (r >= 1.35 && r < 1.9) return `about ${round(r, 1)} times the rate`;
  if (r >= 2.1) return `about ${round(r, 1)} times the rate`;
  if (r <= 0.74) return `about ${round(1 / r, 1)} times lower`;
  return "a little lower";
}

// Each group's share of the population of England and Wales (2021 Census), from the population behind the arrest rates.
export function populationShares(population) {
  const total = GROUPS.reduce((n, g) => n + (population[g.id] ?? 0), 0);
  return Object.fromEntries(GROUPS.map((g) => [g.id, total ? ((population[g.id] ?? 0) / total) * 100 : 0]));
}

// Prisoners per 1,000 people of the same group, and each group's share of prisoners of known ethnicity against its share of the population.
export function prisonFigures(prison, population) {
  const known = GROUPS.reduce((n, g) => n + (prison.groups[g.id] ?? 0), 0);
  const shares = populationShares(population);
  return GROUPS.map((g) => ({
    id: g.id, label: g.label, number: prison.groups[g.id] ?? 0,
    rate: population[g.id] ? round(((prison.groups[g.id] ?? 0) / population[g.id]) * 1000, 2) : null,
    shareOfPrisoners: known ? round(((prison.groups[g.id] ?? 0) / known) * 100, 1) : 0,
    shareOfPopulation: round(shares[g.id], 1),
  }));
}

// The offences each group is held for, as a share of that group's own cases (of known offence), biggest first.
export function offenceMatrix(offences) {
  const groups = GROUPS.map((g) => g.id).filter((id) => offences.groups[id]);
  const names = [...new Set(groups.flatMap((id) => Object.keys(offences.groups[id].byOffence)))];
  const rows = names.map((name) => {
    const cells = Object.fromEntries(groups.map((id) => {
      const g = offences.groups[id];
      return [id, g.total ? round(((g.byOffence[name] ?? 0) / g.total) * 100, 1) : 0];
    }));
    const overall = groups.reduce((n, id) => n + (offences.groups[id].byOffence[name] ?? 0), 0);
    return { name, cells, overall };
  });
  // "Other" always last.
  return rows.sort((a, b) => (a.name === "Other") - (b.name === "Other") || b.overall - a.overall);
}

// Share of cases where the person's ethnicity is not recorded.
export function unknownShare(offences) {
  const unknown = offences.groups.unknown?.total ?? 0;
  const known = GROUPS.reduce((n, g) => n + (offences.groups[g.id]?.total ?? 0), 0);
  return known + unknown ? round((unknown / (known + unknown)) * 100, 0) : 0;
}
