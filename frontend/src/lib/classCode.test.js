import { describe, it, expect } from "vitest";
import { pickQuestions } from "./teacherGames";
import { bingoCard } from "./teacherGamesMore";
import { SETUP, defaultsFor, settingsFor, encode, decode, gamePath, gameLink } from "./classCode";

const KEYS = ["decide", "law", "bingo", "quiz", "election"];

describe("what a code can set", () => {
  it("has a default for every setting, inside its own limits", () => {
    for (const [key, specs] of Object.entries(SETUP)) {
      for (const s of specs) {
        if (s.allowed) expect(s.allowed, `${key}.${s.name}`).toContain(s.def);
        else { expect(s.def).toBeGreaterThanOrEqual(s.min); expect(s.def).toBeLessThanOrEqual(s.max); }
      }
    }
    expect(defaultsFor("quiz")).toEqual({ teams: 3, rounds: 10, seed: 11 });
    expect(defaultsFor("law")).toEqual({});
  });
  it("keeps every setting inside its limits", () => {
    expect(settingsFor("quiz", { teams: 9, rounds: 7, seed: 0 })).toEqual({ teams: 3, rounds: 10, seed: 11 });
    expect(settingsFor("quiz", { teams: 4, rounds: 5, seed: 999 })).toEqual({ teams: 4, rounds: 5, seed: 999 });
    expect(settingsFor("bingo", { seed: "12" })).toEqual({ seed: 12 });
    expect(settingsFor("bingo", { seed: 1.5 })).toEqual({ seed: 3 });
    expect(settingsFor("law", { anything: 1 })).toEqual({});
    expect(settingsFor("quiz", null)).toEqual({ teams: 3, rounds: 10, seed: 11 });
  });
});

describe("writing a code", () => {
  it("is just the game's name when nothing is changed", () => {
    expect(encode("law")).toBe("LAW");
    expect(encode("quiz", { teams: 3, rounds: 10, seed: 11 })).toBe("QUIZ");
    expect(encode("bingo", {})).toBe("BINGO");
  });
  it("lists every setting once any is changed", () => {
    expect(encode("quiz", { teams: 4 })).toBe("QUIZ-4-10-11");
    expect(encode("bingo", { seed: 12 })).toBe("BINGO-12");
    expect(encode("quiz", { teams: 2, rounds: 5, seed: 99 })).toBe("QUIZ-2-5-99");
  });
});

describe("reading a code", () => {
  it("finds the game and its setup", () => {
    expect(decode("QUIZ-4-5-99", KEYS)).toEqual({ key: "quiz", settings: { teams: 4, rounds: 5, seed: 99 }, code: "QUIZ-4-5-99" });
    expect(decode("bingo-12", KEYS)).toMatchObject({ key: "bingo", settings: { seed: 12 }, code: "BINGO-12" });
    expect(decode("LAW", KEYS)).toEqual({ key: "law", settings: {}, code: "LAW" });
  });
  it("does not mind case, spaces or the separator", () => {
    for (const t of ["  quiz 4 5 99 ", "Quiz_4_5_99", "QUIZ.4.5.99", "quiz,4,5,99", "QUIZ-4-5-99"]) expect(decode(t, KEYS).code, t).toBe("QUIZ-4-5-99");
  });
  it("falls back to the default for a setting that is missing or wrong, and ignores extras", () => {
    expect(decode("QUIZ-4", KEYS).settings).toEqual({ teams: 4, rounds: 10, seed: 11 });
    expect(decode("QUIZ-9-x-0", KEYS).code).toBe("QUIZ");
    expect(decode("LAW-1-2-3", KEYS).code).toBe("LAW");
  });
  it("gives nothing for a game that does not exist or no code at all", () => {
    for (const t of ["", "  ", null, undefined, "NOPE", "NOPE-1", "-", "<script>"]) expect(decode(t, KEYS), String(t)).toBeNull();
  });
  it("round trips every code it writes", () => {
    for (const [teams, rounds, seed] of [[2, 5, 1], [3, 10, 11], [4, 15, 999], [4, 10, 11]]) {
      const code = encode("quiz", { teams, rounds, seed });
      expect(decode(code, KEYS).settings).toEqual({ teams, rounds, seed });
    }
  });
});

describe("addresses", () => {
  it("builds a path and a full link", () => {
    expect(gamePath("QUIZ-4-5-99")).toBe("#/teacher/activities/QUIZ-4-5-99");
    expect(gameLink("https://example.org/", "BINGO-12")).toBe("https://example.org/teacher/activities/BINGO-12");
  });
});

describe("the seeds a code can carry", () => {
  const seeds = Array.from({ length: SETUP.bingo[0].max }, (_, i) => i + 1);
  it("give the same game every time, and a different one for most seeds", () => {
    expect(bingoCard(12)).toEqual(bingoCard(12));
    expect(pickQuestions(10, 99)).toEqual(pickQuestions(10, 99));
    const cards = new Set(seeds.map((s) => bingoCard(s).card.map((c) => c.term).join()));
    const quizzes = new Set(seeds.map((s) => pickQuestions(10, s).map((q) => q.id).join()));
    expect(cards.size).toBeGreaterThan(900);
    expect(quizzes.size).toBeGreaterThan(900);
  });
  it("always give a full card and a full set of questions", () => {
    for (const s of [1, 2, 500, 999]) {
      expect(bingoCard(s).card).toHaveLength(16);
      expect(new Set(bingoCard(s).card.map((c) => c.term)).size).toBe(16);
      expect(pickQuestions(15, s)).toHaveLength(15);
    }
  });
});
