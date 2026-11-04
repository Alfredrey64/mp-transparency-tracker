import { describe, it, expect } from "vitest";
import { currentIndex } from "./billStagesView";

const stages = [
  { house: "Lords", stage: "1st reading", dates: ["2026-05-14"] },
  { house: "Lords", stage: "2nd reading", dates: ["2026-06-01"] },
  { house: "Commons", stage: "2nd reading", dates: [] },
];

describe("currentIndex", () => {
  it("marks the stage that matches where the bill is, in the right House", () => {
    expect(currentIndex(stages, { current_stage: "2nd reading", current_house: "Lords" })).toBe(1);
    expect(currentIndex(stages, { current_stage: "2nd reading", current_house: "Commons" })).toBe(2);
  });
  it("marks none when the stage is not in the list, and treats a bill that became law or fell as finished", () => {
    expect(currentIndex(stages, { current_stage: "Royal Assent", current_house: "Commons" })).toBe(-1);
    expect(currentIndex(stages, { is_act: true })).toBe(3);
    expect(currentIndex(stages, { is_defeated: true })).toBe(3);
  });
});
