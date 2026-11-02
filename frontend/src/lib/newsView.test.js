import { describe, it, expect } from "vitest";
import { monogram, caseSpan } from "./newsView";

describe("News regulation helpers", () => {
  it("makes a short mark for each broadcaster", () => {
    expect(["BBC", "ITV", "GB News", "Channel 4", "Sky News"].map(monogram)).toEqual(["BBC", "ITV", "GB", "C4", "SN"]);
  });
  it("reads the month a programme went out and the month it was ruled on", () => {
    expect(caseSpan("July 2023 (ruled December 2023)")).toEqual({ start: 2023 * 12 + 6, end: 2023 * 12 + 11, months: 5 });
    expect(caseSpan("May and June 2023 (ruled March 2024)").months).toBe(10);
    expect(caseSpan("February 2021 (ruled July 2022)").months).toBe(17);
  });
  it("gives up cleanly on words it does not know", () => {
    expect(caseSpan("Spring 2023")).toBeNull();
    expect(caseSpan("March 2024 (ruled January 2024)")).toBeNull();
  });
});
