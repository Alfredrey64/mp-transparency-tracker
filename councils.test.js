import { describe, it, expect } from "vitest";
import { parseCsv, controlLabel, buildCouncils, shardOf, SHARDS, controlOfRow } from "./councils.js";

describe("parseCsv", () => {
  it("reads quoted fields, commas inside quotes, doubled quotes and a byte-order mark", () => {
    const rows = parseCsv('﻿a,b,c\r\n"x, y","say ""hi""",z\n1,2,3\n');
    expect(rows).toEqual([["a", "b", "c"], ["x, y", 'say "hi"', "z"], ["1", "2", "3"]]);
  });
  it("copes with empty input and a missing final newline", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("shardOf", () => {
  it("always gives the same file for a council, within range", () => {
    expect(shardOf("E09000012")).toBe(shardOf("E09000012"));
    for (const id of ["E09000012", "S12000033", "N09000001", "E10000003"]) {
      expect(shardOf(id)).toBeGreaterThanOrEqual(0);
      expect(shardOf(id)).toBeLessThan(SHARDS);
    }
  });
});

describe("controlLabel", () => {
  it("turns the dataset's short codes into words", () => {
    expect(controlLabel("LAB")).toBe("Labour majority");
    expect(controlLabel("CON min")).toBe("Conservative minority");
    expect(controlLabel("LD/GRN")).toBe("Liberal Democrat, Green (partnership)");
    expect(controlLabel("LD/GRN/IND min")).toBe("Liberal Democrat, Green, Independent (partnership, minority)");
    expect(controlLabel("LAB Mayor")).toBe("Labour elected mayor");
    expect(controlLabel("Lab plurality")).toBe("Lab largest party");
    expect(controlLabel("NULL")).toBe("No overall control");
    expect(controlLabel("NOC")).toBe("No overall control");
    expect(controlLabel(undefined)).toBe("No overall control");
  });
});

describe("buildCouncils", () => {
  const councillorsCsv = [
    'Council,"Ward Name","Councillor Name","Next Election","Party Name","Electoral Commission Party Code"',
    'Adur,Hillside,"Ann Smith",2027-05-06,"Labour Party",PP53',
    'Adur,Hillside,"Bob Jones",2027-05-06,"Labour Party",PP53',
    'Adur,Marine,"Cy Brown",2027-05-06,"Reform UK",PP7931',
    'Adur,Marine,"Di White",2027-05-06,"Independent / Other",',
    'Bexley,Cray,"Ed Grey",2030-05-02,"Conservative and Unionist",PP52',
  ].join("\n");
  const historyCsv = [
    "id,council id,authority,year,total,con,lab,ld,green,ukip,ref,pc,snp,other,majority,",
    "1,165,Adur,2025,4,0,2,0,0,0,1,0,0,1,LAB,E07000223",
    "2,165,Adur,2026,4,0,2,0,0,0,1,0,0,1,LAB min,E07000223",
    "3,10,Bexley,2026,1,1,0,0,0,0,0,0,0,0,CON,E09000004",
  ].join("\n");
  const out = buildCouncils({ councillorsCsv, historyCsv, now: new Date("2026-10-01") });

  it("lists every council with its seats by party, who runs it and when it next votes", () => {
    expect(out.index.map((c) => [c.id, c.name, c.total])).toEqual([["E07000223", "Adur", 4], ["E09000004", "Bexley", 1]]);
    const adur = out.index[0];
    expect(adur.control).toBe("Labour minority");
    expect(adur.next).toEqual([["2027-05-06", 4]]);
    const seats = Object.fromEntries(adur.seats.map(([p, n]) => [out.parties[p].short, n]));
    expect(seats).toEqual({ Labour: 2, "Reform UK": 1, "Independent or other": 1 });
  });
  it("keeps a party's short name and colour", () => {
    const labour = out.parties.find((p) => p.short === "Labour");
    expect(labour).toMatchObject({ name: "Labour Party", colour: "#d50000", code: "PP53" });
  });
  it("keeps each council's wards, councillors and party history, oldest first", () => {
    const d = out.detail.E07000223;
    expect(d.wards.map(([w]) => w)).toEqual(["Hillside", "Marine"]);
    expect(d.wards[0][1].map(([n]) => n)).toEqual(["Ann Smith", "Bob Jones"]);
    expect(d.history.map((r) => r[0])).toEqual([2025, 2026]);
    expect(d.history[1]).toEqual([2026, 4, 0, 2, 0, 0, 0, 1, 0, 0, 1]);
    expect(out.historyColumns[0]).toBe("year");
  });
});

describe("control, changes of hands and defections", () => {
  it("works out control from seats alone", () => {
    expect(controlOfRow({ total: 10, con: 6, lab: 4 })).toBe("con");
    expect(controlOfRow({ total: 10, con: 5, lab: 5 })).toBe("noc");
    expect(controlOfRow({ total: 10, other: 6 })).toBe("other");
    expect(controlOfRow({ total: 0 })).toBe("noc");
  });

  const header = 'Council,"Ward Name","Councillor Name","Next Election","Party Name","Electoral Commission Party Code"';
  const councillorsCsv = [
    header,
    'Adur,A,"Ann",2027-05-06,"Reform UK",PP7931',
    'Adur,A,"Bob",2027-05-06,"Reform UK",PP7931',
    'Adur,B,"Cy",2027-05-06,"Labour Party",PP53',
    'Bexley,C,"Di",2030-05-02,"Labour Party",PP53',
  ].join("\n");
  const previousCsv = [
    header,
    'Adur,A,"Ann",2027-05-06,"Conservative and Unionist",PP52',
    'Adur,A,"Bob",2027-05-06,"Reform UK",PP7931',
    'Adur,B,"Cy",2027-05-06,"Labour Party",PP53',
    'Bexley,C,"Di",2030-05-02,"Labour Party",PP53',
    'Bexley,C,"Gone",2030-05-02,"Labour Party",PP53',
  ].join("\n");
  const historyCsv = [
    "id,council id,authority,year,total,con,lab,ld,green,ukip,ref,pc,snp,other,majority,",
    "1,1,Adur,2025,3,2,1,0,0,0,0,0,0,0,CON,E07000223",
    "2,1,Adur,2026,3,0,1,0,0,0,2,0,0,0,REF,E07000223",
    "3,2,Bexley,2025,2,0,2,0,0,0,0,0,0,0,LAB,E09000004",
    "4,2,Bexley,2026,2,0,2,0,0,0,0,0,0,0,LAB,E09000004",
    "5,3,Abolished,2025,5,5,0,0,0,0,0,0,0,0,CON,E07000999",
  ].join("\n");
  const out = buildCouncils({ councillorsCsv, historyCsv, previousCsv, previousYear: 2025, now: new Date("2026-10-01") });

  it("finds the councils whose control changed, counting only councils that exist today", () => {
    expect(out.latestYear).toBe(2026);
    expect(out.changes).toEqual([{ id: "E07000223", name: "Adur", from: "con", to: "ref" }]);
    expect(out.changesByYear).toEqual([{ year: 2026, count: 1 }]);
    expect(out.trend).toEqual([{ year: 2025, con: 1, lab: 1 }, { year: 2026, ref: 1, lab: 1 }]);
    expect(out.index[0].control_by_seats).toBe("ref");
  });
  it("finds councillors who changed party, with the flows between parties", () => {
    expect(out.defections.since).toBe(2025);
    expect(out.defections.total).toBe(1);
    const name = (i) => out.parties[i].short;
    expect(out.defections.flows.map((f) => [name(f.from), name(f.to), f.count])).toEqual([["Conservative", "Reform UK", 1]]);
    expect(out.defections.byCouncil).toEqual([{ name: "Adur", count: 1 }]);
    expect(out.detail.E07000223.moved).toHaveLength(1);
    expect(out.detail.E07000223.moved[0].slice(0, 2)).toEqual(["A", "Ann"]);
    expect(out.detail.E09000004.moved).toEqual([]);
  });
  it("copes with no previous list", () => {
    expect(buildCouncils({ councillorsCsv, historyCsv }).defections).toBeNull();
  });
});
