import { describe, it, expect } from "vitest";
import { csvCell, toCsv, csvFilename } from "./csv";

describe("csvCell", () => {
  it("leaves plain values alone and turns null into an empty field", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(0)).toBe("0");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(true)).toBe("true");
  });
  it("quotes fields containing commas, quotes or line breaks, doubling inner quotes", () => {
    expect(csvCell("a, b")).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });
  it("defuses text a spreadsheet would run as a formula, but not real numbers", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell("+44 20 7219 3000")).toBe("'+44 20 7219 3000");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("-5 steps")).toBe("'-5 steps");
    expect(csvCell(-5)).toBe("-5");
  });
  it("writes dates as ISO days and drops non-finite numbers", () => {
    expect(csvCell(new Date("2026-09-15T10:00:00Z"))).toBe("2026-09-15");
    expect(csvCell(NaN)).toBe("");
    expect(csvCell(new Date("nope"))).toBe("");
  });
});

describe("toCsv", () => {
  it("writes a header, then one CRLF-terminated line per row, using keys or functions", () => {
    const csv = toCsv(
      [{ name: "Ann", n: 2 }, { name: "Bob, Jr", n: null }],
      [{ header: "Name", key: "name" }, { header: "Double", value: (r) => (r.n == null ? null : r.n * 2) }]
    );
    expect(csv).toBe('Name,Double\r\nAnn,4\r\n"Bob, Jr",\r\n');
  });
  it("writes just a header for no rows", () => {
    expect(toCsv([], [{ header: "A", key: "a" }])).toBe("A\r\n");
  });
});

describe("csvFilename", () => {
  it("makes a safe, dated filename", () => {
    expect(csvFilename("Sir Edward Leigh — interests", new Date("2026-10-02T00:00:00Z"))).toBe("sir-edward-leigh-interests-2026-10-02.csv");
    expect(csvFilename("***", new Date("2026-10-02T00:00:00Z"))).toBe("data-2026-10-02.csv");
  });
});
