import { describe, it, expect } from "vitest";
import { resultRow } from "./schoolResults";

const meta = { ks4: { y: "2025/26", a: 46.2, g5: 46.3, g4: 64.8 }, ks2: { y: "2024/25", e: 63, h: 8 } };

describe("school results lines", () => {
  it("describes a secondary school's GCSE results against England's", () => {
    const row = resultRow({ s4: { y: "2025/26", a: 52.4, g5: 58, g4: 74, pr: 0.31, v: 1 } }, meta);
    expect(row.label).toBe("GCSE results");
    expect(row.small).toBe("2025/26, provisional");
    expect(row.big).toBe("52.4");
    expect(row.text).toContain("above the England average");
    expect(row.extra.map((e) => e.label)).toEqual(["Grade 5 or above in English and maths", "Grade 4 or above in English and maths", "Progress 8"]);
    expect(row.extra[2].text).toContain("+0.31");
  });
  it("says close to the average within a point, and below when it is lower", () => {
    expect(resultRow({ s4: { y: "2025/26", a: 46.8 } }, meta).text).toContain("close to the England average");
    expect(resultRow({ s4: { y: "2025/26", a: 40 } }, meta).text).toContain("below the England average");
  });
  it("describes a primary school's Year 6 results", () => {
    const row = resultRow({ s2: { y: "2024/25", e: 77, h: 10 } }, meta);
    expect(row.big).toBe("77%");
    expect(row.text).toContain("above the England average");
    expect(row.text).toContain("10% reached the higher standard");
  });
  it("does not compare with a different year's England figure", () => {
    expect(resultRow({ s2: { y: "2023/24", e: 70 } }, meta).text).toContain("England was 63% in 2024/25");
  });
  it("gives nothing for a school with no results", () => { expect(resultRow({}, meta)).toBeNull(); });
});
