import { describe, expect, it } from "vitest";
import { STAGE_DEFS, buildRoute } from "./billRoute";

describe("bill walk-through routes", () => {
  for (const first of ["Commons", "Lords"]) {
    const steps = buildRoute(first);
    const second = first === "Commons" ? "Lords" : "Commons";
    it(`starting in the ${first}: five stages there, then five in the other House`, () => {
      const stages = steps.filter((s) => s.show && !s.hop && !s.done);
      expect(stages.slice(0, 5).map((s) => [s.house, s.col])).toEqual(STAGE_DEFS.map((_, i) => [first, i]));
      expect(stages.slice(5, 10).map((s) => [s.house, s.col])).toEqual(STAGE_DEFS.map((_, i) => [second, i]));
    });
    it("hands over between Houses with the ring hidden, then ping-pongs and ends at Royal Assent", () => {
      const handover = steps.findIndex((s) => !s.show && s.house === first && !s.done);
      expect(handover).toBe(5);
      expect(steps[handover + 1]).toMatchObject({ house: second, col: 0, glide: false });
      const pong = steps.filter((s) => s.hop !== undefined);
      expect(pong.map((s) => s.house)).toEqual([first, second, first, second]);
      expect(steps.filter((s) => s.done && s.show)).toHaveLength(1);
      expect(steps.at(-1)).toMatchObject({ done: true, show: false });
    });
    it("never glides across the board between Houses on a hand-over or a new route", () => {
      steps.forEach((s, i) => {
        if (i > 0 && steps[i - 1].house !== s.house && s.col === 0) expect(s.glide).toBe(false);
      });
      expect(steps[0].glide).toBe(false);
    });
    it("has a title, some text and a time for every step", () => {
      for (const s of steps) {
        expect(s.title.length).toBeGreaterThan(3);
        expect(s.text.length).toBeGreaterThan(20);
        expect(s.ms).toBeGreaterThan(300);
      }
    });
  }
  it("says the right things about who debates, and does not claim every bill starts in the Commons", () => {
    expect(buildRoute("Commons")[1].text).toMatch(/MPs debate/);
    expect(buildRoute("Lords")[1].text).toMatch(/Peers debate/);
    expect(buildRoute("Lords")[0].text).toMatch(/House of Lords instead/);
    expect(buildRoute("Commons")[0].text).toMatch(/Many bills start in the House of Commons/);
  });
});
