import { describe, it, expect } from "vitest";
import { seatRecord, claimantRow, payRow, monthShort } from "./localEconomyView";

const data = {
  claimantMonth: "October 2026", claimantBefore: "October 2025", payYear: "2025",
  england: { r: 4.1, rb: 3.9, p: 39298, pb: 37647 },
  seats: {
    E14001131: { n: "Bristol Central", c: 3000, r: 3.4, rb: 3.1, p: 40000, pb: 38000 },
    E14000001: { n: "Other Seat", c: 10, r: 6, rb: 6, p: null, pb: null },
  },
};

describe("local economy view", () => {
  it("finds a seat by its 2024 code, or by name", () => {
    expect(seatRecord(data, { parliamentary_constituency_2024: "E14001131" }, "x").n).toBe("Bristol Central");
    expect(seatRecord(data, {}, "other seat").n).toBe("Other Seat");
    expect(seatRecord(data, {}, "Nowhere")).toBeNull();
  });
  it("describes the claimant share against England and the year before", () => {
    const r = claimantRow(data.seats.E14001131, data);
    expect(r).toMatchObject({ rate: 3.4, count: 3000, nat: 4.1, change: 0.3, move: "up", vs: "below", month: "October 2026" });
    expect(claimantRow(data.seats.E14000001, data)).toMatchObject({ move: "unchanged", vs: "above" });
    expect(claimantRow({ r: null }, data)).toBeNull();
  });
  it("describes pay against England and the change over the year", () => {
    expect(payRow(data.seats.E14001131, data)).toMatchObject({ pay: 40000, change: 5.3, vs: "close to", year: "2025" });
    expect(payRow({ p: 45000, pb: 44000 }, data).vs).toBe("above");
    expect(payRow({ p: 33000, pb: null }, data)).toMatchObject({ vs: "below", change: null });
    expect(payRow(data.seats.E14000001, data)).toBeNull();
  });
  it("shortens a month label", () => { expect(monthShort("October 2026")).toBe("Oct 2026"); });
});
