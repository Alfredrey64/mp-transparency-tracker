import { describe, it, expect } from "vitest";
import { TRICKS, SPIN_ROUNDS, TRACE, TOOLKIT, PAPER, trickOptions, questionOptions, barHeights, percentUp, allClaims } from "./teacherGamesSpin";

describe("the claims", () => {
  const claims = allClaims();
  it("has three rounds of three claims, each one different", () => {
    expect(SPIN_ROUNDS).toHaveLength(3);
    for (const r of SPIN_ROUNDS) expect(r.claims).toHaveLength(3);
    expect(new Set(claims.map((c) => c.id)).size).toBe(9);
    expect(new Set(claims.map((c) => c.trick)).size).toBe(9);
  });
  it("offers four different tricks, and the right one is among them", () => {
    for (const c of claims) {
      expect(c.options, c.id).toHaveLength(4);
      expect(new Set(c.options).size, c.id).toBe(4);
      expect(c.options, c.id).toContain(c.trick);
      for (const k of c.options) expect(TRICKS[k], `${c.id}: ${k}`).toBeTruthy();
      expect(c.options.filter((k) => k === c.trick)).toHaveLength(1);
    }
  });
  it("does not always put the right trick in the same place", () => {
    const places = new Set(claims.map((c) => c.options.indexOf(c.trick)));
    expect(places.size).toBeGreaterThanOrEqual(3);
  });
  it("has three questions for each, the first of which is the best", () => {
    for (const c of claims) {
      expect(c.ask, c.id).toHaveLength(3);
      for (const q of c.ask) expect(q.length).toBeGreaterThan(10);
      for (let i = 0; i < 6; i += 1) {
        const opts = questionOptions(c, i);
        expect(opts).toHaveLength(3);
        expect(opts.filter((o) => o.best)).toHaveLength(1);
        expect(opts.find((o) => o.best).text).toBe(c.ask[0]);
        expect(new Set(opts.map((o) => o.text)).size).toBe(3);
      }
    }
  });
  it("puts the best question in different places across the claims", () => {
    const places = new Set(claims.map((c, i) => questionOptions(c, i).findIndex((o) => o.best)));
    expect(places.size).toBe(3);
  });
  it("has a headline, a reveal and a picture kind for every claim, short enough to read at a glance", () => {
    const kinds = new Set(["axis", "small", "quote", "cause", "sample", "old", "loaded", "rate", "source"]);
    for (const c of claims) {
      expect(kinds.has(c.kind), c.id).toBe(true);
      expect(c.headline.length, c.id).toBeLessThanOrEqual(70);
      expect(c.reveal.length, c.id).toBeGreaterThan(40);
      expect(c.reveal.length, c.id).toBeLessThanOrEqual(260);
    }
  });
  it("has one picture kind for each trick it teaches", () => {
    for (const c of claims) expect(c.kind, c.id).toBe(c.trick);
  });
  it("stays neutral: made-up, with no real party, politician, paper or broadcaster", () => {
    const text = JSON.stringify([SPIN_ROUNDS, TRACE, TOOLKIT, PAPER]).toLowerCase();
    for (const word of ["labour", "conservative", "tory", "reform uk", "lib dem", "liberal democrat", "green party", "snp", "plaid", "starmer", "sunak", "farage", "johnson", "bbc", "guardian", "telegraph", "daily mail", "sun ", "gb news", "sky news", "itv", "downing", "westminster"]) {
      expect(text.includes(word), `mentions "${word}"`).toBe(false);
    }
  });
});

describe("the sums behind the pictures", () => {
  it("squashes a chart when the axis does not start at zero, and tells the truth when it does", () => {
    const squashed = barHeights([90400, 92100], 90000);
    expect(squashed[1]).toBe(1);
    expect(squashed[0]).toBeLessThan(0.25);
    const fair = barHeights([90400, 92100], 0);
    expect(fair[0]).toBeGreaterThan(0.97);
    expect(barHeights([5, 5], 5)).toEqual([1, 1]);
    expect(barHeights([0, 0], 0)).toEqual([1, 1]);
  });
  it("matches the numbers written in the claims", () => {
    const [lib, swim, , , , , , bypass] = allClaims();
    expect(percentUp(...lib.seen.bars.map((b) => b[1]))).toBe(2);
    expect(percentUp(swim.fair.before, swim.fair.after)).toBe(50);
    const [a, b] = bypass.seen.bars.map((x) => x[1]);
    const [c1, c2] = bypass.fair.cars;
    expect((a / c1) * 1000).toBe(bypass.fair.per[0]);
    expect((b / c2) * 1000).toBe(bypass.fair.per[1]);
    expect(b).toBeGreaterThan(a);
    expect(percentUp(a, b)).toBe(50);
  });
});

describe("tracing a source", () => {
  it("has four places to choose from and one right answer, with a reason", () => {
    for (const t of TRACE) {
      expect(t.options).toHaveLength(4);
      expect(t.answer).toBeGreaterThanOrEqual(0);
      expect(t.answer).toBeLessThan(4);
      expect(t.why.length).toBeGreaterThan(60);
    }
    expect(new Set(TRACE.map((t) => t.answer)).size).toBe(2);
  });
  it("leaves four questions to take away", () => {
    expect(TOOLKIT).toHaveLength(4);
    for (const [q, a] of TOOLKIT) { expect(q.endsWith("?")).toBe(true); expect(a.length).toBeGreaterThan(20); }
  });
  it("lists a trick's words for every offer", () => {
    expect(trickOptions(allClaims()[0]).map((o) => o.key)).toEqual(["small", "loaded", "axis", "old"]);
  });
});
