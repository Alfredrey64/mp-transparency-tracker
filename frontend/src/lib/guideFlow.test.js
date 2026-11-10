import { describe, it, expect } from "vitest";
import { QUESTIONS, ANSWERS, walk } from "./guideFlow";

describe("the who-to-contact guide", () => {
  it("asks the first question before anything has been answered", () => {
    const r = walk([]);
    expect(r.node).toBe("start");
    expect(r.answer).toBeNull();
    expect(r.trail).toEqual([]);
  });
  it("follows a council complaint to the Ombudsman route, at the step the reader has reached", () => {
    // A council service, England, anything but housing, "complained to the service and not happy".
    const r = walk([0, 0, 1, 1]);
    expect(r.node).toBeNull();
    expect(r.answer.title).toMatch(/council, then the Ombudsman/);
    expect(r.here).toBe(1);
    expect(r.answer.steps).toHaveLength(3);
    expect(r.trail.map((t) => t.option.label)).toEqual(["A council service", "England", "Anything else the council does", "I complained to the service and I am not happy"]);
  });
  it("gives council housing and the other nations their own answers", () => {
    expect(walk([0, 0, 0]).answer.title).toMatch(/Housing Ombudsman/);
    expect(walk([0, 1]).answer.title).toMatch(/different ombudsman/);
  });
  it("mentions the 16 week rule only when the council has not replied", () => {
    expect(walk([0, 0, 1, 3]).answer.callout).toMatch(/16 weeks/);
    expect(walk([0, 0, 1, 1]).answer.callout).toBeNull();
  });
  it("sends a serious police matter to the right place", () => {
    expect(walk([3, 1]).answer.lead).toMatch(/deaths and serious injuries/);
    expect(walk([3, 0]).answer.lead).toMatch(/starts with the force/);
  });
  it("marks the right step on the information request route", () => {
    const r = walk([4, 3]);
    expect(r.answer.steps[r.here].title).toMatch(/internal review/);
  });
  it("ignores a pick that does not exist instead of breaking", () => {
    expect(walk([99]).node).toBe("start");
  });
  it("only points at questions and answers that exist", () => {
    for (const [id, q] of Object.entries(QUESTIONS)) {
      for (const o of q.options) expect(QUESTIONS[o.to] || ANSWERS[o.to], `${id} → ${o.to}`).toBeTruthy();
    }
    // Every route step the reader can be "here" on exists.
    for (const q of Object.values(QUESTIONS)) for (const o of q.options) {
      if (o.here != null) expect(ANSWERS[o.to]({ flag: o.flag }).steps.length, o.label).toBeGreaterThan(o.here);
    }
  });
});
