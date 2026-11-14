import { describe, it, expect } from "vitest";
import { caseStudy, dayGap, shortDate } from "./instrumentsCase";

const data = {
  generated: "2026-11-09",
  recent: [
    { name: "A draft", procedure: "Draft affirmative", laid: "2026-11-05" },
    { name: "A made one", procedure: "Made negative", made: "2026-11-04", laid: "2026-11-05", inForce: "2026-11-26", department: "Dept", link: "https://x" },
  ],
};

describe("instrumentsCase", () => {
  it("picks a made negative instrument with all three dates and counts days from the day it was made", () => {
    const c = caseStudy(data);
    expect(c.name).toBe("A made one");
    expect(c.steps.map((s) => s.day)).toEqual([0, 1, 22]);
    expect(c.windowFrom).toBe(1);
    expect(c.windowTo).toBe(41);
    expect(c.span).toBe(41);
    expect(c.steps[2].label).toBe("Comes into force");
    expect(c.say).toMatch(/21 days after it was laid, while a House could still object/);
  });
  it("says came into force once the date has passed", () => {
    const c = caseStudy({ ...data, generated: "2026-12-01" });
    expect(c.steps[2].label).toBe("Came into force");
  });
  it("returns null when no instrument has all three dates", () => {
    expect(caseStudy({ generated: "2026-11-09", recent: [data.recent[0]] })).toBeNull();
  });
  it("words the gaps and dates", () => {
    expect(dayGap(0, 1)).toBe("1 day after the one before");
    expect(dayGap(1, 22)).toBe("21 days after the one before");
    expect(dayGap(3, 3)).toBe("The same day as the one before");
    expect(shortDate("2026-11-05")).toBe("5 Nov");
  });
});
