import { describe, it, expect } from "vitest";
import { addFact, dateSpan, typeSummary, ecRecordUrl, companiesHouseUrl } from "./donorFacts";

const rows = [
  { value: 1000, ec_ref: "C1", accepted_date: "2025-10-03", donation_type: "Cash" },
  { value: 4000, ec_ref: "C2", accepted_date: "2026-02-11", donation_type: "Cash" },
  { value: 250, ec_ref: "C3", accepted_date: "2026-01-02", donation_type: "Non Cash", company_registration_number: "258706" },
];
const f = rows.reduce(addFact, undefined);

describe("addFact", () => {
  it("counts the gifts and keeps the dates, the largest and its record", () => {
    expect(f.count).toBe(3);
    expect(f.first).toBe("2025-10-03");
    expect(f.last).toBe("2026-02-11");
    expect(f.biggest).toBe(4000);
    expect(f.ref).toBe("C2");
    expect(f.company).toBe("258706");
    expect(f.types).toEqual({ Cash: 2, "Non Cash": 1 });
  });
  it("keeps a record reference even for a first gift of nothing", () => {
    expect(addFact(undefined, { value: 0, ec_ref: "C9", accepted_date: null, donation_type: "Cash" }).ref).toBe("C9");
  });
});

describe("wording helpers", () => {
  it("writes the date span and the gift types", () => {
    expect(dateSpan(f)).toBe("Oct 2025 to Feb 2026");
    expect(dateSpan({ first: "2026-06-29", last: "2026-06-29" })).toBe("Jun 2026");
    expect(typeSummary({ Cash: 1 })).toBe("cash");
    expect(typeSummary(f.types)).toBe("cash (2), non-cash (goods or services) (1)");
  });
  it("builds record links", () => {
    expect(ecRecordUrl("C0840368")).toBe("https://search.electoralcommission.org.uk/English/Donations/C0840368");
    expect(ecRecordUrl(null)).toBeNull();
    expect(companiesHouseUrl("258706")).toBe("https://find-and-update.company-information.service.gov.uk/company/00258706");
    expect(companiesHouseUrl("sc123456")).toBe("https://find-and-update.company-information.service.gov.uk/company/SC123456");
    expect(companiesHouseUrl("not a number!")).toBeNull();
  });
});
