// Lays out one day's entries along a clock for the Today timeline. Pure, so it is tested without a page.
//
// Only entries with a time can be placed. Each goes in a lane (Commons, Lords, or Committees for committee evidence), at its start time. The calendar gives start times and no
// lengths, so entries are drawn as points, never as bars, and nothing here suggests how long anything lasts. Points that would touch are stacked in extra rows of the lane.
import { clockMinutes } from "./upcoming";

export const LANES = ["Commons", "Lords", "Committees"];
export const LANE_COLOUR = { Commons: "#1F7A4D", Lords: "#B3262E", Committees: "#2C7DA0" };
const GAP = 11.5; // the least distance, in percent of the clock's width, between two points in the same row

export const laneOf = (e) => (e.k === "hearing" ? "Committees" : e.h === "L" ? "Lords" : "Commons");

// entries: [{ time, h, k, ... }]. nowMinutes: minutes since midnight in London, or null. gap: the least distance between two points in a row, for a clock that draws them smaller. Returns null when nothing has a time.
export function layoutTimeline(entries, nowMinutes = null, gap = GAP) {
  const timed = entries.filter((e) => clockMinutes(e.time) !== null);
  if (!timed.length) return null;
  const mins = timed.map((e) => clockMinutes(e.time));
  const start = Math.min(9 * 60, Math.floor(Math.min(...mins) / 60) * 60);
  const end = Math.min(24 * 60, Math.max(18 * 60, Math.ceil((Math.max(...mins) + 30) / 60) * 60));
  const span = end - start;
  const pct = (m) => ((m - start) / span) * 100;

  const lanes = LANES.map((name) => {
    const rowEnds = [];
    const dots = timed
      .filter((e) => laneOf(e) === name)
      .sort((a, b) => clockMinutes(a.time) - clockMinutes(b.time))
      .map((entry) => {
        const at = pct(clockMinutes(entry.time));
        let row = rowEnds.findIndex((last) => at - last >= gap);
        if (row === -1) row = rowEnds.length;
        rowEnds[row] = at;
        return { entry, at, row };
      });
    return { name, rows: Math.max(1, rowEnds.length), dots };
  });

  const hours = [];
  for (let m = start; m <= end; m += 60) hours.push({ m, at: pct(m) });
  const now = nowMinutes !== null && nowMinutes >= start && nowMinutes <= end ? pct(nowMinutes) : null;
  return { start, end, hours, lanes: lanes.filter((l) => l.dots.length), now, untimed: entries.length - timed.length };
}
