import { describe, it, expect } from "vitest";
import { purposeFromLongTitle, summariseBill, billSearchUrl } from "./billSummary";

describe("purposeFromLongTitle", () => {
  it("turns the official wording into a plain 'Aims to…' sentence and drops the boilerplate", () => {
    expect(purposeFromLongTitle("A Bill to make provision about health and social care.")).toBe("Aims to make provision about health and social care.");
    expect(purposeFromLongTitle("A Bill to Make provision about immigration, asylum and modern slavery; and for connected purposes.")).toBe("Aims to make provision about immigration, asylum and modern slavery.");
    expect(purposeFromLongTitle("Make provision extending the right to vote to 16 and 17 year olds")).toBe("Aims to make provision extending the right to vote to 16 and 17 year olds.");
  });
  it("trims very long lists at a natural break, with an ellipsis", () => {
    const long = "A Bill to continue the Armed Forces Act 2006; to amend that Act and other enactments relating to the armed forces; to make provision about service justice, discipline, welfare and housing, accommodation, complaints and many other matters of detail for serving personnel and their families";
    const out = purposeFromLongTitle(long);
    expect(out.length).toBeLessThanOrEqual(215);
    expect(out.endsWith("…")).toBe(true);
    expect(out.startsWith("Aims to continue the Armed Forces Act 2006")).toBe(true);
  });
  it("returns null for nothing", () => {
    expect(purposeFromLongTitle("")).toBeNull();
    expect(purposeFromLongTitle(null)).toBeNull();
  });
});

describe("summariseBill", () => {
  const bill = { short_title: "Imaginary Bill", long_title: "A Bill to do a thing; and for connected purposes.", current_stage: "2nd reading", current_house: "Lords", sponsoring_department: "Home Office", source_url: "https://bills.parliament.uk/bills/1" };
  it("combines the purpose with where the bill is and who brought it", () => {
    const s = summariseBill(bill);
    expect(s.summary).toBe("Aims to do a thing.");
    expect(s.context).toBe("Now at 2nd reading in the Lords, brought by Home Office.");
    expect(s.handWritten).toBe(false);
  });
  it("prefers a hand-written description when one exists", () => {
    const s = summariseBill({ ...bill, short_title: "Health Bill" });
    expect(s.handWritten).toBe(true);
    expect(s.summary).toMatch(/NHS/);
  });
  it("says so when a bill has become law or was defeated", () => {
    expect(summariseBill({ ...bill, is_act: true }).context).toMatch(/^Became law/);
    expect(summariseBill({ ...bill, is_defeated: true }).context).toMatch(/^Defeated/);
  });
  it("handles a missing bill and builds a search link", () => {
    expect(summariseBill(null)).toBeNull();
    expect(billSearchUrl("Social Housing Bill")).toBe("https://bills.parliament.uk/?SearchTerm=Social%20Housing%20Bill");
  });
});
