// The sums behind the pictures on the Farming and food page (components/story/FarmArt.jsx), kept apart so they can be tested.

// How full each of the ten crates in a row is for a share of 0 to 110%: the first crate is 0-10%, and so on, and an eleventh dashed crate holds anything over 100%.
// Returns eleven numbers from 0 to 1.
export function crateFills(percent, crates = 10) {
  const per = 100 / crates;
  return Array.from({ length: crates + 1 }, (_, i) => {
    if (i === crates) return Math.min(1, Math.max(0, (percent - 100) / per));
    return Math.min(1, Math.max(0, (percent - i * per) / per));
  });
}

// A hundred plots standing for the UK's land, filled from the top left: which of them are farmed. `farmed` is a percentage.
export function landPlots(farmed) {
  const n = Math.round(Math.min(100, Math.max(0, farmed)));
  return Array.from({ length: 100 }, (_, i) => ({ i, x: i % 10, y: Math.floor(i / 10), farmed: i < n }));
}

// The plots are filled row by row, but they open as a ripple from the top left, so each plot's delay follows its distance from that corner.
export const rippleOrder = (x, y) => x + y;

// A point on a ring that is `share` percent full, for the payment rings: the length of the arc out of a circle of radius r.
export function arcLength(share, r) {
  const c = 2 * Math.PI * r;
  return { on: (Math.min(100, Math.max(0, share)) / 100) * c, all: c };
}

// The effective inheritance tax rate on farm assets, by the value of the estate's qualifying assets, before and after 6 April 2026. Above the limit only half the value
// is relieved, so the part above it is taxed at half of 40%. This is arithmetic from the figures on the page, not a figure from the announcement.
export const IHT = { limit: 2.5, couple: 5, full: 40, rateAbove: 20 };
export function ihtRate(valueMillions, after = true) {
  if (!after) return 0;
  return valueMillions <= IHT.limit ? 0 : IHT.rateAbove;
}

// Where a rate sits on the price ruler (0 to `max` percent) as a share of its length.
export const rulerPos = (rate, max = 20) => Math.min(1, Math.max(0, rate / max));
