import { describe, it, expect } from "vitest";
import { TEACHER_NOTES, GO_FURTHER, ENGLAND, OTHER_NATIONS, ROLE_CARDS, PETITION_STEPS } from "./teacherExtras";
import { CHAPTERS, BILL_STEPS } from "./teacherMode";
import { buildSlides } from "../components/teacher/slides";

describe("teacher extras", () => {
  it("has notes for every chapter, each with questions, answers and pause points", () => {
    for (const c of CHAPTERS) {
      const n = TEACHER_NOTES[c.key];
      expect(n, c.key).toBeTruthy();
      expect(n.pause.length).toBeGreaterThanOrEqual(2);
      expect(n.qa.length).toBeGreaterThanOrEqual(3);
      for (const x of n.qa) { expect(x.q.endsWith("?")).toBe(true); expect(x.a.length).toBeGreaterThan(40); }
    }
  });
  it("only links to https addresses or pages on this site", () => {
    const links = Object.values(TEACHER_NOTES).flatMap((n) => n.qa.flatMap((x) => [x.link?.href, x.page?.href].filter(Boolean)));
    for (const h of links) expect(h.startsWith("https://") || h.startsWith("#/")).toBe(true);
    for (const n of OTHER_NATIONS) expect(n.href.startsWith("https://")).toBe(true);
    expect(ENGLAND.source.href.startsWith("https://www.gov.uk/")).toBe(true);
  });
  it("offers a line to go further for every kind of slide the lesson uses", () => {
    for (const kind of new Set(buildSlides().map((s) => s.kind))) {
      if (kind === "quiz" || kind === "vote") continue;
      expect(GO_FURTHER[kind], kind).toBeTruthy();
    }
  });
  it("maps each curriculum row to a real chapter or the classroom", () => {
    for (const r of ENGLAND.rows) expect(r.chapter === "classroom" || CHAPTERS.some((c) => c.key === r.chapter), r.chapter).toBe(true);
    expect(new Set(ENGLAND.rows.map((r) => r.chapter)).size).toBeGreaterThanOrEqual(5);
  });
  it("gives the law role-play a part in every one of the eight steps", () => {
    expect(BILL_STEPS).toHaveLength(8);
    for (let step = 1; step <= 8; step++) {
      expect(ROLE_CARDS.some((r) => r.steps === "all" || r.steps.split(",").map((x) => Number(x.trim())).includes(step)), `step ${step}`).toBe(true);
    }
  });
  it("lists the petition milestones in order", () => {
    expect(PETITION_STEPS.map((p) => p.at)).toEqual([5, 10000, 100000]);
  });
});
