import { describe, expect, it } from "vitest";
import { kindOf, stepLabel, tidyTreaty, wanted, summariseTreaties, yearBefore } from "./treaties.js";

const item = (over = {}) => ({ value: { id: "AbC12345", name: "Agreement, done at Paris on 13 November 2025, between the UK and France", commandPaperPrefix: "CP", commandPaperNumber: 1705, commonsLayingDate: "2026-10-19T00:00:00", lordsLayingDate: "2026-10-19T00:00:00", webLink: "https://www.gov.uk/government/publications/x", treatySeriesMembership: { citation: "Miscellaneous No. 11 (2026)" }, leadDepartment: { name: "Ministry of Defence" }, parliamentaryConclusion: "NotConcluded", debateScheduled: "DebateNotScheduled", signedDate: "2025-11-13T00:00:00", ...over } });
const steps = [
  { value: { itemDate: "2026-11-26T00:00:00", steps: ["Objection period A ends"], link: null } },
  { value: { itemDate: "2026-10-19T00:00:00", steps: ["Laid before the House of Commons"], link: "https://commonsbusiness.parliament.uk/Document/1/Html" } },
  { value: { itemDate: "2025-11-13T00:00:00", steps: ["Treaty signed"], link: "https://example.com/not-parliament" } },
];

describe("kindOf", () => {
  it("takes the first words of the title", () => {
    expect(kindOf("Agreement, done at Paris on 13 November 2025, between")).toBe("Agreement");
    expect(kindOf("Exchange of Letters, done at London and Ankara")).toBe("Exchange of Letters");
    expect(kindOf("")).toBe("Treaty");
  });
});

describe("stepLabel", () => {
  it("puts Parliament's step names in plain English and leaves unknown ones alone", () => {
    expect(stepLabel("Laid before the House of Lords")).toBe("Laid before the Lords");
    expect(stepLabel("Objection period A ends")).toBe("Objection period ends");
    expect(stepLabel("Something new")).toBe("Something new");
  });
});

describe("tidyTreaty", () => {
  it("shapes a treaty and reads the end of the objection period from the steps", () => {
    const t = tidyTreaty(item(), steps);
    expect(t).toMatchObject({ id: "AbC12345", kind: "Agreement", paper: "CP 1705", series: "Miscellaneous No. 11 (2026)", department: "Ministry of Defence", laid: "2026-10-19", status: "open", objectionEnds: "2026-11-26", debate: null });
    expect(t.steps.map((s) => s.label)).toEqual(["Signed", "Laid before the Commons", "Objection period ends"]);
  });
  it("uses the later end date when the objection period was extended", () => {
    const ext = [...steps, { value: { itemDate: "2026-12-10T00:00:00", steps: ["Extended objection period A ends"], link: null } }];
    expect(tidyTreaty(item(), ext).objectionEnds).toBe("2026-12-10");
  });
  it("keeps only links on Parliament's own sites", () => {
    const t = tidyTreaty(item(), steps);
    expect(t.steps.find((s) => s.label === "Signed").link).toBeUndefined();
    expect(t.steps.find((s) => s.label === "Laid before the Commons").link).toContain("commonsbusiness.parliament.uk");
  });
  it("calls a CantRatify treaty withdrawn and ignores a gov.uk-lookalike link", () => {
    expect(tidyTreaty(item({ parliamentaryConclusion: "CantRatify", webLink: "https://gov.uk.evil.example/x" })).status).toBe("withdrawn");
    expect(tidyTreaty(item({ webLink: "https://gov.uk.evil.example/x" })).url).toBeNull();
  });
  it("does not call a treaty that was never laid open", () => {
    expect(tidyTreaty(item({ commonsLayingDate: null, lordsLayingDate: null })).status).toBe("unlaid");
    expect(wanted(item({ commonsLayingDate: null, lordsLayingDate: null }), "2026-11-25")).toBe(false);
  });
  it("drops a row with no id or title, and falls back to the Lords laying date", () => {
    expect(tidyTreaty({ value: { name: "x" } })).toBeNull();
    expect(tidyTreaty(item({ commonsLayingDate: null })).laid).toBe("2026-10-19");
  });
});

describe("wanted", () => {
  it("wants treaties laid in the last year or still open", () => {
    expect(wanted(item({ commonsLayingDate: "2026-01-01T00:00:00" }), "2026-11-25")).toBe(true);
    expect(wanted(item({ commonsLayingDate: "2024-01-01T00:00:00", parliamentaryConclusion: "CanRatify" }), "2026-11-25")).toBe(false);
    expect(wanted(item({ commonsLayingDate: "2024-01-01T00:00:00", parliamentaryConclusion: "NotConcluded" }), "2026-11-25")).toBe(true);
  });
});

describe("summariseTreaties", () => {
  it("counts per year and per department over the last year, newest first", () => {
    const all = [item(), item({ id: "B", commonsLayingDate: "2024-03-01T00:00:00", parliamentaryConclusion: "CanRatify" })];
    const kept = [tidyTreaty(item(), steps), tidyTreaty(item({ id: "C", commonsLayingDate: "2026-02-01T00:00:00", parliamentaryConclusion: "CanRatify" }))];
    const out = summariseTreaties(all, kept, { generated: "2026-11-25" });
    expect(out.total).toBe(2);
    expect(out.perYear).toEqual([{ year: 2024, count: 1 }, { year: 2026, count: 1 }]);
    expect(out.treaties.map((t) => t.id)).toEqual(["AbC12345", "C"]);
    expect(out.byDepartment).toEqual([{ name: "Ministry of Defence", count: 2 }]);
    expect(out.lastYear).toEqual({ count: 2, withdrawn: 0 });
  });
  it("yearBefore", () => expect(yearBefore("2026-11-25")).toBe("2025-11-25"));
});
