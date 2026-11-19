// What the Have your say page says about open consultations: counts by how soon they close. Pure and tested.

export const daysBetween = (from, to) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);

// How many consultations close within each window of days, counted from `today`.
export function closingCounts(items, today) {
  const within = (days) => items.filter((c) => c.closes && daysBetween(today, c.closes) <= days).length;
  return { week: within(7), fortnight: within(14), month: within(30), undated: items.filter((c) => !c.closes).length };
}
