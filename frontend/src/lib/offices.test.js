import { describe, it, expect } from "vitest";
import { buildOffices, searchOffices } from "./offices";

const people = { 1: { name: "Ann", party: "Labour", house: "commons", profileId: 11 }, 2: { name: "Bob", party: "Conservative", house: "lords", profileId: 2 }, 3: { name: "Cy", party: "Labour", house: "commons", profileId: 13 } };
const careers = {
  1: { g: [["Secretary of State for Health", "Department of Health", "2020-01-01", "2022-01-01"]], o: [["Shadow Home Secretary", "Home Office", "2016-10-01", "2020-04-01"]] },
  2: { g: [["Secretary of State for Health", "Department of Health", "2010-05-01", null], ["Minister of State", "Home Office", "2012-01-01", "2013-01-01"]], o: [] },
  3: { g: [["Minister of State", "Home Office", "2024-07-01", null]], o: [] },
  99: { g: [["Ignored", "X", "2000-01-01", null]], o: [] },
};

describe("buildOffices", () => {
  const offices = buildOffices(careers, people);
  it("groups holders by post, most recent first, and skips people we have no name for", () => {
    const health = offices.find((o) => o.post === "Secretary of State for Health");
    expect(health.holders.map((h) => h.name)).toEqual(["Ann", "Bob"]);
    expect(health.current).toBe(1);
    expect(health.departments).toEqual(["Department of Health"]);
    expect(offices.some((o) => o.post === "Ignored")).toBe(false);
  });
  it("tells government posts from shadow posts and orders by how often they were held", () => {
    expect(offices.find((o) => o.post === "Shadow Home Secretary").kind).toBe("opp");
    expect(offices[0].holders.length).toBeGreaterThanOrEqual(offices[1].holders.length);
  });
});

describe("searchOffices", () => {
  const offices = buildOffices(careers, people);
  it("matches every word against the post and its department", () => {
    expect(searchOffices(offices, "home secretary").map((o) => o.post)).toEqual(["Shadow Home Secretary"]);
    expect(searchOffices(offices, "minister home office").map((o) => o.post)).toEqual(["Minister of State"]);
    expect(searchOffices(offices, "zzz")).toEqual([]);
  });
  it("lists the most-held offices when nothing is typed", () => {
    expect(searchOffices(offices, "", 2)).toHaveLength(2);
  });
});
