// billStages.js
//
// Turns the Bills API's list of stages for one bill into the short, dated list the bill cards show as "Its journey so far". Pure, so it is tested without the network.
// Each stage the bill has reached (or is scheduled for) in a House comes with the days it was sat on; a stage with no date yet is kept, undated, so the card can show what is coming.

const day = (d) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null);

// [{ house, stage, dates: ["2026-05-14", ...] }] in the order the API gives (its sortOrder), without a stage listed twice for the same House and sitting days.
export function shapeStages(items) {
  const out = [];
  for (const s of [...(items ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
    if (!s?.description || !s.house) continue;
    const dates = [...new Set((s.stageSittings ?? []).map((x) => day(x.date)).filter(Boolean))].sort();
    if (out.some((o) => o.house === s.house && o.stage === s.description && o.dates.join() === dates.join())) continue;
    out.push({ house: s.house, stage: s.description, dates });
  }
  return out;
}
