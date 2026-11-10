import { plainPoints } from "./billPlain";
import { getBillDescription } from "./billDescriptions";

// What opens under a bill's one-line summary: the official long title read clause by clause in everyday words, then the official wording itself.
// Returns null when opening it would only repeat the summary above it (a title with a single clause and no hand-written description), so a bill
// never gets a button that reveals nothing new.
export const MAX_POINTS = 6;

export function billMore(bill) {
  const longTitle = String(bill?.long_title ?? "").replace(/\s+/g, " ").trim();
  if (!longTitle) return null;
  const points = plainPoints(longTitle);
  const hand = Boolean(getBillDescription(bill.short_title, null));
  if (points.length < 2 && !hand) return null;
  return { points: points.slice(0, MAX_POINTS), extra: Math.max(0, points.length - MAX_POINTS), official: longTitle };
}
