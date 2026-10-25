import { describe, expect, it } from "vitest";
import { nameWords, sameMp, partyFamily, partyChange, DETAILS } from "./partyChange";
import data from "../data/constituencies.json";

const seat = (winner, wp, mp, mpParty, memberId = 1) => ({ mp: { name: mp, party: mpParty, memberId }, result: { title: "2024 General Election", candidates: [{ name: winner, party: wp }] } });

describe("party changes", () => {
  it("reads names the way the two records spell them", () => {
    expect(nameWords("Abdi-Wali, Sagal")).toEqual(["sagal", "abdi", "wali"]);
    expect(nameWords("Ms Sagal Abdi-Wali")).toEqual(["sagal", "abdi", "wali"]);
    expect(sameMp("Abdi-Wali, Sagal", "Sagal Abdi-Wali")).toBe(true);
    expect(sameMp("Joshua Robert Abraham Dean", "Josh Dean")).toBe(true);
    expect(sameMp("Tan Dhesi", "Mr Tanmanjeet Singh Dhesi")).toBe(true);
    expect(sameMp("Louise Jones", "Louise Sandher-Jones")).toBe(true);
    expect(sameMp("Emma Lewell-Buck", "Emma Lewell")).toBe(true);
    expect(sameMp("Karl Turner", "Kieran Turner")).toBe(false);
    expect(sameMp("Nus Ghani", "Ms Nusrat Ghani")).toBe(true);
    expect(sameMp("Karl Turner", "Karl Smith")).toBe(false);
  });
  it("treats Labour (Co-op) as Labour and the Speaker as an independent", () => {
    expect(partyFamily("Labour (Co-op)")).toBe("labour");
    expect(partyFamily("Speaker")).toBe(partyFamily("Independent"));
    expect(partyFamily("Reform UK")).not.toBe(partyFamily("Conservative"));
  });
  it("notes an MP who sits for a different party from the one they were elected for", () => {
    const c = partyChange(seat("Karl Turner", "Labour", "Karl Turner", "Independent", 4030));
    expect(c.text).toBe("Karl Turner was elected for Labour at the 2024 general election and now sits as an Independent.");
    expect(c.detail).toMatch(/31 March 2026/);
    expect(partyChange(seat("Suella Braverman", "Conservative", "Suella Braverman", "Reform UK", 4475)).text).toBe("Suella Braverman was elected for Conservative at the 2024 general election and now sits for Reform UK.");
    expect(partyChange(seat("Jeremy Corbyn", "Independent", "Jeremy Corbyn", "Your Party")).text).toContain("elected as an Independent");
  });
  it("makes no note when the party is the same, or the seat has a new MP", () => {
    expect(partyChange(seat("Jack Abbott", "Labour", "Jack Abbott", "Labour (Co-op)"))).toBeNull();
    expect(partyChange(seat("Lindsay Hoyle", "Independent", "Sir Lindsay Hoyle", "Speaker"))).toBeNull();
    expect(partyChange(seat("Someone Else", "Labour", "Karl Turner", "Independent"))).toBeNull();
    expect(partyChange({ mp: null, result: null })).toBeNull();
  });
  it("finds the MPs in the data who have changed, and only real changes", () => {
    const found = Object.values(data.constituencies).map((s) => partyChange(s)).filter(Boolean);
    const names = found.map((c) => c.name);
    for (const n of ["Suella Braverman", "Robert Jenrick", "Danny Kruger", "Andrew Rosindell", "Rupert Lowe", "Rosie Duffield", "Zarah Sultana"]) expect(names, n).toContain(n);
    expect(names).not.toContain("Lindsay Hoyle");
    expect(names).not.toContain("Jack Abbott");
    expect(found.length).toBeGreaterThan(8);
    expect(found.length).toBeLessThan(40);
    for (const c of found) expect(c.text.length).toBeGreaterThan(40);
  });
  it("only has accounts for MPs who really have changed party", () => {
    const ids = new Set(Object.values(data.constituencies).filter((s) => partyChange(s)).map((s) => String(s.mp.memberId)));
    // Karl Turner (4030) sits as a Labour MP again, so his account is kept for the record but no longer shows.
    for (const id of Object.keys(DETAILS)) if (id !== "4030") expect(ids.has(id), id).toBe(true);
  });
});
