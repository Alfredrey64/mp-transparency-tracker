import { describe, expect, it } from "vitest";
import { normalise, columns, matchCharities } from "./charityRegister.js";

const header = ["date_of_extract", "organisation_number", "registered_charity_number", "linked_charity_number", "charity_name", "charity_type", "charity_registration_status", "date_of_registration", "latest_acc_fin_period_end_date", "latest_income", "latest_expenditure"].join("\t");
const row = (o) => ["2026-11-25", "1", o.num, o.linked ?? "0", o.name, "Charity", o.status ?? "Registered", o.reg ?? "1957-03-01 00:00:00", o.end ?? "2025-12-31 00:00:00", o.inc ?? "", o.exp ?? ""].join("\t");

describe("normalise", () => {
  it("ignores case, punctuation, '&' and a leading 'The'", () => {
    expect(normalise("The Institute of Economic Affairs")).toBe("INSTITUTE OF ECONOMIC AFFAIRS");
    expect(normalise("Smith & Co.")).toBe("SMITH AND CO");
  });
});

describe("columns", () => {
  it("finds a column however its name is spelled", () => {
    const get = columns("Charity_Name\tRegistered Charity Number");
    expect(get(["A", "12"], "charity_name")).toBe("A");
    expect(get(["A", "12"], "registered_charity_number")).toBe("12");
    expect(get(["A", "12"], "missing")).toBeUndefined();
  });
});

describe("matchCharities", () => {
  const wanted = [{ key: "iea", name: "Institute of Economic Affairs" }, { key: "rf", name: "Resolution Foundation" }, { key: "asi", name: "Adam Smith Institute" }, { key: "dup", name: "Twin Trust" }];
  const lines = [
    header,
    row({ num: "235351", name: "INSTITUTE OF ECONOMIC AFFAIRS", inc: "6500000", exp: "6100000" }),
    row({ num: "111", name: "RESOLUTION FOUNDATION", status: "Removed" }),
    row({ num: "222", name: "TWIN TRUST" }),
    row({ num: "333", name: "TWIN TRUST" }),
    row({ num: "444", name: "INSTITUTE OF ECONOMIC AFFAIRS", linked: "5" }),
    row({ num: "555", name: "SOMETHING ELSE" }),
  ];
  const out = matchCharities(lines, wanted);
  it("takes the one live main charity with the exact name and reads its figures", () => {
    expect(out.found.iea).toEqual({ number: 235351, name: "INSTITUTE OF ECONOMIC AFFAIRS", income: 6500000, expenditure: 6100000, yearEnd: "2025-12-31", registered: "1957-03-01", url: "https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/235351" });
  });
  it("leaves out a removed charity, one that is not on the register, and a name two charities share", () => {
    expect(out.found.rf).toBeUndefined();
    expect(out.notFound).toEqual(["rf", "asi"]);
    expect(out.ambiguous).toEqual(["dup"]);
  });
  it("gives no figure when the register leaves one blank", () => {
    const only = matchCharities([header, row({ num: "9", name: "RESOLUTION FOUNDATION" })], [{ key: "rf", name: "Resolution Foundation" }]);
    expect(only.found.rf).toMatchObject({ income: null, expenditure: null });
  });
});
