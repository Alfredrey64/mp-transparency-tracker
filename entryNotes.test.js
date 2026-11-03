import { describe, it, expect } from "vitest";
import { keyOf, searchQueries, closeEnough, bestEarlier, hansardUrl, askedIn, purposeOf } from "./entryNotes.js";

describe("entryNotes", () => {
  it("matches a debate title to an earlier one on the same subject, not to a loosely similar one", () => {
    expect(closeEnough("Findings of the Milburn Review into Young people and work: interim report", "Milburn Review: Interim Report")).toBe(true);
    expect(closeEnough("Impact of extreme weather on train services", "Train services: Delays")).toBe(false);
    expect(closeEnough("Housing Bill", "Social Housing Bill")).toBe(false);
    const old = [{ Title: "Post Office: Opinion of the Attorney General", SittingDate: "1881-05-26T00:00:00", House: "Commons", DebateSectionExtId: "O" }];
    expect(bestEarlier("Attorney General's Office", old, "2026-11-03")).toBeNull();
  });

  it("picks the closest earlier debate and ignores later ones", () => {
    const r = [
      { Title: "Milburn Review: Interim Report", SittingDate: "2026-06-02T00:00:00", House: "Commons", DebateSectionExtId: "A" },
      { Title: "Milburn Review: Interim Report", SittingDate: "2026-12-02T00:00:00", House: "Commons", DebateSectionExtId: "B" },
    ];
    expect(bestEarlier("Milburn Review interim report", r, "2026-11-03").DebateSectionExtId).toBe("A");
    expect(bestEarlier("Something else entirely here", r, "2026-11-03")).toBeNull();
    expect(bestEarlier("Milburn Review interim report", r, "2030-01-01")).toBeNull();
  });

  it("searches Hansard for pairs of distinctive words", () => {
    expect(searchQueries("Findings of the Milburn Review into Young people and work: interim report")).toEqual(["milburn interim", "people report", "young work"]);
  });

  it("builds the Hansard address and pulls out the question put", () => {
    expect(hansardUrl({ Title: "Milburn Review: Interim Report", SittingDate: "2026-06-02T00:00:00", House: "Commons", DebateSectionExtId: "X" })).toBe("https://hansard.parliament.uk/Commons/2026-06-02/debates/X/milburn-review-interim-report");
    expect(askedIn([{ Value: "<p>12:36</p>" }, { Value: "(Urgent Question): To ask the Secretary of State for Work and Pensions to make a statement on the report." }])).toBe("To ask the Secretary of State for Work and Pensions to make a statement on the report.");
    expect(askedIn([{ Value: "Last week, a report came out." }])).toBe("");
  });

  it("keeps two sentences of a committee's purpose and drops its social links", () => {
    expect(purposeOf("<p>The Home Affairs Committee scrutinises the Home Office. It examines policy and spending. A third.</p><p>Follow us on <a>X</a></p>")).toBe("The Home Affairs Committee scrutinises the Home Office. It examines policy and spending.");
    expect(keyOf("Hello, World & Co")).toBe("hello world co");
  });
});
