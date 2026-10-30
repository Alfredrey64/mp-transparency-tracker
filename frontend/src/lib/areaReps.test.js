import { describe, it, expect } from "vitest";
import reps from "../data/representatives.json";
import { policeFor, mayorFor, devolvedFor, holyroodSeatAt, partyHue, NI_CONSTITUENCY_NAMES } from "./areaReps";

describe("the saved representatives", () => {
  it("covers every force a postcode can name, so no one is left without an answer", () => {
    for (const pfa of ["Avon and Somerset", "Bedfordshire", "Cambridgeshire", "Cheshire", "Cleveland", "Cumbria", "Derbyshire", "Devon & Cornwall", "Dorset", "Durham", "Essex", "Gloucestershire", "Hampshire", "Hertfordshire", "Humberside", "Kent", "Lancashire", "Leicestershire", "Lincolnshire", "Merseyside", "Norfolk", "Northamptonshire", "Northumbria", "Nottinghamshire", "Staffordshire", "Suffolk", "Surrey", "Sussex", "Thames Valley", "Warwickshire", "West Mercia", "West Midlands", "Wiltshire", "Dyfed-Powys", "Gwent", "North Wales", "South Wales"]) {
      const p = policeFor({ pfa, country: pfa.includes("Gwent") || /Wales|Dyfed/.test(pfa) ? "Wales" : "England" }, reps);
      expect(p?.person?.name, pfa).toBeTruthy();
      expect(p.kind).toBe("commissioner");
    }
  });
  it("gives the five forces a mayor runs a mayor, not a commissioner", () => {
    for (const pfa of ["Metropolitan Police", "Greater Manchester", "South Yorkshire", "West Yorkshire", "North Yorkshire"]) {
      const p = policeFor({ pfa, country: "England" }, reps);
      expect(p.kind, pfa).toBe("mayor");
      expect(p.person?.name, pfa).toBeTruthy();
    }
  });
  it("has the right size of body for each nation", () => {
    expect(Object.keys(reps.scotland.constituencies)).toHaveLength(73);
    expect(Object.values(reps.scotland.regions).every((l) => l.length === 7)).toBe(true);
    expect(Object.values(reps.senedd).every((l) => l.length === 6)).toBe(true);
    expect(Object.values(reps.ni).every((l) => l.length >= 4 && l.length <= 5)).toBe(true);
  });
  it("maps every Northern Ireland Westminster name that differs to an Assembly constituency that exists", () => {
    for (const name of NI_CONSTITUENCY_NAMES) expect(reps.ni[name], name).toBeTruthy();
  });
});

describe("policeFor", () => {
  it("says who answers for the force in Scotland, Northern Ireland and the City of London", () => {
    expect(policeFor({ pfa: "Scotland", country: "Scotland" }, reps).kind).toBe("scotland");
    expect(policeFor({ pfa: null, country: "Northern Ireland" }, reps).kind).toBe("ni");
    expect(policeFor({ pfa: "City of London", country: "England" }, reps).kind).toBe("city");
    expect(policeFor({ pfa: null, country: "England" }, reps)).toBeNull();
  });
});

describe("mayorFor", () => {
  it("finds the mayor of a London borough and of a combined authority", () => {
    expect(mayorFor({ country: "England", districtCode: "E09000033" }, reps).post).toMatch(/London/);
    expect(mayorFor({ country: "England", districtCode: "E08000003" }, reps).authority).toMatch(/Greater Manchester/);
  });
  it("finds nothing for a council outside any authority, or outside England", () => {
    expect(mayorFor({ country: "England", districtCode: "E06000023" }, reps)).toEqual(expect.objectContaining({ authority: expect.stringMatching(/West of England/) }));
    expect(mayorFor({ country: "England", districtCode: "E07000178" }, reps)).toBeNull();
    expect(mayorFor({ country: "Wales", districtCode: "W06000015" }, reps)).toBeNull();
  });
  it("names an authority that has no mayor yet without inventing one", () => {
    const m = mayorFor({ country: "England", districtCode: Object.entries(reps.councilAuthority).find(([, n]) => n === "Lancashire")[0] }, reps);
    expect(m).toEqual({ authority: "Lancashire", post: null, person: null });
  });
});

describe("devolvedFor", () => {
  it("lists the six members for a Senedd constituency", () => {
    const d = devolvedFor({ country: "Wales", senedd: "Caerdydd Penarth" }, reps);
    expect(d.members).toHaveLength(6);
    expect(d.body).toBe("Senedd");
  });
  it("lists a constituency MSP and the seven regional MSPs", () => {
    const d = devolvedFor({ country: "Scotland", holyroodSeat: "Edinburgh Central" }, reps);
    expect(d.constituencyMember.name).toBeTruthy();
    expect(d.regional).toHaveLength(7);
    expect(d.members).toHaveLength(8);
  });
  it("lists the five MLAs, using the Assembly's name for Belfast South", () => {
    const d = devolvedFor({ country: "Northern Ireland", westminster: "Belfast South and Mid Down" }, reps);
    expect(d.seat).toBe("South Belfast");
    expect(d.members.length).toBeGreaterThanOrEqual(4);
  });
  it("has nothing for England, or for a seat it cannot find", () => {
    expect(devolvedFor({ country: "England" }, reps)).toBeNull();
    expect(devolvedFor({ country: "Scotland", holyroodSeat: null }, reps)).toBeNull();
  });
});

describe("holyroodSeatAt", () => {
  it("reads the constituency name from the map service's answer", async () => {
    const f = async () => ({ ok: true, json: async () => ({ features: [{ attributes: { SPC26NM: "Edinburgh Central" } }] }) });
    expect(await holyroodSeatAt(-3.2, 55.9, f)).toBe("Edinburgh Central");
  });
  it("answers null if the service fails or finds nothing", async () => {
    expect(await holyroodSeatAt(0, 0, async () => ({ ok: false }))).toBeNull();
    expect(await holyroodSeatAt(0, 0, async () => { throw new Error("offline"); })).toBeNull();
    expect(await holyroodSeatAt(0, 0, async () => ({ ok: true, json: async () => ({ features: [] }) }))).toBeNull();
  });
});

describe("partyHue", () => {
  it("colours the main parties and falls back to grey", () => {
    expect(partyHue("Labour (Co-op)")).toBe("#d50000");
    expect(partyHue("Scottish Green Party")).toBe("#4ea72e");
    expect(partyHue("Something else")).toBe("#8a94a6");
  });
});
