import { describe, it, expect } from "vitest";
import { seriesCsv, placesCsv } from "./onsDownload";

describe("downloads", () => {
  it("writes one row per point", () => {
    const text = seriesCsv({ title: "CPI", source: "ONS", unit: "%", points: [["2025-01", 1.5], ["2025-02", 2]] });
    expect(text.trim().split("\r\n")).toEqual(["series,period,value,unit,source", "CPI,2025-01,1.5,%,ONS", "CPI,2025-02,2,%,ONS"]);
  });

  it("quotes text that needs it", () => {
    const text = seriesCsv({ title: "Pay, weekly", source: 'The "ONS"', unit: "£", points: [["2000", 1]] });
    expect(text.split("\r\n")[1]).toBe('"Pay, weekly",2000,1,£,"The ""ONS"""');
  });

  it("adds the adjusted column when given", () => {
    const text = seriesCsv({ title: "Pay", source: "ONS", unit: "£", points: [["2000-01", 10]], adjusted: [["2000-01", 20]] });
    const [head, row] = text.split("\r\n");
    expect(head).toBe("series,period,value,value_in_todays_prices,unit,source");
    expect(row).toBe("Pay,2000-01,10,20,£,ONS");
  });

  it("lines places up by period and leaves gaps empty", () => {
    const text = placesCsv({ places: [{ name: "A", points: [["2000", 1], ["2001", 2]] }, { name: "B", points: [["2001", 5]] }], source: "S", unit: "u" });
    expect(text.trim().split("\r\n")).toEqual(["period,A,B,unit,source", "2000,1,,u,S", "2001,2,5,u,S"]);
  });
});
