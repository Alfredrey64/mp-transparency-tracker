import { describe, it, expect } from "vitest";
import { rounds, starsFor, LAW_TROUBLE, govEvents, PLACES, ROLE_PLACE, placeOptions, BALLOTS, countBallots, HIGHER_LOWER, lordsReply, pingPongStars, PUZZLES, solutions, checkDeal, puzzleScenario, POLICIES, ISSUES, TARGETS, letterParts, LETTER_SHUFFLE, TERMS, bingoCard, LINES, completedLines, JARGON_ROUNDS, meaningsOf } from "./teacherGamesMore";
import { ROLES, SCENARIOS, tenPounds } from "./teacherGames";

describe("rounds and stars", () => {
  it("splits the decisions into rounds of four", () => {
    const r = rounds();
    expect(r.map((x) => x.length)).toEqual([4, 4, 4]);
    expect(new Set(r.flat().map((d) => d.id)).size).toBe(12);
  });
  it("gives three stars for a clean round", () => { expect([0, 1, 2, 5].map(starsFor)).toEqual([3, 2, 1, 1]); });
});

describe("make a law, in trouble", () => {
  it("has a real answer for every question", () => {
    for (const s of LAW_TROUBLE) { expect(s.answer).toBeLessThan(s.options.length); expect(s.at).toBeGreaterThanOrEqual(0); expect(s.at).toBeLessThan(8); }
  });
});

describe("hold the government together", () => {
  const clear = SCENARIOS[0];
  it("a big majority survives ten rebels, a thin one does not", () => {
    expect(govEvents(clear, ["Red", "Blue"])[1].wins).toBe(true);
    const thin = govEvents(SCENARIOS[2], ["Blue", "Green"]);
    expect(thin[0].wins).toBe(true);
    expect(thin[1].wins).toBe(false);
  });
  it("loses the smallest party's seats when it leaves", () => {
    const e = govEvents(clear, ["Red", "Gold"])[2];
    expect(e.gov).toBe(372);
    expect(e.wins).toBe(true);
  });
});

describe("role places", () => {
  it("gives every role a place and four choices that include it", () => {
    for (const r of ROLES) {
      expect(PLACES.map((p) => p.key)).toContain(ROLE_PLACE[r.key]);
      const o = placeOptions(r.key);
      expect(o).toHaveLength(4);
      expect(o.map((p) => p.key)).toContain(ROLE_PLACE[r.key]);
    }
  });
});

describe("count the votes", () => {
  it("counts twelve papers, one of them spoiled, and the winner has the most votes without half", () => {
    const c = countBallots();
    expect(BALLOTS).toHaveLength(12);
    expect(c).toMatchObject({ a: 5, b: 4, c: 2, x: 1, valid: 11 });
    expect(c.winners).toEqual(["a"]);
    expect(c.majority).toBe(false);
  });
});

describe("higher or lower", () => {
  it("compares slices that really are different", () => {
    const real = Object.fromEntries(tenPounds().map((r) => [r.key, r.pounds]));
    for (const [a, b] of HIGHER_LOWER) { expect(real[a]).toBeDefined(); expect(real[a]).not.toBeCloseTo(real[b], 1); }
  });
});

describe("ping-pong", () => {
  it("ends when the Commons agrees or compromises, and when the Lords give way", () => {
    expect(lordsReply("accept", 0)).toMatchObject({ end: true, trips: 0 });
    expect(lordsReply("compromise", 0)).toMatchObject({ end: true, trips: 1 });
    expect(lordsReply("reject", 0)).toMatchObject({ end: false, trips: 1 });
    expect(lordsReply("reject", 1)).toMatchObject({ end: true, trips: 1 });
  });
  it("gives more stars for fewer trips", () => { expect([0, 1, 2, 3, 4, 9].map(pingPongStars)).toEqual([3, 3, 2, 2, 1, 1]); });
});

describe("coalition negotiator", () => {
  it("has exactly one government that works in each puzzle", () => {
    expect(solutions(PUZZLES[0]).map((s) => s.group)).toEqual([["Red", "Green"]]);
    expect(solutions(PUZZLES[1]).map((s) => s.group)).toEqual([["Blue", "Green"]]);
  });
  it("uses scenarios that exist and policies that exist", () => {
    for (const p of PUZZLES) {
      expect(puzzleScenario(p)).toBeTruthy();
      for (const party of p.parties) for (const k of [...party.needs, ...party.refuses]) expect(POLICIES.map((x) => x.key)).toContain(k);
    }
  });
  it("explains why a party walks out", () => {
    const r = checkDeal(PUZZLES[0], ["Red", "Blue"], ["bus", "swim", "sport"]);
    expect(r.ok).toBe(false);
    expect(r.reactions.find((x) => x.party === "Blue").why).toMatch(/Cheaper bus fares/);
  });
  it("needs enough seats as well", () => {
    expect(checkDeal(PUZZLES[0], ["Blue", "Green"], ["sport"]).enough).toBe(false);
  });
});

describe("letter to your MP", () => {
  it("has one right person to write to for every issue", () => {
    for (const i of ISSUES) expect(TARGETS.map((t) => t.key)).toContain(i.target);
    expect(ISSUES.filter((i) => i.target === "mp").length).toBeGreaterThan(0);
  });
  it("builds a letter in five parts, and the shuffle is a permutation", () => {
    expect(letterParts(ISSUES[0], TARGETS[0])).toHaveLength(5);
    expect([...LETTER_SHUFFLE].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("bingo", () => {
  it("has plenty of different terms, each with a clue that does not give the term away", () => {
    expect(new Set(TERMS.map((t) => t.term)).size).toBe(TERMS.length);
    expect(TERMS.length).toBeGreaterThanOrEqual(28);
    for (const t of TERMS) expect(t.clue.toLowerCase()).not.toContain(t.term.toLowerCase());
  });
  it("deals sixteen different terms and calls each one once", () => {
    const { card, calls } = bingoCard();
    expect(new Set(card.map((t) => t.term)).size).toBe(16);
    expect(calls.map((t) => t.term).sort()).toEqual(card.map((t) => t.term).sort());
  });
  it("finds a completed row", () => {
    expect(LINES).toHaveLength(10);
    expect(completedLines([4, 5, 6, 7, 0])).toEqual([[4, 5, 6, 7]]);
    expect(completedLines([0, 5, 10])).toEqual([]);
  });
});

describe("jargon matcher", () => {
  it("has three rounds of six pairs, and no meaning beside its own term", () => {
    expect(JARGON_ROUNDS).toHaveLength(3);
    for (const r of JARGON_ROUNDS) {
      expect(r.pairs).toHaveLength(6);
      const m = meaningsOf(r);
      expect(m.map((x) => x.term).sort()).toEqual(r.pairs.map((p) => p[0]).sort());
      m.forEach((x, i) => expect(x.term).not.toBe(r.pairs[i][0]));
    }
  });
});
