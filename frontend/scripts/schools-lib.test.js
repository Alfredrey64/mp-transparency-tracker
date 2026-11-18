import { describe, expect, it } from "vitest";
import { schoolRecord, isoDate, tileOf } from "./schools-lib.mjs";

const row = (over = {}) => ({ URN: "133312", "School name": "Abacus Primary School", "Ofsted phase": "Primary", "Total number of pupils": "413", Postcode: "SS12 9GJ", "Latest OEIF overall effectiveness": "NULL", "Ungraded inspection overall outcome": "School remains Good - S5 Next", "Date of latest ungraded inspection": "09/03/2023", "Category of concern": "NULL", "Most recent category of concern": "NULL", ...over });

describe("isoDate", () => {
  it("turns a day-month-year date into an ISO one", () => { expect(isoDate("14/04/2026")).toBe("2026-04-14"); expect(isoDate("NULL")).toBe(""); });
});

describe("schoolRecord", () => {
  it("keeps the short inspection outcome and drops the Ofsted jargon after it", () => {
    expect(schoolRecord(row(), { lat: 51.6, lon: 0.5 })).toMatchObject({ u: 133312, p: "P", k: 413, o: "School remains Good", od: "2023-03" });
  });
  it("reads an old overall grade", () => {
    expect(schoolRecord(row({ "Latest OEIF overall effectiveness": "2", "Inspection start date of latest OEIF graded inspection": "02/11/2022" }), { lat: 51, lon: 0 })).toMatchObject({ g: 2, gd: "2022-11" });
  });
  it("reads a report card as six letters", () => {
    const card = { "Safeguarding standards": "Met", Inclusion: "Strong standard", "Curriculum and teaching": "Expected standard", Achievement: "Expected standard", "Attendance and behaviour": "Needs attention", "Personal development and wellbeing": "Exceptional", "Leadership and governance": "Expected standard", "Inspection start date": "14/04/2026" };
    expect(schoolRecord(row(card), { lat: 51, lon: 0 })).toMatchObject({ c: "SXXNEX", cs: 1, cd: "2026-04" });
  });
  it("has no record for a school with no position or an unknown phase", () => {
    expect(schoolRecord(row(), null)).toBeNull();
    expect(schoolRecord(row({ "Ofsted phase": "Other" }), { lat: 1, lon: 1 })).toBeNull();
  });
});

describe("tileOf", () => {
  it("names the tenth-of-a-degree tile a point is in, including west of Greenwich", () => {
    expect(tileOf(51.5, -0.14)).toBe("257_-1");
    expect(tileOf(52.04, 1.26)).toBe("260_6");
  });
});
