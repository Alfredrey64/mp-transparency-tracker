import { describe, it, expect } from "vitest";
import { splitTitle, tidyReport, summariseReports, daysBetween, plainScope, plainRole, inPast } from "./committeeReports.js";

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
  it("names the subject of the inquiry when it differs from the title", () => {
    expect(tidyReport(pub({ businesses: [{ title: "Pet Parasite Medication" }] })).inquiry).toBe("Pet Parasite Medication");
    expect(tidyReport(pub({ businesses: [{ title: "The obesity moonshot: making obesity a political priority" }], description: "6th Report - The obesity moonshot: making obesity a political priority" })).inquiry).toBe("");
    expect(tidyReport(pub()).inquiry).toBe("");
  });
  it("lists the replies in date order", () => {
    const r = tidyReport(pub({ governmentResponses: { responseDeadline: "2026-12-30T00:00:00", publication: [{ id: 9, publicationStartDate: "2027-01-10T00:00:00" }, { id: 8, publicationStartDate: "2026-12-01T00:00:00" }] } }));
    expect(r.replies.map((x) => x.id)).toEqual([8, 9]);
    expect(r.replies[0].url).toBe("https://committees.parliament.uk/publications/8/");
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

describe("plainScope", () => {
  it("turns an inquiry's description into plain text in the past tense", () => {
    expect(plainScope("<p>The Transport Committee has launched an inquiry into rail investment.&nbsp;The inquiry will look at funding.</p>")).toEqual(["The committee looked into rail investment. The inquiry looked at funding."]);
  });
  it("leaves out requests for evidence and web addresses", () => {
    expect(plainScope("<p>The committee invites written submissions by 5 January 2026.</p><p>Send us your views at www.parliament.uk/inquiry.</p>")).toEqual([]);
    expect(plainScope("<p>Pets are a part of many homes across the country.</p><p>Please submit your evidence below by the deadline.</p>")).toEqual(["Pets are a part of many homes across the country."]);
  });
  it("keeps at most two sentences and shortens a very long one", () => {
    const three = "<p>The first sentence is about water and the rivers. The second sentence is about sewage and the sea. The third sentence is about bills and costs.</p>";
    expect(plainScope(three)[0]).toBe("The first sentence is about water and the rivers. The second sentence is about sewage and the sea.");
    expect(plainScope(`<p>${"word ".repeat(200)}.</p>`)[0].endsWith("...")).toBe(true);
  });
  it("returns nothing for no text", () => {
    expect(plainScope(null)).toEqual([]);
    expect(plainScope("")).toEqual([]);
  });
});

describe("inPast", () => {
  it("rewrites the common ways an inquiry is announced", () => {
    expect(inPast("The Justice Committee has launched its inquiry into prison reform.")).toBe("The committee looked into prison reform.");
    expect(inPast("This inquiry will examine the state of the courts.")).toBe("This inquiry examined the state of the courts.");
    expect(inPast("Water is vital to health.")).toBe("Water is vital to health.");
  });
});

describe("plainRole", () => {
  it("keeps the first sentence of a committee's purpose and drops the social media line", () => {
    expect(plainRole("<p>The Education Committee scrutinises the work of the Department for Education, covering schools. It also holds hearings.</p><p>Follow us on social media: <a href='x'>Bluesky</a></p>")).toBe("The Education Committee scrutinises the work of the Department for Education, covering schools.");
    expect(plainRole(null)).toBe("");
  });
});

describe("tidyReport with descriptions", () => {
  it("adds what the inquiry was about and who the committee is", () => {
    const r = tidyReport(pub({ businesses: [{ id: 7, title: "Pet Parasite Medication" }], committee: { id: 3, name: "Health and Social Care Committee", house: "Commons", category: { name: "Select" } } }), { scopes: { 7: "<p>Pets get parasites that affect their health and wellbeing.</p>" }, roles: { 3: "<p>The Health Committee scrutinises the Department of Health and Social Care.</p>" } });
    expect(r.about).toEqual(["Pets get parasites that affect their health and wellbeing."]);
    expect(r.role).toBe("The Health Committee scrutinises the Department of Health and Social Care.");
  });
  it("gives empty descriptions when none were found", () => {
    expect(tidyReport(pub())).toMatchObject({ about: [], role: "" });
  });
});
