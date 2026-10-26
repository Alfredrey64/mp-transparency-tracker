import { describe, it, expect } from "vitest";
import { count, seatsFptp, seatsProportional, story, cleanName } from "./mockElection";

const names = ["Red", "Blue", "Green"];

describe("mock election", () => {
  it("counts votes in each area and finds each area's winner", () => {
    const r = count([[5, 3, 0], [2, 4, 1], [3, 3, 0]], 3);
    expect(r.total).toEqual([10, 10, 1]);
    expect(r.cast).toBe(21);
    expect(r.areas.map((a) => a.winner)).toEqual([0, 1, null]);
    expect(r.areas[2].tied).toBe(true);
    expect(seatsFptp(r, 3)).toEqual([1, 1, 0]);
  });
  it("shares seats in proportion to votes by the largest remainder", () => {
    const r = count([[6, 2, 2], [6, 2, 2], [6, 2, 2], [6, 2, 2]], 3);
    expect(seatsProportional(r, 3).reduce((a, b) => a + b, 0)).toBe(4);
    expect(seatsProportional(r, 3)).toEqual([2, 1, 1]);
    expect(seatsFptp(r, 3)).toEqual([4, 0, 0]);
  });
  it("copes with no votes at all", () => {
    const r = count([[0, 0, 0]], 3);
    expect(r.cast).toBe(0);
    expect(r.areas[0].empty).toBe(true);
    expect(seatsProportional(r, 3)).toEqual([0, 0, 0]);
    expect(story(r, names)).toMatch(/No votes/);
  });
  it("tells the class when votes and seats disagree", () => {
    // Red wins two areas narrowly, Blue wins one by a mile: Blue has more votes, Red more areas.
    const r = count([[5, 4, 0], [5, 4, 0], [0, 20, 0]], 3);
    expect(story(r, names)).toMatch(/Blue won the most votes .* but Red won the most areas/);
  });
  it("points out a tied area", () => { expect(story(count([[3, 3, 0]], 3), names)).toMatch(/tied/); });
  it("tidies names", () => {
    expect(cleanName("  The   Fun   Party ", "x")).toBe("The Fun Party");
    expect(cleanName("   ", "Party 1")).toBe("Party 1");
    expect(cleanName("a".repeat(60), "x")).toHaveLength(28);
  });
});
