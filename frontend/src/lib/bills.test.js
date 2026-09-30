import { describe, it, expect } from "vitest";
import { categoriseBill, matchBillForVote, BILL_CATEGORIES } from "./bills.js";

describe("categoriseBill", () => {
  it("maps a known sponsoring department to its category", () => {
    expect(categoriseBill({ sponsoring_department: "Department of Health and Social Care" }).label).toBe("Health");
    expect(categoriseBill({ sponsoring_department: "HM Treasury" }).label).toBe("Economy & Finance");
  });

  it("matches case-insensitively", () => {
    expect(categoriseBill({ sponsoring_department: "department of health and social care" }).label).toBe("Health");
  });

  it("falls back to General for an unmapped or missing department", () => {
    expect(categoriseBill({ sponsoring_department: "Some Unrecognised Department" }).label).toBe("General");
    expect(categoriseBill({}).label).toBe("General");
  });

  it("every declared category has a distinct label and color", () => {
    const labels = BILL_CATEGORIES.map((c) => c.label);
    const colors = BILL_CATEGORIES.map((c) => c.color);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe("matchBillForVote", () => {
  const bills = [
    { id: 1, short_title: "Finance Bill" },
    { id: 2, short_title: "Health Bill" },
  ];

  it("matches a division title that starts with the bill's short title", () => {
    expect(matchBillForVote("Finance Bill: Third Reading", bills)?.id).toBe(1);
  });

  it("does not match a title that merely contains the short title elsewhere", () => {
    expect(matchBillForVote("New Finance Bill: Third Reading", bills)).toBeNull();
  });

  it("returns null when no bill's short title prefixes the vote title", () => {
    expect(matchBillForVote("Unrelated Motion", bills)).toBeNull();
  });
});
