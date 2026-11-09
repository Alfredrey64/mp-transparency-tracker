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
