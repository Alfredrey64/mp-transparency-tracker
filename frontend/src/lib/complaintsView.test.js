import { describe, expect, it } from "vitest";
import { investigated, figuresFor, mostUpheld, slowestToComply, councilOptions, against } from "./complaintsView";

const c = (over = {}) => ({ name: "Example Council", decided: 100, upheld: 8, notUpheld: 2, upholdRate: 80, similarUpholdRate: 74, upheldPer100k: 3.2, similarPer100k: 2.5, remedyBefore: 25, similarRemedyBefore: 15, outcomes: 8, onTime: 6, timely: 75, similarTimely: 70, compliance: 100, ...over });
const data = { councils: { E1: c(), E2: c({ name: "Another Council", upheldPer100k: 9, upheld: 20, timely: 20, outcomes: 10 }), E3: c({ name: "Small Council", upheld: 1, upheldPer100k: 30, timely: 0, outcomes: 1 }) } };

describe("investigated", () => { it("adds upheld and not upheld", () => expect(investigated(c())).toBe(10)); });

describe("figuresFor", () => {
  it("gives each figure with the similar-council figure beside it", () => {
    const f = figuresFor(c());
    expect(f[1]).toMatchObject({ value: "80%", note: "Similar councils: 74%." });
    expect(f.find((r) => r.label.startsWith("Upheld per"))).toMatchObject({ value: "3.2" });
  });
  it("says so when a council had nothing investigated", () => {
    const f = figuresFor(c({ upholdRate: null, upheld: 0, notUpheld: 0, remedyBefore: null, timely: null }));
    expect(f[1].value).toBe("None investigated");
    expect(f.at(-1).value).toBe("None recorded");
  });
});

describe("league lists", () => {
  it("ranks the most upheld per 100,000 and leaves out councils with fewer than three upheld", () => {
    expect(mostUpheld(data).map((r) => r.id)).toEqual(["E2", "E1"]);
  });
  it("ranks the slowest to comply and leaves out councils with fewer than five outcomes", () => {
    expect(slowestToComply(data).map((r) => r.id)).toEqual(["E2", "E1"]);
  });
});

describe("councilOptions and against", () => {
  it("lists councils A to Z", () => expect(councilOptions(data).map((o) => o.name)).toEqual(["Another Council", "Example Council", "Small Council"]));
  it("compares with similar councils only when there are enough cases", () => {
    expect(against(c())).toBe("above");
    expect(against(c({ upholdRate: 72 }))).toBe("close to");
    expect(against(c({ upholdRate: 50 }))).toBe("below");
    expect(against(c({ upheld: 1, notUpheld: 1 }))).toBe("");
  });
});
