// Small pieces of the Party History page that must stay right as time passes, kept apart from the component so they can be tested.

// How old a party is this year. Worked out when the page is shown, from the clock, so it goes up by one on 1 January with nothing to update. `now` is a parameter for tests.
export function partyAge(founded, now = new Date()) {
  const year = Number(founded);
  return Number.isFinite(year) ? Math.max(0, now.getFullYear() - year) : 0;
}

// Two capital letters for a portrait that has not loaded, leaving out the small words in names such as "Rhun ap Iorwerth".
export function initials(name) {
  return String(name ?? "").replace(/\b(ap|de|of|the)\b/gi, "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// The scale of the "how long each party has been around" chart: it starts in 1750 and ends at the next round decade after this year, with a gridline every fifty years and a
// marker for today. Worked out from the clock, so the chart stays right as years pass. `now` is a parameter for tests.
export function chartScale(now = new Date()) {
  const from = 1750;
  const today = now.getFullYear();
  const to = Math.ceil((today + 1) / 10) * 10;
  const ticks = [];
  for (let y = from; y <= today; y += 50) ticks.push(y);
  const pct = (year) => ((Math.min(Math.max(year, from), to) - from) / (to - from)) * 100;
  return { from, to, today, ticks, pct };
}
