import { describe, it, expect } from "vitest";
import { layoutTimeline, laneOf } from "./dayTimeline";

const e = (time, h = "C", k = "debate") => ({ time, h, k, t: `${k} ${time}` });

describe("layoutTimeline", () => {
  it("returns nothing when no entry has a time", () => {
    expect(layoutTimeline([e(""), e(undefined)])).toBeNull();
  });
  it("puts each entry in the lane for its house, and committee evidence in Committees", () => {
    expect(laneOf(e("10:00", "C"))).toBe("Commons");
    expect(laneOf(e("10:00", "L"))).toBe("Lords");
    expect(laneOf(e("10:00", "L", "hearing"))).toBe("Committees");
  });
  it("covers at least 9am to 6pm and widens to fit early and late entries", () => {
    const a = layoutTimeline([e("11:00")]);
    expect([a.start, a.end]).toEqual([540, 1080]);
    const b = layoutTimeline([e("08:15"), e("20:10")]);
    expect(b.start).toBe(480);
    expect(b.end).toBe(21 * 60);
  });
  it("places points by time, and stacks points that would touch in another row", () => {
    const l = layoutTimeline([e("10:00"), e("10:05"), e("15:00")]);
    const dots = l.lanes[0].dots;
    expect(dots[0].at).toBeLessThan(dots[2].at);
    expect(dots[0].row).toBe(0);
    expect(dots[1].row).toBe(1);
    expect(dots[2].row).toBe(0);
    expect(l.lanes[0].rows).toBe(2);
  });
  it("lets a clock that draws smaller points pack them closer in a row", () => {
    const close = [e("10:00"), e("10:40")];
    expect(layoutTimeline(close).lanes[0].rows).toBe(2);
    expect(layoutTimeline(close, null, 5).lanes[0].rows).toBe(1);
  });
  it("drops lanes with nothing in them and counts the entries with no time", () => {
    const l = layoutTimeline([e("10:00"), e("")]);
    expect(l.lanes.map((x) => x.name)).toEqual(["Commons"]);
    expect(l.untimed).toBe(1);
  });
  it("marks now only when it falls inside the clock", () => {
    expect(layoutTimeline([e("10:00")], 12 * 60).now).toBeGreaterThan(0);
    expect(layoutTimeline([e("10:00")], 23 * 60).now).toBeNull();
    expect(layoutTimeline([e("10:00")], null).now).toBeNull();
  });
});
