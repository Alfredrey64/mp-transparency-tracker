import { describe, it, expect } from "vitest";
import { monthLabel, dayParts, shortDepartment, splitAttendees, tally } from "./meetingsView";

describe("meetingsView", () => {
  it("formats months and days from an ISO date", () => {
    expect(monthLabel("2026-01-08")).toBe("January 2026");
    expect(dayParts("2026-01-08")).toEqual({ day: "8", weekday: "Thu" });
  });

  it("shortens department names", () => {
    expect(shortDepartment("Department for Work and Pensions")).toBe("Work and Pensions");
    expect(shortDepartment("Department for Business and Trade")).toBe("Business and Trade");
    expect(shortDepartment("Ministry of Justice")).toBe("Justice");
    expect(shortDepartment("HM Treasury")).toBe("HM Treasury");
  });

  it("keeps a short attendee list whole and folds a long one", () => {
    expect(splitAttendees("Tony Blair")).toEqual({ shown: ["Tony Blair"], rest: [], total: 1 });
    expect(splitAttendees("A, B, C, D").rest).toEqual([]);
    const long = splitAttendees("A, B, C, D, E, F");
    expect(long.shown).toEqual(["A", "B", "C"]);
    expect(long.rest).toEqual(["D", "E", "F"]);
    expect(long.total).toBe(6);
  });

  it("tallies most first", () => {
    expect(tally([{ m: "x" }, { m: "y" }, { m: "y" }], (i) => i.m)).toEqual([["y", 2], ["x", 1]]);
  });
});
