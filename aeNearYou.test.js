import { describe, expect, it } from "vitest";
import { providerRow, trustsFrom, nationalFrom, monthOf, postcodeOf } from "./aeNearYou.js";

const row = (over) => ({ "Org Code": "RAA", "Parent Org": "NHS ENGLAND LONDON", "Org name": "EXAMPLE HOSPITALS NHS FOUNDATION TRUST", "A&E attendances Type 1": "1000", "A&E attendances Type 2": "0", "A&E attendances Other A&E Department": "500", "A&E attendances Booked Appointments Type 1": "0", "A&E attendances Booked Appointments Type 2": "0", "A&E attendances Booked Appointments Other Department": "0", "Attendances over 4hrs Type 1": "250", "Attendances over 4hrs Type 2": "0", "Attendances over 4hrs Other Department": "50", "Attendances over 4hrs Booked Appointments Type 1": "0", "Attendances over 4hrs Booked Appointments Type 2": "0", "Attendances over 4hrs Booked Appointments Other Department": "0", "Patients who have waited 12+ hrs from DTA to admission": "12", ...over });

describe("providerRow", () => {
  it("tidies names and groups the counts", () => {
    expect(providerRow(row())).toMatchObject({ code: "RAA", name: "Example Hospitals NHS Foundation Trust", region: "London", att1: 1000, over1: 250, attAll: 1500, overAll: 300, w12: 12 });
  });
});

describe("trustsFrom", () => {
  it("keeps only providers with a major A&E and works out four-hour shares", () => {
    const walkIn = row({ "Org Code": "Y1", "A&E attendances Type 1": "0", "Attendances over 4hrs Type 1": "0" });
    const t = trustsFrom([row(), walkIn]);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ code: "RAA", attendances: 1000, within4: 75, allAttendances: 1500, allWithin4: 80, waited12: 12 });
  });
});

describe("nationalFrom", () => {
  it("adds every row, walk-in centres included", () => {
    const n = nationalFrom([row(), row({ "Org Code": "Y1", "A&E attendances Type 1": "0", "Attendances over 4hrs Type 1": "0" })]);
    expect(n.attendances).toBe(1000);
    expect(n.allAttendances).toBe(2000);
  });
});

describe("monthOf and postcodeOf", () => {
  it("reads the month and the address", () => {
    expect(monthOf("MSitAE-OCTOBER-2026")).toBe("October 2026");
    expect(postcodeOf({ Organisation: { GeoLoc: { Location: { PostCode: "NW1 0PE" } } } })).toBe("NW1 0PE");
    expect(postcodeOf({})).toBe("");
  });
});
