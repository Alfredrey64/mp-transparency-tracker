import { describe as suite, it, expect } from "vitest";
import { summary, browse, describe, monthName, FILTERS } from "./instrumentsView";

const data = {
  kinds: { "Made negative": { route: "object", label: "Already law, unless a House objects", say: "It is already law, and stays law unless either House objects within 40 days." }, "Draft affirmative": { route: "approve", label: "Draft, needs approval", say: "It cannot become law until Parliament approves it." } },
  months: [{ month: "2026-01", approve: 3, object: 7 }, { month: "2026-02", approve: 1, object: 1 }, { month: "2026-03", approve: 2, object: 18 }],
  recent: [
    { id: "a", name: "The Fishing Regulations 2026", procedure: "Made negative", route: "object", laid: "2026-03-02", ref: "SI 2026/50", department: "Defra", inForce: "2026-03-30" },
    { id: "b", name: "The Pensions Order 2026", procedure: "Draft affirmative", route: "approve", laid: "2026-03-01", ref: null, department: "Department for Work and Pensions", inForce: null },
  ],
};

suite("summary", () => {
  it("adds up the months and finds the share that need approval and the busiest month", () => {
    const s = summary(data);
    expect(s).toMatchObject({ total: 32, approve: 6, object: 26, median: 10 });
    expect(s.shareApprove).toBeCloseTo(6 / 32);
    expect(s.busiest).toEqual({ month: "2026-03", count: 20 });
  });
});

suite("browse", () => {
  it("filters by route and searches names, departments and references", () => {
    expect(browse(data, { filter: "approve" }).map((r) => r.id)).toEqual(["b"]);
    expect(browse(data, { query: "fishing" }).map((r) => r.id)).toEqual(["a"]);
    expect(browse(data, { query: "work and pensions" }).map((r) => r.id)).toEqual(["b"]);
    expect(browse(data, { query: "2026/50" }).map((r) => r.id)).toEqual(["a"]);
    expect(browse(data, { query: "zzz" })).toEqual([]);
  });
  it("has a filter for all and each route", () => {
    expect(FILTERS.map(([k]) => k)).toEqual(["all", "approve", "object"]);
  });
});

suite("describe", () => {
  it("says whether it is in force yet", () => {
    expect(describe(data, data.recent[0], "2026-04-10").force).toBe("came into force on");
    expect(describe(data, data.recent[0], "2026-03-10").say).toMatch(/already law/);
    expect(describe(data, data.recent[1], "2026-03-10").force).toBe("");
    expect(describe(data, { ...data.recent[0], inForce: "2026-05-01" }, "2026-04-10").force).toBe("comes into force on");
  });
  it("names a month in words", () => { expect(monthName("2026-03")).toBe("March 2026"); });
});
