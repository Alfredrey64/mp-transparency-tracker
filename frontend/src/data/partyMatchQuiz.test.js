import { describe, it, expect } from "vitest";
import { QUESTIONS, QUIZ_PARTIES, ISSUES, scoreQuiz } from "./partyMatchQuiz";
import { EVIDENCE, MANIFESTO_SOURCES } from "./partyMatchEvidence";
import { PARTY_MANIFESTOS } from "./partyManifestos";

const KEYS = QUIZ_PARTIES.map((p) => p.key);
const nationFor = (key) => (key === "snp" ? "scotland" : key === "plaid-cymru" ? "wales" : "england");
const answersFrom = (fn) => Object.fromEntries(QUESTIONS.map((q) => [q.id, fn(q)]));

describe("the quiz data", () => {
  it("has a score between -2 and 2 for every party on every statement, and nothing extra", () => {
    for (const q of QUESTIONS) {
      expect(Object.keys(q.positions).sort(), q.id).toEqual([...KEYS].sort());
      for (const k of KEYS) expect(Number.isInteger(q.positions[k]) && Math.abs(q.positions[k]) <= 2, `${q.id} ${k}`).toBe(true);
    }
  });

  it("has a note and a page reference for every score", () => {
    for (const q of QUESTIONS) {
      for (const k of KEYS) {
        const note = EVIDENCE[q.id]?.[k];
        expect(note, `${q.id} ${k}`).toBeTruthy();
        const silent = /silent|no position|no stated|says nothing|does not (propose|address)|no overall/i.test(note);
        // Where a manifesto says nothing, the score may only lean (1 at most).
        if (silent) expect(Math.abs(q.positions[k]), `${q.id} ${k} is scored ${q.positions[k]} but its manifesto is silent`).toBeLessThanOrEqual(1);
        // A strong score (2 either way) must point to the page it comes from, except Plaid Cymru whose PDF could not be read.
        if (Math.abs(q.positions[k]) === 2 && k !== "plaid-cymru") expect(note, `${q.id} ${k}`).toMatch(/\(p\. \d+/);
      }
    }
  });

  it("cites a source document for every party", () => {
    for (const k of KEYS) expect(MANIFESTO_SOURCES[k], k).toMatch(/^https:\/\//);
  });

  it("covers every issue the quiz asks people to prioritise, with no issue left over", () => {
    expect(new Set(QUESTIONS.map((q) => q.issue))).toEqual(new Set(ISSUES.map((i) => i.key)));
  });

  it("uses the same party keys as the manifesto summaries", () => {
    for (const k of KEYS) expect(PARTY_MANIFESTOS.some((m) => m.key === k), k).toBe(true);
  });

  it("gives every statement a single claim and a plain explanation", () => {
    for (const q of QUESTIONS) {
      expect(q.statement.endsWith("."), q.id).toBe(true);
      expect(q.explainer.length, q.id).toBeGreaterThan(80);
      expect(q.explainer, q.id).not.toMatch(/\bcurrently around \d/i);
    }
  });
});

describe("matching", () => {
  it("puts a party first, at 100%, for someone who answers exactly as it does", () => {
    for (const k of KEYS) {
      const results = scoreQuiz(answersFrom((q) => q.positions[k]), [], nationFor(k));
      expect(results[0].key, k).toBe(k);
      expect(results[0].pct, k).toBe(100);
      expect(results[0].pct - results[1].pct, `${k} must be clearly ahead of the next party`).toBeGreaterThan(5);
    }
  });

  it("puts a party last, or near it, for someone who answers the opposite way", () => {
    for (const k of KEYS) {
      const results = scoreQuiz(answersFrom((q) => -q.positions[k]), [], nationFor(k));
      const rank = results.findIndex((r) => r.key === k);
      expect(rank, k).toBeGreaterThanOrEqual(results.length - 3);
    }
  });

  it("makes no two parties look the same", () => {
    for (let i = 0; i < KEYS.length; i++) for (let j = i + 1; j < KEYS.length; j++) {
      const apart = QUESTIONS.filter((q) => q.positions[KEYS[i]] !== q.positions[KEYS[j]]).length;
      expect(apart, `${KEYS[i]} and ${KEYS[j]}`).toBeGreaterThanOrEqual(5);
    }
  });

  it("gets nearer to a party as you move towards its view", () => {
    const k = "green";
    const far = scoreQuiz(answersFrom((q) => -q.positions[k]), [], "england").find((r) => r.key === k).pct;
    const middle = scoreQuiz(answersFrom(() => 0), [], "england").find((r) => r.key === k).pct;
    const near = scoreQuiz(answersFrom((q) => q.positions[k]), [], "england").find((r) => r.key === k).pct;
    expect(far).toBeLessThan(middle);
    expect(middle).toBeLessThan(near);
  });

  it("counts the issues you say matter most twice", () => {
    const answers = answersFrom((q) => q.positions.green);
    answers.nhs = -2; // disagree with Green on the NHS only
    const without = scoreQuiz(answers, [], "england").find((r) => r.key === "green").pct;
    const withPriority = scoreQuiz(answers, ["nhs"], "england").find((r) => r.key === "green").pct;
    expect(withPriority).toBeLessThan(without);
  });

  it("skips statements you did not answer, and scores nothing for nobody", () => {
    expect(scoreQuiz({}, [], "england").every((r) => r.pct === 0)).toBe(true);
    const one = scoreQuiz({ europe: 2 }, [], "england");
    expect(one.find((r) => r.key === "labour").pct).toBeLessThan(one.find((r) => r.key === "liberal-democrat").pct);
  });

  it("shows the SNP only in Scotland and Plaid Cymru only in Wales", () => {
    const a = answersFrom(() => 1);
    expect(scoreQuiz(a, [], "england").map((r) => r.key)).not.toContain("snp");
    expect(scoreQuiz(a, [], "england").map((r) => r.key)).not.toContain("plaid-cymru");
    expect(scoreQuiz(a, [], "scotland").map((r) => r.key)).toContain("snp");
    expect(scoreQuiz(a, [], "scotland").map((r) => r.key)).not.toContain("plaid-cymru");
    expect(scoreQuiz(a, [], "wales").map((r) => r.key)).toContain("plaid-cymru");
    expect(scoreQuiz(a, [], null).map((r) => r.key)).toEqual(expect.not.arrayContaining(["snp", "plaid-cymru"]));
  });

  it("matches a few recognisable sets of views to the party you would expect", () => {
    const views = {
      // Wants lower taxes, tighter borders, tougher sentencing, no net zero push, welfare cuts.
      right: { tax: -2, nhs: -1, immigration: 2, climate: -2, housing: 0, europe: -2, sentencing: 2, tuition: -1, welfare: 2, pr: 0, devolution: -1, defence: 2, ownership: -2, aid: -2, workers: -1, asylum: 2 },
      // Wants higher taxes on wealth, a public NHS, faster net zero, public ownership, more aid, a welcoming asylum system.
      green: { tax: 2, nhs: 2, immigration: -2, climate: 2, housing: 1, europe: 2, sentencing: -1, tuition: 2, welfare: -2, pr: 2, devolution: 1, defence: -1, ownership: 2, aid: 2, workers: 2, asylum: -2 },
      // Wants proportional voting, a closer relationship with Europe, more aid and more devolution, but no public-ownership push.
      libdem: { tax: 1, nhs: 0, immigration: -1, climate: 2, housing: 2, europe: 2, sentencing: -1, tuition: 0, welfare: -1, pr: 2, devolution: 2, defence: 1, ownership: 0, aid: 2, workers: 1, asylum: -2 },
    };
    expect(["reform-uk", "conservative"]).toContain(scoreQuiz(views.right, [], "england")[0].key);
    expect(scoreQuiz(views.green, [], "england")[0].key).toBe("green");
    expect(["liberal-democrat", "green"]).toContain(scoreQuiz(views.libdem, [], "england")[0].key);
    // A right-wing set of views must not put Green or the Liberal Democrats in the top two, and the reverse.
    const top2 = (v) => scoreQuiz(v, [], "england").slice(0, 2).map((r) => r.key);
    expect(top2(views.right)).not.toContain("green");
    expect(top2(views.green)).not.toContain("reform-uk");
  });
});
