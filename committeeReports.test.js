import { describe, it, expect } from "vitest";
import { splitTitle, tidyReport, summariseReports, daysBetween } from "./committeeReports.js";

const pub = (over = {}) => ({
  id: 1, type: { id: 1 }, description: "6th Report - The obesity moonshot: making obesity a political priority", publicationStartDate: "2026-10-30T00:01:00",
  committee: { name: "Health and Social Care Committee", house: "Commons", category: { name: "Select" } },
  governmentResponses: { publication: [], responseDeadline: "2026-12-30T00:00:00", responseExcepted: true }, additionalContentUrl: "https://publications.parliament.uk/pa/cm5902/cmselect/cmhealth/676/report.html", ...over,
});

describe("splitTitle", () => {
  it("separates the report number from its title", () => {
    expect(splitTitle("6th Report - The obesity moonshot")).toEqual({ number: "6th Report", title: "The obesity moonshot" });
    expect(splitTitle("Thirteenth Report - No Statutory Instruments Reported")).toEqual({ number: "Thirteenth Report", title: "No Statutory Instruments Reported" });
    expect(splitTitle("A report with no number")).toEqual({ number: "", title: "A report with no number" });
  });
});

describe("tidyReport", () => {
  it("keeps a report with a reply due and its link", () => {
    expect(tidyReport(pub())).toMatchObject({ id: 1, committee: "Health and Social Care Committee", number: "6th Report", date: "2026-10-30", due: "2026-12-30", replies: [] });
  });
  it("drops reports with no deadline, other kinds of publication and scrutiny committees", () => {
    expect(tidyReport(pub({ governmentResponses: { publication: [], responseDeadline: null } }))).toBeNull();
    expect(tidyReport(pub({ type: { id: 2 } }))).toBeNull();
    expect(tidyReport(pub({ committee: { name: "Secondary Legislation Scrutiny Committee", category: { name: "Select" } } }))).toBeNull();
    expect(tidyReport(pub({ committee: { name: "A bill committee", category: { name: "General" } } }))).toBeNull();
  });
  it("lists the replies in date order", () => {
    const r = tidyReport(pub({ governmentResponses: { responseDeadline: "2026-12-30T00:00:00", publication: [{ id: 9, publicationStartDate: "2027-01-10T00:00:00" }, { id: 8, publicationStartDate: "2026-12-01T00:00:00" }] } }));
    expect(r.replies.map((x) => x.id)).toEqual([8, 9]);
  });
  it("falls back to the committees site when there is no report link", () => {
    expect(tidyReport(pub({ additionalContentUrl: null })).url).toBe("https://committees.parliament.uk/publications/1/");
  });
});

describe("summariseReports", () => {
  it("drops repeats and reports before the start date, newest first", () => {
    const out = summariseReports([pub({ id: 1 }), pub({ id: 1 }), pub({ id: 2, publicationStartDate: "2026-11-01T00:00:00" }), pub({ id: 3, publicationStartDate: "2025-01-01T00:00:00" })], { from: "2025-11-02", generated: "2026-11-02" });
    expect(out.reports.map((r) => r.id)).toEqual([2, 1]);
  });
  it("keeps the parent committee's copy of a sub-committee's report", () => {
    const sub = pub({ id: 5, committee: { name: "Health Sub-Committee", house: "Commons", category: { name: "Select" } } });
    const out = summariseReports([sub, pub({ id: 6 })], { from: "2025-11-02", generated: "2026-11-02" });
    expect(out.reports.map((r) => r.id)).toEqual([6]);
  });
  it("leaves out standards and conduct committees", () => {
    expect(tidyReport(pub({ committee: { name: "Committee on Standards", category: { name: "Select" } } }))).toBeNull();
  });
  it("counts days between dates", () => { expect(daysBetween("2026-10-30", "2026-12-30")).toBe(61); });
});
