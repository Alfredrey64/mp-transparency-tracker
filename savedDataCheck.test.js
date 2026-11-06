import { describe, expect, it } from "vitest";
import { judge, weigh } from "./savedDataCheck.js";

const rows = (n) => JSON.stringify({ generatedAt: "2026-11-06", items: Array.from({ length: n }, (_, i) => ({ id: i, name: `Item number ${i}`, value: i * 3 })) });

describe("weigh", () => {
  it("counts every value, whatever the spacing or key order", () => {
    expect(weigh({ a: 1, b: [1, 2, { c: 3 }] })).toBe(weigh(JSON.parse('{"b":[1,2,{"c":3}],"a":1}')));
    expect(weigh([])).toBe(1);
    expect(weigh("x")).toBe(1);
  });
});

describe("judge", () => {
  it("keeps a file that changed a little", () => {
    expect(judge(rows(200), rows(210))).toEqual({ ok: true });
    expect(judge(rows(200), rows(150))).toEqual({ ok: true });
  });
  it("puts back a file that is not JSON, empty, or a fraction of what it was", () => {
    expect(judge(rows(200), "{ half a file").reason).toMatch(/not valid JSON/);
    expect(judge(rows(200), "[]").reason).toMatch(/empty/);
    expect(judge(rows(200), JSON.stringify({ items: [] })).reason).toMatch(/holds \d+ values where the committed file holds/);
    expect(judge(rows(200), rows(20)).ok).toBe(false);
  });
  it("accepts a new file if it is valid, and does not compare tiny files", () => {
    expect(judge(null, rows(5))).toEqual({ ok: true });
    expect(judge('{"a":[1,2,3]}', '{"a":[]}')).toEqual({ ok: true });
    expect(judge(null, "nope").ok).toBe(false);
  });
  it("lets through a committed file that was already broken", () => {
    expect(judge("not json", rows(5))).toEqual({ ok: true });
  });
});
