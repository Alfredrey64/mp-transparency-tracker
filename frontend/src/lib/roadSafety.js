// The Your area road casualty card's figures, read from the table built by roadCasualties.js (Department for Transport "STATS19": every road collision in Great Britain that police
// recorded with an injury). Counts are people, by the year of the collision.

export const USER_LABEL = { walking: "People on foot", cycling: "Cyclists", motorbike: "Motorcyclists", vehicle: "People in cars, vans, buses and lorries", other: "Other road users" };
export const USER_ORDER = ["walking", "cycling", "motorbike", "vehicle", "other"];

export function roadView(data, code) {
  const a = data?.areas?.[code];
  if (!a || !Array.isArray(data.years)) return null;
  const years = data.years.map((year) => {
    const [k, s, l] = a.by[year] ?? [0, 0, 0];
    const serious = Math.round(s);
    const slight = Math.round(l);
    return { year, killed: k, serious, slight, ksi: k + serious, total: k + serious + slight };
  });
  const latest = years[years.length - 1];
  const users = USER_ORDER.map((key) => ({ key, label: USER_LABEL[key], count: Math.round(a.now?.[key] ?? 0) })).filter((u) => u.count > 0).sort((x, y) => y.count - x.count);
  const gbLatest = data.gb?.by?.[data.latest] ?? null;
  return { years, latest, users, usersTotal: users.reduce((t, u) => t + u.count, 0), gbKsi: gbLatest ? Math.round(gbLatest[0] + gbLatest[1]) : null, gbKilled: gbLatest ? gbLatest[0] : null, fiveYearKilled: years.reduce((t, y) => t + y.killed, 0) };
}
