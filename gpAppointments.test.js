import { describe, it, expect } from "vitest";
import { monthKey, bandIndex, splitLine, shortName, addCsv, build, shares, candidatePages, regionalZip, BANDS } from "./gpAppointments.js";

const HEAD = "SUB_ICB_LOCATION_CODE,SUB_ICB_LOCATION_ONS_CODE,SUB_ICB_LOCATION_NAME,ICB_ONS_CODE,ICB_NAME,REGION_ONS_CODE,REGION_NAME,APPOINTMENT_MONTH,APPT_STATUS,HCP_TYPE,APPT_MODE,TIME_BETWEEN_BOOK_AND_APPT,COUNT_OF_APPOINTMENTS";
const row = (status, month, band, n, mode = "Face-to-Face", staff = "GP", code = "E54000001", name = '"NHS Bath and North East Somerset, Swindon and Wiltshire Integrated Care Board"') => `92G,E38,NHS X ICB - 92G,${code},${name},E40,South West,${month},${status},${staff},${mode},${band},${n}`;

describe("small readers", () => {
  it("reads months, bands and quoted fields", () => {
    expect(monthKey("SEP2026")).toBe("2026-09");
    expect(monthKey("nonsense")).toBeNull();
    expect(bandIndex("15  to 21 Days")).toBe(4);
    expect(bandIndex("1 Day")).toBe(1);
    expect(bandIndex("Same Day")).toBe(0);
    expect(bandIndex("More than 28 Days")).toBe(6);
    expect(bandIndex("Unknown / Data Quality")).toBe(-1);
    expect(splitLine('a,"b, c",d')).toEqual(["a", "b, c", "d"]);
    expect(shortName("NHS Bath and North East Somerset, Swindon and Wiltshire Integrated Care Board")).toBe("Bath and North East Somerset, Swindon and Wiltshire");
  });
});

describe("addCsv and build", () => {
  const text = [HEAD,
    row("Attended", "SEP2026", "Same Day", 400), row("Attended", "SEP2026", "2 to 7 Days", 300, "Telephone"), row("Attended", "SEP2026", "More than 28 Days", 100), row("Attended", "SEP2026", "Unknown / Data Quality", 50),
    row("DNA", "SEP2026", "Same Day", 25), row("Unknown", "SEP2026", "Same Day", 9),
    row("Attended", "SEP2025", "Same Day", 200), row("Attended", "SEP2025", "15  to 21 Days", 200),
  ].join("\n");
  const acc = new Map();
  it("counts rows and keeps attended and missed apart, with unknown bands out of the waits", () => {
    expect(addCsv(acc, text)).toBe(8);
    const t = acc.get("E54000001").months.get("2026-09");
    expect(t.attended).toBe(850);
    expect(t.dna).toBe(25);
    expect(t.bands.reduce((a, b) => a + b, 0)).toBe(800);
  });
  it("works out shares over appointments with a known wait", () => {
    const s = shares(acc.get("E54000001").months.get("2026-09"));
    expect(s.sameDay).toBe(50);
    expect(s.within2w).toBe(87.5);
    expect(s.over28).toBe(12.5);
    expect(s.dna).toBe(2.9);
  });
  it("builds England and each board with the same month a year earlier", () => {
    const d = build(acc);
    expect(d.latest).toBe("2026-09");
    expect(d.months).toEqual(["2025-09", "2026-09"]);
    expect(d.icbs).toHaveLength(1);
    expect(d.icbs[0].name).toBe("Bath and North East Somerset, Swindon and Wiltshire");
    expect(d.icbs[0].yearAgo.within2w).toBe(50);
    expect(d.england.series).toEqual([50, 87.5]);
    expect(d.england.mode["Telephone"]).toBeCloseTo(35.3, 1);
    expect(d.bands).toEqual(BANDS);
  });
  it("refuses a file without the columns it needs", () => {
    expect(() => addCsv(new Map(), "A,B\n1,2")).toThrow(/ICB_ONS_CODE/);
  });
});

describe("finding the newest edition", () => {
  it("lists this month and the four before it, newest first", () => {
    const c = candidatePages(new Date("2026-11-23T10:00:00Z"));
    expect(c.map((x) => x.key)).toEqual(["2026-11", "2026-10", "2026-09", "2026-08", "2026-07"]);
    expect(c[1].url).toBe("https://digital.nhs.uk/data-and-information/publications/statistical/appointments-in-general-practice/october-2026");
    expect(candidatePages(new Date("2027-01-05T00:00:00Z"))[1].key).toBe("2026-12");
  });
  it("finds the regional zip on a page", () => {
    const html = '<a href="https://files.digital.nhs.uk/78/A36867/Appointments_GP_Regional_CSV_Sep_26.zip">x</a><a href="https://files.digital.nhs.uk/x/Appointments_GP_Daily_CSV_Sep_26.zip">y</a>';
    expect(regionalZip(html)).toBe("https://files.digital.nhs.uk/78/A36867/Appointments_GP_Regional_CSV_Sep_26.zip");
    expect(regionalZip("<html></html>")).toBeNull();
  });
});
