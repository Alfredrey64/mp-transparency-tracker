// Who led the UK government, and when, since 1945. Used to shade the charts on
// the Britain in numbers pages so a trend can be read against the government of
// the day. Putting the two side by side shows when things changed, not why:
// most of what these charts measure is shaped by events and decisions far
// beyond any one government.

// Dates are when each prime minister took office, as a year plus how far into the year.
const at = (year, month) => year + (month - 1) / 12;

export const GOVERNMENTS = [
  { pm: "Attlee", short: "Attlee", party: "Labour", from: at(1945, 7) },
  { pm: "Churchill", short: "Churchill", party: "Conservative", from: at(1951, 10) },
  { pm: "Eden", short: "Eden", party: "Conservative", from: at(1955, 4) },
  { pm: "Macmillan", short: "Macmillan", party: "Conservative", from: at(1957, 1) },
  { pm: "Douglas-Home", short: "Home", party: "Conservative", from: at(1963, 10) },
  { pm: "Wilson", short: "Wilson", party: "Labour", from: at(1964, 10) },
  { pm: "Heath", short: "Heath", party: "Conservative", from: at(1970, 6) },
  { pm: "Wilson", short: "Wilson", party: "Labour", from: at(1974, 3) },
  { pm: "Callaghan", short: "Callaghan", party: "Labour", from: at(1976, 4) },
  { pm: "Thatcher", short: "Thatcher", party: "Conservative", from: at(1979, 5) },
  { pm: "Major", short: "Major", party: "Conservative", from: at(1990, 11) },
  { pm: "Blair", short: "Blair", party: "Labour", from: at(1997, 5) },
  { pm: "Brown", short: "Brown", party: "Labour", from: at(2007, 6) },
  { pm: "Cameron", short: "Cameron", party: "Conservative", from: at(2010, 5), note: "Coalition with the Liberal Democrats until 2015" },
  { pm: "May", short: "May", party: "Conservative", from: at(2016, 7) },
  { pm: "Johnson", short: "Johnson", party: "Conservative", from: at(2019, 7) },
  { pm: "Truss", short: "Truss", party: "Conservative", from: at(2022, 9) },
  { pm: "Sunak", short: "Sunak", party: "Conservative", from: at(2022, 10) },
  { pm: "Starmer", short: "Starmer", party: "Labour", from: at(2024, 7) },
];

export const PARTY_COLOURS = { Labour: "#E4003B", Conservative: "#0087DC" };

// The governments overlapping [from, to], each clipped to that window.
export function bandsBetween(from, to, now = Infinity) {
  const out = [];
  GOVERNMENTS.forEach((g, i) => {
    const end = GOVERNMENTS[i + 1]?.from ?? now;
    if (end <= from || g.from >= to) return;
    out.push({ ...g, start: Math.max(g.from, from), end: Math.min(end, to) });
  });
  return out;
}

export function governmentAt(t) {
  let found = null;
  GOVERNMENTS.forEach((g) => { if (g.from <= t) found = g; });
  return found;
}
