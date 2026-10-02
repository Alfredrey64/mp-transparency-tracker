import { describe, it, expect } from "vitest";
import { sanitiseTopicQuery, summariseQuestions, questionsBy, askerKey } from "./topicSearch";

describe("sanitiseTopicQuery", () => {
  it("strips characters that mean something in a filter string", () => {
    expect(sanitiseTopicQuery("nhs,question_text.eq.x)")).toBe("nhs question text eq x");
    expect(sanitiseTopicQuery("100% (sure) *wild*")).toBe("100 sure wild");
    expect(sanitiseTopicQuery("  energy    bills ")).toBe("energy bills");
  });
  it("keeps hyphens and apostrophes, folds accents, and caps the length", () => {
    expect(sanitiseTopicQuery("children's care-homes")).toBe("children's care-homes");
    expect(sanitiseTopicQuery("Sinn Féin")).toBe("Sinn Fein");
    expect(sanitiseTopicQuery("x".repeat(200))).toHaveLength(60);
    expect(sanitiseTopicQuery(null)).toBe("");
  });
});

const q = (over) => ({ asking_member_id: 1, asking_member_name: "A", asking_member_party: "Labour", asking_member_party_colour: "d50000", answering_body_name: "Home Office", date_tabled: "2026-09-01", date_answered: null, question_text: "<p>Q</p>", ...over });

describe("summariseQuestions", () => {
  const rows = [
    q({}), q({ date_tabled: "2026-09-05" }), q({ asking_member_id: 2, asking_member_name: "B", asking_member_party: "Conservative", answering_body_name: "Treasury", date_answered: "2026-09-09" }),
    q({ asking_member_id: null, asking_member_name: null, asking_member_party: null, answering_body_name: " Home Office " }),
  ];
  const s = summariseQuestions(rows);

  it("counts questions, answered questions and distinct askers", () => {
    expect(s.total).toBe(4);
    expect(s.answered).toBe(1);
    expect(s.askers).toBe(2);
  });
  it("ranks people, parties and departments by number of questions", () => {
    expect(s.people.map((p) => [p.name, p.count])).toEqual([["A", 2], ["B", 1]]);
    expect(s.parties.map((p) => [p.party, p.count])).toEqual([["Labour", 2], ["Conservative", 1]]);
    expect(s.departments.map((d) => [d.name, d.count])).toEqual([["Home Office", 3], ["Treasury", 1]]);
  });
  it("lists the most recent first, with markup stripped", () => {
    expect(s.recent[0].date_tabled).toBe("2026-09-05");
    expect(s.recent[0].question_text).toBe("Q");
  });
  it("copes with nothing", () => {
    expect(summariseQuestions([])).toMatchObject({ total: 0, askers: 0, people: [], parties: [] });
  });
});

describe("questionsBy", () => {
  const rows = [
    q({ id: 1, date_tabled: "2026-09-01" }), q({ id: 2, date_tabled: "2026-09-09" }),
    q({ id: 3, asking_member_id: 2, asking_member_name: "B" }), q({ id: 4, asking_member_id: null, asking_member_name: null }),
  ];
  it("returns one asker's questions, newest first", () => {
    expect(questionsBy(rows, 1).map((r) => r.id)).toEqual([2, 1]);
    expect(questionsBy(rows, 2).map((r) => r.id)).toEqual([3]);
  });
  it("falls back to the name when there is no member id, and ignores anonymous questions", () => {
    expect(askerKey({ asking_member_id: null, asking_member_name: "Lord X" })).toBe("Lord X");
    expect(questionsBy(rows, undefined)).toEqual([]);
  });
  it("gives each person in the summary a key and a thumbnail", () => {
    const s = summariseQuestions([q({ asking_member_thumbnail_url: "http://img" })]);
    expect(s.people[0]).toMatchObject({ key: 1, thumbnail: "http://img" });
  });
});
