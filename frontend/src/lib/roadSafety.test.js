import { describe, it, expect } from "vitest";
import { roadView } from "./roadSafety.js";

const data = {
  years: [2024, 2025], latest: 2025,
  areas: { E1: { by: { 2024: [1, 4, 20], 2025: [2, 5.6, 18.4] }, now: { walking: 3, cycling: 0, motorbike: 4, vehicle: 1, other: 0 } } },
  gb: { by: { 2024: [1600, 26000, 100000], 2025: [1538, 27754, 98554] } },
};

describe("roadView", () => {
  const v = roadView(data, "E1");
  it("turns each year into killed, serious, slight, killed-or-seriously-injured and total", () => {
    expect(v.years[1]).toEqual({ year: 2025, killed: 2, serious: 6, slight: 18, ksi: 8, total: 26 });
    expect(v.latest.year).toBe(2025);
    expect(v.fiveYearKilled).toBe(3);
  });
  it("lists road users with any casualties, most first", () => {
    expect(v.users.map((u) => u.key)).toEqual(["motorbike", "walking", "vehicle"]);
    expect(v.usersTotal).toBe(8);
  });
  it("gives the national figure for scale", () => { expect(v.gbKsi).toBe(29292); expect(v.gbKilled).toBe(1538); });
  it("is null where the council is not in the table", () => { expect(roadView(data, "N09000001")).toBeNull(); expect(roadView(null, "E1")).toBeNull(); });
});
